'use client';

import { useChatStore } from '@/lib/analytics/chat-store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { X, Minimize2, Maximize2, Bot, Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useEffect, useCallback, useState } from 'react';

export function AgentChatPopup() {
  const { messages, isLoading, isOpen, isExpanded, setOpen, setExpanded, clearMessages } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

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

  // Кнопка FAB (когда чат закрыт)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 group focus:outline-none"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 opacity-40 group-hover:opacity-70 blur-sm transition-opacity" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-500/20 text-white transition-transform group-hover:scale-105">
          <Bot className="h-6 w-6" />
        </span>
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>
    );
  }

  // Минимизированная версия — маленький аватар
  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-6 right-6 z-50 group focus:outline-none"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 opacity-40 group-hover:opacity-70 blur-sm transition-opacity" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg text-white">
          <Bot className="h-6 w-6" />
        </span>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
            {messages.length}
          </span>
        )}
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
      </button>
    );
  }

  // Полное окно чата
  return (
    <div
      className={`
        fixed z-50 flex flex-col
        bg-background border border-border shadow-2xl rounded-2xl overflow-hidden
        transition-all duration-300 ease-in-out
        ${isExpanded
          ? 'sm:bottom-6 sm:right-6 sm:w-[720px] sm:max-h-[80vh]'
          : 'sm:bottom-6 sm:right-6 sm:w-[400px] sm:max-h-[560px]'
        }
        max-sm:inset-x-3 max-sm:bottom-6 max-sm:top-auto max-sm:max-h-[75vh]
        animate-in slide-in-from-bottom-4 fade-in duration-200
      `}
    >
      {/* Заголовок */}
      <div className="relative flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 opacity-[0.08]" />
        <div className="relative flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">Аналитик</h3>
            <p className="text-xs text-muted-foreground">AI-эксперт по веб-аналитике</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
        className="flex-1 overflow-y-auto p-3 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-md mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-sm font-semibold">Аналитик</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
              Привет! Я твой AI-эксперт по веб-аналитике. Спрашивай про метрики, трафик, устройства, конверсии — или как настроить трекер на сайте.
            </p>
            {/* Подсказки */}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {[
                'Как работает трекер?',
                'Что такое bounce rate?',
                'Как улучшить конверсию?',
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => {
                    const store = useChatStore.getState();
                    store.addMessage({ role: 'user', content: hint });
                    store.setLoading(true);
                    // Trigger the same flow as ChatInput
                    fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        messages: [{ role: 'user', content: hint }],
                        systemPrompt: `Ты — AI-эксперт по веб-аналитике, встроенный в ADMIN Panel. Отвечай на русском. Объясняй просто и точно. Используй markdown.`,
                      }),
                    }).then(async (response) => {
                      if (!response.ok) {
                        store.addMessage({ role: 'assistant', content: 'Ошибка. Попробуйте ещё раз.' });
                        store.setLoading(false);
                        return;
                      }
                      const reader = response.body?.getReader();
                      const decoder = new TextDecoder();
                      if (!reader) return;
                      store.addMessage({ role: 'assistant', content: '' });
                      let full = '';
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        for (const line of chunk.split('\n')) {
                          if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') continue;
                            try {
                              const parsed = JSON.parse(data);
                              const content = parsed.choices?.[0]?.delta?.content;
                              if (content) { full += content; store.appendToLastMessage(content); }
                            } catch {}
                          }
                        }
                      }
                      if (!full) store.appendToLastMessage('Не удалось получить ответ.');
                      store.setLoading(false);
                    }).catch(() => {
                      store.addMessage({ role: 'assistant', content: 'Ошибка сети.' });
                      store.setLoading(false);
                    });
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-emerald-500" />
                </div>
                <span>Думаю...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Поле ввода */}
      <ChatInput />
    </div>
  );
}
