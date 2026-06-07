'use client';

import { ChatMessage as ChatMessageType, useChatStore } from '@/lib/analytics/chat-store';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-200', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn(
        'flex-1 min-w-0 rounded-lg px-3 py-2 text-sm leading-relaxed',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        <div className="prose prose-xs dark:prose-invert max-w-none break-words
          [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
          [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:text-xs
          [&_code]:text-xs [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
          [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
          [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold
          [&_p]:mb-1 [&_p]:last:mb-0
          [&_a]:text-primary [&_a]:underline">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
