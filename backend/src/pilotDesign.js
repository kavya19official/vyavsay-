/* ---------------------------------------------------------------------- */
/*  SANDBOX / PILOT DESIGN — before any large rollout, the selected        */
/*  solution is tested in a small, controlled setting with scope and       */
/*  duration locked in upfront, and progresses through gated phases so     */
/*  nothing reaches live citizen data until the sandbox stage has passed.  */
/* ---------------------------------------------------------------------- */

import { randomUUID } from "node:crypto";

// A pilot design always moves through these phases in order. A phase can
// only become "Active" once every phase before it has "Passed" — this is
// what enforces "no live citizen data until sandbox passes".
export const PHASE_TEMPLATE = [
  { key: "sandbox", name: "Sandbox", description: "Isolated environment, synthetic or fully anonymised data only." },
  { key: "field", name: "Field Pilot", description: "Limited real-world deployment, real data under DPA-covered scope." },
  { key: "live", name: "Live Rollout", description: "Full production rollout with live citizen data." },
];

export function validatePilotDesign({ scopeLabel, durationMonths }) {
  if (!scopeLabel || !scopeLabel.trim()) return "scopeLabel is required (e.g. '1 district')";
  if (typeof durationMonths !== "number" || Number.isNaN(durationMonths) || durationMonths <= 0) {
    return "durationMonths must be a positive number";
  }
  return null;
}

/** Lock a pilot's scope and duration upfront, starting in the Sandbox phase. */
export function createPilotDesign({ challengeId, startupId, scopeLabel, durationMonths }) {
  return {
    id: `pd_${randomUUID()}`,
    challengeId,
    startupId: startupId || null,
    scopeLabel: scopeLabel.trim(),
    durationMonths,
    dataPolicy: "No live citizen data until the Sandbox phase passes.",
    phases: PHASE_TEMPLATE.map((p, i) => ({ ...p, status: i === 0 ? "Active" : "Locked" })),
    lockedAt: new Date().toISOString(),
  };
}

/**
 * Advance a pilot design to the next phase. Only the current Active phase
 * can be passed, and only in order — this is the gate that stops a live
 * rollout from happening before the sandbox (and field pilot) have proven out.
 */
export function advancePhase(pilotDesign) {
  const activeIdx = pilotDesign.phases.findIndex((p) => p.status === "Active");
  if (activeIdx === -1) return { error: "No active phase to advance — this pilot has already completed all phases." };
  pilotDesign.phases[activeIdx].status = "Passed";
  pilotDesign.phases[activeIdx].passedAt = new Date().toISOString();
  if (activeIdx + 1 < pilotDesign.phases.length) {
    pilotDesign.phases[activeIdx + 1].status = "Active";
  }
  return { pilotDesign };
}
