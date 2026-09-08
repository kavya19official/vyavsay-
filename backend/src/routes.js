import { Router } from "express";
import { randomUUID } from "node:crypto";
import { readDB, writeDB, resetDB } from "./db.js";
import { matchStartupsForChallenge } from "./matching.js";
import { runEligibilityCheck } from "./eligibility.js";

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

/* --------------------------------- Admin -------------------------------- */
// Resets the demo data store back to its seed state.
router.post("/admin/reset", (_req, res) => {
  const db = resetDB();
  res.json({ ok: true, startups: db.startups.length, challenges: db.challenges.length, applications: db.applications.length });
});

export default router;
