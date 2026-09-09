/* ---------------------------------------------------------------------- */
/*  MILESTONE-BASED CONTRACTING — once a startup is selected, draft a      */
/*  contract from everything already collected on the challenge (problem,  */
/*  budget, timeline) and split payment into stages instead of drafting    */
/*  one by hand.                                                           */
/* ---------------------------------------------------------------------- */

import { randomUUID } from "node:crypto";

// Standard 3-stage split — mirrors a typical sandbox → field-test → report
// pilot structure. Percentages must sum to 100.
export const MILESTONE_TEMPLATE = [
  { key: "sandbox", name: "Milestone 1 — Sandbox", percentage: 20 },
  { key: "field", name: "Milestone 2 — Field test", percentage: 30 },
  { key: "report", name: "Milestone 3 — Report", percentage: 50 },
];

export const MILESTONE_STATUSES = ["Draft", "Submitted", "Payment Approved", "Paid"];

const DEFAULT_DURATION_MONTHS = 4;

/**
 * Parse a display budget string like "₹18–35 L", "₹12 L", or "₹40–60 L"
 * (see challenge.budget) into a single rupee amount — the midpoint of a
 * range. Returns null for non-numeric budgets like "TBD".
 */
export function parseBudgetToAmount(budgetStr) {
  if (!budgetStr || /tbd/i.test(budgetStr)) return null;
  const isCrore = /cr/i.test(budgetStr);
  const multiplier = isCrore ? 1e7 : 1e5; // default unit is Lakh
  const nums = budgetStr
    .replace(/[₹,]/g, "")
    .match(/[\d.]+/g)
    ?.map(Number)
    .filter((n) => !Number.isNaN(n));
  if (!nums || !nums.length) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.round(avg * multiplier);
}

/** Format a rupee amount back into a compact display string (₹X.XX L / Cr). */
export function formatINR(amount) {
  if (amount == null) return "TBD";
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2).replace(/\.00$/, "")} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Draft a milestone-based contract for a startup selected against a
 * challenge, pulling in the budget already collected on the challenge and
 * splitting it into the standard 3-stage payment schedule, spread evenly
 * across the given duration.
 */
export function generateContract({ challenge, durationMonths, budgetOverride }) {
  const budgetAmount = budgetOverride != null ? budgetOverride : parseBudgetToAmount(challenge.budget);
  const months = durationMonths && durationMonths > 0 ? durationMonths : DEFAULT_DURATION_MONTHS;
  const now = new Date();

  const milestones = MILESTONE_TEMPLATE.map((m, i) => {
    const dueOffsetMonths = Math.round(((i + 1) / MILESTONE_TEMPLATE.length) * months);
    const due = new Date(now);
    due.setMonth(due.getMonth() + dueOffsetMonths);
    return {
      id: `ms_${randomUUID()}`,
      key: m.key,
      name: m.name,
      percentage: m.percentage,
      amount: budgetAmount != null ? Math.round((budgetAmount * m.percentage) / 100) : null,
      dueDate: due.toISOString(),
      status: "Draft",
    };
  });

  return {
    budgetAmount,
    budgetDisplay: formatINR(budgetAmount),
    durationMonths: months,
    milestones,
  };
}

/** Roll a contract's milestones up into totals — how much of the contract has actually been paid out. */
export function contractProgress(milestones) {
  const totalAmount = milestones.reduce((s, m) => s + (m.amount || 0), 0);
  const paidAmount = milestones.filter((m) => m.status === "Paid").reduce((s, m) => s + (m.amount || 0), 0);
  const paidPercentage = totalAmount ? Math.round((paidAmount / totalAmount) * 1000) / 10 : 0;
  return { totalAmount, totalDisplay: formatINR(totalAmount), paidAmount, paidDisplay: formatINR(paidAmount), paidPercentage };
}
