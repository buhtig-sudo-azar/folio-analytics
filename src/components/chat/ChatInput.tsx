'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/lib/analytics/chat-store';
import { useModelStore } from '@/lib/analytics/model-store';
import { SYSTEM_PROMPT } from '@/lib/analytics/chat-prompt';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { addMessage, appendToLastMessage, setLoading, isLoading, messages } = useChatStore();
  const { currentModel, apiToken, markModelRateLimited } = useModelStore();

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    addMessage({ role: 'user', content: text });
    setLoading(true);

    try {
      const chatMessages = [...messages, { role: 'user' as const, content: text }].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          systemPrompt: SYSTEM_PROMPT,
          model: currentModel,
          apiToken: apiToken || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || 'Ошибка при обращении к AI. Попробуйте ещё раз.';
        addMessage({ role: 'assistant', content: `⚠️ ${errMsg}` });
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        addMessage({ role: 'assistant', content: 'Ошибка: нет потока данных.' });
        setLoading(false);
        return;
      }

      // Add empty assistant message (will get streaming-cursor via isStreaming)
      addMessage({ role: 'assistant', content: '' });

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // Handle model_info custom event
            if (parsed.type === 'model_info' && parsed.exhausted?.length) {
              for (const m of parsed.exhausted) {
                markModelRateLimited(m, 'rate_limited');
              }
            }

            // Handle normal SSE content
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              appendToLastMessage(content);
            }
          } catch {
            // skip non-JSON or partial
          }
        }
      }

      if (!fullContent) {
        appendToLastMessage('Не удалось получить ответ. Попробуйте ещё раз.');
      }
    } catch {
      addMessage({ role: 'assistant', content: 'Произошла ошибка сети. Проверьте подключение.' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 border-t border-border">
      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спросите про аналитику..."
          className="min-h-[38px] max-h-24 resize-none text-sm"
          rows={1}
          disabled={isLoading}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="shrink-0 bg-gradient-to-br from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-sm"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
