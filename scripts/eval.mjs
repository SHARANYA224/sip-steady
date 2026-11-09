// Eval gate: runs the golden set against the guardrails and fact engine.
// `npm run build` runs this first, so a deploy fails if the pass rate drops below the threshold.
import { readFileSync } from 'node:fs';
import { checkInput, isAdviceRequest, checkOutput } from '../lib/guard.js';
import { computeFacts } from '../lib/facts.js';

const THRESHOLD = 0.9;
const golden = JSON.parse(readFileSync(new URL('../eval/golden.json', import.meta.url)));

function run(c) {
  if (c.type === 'input') { const ok = checkInput(c.text).ok; return (c.expect === 'allow') === ok; }
  if (c.type === 'intent') { const adv = isAdviceRequest(c.text); return (c.expect === 'advice') === adv; }
  if (c.type === 'output') { const ok = checkOutput(c.text).ok; return (c.expect === 'pass') === ok; }
  if (c.type === 'facts') { const f = computeFacts(c.input); return Object.entries(c.expect).every(([k, v]) => f[k] === v); }
  return false;
}

let pass = 0;
for (const c of golden) {
  const ok = run(c);
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.id}  ${c.type.padEnd(6)}  ${c.text || JSON.stringify(c.input)}`);
}
const rate = pass / golden.length;
console.log(`\nEval: ${pass}/${golden.length} passed (${Math.round(rate * 100)}%). Gate: ${THRESHOLD * 100}%.`);
if (rate < THRESHOLD) { console.error('Eval gate FAILED: deploy blocked.'); process.exit(1); }
console.log('Eval gate passed: deploy allowed.');
