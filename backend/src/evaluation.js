/* ---------------------------------------------------------------------- */
/*  EXPERT EVALUATION — fixed scoring rubric (innovation, feasibility,     */
/*  cost, security, scalability), auto-totalled and auto-ranked. Category  */
/*  weights shift automatically based on the challenge's risk profile so   */
/*  every evaluator is scoring against the same, fair rubric instead of    */
/*  relying on personal judgement of what matters most for a given         */
/*  challenge.                                                             */
/* ---------------------------------------------------------------------- */

// Base weights (must sum to 100) for a standard / low-risk challenge.
export const BASE_WEIGHTS = {
  innovation: 25,
  feasibility: 25,
  cost: 15,
  security: 20,
  scalability: 15,
};

export const RUBRIC_CATEGORIES = [
  { key: "innovation", label: "Innovation" },
  { key: "feasibility", label: "Feasibility" },
  { key: "cost", label: "Cost" },
  { key: "security", label: "Security" },
  { key: "scalability", label: "Scalability" },
];

// How many extra percentage points get shifted onto Security as challenge
// risk increases (risk is highly correlated with handling personal /
// citizen data — see eligibility.js, which uses the same field to require
// a security certification).
const SECURITY_BUMP_BY_RISK = { Low: 0, Medium: 5, High: 10 };

/**
 * Compute the rubric weights that apply to a given challenge. Higher-risk
 * challenges (e.g. ones involving personal/citizen data) automatically
 * increase the Security weight and proportionally scale every other
 * category down, so the rubric always totals 100 and no evaluator has to
 * remember to do this manually.
 */
export function weightsForChallenge(challenge) {
  const risk = challenge?.risk && SECURITY_BUMP_BY_RISK[challenge.risk] !== undefined ? challenge.risk : "Low";
  const bump = SECURITY_BUMP_BY_RISK[risk];

  if (bump === 0) {
    return { risk, adjusted: false, weights: { ...BASE_WEIGHTS } };
  }

  const newSecurity = BASE_WEIGHTS.security + bump;
  const remaining = 100 - newSecurity;
  const otherBaseTotal = 100 - BASE_WEIGHTS.security; // sum of every non-security base weight
  const scale = remaining / otherBaseTotal;

  const weights = { security: newSecurity };
  let allocated = newSecurity;
  const otherKeys = RUBRIC_CATEGORIES.map((c) => c.key).filter((k) => k !== "security");
  otherKeys.forEach((key, i) => {
    if (i === otherKeys.length - 1) {
      // Last category absorbs any rounding remainder so weights always sum to 100.
      weights[key] = 100 - allocated;
    } else {
      const scaled = Math.round(BASE_WEIGHTS[key] * scale);
      weights[key] = scaled;
      allocated += scaled;
    }
  });

  return { risk, adjusted: true, weights };
}

/** Human-readable explanation of why the rubric looks the way it does. */
export function rubricMessage({ risk, adjusted, weights }) {
  if (!adjusted) {
    return `Standard rubric applied — this is a ${risk.toLowerCase()}-risk challenge, so category weights are unchanged.`;
  }
  return `This challenge involves ${risk.toLowerCase()}-risk data handling — Security category weight increased from ${BASE_WEIGHTS.security}% to ${weights.security}% automatically, with the remaining categories scaled down proportionally.`;
}

/** Validate a raw scores object: every rubric category must be a 0–10 number. */
export function validateScores(scores) {
  if (!scores || typeof scores !== "object") return "Scores are required";
  for (const { key, label } of RUBRIC_CATEGORIES) {
    const v = scores[key];
    if (typeof v !== "number" || Number.isNaN(v) || v < 0 || v > 10) {
      return `${label} score must be a number between 0 and 10`;
    }
  }
  return null;
}

/** Weighted total out of 100, given raw 0–10 category scores and the rubric weights. */
export function computeTotal(scores, weights) {
  const total = RUBRIC_CATEGORIES.reduce((sum, { key }) => sum + (scores[key] / 10) * weights[key], 0);
  return Math.round(total * 10) / 10;
}

/**
 * Rank startups by their average auto-totalled score across all evaluators
 * who have scored them for this challenge — so the ranking reflects
 * consensus rather than any single evaluator's opinion.
 */
export function rankEvaluations(evaluations) {
  const byStartup = new Map();
  for (const ev of evaluations) {
    const bucket = byStartup.get(ev.startupId) || [];
    bucket.push(ev);
    byStartup.set(ev.startupId, bucket);
  }

  const ranking = [...byStartup.entries()].map(([startupId, evs]) => ({
    startupId,
    startupName: evs[0].startupName,
    evaluatorCount: evs.length,
    avgTotal: Math.round((evs.reduce((s, e) => s + e.total, 0) / evs.length) * 10) / 10,
  }));

  ranking.sort((a, b) => b.avgTotal - a.avgTotal);
  ranking.forEach((r, i) => { r.rank = i + 1; });
  return ranking;
}
