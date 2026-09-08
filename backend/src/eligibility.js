/* ---------------------------------------------------------------------- */
/*  AUTO-ELIGIBILITY SCREENING — rule-based pass/fail run before an        */
/*  application ever reaches an evaluator.                                */
/* ---------------------------------------------------------------------- */

/**
 * Which rules apply to a given challenge. Medium/High risk challenges (i.e.
 * ones that involve real citizen or government data) additionally require a
 * valid security certification.
 */
export function eligibilityRequirementsFor(challenge) {
  const needsSecurityCert = !challenge || challenge.risk !== "Low";
  return [
    { key: "registered", label: "Business registration verified", critical: true, check: (a) => !!a.registered },
    { key: "experience", label: "Incorporated < 10 years (or DPIIT relaxation applies)", critical: false, check: (a) => a.yearsActive < 10 || a.dpiit },
    ...(needsSecurityCert
      ? [{ key: "cert", label: "Required certification: ISO 27001 (security)", critical: true, check: (a) => (a.certifications || []).includes("ISO 27001") }]
      : []),
  ];
}

/**
 * Run every requirement against a startup and derive an overall verdict.
 * A failed critical requirement (e.g. a missing mandatory certification)
 * auto-rejects the application before it reaches the evaluation stage.
 */
export function runEligibilityCheck(startup, challenge) {
  const requirements = eligibilityRequirementsFor(challenge);
  const results = requirements.map((r) => ({ key: r.key, label: r.label, critical: r.critical, pass: r.check(startup) }));
  const failedCritical = results.find((r) => !r.pass && r.critical);
  const failedAny = results.find((r) => !r.pass);

  let status;
  if (failedCritical) status = "Auto-Rejected";
  else if (failedAny) status = "Missing Documents";
  else status = "Eligible";

  return {
    status,
    reason: failedAny ? failedAny.label : null,
    autoRejected: !!failedCritical,
    results,
  };
}
