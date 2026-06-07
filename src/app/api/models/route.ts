import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for free models (5 min TTL)
let cachedModels: { models: { id: string; name: string; description?: string; contextLength?: number }[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// GET /api/models — list free models from OpenRouter
export async function GET(req: NextRequest) {
  try {
    const clientToken = req.headers.get('authorization')?.replace('Bearer ', '') || '';

    if (cachedModels && Date.now() - cachedModels.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cachedModels);
    }

    const apiKey = clientToken || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key available' }, { status: 500 });
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://my-project-black-iota.vercel.app',
        'X-Title': 'ADMIN Panel Analytics',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Failed to fetch models', details: errText }, { status: res.status });
    }

    const data = await res.json();

    const freeModels = (data.data || [])
      .filter((m: { id: string }) => m.id.endsWith(':free') && !m.id.includes('content-safety'))
      .map((m: { id: string; name?: string; description?: string; context_length?: number }) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description || undefined,
        contextLength: m.context_length || undefined,
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    const result = { models: freeModels, fetchedAt: Date.now() };
    cachedModels = result;

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
