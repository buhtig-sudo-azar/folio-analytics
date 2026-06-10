'use client';

import { ChatMessage as ChatMessageType } from '@/lib/analytics/chat-store';
import { User, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANALYTICS_AGENT } from '@/lib/analytics/agent-data';

export function ChatMessage({ message, isStreaming }: { message: ChatMessageType; isStreaming?: boolean }) {
  const isUser = message.role === 'user';
  const agent = ANALYTICS_AGENT;

  return (
    <div className={cn(
      'flex gap-2.5 animate-message-in',
      isUser && 'flex-row-reverse'
    )}>
      {/* Avatar */}
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
        isUser
          ? 'bg-primary text-primary-foreground'
          : agent.iconBg + ' text-white'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
      </div>

      {/* Message bubble */}
      <div className={cn(
        'flex-1 min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-muted rounded-tl-sm'
      )}>
        <p className={cn(
          'whitespace-pre-wrap break-words',
          isStreaming && 'streaming-cursor'
        )}>{message.content || ' '}</p>
      </div>
    </div>
  );
}
