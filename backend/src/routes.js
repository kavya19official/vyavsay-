import { Router } from "express";
import { randomUUID } from "node:crypto";
import { readDB, writeDB, resetDB } from "./db.js";
import { matchStartupsForChallenge } from "./matching.js";
import { runEligibilityCheck } from "./eligibility.js";
import { structureRequirement } from "./structuring.js";
import { weightsForChallenge, rubricMessage, validateScores, computeTotal, rankEvaluations } from "./evaluation.js";

const router = Router();

function findChallenge(db, id) {
  return db.challenges.find((c) => c.id === id);
}

function findStartup(db, id) {
  return db.startups.find((s) => s.id === id);
}

/** Attach the computed eligibility verdict to a raw application record. */
function decorateApplication(app, db) {
  const startup = findStartup(db, app.startupId);
  const challenge = findChallenge(db, app.challengeId);
  const verdict = startup ? runEligibilityCheck(startup, challenge) : null;
  return { ...app, startup, ...verdict };
}

/** Attach the startup name to a raw evaluation record. */
function decorateEvaluation(ev, db) {
  const startup = findStartup(db, ev.startupId);
  return { ...ev, startupName: startup ? startup.name : "Unknown startup" };
}

function slugChallengeId(title, existingIds) {
  const base = "CH-" + (title || "challenge")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  let id = base;
  let n = 2;
  while (existingIds.has(id)) id = `${base}-${n++}`;
  return id;
}

router.get("/health", (_req, res) => res.json({ ok: true }));

/* ------------------------------- Startups ------------------------------ */
router.get("/startups", (_req, res) => {
  const db = readDB();
  res.json(db.startups);
});

/* ------------------------------ Challenges ------------------------------ */
router.get("/challenges", (_req, res) => {
  const db = readDB();
  res.json(db.challenges);
});

router.get("/challenges/:id", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });
  res.json(challenge);
});

/* ------------------- Feature 0: Challenge Identification ---------------- */
// Turns a department's free-form problem description into a standard,
// structured requirement statement instead of a free-form request. Stateless
// — call as many times as the department edits their draft.
router.post("/requirements/structure", (req, res) => {
  const { title, objective, beneficiaries, painPoint, outcome, constraints } = req.body || {};
  const result = structureRequirement({ title, objective, beneficiaries, painPoint, outcome, constraints });
  res.json(result);
});

// Publishes a new challenge (department fills the structured form -> this
// persists it, using the theme/requirement generated above). Every challenge
// created this way immediately works with AI Startup Discovery and
// Auto-Eligibility Screening, since those key off the same `theme`/`risk`
// fields as the seeded demo challenges.
router.post("/challenges", (req, res) => {
  const db = readDB();
  const { title, dept, budget, risk, theme, requirementStatement, capabilities, deadline, location } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });

  const existingIds = new Set(db.challenges.map((c) => c.id));
  const challenge = {
    id: slugChallengeId(title, existingIds),
    title: title.trim(),
    dept: dept?.trim() || "Unassigned Department",
    status: "Applications Open",
    apps: 0,
    budget: budget?.trim() || "TBD",
    deadline: deadline?.trim() || "Draft",
    theme: theme || "Miscellaneous",
    risk: risk || "Medium",
    requirementStatement: requirementStatement || null,
    capabilities: capabilities || [],
    location: location?.trim() || null,
  };

  db.challenges.push(challenge);
  writeDB(db);
  res.status(201).json(challenge);
});

/* --------------------- Feature 1: AI Startup Discovery ------------------ */
// Auto-shortlists startups from the database against a challenge's
// sector/theme and requirements, instead of a department searching manually.
router.get("/challenges/:id/discovery", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const matches = matchStartupsForChallenge(db.startups, challenge);
  const shortlisted = matches.filter((m) => m.shortlisted);

  res.json({
    challengeId: challenge.id,
    theme: challenge.theme,
    shortlistedCount: shortlisted.length,
    message: `${shortlisted.length} startups shortlisted — sorted by sector match, past government experience, and technology fit.`,
    matches,
  });
});

/* --------------------- Feature 2: Auto-Eligibility Screening ------------ */
// Lists applications for a challenge, each with a live rule-based verdict.
router.get("/challenges/:id/applications", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const apps = db.applications
    .filter((a) => a.challengeId === challenge.id)
    .map((a) => decorateApplication(a, db))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.json(apps);
});

// Submits a new application (a startup applying, or a department inviting a
// shortlisted startup) and immediately runs the eligibility check against it.
router.post("/challenges/:id/applications", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const { startupId } = req.body || {};
  const startup = findStartup(db, startupId);
  if (!startup) return res.status(400).json({ error: "Unknown startupId" });

  const already = db.applications.find((a) => a.challengeId === challenge.id && a.startupId === startupId);
  if (already) {
    return res.status(409).json({ error: "This startup has already applied to this challenge", application: decorateApplication(already, db) });
  }

  const application = { id: `ap_${randomUUID()}`, challengeId: challenge.id, startupId, submittedAt: new Date().toISOString() };
  db.applications.push(application);
  writeDB(db);

  res.status(201).json(decorateApplication(application, db));
});

/* ----------------------- Feature 4: Expert Evaluation -------------------- */
// A fixed scoring rubric (innovation, feasibility, cost, security,
// scalability) that every evaluator fills in and the system auto-totals and
// ranks — with weightings that shift automatically based on the challenge's
// risk profile, instead of relying on any one evaluator's personal judgement.
router.get("/challenges/:id/rubric", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const { risk, adjusted, weights } = weightsForChallenge(challenge);
  res.json({
    challengeId: challenge.id,
    riskProfile: risk,
    adjusted,
    weights,
    message: rubricMessage({ risk, adjusted, weights }),
  });
});

router.get("/challenges/:id/evaluations", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const rubric = weightsForChallenge(challenge);
  const evaluations = (db.evaluations || [])
    .filter((e) => e.challengeId === challenge.id)
    .map((e) => decorateEvaluation(e, db))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.json({
    challengeId: challenge.id,
    riskProfile: rubric.risk,
    adjusted: rubric.adjusted,
    weights: rubric.weights,
    message: rubricMessage(rubric),
    evaluations,
    ranking: rankEvaluations(evaluations),
  });
});

// An evaluator submits scores (0–10) for every rubric category against a
// startup. The weighted total and startup ranking are always derived from
// this same rubric, so every evaluator's scores are directly comparable.
router.post("/challenges/:id/evaluations", (req, res) => {
  const db = readDB();
  const challenge = findChallenge(db, req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const { startupId, evaluatorName, scores } = req.body || {};
  const startup = findStartup(db, startupId);
  if (!startup) return res.status(400).json({ error: "Unknown startupId" });
  if (!evaluatorName || !evaluatorName.trim()) return res.status(400).json({ error: "evaluatorName is required" });

  const scoreError = validateScores(scores);
  if (scoreError) return res.status(400).json({ error: scoreError });

  const rubric = weightsForChallenge(challenge);
  const total = computeTotal(scores, rubric.weights);

  const evaluation = {
    id: `ev_${randomUUID()}`,
    challengeId: challenge.id,
    startupId,
    evaluatorName: evaluatorName.trim(),
    scores,
    weights: rubric.weights,
    total,
    submittedAt: new Date().toISOString(),
  };

  db.evaluations = db.evaluations || [];
  db.evaluations.push(evaluation);
  writeDB(db);

  const allEvaluations = db.evaluations.filter((e) => e.challengeId === challenge.id).map((e) => decorateEvaluation(e, db));

  res.status(201).json({
    evaluation: decorateEvaluation(evaluation, db),
    ranking: rankEvaluations(allEvaluations),
  });
});

/* --------------------------------- Admin -------------------------------- */
// Resets the demo data store back to its seed state.
router.post("/admin/reset", (_req, res) => {
  const db = resetDB();
  res.json({
    ok: true,
    startups: db.startups.length,
    challenges: db.challenges.length,
    applications: db.applications.length,
    evaluations: (db.evaluations || []).length,
  });
});

export default router;
