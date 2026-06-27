# NOVUA Decision Room

**Commercial decision governance for pricing, discounts, and approval workflows.**

NOVUA Decision Room is a B2B decision workspace for teams that need to move quickly without losing control over margin, risk, policy, or approval accountability.

It combines deterministic policies, weighted scoring, human checkpoints, explainability traces, simulation, and audit events into a single approval workflow.

The system does not approve decisions autonomously. It prepares the case, explains the trade-offs, routes the right review, and keeps the final decision human-controlled.

Live demo: https://decision-room-six.vercel.app/dashboard

## Product Thesis

Commercial approvals often happen under pressure across Sales, Finance, Legal, and leadership.

Teams need speed, but they also need to protect margin, avoid risky terms, and keep decision logic consistent.

Decision Room turns an approval request into a structured decision brief:

- What is being requested
- Which policy rules apply
- What risk or margin exposure exists
- Who needs to review it
- What action is recommended
- Why the system reached that recommendation
- What changed after the human decision

## What It Demonstrates

- Product-grade approval workflow, not a chatbot wrapper
- Deterministic policy evaluation before score-based recommendations
- Explainable scoring across value, margin, urgency, risk, and confidence
- Human-in-the-loop governance for sensitive or low-confidence cases
- Role-aware workspace views for Finance, Sales, Legal, and Policy
- Simulation for comparing strategy changes before changing live workflows
- Audit-oriented event modeling for reviewability and accountability

## Core Workflow

1. **Decision intake**
   A commercial request enters the workspace with structured inputs: value, margin, risk, urgency, confidence, and deadline.

2. **Policy evaluation**
   Hard rules protect margin thresholds, legal exposure, and high-risk approvals before scoring is considered.

3. **Weighted scoring**
   The engine calculates approval readiness from inspectable business signals.

4. **Recommendation**
   Each case maps to one action: approve, negotiate, review, or reject.

5. **Workflow planning**
   The system assigns checkpoints, owners, blockers, and next actions.

6. **Reasoning trace**
   The UI explains which policies, scores, and thresholds influenced the recommendation.

7. **Human action and audit**
   A human operator takes the final action, and the workspace records the decision trail.

8. **Simulation**
   Teams compare strategy profiles, such as margin-first or revenue-first, before changing operating rules.

## Architecture

The UI is intentionally thin. Product logic lives under `src/engine/deal-room/` and is exposed through stable engine functions.

```txt
src/engine/deal-room/
|-- decision-engine.ts   # Orchestrates policy, scoring, workflow, explanation
|-- policies.ts          # Deterministic governance and escalation registry
|-- scoring.ts           # Weighted scoring contract
|-- workflow.ts          # Checkpoints, owners, blockers, side effects
|-- explainability.ts    # Reasoning trace and auditable narrative
|-- simulation.ts        # Portfolio-level scenario simulation
|-- intake.ts            # API payload validation before engine execution
|-- events.ts            # Decision event model
|-- fixtures.ts          # Enterprise-style approval examples
|-- types.ts             # Domain contracts
`-- index.ts             # Public engine API
```

Public API surface:

- `decideItem(item, weights?)`
- `evaluatePolicies(item)`
- `scoreDeal(item, weights?)`
- `buildWorkflowPlan(item, action, policies)`
- `simulateDealPortfolio(items, scenario?)`

For deeper engineering context, see:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/PRODUCT_REVIEW.md`](docs/PRODUCT_REVIEW.md)
- [`docs/DECISIONS.md`](docs/DECISIONS.md)
- [`docs/FAILURE_MODES.md`](docs/FAILURE_MODES.md)
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- [`docs/DEPLOY_CHECKLIST.md`](docs/DEPLOY_CHECKLIST.md)

## Operating Principles

- Policy rules are evaluated before weighted scoring.
- Recommendations must be inspectable and explainable.
- AI can assist context and reasoning, but policy and human approval remain the source of truth.
- High-risk, low-confidence, conflicted, or policy-sensitive cases require explicit checkpoints.
- Simulation is strategy support, not autonomous execution.
- Auditability is treated as core product behavior, not as a reporting add-on.

## Stack

- Next.js App Router
- TypeScript
- Supabase for `deals` and `deal_events`
- Deterministic policy engine
- Weighted scoring model
- Vercel deployment

## Local Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Install and start:

```bash
npm install
npm run dev
```

Open: http://localhost:3000

On first request, the API seeds `deals` and `deal_events` from fixtures automatically.

## Vercel Deploy

Add the same Supabase environment variables in Vercel.

Optional demo controls:

- `DEMO_MODE=1` enables `/api/deals/reset?demo=1` for production demos.
- `DEMO_BASIC_AUTH_USER` and `DEMO_BASIC_AUTH_PASSWORD` enable basic-auth protection for shared demos.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## License

This repository is source-available and proprietary.

Copyright (c) 2026 Ivete de Amorim. All rights reserved.

No permission is granted to use, copy, modify, redistribute, sell, or offer this software as a commercial service without prior written permission from the author.

Commercial licensing is available on request via `iveteamorim@gmail.com`.
