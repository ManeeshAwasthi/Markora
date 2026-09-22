import { GoogleGenerativeAI } from '@google/generative-ai';
import { SentimentResult, ResolvedCompany } from '@/types';
import { computeSentimentScore } from '@/lib/normalize';
import { TrendDirection } from '@/types';
import { fallbackSentimentAnalysis } from '@/lib/sentimentFallback';

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
  trendScore: number,
  resolved: ResolvedCompany
): Promise<{ sentiment: SentimentResult; insight: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackSentimentAnalysis(headlines, companyName, trendDirection);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    { model: 'gemini-2.5-flash', generationConfig: { temperature: 0 } },
    { apiVersion: 'v1beta' }
  );

  const numberedHeadlines = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

  const trendContext =
    trendScore !== 50 || trendDirection !== 'Stable'
      ? `\nAdditional context: Public search interest for ${companyName} is currently ${trendDirection} (search trend index: ${trendScore}/100).`
      : '';

  const prompt = `You are a senior financial analyst. Analyse the following news headlines about ${companyName}, a ${resolved.country} listed company. All price references in the insight should use ${resolved.currencySymbol} as the currency symbol. Return ONLY a valid JSON object — no markdown, no explanation outside the JSON.

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

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned) as GeminiSentimentJSON;
    const values = [parsed.bullish, parsed.bearish, parsed.neutral];
    const isValid =
      values.every((value) => Number.isInteger(value) && value >= 0 && value <= 100) &&
      values.reduce((sum, value) => sum + value, 0) === 100 &&
      typeof parsed.insight === 'string' &&
      parsed.insight.trim().length > 0;

    if (!isValid) {
      throw new Error('Gemini returned an invalid sentiment payload');
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Gemini sentiment unavailable; using deterministic fallback. ${message}`);
    return fallbackSentimentAnalysis(headlines, companyName, trendDirection);
  }
}
