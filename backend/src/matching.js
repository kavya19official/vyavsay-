/* ---------------------------------------------------------------------- */
/*  AI STARTUP DISCOVERY — matches startups in the database against a      */
/*  challenge's sector/theme instead of a department searching manually.   */
/* ---------------------------------------------------------------------- */

// Theme -> which startup tags count as an in-sector match.
const THEME_TAGS = {
  AgriTech: ["AgriTech"],
  HealthTech: ["HealthTech"],
  Mobility: ["Mobility"],
  CleanTech: ["CleanTech"],
  EdTech: ["EdTech"],
  Miscellaneous: [],
};

const SHORTLIST_THRESHOLD = 55;

function techFitScore(startup) {
  const trlScore = startup.trl.includes("7") || startup.trl.includes("6") ? 1 : startup.trl.includes("5") ? 0.7 : 0.4;
  return trlScore * (startup.dpiit ? 1 : 0.85);
}

/**
 * Score and sort every startup in the database against a challenge.
 * Weighting: 50% sector match, 30% past government-pilot experience, 20% tech fit.
 */
export function matchStartupsForChallenge(startups, challenge) {
  const wantedTags = THEME_TAGS[challenge?.theme] ?? [];
  return startups
    .map((s) => {
      const sectorMatch = wantedTags.length ? (s.tags.some((t) => wantedTags.includes(t)) ? 1 : 0) : 0.4;
      const govtExperienceScore = Math.min(s.pilots, 5) / 5;
      const techFit = techFitScore(s);
      const matchScore = Math.round(sectorMatch * 0.5 * 100 + govtExperienceScore * 0.3 * 100 + techFit * 0.2 * 100);
      return {
        ...s,
        matchScore,
        sectorMatch: sectorMatch > 0.5,
        govtExperience: s.pilots,
        shortlisted: matchScore >= SHORTLIST_THRESHOLD,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export { SHORTLIST_THRESHOLD, THEME_TAGS };
