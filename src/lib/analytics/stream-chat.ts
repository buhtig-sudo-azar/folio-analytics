import { useChatStore } from '@/lib/analytics/chat-store';
import { useModelStore } from '@/lib/analytics/model-store';
import { SYSTEM_PROMPT } from '@/lib/analytics/chat-prompt';

/**
 * Shared streaming chat utility.
 * Sends a message to /api/chat, handles SSE streaming,
 * model_info events, and rate-limit marking.
 */
export async function streamChat(userMessage: string, fullHistory = false): Promise<void> {
  const chatStore = useChatStore.getState();
  const modelStore = useModelStore.getState();

  chatStore.addMessage({ role: 'user', content: userMessage });
  chatStore.setLoading(true);

  try {
    // Build messages payload
    const chatMessages = fullHistory
      ? [...chatStore.messages, { role: 'user' as const, content: userMessage }].map(m => ({
          role: m.role,
          content: m.content,
        }))
      : [{ role: 'user' as const, content: userMessage }];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatMessages,
        systemPrompt: SYSTEM_PROMPT,
        model: modelStore.currentModel,
        apiToken: modelStore.apiToken || undefined,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      chatStore.addMessage({
        role: 'assistant',
        content: `⚠️ ${errData.error || 'Ошибка. Попробуйте ещё раз.'}`,
      });
      chatStore.setLoading(false);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) {
      chatStore.addMessage({ role: 'assistant', content: '⚠️ Нет потока данных.' });
      chatStore.setLoading(false);
      return;
    }

    chatStore.addMessage({ role: 'assistant', content: '' });
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);

          // Handle model_info custom event
          if (parsed.type === 'model_info' && parsed.exhausted?.length) {
            for (const m of parsed.exhausted) {
              modelStore.markModelRateLimited(m, 'rate_limited');
            }
          }

          // Handle normal SSE content
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            full += content;
            chatStore.appendToLastMessage(content);
          }
        } catch {
          // skip non-JSON or partial chunks
        }
      }
    }

    if (!full) {
      chatStore.appendToLastMessage('Не удалось получить ответ. Попробуйте ещё раз.');
    }
  } catch {
    chatStore.addMessage({ role: 'assistant', content: '⚠️ Ошибка сети. Проверьте подключение.' });
  } finally {
    chatStore.setLoading(false);
  }
}
