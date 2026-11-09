import { NextResponse } from 'next/server';
import { THEMES } from '../../../lib/themes.js';
export const maxDuration = 60;

// Labels a batch of reviews with Gemini. Returns one array of theme ids per review.
export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY is not set on Vercel.' }, { status: 503 });
  const { reviews = [] } = await req.json();
  const list = reviews.slice(0, 30).map((r, i) => `${i}. ${String(r.t).slice(0, 500)}`).join('\n');
  const prompt = `You label Google Play reviews of the Groww investing app for a product research study.
Themes (id: meaning):
${Object.entries(THEMES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
For each numbered review, return the ids of ALL themes it clearly mentions (0 to 3). Use [] if none apply. Do not guess.
Return ONLY JSON: {"labels":[[ids for review 0],[ids for review 1],...]} with exactly ${reviews.slice(0, 30).length} entries.

Reviews:
${list}`;
  const models = [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'].filter(Boolean);
  let r;
  for (const model of models) {
    try { r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(14000),
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } })
    }); } catch { r = { ok: false, status: 504 }; continue; }
    if (r.ok) break;
  }
  if (!r.ok) return NextResponse.json({ error: 'Gemini returned ' + r.status }, { status: 502 });
  const j = await r.json();
  try {
    const out = JSON.parse(j.candidates[0].content.parts.map((p) => p.text).join(''));
    const valid = new Set(Object.keys(THEMES));
    return NextResponse.json({ labels: (out.labels || []).map((a) => (Array.isArray(a) ? a.filter((x) => valid.has(x)) : [])) });
  } catch {
    return NextResponse.json({ error: 'Could not read Gemini output.' }, { status: 502 });
  }
}
