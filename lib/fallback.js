// Vetted, human-written fallback answers. Used when the model is unavailable,
// when the output guard rejects an answer, or when the user asks for advice.
import { factLines } from './facts.js';

const OPTIONS = {
  red: [
    'Keep the SIP running as it is. Ups and downs in the first year are common for equity funds.',
    'Look at the value less often, for example only on instalment day.',
    'Re-read why you started (your goal) before making a change.'
  ],
  cash: [
    'Skip just this month\'s instalment. Many apps, including Groww, let you skip or pause from the SIP settings, so you do not have to cancel.',
    'Lower the monthly amount for a while instead of stopping.',
    'Move the SIP date to a few days after your salary or income usually arrives.'
  ],
  failed: [
    'A failed instalment does not cancel your SIP. The next one is attempted on its usual date.',
    'Check that the bank account linked to the mandate has enough balance the day before.',
    'If the date clashes with when money comes in, change the SIP date in the app.'
  ],
  ontrack: [
    'Compare what you have put in with your goal amount. That is the part you control.',
    'Check once a month on instalment day, not every day.',
    'If you have no goal yet, set one in the app so progress has a reference point.'
  ]
};

const OPENERS = {
  red: 'Seeing a loss early on is unsettling, and it is very common in the first months of an equity SIP. A short-term dip is a change in today\'s price, not money taken out of your account.',
  cash: 'A tight month happens to almost everyone. You have more choices than stopping the SIP completely.',
  failed: 'A bounced instalment is usually a timing or balance issue, and it is fixable.',
  ontrack: 'Not knowing if you are on track is the most common worry among first-time SIP investors.'
};

export function fallbackAnswer(situation, facts, { advice = false } = {}) {
  const s = OPTIONS[situation] ? situation : 'ontrack';
  const intro = advice
    ? 'SIP Steady cannot tell you which fund or stock to pick, or whether to buy or sell. For that, please speak to a SEBI-registered investment adviser. Here is what your numbers show.'
    : OPENERS[s];
  return {
    summary: intro,
    facts: factLines(facts),
    options: OPTIONS[s],
    source: advice ? 'advice_refusal' : 'fallback'
  };
}
