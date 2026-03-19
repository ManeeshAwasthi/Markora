import { GoogleGenerativeAI } from '@google/generative-ai';
import { SentimentResult } from '@/types';
import { computeSentimentScore } from '@/lib/normalize';

interface GeminiSentimentJSON {
  bullish: number;
  bearish: number;
  neutral: number;
  insight: string;
}

/**
 * Calls Gemini to analyse financial headlines and return a structured
 * sentiment breakdown plus a plain-English insight.
 */
export async function analyzeSentiment(
  headlines: string[],
  ticker: string
): Promise<{ sentiment: SentimentResult; insight: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const numberedHeadlines = headlines
    .map((h, i) => `${i + 1}. ${h}`)
    .join('\n');

  const prompt = `You are a senior financial analyst. Analyse the following news headlines about ${ticker} and return ONLY a valid JSON object — no markdown, no explanation outside the JSON.

Headlines:
${numberedHeadlines}

Return exactly this JSON structure:
{
  "bullish": <integer 0-100>,
  "bearish": <integer 0-100>,
  "neutral": <integer 0-100>,
  "insight": "<2-3 sentences in plain English explaining what these headlines mean for ${ticker} and whether sentiment aligns with or diverges from typical price expectations>"
}

Rules:
- bullish + bearish + neutral must equal exactly 100
- insight must be 2-3 sentences only
- insight must not mention any AI model, Gemini, or language model
- Return only the raw JSON object, nothing else`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  // Strip markdown code fences if Gemini wraps the response
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed: GeminiSentimentJSON;
  try {
    parsed = JSON.parse(cleaned) as GeminiSentimentJSON;
  } catch {
    throw new Error(
      `Failed to parse Gemini response as JSON. Raw response: ${raw.slice(0, 200)}`
    );
  }

  const score = computeSentimentScore(parsed.bullish, parsed.bearish);

  const sentiment: SentimentResult = {
    bullish: parsed.bullish,
    bearish: parsed.bearish,
    neutral: parsed.neutral,
    score,
  };

  return { sentiment, insight: parsed.insight };
}
