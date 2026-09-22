import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fallbackSentimentAnalysis } from '@/lib/sentimentFallback';

interface SentimentRequestBody {
  headlines: string[];
}

interface GeminiSentimentResponse {
  overall: 'bullish' | 'bearish' | 'neutral';
  headlineSentiments: ('bullish' | 'bearish' | 'neutral')[];
  outlook: string;
}

function getFallbackResponse(headlines: string[]): GeminiSentimentResponse {
  const fallback = fallbackSentimentAnalysis(headlines, 'the company', 'Stable');
  const { bullish, bearish, neutral } = fallback.sentiment;
  const overall =
    bullish > bearish && bullish > neutral
      ? 'bullish'
      : bearish > bullish && bearish > neutral
        ? 'bearish'
        : 'neutral';

  return {
    overall,
    headlineSentiments: fallback.labels,
    outlook: fallback.insight.replace('the company', 'the selected company'),
  };
}

export async function POST(request: NextRequest) {
  let headlines: string[] | undefined;

  try {
    const body = (await request.json()) as Partial<SentimentRequestBody>;
    headlines = body.headlines;

    if (
      !Array.isArray(headlines) ||
      headlines.length === 0 ||
      headlines.some((headline) => typeof headline !== 'string')
    ) {
      return NextResponse.json({ error: 'headlines array is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getFallbackResponse(headlines));
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
    console.warn('Gemini sentiment route unavailable; using deterministic fallback.', err);

    if (headlines && headlines.length > 0) {
      return NextResponse.json(getFallbackResponse(headlines));
    }

    return NextResponse.json({ error: 'Unable to analyze sentiment' }, { status: 500 });
  }
}
