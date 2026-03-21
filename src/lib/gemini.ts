import { GoogleGenerativeAI } from '@google/generative-ai';
import { SentimentResult } from '@/types';
import { computeSentimentScore } from '@/lib/normalize';
import { TrendDirection } from '@/types';

interface GeminiSentimentJSON {
  bullish: number;
  bearish: number;
  neutral: number;
  insight: string;
}

export async function analyzeSentiment(
  headlines: string[],
  companyName: string,
  trendDirection: TrendDirection,
  trendScore: number
): Promise<{ sentiment: SentimentResult; insight: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const numberedHeadlines = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

  const trendContext =
    trendScore !== 50 || trendDirection !== 'Stable'
      ? `\nAdditional context: Public search interest for ${companyName} is currently ${trendDirection} (search trend index: ${trendScore}/100).`
      : '';

  const prompt = `You are a senior financial analyst. Analyse the following news headlines about ${companyName} and return ONLY a valid JSON object — no markdown, no explanation outside the JSON.

Headlines:
${numberedHeadlines}
${trendContext}

Return exactly this JSON structure:
{
  "bullish": <integer 0-100>,
  "bearish": <integer 0-100>,
  "neutral": <integer 0-100>,
  "insight": "<2-3 sentences in plain English explaining what these headlines mean for ${companyName} and whether sentiment aligns with or diverges from typical price expectations${trendDirection !== 'Stable' ? `. Reference that public search interest is ${trendDirection} and what that implies` : ''}>"
}

Rules:
- bullish + bearish + neutral must equal exactly 100
- insight must be 2-3 sentences only
- insight must not mention any AI model, Gemini, Google, or language model
- insight must read as independent analyst commentary
- Return only the raw JSON object, nothing else`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed: GeminiSentimentJSON;
  try {
    parsed = JSON.parse(cleaned) as GeminiSentimentJSON;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON. Raw: ${raw.slice(0, 200)}`);
  }

  const score = computeSentimentScore(parsed.bullish, parsed.bearish);

  return {
    sentiment: {
      bullish: parsed.bullish,
      bearish: parsed.bearish,
      neutral: parsed.neutral,
      score,
    },
    insight: parsed.insight,
  };
}
