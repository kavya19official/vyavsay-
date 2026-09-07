import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Target, Rocket, FileText, ClipboardCheck, FlaskConical,
  FileSignature, Wallet, ShieldCheck, TrendingUp, Library, Settings, Search,
  Bell, ChevronDown, Filter, Plus, ArrowRight, CheckCircle2, Clock,
  AlertTriangle, MapPin, Calendar, Building2, Users, Star, Download, Upload,
  Eye, X, ChevronRight, BadgeCheck, Landmark, FileCheck2, IndianRupee,
  ShieldAlert, UserCheck, Layers, ScrollText, Gauge, ArrowUpRight, Info,
  ChevronLeft, Sparkles, Lock,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  DESIGN TOKENS                                                          */
/* ---------------------------------------------------------------------- */
const C = {
  ink: "#06305C",
  inkSoft: "#516882",
  paper: "#F1F8FD",
  surface: "#FFFFFF",
  line: "#D9E7F2",
  lineStrong: "#AFC7DA",
  brass: "#D07A1F",
  brassSoft: "#FFF2DF",
  teal: "#068B69",
  tealSoft: "#E0F6EE",
  rust: "#B42318",
  rustSoft: "#FDE7E4",
  navySoft: "#E6F0FA",
  skySoft: "#E8F6FF",
  blue: "#0B5CAD",
  blueSoft: "#E5F1FC",
  violet: "#6B4FD6",
  violetSoft: "#F0ECFF",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=Roboto:wght@400;500;600;700&display=swap');";

const BODY_FONT = "'Noto Sans', Roboto, Arial, sans-serif";
const GUEST_BG_IMAGE = "/vyavsay-heritage-wide-bg.png?v=3";
/* Used for headline/display moments — same sans family, heavier weight, tight tracking. Not a second typeface. */
const serif = { fontFamily: BODY_FONT, fontWeight: 900, letterSpacing: 0 };
/* Used for IDs, codes and numeric data — Roboto with tabular figures, per govt SaaS numeral guidance. */
const mono = { fontFamily: "Roboto, Arial, sans-serif", fontVariantNumeric: "tabular-nums", fontWeight: 500 };
const tabular = { fontVariantNumeric: "tabular-nums" };

/* ---------------------------------------------------------------------- */
/*  LIFECYCLE                                                              */
/* ---------------------------------------------------------------------- */
const LIFECYCLE = [
  "Draft Challenge", "Under Review", "Published", "Applications Open",
  "Eligibility Screening", "Expert Evaluation", "Startup Shortlisted",
  "Pilot Design", "Contracting", "Pilot Active", "Milestone Review",
  "Payment Processing", "Independent Validation", "Scale-Up Review",
  "Scaled / Closed",
];

const STATUS_COLOR = {
  "Draft Challenge": ["#8A8D94", "#EDEDE9"],
  "Under Review": [C.brass, C.brassSoft],
  "Published": [C.teal, C.tealSoft],
  "Applications Open": [C.teal, C.tealSoft],
  "Eligibility Screening": [C.brass, C.brassSoft],
  "Expert Evaluation": [C.brass, C.brassSoft],
  "Startup Shortlisted": [C.teal, C.tealSoft],
  "Pilot Design": [C.ink, C.navySoft],
  "Contracting": [C.ink, C.navySoft],
  "Pilot Active": [C.teal, C.tealSoft],
  "Milestone Review": [C.brass, C.brassSoft],
  "Payment Processing": [C.brass, C.brassSoft],
  "Independent Validation": [C.ink, C.navySoft],
  "Scale-Up Review": [C.ink, C.navySoft],
  "Scaled / Closed": ["#0E4A3C", C.tealSoft],
  "At Risk": [C.rust, C.rustSoft],
  "Rejected": [C.rust, C.rustSoft],
};

function StatusChip({ label, small }) {
  const [fg, bg] = STATUS_COLOR[label] || ["#8A8D94", "#EDEDE9"];
  return (
    <span
      style={{
        color: fg,
        background: bg,
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 3,
        whiteSpace: "nowrap",
        letterSpacing: 0,
      }}
    >
      {label}
    </span>
  );
}

function Stepper({ current }) {
  const idx = LIFECYCLE.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", overflowX: "auto", gap: 0, paddingBottom: 4 }}>
      {LIFECYCLE.map((stage, i) => {
        const done = i < idx, active = i === idx;
        return (
          <div key={stage} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 92 }}>
              <div
                style={{
                  width: 22, height: 22, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                  background: active ? C.ink : done ? C.teal : "#fff",
                  color: active || done ? "#fff" : C.inkSoft,
                  border: `1.5px solid ${active ? C.ink : done ? C.teal : C.lineStrong}`,
                }}
              >
                {done ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <div
                style={{
                  fontSize: 9.5, marginTop: 5, textAlign: "center", lineHeight: 1.25,
                  color: active ? C.ink : C.inkSoft, fontWeight: active ? 700 : 500,
                }}
              >
                {stage}
              </div>
            </div>
            {i < LIFECYCLE.length - 1 && (
              <div style={{ width: 20, height: 1.5, background: done ? C.teal : C.line, marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PRIMITIVES                                                             */
/* ---------------------------------------------------------------------- */
function Card({ children, style, className = "", noPad }) {
  return (
    <div
      className={className}
      style={{
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6,
        boxShadow: "0 10px 28px rgba(6,48,92,0.055)",
        padding: noPad ? 0 : 18, ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, variant = "primary", icon: Icon, onClick, small, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600,
    fontSize: small ? 12.5 : 13.5, padding: small ? "6px 11px" : "9px 16px",
    borderRadius: 4, cursor: "pointer", border: "1px solid transparent", transition: "opacity .15s",
  };
  const variants = {
    primary: { background: C.ink, color: "#fff" },
    brass: { background: C.brass, color: "#fff" },
    secondary: { background: "#fff", color: C.ink, border: `1px solid ${C.lineStrong}` },
    ghost: { background: "transparent", color: C.inkSoft },
    danger: { background: "#fff", color: C.rust, border: `1px solid ${C.rust}55` },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseOver={(e) => (e.currentTarget.style.opacity = 0.85)}
      onMouseOut={(e) => (e.currentTarget.style.opacity = 1)}>
      {Icon && <Icon size={small ? 14 : 15} />}
      {children}
    </button>
  );
}

function Metric({ label, value, sub, icon: Icon, tone = C.ink }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 96 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11.5, color: C.inkSoft, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tone}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={tone} strokeWidth={2} />
        </div>
      </div>
      <div style={{ ...tabular, fontFamily: "Roboto, Arial, sans-serif", fontSize: 28, color: C.ink, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.inkSoft }}>{sub}</div>}
    </Card>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
        <div style={{ width: 4, borderRadius: 2, background: C.blue }} />
        <div>
          {eyebrow && <div style={{ fontSize: 11.5, color: C.blue, fontWeight: 700, letterSpacing: 0, marginBottom: 3 }}>{eyebrow}</div>}
          <h2 style={{ ...serif, fontSize: 24, color: C.ink, margin: 0 }}>{title}</h2>
        </div>
      </div>
      {right}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: `1px solid ${C.lineStrong}`, borderRadius: 4, padding: "9px 11px",
  fontSize: 13.5, color: C.ink, background: "#fff", fontFamily: BODY_FONT,
  boxSizing: "border-box",
};

function BrandMark({ light = false, size = 34 }) {
  const color = light ? "#FFFFFF" : C.ink;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: size, height: size, position: "relative", color }}>
        <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true">
          <path d="M8 31C12 18 20 11 32 10C26 15 22 22 20 34" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M15 34C20 22 29 16 41 17C34 21 29 27 27 37" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M7 37H42" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div style={{ ...serif, fontSize: 20, lineHeight: 1, color }}>Vyavsay</div>
        <div style={{ fontSize: 9.5, color: light ? "#D6E7F7" : C.inkSoft }}>Innovation. Collaboration. Impact.</div>
      </div>
    </div>
  );
}

function HeroArt() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 28, top: 44, width: 430, height: 230, opacity: 0.95 }}>
        <svg viewBox="0 0 430 230" width="100%" height="100%" fill="none" aria-hidden="true">
          <path d="M18 191H418" stroke="#B6D4EA" strokeWidth="2" />
          <path d="M266 84C298 71 327 71 360 85" stroke="#F29B3D" strokeWidth="9" strokeLinecap="round" />
          <path d="M278 101C308 91 334 91 366 103" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
          <path d="M290 118C319 110 344 111 374 122" stroke="#138B55" strokeWidth="9" strokeLinecap="round" />
          <circle cx="334" cy="102" r="8" stroke="#315D9A" strokeWidth="2" />
          <path d="M51 190V121H130V190" fill="#DDEDF9" stroke="#9EC4DE" />
          <path d="M67 121V98H114V121" fill="#CBE4F6" stroke="#9EC4DE" />
          <path d="M78 98V78H103V98" fill="#BCD9EC" stroke="#9EC4DE" />
          <path d="M45 121H136L126 108H56L45 121Z" fill="#F3C271" />
          <path d="M73 190V151C73 139 82 131 91 131C101 131 109 139 109 151V190" fill="#FFFFFF" stroke="#9EC4DE" />
          {[61,121].map((x) => <path key={x} d={`M${x} 135H${x + 16}V153H${x}V135Z`} fill="#FFFFFF" stroke="#9EC4DE" />)}
          <path d="M190 190V130H236V190" fill="#E6F3FB" stroke="#B6D4EA" />
          <path d="M251 190V112H286V190" fill="#D9ECF9" stroke="#B6D4EA" />
          <path d="M303 190V143H341V190" fill="#EAF6FC" stroke="#B6D4EA" />
          <path d="M358 190V124H392V190" fill="#D9ECF9" stroke="#B6D4EA" />
          <circle cx="159" cy="162" r="31" fill="#FFFFFF" stroke="#B6D4EA" />
          <path d="M142 164L155 176L178 148" stroke={C.teal} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="116" y="164" width="92" height="42" rx="8" fill="#FFFFFF" stroke="#B6D4EA" />
          <path d="M129 178H174M129 191H193" stroke="#86AFCB" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ position: "absolute", right: -60, bottom: -70, width: 360, height: 180, background: "rgba(11,92,173,0.08)", borderRadius: "50%" }} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MOCK DATA                                                              */
/* ---------------------------------------------------------------------- */
const CHALLENGES = [
  { id: "SIH26136", title: "Startup-friendly public procurement mechanism", dept: "Skills, Employment & Innovation", status: "Applications Open", apps: 14, budget: "₹18–35 L", deadline: "30 Sep 2026", theme: "Miscellaneous", risk: "Medium" },
  { id: "MH-AG-0091", title: "Early detection of crop disease & pest infestation", dept: "Agriculture", status: "Expert Evaluation", apps: 22, budget: "₹12–20 L", deadline: "12 Sep 2026", theme: "AgriTech", risk: "Low" },
  { id: "MH-HL-0044", title: "Rural primary healthcare access & quality", dept: "Public Health", status: "Startup Shortlisted", apps: 31, budget: "₹40–60 L", deadline: "Closed", theme: "HealthTech", risk: "High" },
  { id: "MH-TR-0022", title: "Real-time public transport tracking", dept: "Transport", status: "Pilot Active", apps: 9, budget: "₹25 L", deadline: "Closed", theme: "Mobility", risk: "Medium" },
  { id: "MH-ED-0013", title: "Aligning skilling programs to job market demand", dept: "Skills & Employment", status: "Under Review", apps: 0, budget: "TBD", deadline: "Draft", theme: "EdTech", risk: "Low" },
  { id: "MH-WT-0007", title: "Decentralised water-quality monitoring", dept: "Water Resources", status: "Independent Validation", apps: 17, budget: "₹22 L", deadline: "Closed", theme: "CleanTech", risk: "Medium" },
];

const STARTUPS = [
  { name: "AgriSense Labs", sector: "AgriTech · AI/ML", trl: "TRL 6", recog: "DPIIT Recognised", pilots: 3, rating: 4.6, badge: "Eligible", loc: "Pune, MH" },
  { name: "NirogStream", sector: "HealthTech · IoT", trl: "TRL 5", recog: "DPIIT Recognised", pilots: 1, rating: 4.2, badge: "Eligible", loc: "Nagpur, MH" },
  { name: "TrackNova", sector: "Mobility · GPS/Analytics", trl: "TRL 7", recog: "Startup India Seed Funded", pilots: 5, rating: 4.8, badge: "Verified", loc: "Mumbai, MH" },
  { name: "JalMitra", sector: "CleanTech · Sensors", trl: "TRL 6", recog: "DPIIT Recognised", pilots: 2, rating: 4.4, badge: "Eligible", loc: "Aurangabad, MH" },
  { name: "SkillBridge AI", sector: "EdTech · NLP", trl: "TRL 4", recog: "DPIIT Recognised", pilots: 0, rating: "New", badge: "Under Review", loc: "Nashik, MH" },
  { name: "MarketLinkr", sector: "AgriTech · Marketplace", trl: "TRL 7", recog: "Incubator Certified", pilots: 4, rating: 4.5, badge: "Verified", loc: "Kolhapur, MH" },
];

const EVAL_CRITERIA = [
  { k: "Technical Feasibility", v: 8 }, { k: "Innovation", v: 9 },
  { k: "Cost Effectiveness", v: 7 }, { k: "Scalability", v: 8 },
  { k: "Implementation Capacity", v: 7 }, { k: "Risk", v: 3 },
];

const MILESTONES = [
  { n: "M1 — Sandbox setup & data access", due: "10 Oct 2026", amt: "₹4,00,000", status: "Payment Processing" },
  { n: "M2 — Pilot deployment, 3 districts", due: "05 Nov 2026", amt: "₹8,00,000", status: "Milestone Review" },
  { n: "M3 — Mid-pilot performance report", due: "20 Dec 2026", amt: "₹5,00,000", status: "Pilot Active" },
  { n: "M4 — Final validation & handover", due: "15 Feb 2027", amt: "₹6,00,000", status: "Draft Challenge" },
];

const PAYMENTS = [
  { startup: "TrackNova", milestone: "M1 — Sandbox setup", amt: "₹4,00,000", status: "Paid", days: "—" },
  { startup: "AgriSense Labs", milestone: "M2 — Field deployment", amt: "₹6,50,000", status: "Approval Pending", days: "4 days" },
  { startup: "JalMitra", milestone: "M1 — Sensor install", amt: "₹3,20,000", status: "Overdue", days: "11 days" },
  { startup: "NirogStream", milestone: "M3 — Report submission", amt: "₹2,80,000", status: "Invoice Uploaded", days: "1 day" },
];

const TEMPLATES = [
  { name: "Outcome-Based Problem Statement", cat: "Challenge Design", v: "v3.2", approved: true, updated: "18 Aug 2026" },
  { name: "Evaluation Scoring Rubric", cat: "Evaluation", v: "v2.0", approved: true, updated: "02 Jul 2026" },
  { name: "Pilot / Sandbox Agreement", cat: "Contracting", v: "v4.1", approved: true, updated: "29 Aug 2026" },
  { name: "Data & IP Ownership Clauses", cat: "Legal", v: "v2.4", approved: true, updated: "11 Aug 2026" },
  { name: "Cybersecurity Requirements Checklist", cat: "Security", v: "v1.6", approved: true, updated: "05 Jun 2026" },
  { name: "Risk Management Framework", cat: "Risk", v: "v1.3", approved: false, updated: "22 May 2026" },
  { name: "Procurement Pathway Selector", cat: "Procurement", v: "v2.1", approved: true, updated: "14 Aug 2026" },
];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "challenges", label: "Challenges", icon: Target },
  { key: "marketplace", label: "Startup Marketplace", icon: Rocket },
  { key: "evaluation", label: "Evaluations", icon: ClipboardCheck },
  { key: "pilots", label: "Pilots", icon: FlaskConical },
  { key: "contracts", label: "Contracts", icon: FileSignature },
  { key: "payments", label: "Payments", icon: Wallet },
  { key: "validation", label: "Validation", icon: ShieldCheck },
  { key: "scaleup", label: "Scale-Up", icon: TrendingUp },
  { key: "templates", label: "Templates", icon: Library },
  { key: "admin", label: "Admin", icon: Settings },
];

const ROLES = ["Government Official", "Startup", "Expert Evaluator", "Validation Agency", "Platform Admin"];

/* ---------------------------------------------------------------------- */
/*  APP SHELL                                                              */
/* ---------------------------------------------------------------------- */
/* ---------------------------------------------------------------------- */
/*  GUEST OVERVIEW — explains the product before entering the workspace    */
/* ---------------------------------------------------------------------- */
function Overview({ onEnter }) {
  const govtProblems = [
    "Formulating outcome-based problem statements",
    "Discovering suitable, eligible startups",
    "Evaluating novel, unproven technology",
    "Structuring controlled pilots",
    "Managing IP and data ownership",
    "Measuring pilot results objectively",
    "Moving a successful pilot into compliant procurement",
  ];
  const startupProblems = [
    "Prior-turnover / experience eligibility rules",
    "Long, opaque government sales cycles",
    "Unclear payment milestones",
    "Little visibility into what departments actually need",
  ];
  const stats = [
    { v: "57", l: "Active problem statements" },
    { v: "193", l: "Software + hardware challenges" },
    { v: "128", l: "Registered startups" },
    { v: "18", l: "Departments onboarded" },
  ];

  return (
    <div style={{ background: `linear-gradient(180deg, #F6FBFF 0%, ${C.paper} 100%)` }}>
      {/* national tricolour strip — kept subtle as an official cue */}
      <div style={{ height: 4, display: "flex" }}>
        <div style={{ flex: 1, background: "#E57A20" }} />
        <div style={{ flex: 1, background: "#FFFFFF" }} />
        <div style={{ flex: 1, background: "#0F7A3A" }} />
      </div>

      <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, boxShadow: "0 8px 26px rgba(6,48,92,0.05)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, paddingRight: 22, borderRight: `1px solid ${C.lineStrong}` }}>
            <Landmark size={22} color={C.ink} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.ink }}>Government of India</div>
              <div style={{ fontSize: 9.5, color: C.inkSoft }}>Ministry of Electronics & IT</div>
            </div>
          </div>
          <BrandMark />
          <nav style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20, fontSize: 11.5, color: C.inkSoft, fontWeight: 700 }}>
            <span>Home</span>
            <span>How It Works</span>
            <span>For Departments</span>
            <span>For Startups</span>
            <span>About</span>
          </nav>
          <Btn variant="secondary" small onClick={() => onEnter("Startup")}>Explore Challenges</Btn>
          <Btn small onClick={() => onEnter("Government Official")}>Register Your Startup</Btn>
        </div>
      </header>

      {/* HERO BAND — civic illustration background with a readability overlay */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 38%, #F3FAFF 72%, #EEF8FF 100%)`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <img
          src={GUEST_BG_IMAGE}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: 0.58,
            filter: "saturate(0.96) contrast(0.96)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.78) 38%, rgba(241,248,253,0.42) 72%, rgba(241,248,253,0.28) 100%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "54px 28px 46px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 38, alignItems: "center" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.blueSoft, color: C.blue, padding: "6px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 800, marginBottom: 16 }}>
                <Sparkles size={13} /> Viksit Bharat through innovation
              </div>
              <h1 style={{ ...serif, fontSize: 40, lineHeight: 1.14, margin: 0, marginBottom: 16, maxWidth: 620, color: C.ink }}>
                From government problems to startup solutions — <span style={{ color: C.teal }}>faster.</span>
              </h1>
              <p style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.68, maxWidth: 540, marginBottom: 22 }}>
                Vyavsay is the procurement pathway for challenges that don't fit standard tendering: define the
                problem, discover eligible startups, run a controlled pilot, pay on verified milestones, get an
                independent validation report, then decide whether to scale, all on one auditable record.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn icon={ArrowRight} onClick={() => onEnter("Government Official")}>Explore Challenges</Btn>
                <Btn variant="secondary" icon={Rocket} onClick={() => onEnter("Startup")}>Register Your Startup</Btn>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
                <span onClick={() => onEnter("Expert Evaluator")} style={{ fontSize: 12, color: C.blue, fontWeight: 700, cursor: "pointer" }}>Evaluator login →</span>
                <span onClick={() => onEnter("Validation Agency")} style={{ fontSize: 12, color: C.blue, fontWeight: 700, cursor: "pointer" }}>Validation agency login →</span>
                <span onClick={() => onEnter("Platform Admin")} style={{ fontSize: 12, color: C.blue, fontWeight: 700, cursor: "pointer" }}>Admin login →</span>
              </div>
            </div>

            <Card style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.88)", border: `1px solid ${C.line}`, boxShadow: "0 24px 60px rgba(6,48,92,0.12)", backdropFilter: "blur(5px)" }}>
              <div style={{ fontSize: 11, color: C.blue, fontWeight: 800, letterSpacing: 0, marginBottom: 14 }}>PLATFORM AT A GLANCE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {stats.map((s) => (
                  <div key={s.l} style={{ padding: 14, borderRadius: 8, background: C.skySoft, border: `1px solid ${C.line}` }}>
                    <div style={{ ...tabular, fontFamily: "Roboto, Arial, sans-serif", fontSize: 28, fontWeight: 800, color: C.ink }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2, fontWeight: 600 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 28px 64px" }}>
      <Card style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>The 9-stage pathway every challenge moves through</div>
        <Stepper current="Pilot Design" />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Building2 size={16} color={C.ink} />
            <div style={{ fontWeight: 700, fontSize: 14 }}>What it solves for departments</div>
          </div>
          {govtProblems.map((p) => (
            <div key={p} style={{ display: "flex", gap: 8, fontSize: 12.8, color: C.inkSoft, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
              <CheckCircle2 size={14} color={C.teal} style={{ flexShrink: 0, marginTop: 1 }} /> {p}
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Rocket size={16} color={C.ink} />
            <div style={{ fontWeight: 700, fontSize: 14 }}>What it solves for startups</div>
          </div>
          {startupProblems.map((p) => (
            <div key={p} style={{ display: "flex", gap: 8, fontSize: 12.8, color: C.inkSoft, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
              <CheckCircle2 size={14} color={C.teal} style={{ flexShrink: 0, marginTop: 1 }} /> {p}
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 12, color: C.inkSoft }}>
            Relaxed turnover/experience criteria apply to DPIIT-recognised startups on eligible challenges.
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 12, color: C.inkSoft }}>
          Built on standard, legally-cleared templates for problem statements, evaluation, pilot agreements, data/IP,
          cybersecurity, risk and procurement pathways.
        </div>
        <Btn variant="ghost" small icon={Library} onClick={() => onEnter("Government Official")}>Browse the template library →</Btn>
      </div>
      </div>
    </div>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState("dashboard");
  const [role, setRole] = useState("Government Official");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const goDetail = (ch) => { setSelectedChallenge(ch); setView("challenge-detail"); };

  const enterAs = (r) => { setRole(r); setEntered(true); };

  if (!entered) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: BODY_FONT }}>
        <style>{FONT_IMPORT}</style>
        <Overview onEnter={enterAs} />
      </div>
    );
  }

  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: BODY_FONT, fontSize: 14, display: "flex" }}>
      <style>{FONT_IMPORT}</style>
      {/* SIDEBAR */}
      <aside style={{ width: 216, flexShrink: 0, borderRight: `1px solid ${C.line}`, background: "#FAFDFF", position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.line}` }}>
          <div onClick={() => setEntered(false)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} title="Back to overview">
            <BrandMark size={30} />
          </div>
        </div>
        <nav style={{ padding: "10px 10px", flex: 1, overflowY: "auto" }}>
          {NAV.map((n) => {
            const active = view === n.key || (n.key === "challenges" && view === "challenge-detail") || (n.key === "challenges" && view === "create-challenge");
            const Icon = n.icon;
            return (
              <div key={n.key} onClick={() => setView(n.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 4,
                  cursor: "pointer", marginBottom: 2, fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? C.blueSoft : "transparent", color: active ? C.blue : C.inkSoft,
                  borderLeft: active ? `3px solid ${C.blue}` : "3px solid transparent",
                }}>
                <Icon size={15} />
                {n.label}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: 14, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 10.5, color: C.inkSoft, marginBottom: 6, fontWeight: 600 }}>PLATFORM INTEGRITY</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.teal, fontWeight: 600 }}>
            <ShieldCheck size={13} /> Audit trail active
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* TOPBAR */}
        <header style={{ height: 64, borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", padding: "0 22px", gap: 16, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: 10 }} color={C.inkSoft} />
            <input placeholder="Search challenges, startups, departments…"
              style={{ ...inputStyle, paddingLeft: 32, background: "#F4FAFF", border: `1px solid ${C.line}`, borderRadius: 999 }} />
          </div>
          <div style={{ flex: 1 }} />
          <Bell size={17} color={C.inkSoft} style={{ cursor: "pointer" }} />
          <div style={{ position: "relative" }}>
            <div onClick={() => setRoleMenuOpen((s) => !s)}
              style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", border: `1px solid ${C.line}`, borderRadius: 4, padding: "6px 10px" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.brassSoft, color: C.brass, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {role[0]}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{role}</div>
              <ChevronDown size={14} color={C.inkSoft} />
            </div>
            {roleMenuOpen && (
              <div style={{ position: "absolute", right: 0, top: 38, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 5, width: 200, boxShadow: "0 6px 18px rgba(20,33,61,0.1)", zIndex: 20 }}>
                <div style={{ padding: "8px 12px", fontSize: 10.5, color: C.inkSoft, fontWeight: 700, borderBottom: `1px solid ${C.line}` }}>VIEW PLATFORM AS</div>
                {ROLES.map((r) => (
                  <div key={r} onClick={() => { setRole(r); setRoleMenuOpen(false); }}
                    style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", fontWeight: r === role ? 700 : 500, color: r === role ? C.ink : C.inkSoft }}>
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main style={{ padding: 26, maxWidth: 1320 }}>
          {view === "dashboard" && <Dashboard role={role} onOpenChallenge={goDetail} setView={setView} />}
          {view === "challenges" && <ChallengesList onOpen={goDetail} onCreate={() => setView("create-challenge")} />}
          {view === "challenge-detail" && <ChallengeDetail ch={selectedChallenge || CHALLENGES[0]} onBack={() => setView("challenges")} />}
          {view === "create-challenge" && <CreateChallenge onDone={() => setView("challenges")} />}
          {view === "marketplace" && <Marketplace />}
          {view === "evaluation" && <EvaluationWorkspace />}
          {view === "pilots" && <Pilots />}
          {view === "contracts" && <Contracts />}
          {view === "payments" && <Payments />}
          {view === "validation" && <Validation />}
          {view === "scaleup" && <ScaleUp />}
          {view === "templates" && <Templates />}
          {view === "admin" && <Admin />}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DASHBOARD                                                              */
/* ---------------------------------------------------------------------- */
function Dashboard({ role, onOpenChallenge, setView }) {
  const metrics = {
    "Government Official": [
      { label: "Active Challenges", value: "32", icon: Target, sub: "+4 this month" },
      { label: "Applications Received", value: "241", icon: FileText, sub: "128 startups" },
      { label: "Pilots in Progress", value: "18", icon: FlaskConical, sub: "6 depts" },
      { label: "Avg. Challenge → Pilot Time", value: "37 d", icon: Gauge, sub: "↓ 12d vs last cycle" },
      { label: "Payments Pending", value: "₹19.4 L", icon: Wallet, sub: "4 invoices" },
      { label: "Compliance Score", value: "94%", icon: BadgeCheck, sub: "Legal-approved templates used" },
    ],
    "Startup": [
      { label: "Open Challenges Matching You", value: "11", icon: Target, sub: "Based on sector tags" },
      { label: "Applications Submitted", value: "6", icon: FileText, sub: "2 shortlisted" },
      { label: "Active Pilots", value: "1", icon: FlaskConical, sub: "TrackNova · Transport Dept." },
      { label: "Milestones Completed", value: "3 / 4", icon: CheckCircle2, sub: "M4 due 15 Feb" },
      { label: "Payments Received", value: "₹4.0 L", icon: IndianRupee, sub: "₹6.5L pending approval" },
      { label: "Profile Rating", value: "4.8", icon: Star, sub: "Verified · 5 past pilots" },
    ],
    "Expert Evaluator": [
      { label: "Assigned Reviews", value: "9", icon: ClipboardCheck, sub: "3 due this week" },
      { label: "Completed Evaluations", value: "47", icon: CheckCircle2, sub: "This cycle" },
      { label: "Avg. Turnaround", value: "3.2 d", icon: Clock, sub: "SLA: 5 days" },
      { label: "Conflict Declarations", value: "0", icon: ShieldAlert, sub: "None flagged" },
    ],
    "Validation Agency": [
      { label: "Pilots Assigned", value: "6", icon: FlaskConical, sub: "2 site visits due" },
      { label: "Validation Reports Filed", value: "14", icon: FileCheck2, sub: "This year" },
      { label: "Recommendation Split", value: "71% Scale", icon: TrendingUp, sub: "20% Revise · 9% Stop" },
      { label: "Flags Raised", value: "2", icon: AlertTriangle, sub: "Under department review" },
    ],
    "Platform Admin": [
      { label: "Departments Onboarded", value: "18", icon: Building2, sub: "Maharashtra state-wide" },
      { label: "Registered Startups", value: "128", icon: Rocket, sub: "+9 this month" },
      { label: "SLA Breaches", value: "5", icon: AlertTriangle, sub: "Payment stage" },
      { label: "Bottleneck: Eligibility Screening", value: "6.4 d", icon: Gauge, sub: "Avg. wait, target 3d" },
    ],
  };
  const metricTones = [C.brass, C.teal, C.violet, C.blue, C.rust, C.teal];

  return (
    <div>
      <Card style={{ position: "relative", overflow: "hidden", marginBottom: 22, minHeight: 138, background: `linear-gradient(110deg, #FFFFFF 0%, ${C.skySoft} 100%)` }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 620 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.blueSoft, color: C.blue, padding: "5px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 800, marginBottom: 12 }}>
            <ShieldCheck size={13} /> Trusted government-startup workspace
          </div>
          <h1 style={{ ...serif, fontSize: 26, margin: 0, color: C.ink }}>
            Welcome back, {role === "Startup" ? "Aabhanshi" : role}
          </h1>
          <p style={{ fontSize: 13.2, color: C.inkSoft, lineHeight: 1.6, maxWidth: 560, margin: "8px 0 0" }}>
            Track challenges, pilots, contracts, validation evidence and payments through one transparent Vyavsay pipeline.
          </p>
        </div>
        <div style={{ position: "absolute", right: 18, bottom: -5, width: 290, opacity: 0.56 }}>
          <svg viewBox="0 0 320 120" width="100%" height="100%" fill="none" aria-hidden="true">
            <path d="M4 105H316" stroke="#9EC4DE" strokeWidth="2" />
            <path d="M188 105V58H227V105M195 58V45H220V58M202 45V35H213V45" fill="#CFE7F8" stroke="#9EC4DE" />
            <path d="M238 105V70H268V105M279 105V48H304V105M137 105V78H174V105" fill="#E2F2FC" stroke="#B6D4EA" />
            <path d="M25 105V68H92V105M37 68V53H80V68M48 53V39H69V53" fill="#D7ECFA" stroke="#9EC4DE" />
            <path d="M20 68H98L89 58H29L20 68Z" fill="#F4C879" />
          </svg>
        </div>
      </Card>
      <SectionTitle
        eyebrow={role.toUpperCase()}
        title={role === "Startup" ? "Your pipeline, at a glance" : "Innovation procurement overview"}
        right={role === "Government Official" && <Btn icon={Plus} onClick={() => setView("create-challenge")}>New Challenge</Btn>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 24 }}>
        {(metrics[role] || metrics["Government Official"]).map((m, i) => <Metric key={m.label} {...m} tone={m.tone || metricTones[i % metricTones.length]} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Challenges requiring attention</div>
            <span onClick={() => setView("challenges")} style={{ fontSize: 12.5, color: C.brass, fontWeight: 600, cursor: "pointer" }}>View all →</span>
          </div>
          <ChallengeTable rows={CHALLENGES.slice(0, 5)} onOpen={onOpenChallenge} compact />
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Risk & compliance snapshot</div>
          {[
            { l: "Pilots with unresolved risk flags", v: "2", tone: C.rust },
            { l: "Milestone payments overdue", v: "1", tone: C.rust },
            { l: "Templates pending legal approval", v: "1", tone: C.brass },
            { l: "Validated pilots ready to scale", v: "3", tone: C.teal },
          ].map((r) => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 12.5, color: C.inkSoft }}>{r.l}</span>
              <span style={{ fontWeight: 700, color: r.tone }}>{r.v}</span>
            </div>
          ))}
          <Btn variant="secondary" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} icon={ShieldCheck} small>
            Open audit log
          </Btn>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CHALLENGE TABLE (shared)                                               */
/* ---------------------------------------------------------------------- */
function ChallengeTable({ rows, onOpen, compact }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.8 }}>
      <thead>
        <tr style={{ textAlign: "left", color: C.inkSoft, fontSize: 11 }}>
          <th style={{ padding: "6px 8px", fontWeight: 600 }}>ID</th>
          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Title</th>
          {!compact && <th style={{ padding: "6px 8px", fontWeight: 600 }}>Department</th>}
          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Status</th>
          {!compact && <th style={{ padding: "6px 8px", fontWeight: 600 }}>Applications</th>}
          {!compact && <th style={{ padding: "6px 8px", fontWeight: 600 }}>Budget</th>}
          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Deadline</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onOpen(r)} style={{ borderTop: `1px solid ${C.line}`, cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.background = C.paper)}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={{ padding: "9px 8px", ...mono, fontSize: 11.5, color: C.inkSoft }}>{r.id}</td>
            <td style={{ padding: "9px 8px", fontWeight: 600 }}>{r.title}</td>
            {!compact && <td style={{ padding: "9px 8px", color: C.inkSoft }}>{r.dept}</td>}
            <td style={{ padding: "9px 8px" }}><StatusChip label={r.status} small /></td>
            {!compact && <td style={{ padding: "9px 8px" }}>{r.apps}</td>}
            {!compact && <td style={{ padding: "9px 8px" }}>{r.budget}</td>}
            <td style={{ padding: "9px 8px", color: r.deadline === "Closed" ? C.inkSoft : C.rust }}>{r.deadline}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------------------------------------------------------------- */
/*  CHALLENGES LIST                                                        */
/* ---------------------------------------------------------------------- */
function ChallengesList({ onOpen, onCreate }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Applications Open", "Expert Evaluation", "Pilot Active", "Independent Validation"];
  const rows = filter === "All" ? CHALLENGES : CHALLENGES.filter((c) => c.status === filter);

  return (
    <div>
      <SectionTitle eyebrow="CHALLENGE PIPELINE" title="Challenges" right={<Btn icon={Plus} onClick={onCreate}>Create Challenge</Btn>} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map((f) => (
          <div key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filter === f ? C.ink : C.line}`,
              background: filter === f ? C.ink : "#fff", color: filter === f ? "#fff" : C.inkSoft,
            }}>
            {f}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" icon={Filter} small>More filters</Btn>
      </div>
      <Card noPad>
        <div style={{ padding: 6 }}><ChallengeTable rows={rows} onOpen={onOpen} /></div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CHALLENGE DETAIL                                                       */
/* ---------------------------------------------------------------------- */
function ChallengeDetail({ ch, onBack }) {
  const [tab, setTab] = useState("overview");
  const tabs = ["Overview", "Eligibility Screening", "Evaluation Criteria", "Data / IP & Security", "Submitted Ideas (14)", "Updates"];
  return (
    <div>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.inkSoft, cursor: "pointer", marginBottom: 12, fontWeight: 600 }}>
        <ChevronLeft size={14} /> Back to Challenges
      </div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ ...mono, fontSize: 11.5, color: C.inkSoft, marginBottom: 5 }}>{ch.id} · {ch.theme}</div>
            <h1 style={{ ...serif, fontSize: 26, margin: 0, marginBottom: 6, maxWidth: 640 }}>{ch.title}</h1>
            <div style={{ fontSize: 12.5, color: C.inkSoft, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 size={13} /> Govt. of Maharashtra — {ch.dept}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={13} /> Deadline: {ch.deadline}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IndianRupee size={13} /> Pilot budget: {ch.budget}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <StatusChip label={ch.status} />
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Btn variant="secondary" small>Save / Watch</Btn>
              <Btn small>Apply as Startup</Btn>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <Stepper current={ch.status} />
        </div>
      </Card>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.line}` }}>
        {tabs.map((t) => (
          <div key={t} onClick={() => setTab(t)}
            style={{
              padding: "9px 14px", fontSize: 12.8, fontWeight: 600, cursor: "pointer",
              color: tab === t ? C.ink : C.inkSoft, borderBottom: tab === t ? `2px solid ${C.ink}` : "2px solid transparent",
            }}>
            {t}
          </div>
        ))}
      </div>

      {tab === "Overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Problem summary</div>
              <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
                Conventional procurement is designed for standardised goods and established vendors, making it hard
                for departments to test and adopt novel startup technology. This challenge seeks a transparent,
                milestone-based pathway from problem definition to validated, scalable deployment.
              </p>
              <div style={{ fontWeight: 700, marginTop: 14, marginBottom: 8 }}>Expected measurable outcome</div>
              <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
                Reduce time from challenge publication to pilot launch to under 30 days, with ≥ 80% of pilots reaching
                an independently validated performance report within the sanctioned pilot duration.
              </p>
            </Card>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Clarification questions (3)</div>
              {[
                { q: "Is co-development IP shared or startup-retained?", by: "TrackNova", a: "Startup retains core IP; department gets a perpetual usage licence." },
                { q: "Can the pilot run in a single district first?", by: "AgriSense Labs", a: "Yes — single-district sandbox permitted before multi-district scale." },
              ].map((c, i) => (
                <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? `1px solid ${C.line}` : "none" }}>
                  <div style={{ fontSize: 12.8, fontWeight: 600 }}>Q: {c.q}</div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 4 }}>— {c.by}</div>
                  <div style={{ fontSize: 12.5, color: C.teal, fontWeight: 500 }}>A: {c.a}</div>
                </div>
              ))}
            </Card>
          </div>
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Eligibility requirements</div>
              {["DPIIT-recognised startup", "Incorporated < 10 years", "Relaxed turnover criteria applies", "No pending litigation with GoM"].map((e) => (
                <div key={e} style={{ display: "flex", gap: 7, fontSize: 12.5, marginBottom: 7, color: C.inkSoft }}>
                  <CheckCircle2 size={14} color={C.teal} /> {e}
                </div>
              ))}
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Procurement pathway</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>Recommended</div>
              <StatusChip label="Pilot Active" small />
              <div style={{ fontSize: 12, marginTop: 6, color: C.inkSoft }}>Startup / MSME innovation procurement (pilot-to-scale) route under GoM GR 2024/Innovation-07</div>
            </Card>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Required documents</div>
              {["DPIIT certificate", "Technical proposal", "Data handling declaration", "Cybersecurity self-attestation"].map((d) => (
                <div key={d} style={{ fontSize: 12.5, color: C.inkSoft, padding: "5px 0" }}>· {d}</div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab === "Eligibility Screening" && <EligibilityPanel />}
      {tab === "Evaluation Criteria" && <EvalCriteriaPanel />}
      {tab === "Data / IP & Security" && <DataIpPanel />}
      {tab === "Submitted Ideas (14)" && <SubmittedIdeasPanel />}
      {tab === "Updates" && (
        <Card>
          {["Deadline extended by 10 days (05 Sep 2026)", "Clarification round opened for shortlisted applicants", "Budget band revised to ₹18–35L"].map((u, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "9px 0", borderTop: i > 0 ? `1px solid ${C.line}` : "none", fontSize: 13 }}>
              <Info size={14} color={C.brass} style={{ marginTop: 2, flexShrink: 0 }} /> {u}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function EligibilityPanel() {
  const apps = [
    { name: "TrackNova", score: 96, status: "Eligible", missing: "—" },
    { name: "RouteWise Tech", score: 62, status: "Missing Documents", missing: "DPIIT certificate" },
    { name: "PathAI", score: 40, status: "Ineligible", missing: "Turnover exceeds relaxed threshold" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
      <Card noPad>
        <div style={{ padding: "14px 16px", fontWeight: 700, borderBottom: `1px solid ${C.line}` }}>Auto-eligibility screening</div>
        {apps.map((a) => (
          <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderTop: `1px solid ${C.line}` }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: a.status === "Ineligible" ? C.rust : C.inkSoft }}>
                {a.status === "Eligible" ? "All checks passed" : `Reason: ${a.missing}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 12.5, color: C.inkSoft }}>Score <b style={{ color: C.ink }}>{a.score}</b>/100</div>
              <StatusChip label={a.status === "Eligible" ? "Startup Shortlisted" : a.status === "Missing Documents" ? "Under Review" : "Rejected"} small />
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Turnover / experience relaxation</div>
        <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>
          DPIIT-recognised startups under 8 years old are exempt from the standard 3-year prior-turnover requirement,
          per GoM startup procurement policy.
        </p>
        <Btn variant="secondary" small icon={Eye} style={{ width: "100%", justifyContent: "center" }}>Side-by-side comparison</Btn>
      </Card>
    </div>
  );
}

function EvalCriteriaPanel() {
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Weighted scoring rubric (from Evaluation Criteria template v2.0)</div>
      {EVAL_CRITERIA.map((c) => (
        <div key={c.k} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ width: 190, fontSize: 12.8, fontWeight: 600 }}>{c.k}</div>
          <div style={{ flex: 1, height: 7, background: C.paper, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${c.v * 10}%`, height: "100%", background: C.brass }} />
          </div>
          <div style={{ width: 30, fontSize: 12.8, fontWeight: 700, textAlign: "right" }}>{c.v}/10</div>
        </div>
      ))}
    </Card>
  );
}

function DataIpPanel() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Data & IP clauses</div>
        {[
          "Startup retains core product IP",
          "Department holds perpetual licence for pilot-customised features",
          "Raw departmental data never leaves classified environment",
          "Derived insights require written data-sharing agreement",
          "All shared data deleted or anonymised within 30 days of pilot close",
        ].map((d) => (
          <div key={d} style={{ display: "flex", gap: 7, fontSize: 12.8, marginBottom: 8, color: C.inkSoft }}>
            <FileCheck2 size={14} color={C.teal} style={{ flexShrink: 0, marginTop: 1 }} /> {d}
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Cybersecurity requirements</div>
        {[
          "Data residency within India-hosted infrastructure",
          "ISO 27001 or equivalent self-attestation",
          "Encryption at rest and in transit (AES-256 / TLS 1.2+)",
          "Incident disclosure within 24 hours",
          "Independent security review before scale-up",
        ].map((d) => (
          <div key={d} style={{ display: "flex", gap: 7, fontSize: 12.8, marginBottom: 8, color: C.inkSoft }}>
            <Lock size={14} color={C.brass} style={{ flexShrink: 0, marginTop: 1 }} /> {d}
          </div>
        ))}
      </Card>
    </div>
  );
}

function SubmittedIdeasPanel() {
  const ideas = [
    { name: "TrackNova", summary: "Fleet-agnostic GPS + ML ETA engine", trl: "TRL 7", status: "Startup Shortlisted" },
    { name: "RouteWise Tech", summary: "Crowd-sourced arrival prediction", trl: "TRL 5", status: "Expert Evaluation" },
    { name: "PathAI", summary: "Computer-vision occupancy estimation", trl: "TRL 4", status: "Under Review" },
  ];
  return (
    <Card noPad>
      {ideas.map((i, idx) => (
        <div key={i.name} style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderTop: idx > 0 ? `1px solid ${C.line}` : "none" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{i.name}</div>
            <div style={{ fontSize: 12.3, color: C.inkSoft }}>{i.summary} · {i.trl}</div>
          </div>
          <StatusChip label={i.status} small />
        </div>
      ))}
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/*  CREATE CHALLENGE WIZARD                                                */
/* ---------------------------------------------------------------------- */
function CreateChallenge({ onDone }) {
  const steps = ["Problem", "Outcome & Constraints", "Pilot Parameters", "Review & Publish"];
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    title: "", objective: "", beneficiaries: "", painPoint: "",
    outcome: "", constraints: "", budget: "", location: "", data: "Available (anonymised)",
    integrations: "", risk: "Medium",
  });
  const completeness = useMemo(() => {
    const fields = Object.values(f);
    const filled = fields.filter((v) => v && v.length > 3).length;
    return Math.round((filled / fields.length) * 100);
  }, [f]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <SectionTitle eyebrow="CHALLENGE IDENTIFICATION" title="Create Challenge" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {steps.map((s, i) => (
              <div key={s} onClick={() => setStep(i)}
                style={{
                  flex: 1, padding: "9px 6px", textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  borderRadius: 4, background: step === i ? C.ink : "#fff", color: step === i ? "#fff" : C.inkSoft,
                  border: `1px solid ${step === i ? C.ink : C.line}`,
                }}>
                {i + 1}. {s}
              </div>
            ))}
          </div>

          <Card>
            {step === 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.brassSoft, color: C.brass, padding: "8px 12px", borderRadius: 4, fontSize: 12, marginBottom: 16 }}>
                  <Sparkles size={14} /> AI drafting suggestion: describe the pain point in citizen/beneficiary terms, not system terms — this improves outcome-based framing.
                </div>
                <Field label="Problem statement title"><input style={inputStyle} value={f.title} onChange={set("title")} placeholder="e.g. Real-time public transport tracking" /></Field>
                <Field label="Department objective"><textarea style={{ ...inputStyle, height: 70 }} value={f.objective} onChange={set("objective")} placeholder="What is the department ultimately trying to achieve?" /></Field>
                <Field label="Target beneficiaries"><input style={inputStyle} value={f.beneficiaries} onChange={set("beneficiaries")} placeholder="e.g. Daily commuters in Tier-2 cities" /></Field>
                <Field label="Current pain point" hint="Describe the symptom citizens/officials actually experience today."><textarea style={{ ...inputStyle, height: 70 }} value={f.painPoint} onChange={set("painPoint")} /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <Field label="Expected measurable outcome" hint="State a number and a timeframe — not an activity."><textarea style={{ ...inputStyle, height: 70 }} value={f.outcome} onChange={set("outcome")} placeholder="e.g. Reduce average passenger wait-time uncertainty by 40% within 6 months" /></Field>
                <Field label="Constraints"><textarea style={{ ...inputStyle, height: 60 }} value={f.constraints} onChange={set("constraints")} placeholder="Legacy systems, data-sharing limits, procurement rules…" /></Field>
                <Field label="Budget range"><input style={inputStyle} value={f.budget} onChange={set("budget")} placeholder="₹15–30 lakh" /></Field>
                <Field label="Risk level">
                  <select style={inputStyle} value={f.risk} onChange={set("risk")}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </Field>
              </>
            )}
            {step === 2 && (
              <>
                <Field label="Pilot location"><input style={inputStyle} value={f.location} onChange={set("location")} placeholder="e.g. Pune & Nagpur (2 districts)" /></Field>
                <Field label="Data availability">
                  <select style={inputStyle} value={f.data} onChange={set("data")}>
                    <option>Available (anonymised)</option><option>Available (raw, restricted)</option><option>Not yet available</option>
                  </select>
                </Field>
                <Field label="Required integrations"><input style={inputStyle} value={f.integrations} onChange={set("integrations")} placeholder="e.g. State transport fleet API" /></Field>
                <Card style={{ background: C.paper, border: `1px dashed ${C.lineStrong}` }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Suggested procurement pathway</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft }}>Based on risk = {f.risk} and budget band entered → <b style={{ color: C.ink }}>Pilot-to-scale innovation procurement route</b> (sandbox contract, no full tender required pre-validation).</div>
                </Card>
              </>
            )}
            {step === 3 && (
              <>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Review before publishing</div>
                {Object.entries(f).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: 12.8 }}>
                    <div style={{ width: 170, color: C.inkSoft, textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</div>
                    <div style={{ fontWeight: 500 }}>{v || "—"}</div>
                  </div>
                ))}
              </>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
              <Btn variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Btn>
              {step < steps.length - 1
                ? <Btn icon={ArrowRight} onClick={() => setStep(step + 1)}>Continue</Btn>
                : <Btn variant="brass" icon={CheckCircle2} onClick={onDone}>Publish Challenge</Btn>}
            </div>
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, marginBottom: 10 }}>COMPLETENESS SCORE</div>
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto" }}>
              <svg width="96" height="96">
                <circle cx="48" cy="48" r="40" stroke={C.line} strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="40" stroke={completeness > 60 ? C.teal : C.brass} strokeWidth="8" fill="none"
                  strokeDasharray={251} strokeDashoffset={251 - (251 * completeness) / 100} strokeLinecap="round"
                  transform="rotate(-90 48 48)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontSize: 22, fontWeight: 600 }}>{completeness}%</div>
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8 }}>Outcome-based & template-complete</div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 12.8, marginBottom: 8 }}>Templates in use</div>
            {["Outcome-Based Problem Statement", "Risk Management Framework", "Procurement Pathway Selector"].map((t) => (
              <div key={t} style={{ display: "flex", gap: 6, fontSize: 12, color: C.inkSoft, padding: "5px 0" }}>
                <ScrollText size={13} color={C.brass} /> {t}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MARKETPLACE                                                            */
/* ---------------------------------------------------------------------- */
function Marketplace() {
  const [q, setQ] = useState("");
  const filtered = STARTUPS.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SectionTitle eyebrow="DISCOVER" title="Startup Marketplace" right={<Btn variant="secondary" icon={Filter} small>Domain · TRL · Budget · Recognition</Btn>} />
      <input style={{ ...inputStyle, marginBottom: 18, maxWidth: 380 }} placeholder="Search startups…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {filtered.map((s) => (
          <Card key={s.name} style={{ transition: "box-shadow .15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 6, background: C.navySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Rocket size={17} color={C.ink} />
              </div>
              <StatusChip label={s.badge === "Verified" ? "Scaled / Closed" : s.badge === "Eligible" ? "Startup Shortlisted" : "Under Review"} small />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 8 }}>{s.sector}</div>
            <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: C.inkSoft, marginBottom: 10 }}>
              <span>{s.trl}</span><span>·</span><span>{s.pilots} past pilots</span><span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} color={C.brass} fill={C.brass} /> {s.rating}</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
              <MapPin size={12} /> {s.loc} · {s.recog}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn small variant="secondary" style={{ flex: 1, justifyContent: "center" }}>Shortlist</Btn>
              <Btn small style={{ flex: 1, justifyContent: "center" }}>Invite to apply</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  EVALUATION WORKSPACE                                                   */
/* ---------------------------------------------------------------------- */
function EvaluationWorkspace() {
  const [scores, setScores] = useState({ Technical: 7, Innovation: 8, Cost: 6, Scalability: 7, Risk: 4, Capacity: 7 });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return (
    <div>
      <SectionTitle eyebrow="EXPERT REVIEW" title="Evaluation Workspace — TrackNova / SIH26136" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Conflict-of-interest declaration</div>
              <StatusChip label="Scaled / Closed" small />
            </div>
            <p style={{ fontSize: 12.5, color: C.inkSoft }}>I declare no financial, employment, or personal relationship with TrackNova or its founders. Signed 04 Sep 2026.</p>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Scoring rubric</div>
            {Object.entries(scores).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{k} {k === "Risk" ? "(lower is better)" : ""}</span><span style={{ fontWeight: 700 }}>{v}/10</span>
                </div>
                <input type="range" min="0" max="10" value={v} onChange={(e) => setScores({ ...scores, [k]: +e.target.value })} style={{ width: "100%", accentColor: C.brass }} />
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Comments</div>
            <textarea style={{ ...inputStyle, height: 80 }} placeholder="Notes visible in the audit trail…" />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Btn variant="brass" small icon={CheckCircle2}>Shortlist</Btn>
              <Btn variant="secondary" small icon={AlertTriangle}>Needs Clarification</Btn>
              <Btn variant="danger" small icon={X}>Reject</Btn>
            </div>
          </Card>
        </div>
        <div>
          <Card style={{ marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, marginBottom: 8 }}>COMPOSITE SCORE</div>
            <div style={{ ...serif, fontSize: 40, fontWeight: 600, color: C.ink }}>{total}<span style={{ fontSize: 18, color: C.inkSoft }}>/60</span></div>
            <div style={{ fontSize: 12, color: C.teal, fontWeight: 600, marginTop: 4 }}>Above shortlist threshold (42)</div>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 12.8, marginBottom: 8 }}>Evidence submitted</div>
            {["Technical proposal.pdf", "Pilot case study — Nashik RTO.pdf", "Security self-attestation.pdf"].map((f) => (
              <div key={f} style={{ display: "flex", gap: 6, fontSize: 12, color: C.inkSoft, padding: "5px 0" }}>
                <FileText size={13} /> {f}
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 12.8, marginBottom: 6 }}>Audit trail</div>
            {["Review opened — 04 Sep, 10:02", "Evidence viewed — 04 Sep, 10:06", "Scores drafted — 04 Sep, 10:41"].map((a, i) => (
              <div key={i} style={{ fontSize: 11.5, color: C.inkSoft, padding: "4px 0" }}>· {a}</div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PILOTS (Sandbox design + performance)                                  */
/* ---------------------------------------------------------------------- */
function Pilots() {
  const [tab, setTab] = useState("design");
  return (
    <div>
      <SectionTitle eyebrow="SANDBOX & PERFORMANCE" title="Pilots" />
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${C.line}` }}>
        {["Sandbox / Pilot Design", "Live Performance"].map((t) => (
          <div key={t} onClick={() => setTab(t === "Live Performance" ? "perf" : "design")}
            style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderBottom: (tab === "perf") === (t === "Live Performance") ? `2px solid ${C.ink}` : "2px solid transparent", color: (tab === "perf") === (t === "Live Performance") ? C.ink : C.inkSoft }}>
            {t}
          </div>
        ))}
      </div>
      {tab === "design" ? <PilotDesign /> : <PilotPerformance />}
    </div>
  );
}

function PilotDesign() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Pilot scope — TrackNova / Transport Dept.</div>
        <Field label="Pilot geography"><input style={inputStyle} defaultValue="Pune Municipal Transport routes 12, 44" /></Field>
        <Field label="User group"><input style={inputStyle} defaultValue="~4,200 daily commuters" /></Field>
        <Field label="Duration"><input style={inputStyle} defaultValue="12 weeks" /></Field>
        <Field label="Success metrics"><textarea style={{ ...inputStyle, height: 60 }} defaultValue="ETA accuracy ≥ 90%; app adoption ≥ 15% of route riders" /></Field>
        <Field label="Required data access"><input style={inputStyle} defaultValue="Anonymised GPS feed (read-only)" /></Field>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Risk controls & checklist</div>
          {[
            { l: "Cybersecurity checklist complete", done: true },
            { l: "IP / data agreement signed", done: true },
            { l: "Validation agency assigned", done: true },
            { l: "Rollback plan documented", done: false },
          ].map((c) => (
            <div key={c.l} style={{ display: "flex", gap: 8, fontSize: 12.8, padding: "6px 0", color: c.done ? C.ink : C.rust }}>
              {c.done ? <CheckCircle2 size={15} color={C.teal} /> : <AlertTriangle size={15} color={C.rust} />} {c.l}
            </div>
          ))}
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, marginBottom: 8 }}>PILOT READINESS SCORE</div>
          <div style={{ ...serif, fontSize: 34, fontWeight: 600 }}>82<span style={{ fontSize: 16, color: C.inkSoft }}>/100</span></div>
          <Btn variant="brass" small style={{ marginTop: 10 }} icon={ArrowRight}>Send for contracting</Btn>
        </Card>
      </div>
    </div>
  );
}

function PilotPerformance() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
      <Metric label="ETA Accuracy (current vs baseline)" value="88%" sub="Baseline 61%" icon={Gauge} tone={C.teal} />
      <Metric label="Route Coverage" value="2 / 2" sub="On target" icon={MapPin} tone={C.teal} />
      <Metric label="App Adoption" value="11.4%" sub="Target 15%" icon={Users} tone={C.brass} />
      <Metric label="Open Risk Flags" value="1" sub="Data latency spikes" icon={AlertTriangle} tone={C.rust} />
      <Card style={{ gridColumn: "span 4" }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Milestone progress</div>
        <MilestoneMini />
      </Card>
      <Card style={{ gridColumn: "span 2" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Field reports</div>
        {["Week 4 site visit — Pune depot", "Week 8 driver feedback survey"].map((f) => (
          <div key={f} style={{ display: "flex", gap: 6, fontSize: 12.5, color: C.inkSoft, padding: "5px 0" }}><Upload size={13} /> {f}</div>
        ))}
      </Card>
      <Card style={{ gridColumn: "span 2" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Validator notes</div>
        <p style={{ fontSize: 12.5, color: C.inkSoft }}>KPI verification on track for weeks 1–8. Latency spike (23 Aug) attributed to fleet API outage, not the startup's system — flagged as external risk.</p>
      </Card>
    </div>
  );
}

function MilestoneMini() {
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {MILESTONES.map((m, i) => (
        <div key={m.n} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: 6, background: i < 2 ? C.teal : C.line, marginBottom: 8, borderRadius: 3, marginRight: i < 3 ? 4 : 0 }} />
          <div style={{ fontSize: 11, fontWeight: 600 }}>{m.n.split(" — ")[0]}</div>
          <div style={{ fontSize: 10.5, color: C.inkSoft }}>{m.due}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CONTRACTS                                                              */
/* ---------------------------------------------------------------------- */
function Contracts() {
  return (
    <div>
      <SectionTitle eyebrow="MILESTONE-BASED CONTRACTING" title="Contracts — TrackNova / SIH-MH-TR-0022" right={<Btn icon={FileSignature} small variant="secondary">Contract v2 · e-signed</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <Card noPad>
          <div style={{ padding: "13px 16px", fontWeight: 700, borderBottom: `1px solid ${C.line}` }}>Milestones & deliverables</div>
          {MILESTONES.map((m) => (
            <div key={m.n} style={{ padding: "13px 16px", borderTop: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.n}</div>
                <StatusChip label={m.status} small />
              </div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>Due {m.due} · Payment {m.amt}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Legal / procurement review</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.8, marginBottom: 6 }}><span>Clauses cleared</span><CheckCircle2 size={15} color={C.teal} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.8 }}><span>Procurement pathway confirmed</span><CheckCircle2 size={15} color={C.teal} /></div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Version history</div>
            {["v2 — payment terms revised (28 Aug)", "v1 — initial draft from template (14 Aug)"].map((v) => (
              <div key={v} style={{ fontSize: 12, color: C.inkSoft, padding: "5px 0" }}>· {v}</div>
            ))}
          </Card>
          <Btn variant="secondary" icon={Download} style={{ justifyContent: "center" }}>Download signed agreement</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAYMENTS                                                                */
/* ---------------------------------------------------------------------- */
function Payments() {
  const color = { Paid: C.teal, "Approval Pending": C.brass, Overdue: C.rust, "Invoice Uploaded": C.ink };
  return (
    <div>
      <SectionTitle eyebrow="TRANSPARENT & MILESTONE-LINKED" title="Payments" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        <Metric label="Paid This Quarter" value="₹41.2 L" icon={CheckCircle2} tone={C.teal} />
        <Metric label="Pending Approval" value="₹6.5 L" icon={Clock} tone={C.brass} />
        <Metric label="Overdue" value="₹3.2 L" sub="1 invoice, 11 days" icon={AlertTriangle} tone={C.rust} />
        <Metric label="Avg. Days to Pay" value="6.1 d" sub="SLA target: 7 d" icon={Gauge} />
      </div>
      <Card noPad>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: C.inkSoft, fontSize: 11 }}>
              {["Startup", "Milestone", "Amount", "Status", "Days Pending", ""].map((h) => <th key={h} style={{ padding: "10px 14px" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {PAYMENTS.map((p) => (
              <tr key={p.startup + p.milestone} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ padding: "11px 14px", fontWeight: 600 }}>{p.startup}</td>
                <td style={{ padding: "11px 14px", color: C.inkSoft }}>{p.milestone}</td>
                <td style={{ padding: "11px 14px", ...mono }}>{p.amt}</td>
                <td style={{ padding: "11px 14px", fontWeight: 700, color: color[p.status] }}>{p.status}</td>
                <td style={{ padding: "11px 14px", color: p.status === "Overdue" ? C.rust : C.inkSoft }}>{p.days}</td>
                <td style={{ padding: "11px 14px" }}>
                  {p.status === "Approval Pending" && <Btn small variant="brass">Approve</Btn>}
                  {p.status === "Overdue" && <Btn small variant="danger" icon={ArrowUpRight}>Escalate</Btn>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  VALIDATION                                                             */
/* ---------------------------------------------------------------------- */
function Validation() {
  return (
    <div>
      <SectionTitle eyebrow="INDEPENDENT VALIDATION" title="Validation Workspace — JalMitra / MH-WT-0007" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>KPI verification</div>
            {[
              { k: "Water-quality alert accuracy", claim: "94%", verified: "91%", ok: true },
              { k: "Sensor uptime", claim: "98%", verified: "97.2%", ok: true },
              { k: "Cost per monitoring point", claim: "₹3,200/mo", verified: "₹3,850/mo", ok: false },
            ].map((r) => (
              <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
                <div style={{ fontSize: 12.8, fontWeight: 600 }}>{r.k}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>Claimed {r.claim} → Verified <b style={{ color: r.ok ? C.teal : C.rust }}>{r.verified}</b></div>
              </div>
            ))}
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Site visit / remote validation log</div>
            {["Remote log review — 12 Aug", "Site visit, Aurangabad — 20 Aug", "Fraud/mismatch check — 27 Aug: none found"].map((l) => (
              <div key={l} style={{ fontSize: 12.5, color: C.inkSoft, padding: "5px 0" }}>· {l}</div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Final validation report</div>
            <textarea style={{ ...inputStyle, height: 80 }} defaultValue="Pilot meets 2 of 3 KPIs at target; cost-per-point exceeds proposal by 20%, driven by sensor calibration frequency. Recommend scale with revised unit economics." />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn small variant="brass" icon={TrendingUp}>Recommend: Scale</Btn>
              <Btn small variant="secondary">Recommend: Revise</Btn>
              <Btn small variant="danger">Recommend: Stop</Btn>
            </div>
          </Card>
        </div>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 12.8, marginBottom: 8 }}>Report status</div>
            <StatusChip label="Independent Validation" />
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8 }}>Signed by: Deccan EnviroCheck Labs (empanelled validator)</div>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 12.8, marginBottom: 8 }}>Visibility</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>Full report: Department + Admin only</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>Summary: Public on challenge page</div>
          </Card>
          <Card>
            <div style={{ display: "flex", gap: 7, fontSize: 12.5, color: C.rust, fontWeight: 600 }}>
              <ShieldAlert size={15} /> 1 fraud/mismatch flag under department review
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SCALE-UP                                                               */
/* ---------------------------------------------------------------------- */
function ScaleUp() {
  return (
    <div>
      <SectionTitle eyebrow="PROCUREMENT / LEGAL / LEADERSHIP" title="Scale-Up Decision — TrackNova" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Pilot outcome summary</div>
          <div style={{ fontSize: 12.8, color: C.inkSoft, lineHeight: 1.7 }}>
            88% ETA accuracy (vs. 61% baseline) across a 12-week, 2-route pilot serving 4,200 daily commuters.
            Independently validated by RITES Mobility Labs on 30 Aug 2026.
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Cost-benefit analysis</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.8, padding: "6px 0" }}><span>Pilot cost</span><b>₹23,00,000</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.8, padding: "6px 0" }}><span>Projected state-wide annual cost</span><b>₹3.4 Cr</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.8, padding: "6px 0" }}><span>Est. commuter-hours saved / yr</span><b style={{ color: C.teal }}>1.2M hrs</b></div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Scalability across districts</div>
          {["Pune (piloted)", "Nagpur", "Nashik", "Aurangabad"].map((d, i) => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: i > 0 ? `1px solid ${C.line}` : "none", fontSize: 12.8 }}>
              <span>{d}</span><StatusChip label={i === 0 ? "Scaled / Closed" : "Under Review"} small />
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Required approvals</div>
          {[{ n: "Transport Dept. Secretary", done: true }, { n: "Finance concurrence", done: true }, { n: "Legal / procurement sign-off", done: false }].map((a) => (
            <div key={a.n} style={{ display: "flex", gap: 8, fontSize: 12.8, padding: "6px 0" }}>
              {a.done ? <CheckCircle2 size={15} color={C.teal} /> : <Clock size={15} color={C.brass} />} {a.n}
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Decision</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>Scale-up budget estimate: ₹3.4 Cr / year, 4-district rollout</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" small icon={Download}>Export evidence packet</Btn>
            <Btn variant="secondary" small>Extend Pilot</Btn>
            <Btn variant="danger" small>Reject</Btn>
            <Btn variant="brass" small icon={TrendingUp}>Approve Scale-Up</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  TEMPLATES                                                              */
/* ---------------------------------------------------------------------- */
function Templates() {
  return (
    <div>
      <SectionTitle eyebrow="STANDARDISED & LEGALLY CLEARED" title="Template Library" right={<Btn variant="secondary" icon={Filter} small>Category · Approval status</Btn>} />
      <Card noPad>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: C.inkSoft, fontSize: 11 }}>
              {["Template", "Category", "Version", "Legal status", "Last updated", ""].map((h) => <th key={h} style={{ padding: "10px 14px" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {TEMPLATES.map((t) => (
              <tr key={t.name} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><ScrollText size={14} color={C.brass} /> {t.name}</td>
                <td style={{ padding: "12px 14px", color: C.inkSoft }}>{t.cat}</td>
                <td style={{ padding: "12px 14px", ...mono, fontSize: 12 }}>{t.v}</td>
                <td style={{ padding: "12px 14px" }}>
                  {t.approved
                    ? <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.teal, fontWeight: 600, fontSize: 12 }}><BadgeCheck size={14} /> Approved</span>
                    : <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.brass, fontWeight: 600, fontSize: 12 }}><Clock size={14} /> Pending review</span>}
                </td>
                <td style={{ padding: "12px 14px", color: C.inkSoft }}>{t.updated}</td>
                <td style={{ padding: "12px 14px" }}><Btn small variant="secondary">Use template</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ADMIN                                                                   */
/* ---------------------------------------------------------------------- */
function Admin() {
  return (
    <div>
      <SectionTitle eyebrow="PLATFORM GOVERNANCE" title="Admin Dashboard" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        <Metric label="Departments" value="18" icon={Building2} />
        <Metric label="Registered Startups" value="128" icon={Rocket} />
        <Metric label="Evaluators Empanelled" value="34" icon={UserCheck} />
        <Metric label="Validation Agencies" value="7" icon={ShieldCheck} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Bottleneck detection (avg. days per stage)</div>
          {[
            { s: "Eligibility Screening", d: 6.4, target: 3 },
            { s: "Expert Evaluation", d: 4.1, target: 5 },
            { s: "Contracting", d: 8.9, target: 6 },
            { s: "Payment Processing", d: 6.1, target: 7 },
          ].map((r) => (
            <div key={r.s} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span>{r.s}</span><span style={{ fontWeight: 700, color: r.d > r.target ? C.rust : C.teal }}>{r.d}d</span>
              </div>
              <div style={{ height: 6, background: C.paper, borderRadius: 3 }}>
                <div style={{ width: `${Math.min(100, (r.d / (r.target * 1.6)) * 100)}%`, height: "100%", borderRadius: 3, background: r.d > r.target ? C.rust : C.teal }} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Audit log (latest)</div>
          {["Template 'Risk Management Framework' edited by Legal", "Evaluator conflict declared — cleared", "Payment escalation triggered — JalMitra M1", "Department 'Water Resources' onboarded"].map((a, i) => (
            <div key={i} style={{ fontSize: 12.3, color: C.inkSoft, padding: "6px 0", borderTop: i > 0 ? `1px solid ${C.line}` : "none" }}>· {a}</div>
          ))}
        </Card>
      </div>
    </div>
  );
}
