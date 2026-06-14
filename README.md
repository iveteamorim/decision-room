# NOVUA Decision Room

**AI-assisted decision support for pricing, discounts, and commercial approvals.**

NOVUA Decision Room is an AI-assisted decision workspace for pricing, discounts, and approval governance.

It combines deterministic policies, weighted scoring, human checkpoints, explainability traces, and simulation workflows.

AI supports the reasoning process, but policy and human approval remain the source of truth.

NOVUA Decision Room helps teams evaluate commercial decisions before approval by combining deal value, margin, urgency, risk, confidence, policy rules, and transparent reasoning.

Live demo: https://decision-room-six.vercel.app/dashboard

## Week 1 Demo Readiness

This repository includes:

* `docs/DEMO_SCRIPT.md` — 15-minute live walkthrough
* `docs/DEPLOY_CHECKLIST.md` — production demo checklist
* optional basic-auth protection for shared demos via middleware

## Problem

Commercial approvals often happen under pressure across Sales, Finance, Legal, and leadership.

Teams need to move fast, but they also need to protect margin, avoid risky terms, and keep approval logic consistent.

## Product

Decision Room prepares every decision with:

* Margin and pricing risk analysis
* Policy checks before approval
* Weighted scoring across explicit signals
* Explainable recommendations
* Human review for sensitive or low-confidence cases
* Simulation for pricing strategy changes

The system does not approve deals autonomously. It prepares the decision, explains the trade-offs, and keeps final approval human-controlled.

## Core Workflow

1. **Decision intake**  
   A commercial request enters the workspace with structured inputs: value, margin, risk, urgency, confidence, and approval deadline.

2. **Policy evaluation**  
   Hard rules protect margin thresholds, legal exposure, and high-risk approvals before score-based recommendations.

3. **Weighted scoring**  
   The engine calculates an approval-readiness score from inspectable signals.

4. **Recommendation**  
   Each case maps to one action: approve, negotiate, review, or reject.

5. **Reasoning trace**  
   The UI explains why the recommendation was made and which policy or score threshold influenced it.

6. **Simulation**  
   Teams can test strategy changes, such as what changes if margin matters more.

## Decision Engine Architecture

The UI is intentionally thin. The core product logic lives under:

```txt
src/engine/deal-room/
|-- decision-engine.ts   # Orchestrates policy, scoring, workflow, and explanation
|-- policies.ts          # Deterministic approval governance and escalation registry
|-- scoring.ts           # Deterministic + AI-assisted scoring contract
|-- workflow.ts          # Approval checkpoints, owners, blockers, and side effects
|-- explainability.ts    # Reasoning trace and auditable recommendation narrative
|-- simulation.ts        # Portfolio-level scenario simulation
|-- intake.ts            # API payload validation before engine execution
|-- fixtures.ts          # Enterprise-style approval examples
|-- types.ts             # Domain contracts
`-- index.ts             # Public engine API
```

### Operating Principles

* Deterministic rules are the source of truth for policy violations.
* AI-assisted reasoning is contextual and assistive, not autonomous approval authority.
* Every recommendation returns policy trace, score evidence, confidence context, workflow checkpoints, and operational side effects.
* Human checkpoints remain explicit for low-confidence, high-risk, conflicted, or policy-sensitive decisions.
* Approval chains are modeled across Sales, Finance, Legal, Ops, and Policy.
* Simulations run through the same engine contract as live recommendations.

### Engine Flow

```txt
Decision intake
  -> deterministic policy evaluation
  -> AI-assisted context adapter
  -> weighted scoring
  -> action selection
  -> workflow/checkpoint planning
  -> explanation + audit trace
  -> UI/API consumer
```

### Public API Surface

The app consumes the engine through stable functions:

* `decideItem(item, weights?)`
* `evaluatePolicies(item)`
* `scoreDeal(item, weights?)`
* `buildWorkflowPlan(item, action, policies)`
* `simulateDealPortfolio(items, scenario?)`

Compatibility adapters remain in `src/lib/*`, but new product logic should be added to `src/engine/deal-room/*`.

## Why It Matters

This is decision support, not a chatbot wrapper.

Decision Room shows how AI can support real business governance:

* Explainability
* Approval traceability
* Human-in-the-loop review
* Policy-aware automation
* Strategy simulation before workflow changes

## Stack

* Next.js App Router
* TypeScript
* Supabase (deals + deal_events persistence)
* Policy evaluation engine
* Weighted scoring model
* Vercel deployment

## Local Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env.local` and set:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `SUPABASE_SERVICE_ROLE_KEY`
3. Install and start:

```bash
npm install
npm run dev
```

Open: http://localhost:3000

On first request, the API seeds `deals` and `deal_events` from fixtures automatically.

## Vercel Deploy

Add the same Supabase env vars in the Vercel project settings. Optional: set `DEMO_MODE=1` to enable `/api/deals/reset?demo=1` in production demos.

For password-protected demos, also set:

* `DEMO_BASIC_AUTH_USER`
* `DEMO_BASIC_AUTH_PASSWORD`

## Scripts

* `npm run dev`
* `npm run build`
* `npm run start`
* `npm run lint`

## License

This repository is source-available and proprietary.

Copyright (c) 2026 Ivete de Amorim. All rights reserved.

No permission is granted to use, copy, modify, redistribute, sell, or offer
this software as a commercial service without prior written permission from the
author. Commercial licensing is available on request via
`iveteamorim@gmail.com`.
