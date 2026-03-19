import { NextRequest, NextResponse } from 'next/server';

interface SentimentRequestBody {
  headlines: string[];
}

interface AnthropicSentimentResponse {
  overall: 'bullish' | 'bearish' | 'neutral';
  headlineSentiments: ('bullish' | 'bearish' | 'neutral')[];
  outlook: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SentimentRequestBody = await request.json();
    const { headlines } = body;

    if (!headlines || headlines.length === 0) {
      return NextResponse.json({ error: 'headlines array is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const userPrompt = `Analyze the sentiment of each of these financial news headlines and return a JSON object.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Return ONLY valid JSON in this exact shape:
{
  "overall": "bullish" | "bearish" | "neutral",
  "headlineSentiments": ["bullish" | "bearish" | "neutral", ...],
  "outlook": "Line 1 of market summary\\nLine 2 of market summary\\nLine 3 of market summary"
}

Rules:
- headlineSentiments must have the same number of items as the input headlines, in the same order.
- overall reflects the aggregate market direction.
- outlook is a 3-line market summary joined with \\n.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: 'You are a financial sentiment analyst. Respond only in valid JSON.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Anthropic API returned ${response.status}: ${errText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText: string = data.content[0].text;

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed: AnthropicSentimentResponse = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
