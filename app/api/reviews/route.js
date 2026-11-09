import { NextResponse } from 'next/server';
import { SIP_FILTER } from '../../../lib/themes.js';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Collects public Groww Play Store reviews server-side (same public endpoint the Play Store web page uses).
async function page(token, sort) {
  const inner = JSON.stringify([null, null, [2, sort, [200, null, token || null], null, []], ['com.nextbillion.groww', 7]]);
  const body = 'f.req=' + encodeURIComponent(JSON.stringify([[['UsvDTd', inner, null, 'generic']]]));
  const r = await fetch('https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=UsvDTd&hl=en_IN&gl=IN', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body
  });
  const t = await r.text();
  const line = t.split('\n').find((l) => l.startsWith('[["wrb.fr"'));
  if (!line) throw new Error('play_' + r.status);
  return JSON.parse(JSON.parse(line)[0][2]);
}

export async function GET() {
  const all = new Map();
  for (const sort of [2, 1]) {
    let tok = null;
    for (let i = 0; i < 12; i++) {
      try {
        const d = await page(tok, sort);
        for (const v of d[0] || []) all.set(v[0], { id: v[0], s: v[2], t: v[4], d: v[5]?.[0] ? new Date(v[5][0] * 1000).toISOString().slice(0, 10) : '' });
        tok = d[1]?.[1]; if (!tok) break;
      } catch { break; }
    }
  }
  const rows = [...all.values()];
  const sip = rows.filter((r) => r.t && SIP_FILTER.test(r.t) && r.t.split(/\s+/).length >= 4).map((r) => ({ ...r, t: r.t.replace(/\s+/g, ' ').slice(0, 500) }));
  return NextResponse.json({ total: rows.length, sip });
}
