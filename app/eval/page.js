import { readFileSync } from 'node:fs';
import path from 'node:path';
import { checkInput, isAdviceRequest, checkOutput } from '../../lib/guard.js';
import { computeFacts } from '../../lib/facts.js';

export const metadata = { title: 'SIP Steady eval gate' };

function run(c) {
  if (c.type === 'input') return (c.expect === 'allow') === checkInput(c.text).ok;
  if (c.type === 'intent') return (c.expect === 'advice') === isAdviceRequest(c.text);
  if (c.type === 'output') return (c.expect === 'pass') === checkOutput(c.text).ok;
  if (c.type === 'facts') { const f = computeFacts(c.input); return Object.entries(c.expect).every(([k, v]) => f[k] === v); }
  return false;
}

export default function Eval() {
  const golden = JSON.parse(readFileSync(path.join(process.cwd(), 'eval/golden.json'), 'utf8'));
  const rows = golden.map((c) => ({ ...c, ok: run(c) }));
  const pass = rows.filter((r) => r.ok).length;
  return (
    <main className="wrap">
      <header className="top"><div className="brand">SIP Steady <small>eval gate</small></div><nav><a href="/">Back to app</a></nav></header>
      <h1>Every deploy must pass the golden set first.</h1>
      <p className="lede">The build runs these 20 checks before shipping. Below 90%, the deploy is blocked. They cover blocking PAN and account numbers, refusing fund or stock advice, blocking return predictions and fear or urgency language, and getting the money maths exactly right.</p>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="big">{pass}/{rows.length}</div>
        <div className="note">passed ({Math.round((pass / rows.length) * 100)}%). Gate threshold: 90%.</div>
      </div>
      <div className="card tbl">
        <table>
          <thead><tr><th>ID</th><th>Check</th><th>Case</th><th>Expected</th><th>Result</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{r.id}</td><td>{r.type}</td><td>{r.text || JSON.stringify(r.input)}</td><td>{typeof r.expect === 'string' ? r.expect : 'exact numbers'}</td><td className={r.ok ? 'pass' : 'fail'}>{r.ok ? 'Pass' : 'Fail'}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
