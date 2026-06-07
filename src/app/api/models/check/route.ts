import { NextRequest, NextResponse } from 'next/server';

// POST /api/models/check — test if a model is available
export async function POST(req: NextRequest) {
  try {
    const { model, apiToken } = await req.json();

    if (!model) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 });
    }

    const apiKey = apiToken || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key available' }, { status: 500 });
    }

    const start = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://my-project-black-iota.vercel.app',
        'X-Title': 'ADMIN Panel Analytics',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false,
      }),
    });

    const latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        available: true,
        latency,
        rateLimit: {
          remaining: response.headers.get('x-ratelimit-remaining')
            ? parseInt(response.headers.get('x-ratelimit-remaining')!)
            : undefined,
          reset: response.headers.get('x-ratelimit-reset')
            ? parseInt(response.headers.get('x-ratelimit-reset')!)
            : undefined,
        },
        modelUsed: data.model || model,
      });
    }

    const errText = await response.text();
    let reason = 'unknown_error';

    if (response.status === 429) {
      reason = 'rate_limited';
    } else if (response.status === 402 || response.status === 403) {
      reason = 'insufficient_credits';
    } else if (response.status === 404) {
      reason = 'model_not_found';
    } else if (response.status === 503) {
      reason = 'model_overloaded';
    }

    return NextResponse.json({
      available: false,
      reason,
      latency,
      rateLimit: {
        remaining: response.headers.get('x-ratelimit-remaining')
          ? parseInt(response.headers.get('x-ratelimit-remaining')!)
          : undefined,
        reset: response.headers.get('x-ratelimit-reset')
          ? parseInt(response.headers.get('x-ratelimit-reset')!)
          : undefined,
      },
      details: errText.slice(0, 200),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      available: false,
      reason: 'network_error',
      details: message,
    }, { status: 500 });
  }
}
