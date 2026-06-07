import { NextRequest } from 'next/server';

const FALLBACK_CHAIN = [
  'moonshotai/kimi-k2.6:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-235b-a22b:free',
  'deepseek/deepseek-r1-0528:free',
  'meta-llama/llama-4-maverick:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, model: clientModel, apiToken } = await req.json();

    const apiKey = apiToken || process.env.OPENROUTER_API_KEY;
    const requestedModel = clientModel || process.env.OPENROUTER_MODEL || 'moonshotai/kimi-k2.6:free';

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

    const buildRequest = (modelId: string) => ({
      model: modelId,
      messages: allMessages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const buildHeaders = (key: string) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://my-project-black-iota.vercel.app',
      'X-Title': 'ADMIN Panel Analytics',
    });

    // Try the requested model first
    const exhausted: string[] = [];
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify(buildRequest(requestedModel)),
    });

    // If 429 rate-limited, fallback through the chain
    if (response.status === 429) {
      exhausted.push(requestedModel);
      response = await response.text().then(() => null); // consume body

      for (const fallbackModel of FALLBACK_CHAIN) {
        if (fallbackModel === requestedModel) continue;
        if (exhausted.includes(fallbackModel)) continue;

        const fbResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: buildHeaders(apiKey),
          body: JSON.stringify(buildRequest(fallbackModel)),
        });

        if (fbResponse.status === 429) {
          exhausted.push(fallbackModel);
          await fbResponse.text(); // consume body
          continue;
        }

        response = fbResponse;
        break;
      }
    }

    // If all fallbacks exhausted, return error
    if (!response) {
      return new Response(JSON.stringify({
        error: 'Все модели исчерпали лимит. Попробуйте позже или используйте свой API-ключ.',
        exhausted,
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle non-429 errors
    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return new Response(JSON.stringify({ error: 'LLM API error', details: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build a custom SSE stream that injects model_info before the OpenRouter stream
    const encoder = new TextEncoder();
    const modelInfoEvent = `data: ${JSON.stringify({
      type: 'model_info',
      model: requestedModel,
      exhausted,
    })}\n\n`;

    // Create a TransformStream to prepend model_info
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Write model_info event first
    writer.write(encoder.encode(modelInfoEvent)).then(() => {
      // Then pipe the OpenRouter stream
      const reader = response.body!.getReader();
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) {
            writer.close();
            return;
          }
          return writer.write(value).then(pump);
        });
      return pump();
    }).catch(() => {
      writer.close();
    });

    return new Response(readable, {
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
