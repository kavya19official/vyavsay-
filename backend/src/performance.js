/* ---------------------------------------------------------------------- */
/*  PERFORMANCE MEASUREMENT — KPI targets are locked in before a pilot     */
/*  starts (baseline + target, set once at pilot creation and never        */
/*  editable afterwards). As field results come in, achievement against    */
/*  that locked target is pure math — no manual judgement from a           */
/*  validator or department official.                                     */
/*                                                                          */
/*  Example: baseline complaint-resolution time = 40 min, target = a 30%   */
/*  reduction (28 min). Actual result comes in at 31.9 min → the system    */
/*  works out that's a 24% reduction, i.e. 80% of the target reduction —   */
/*  automatically, the same way for every pilot.                          */
/* ---------------------------------------------------------------------- */

/**
 * Percentage of the locked target achieved, given the locked baseline/target
 * and whatever the latest actual reading is. Works for both "increase"
 * KPIs (e.g. adoption going up) and "decrease" KPIs (e.g. resolution time
 * going down) with the same formula: how much of the *required change* did
 * the *actual change* deliver.
 */
export function computeKpiAchievement({ baseline, target, actual }) {
  if (actual === null || actual === undefined) return null;

  const requiredChange = target - baseline;
  const actualChange = actual - baseline;

  // Degenerate case: target === baseline (no change required). Met if the
  // actual reading didn't regress.
  const achievedPercent = requiredChange === 0
    ? (actualChange === 0 ? 100 : 0)
    : (actualChange / requiredChange) * 100;

  return Math.round(achievedPercent * 10) / 10;
}

/** Human-readable status bucket for a computed achievement percentage. */
export function kpiStatus(achievedPercent) {
  if (achievedPercent === null) return "Awaiting results";
  if (achievedPercent >= 100) return "Target met";
  if (achievedPercent >= 70) return "On track";
  if (achievedPercent >= 40) return "Behind target";
  return "At risk";
}

/**
 * Decorate every KPI on a pilot with its computed achievement %, leaving the
 * locked baseline/target/unit fields untouched — those are only ever set
 * once, at pilot creation.
 */
export function computePilotPerformance(pilot) {
  const kpis = (pilot.kpis || []).map((kpi) => {
    const achievedPercent = computeKpiAchievement(kpi);
    return { ...kpi, achievedPercent, status: kpiStatus(achievedPercent) };
  });

  const scored = kpis.filter((k) => k.achievedPercent !== null);
  const overallScore = scored.length
    ? Math.round((scored.reduce((s, k) => s + k.achievedPercent, 0) / scored.length) * 10) / 10
    : null;

  return {
    ...pilot,
    kpis,
    overallScore,
    overallStatus: kpiStatus(overallScore),
    kpisReported: scored.length,
    kpisTotal: kpis.length,
  };
}

/** Validate the locked-in shape of a single KPI target at pilot-creation time. */
export function validateKpiTarget(kpi) {
  if (!kpi || typeof kpi !== "object") return "Each KPI needs a label, baseline and target";
  if (!kpi.key || !kpi.label) return "Each KPI needs a key and a label";
  if (typeof kpi.baseline !== "number" || Number.isNaN(kpi.baseline)) return `${kpi.label || kpi.key}: baseline must be a number`;
  if (typeof kpi.target !== "number" || Number.isNaN(kpi.target)) return `${kpi.label || kpi.key}: target must be a number`;
  if (kpi.target === kpi.baseline) return `${kpi.label || kpi.key}: target must differ from baseline`;
  return null;
}
