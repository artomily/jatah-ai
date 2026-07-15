import type { Agent, Category } from "@/lib/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  research: "Research",
  coding: "Coding",
  writing: "Writing",
  data: "Data",
  vision: "Vision",
  automation: "Automation",
};

export const CATEGORIES: Category[] = [
  "research",
  "coding",
  "writing",
  "data",
  "vision",
  "automation",
];

export const AGENTS: Agent[] = [
  // ---- Research ----
  {
    id: "agent_scout",
    slug: "scout",
    name: "Scout",
    tagline: "Deep web research, delivered as a brief you can forward.",
    description:
      "Scout takes a research question and returns a structured brief: key findings, source list, disagreements between sources, and what it couldn't verify. It runs staged web searches, reads the results, and synthesizes rather than summarizes — you get positions and evidence, not a wall of links.\n\nEvery claim in the brief is footnoted to its source. If two credible sources conflict, Scout says so instead of averaging them into mush. Typical questions: market sizing, competitor moves, technical due diligence, policy changes.",
    category: "research",
    creatorId: "nova-works",
    rating: 4.8,
    reviewsCount: 2214,
    runsCount: 481200,
    capabilities: [
      "Staged web search with source ranking",
      "Structured briefs: findings, evidence, open questions",
      "Inline citations for every claim",
      "Flags conflicting sources instead of blending them",
      "Exports to Markdown or email-ready format",
    ],
    providersUsed: ["search", "openai", "embedding"],
    avgExecutionMs: 2600,
    pricing: {
      perRequest: { estMin: 0.04, estMax: 0.06, cap: 0.08 },
      passes: {
        pass_24h: { price: 2.5 },
        pass_7d: { price: 9 },
        pass_30d: { price: 24 },
      },
    },
    featured: true,
  },
  {
    id: "agent_citewise",
    slug: "citewise",
    name: "CiteWise",
    tagline: "Literature reviews with citations you can actually check.",
    description:
      "CiteWise assembles literature reviews from academic and technical sources. Give it a topic and scope, and it returns an organized review: themes, seminal work, recent developments, and a full bibliography in the citation style you pick.\n\nIt was built by former reference librarians who got tired of hallucinated citations. Every reference is resolved against the open web before it lands in your document — anything unverifiable is marked, never silently included.",
    category: "research",
    creatorId: "fieldnote-ai",
    rating: 4.9,
    reviewsCount: 861,
    runsCount: 94100,
    capabilities: [
      "Thematic literature reviews with structure",
      "Verified bibliography — no hallucinated references",
      "APA, MLA, Chicago, and BibTeX output",
      "Coverage maps showing what the review missed",
    ],
    providersUsed: ["anthropic", "search", "embedding"],
    avgExecutionMs: 3100,
    pricing: {
      perRequest: { estMin: 0.05, estMax: 0.09, cap: 0.12 },
      passes: {
        pass_7d: { price: 12 },
        pass_30d: { price: 32 },
      },
    },
  },
  {
    id: "agent_marketpulse",
    slug: "marketpulse",
    name: "MarketPulse",
    tagline: "Competitor and market monitoring on your schedule.",
    description:
      "MarketPulse watches a list of competitors, products, or topics and reports what changed: pricing moves, launches, hires, funding, and notable coverage. Run it ad hoc before a meeting or daily during a launch week.\n\nReports are diff-oriented — it leads with what's new since your last run, so repeated runs stay short and readable instead of repeating the same background.",
    category: "research",
    creatorId: "fieldnote-ai",
    rating: 4.5,
    reviewsCount: 502,
    runsCount: 61800,
    capabilities: [
      "Tracks competitors, products, or keywords",
      "Diff-first reports: what changed since last run",
      "Pricing-page and changelog monitoring",
      "One-paragraph executive summary up top",
    ],
    providersUsed: ["search", "openai"],
    avgExecutionMs: 2200,
    pricing: {
      perRequest: { estMin: 0.03, estMax: 0.05, cap: 0.07 },
      passes: {
        pass_24h: { price: 3 },
        pass_30d: { price: 28 },
      },
    },
  },

  // ---- Coding ----
  {
    id: "agent_refactorbot",
    slug: "refactorbot",
    name: "RefactorBot",
    tagline: "Multi-file refactors that arrive with their own tests.",
    description:
      "RefactorBot performs scoped refactors across a codebase: extract a module, retire a deprecated API, unify duplicated logic. It plans the change, applies it consistently across every file, and generates or updates tests to prove behavior didn't drift.\n\nIt works from a repository snapshot you provide and returns a reviewable patch series — small commits with messages that explain why, not just what. Anything it wasn't confident about is left as a marked TODO rather than a silent guess.",
    category: "coding",
    creatorId: "atlas-labs",
    rating: 4.7,
    reviewsCount: 1893,
    runsCount: 214600,
    capabilities: [
      "Repo-wide consistent refactors",
      "Generates tests to lock in behavior",
      "Reviewable patch series with rationale",
      "Marks uncertain spots instead of guessing",
      "Supports TypeScript, Python, Go, and Rust",
    ],
    providersUsed: ["anthropic"],
    avgExecutionMs: 3200,
    pricing: {
      perRequest: { estMin: 0.06, estMax: 0.11, cap: 0.15 },
      passes: {
        pass_24h: { price: 4 },
        pass_7d: { price: 15 },
        pass_30d: { price: 42 },
      },
    },
    featured: true,
  },
  {
    id: "agent_pr-sentinel",
    slug: "pr-sentinel",
    name: "PR Sentinel",
    tagline: "Code review that catches what tired humans skim past.",
    description:
      "PR Sentinel reviews a pull request the way a careful senior engineer would: correctness first, then security, then style — with severity labels so you know what actually blocks the merge. It reads the surrounding code, not just the diff, so it catches broken invariants and missed call sites.\n\nComments come with suggested fixes where the fix is unambiguous, and honest uncertainty where it isn't.",
    category: "coding",
    creatorId: "atlas-labs",
    rating: 4.6,
    reviewsCount: 1204,
    runsCount: 187300,
    capabilities: [
      "Reads surrounding code, not just the diff",
      "Severity-ranked findings: blocker to nit",
      "Suggested patches for unambiguous fixes",
      "Security and injection-risk checks",
    ],
    providersUsed: ["anthropic", "embedding"],
    avgExecutionMs: 2400,
    pricing: {
      perRequest: { estMin: 0.03, estMax: 0.06, cap: 0.09 },
      passes: {
        pass_7d: { price: 10 },
        pass_30d: { price: 26 },
      },
    },
  },
  {
    id: "agent_regexsmith",
    slug: "regexsmith",
    name: "RegexSmith",
    tagline: "Regexes and parsers, tested against your real samples.",
    description:
      "Describe what you need to match and paste a few real samples — RegexSmith returns a pattern, an explanation of every group, and a test table showing exactly which of your samples match and why. It flags catastrophic-backtracking risks and suggests a parser when a regex is the wrong tool.\n\nCheap, fast, and single-purpose. This is the agent you keep on usage billing and call twelve times a year.",
    category: "coding",
    creatorId: "northbeam-tools",
    rating: 4.4,
    reviewsCount: 388,
    runsCount: 45200,
    capabilities: [
      "Patterns tested against your pasted samples",
      "Group-by-group explanations",
      "Backtracking-risk warnings",
      "Suggests parsers when regex is wrong",
    ],
    providersUsed: ["openai"],
    avgExecutionMs: 1400,
    pricing: {
      perRequest: { estMin: 0.01, estMax: 0.02, cap: 0.03 },
      passes: {},
    },
  },

  // ---- Writing ----
  {
    id: "agent_draftsman",
    slug: "draftsman",
    name: "Draftsman",
    tagline: "Long-form drafts that sound like you on a good day.",
    description:
      "Draftsman writes long-form drafts — essays, announcements, documentation, newsletters — from your outline and a few samples of your writing. It learns cadence and vocabulary from the samples, so the draft reads like you rather than like a press release.\n\nIt returns the draft plus margin notes explaining choices it made and places where it needs your judgment. Revision runs are cheaper than first drafts because your voice profile is already built.",
    category: "writing",
    creatorId: "nova-works",
    rating: 4.7,
    reviewsCount: 1467,
    runsCount: 156800,
    capabilities: [
      "Voice-matched drafting from your samples",
      "Margin notes on judgment calls",
      "Outline-to-draft and revision modes",
      "Documentation, essays, announcements, newsletters",
    ],
    providersUsed: ["anthropic", "embedding"],
    avgExecutionMs: 2900,
    pricing: {
      perRequest: { estMin: 0.04, estMax: 0.07, cap: 0.1 },
      passes: {
        pass_24h: { price: 2.5 },
        pass_7d: { price: 9 },
        pass_30d: { price: 24 },
      },
    },
  },
  {
    id: "agent_subject-line-lab",
    slug: "subject-line-lab",
    name: "Subject Line Lab",
    tagline: "Twelve subject lines, scored, with the reasoning shown.",
    description:
      "Paste your email and audience, get twelve subject-line candidates grouped by strategy — curiosity, clarity, urgency, social proof — each scored for predicted open-rate lift and flagged for spam-filter risk.\n\nIt explains why each candidate works, so over time you need it less. The 24 Hour Pass exists for launch days when you're sending six campaigns before noon.",
    category: "writing",
    creatorId: "mono-studio",
    rating: 4.3,
    reviewsCount: 217,
    runsCount: 38900,
    capabilities: [
      "Twelve candidates grouped by strategy",
      "Predicted-lift scoring with reasoning",
      "Spam-trigger and clipping warnings",
      "A/B pairing suggestions",
    ],
    providersUsed: ["openai"],
    avgExecutionMs: 1300,
    pricing: {
      perRequest: { estMin: 0.01, estMax: 0.03, cap: 0.04 },
      passes: {
        pass_24h: { price: 1.5 },
      },
    },
  },
  {
    id: "agent_localize-pro",
    slug: "localize-pro",
    name: "Localize Pro",
    tagline: "Translation with tone control, reviewed like an editor would.",
    description:
      "Localize Pro translates product copy, docs, and marketing into 30+ languages with explicit tone control — formal, neutral, or casual — and consistency enforced through your glossary. It returns the translation plus a reviewer's log: idioms it adapted, terms it kept in English, and anything that needs a native speaker's eye.\n\nBuilt and tuned by working localization editors at Mono Studio.",
    category: "writing",
    creatorId: "mono-studio",
    rating: 4.6,
    reviewsCount: 644,
    runsCount: 88700,
    capabilities: [
      "30+ languages with tone control",
      "Glossary-enforced terminology",
      "Reviewer's log of adaptation choices",
      "Plurals, dates, and units handled per locale",
    ],
    providersUsed: ["openai", "anthropic"],
    avgExecutionMs: 2100,
    pricing: {
      perRequest: { estMin: 0.03, estMax: 0.05, cap: 0.07 },
      passes: {
        pass_30d: { price: 22 },
      },
    },
  },

  // ---- Data ----
  {
    id: "agent_sheetsense",
    slug: "sheetsense",
    name: "SheetSense",
    tagline: "Ask your spreadsheet questions in plain English.",
    description:
      "Upload a spreadsheet or CSV and ask questions the way you'd ask a colleague: which region is dragging Q3, what changed after the price increase, where are the duplicates. SheetSense answers with the numbers, the formula logic it used, and a note on data-quality problems it hit along the way.\n\nIt shows its work — every answer links back to the ranges and transformations behind it, so you can verify instead of trust.",
    category: "data",
    creatorId: "parcel-labs",
    rating: 4.8,
    reviewsCount: 1721,
    runsCount: 243500,
    capabilities: [
      "Plain-English questions over CSV/XLSX",
      "Shows formula logic behind every answer",
      "Data-quality warnings: gaps, dupes, type drift",
      "Pivot and chart suggestions",
    ],
    providersUsed: ["openai"],
    avgExecutionMs: 2000,
    pricing: {
      perRequest: { estMin: 0.04, estMax: 0.06, cap: 0.08 },
      passes: {
        pass_24h: { price: 3 },
        pass_7d: { price: 11 },
      },
    },
    featured: true,
  },
  {
    id: "agent_chartspeak",
    slug: "chartspeak",
    name: "ChartSpeak",
    tagline: "From dataset to chart and the paragraph that explains it.",
    description:
      "ChartSpeak takes a dataset and a question and returns the right chart — not just a chart — along with the narrative paragraph you'd want under it in a report. It picks chart form based on what the comparison actually is, labels honestly (baselines at zero unless it tells you why not), and writes alt text.\n\nOutput ships as PNG, SVG, and the underlying spec so your team can restyle it.",
    category: "data",
    creatorId: "parcel-labs",
    rating: 4.5,
    reviewsCount: 493,
    runsCount: 57400,
    capabilities: [
      "Chart-form selection with stated reasoning",
      "Narrative paragraph and alt text included",
      "Honest axes — flags truncated baselines",
      "PNG, SVG, and editable spec output",
    ],
    providersUsed: ["openai", "vision"],
    avgExecutionMs: 2500,
    pricing: {
      perRequest: { estMin: 0.05, estMax: 0.08, cap: 0.11 },
      passes: {
        pass_7d: { price: 12 },
      },
    },
  },
  {
    id: "agent_anomalyeye",
    slug: "anomalyeye",
    name: "AnomalyEye",
    tagline: "Log and metric triage before you page a human.",
    description:
      "Point AnomalyEye at a log bundle or metrics export and it triages: what spiked, when it started, what correlates, and which service is the likely origin. It writes the incident-channel summary you'd want a calm SRE to write — timeline, blast radius, evidence, and a confidence level.\n\nIt's explicit about uncertainty. \"Correlated but likely coincidental\" is a phrase it actually uses.",
    category: "data",
    creatorId: "northbeam-tools",
    rating: 4.6,
    reviewsCount: 356,
    runsCount: 41900,
    capabilities: [
      "Spike detection with correlated-series analysis",
      "Incident-ready timeline summaries",
      "Likely-origin ranking across services",
      "Stated confidence levels on every finding",
    ],
    providersUsed: ["openai", "embedding"],
    avgExecutionMs: 2800,
    pricing: {
      perRequest: { estMin: 0.06, estMax: 0.1, cap: 0.14 },
      passes: {
        pass_30d: { price: 45 },
      },
    },
  },

  // ---- Vision ----
  {
    id: "agent_pixelproof",
    slug: "pixelproof",
    name: "PixelProof",
    tagline: "Screenshot QA that reads your UI like a picky designer.",
    description:
      "PixelProof compares UI screenshots against your spec or a previous build and reports what a careful design reviewer would: misaligned elements, broken states, contrast failures, truncated text, inconsistent spacing. Findings arrive annotated on the image with severity labels.\n\nRun it on a PR's screenshot diff before a human ever looks — reviewers get a shortlist instead of a spot-the-difference puzzle.",
    category: "vision",
    creatorId: "halide-systems",
    rating: 4.7,
    reviewsCount: 689,
    runsCount: 96200,
    capabilities: [
      "Annotated visual diffs with severity",
      "Contrast and accessibility checks",
      "Spacing and alignment analysis",
      "Copy truncation and overflow detection",
    ],
    providersUsed: ["vision", "openai"],
    avgExecutionMs: 2700,
    pricing: {
      perRequest: { estMin: 0.05, estMax: 0.09, cap: 0.12 },
      passes: {
        pass_24h: { price: 4 },
        pass_7d: { price: 14 },
      },
    },
  },
  {
    id: "agent_alttextor",
    slug: "alttextor",
    name: "AltTextor",
    tagline: "Accessible alt text for your whole image library.",
    description:
      "AltTextor writes alt text that follows accessibility guidance: concise, context-aware, and honest about decorative images (empty alt, marked as such). Feed it a batch of images with optional page context and get back a review-ready table.\n\nIt distinguishes informative images from decoration and writes long descriptions for charts and diagrams where a sentence isn't enough.",
    category: "vision",
    creatorId: "halide-systems",
    rating: 4.4,
    reviewsCount: 174,
    runsCount: 28800,
    capabilities: [
      "Batch alt text with page context",
      "Decorative-image detection",
      "Long descriptions for charts and diagrams",
      "WCAG-aligned phrasing",
    ],
    providersUsed: ["vision"],
    avgExecutionMs: 1600,
    pricing: {
      perRequest: { estMin: 0.01, estMax: 0.02, cap: 0.03 },
      passes: {},
    },
  },
  {
    id: "agent_moodboarder",
    slug: "moodboarder",
    name: "Moodboarder",
    tagline: "Visual reference boards with sources, not vibes.",
    description:
      "Describe a direction — \"editorial, warm, early-2000s print\" — and Moodboarder assembles a reference board: sourced images, palette extraction, typography references, and a paragraph naming the shared qualities so your team can say what they actually mean.\n\nEvery image is linked to its source for licensing checks. It's a starting point for taste conversations, not a replacement for them.",
    category: "vision",
    creatorId: "halide-systems",
    rating: 4.2,
    reviewsCount: 143,
    runsCount: 19600,
    capabilities: [
      "Sourced reference boards from a brief",
      "Palette and typography extraction",
      "Shared-quality analysis in words",
      "Source links for licensing checks",
    ],
    providersUsed: ["vision", "search"],
    avgExecutionMs: 3000,
    pricing: {
      perRequest: { estMin: 0.06, estMax: 0.09, cap: 0.12 },
      passes: {
        pass_24h: { price: 5 },
      },
    },
  },

  // ---- Automation ----
  {
    id: "agent_inboxzeroer",
    slug: "inboxzeroer",
    name: "InboxZeroer",
    tagline: "Email triage and reply drafts, without the inbox handover.",
    description:
      "Export a batch of emails and InboxZeroer returns a triage: what needs you today, what can wait, what's noise — plus reply drafts for the ones that need answers, written to match your previous replies in tone and length.\n\nIt works on exports you choose to share per run, not a standing connection to your inbox. The 24 Hour Pass is popular for post-vacation digs out.",
    category: "automation",
    creatorId: "quiet-systems",
    rating: 4.6,
    reviewsCount: 1102,
    runsCount: 174800,
    capabilities: [
      "Batch triage: today / can wait / noise",
      "Voice-matched reply drafts",
      "Per-run exports — no standing inbox access",
      "Commitment extraction: what you promised whom",
    ],
    providersUsed: ["openai", "embedding"],
    avgExecutionMs: 1900,
    pricing: {
      perRequest: { estMin: 0.02, estMax: 0.04, cap: 0.06 },
      passes: {
        pass_24h: { price: 2 },
        pass_7d: { price: 7 },
        pass_30d: { price: 18 },
      },
    },
    featured: true,
  },
  {
    id: "agent_meeting-distiller",
    slug: "meeting-distiller",
    name: "Meeting Distiller",
    tagline: "Transcripts in, decisions and owners out.",
    description:
      "Meeting Distiller reads a transcript and produces what the meeting was for: decisions made, owners and deadlines, open questions, and a two-paragraph summary for people who skipped it. It quotes the transcript for every decision so nobody relitigates what was said.\n\nIt marks ambiguity honestly — if a decision was maybe made, it lands in open questions, not decisions.",
    category: "automation",
    creatorId: "nova-works",
    rating: 4.8,
    reviewsCount: 934,
    runsCount: 132400,
    capabilities: [
      "Decisions with transcript quotes",
      "Owners and deadlines extracted",
      "Skipped-it summary in two paragraphs",
      "Ambiguity flagged as open questions",
    ],
    providersUsed: ["anthropic"],
    avgExecutionMs: 2300,
    pricing: {
      perRequest: { estMin: 0.04, estMax: 0.06, cap: 0.08 },
      passes: {
        pass_7d: { price: 8 },
        pass_30d: { price: 20 },
      },
    },
  },
  {
    id: "agent_formfiller-flow",
    slug: "formfiller-flow",
    name: "FormFiller Flow",
    tagline: "Documents to structured data, with confidence scores.",
    description:
      "FormFiller Flow extracts structured data from documents — invoices, applications, contracts, scans — into the schema you define. Every extracted field carries a confidence score, and low-confidence fields are queued for human review instead of quietly guessed.\n\nIt handles rotated scans, handwriting within reason, and multi-page documents, and it returns clean JSON or CSV your systems can ingest directly.",
    category: "automation",
    creatorId: "quiet-systems",
    rating: 4.5,
    reviewsCount: 421,
    runsCount: 66300,
    capabilities: [
      "Schema-defined extraction to JSON/CSV",
      "Per-field confidence scores",
      "Human-review queue for low confidence",
      "Scans, rotation, and multi-page handling",
    ],
    providersUsed: ["vision", "openai", "embedding"],
    avgExecutionMs: 2600,
    pricing: {
      perRequest: { estMin: 0.05, estMax: 0.08, cap: 0.11 },
      passes: {
        pass_30d: { price: 30 },
      },
    },
  },
];

export function getAgent(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getAgentsByCreator(creatorId: string): Agent[] {
  return AGENTS.filter((a) => a.creatorId === creatorId);
}
