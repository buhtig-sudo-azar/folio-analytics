import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  isExpanded: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  appendToLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  isOpen: false,
  isExpanded: false,
  addMessage: (message) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...message, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),
  appendToLastMessage: (content) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + content };
      }
      return { messages };
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setOpen: (open) => set({ isOpen: open }),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  clearMessages: () => set({ messages: [] }),
}));
