# Jatah Ai

**The payment layer for AI agents — pay by time, pay by usage, settled instantly with x402.**

> Stop subscribing. Start paying the way you actually use AI.
> Humans pay by time. Machines pay by usage.

Jatah Ai is a Next.js product demo for a marketplace of AI agents and models billed
per request instead of by flat monthly subscription. Every run is estimated, capped,
approved, and receipted — and buyers can switch to a time pass when a burst of usage
makes more sense than paying per task.

---

## Table of contents

- [Why](#why)
- [How billing works](#how-billing-works)
- [Two ways to pay](#two-ways-to-pay)
- [Why Stellar](#why-stellar)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Brand](#brand)

---

## Why

Flat monthly subscriptions overcharge casual use and undercharge heavy use — and they
assume a human is around to manage a billing plan. Autonomous agents run in bursts, at
odd hours, without a credit card to hand. Jatah Ai charges for what a task actually
costs, settled instantly, with no payment ever happening as a surprise.

```mermaid
flowchart LR
    subgraph Problem["Flat subscriptions"]
        direction TB
        P1["Same price for everyone"]
        P2["No per-task visibility"]
        P3["Built for humans, not agents"]
    end

    subgraph Solution["Jatah Ai"]
        direction TB
        S1["Priced per task"]
        S2["Estimate + hard cap shown upfront"]
        S3["Settles instantly via x402"]
    end

    Problem -. adaptive billing .-> Solution
```

## How billing works

Every run — whether pay-per-request or covered by a time pass — moves through the
same four-step invariant. Nothing charges without explicit approval, and actual usage
never exceeds the cap the buyer already agreed to.

```mermaid
sequenceDiagram
    actor Buyer
    participant UI as Jatah Ai
    participant Store as Billing store
    participant x402 as x402 settlement

    Buyer->>UI: Pick an agent or model
    UI->>Store: Request estimate
    Store-->>UI: Est. range + hard maximum
    UI-->>Buyer: Show estimate & cap

    alt Over budget cap
        Store-->>Buyer: Confirm budget warning
    end

    Buyer->>UI: Approve
    UI->>Store: Run task
    Store->>Store: Roll actual cost (≤ cap)
    Store->>x402: Settle charge
    x402-->>Store: Confirmed
    Store-->>UI: Itemized receipt
    UI-->>Buyer: Receipt (per-provider breakdown)
```

## Two ways to pay

Every agent or model creator can enable **usage billing**, **time passes**, or both —
the buyer picks whichever fits the job, per task.

```mermaid
flowchart TD
    Start(["Pick an agent or model"]) --> Choice{"How do you want to pay?"}

    Choice -->|"Occasional / unpredictable"| Usage["<b>x402 Pay-Per-Request</b><br/>Estimate + hard max shown upfront<br/>Approve once → settles instantly<br/>Itemized receipt per run"]
    Choice -->|"Heavy, concentrated use"| Pass["<b>Time Pass</b><br/>Flat price, unlimited runs<br/>24 Hours · 7 Days · 30 Days<br/>Built for sprints & deadlines"]

    Usage --> Receipt["Per-run itemized receipt"]
    Pass --> Window["Unlimited runs until the pass expires"]
```

| | x402 Pay-Per-Request | Time Pass (24h / 7d / 30d) |
|---|---|---|
| Pricing | Estimated range + hard maximum per run | One flat price for the whole window |
| Best for | Unpredictable, occasional runs | Hackathons, sprints, deadline pushes |
| Settlement | Instantly via x402, per run | Once, at purchase |
| Receipt | Itemized per-provider breakdown | Runs inside the window show as covered, $0 |

## Why Stellar

The per-request charges this product is built around are small — a single agent run
settles for a few cents, itemized down to the sub-cent. Card rails and most payment
processors have a fixed cost per transaction that makes charges that size uneconomical;
an autonomous buyer also can't sit through a checkout flow. That's the gap Stellar
fills here: sub-cent fees, ~5 second finality, and a settlement path that doesn't
require a human to approve a card.

Concretely, in this codebase:

- **Wallet top-ups run on-chain.** [`lib/stellar/soroban.ts`](./lib/stellar/soroban.ts)
  calls a deployed Soroban contract (`top_up`) that pulls native XLM from a connected
  wallet into a treasury account and records the credited amount on-chain — not a
  database row, a contract call you can verify on
  [Stellar Expert](https://stellar.expert).
- **Any wallet, one interface.** [`lib/stellar/wallet-kit.ts`](./lib/stellar/wallet-kit.ts)
  wraps `@creit.tech/stellar-wallets-kit` so connect/sign flows aren't hardcoded to one
  wallet provider.
- **Balances and history read straight from the chain.** `hooks/use-stellar-balance.ts`
  and `hooks/use-onchain-credited.ts` query Horizon and the contract directly — the
  [`StellarWalletCard`](./components/wallet/stellar-wallet-card.tsx) shown in the wallet
  page isn't a mock.

This runs entirely on **testnet** today (Friendbot-funded accounts, a demo treasury
address) — it's the infra proving the settlement rail works, not a claim that real
funds move. The per-request AI billing math itself (estimate, cap, receipt) is still
simulated client-side; Stellar is wired in at the layer that's real in this demo — the
wallet — as the foundation the rest of the settlement flow is modeled on.

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router) · **React 19** · **TypeScript**
- **[Zustand](https://zustand.docs.pmnd.rs)** — client billing store, persisted to `localStorage`
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) — component layer
- **[Recharts](https://recharts.org)** — analytics & spend charts
- **[Motion](https://motion.dev)** — page and interaction animation
- **x402** — the settlement protocol every charge in this demo models itself on
- **[Stellar SDK](https://developers.stellar.org) + Soroban** — on-chain wallet
  top-ups via a deployed testnet contract
- **[`@creit.tech/stellar-wallets-kit`](https://github.com/Creit-Tech/Stellar-Wallets-Kit)**
  — wallet-agnostic connect/sign

## Architecture

```mermaid
flowchart TB
    subgraph Routes["app/"]
        Marketing["(marketing)<br/>Landing, pricing, how it works"]
        Platform["(platform)<br/>Marketplace, agent/model pages,<br/>dashboard, wallet, budgets, creator studio"]
    end

    subgraph State["lib/store"]
        AppStore["app-store.ts<br/>(Zustand)"]
        Selectors["selectors.ts"]
        Hooks["hooks.ts"]
    end

    subgraph Domain["lib/"]
        Billing["billing.ts<br/>estimate · cap · receipt math"]
        Format["format.ts<br/>money, tokens, dates"]
        Data["data/<br/>agents · models · creators · seed"]
    end

    Marketing --> AppStore
    Platform --> AppStore
    AppStore --> Billing
    AppStore --> Data
    AppStore --> Selectors
    Selectors --> Hooks
    Billing --> Format
```

## Project structure

```
app/
├─ (marketing)/         # Landing page: hero, pricing, how-it-works, CTA
└─ (platform)/          # Signed-in app surface
   ├─ marketplace/      # Browse agents
   ├─ agents/[slug]/    # Agent detail + run flow
   ├─ models/[slug]/    # Direct model access + run flow
   ├─ dashboard/        # Spend overview
   ├─ wallet/           # Balance, top-ups, passes
   ├─ transactions/     # Full transaction history
   ├─ budgets/          # Daily / weekly / monthly caps
   ├─ analytics/        # Spend charts
   ├─ api-keys/         # Direct model API keys
   └─ creator/          # Creator Studio — set your own pricing

components/
├─ billing/             # Estimate card, receipt card, run modal, pass purchase
├─ agents/, models/     # Catalog cards, billing option pickers
├─ wallet/, budgets/, analytics/, transactions/, dashboard/
├─ marketing/           # Hero, pricing comparison, subscription tiers, pass tiers
└─ ui/                  # shadcn primitives

lib/
├─ billing.ts           # Deterministic cost rolling, breakdown math
├─ format.ts            # Money / token / date formatting (locked rules)
├─ types.ts             # Agent, AiModel, Transaction, PassType, ...
├─ store/                # Zustand store, selectors, hooks
├─ stellar/             # Soroban top-up contract calls, wallet-kit, Horizon reads
└─ data/                # Seed catalog: agents, models, creators, providers
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs entirely on seeded,
client-side state (Zustand + `localStorage`) — no backend or database required.

```bash
npm run build   # production build
npm run lint    # ESLint
```

## Brand

Colors, typography, voice, and money-formatting rules live in [`brand.md`](./brand.md)
— read it before touching UI. Short version: premium, minimal, near-black primary
actions, indigo reserved for interaction only, no gradients or crypto clichés.
