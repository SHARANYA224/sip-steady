'use client';
import { useState } from 'react';
import { SITUATIONS } from '../lib/facts.js';

export default function Home() {
  const [situation, setSituation] = useState('red');
  const [form, setForm] = useState({ monthly: '1000', months: '4', currentValue: '3700', goalAmount: '60000', note: 'Market dipped and my SIP is red. My friend said stop it.' });
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function explain(e) {
    e.preventDefault();
    setLoading(true); setRes(null);
    try {
      const r = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ situation, ...form }) });
      setRes(await r.json());
    } catch {
      setRes({ error: 'Could not reach SIP Steady. Check your connection and try again.' });
    } finally { setLoading(false); }
  }

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand">SIP Steady <small>for your first 12 months</small></div>
        <nav><a href="/eval">Eval gate</a></nav>
      </header>
      <h1>Thinking of stopping your first SIP? See your real numbers first.</h1>
      <p className="lede">Pick what is happening, add a few numbers you can read off your app, and get a calm, plain-English explanation with the choices you have. SIP Steady never recommends funds and never asks for PAN, account numbers or screenshots.</p>

      <div className="grid">
        <form className="card" onSubmit={explain}>
          <label>What is happening?</label>
          <div className="chips">
            {Object.entries(SITUATIONS).map(([k, v]) => (
              <button type="button" key={k} className="chip" aria-pressed={situation === k} onClick={() => setSituation(k)}>{v}</button>
            ))}
          </div>
          <div className="row">
            <div><label htmlFor="monthly">Monthly SIP (₹)</label><input id="monthly" inputMode="numeric" value={form.monthly} onChange={set('monthly')} required /></div>
            <div><label htmlFor="months">Months so far</label><input id="months" inputMode="numeric" value={form.months} onChange={set('months')} required /></div>
          </div>
          <div className="row">
            <div><label htmlFor="cv">Value today (₹) <span>optional</span></label><input id="cv" inputMode="numeric" value={form.currentValue} onChange={set('currentValue')} /></div>
            <div><label htmlFor="goal">Goal amount (₹) <span>optional</span></label><input id="goal" inputMode="numeric" value={form.goalAmount} onChange={set('goalAmount')} /></div>
          </div>
          <label htmlFor="note">Anything else? <span>optional, no personal details</span></label>
          <textarea id="note" rows={3} value={form.note} onChange={set('note')} />
          <button className="go" disabled={loading}>{loading ? 'Explaining…' : 'Explain my SIP'}</button>
          <p className="note">Example numbers are filled in. Replace them with yours.</p>
        </form>

        <section className="card" aria-live="polite">
          {!res && !loading && <p className="note">Your explanation will appear here. It shows the numbers first, then your options, with no fund or stock suggestions.</p>}
          {loading && <p className="note">Working out your numbers…</p>}
          {res?.error && <p className="blocked">{res.error}</p>}
          {res?.blocked && <p className="blocked">{res.message}</p>}
          {res && !res.blocked && !res.error && (
            <>
              <div style={{ marginBottom: 10 }}>
                <span className={'badge' + (res.source === 'gemini' ? '' : ' warn')}>{res.source === 'gemini' ? 'AI explanation, checked' : res.source === 'advice_refusal' ? 'No advice given' : 'Safe fallback answer'}</span>
                <span className="badge">Guard: {String(res.guard).split(':')[0]}</span>
              </div>
              <p className="summary">{res.summary}</p>
              <h3>Your numbers</h3>
              <ul className="facts">{res.facts?.map((f, i) => <li key={i}>{f}</li>)}</ul>
              <h3>Choices you have</h3>
              <ol className="opts">{res.options?.map((o, i) => <li key={i}>{o}</li>)}</ol>
            </>
          )}
          {res?.disclaimer && <p className="disc">{res.disclaimer}</p>}
        </section>
      </div>
    </main>
  );
}
