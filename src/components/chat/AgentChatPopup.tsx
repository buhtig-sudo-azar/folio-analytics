'use client';

import { useChatStore } from '@/lib/analytics/chat-store';
import { useModelStore } from '@/lib/analytics/model-store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { ApiTokenInput } from './ApiTokenInput';
import { X, Minimize2, Maximize2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useEffect, useCallback, useState } from 'react';
import { SYSTEM_PROMPT } from '@/lib/analytics/chat-prompt';
import { ANALYTICS_AGENT, SUGGESTIONS } from '@/lib/analytics/agent-data';

export function AgentChatPopup() {
  const { messages, isLoading, isOpen, isExpanded, setOpen, setExpanded, clearMessages } = useChatStore();
  const { currentModel, apiToken, _hydrated, _hydrate, markModelRateLimited } = useModelStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const agent = ANALYTICS_AGENT;

  // Hydrate model store from localStorage on first render
  useEffect(() => {
    if (!_hydrated) _hydrate();
  }, [_hydrated, _hydrate]);

  // Автопрокрутка при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setIsMinimized(false);
    setExpanded(false);
    clearMessages();
  }, [setOpen, setExpanded, clearMessages]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded, setExpanded]);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setIsMinimized(false);
  }, [setOpen]);

  // Stream helper shared by hint buttons
  const streamChat = useCallback(async (userMessage: string) => {
    const chatStore = useChatStore.getState();
    const modelStore = useModelStore.getState();
    chatStore.addMessage({ role: 'user', content: userMessage });
    chatStore.setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          systemPrompt: SYSTEM_PROMPT,
          model: modelStore.currentModel,
          apiToken: modelStore.apiToken || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        chatStore.addMessage({ role: 'assistant', content: `⚠️ ${errData.error || 'Ошибка. Попробуйте ещё раз.'}` });
        chatStore.setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

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
            // model_info event
            if (parsed.type === 'model_info' && parsed.exhausted?.length) {
              for (const m of parsed.exhausted) {
                modelStore.markModelRateLimited(m, 'rate_limited');
              }
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { full += content; chatStore.appendToLastMessage(content); }
          } catch {}
        }
      }
      if (!full) chatStore.appendToLastMessage('Не удалось получить ответ.');
    } catch {
      chatStore.addMessage({ role: 'assistant', content: '⚠️ Ошибка сети.' });
    } finally {
      chatStore.setLoading(false);
    }
  }, []);

  // === Кнопка FAB (чат закрыт) ===
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 group focus:outline-none"
      >
        {/* Pulse ring */}
        <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 opacity-30 animate-pulse-ring" />
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 opacity-40 group-hover:opacity-70 blur-sm transition-opacity" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-500/25 text-white transition-transform group-hover:scale-105">
          <BarChart3 className="h-6 w-6" />
        </span>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background text-[9px] text-white font-bold flex items-center justify-center">
          ?
        </span>
      </button>
    );
  }

  // === Минимизированная версия — маленький аватар ===
  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-6 right-6 z-50 group focus:outline-none"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 opacity-40 group-hover:opacity-70 blur-sm transition-opacity" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg text-white">
          <BarChart3 className="h-6 w-6" />
        </span>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  // === Полное окно чата ===
  return (
    <div
      className={`
        fixed z-50 flex flex-col
        bg-card border border-border shadow-2xl rounded-2xl overflow-hidden
        transition-all duration-300 ease-in-out
        ${isExpanded
          ? 'sm:bottom-4 sm:right-4 sm:w-[calc(100vw-3rem)] sm:max-h-[calc(100vh-3rem)] sm:rounded-3xl'
          : 'sm:bottom-6 sm:right-6 sm:w-[420px] sm:max-h-[600px]'
        }
        max-sm:inset-x-3 max-sm:bottom-6 max-sm:top-auto max-sm:max-h-[75vh]
        animate-in slide-in-from-bottom-4 fade-in duration-200
      `}
    >
      {/* Заголовок */}
      <div className="relative flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className={`absolute inset-0 bg-gradient-to-r ${agent.gradient} opacity-[0.08]`} />
        <div className="relative flex items-center gap-3 w-full">
          <div className={`w-10 h-10 rounded-full ${agent.iconBg} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">{agent.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ModelSelector />
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={handleToggleExpand}
              aria-label={isExpanded ? 'Сузить чат' : 'Расширить чат'}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={handleMinimize}
              aria-label="Свернуть чат"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={handleClose}
              aria-label="Закрыть чат"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className={`w-20 h-20 rounded-full ${agent.iconBg} flex items-center justify-center text-white shadow-lg mb-4`}>
              <BarChart3 className="h-9 w-9" />
            </div>
            <p className="text-base font-bold text-foreground mb-1">{agent.name}</p>
            <p className="text-xs text-muted-foreground mb-4">{agent.role}</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
              {agent.greeting}
            </p>
            {/* Подсказки */}
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((hint) => (
                <button
                  key={hint}
                  onClick={() => streamChat(hint)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className={`w-8 h-8 rounded-full ${agent.iconBg} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="animate-pulse">Думаю</span>
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API-токен + Поле ввода */}
      <div className="border-t border-border">
        <div className="px-3 py-1.5 flex items-center">
          <ApiTokenInput />
        </div>
        <ChatInput />
      </div>
    </div>
  );
}
