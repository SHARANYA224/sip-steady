'use client';
import { useState } from 'react';
import { THEMES } from '../../lib/themes.js';
import golden from '../../eval/review_golden.json';

// Runs the AI labelling step of the discovery engine: collect reviews, label with Gemini, check against a hand-labelled set.
async function labelBatch(reviews) {
  const r = await fetch('/api/label', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviews }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Labelling failed');
  return j.labels;
}

export default function Label() {
  const [status, setStatus] = useState('');
  const [agree, setAgree] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  async function runGolden() {
    setBusy(true); setStatus('Labelling the 20 hand-labelled reviews with Gemini…');
    try {
      const labels = await labelBatch(golden);
      const rows = golden.map((g, i) => {
        const ai = labels[i] || [];
        return { ...g, ai, overlap: ai.some((x) => g.gold.includes(x)), exact: ai.length === g.gold.length && ai.every((x) => g.gold.includes(x)) };
      });
      setAgree({ rows, overlap: rows.filter((r) => r.overlap).length, exact: rows.filter((r) => r.exact).length });
      setStatus('');
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function runAll() {
    setBusy(true); setStatus('Collecting Groww Play Store reviews…');
    try {
      const d = await (await fetch('/api/reviews')).json();
      const sip = d.sip || [];
      const out = [];
      for (let i = 0; i < sip.length; i += 30) {
        setStatus(`Labelling with Gemini: ${Math.min(i + 30, sip.length)} of ${sip.length}…`);
        const batch = sip.slice(i, i + 30);
        const labels = await labelBatch(batch);
        batch.forEach((r, k) => out.push({ ...r, ai: labels[k] || [] }));
      }
      const counts = Object.keys(THEMES).map((k) => {
        const rs = out.filter((r) => r.ai.includes(k));
        return { k, n: rs.length, neg: rs.filter((r) => r.s <= 2).length };
      }).sort((a, b) => b.n - a.n);
      setRes({ total: d.total, n: out.length, counts, tagged: out.filter((r) => r.ai.length).length });
      setStatus('');
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  return (
    <main className="wrap">
      <header className="top"><div className="brand">SIP Steady <small>AI labelling</small></div><nav><a href="/discovery.html">Discovery engine</a><a href="/">App</a></nav></header>
      <h1>Gemini labels the Play Store reviews, checked against 20 hand-labelled ones.</h1>
      <p className="lede">Step 1 measures agreement between Gemini and human labels. Step 2 collects all public Groww reviews, keeps the SIP-related ones, and labels each with up to 3 of 9 themes.</p>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="go" disabled={busy} onClick={runGolden}>1. Check agreement (20 reviews)</button>
        <button className="go" disabled={busy} onClick={runAll}>2. Label all SIP reviews</button>
      </div>
      {status && <p className="note">{status}</p>}
      {agree && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="big">{agree.overlap}/20</div>
          <p className="note">reviews where Gemini shares at least one theme with the human label ({agree.overlap * 5}%). Exact match: {agree.exact}/20 ({agree.exact * 5}%).</p>
          <div className="tbl"><table><thead><tr><th>Review</th><th>Human</th><th>Gemini</th><th>Agree</th></tr></thead><tbody>
            {agree.rows.map((r, i) => <tr key={i}><td>{r.t.slice(0, 110)}…</td><td>{r.gold.join(', ')}</td><td>{r.ai.join(', ') || '—'}</td><td className={r.overlap ? 'pass' : 'fail'}>{r.exact ? 'Exact' : r.overlap ? 'Partial' : 'No'}</td></tr>)}
          </tbody></table></div>
        </div>
      )}
      {res && (
        <div className="card">
          <div className="big">{res.n}</div>
          <p className="note">SIP-related reviews out of {res.total} collected; {res.tagged} got at least one Gemini theme.</p>
          <div className="tbl"><table><thead><tr><th>Theme</th><th>Reviews</th><th>1–2★</th></tr></thead><tbody>
            {res.counts.map((c) => <tr key={c.k}><td>{THEMES[c.k]}</td><td>{c.n}</td><td>{c.neg}</td></tr>)}
          </tbody></table></div>
        </div>
      )}
    </main>
  );
}
