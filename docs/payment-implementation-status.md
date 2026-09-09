# Payment implementation status

9 September 2026 — local seed-connected implementation

## Implemented

- Updated project source from vyavsay 3.zip is integrated. Earlier workspace source/data is preserved in backups/before-seed-payment-integration.zip.
- Reads actual seed/store-v3 contract IDs, supplier/challenge links, milestone amounts and delivery target dates. New contracts created in the upstream contracting module are discovered on refresh/background scan.
- Seed records labelled Paid are shown as unverified imported history, not successful bank transfers. Their amounts are conservatively reserved against the contract budget; they cannot be paid again in this workflow.
- Department explicitly enters and locks missing acceptance criteria and demo calendar-day policy before invoices are allowed. Pilot-design linkage is shown when supplied.
- Organisation-scoped demo accounts, backend role checks and expiring HTTP-only sessions. In Payments there is one active account selector; the unrelated original header role menu is disabled.
- Multiple milestones, invoice-number duplicate checks by supplier/year, immutable submission revisions, optional PDF/TXT download attachments, evidence fingerprints, and evidence reuse alerts.
- Criterion findings, acceptance, rejection, correction requests and original review-age tracking. Actual submission timestamps are never invented when an obligation is created.
- Optional independent pre-payment evidence review with a conflict declaration.
- Atomic SQLite transactions for one obligation per milestone, finance approvals, budget commitments and request-idempotency records. Amounts stored in integer paise.
- Simulated funding holds and locked reservations, separate approval/initiation/settlement, failure/retry and uncertain outcomes requiring reconciliation of the original attempt.
- Assigned independent dispute review, resolution/reopening and manual escalation. Open disputes block approval and new transfer initiation, not recognition of an already executed settlement.
- Minute-by-minute local deadline worker, in-app deduplicated review/payment/dispute alerts, persisted last-check time, visible worker errors and a monotonic demo clock for testing delays.
- Database-derived scoped dashboard totals and contract-view payment-status projection. Direct milestone status mutation endpoint is disabled.
- Normal application actions cannot overwrite submissions or audit events. Evidence downloads require an authorised session and use attachment-only headers.

## Still deliberately local or limited

- Supabase is not configured. Payment storage is SQLite using per-entity tables with JSON payloads and uniqueness indexes; it is not the final normalised PostgreSQL schema. No claim is made that a deployed Supabase integration has been tested. Upstream features continue using their original JSON store, now store-v3.json to preserve the prior workspace's store.json.
- Every account is a freely selectable demonstration identity. Real authentication, assignment provisioning, multi-factor authentication and comprehensive production access review are not implemented. The independent reviewer pool can inspect the local demo contracts; this is not production least-privilege case assignment.
- All funding and transfer results are simulated. No payment credentials, real payee details, provider webhooks, external invoice checks or treasury balances are connected.
- One full invoice/obligation per milestone. No partial payments, instalment allocation, automated tax deductions or reversal accounting.
- Payment clocks use explicitly chosen calendar-day demo terms only. Working-day calendars, holidays, statutory-source verification and configurable deadline extensions require further implementation.
- Notifications are saved in-app. There is no email/Slack delivery adapter or external durable notification worker. Checks run only while the backend is running and catch up on restart. Alerts are a historical register; their existence does not imply a breach is still unresolved—consult current status.
- PDF signatures/type/size are checked, but malware scanning and encryption/key management for uploaded documents are not implemented. Use non-sensitive demo documents only. Files are stored inside local SQLite payloads; accepted text versions cannot be edited through the API.
- Evidence reuse is a heuristic, not proof of fraud. There are no external cross-platform duplicate-work checks or calibrated statistical collusion detection. Optional independent review reduces risk but does not establish true independence automatically.
- Approved source amendments block further payment actions for reconciliation. An amendment approval screen is not yet implemented. Source relationships use the seed's department label to derive local IDs; real deployment needs authoritative organisation IDs.
- Platform database administrators and filesystem owners can still alter local records; audit events are protected through the application, not cryptographically immutable against administrators.
- Original features outside Payment still have demo data and permissive local routes. They need their own authentication/security work before any production deployment.

## Validation

Run npm test --prefix backend and npm run build --prefix frontend.

Tests cover seed mapping, imported-history handling, missing terms, source amendments, organisation separation, role abuse, amount tampering, duplicate invoices, corrections/version binding, one-obligation creation, independent checks, funding reservations, uncertain outcomes, retries, terminal settlement, deadlines, duplicate alerts, disputes, HTTP idempotency and restart persistence.
