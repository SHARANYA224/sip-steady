// Deterministic numbers. The AI never computes money; it only explains these facts.

export const SITUATIONS = {
  red: 'My SIP is showing a loss',
  cash: 'Money is tight this month',
  failed: 'An instalment failed or bounced',
  ontrack: "I can't tell if I'm on track"
};

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export function computeFacts({ monthly, months, currentValue, goalAmount }) {
  const m = Math.max(0, Number(monthly) || 0);
  const n = Math.max(0, Math.round(Number(months) || 0));
  const invested = m * n;
  const cv = currentValue === '' || currentValue == null ? null : Number(currentValue);
  const goal = goalAmount === '' || goalAmount == null ? null : Number(goalAmount);

  const f = { monthly: m, months: n, invested, investedText: inr(invested) };
  if (cv != null && !Number.isNaN(cv) && invested > 0) {
    f.currentValue = cv;
    f.currentValueText = inr(cv);
    f.change = cv - invested;
    f.changeText = (f.change >= 0 ? '+' : '−') + inr(Math.abs(f.change));
    f.changePct = Math.round(((cv - invested) / invested) * 1000) / 10;
  }
  if (goal && goal > 0 && m > 0) {
    f.goal = goal;
    f.goalText = inr(goal);
    f.goalProgressPct = Math.min(100, Math.round((invested / goal) * 100));
    // Contributions only. No return assumption, so this is a fact, not a forecast.
    f.monthsToGoalByContributions = Math.max(0, Math.ceil((goal - invested) / m));
  }
  f.earlyStage = n > 0 && n <= 12;
  return f;
}

export function factLines(f) {
  const lines = [`You have put in ${f.investedText} over ${f.months} month${f.months === 1 ? '' : 's'} (${inr(f.monthly)} a month).`];
  if (f.change != null) lines.push(`Today it shows ${f.currentValueText}, which is ${f.changeText} (${f.changePct}%) compared with what you put in.`);
  if (f.goal) lines.push(`Your contributions so far cover ${f.goalProgressPct}% of your ${f.goalText} goal. At ${inr(f.monthly)} a month, your own contributions alone reach the goal in about ${f.monthsToGoalByContributions} more months, before any market growth.`);
  return lines;
}
