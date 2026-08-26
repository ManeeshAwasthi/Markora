# Markora

Markora is a quantitative market-research prototype that looks for divergence between what people are saying and what prices are doing.

Instead of treating sentiment as a prediction by itself, Markora combines market data, news signals, and search interest to help investigate situations where the public narrative and equity-price movement appear misaligned.

## Why it exists

Markets often move before a narrative becomes obvious—or keep moving after the narrative has become overcrowded. Markora was built to explore that gap through a single research workflow.

It is an analytical aid, not an investment recommendation or automated trading system.

## Core workflow

1. Select an equity or market symbol.
2. Retrieve recent price information.
3. Collect relevant headlines and interest signals.
4. Use an LLM to structure qualitative sentiment.
5. Compare narrative direction with observed market movement.
6. Present the evidence through interactive charts for further analysis.

## Technology

- Next.js 14 and TypeScript
- Gemini API for language-model-assisted sentiment analysis
- Yahoo Finance data through `yahoo-finance2`
- Google Trends signals
- Recharts for interactive visualisation

## Run locally

```bash
npm install
npm run dev
```

Create an `.env.local` file and configure the API credentials required by the data providers used in your environment.

## Current status

Markora is an exploratory research prototype. The next stage is to improve source transparency, historical evaluation, signal weighting, and reproducibility before treating its outputs as decision-grade evidence.

## Disclaimer

This project is for research and educational purposes only. It does not provide financial advice.
