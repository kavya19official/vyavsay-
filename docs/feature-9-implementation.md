# Feature 9 — Independent Validation (local implementation)

Implemented in the cloned repository. React/Vite frontend, Express backend and Node 24 built-in SQLite. No cloud credentials required. This is a local workflow demonstration, not verified government identity or legally authorised procurement software.

## Run and explore

From the repository root, run `npm start --prefix backend` in one terminal and `npm run dev --prefix frontend` in another. Backend defaults to 127.0.0.1:4001. Open the Vite URL and select Validation. Accounts are chosen inside the Validation workspace, separately from Payments. The workspace refreshes every 30 seconds; the backend worker runs every minute and on requests.

1. Select **Oversight administrator A**. Inspect real seed contracts and the two **PRACTICE** examples. Real records show missing prerequisites instead of receiving invented KPIs or evaluator identities.
2. In a practice example, read its assignment to see which demo validator was selected. Choose that validator in the account selector.
3. Declare no conflict (or enter a reason and withdraw). Read the evidence, enter the independently checked KPI value, findings, and evidence references. For the synthetic fixture the measurement is 90%, against an 85% target. Describe that this is a synthetic check.
4. Approve, reject or request corrections. The high-risk example requires two different agencies. Parallel reviewers cannot read one another's decisions. If the 12% sample selects the case, another agency must complete its re-audit. Sampling cannot be rerolled.
5. For corrections, select **Demo department**, create revised synthetic evidence, then request revalidation with a reason. This uses a fresh reviewer; prior snapshots and decisions remain available. For rejection or disagreement, the owning demo startup/department can appeal with evidence. The fresh adjudicator can uphold or require a fresh review; they cannot replace a failed outcome with approval.
6. Open **Scale-Up** for current backend readiness. Eligibility only permits consideration; it does not authorise procurement. Real live-rollout advancement also checks validation on the server.
7. Oversight can download a chain-head checkpoint and inspect assignment audit events. After a seven-day deadline, a replacement needs a proposal by one oversight account and approval by the other. Warnings never auto-approve a review.

No seed records are modified by practice actions. Example data stays explicitly synthetic and no real payment is initiated.

## Automated controls

- Readiness checks, report assembly, candidate filtering and workload-balanced secure random assignment.
- Stable evaluator-ID exclusion for every original evaluator, participant exclusion, known conflict exclusion, separate organisations and persistent recusal exclusion. No fallback to a conflicted pool. Fresh rounds exclude previously involved validators for that case; an exhausted pool stays pending.
- Mandatory dual review for High risk; policy stored in each round. Other classifications still receive a primary review. Each approved primary round is sampled once at 12% for a separate re-audit. Both selected and unselected results are persisted. Re-audits are not recursively sampled.
- Evidence snapshots, immutable decisions, assignment-version checks, authenticated demo sessions, organisation-scoped access, mutation idempotency and transactional audit writes.
- Mandatory KPI thresholds checked against recorded independent measurements; every approval needs per-KPI findings, evidence references and verification confirmation. Hashes prove unchanged content, not truth.
- Open disputes conservatively block validation; unpaid but undisputed obligations do not. Ordinary payment-status updates do not invalidate technical evidence. Material evidence changes block scale-up and require revalidation.
- Overdue alerts, anomaly checks, scale-up readiness and fail-closed progression into a live pilot-design phase.
- Anomaly flags for sufficiently sampled approval-rate outliers (10 own / 20 peers within risk class), repeated exact target values, repeated sub-minute decisions and repeated startup pairings. These are descriptive warnings, not fraud verdicts.

## Data contract for teammates

The current upstream records do not supply all of these fields. Do not populate them with guessed facts or identify a person by evaluation record ID.

- `contracts[].pilotId`: unique linked performance pilot. Legacy matching by challenge/startup works only for a unique candidate.
- `evaluations[].evaluatorId`: stable person ID for **each** original evaluation. All involved persons need consistent IDs across roles.
- `pilots[].completedAt`, `involvedUserIds`: completion and involved officials/collectors.
- Each `pilots[].kpis[]`: `key`, `label`, finite `baseline`, `target`, `actual`, `unit`, `mandatory` boolean, `method`, `lockedAt` timestamp and `evidence: {content, source, collectorId, collectedAt}`. Collection must follow target locking.
- Feature 8 supplies accepted milestones, criteria, submission evidence, payment obligations and disputes. Imported Paid is unverified and cannot count as accepted evidence.

These source records remain in the existing upstream store. Feature 9 never manufactures missing records or marks an imported settlement verified. The upstream editing endpoints currently use demo-level trust; production must secure and version those writers too.

## Files and integration

- `backend/src/validation/source.js`: seed/payment adapter, readiness checks and isolated synthetic fixtures.
- `backend/src/validation/domain.js`: assignments, snapshots, checks, decisions, appeals, audit, deadlines, anomaly flags and eligibility.
- `backend/src/validation/store.js`: SQLite transactions, append-only audit triggers and immutable snapshot/decision records.
- `backend/src/validation/service.js`: local sessions, access control, endpoints and periodic worker.
- `frontend/src/ValidationWorkspace.jsx`, `validation.css`: Validation and validation-driven Scale-Up readiness.
- `backend/server.js`: service wiring; `backend/src/routes.js`: server gate before live rollout.
- `backend/test/validation-v3.test.js`: domain, persistence and HTTP tests; `npm test --prefix backend` also runs Feature 8 regression tests.

API base `/api/validation`: `GET /accounts`, `POST /session`, `GET /`, `GET /checkpoint` (oversight), `POST /:caseId/:action`. Actions: `declare`, `recuse`, `decide`, `appeal`, `resubmit`, `demo-revise`, `propose-replacement`, `approve-replacement`, `review-flag`. Mutations require an `Idempotency-Key`; assignment actions also require `assignmentId` and `expectedVersion`. Browser retries after an uncertain network outcome reuse the original key. Scheduler jobs are not exposed as unauthenticated manual endpoints.

Runtime `backend/src/data/feature9.sqlite*` is local data and must not be committed. Resetting an active database is deliberately not offered as an application button. Session cookies are HttpOnly and SameSite=Strict; selectable identities are intentionally labelled demo accounts. Service binds to loopback through the existing server.

## Security boundary and follow-up integrations

No numerical prevention percentage or zero-collusion guarantee is claimed. Selectable demo accounts cannot prevent impersonation. Production requires verified identity and qualifications, a real conflict/organisation registry, MFA, consistent person IDs, enforced upstream authorisations, database role separation and independently retained audit checkpoints. The six validator agencies are synthetic, not empanelled agencies.

Hash chaining and SQL triggers detect/prevent ordinary application changes, but a privileged owner of the local machine can alter or replace the database and application. Checkpoint download is implemented; independent automatic anchoring, retention infrastructure, external signatures and production RLS are not connected. UI/API role redaction reduces identity exposure but cannot guarantee anonymity in field inspections or in user-authored reports.

The system assembles evidence references and stored submission descriptions; inspectors still verify authenticity and can inspect original documents through their authorised upstream workflow. It does not independently prove that an uploaded document or measurement is genuine. No external malware scanner, government payment gateway, legal rule engine or AI decision-maker is added.

All open payment disputes currently block review conservatively because Feature 8 does not yet classify disputes by technical versus purely financial impact. A future classified, authorised dispute policy can refine that gate. This conservative default does not require settlement before validation and therefore avoids a final-payment/validation circular dependency.

The old static Scale-Up screen is replaced with actual validation readiness; the broader Feature 10 procurement decision workflow remains future work. No commit or push is performed automatically.
