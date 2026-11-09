// Shared 9-theme taxonomy for the discovery engine (keyword baseline + Gemini labelling).
export const THEMES = {
  pay: 'Autopay / mandate / instalment failures',
  ctrl: "Can't skip, pause or change the SIP",
  show: 'Portfolio numbers wrong or confusing',
  trust: 'Trust: Prime/regular plans, hidden charges',
  redeem: 'Redemption / withdrawal problems',
  support: 'Customer support unresponsive',
  loss: 'Loss or low-return anxiety',
  guide: 'Wants guidance, goals or tracking',
  easy: 'Beginner-friendly, easy to start'
};
export const SIP_FILTER = /\bsip\b|\bsips\b|mutual fund|\bmf\b|mandate|autopay|auto pay|instal+ment|\bnav\b|redeem|redemption|pause/i;
