'use client';

import { ChatMessage as ChatMessageType } from '@/lib/analytics/chat-store';
import { User, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
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
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div
            className={cn(
              'prose prose-xs dark:prose-invert max-w-none break-words',
              '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
              '[&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-2.5 [&_pre]:text-xs [&_pre]:overflow-x-auto',
              '[&_code]:text-xs [&_code:not(pre_code)]:bg-background [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:rounded',
              '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
              '[&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1',
              '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1',
              '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1',
              '[&_p]:mb-1.5 [&_p]:last:mb-0',
              '[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80',
              '[&_strong]:font-semibold',
              '[&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:italic',
              '[&_table]:w-full [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted',
              '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
              isStreaming && 'streaming-cursor'
            )}
          >
            <ReactMarkdown>{message.content || ' '}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
