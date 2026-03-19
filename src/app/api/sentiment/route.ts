import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SentimentRequestBody {
  headlines: string[];
}

interface GeminiSentimentResponse {
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a financial sentiment analyst. Analyze the sentiment of each of these financial news headlines and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Return ONLY this exact JSON shape:
{
  "overall": "bullish" | "bearish" | "neutral",
  "headlineSentiments": ["bullish" | "bearish" | "neutral", ...],
  "outlook": "Line 1 of market summary\\nLine 2 of market summary\\nLine 3 of market summary"
}

Rules:
- headlineSentiments must have the same number of items as the input headlines, in the same order.
- overall reflects the aggregate market direction.
- outlook is a 3-line market summary joined with \\n.
- Return only the raw JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip markdown code fences if Gemini wraps the response
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed: GeminiSentimentResponse = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
