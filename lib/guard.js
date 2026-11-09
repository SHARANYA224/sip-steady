// Guardrails for SIP Steady. Pure functions, shared by the API route and the eval gate.

// 1) INPUT: block sensitive financial identifiers before anything reaches the model.
const PAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;
const IFSC = /\b[A-Z]{4}0[A-Z0-9]{6}\b/i;
const LONG_DIGITS = /\b\d{9,18}\b/; // bank account / folio-like numbers
const CARD = /\b(?:\d[ -]?){13,19}\b/;

export function checkInput(text = '') {
  const t = String(text);
  if (PAN.test(t)) return { ok: false, reason: 'pan', message: 'Please remove your PAN. SIP Steady never needs it.' };
  if (IFSC.test(t) || LONG_DIGITS.test(t) || CARD.test(t))
    return { ok: false, reason: 'account_number', message: 'Please remove account, folio or card numbers. SIP Steady never needs them.' };
  return { ok: true };
}

// 2) INTENT: requests for advice are answered with education, never a recommendation.
const ADVICE_ASK = [
  /\bwhich (mutual )?fund\b/i, /\bwhat (fund|stock|share)s? should\b/i, /\bshould i (buy|sell|switch|redeem|exit|invest in|stop)\b/i,
  /\bbest (fund|sip|stock|mutual fund)\b/i, /\brecommend\b/i, /\b(tip|tips) (for|on) (stocks?|shares?)\b/i,
  /\bwill (the )?market (go|crash|rise|fall)\b/i, /\bhow much (return|returns) will\b/i
];
export function isAdviceRequest(text = '') {
  return ADVICE_ASK.some((r) => r.test(String(text)));
}

// 3) OUTPUT: the model's answer must contain no advice, no predictions, no fear/FOMO/urgency.
const BANNED_OUT = [
  { id: 'recommendation', re: /\b(i|we) (recommend|suggest you (buy|sell|switch|invest))\b|\byou should (buy|sell|switch|redeem|invest in)\b/i },
  { id: 'buy_sell_call', re: /\b(buy|sell|redeem|exit) (this|that|the) (fund|stock|scheme)\b|\bswitch to (a|an|the)? ?[A-Z][a-z]+/ },
  { id: 'named_product', re: /\b(parag parikh|axis bluechip|mirae asset|hdfc (mid|small|flexi)|sbi (small|bluechip)|nippon india|quant (small|active)|icici prudential|kotak (emerging|flexi)|uti nifty|motilal oswal)\b/i },
  { id: 'return_prediction', re: /\b(will|guaranteed to|sure to) (give|return|earn|grow)\b|\bguarantee(d)? returns?\b|\b\d{1,2}(\.\d)?\s?% (returns? )?(per year|p\.a\.|annually|cagr)\b/i },
  { id: 'fear_fomo_urgency', re: /\b(hurry|act now|last chance|don'?t miss|limited time|before it'?s too late|you will lose everything|panic|crash is coming|missing out)\b/i }
];
export function checkOutput(text = '') {
  const hits = BANNED_OUT.filter((b) => b.re.test(String(text))).map((b) => b.id);
  return { ok: hits.length === 0, hits };
}

export const DISCLAIMER = 'Education only, not investment advice. SIP Steady never recommends funds or stocks.';
