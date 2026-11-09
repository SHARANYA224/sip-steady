# SIP Steady

A calm explainer for first-time SIP investors in their first 12 months. When someone is about to stop their first SIP (loss on screen, tight month, bounced instalment, "am I on track?"), SIP Steady shows their real numbers first, then a plain-English explanation and the choices they control: keep going, skip or pause one instalment, lower the amount, or move the SIP date.

Education only. It never recommends funds or stocks, never predicts returns, never uses fear or urgency, and never asks for PAN, account numbers or screenshots.

## How it works

| Layer | What it does |
|---|---|
| Fact engine (`lib/facts.js`) | Deterministic maths: amount put in, gain or loss, goal progress. The AI never computes money. |
| Gate 1: input guard (`lib/guard.js`) | Blocks PAN, IFSC, account, folio and card numbers before anything reaches the model. |
| Gate 2: advice intent | "Which fund?", "Should I sell?", "Will the market crash?" get an education-only answer and no model call. |
| AI layer (`app/api/explain`) | Google Gemini (`gemini-2.5-flash`) writes the explanation from the facts only, as JSON. |
| Gate 3: output guard | Rejects recommendations, named products, return predictions and fear/FOMO/urgency wording. |
| Fallback (`lib/fallback.js`) | Vetted human-written answers when the model is down, slow (12 s timeout) or blocked. |
| Eval gate (`eval/golden.json`, `scripts/eval.mjs`) | 20-case golden set runs on every `npm run build`. Below 90%, the deploy fails. Live view at `/eval`. |

## Run locally

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run eval                 # golden set
npm run dev                  # http://localhost:3000
```

Without a key the app still works: every answer comes from the vetted fallback.

## Deploy (Vercel)

1. Push this folder to GitHub.
2. vercel.com → Add New → Project → import the repo (framework: Next.js).
3. Settings → Environment Variables → `GEMINI_API_KEY` (free key from Google AI Studio).
4. Deploy. The build runs the eval gate first.

## Project links

- AI Discovery Engine: https://claude.ai/artifact/95vTd5z2HCsnsHBeat6fEu
- Survey (Google Form): https://docs.google.com/forms/d/e/1FAIpQLSeoAFQB51brp2b5tFEtDjC-4YvbAiC73a9tDpzObHdvk-QboQ/viewform
- Golden set: `eval/golden.json` (20 cases, 20/20 passing, gate 90%)
