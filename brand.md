# Brand — Jatah Ai

_Status: active_

**Jatah Ai** is the payment layer for AI agents — pay by time, pay by usage, settled instantly on Stellar (testnet demo).
Tagline: **"Stop Subscribing. Start Paying the Way You Actually Use AI."**
Manifesto line (appears on every major surface): **"Humans pay by time. Machines pay by usage."**

## Register

Premium, minimal, trustworthy — Apple / Linear / Stripe / Vercel. This is financial
infrastructure, not a crypto product. It must read as calm and precise.

**Hard bans:** neon, cyberpunk, glassmorphism, gradient blobs, blockchain clichés
(coins, chains, hexagons), emoji in UI, decorative icon grids.

## Color

Semantic tokens live in `app/globals.css` (`:root` / `.dark`). Never hardcode hex in
components — always use Tailwind token classes (`bg-card`, `text-muted-foreground`,
`bg-brand-soft`, `text-success`, …).

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#FAFAFA` | `#09090B` | page background |
| `card` | `#FFFFFF` | `#111114` | cards — pure white in light |
| `foreground` | `#111827` | `#F4F4F5` | ink |
| `primary` | `#111827` | `#FAFAFA` | primary CTAs (near-black / inverted) |
| `muted-foreground` | `#6B7280` | `#A1A1AA` | secondary text |
| `border` | `#E5E7EB` | `white/9%` | hairlines — borders do the work in dark |
| `brand` | `#4F46E5` | `#6366F1` | indigo — **interaction only** |
| `brand-soft` | `#EEF2FF` | `indigo/14%` | active nav, selected chips |
| `success` (+`-soft`) | `#10B981` | `#34D399` | credits, covered-by-pass, paid states |
| `warning` (+`-soft`) | `#F59E0B` | `#FBBF24` | budget warnings, cap notices |
| `chart-1…5` | indigo, emerald, amber, slate, violet | lightened variants | data viz only |

**The indigo rule:** `brand` appears only on links, active nav states, focus rings,
selected controls, and chart-1. Never as a large fill or button background. Primary
buttons are near-black (light) / white (dark).

## Typography

- **Inter** (`--font-sans`) for everything. Weights 400 / 500 / 600 only.
- `tracking-tight` on headings `text-3xl` and larger.
- **All numerals get `tabular-nums`** — money, counts, durations, table columns.
- **Geist Mono** (`--font-mono`) only for receipt IDs, transaction hashes, code.
- Money is Inter + tabular-nums, never mono (mono money reads as a terminal).

## Money formatting (locked rules — `lib/format.ts`)

- `>= $1` → 2 decimals (`$12.40`) · `$0.01–1` → 2–3 decimals, trimmed (`$0.048`, `$0.04`)
- `< $0.01` → 4 decimals (`$0.0032`) · balances / passes / budgets → always 2 decimals
- Ranges use an en dash: `$0.04 – $0.06` · credits: `+$20.00` in success color
- Charges render plain — no minus theater. Durations: `1.8s`.

## Shape & space

- Radius: `--radius: 0.75rem` — cards `rounded-xl`, controls `rounded-lg`.
- Cards: `bg-card rounded-xl border shadow-card` (shadows vanish in dark; borders carry).
- Spacing is generous: landing sections 96–128px vertical; app pages `gap-6`/`gap-8`.
- One allowed decoration: a ≤4%-opacity radial indigo wash behind the landing hero.

## Voice

Calm, precise, like a good receipt. State costs plainly. Never upsell, never surprise.

- "You'll never pay more than $0.08." — not "Unlock unlimited power!"
- "Covered by your 7 Day Sprint." — not "FREE!"
- Every charge is explained before it happens and itemized after.

## Core UX invariant

Estimated cost → hard maximum → explicit approval → itemized receipt.
No payment surprise is ever acceptable. If a run may exceed a remaining budget,
ask first. If actual usage exceeds the estimate, charge the cap and say so.
