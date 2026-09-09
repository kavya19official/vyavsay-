#!/usr/bin/env node
/**
 * Import real DPIIT-recognised startups into src/data/seed.json.
 *
 * Source dataset: "Startups Data: State and City wise list of Start-ups
 * Recognised by DPIIT in India" (Department for Promotion of Industry and
 * Internal Trade). Download a CSV export of it — e.g. from
 * https://dataful.in/datasets/20873 (free account) or search data.gov.in for
 * the current OGD catalog entry — then run this script against that file.
 *
 * Expected columns (rename your CSV's headers to match if they differ):
 *   state, city, company_name, legal_name, cin, company_website,
 *   company_status, focus_industry, focus_sector, services_provided
 *
 * Usage:
 *   node scripts/import-dpiit.js /path/to/dpiit-startups.csv
 *   node scripts/import-dpiit.js /path/to/dpiit-startups.csv --limit 50
 *
 * Fields this dataset does NOT provide (certifications, past government
 * pilots, technology readiness level) are left as safe defaults — they're
 * self-declared information a real platform would collect when a startup
 * signs up, not something any public registry tracks. Edit them by hand, or
 * wire up a startup-facing registration form that fills them in for real.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "..", "src", "data", "seed.json");

// Maps a company's focus_industry/focus_sector text to one of the platform's
// challenge themes, and to extra tags used for finer sector matching.
const INDUSTRY_TO_THEME = [
  { match: /agri|farm(?!aceut)/i, theme: "AgriTech", tag: "AgriTech" },
  { match: /health|pharma|biotech|medical|wellness/i, theme: "HealthTech", tag: "HealthTech" },
  { match: /transport|logistic|automotive|mobility/i, theme: "Mobility", tag: "Mobility" },
  { match: /energy|environment|clean\s?tech|waste|water/i, theme: "CleanTech", tag: "CleanTech" },
  { match: /education|edtech|learning|coaching/i, theme: "EdTech", tag: "EdTech" },
];

const EXTRA_TAGS = [
  { match: /machine learning|artificial intelligence|\bai\b|nlp|computer vision/i, tag: "AI/ML" },
  { match: /\biot\b|sensor/i, tag: "IoT" },
  { match: /marketplace|aggregator/i, tag: "Marketplace" },
  { match: /analytics|\bdata\b|gps|tracking/i, tag: "Analytics" },
];

function themeAndTagsFor(focusIndustry, focusSector) {
  const combined = `${focusIndustry || ""} ${focusSector || ""}`;
  const themeMatch = INDUSTRY_TO_THEME.find((t) => t.match.test(combined));
  const tags = new Set(themeMatch ? [themeMatch.tag] : []);
  for (const t of EXTRA_TAGS) if (t.match.test(combined)) tags.add(t.tag);
  if (tags.size === 0) tags.add(focusIndustry?.trim() || "Other");
  return { theme: themeMatch ? themeMatch.theme : "Miscellaneous", tags: [...tags] };
}

// Standard Indian CIN format: [L/U]NNNNN SS YYYY XXX NNNNNN — year is the
// 4-digit group in the middle. Partnership-firm registration numbers don't
// follow this format, so this returns null for those (caller falls back to
// a safe default).
function yearsActiveFromCin(cin) {
  const m = /^[LU]\d{5}[A-Z]{2}(\d{4})[A-Z]{3}\d+$/.exec((cin || "").trim());
  if (!m) return null;
  return Math.max(new Date().getFullYear() - parseInt(m[1], 10), 0);
}

function slugId(name, existingIds) {
  const base = "st_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  let id = base;
  let n = 2;
  while (existingIds.has(id)) id = `${base}_${n++}`;
  return id;
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-dpiit.js <path-to-csv> [--limit N]");
    process.exit(1);
  }
  const limitFlagIdx = process.argv.indexOf("--limit");
  const limit = limitFlagIdx !== -1 ? parseInt(process.argv[limitFlagIdx + 1], 10) : 100;

  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
  const existingIds = new Set(seed.startups.map((s) => s.id));

  let imported = 0;
  let skipped = 0;
  for (const row of rows) {
    if (imported >= limit) break;
    const name = (row.company_name || row.legal_name || "").trim();
    if (!name) { skipped++; continue; }

    const id = slugId(name, existingIds);
    const { theme, tags } = themeAndTagsFor(row.focus_industry, row.focus_sector);
    const yearsActive = yearsActiveFromCin(row.cin) ?? 2; // unknown -> conservative default

    seed.startups.push({
      id,
      name,
      sector: `${row.focus_industry || "Other"} · ${row.focus_sector || "General"}`,
      trl: "Not yet assessed",
      recog: "DPIIT Recognised",
      pilots: 0,
      rating: null,
      badge: "Under Review",
      loc: [row.city, row.state].filter(Boolean).join(", "),
      tags,
      registered: true,
      dpiit: true,
      yearsActive,
      certifications: [],
      cin: row.cin || null,
      website: (row.company_website || "").split(";")[0].trim() || null,
      source: "DPIIT Startup India (real)",
      _theme_hint: theme, // informational only — not read by the matching engine
    });
    existingIds.add(id);
    imported++;
  }

  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2));
  console.log(`Imported ${imported} real startups (skipped ${skipped} rows with no name).`);
  console.log(`Total startups in seed.json: ${seed.startups.length}`);
  console.log("Delete backend/src/data/store.json (or POST /api/admin/reset) to pick up the new seed on next run.");
}

main();
