import { create } from 'zustand';

// --- Types ---
export interface FreeModel {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: { prompt: string; completion: string };
}

export interface RateLimitInfo {
  available: boolean;
  reason?: string;
  latency?: number;
  remaining?: number;
  reset?: number;
  checkedAt: number;
}

interface ModelState {
  currentModel: string;
  apiToken: string;
  rateLimits: Record<string, RateLimitInfo>;
  availableModels: FreeModel[];
  modelsLoading: boolean;
  _hydrated: boolean;

  setCurrentModel: (model: string) => void;
  setApiToken: (token: string) => void;
  clearApiToken: () => void;
  fetchAvailableModels: () => Promise<void>;
  checkModel: (model: string) => Promise<RateLimitInfo>;
  checkAllLimits: () => Promise<void>;
  markModelRateLimited: (model: string, reason?: string) => void;
  _hydrate: () => void;
}

const LS_MODEL = 'app-model';
const LS_TOKEN = 'app-api-token';
const LS_LIMITS = 'app-rate-limits';
const DEFAULT_MODEL = 'moonshotai/kimi-k2.6:free';

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export const useModelStore = create<ModelState>((set, get) => ({
  currentModel: DEFAULT_MODEL,
  apiToken: '',
  rateLimits: {},
  availableModels: [],
  modelsLoading: false,
  _hydrated: false,

  setCurrentModel: (model) => {
    set({ currentModel: model });
    writeLS(LS_MODEL, model);
  },

  setApiToken: (token) => {
    set({ apiToken: token });
    writeLS(LS_TOKEN, token);
  },

  clearApiToken: () => {
    set({ apiToken: '' });
    try { localStorage.removeItem(LS_TOKEN); } catch {}
  },

  fetchAvailableModels: async () => {
    set({ modelsLoading: true });
    try {
      const { apiToken } = get();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      const res = await fetch('/api/models', { headers });
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      set({ availableModels: data.models || [], modelsLoading: false });
    } catch {
      set({ modelsLoading: false });
    }
  },

  checkModel: async (model) => {
    const { apiToken } = get();
    try {
      const res = await fetch('/api/models/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, apiToken: apiToken || undefined }),
      });
      const data = await res.json();
      const info: RateLimitInfo = {
        available: data.available ?? false,
        reason: data.reason,
        latency: data.latency,
        remaining: data.rateLimit?.remaining,
        reset: data.rateLimit?.reset,
        checkedAt: Date.now(),
      };
      set((s) => {
        const rateLimits = { ...s.rateLimits, [model]: info };
        writeLS(LS_LIMITS, rateLimits);
        return { rateLimits };
      });
      return info;
    } catch {
      const info: RateLimitInfo = { available: false, reason: 'network_error', checkedAt: Date.now() };
      set((s) => {
        const rateLimits = { ...s.rateLimits, [model]: info };
        writeLS(LS_LIMITS, rateLimits);
        return { rateLimits };
      });
      return info;
    }
  },

  checkAllLimits: async () => {
    const { availableModels } = get();
    for (const m of availableModels) {
      await get().checkModel(m.id);
    }
  },

  markModelRateLimited: (model, reason) => {
    const info: RateLimitInfo = {
      available: false,
      reason: reason || 'rate_limited',
      checkedAt: Date.now(),
    };
    set((s) => {
      const rateLimits = { ...s.rateLimits, [model]: info };
      writeLS(LS_LIMITS, rateLimits);
      return { rateLimits };
    });
  },

  _hydrate: () => {
    if (typeof window === 'undefined') return;
    const model = readLS<string>(LS_MODEL, DEFAULT_MODEL);
    const token = readLS<string>(LS_TOKEN, '');
    const limits = readLS<Record<string, RateLimitInfo>>(LS_LIMITS, {});
    set({ currentModel: model, apiToken: token, rateLimits: limits, _hydrated: true });
  },
}));
