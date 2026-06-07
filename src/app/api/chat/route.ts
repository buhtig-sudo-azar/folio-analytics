import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

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
        messages: allMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return new Response(JSON.stringify({ error: 'LLM API error', details: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward the stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
