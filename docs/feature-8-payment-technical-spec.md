# Feature 8 Payment implementation specification

Revision 2 — 9 September 2026

This replaces the earlier two-boolean payment design. It specifies the target implementation, not functionality already present in the app. The current app remains a single-milestone SQLite demo until these changes are implemented.

The objective is to pay accepted work through a traceable approval process, detect stalled reviews, avoid duplicate obligations and transfers, and handle corrections and disputes. Technical controls can prevent specified invalid actions; they cannot prove delivery, eliminate collusion, or guarantee treasury funds and timely external settlement.

## 1 Scope and architecture

Keep React + Vite and the Express API. The target shared store is PostgreSQL through Supabase, with authenticated user sessions and private document storage. Features 5–7 provide approved pilot/contract records and evidence. Feature 9 supplies independent validation where the contract requires it.

Flow:

Startup invoice and evidence submission → department review → accepted work and valid invoice → one payment obligation → finance approval → payment attempt → verified settlement.

Parallel processes track review deadlines, overdue payments, funding holds, disputes, notifications, and independent checks.

The demo uses synthetic accounts, budget availability, and a payment simulator. Real identity provisioning, payment access, and treasury balance verification are separate integrations. Do not describe a manual simulator result as bank confirmation.

## 2 Data model

Use UUID primary keys, foreign keys, UTC server timestamps, organisation ownership, and revision numbers. Store INR amounts as integer paise using PostgreSQL BIGINT; validate safe numeric handling at the API boundary. Store currency explicitly. Do not use floating-point arithmetic for money. Derive record relationships from approved upstream records rather than trusting browser-supplied organisation IDs.

| Record | Required fields and purpose |
|---|---|
| User membership | user_id, organisation_id, authorised business role, active status, assignment scope; assigned by a trusted administrator, never self-selected production metadata |
| Contract version | contract_id, version, pilot_id, buyer_org_id, supplier_org_id, procurement_case_id, currency, approved ceiling, approved_at/by, payment_policy_version, status |
| Milestone version | milestone_id, version, approved contract version, deliverable, acceptance criteria, KPI definition references, maximum gross amount, required acceptance/validation gates |
| Payment policy | version, source reference, jurisdiction, review deadline, invoice-review deadline, payment clock trigger, day count, calendar/business-day basis, holiday calendar version, timezone, correction/dispute rules; mark assumptions as demo policies |
| Invoice | invoice_id, supplier_org_id, original and canonical invoice number, applicable numbering period, currency, original receipt time, current revision, validation status |
| Invoice revision | invoice_id, revision, submitted amount, issue date, private file reference, file hash, received_at/by, validation result and reason; preserve superseded revisions |
| Submission | submission_id, milestone version, invoice revision, evidence manifest/version, submitted_at/by, review_due_at, state, previous_submission_id for corrections |
| Evidence object | object_id, immutable storage version/key, content hash, size, detected file type, source/provenance, uploaded_at/by, access classification, scan status |
| Review decision | submission_id, reviewer_id, role, decision, reason, criterion-level findings, reviewed evidence manifest/hash, invoice revision, contract version, timestamp |
| Payment obligation | payment_id, milestone_id, obligation_key, contract/milestone version, accepted submission and invoice revision, approved gross/deduction/net snapshots, policy version, original_due_at, effective_due_at, status, accepted_at, approved_at/by |
| Budget reservation | payment_id, funding allocation ID, reserved amount, state, created/released/consumed timestamps; separates approved ceiling from funding availability |
| Payee reference | supplier_id, externally verified payee reference, verification state/version, change approval history; no raw bank details in ordinary payment responses |
| Payment attempt | attempt_id, payment_id, idempotency key, payee version, net amount/currency, provider reference, state, submitted_at, last_checked_at, simulator/live mode |
| Settlement | settlement_id, attempt_id, external event/reference, amount/currency, outcome, effective timestamp, received_at, verified source; corrections/reversals are new entries |
| Dispute or hold | case_id, record references, category, reason, evidence, assigned reviewer, opened_at, response_due_at, status, resolution and appeal history |
| Audit event | actor, action, affected ID, before/after revision, reason, server timestamp, request ID; protected from update/delete by normal application roles |
| Notification outbox | event_id, recipient, channel, deduplication key, payload reference, delivery state, attempt count, next_attempt_at, delivered_at |
| Escalation | affected record, breach type, policy version, escalation level, raised_at, assigned recipient, acknowledgement and resolution |

Initial scope: one full payment obligation per milestone. Reject partial invoices, instalment requests, and cross-milestone invoices until allocation support is explicitly implemented. Model deductions only through configured, reviewed rules; do not guess tax rates. Retrying payment never creates another obligation.

## 3 Database guarantees

- For the initial scope, UNIQUE(payment.milestone_id) guarantees one obligation per milestone. If instalments are introduced later, use a contract-defined instalment identifier and enforce aggregate limits.
- Enforce unique invoice identity using supplier, agreed numbering period, and canonical invoice number. Retain the original number. Corrections create revisions of the same invoice, not another payable invoice. Flag document duplicates and suspicious near-matches for review; do not auto-reject legitimate shared reports solely because their hashes match.
- Add foreign keys and checks for matching supplier, buyer, currency, contract, milestone and invoice relationships. A finance role alone is not permission to access every department's records.
- Enforce nonnegative amounts, valid deduction totals, and net = gross − deductions. Accepted amounts must fit the approved milestone and contract ceilings.
- Use UNIQUE(provider, event_id) for inbound settlement events and unique idempotency keys for outbound requests. Permit at most one unresolved payment attempt per obligation, including unknown outcomes.
- Lock relevant contract, funding allocation and payment rows while checking and reserving amounts. Concurrent approvals must not overspend. Use a consistent lock order and retry transaction conflicts safely.
- Record state changes, audit events, and notification intents in the same transaction. Handle database errors explicitly; never return a success response after a failed write.

## 4 Identity and permissions

Verify the authentication token server-side, then load trusted memberships and assignments. Reject unknown roles explicitly: never use “not department means startup.”

| Actor | Permitted operations |
|---|---|
| Supplier representative | Submit and correct their own organisation's invoices/evidence; view relevant payment records; raise disputes |
| Assigned department reviewer | Review assigned submissions, request corrections, accept or reject with reasons |
| Assigned finance officer | Review invoices and budget, approve eligible payments, initiate authorised attempts |
| Independent reviewer | Review assigned disputes or evidence checks, subject to conflict exclusions |
| Platform administrator | Manage assignments and investigate alerts; no automatic right to accept work or mark payments paid |
| Payment integration worker | Submit authorised instructions and reconcile authenticated provider results; no ability to approve delivery |

Use distinct identities for submission, department acceptance, and finance approval. A person with multiple memberships must not approve their own submission. Apply organisation restrictions to reads, mutations, summaries, exports, evidence downloads and database functions. Configure row-level security as a second layer; a server credential that bypasses it still needs explicit API permission checks. Keep privileged secrets out of frontend code.

Use secure sessions, CSRF protection where cookie authentication requires it, restricted origins, input limits and rate limiting. Return a generic inaccessible/not-found result for unauthorised record IDs.

## 5 Submission and review

1. Startup selects a milestone from its approved contract and uploads an invoice plus evidence. Backend verifies ownership and permitted state.
2. Save the original receipt timestamp and create a submission revision. Start a department-review deadline immediately, before any payment record exists. Track invoice verification on its own deadline too.
3. Department reviews each acceptance criterion against that exact submission. A fingerprint detects file replacement, not a false report. Prefer independently accessible logs or repeatable tests where available.
4. Accept, request correction, or reject. Corrections/rejections require a criterion-specific explanation and evidence references. Startup can challenge the decision.
5. Revisions retain the original history. New review deadlines may follow the approved policy, but total elapsed time since first submission and earlier breaches remain visible. Repeated correction cycles trigger escalation.
6. Freeze the accepted contract, invoice and evidence versions. A subsequent material change requires amendment and renewed approvals; it must not silently modify an accepted payment.

Before the pilot starts, features 5–6 must define measurable criteria, evidence requirements, review responsibilities and payment gates. A checkbox alone does not establish real-world delivery.

## 6 Atomic creation of the payment obligation

Use one transaction/database operation rather than separate Supabase update and insert requests. Outline:

```text
verify identity and review assignment
BEGIN
  lock submission and milestone
  confirm expected revision and permissible state
  verify contract approval and submission ownership
  verify required evidence, invoice and independent-review gates
  save department decision tied to exact reviewed versions
  if all obligation-creation conditions are satisfied:
    return existing obligation if already created for this milestone
    calculate amount and due date from approved records and policy
    insert one obligation with amount/version snapshots
    append audit event and notification intent
COMMIT
return persisted result
```

If invoice verification happens after delivery acceptance, its completion must invoke the same idempotent readiness operation. Either order should create exactly one obligation. Do not assign invoice receipt timestamps during payment creation.

A pre-payment independent check is required only where the approved contract/policy specifies it; final feature-9 validation must not block unrelated earlier milestone payments by default.

## 7 Deadline rules

Remove the blanket “GFR = 10 working days” assertion. Each payment uses a verified applicable policy or an explicitly labelled demo assumption.

Example demo policy: payment is due ten calendar days after both valid-invoice receipt and accepted delivery, using the later event. Policy must define whether a corrected invoice changes the qualifying receipt date and why. For business days, use the selected timezone, weekend rules and versioned holiday calendar. Define cutoff and rounding conventions.

Keep three separate measures:

- Review overdue: review deadline passed without a resolved review decision.
- Days pending: elapsed time since original submission (or settlement time for a completed record).
- Payment overdue: effective due date passed with an outstanding payable balance.

Do not replace payment status with “overdue.” An approved, processing, failed or uncertain payment can all be overdue. Holds and disputes remain visible alongside the age of the obligation. Do not automatically erase overdue time when a dispute opens. Any permitted due-date adjustment needs a policy reference, authorisation, old/new dates and a reason; retain the original date.

## 8 Finance approval and budget control

Finance checks invoice validity, accepted delivery, required reviews, approved amount, configured deductions, and verified payee reference. The payable amount is taken from approved records, never a browser field.

Within a transaction, reserve funds and verify that paid/committed obligations remain within the approved contract and funding allocation. Do not count the same obligation once as both reserved and consumed. Contract amendments require fresh checks. After acceptance, insufficient funding becomes an explicit funding hold; it must not hide or delete the obligation or its deadline.

At initiation, check that the reservation and approval are still valid. Simulated balances prove internal controls only; actual treasury availability needs an authorised source. Group related procurements for review to detect splitting across contracts; software cannot reliably identify every concealed relationship.

## 9 Payment states and safe retries

Payment status:

```text
approval_pending → approved → processing → paid
                              ↘ failed → approved/retry
                              ↘ status_unknown → reconciliation
```

Holds, disputes, overdue and escalation are separate attributes/records. Rejection of an invoice is not a settlement outcome. Cancellation is allowed only through an authorised workflow with no unresolved external attempt and recorded accounting/budget treatment. Never silently cancel accepted obligations.

Approval never marks a payment paid. Outbound integration steps:

1. Transactionally persist an authorised attempt and outbox instruction with a stable idempotency key, frozen amount and payee version.
2. A worker sends that instruction after commit. Re-delivery of the same instruction uses the same key.
3. If the response is lost or times out, mark the outcome unknown and query/reconcile the original attempt. Do not start a fresh attempt just because the network timed out.
4. A new attempt is allowed only after the prior attempt is confirmed terminal and unpaid. If provider finality cannot be established, require reconciliation/manual resolution before retry.
5. Authenticate inbound results and verify provider reference, amount, currency, account context and attempt. Reject mismatches and queue them for investigation.
6. Store provider events idempotently, tolerate duplicates and late/out-of-order events, and prevent a late failure message from overwriting verified settlement. Process genuine reversals as distinct financial events requiring reconciliation.
7. Mark paid only when the verified settlement satisfies the payable amount. Partial/unexpected settlements are reconciliation exceptions in the initial scope, not full success.

The simulator exercises these paths without money movement. Prevent simulated callbacks or simulator credentials from updating live records. Changes to payee details require separate verification and renewed approval; never silently redirect a pending transfer.

## 10 Scheduled checks and notifications

Run a durable scheduled worker, not a page-load calculation. For serverless deployment, configure a platform scheduler rather than assuming an in-process timer stays alive. Authenticate scheduler invocations and define timezone/cadence explicitly.

Each run:

1. Find unresolved department/invoice reviews past their deadline, including records with no payment yet.
2. Find all outstanding obligations past due, including approved, processing, failed, unknown and held records.
3. Escalate to the assigned supervisor/finance/dispute authority according to policy.
4. Insert deduplicated escalation records and notification outbox entries transactionally.
5. Retry failed notification delivery separately; record delivery failure and job health. “Escalated” does not mean an email was delivered.

Worker restarts or overlapping runs must not create duplicate alerts. Claim work with locks/leases and retry safely. Outbox replay may redeliver a notification if the channel lacks idempotency, so use provider deduplication where supported. Missed runs scan all outstanding breaches on recovery. Maintain last-success time and flag a stalled worker.

For demo testing, use an isolated test clock and synthetic records rather than editing accepted live timestamps.

## 11 Disputes and independent checks

Provide a visible dispute action for delayed review, rejected work, disputed amounts, and payment delay. Require a reason, attachments, assigned owner and response deadline. Preserve original acceptance/decision history.

Assign review to someone uninvolved in the disputed decision, with affiliation/conflict checks. Support recusal, escalation and appeal. If no eligible reviewer exists, explicitly queue for reassignment instead of weakening independence rules.

Use policy-defined risk-based and random evidence spot-checks. Record the selection so a user cannot repeatedly reassign to escape review. Compare claims with independent observations when possible. Reused evidence, repeated exact-target results or reviewer concentration are review signals, not proof of fraud. Avoid statistical claims from tiny samples and compare like-for-like pilots.

These measures make collusion harder to conceal; they cannot eliminate bribery, falsified source data or undisclosed relationships.

## 12 Evidence and audit protection

Private storage only: restricted file types/sizes, malware scanning or quarantine, safe download headers, short-lived authorised access and access logs. Do not render untrusted active documents as application content. Prevent normal users from overwriting accepted objects; bind acceptance to a manifest containing all reviewed object versions and hashes.

Keep sensitive payee information in a separate restricted store; finance access should be narrow and audited, not blanket platform-admin access. Redact secrets and sensitive account values from audit payloads and notifications.

Normal application roles cannot update/delete audit events. Record changes and audit entries atomically. Add protected backups and an independently restricted audit export/checkpoint for stronger tamper detection. A database administrator can still be a threat; do not label a normal SQL table “immutable” without explaining the protections and limits. Define retention and authorised deletion policies rather than promising permanent storage of all personal data.

## 13 API contract

All mutation requests require authentication, scoped permissions, validated inputs and request IDs. Use idempotency keys for creation/initiation and expected revisions for review/approval. Same key plus same payload returns the original result; same key plus different payload is rejected.

| Endpoint | Purpose |
|---|---|
| GET /api/milestones | List only accessible milestones |
| POST /api/milestones/:id/submissions | Submit invoice and evidence revision |
| POST /api/submissions/:id/reviews | Accept, request correction or reject the exact version |
| POST /api/invoices/:id/verification | Record authorised invoice verification |
| GET /api/payments | Scoped list with lifecycle, overdue and hold information |
| GET /api/payments/:id | Details, evidence access, attempts and permitted history |
| GET /api/payments/summary | Scoped aggregate totals |
| POST /api/payments/:id/approvals | Finance approval and budget reservation |
| POST /api/payments/:id/attempts | Initiate one authorised attempt |
| POST /api/payment-events/:provider | Authenticated provider events; no user-controlled paid endpoint |
| POST /api/disputes | Raise a dispute |
| POST /api/disputes/:id/decisions | Assigned independent resolution with reason |
| POST /api/payments/:id/escalations | Record a scoped manual escalation |
| POST /api/internal/deadline-check | Authenticated scheduled scan |

Reject undeclared writable fields. Standard outcomes: 401 unauthenticated, 403/404 inaccessible, 409 stale revision/invalid transition/conflicting idempotency use, 422 invalid inputs. Do not expose internal SQL errors or provider secrets.

## 14 Dashboard totals

Compute totals from persisted obligations and verified settlement records, not mutable milestone amounts or hardcoded values. Restrict the query to the caller's permitted organisations and currency.

- Paid this quarter: settled amount in a bounded quarter interval, with explicit reversal treatment.
- Pending approval: outstanding obligations awaiting finance approval.
- Overdue amount/count: all due outstanding obligations, regardless of lifecycle status; show holds separately.
- Delayed reviews: unresolved overdue submissions, even when no obligation exists.
- Average time to pay: actual elapsed duration from the defined invoice receipt event to settlement; show sample count and measurement period. Use elapsed seconds divided by 86,400 for calendar days rather than truncating interval days.
- Failed/unknown attempts: operational exceptions requiring action.

State whether totals are gross or net. Never double-count retries as separate payments. No-data averages should display “No settled payments yet,” not zero-day performance. Database aggregate functions need the same organisation restrictions as list endpoints.

## 15 Acceptance tests

The final prototype must demonstrate:

1. Unknown roles, forged role fields and users from another organisation cannot confirm/read/approve records.
2. Startup cannot approve its own delivery or payment, even with additional memberships.
3. Repeated and concurrent confirmations create exactly one obligation; either invoice/acceptance arrival order works.
4. Browser-edited amount, contract ID or payee reference cannot change the authorised payment.
5. Duplicate invoice submission is blocked; a legitimate correction preserves invoice identity/history.
6. Changed evidence or stale invoice/contract revision invalidates the attempted approval.
7. Two simultaneous approvals cannot exceed the funding allocation or contract ceiling.
8. Review delays trigger escalation before a payment exists; repeated corrections do not erase original age.
9. Weekend/holiday/timezone cases follow the selected policy; holds/revisions preserve original deadline history.
10. Approved/processing/failed payments can become overdue without losing their lifecycle state.
11. Scheduler restart/overlap produces deduplicated escalation records; delivery failure is retried and visible.
12. Payment timeout remains unknown and blocks a new attempt until reconciled.
13. Duplicate/forged/mismatched/out-of-order callbacks cannot cause double settlement or overwrite paid status.
14. Failure/retry retains one obligation; partial/unexpected settlement and reversal require reconciliation.
15. Payee change requires verification and renewed approval; simulator cannot mutate live records.
16. Dispute review excludes involved decision-makers and records reasons and appeal history.
17. Cross-organisation summaries/downloads are inaccessible; accepted evidence cannot be overwritten through normal APIs.
18. Restarting the application retains records, reservations, audit history and pending worker jobs.

## 16 Delivery sequence and honest limits

1. Shared PostgreSQL schema, constraints, organisation scoping and authenticated accounts.
2. Versioned invoice/evidence submission, review deadlines and correction/rejection workflow.
3. Atomic obligation creation, configurable policy clocks, finance approval and budget reservations.
4. Payment simulator with idempotency, unknown outcomes, safe retry and reconciliation tests.
5. Durable deadline worker, notification outbox, escalation and dispute queues.
6. Independent checks, scoped dashboards, audit protection and complete acceptance tests.
7. Authorised external payment/budget integration when available.

No AI call is required to decide amounts, permissions, deadlines or settlement status. Optional document extraction must remain reviewable and cannot approve or pay an invoice.

Fully demonstrable internal controls include permissions, concurrency, version binding, deadlines, budget arithmetic, disputes and safe simulated retries. Human collusion, genuine delivery, hidden duplicate work across inaccessible systems, actual fund availability and real settlement depend on evidence, governance and authorised external connections. Describe these as residual risks, not solved guarantees.
