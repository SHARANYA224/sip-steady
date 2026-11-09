import { NextResponse } from 'next/server';
import { checkInput, isAdviceRequest, checkOutput, DISCLAIMER } from '../../../lib/guard.js';
import { computeFacts, factLines } from '../../../lib/facts.js';
import { fallbackAnswer } from '../../../lib/fallback.js';
import { buildPrompt } from '../../../lib/prompt.js';

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('no_key');
  const models = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'].filter(Boolean);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    let r;
    for (const model of models) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });
      if (r.status !== 404) break;
    }
    if (!r.ok) throw new Error('http_' + r.status);
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const parsed = JSON.parse(text);
    if (!parsed.summary || !Array.isArray(parsed.options)) throw new Error('bad_shape');
    return { summary: String(parsed.summary), options: parsed.options.slice(0, 4).map(String) };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  const t0 = Date.now();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Send JSON.' }, { status: 400 }); }
  const { situation = 'ontrack', monthly, months, currentValue, goalAmount, note = '' } = body || {};

  // Gate 1: sensitive data never leaves the browser request.
  const inCheck = checkInput([note, currentValue, goalAmount].join(' '));
  if (!inCheck.ok) return NextResponse.json({ blocked: true, reason: inCheck.reason, message: inCheck.message, disclaimer: DISCLAIMER });

  const facts = computeFacts({ monthly, months, currentValue, goalAmount });

  // Gate 2: advice requests get an education-only answer, no model call.
  if (isAdviceRequest(note)) {
    return NextResponse.json({ ...fallbackAnswer(situation, facts, { advice: true }), guard: 'advice_request', disclaimer: DISCLAIMER, ms: Date.now() - t0 });
  }

  // Gate 3: model answer must pass the output check, else vetted fallback.
  try {
    const ai = await callGemini(buildPrompt({ situation, facts, note }));
    const out = checkOutput(ai.summary + ' ' + ai.options.join(' '));
    if (!out.ok) {
      return NextResponse.json({ ...fallbackAnswer(situation, facts), guard: 'output_blocked:' + out.hits.join(','), disclaimer: DISCLAIMER, ms: Date.now() - t0 });
    }
    return NextResponse.json({ summary: ai.summary, facts: factLines(facts), options: ai.options, source: 'gemini', guard: 'passed', disclaimer: DISCLAIMER, ms: Date.now() - t0 });
  } catch (e) {
    return NextResponse.json({ ...fallbackAnswer(situation, facts), guard: 'model_unavailable:' + e.message, disclaimer: DISCLAIMER, ms: Date.now() - t0 });
  }
}
