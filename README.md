# NÓVUA Deal Room

**AI decision support for pricing, discounts, and deal approvals.**

NÓVUA Deal Room helps teams evaluate deals before approval by combining deal value, margin, urgency, risk, confidence, policy rules, and transparent reasoning.

Live demo: https://decision-room-six.vercel.app

## Problem

Deal approvals often happen under pressure across Sales, Finance, Legal, and leadership.

Teams need to close fast, but they also need to protect margin, avoid risky terms, and keep approval logic consistent.

## Product

Deal Room prepares every deal with:

* Margin and pricing risk analysis
* Policy checks before approval
* Weighted scoring across explicit signals
* Explainable recommendations
* Human review for sensitive or low-confidence deals
* Simulation for pricing strategy changes

The system does not approve deals autonomously. It prepares the decision, explains the trade-offs, and keeps the final approval human-controlled.

## Core Workflow

1. **Deal intake**  
   A deal enters the workspace with structured inputs: value, margin, risk, urgency, confidence, and approval deadline.

2. **Policy evaluation**  
   Hard rules protect margin thresholds, legal exposure, and high-risk approvals before score-based recommendations.

3. **Weighted scoring**  
   The engine calculates an approval-readiness score from inspectable signals.

4. **Recommendation**  
   Each deal maps to one action: approve, negotiate, review, or reject.

5. **Reasoning trace**  
   The UI explains why the recommendation was made and which policy or score threshold influenced it.

6. **Simulation**  
   Teams can test strategy changes, such as “what changes if margin matters more?”

## Why It Matters

This is decision support, not a chatbot wrapper.

Deal Room shows how AI can support real business governance:

* Explainability
* Approval traceability
* Human-in-the-loop review
* Policy-aware automation
* Strategy simulation before workflow changes

## Stack

* Next.js App Router
* TypeScript
* Policy evaluation engine
* Weighted scoring model
* Vercel deployment

## Local Setup

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Scripts

* `npm run dev`
* `npm run build`
* `npm run start`
* `npm run lint`
