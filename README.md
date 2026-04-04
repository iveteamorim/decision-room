# Decision Room

**AI decision workspace for high-risk operational cases.**

Decision Room helps teams evaluate time-sensitive cases where revenue, risk, urgency, and workload must be balanced under pressure.

---

## Live Links

* Live Demo: https://decision-room-six.vercel.app
* GitHub: https://github.com/iveteamorim/decision-room

---

## Overview

Critical operational decisions often break down when multiple constraints compete at once.
Teams move slowly, justify decisions inconsistently, and lose visibility into why one action was chosen over another.

Decision Room introduces a structured decision layer that helps teams:

* Evaluate high-risk items through explicit signals
* Apply policy constraints before automation
* Explain why a decision was made
* Keep a human override path for ambiguous or sensitive cases

---

## Who is this for

Teams handling operational cases where business value, risk, and urgency must be balanced, such as:

* Revenue and deal review workflows
* Support escalation and triage
* Risk or compliance-sensitive cases

---

## How It Works

1. **Case ingestion**  
   A case enters the workspace with structured inputs such as value, urgency, risk, confidence, and workload.

2. **Policy evaluation**  
   Hard rules are evaluated first to catch conditions that should override score-driven behavior.

3. **Weighted scoring**  
   Each case is scored across normalized signals to produce an actionable recommendation.

4. **Explainability layer**  
   The system exposes signal contribution, policy hits, and threshold mapping behind the recommendation.

5. **Human override**  
   Operators can review or override the recommendation when confidence or sensitivity requires it.

6. **Simulation**  
   Teams can adjust strategy weights and observe how decisions shift across the case set.

---

## Architecture

![Mission Control](./public/mission-control.png)

### Stack

* **Frontend / Backend:** Next.js (App Router + Route Handlers)
* **Language:** TypeScript
* **Decision Layer:** Policy evaluation + weighted scoring
* **Deployment:** Vercel

---

## Technical Docs

* [Decisions](./docs/DECISIONS.md)
* [Failure Modes](./docs/FAILURE_MODES.md)

---

## Technical Decisions

This system is designed as a decision-support layer, not as a background automation engine.

* **Policy layer before scoring**  
  Hard constraints run before weighted scoring so the system can enforce non-negotiable rules before considering softer optimization signals.

* **Weighted scoring instead of opaque model output**  
  Recommendations are derived from explicit signal weights to keep the reasoning inspectable and adjustable.

* **Human-in-the-loop by design**  
  Sensitive or low-confidence cases keep a manual review path instead of forcing automation where auditability matters more than throughput.

* **Simulation as a product feature**  
  Strategy tuning is exposed directly in the product so teams can compare revenue-first, risk-first, and balanced operating models without rewriting the core engine.

---

## System Boundaries

This system focuses on:

* Operational case evaluation
* Decision explainability
* Strategy simulation
* Human override on sensitive decisions

It does not attempt to solve:

* Full CRM lifecycle management
* Full ticketing or compliance case management
* Autonomous decision execution across external systems

---

## Trade-offs

* **Deterministic scoring vs model-led autonomy**  
  The current system favors explicit scoring logic over a fully model-driven decision path. This improves transparency but reduces flexibility.

* **Simulation dataset vs real system integrations**  
  The product currently demonstrates decision behavior through a controlled dataset rather than live production integrations.

* **Explainability depth vs workflow breadth**  
  The product goes deep on why decisions happen, but stays narrow on downstream execution and lifecycle management.

* **Single decision workspace vs domain-specific tooling**  
  A unified decision model improves consistency across use cases, but can abstract away domain-specific nuance if pushed too far.

---

## Expected Impact

This system is designed to:

* Reduce inconsistency in high-risk decisions
* Improve explainability of automated recommendations
* Make policy constraints visible in operational workflows
* Help teams compare strategy trade-offs before applying them

> Note: Impact is based on system design and expected workflow behavior, not measured production data.

---

## Production Readiness

This system is currently designed as a functional decision-engine demo with a clear path to production hardening.

### Current capabilities

* Weighted scoring engine
* Policy override layer
* Explainability breakdown per case
* Human override workflow
* Strategy simulation across scenarios

### Current limitations

* No persistent audit storage
* No real external system ingestion
* No role-based decision governance
* No queueing or event-driven orchestration

### Next steps

* Persistent audit log and review history
* Integration with real source systems
* Role-aware approval workflows
* Configurable policy management

---

## Failure Modes & Engineering Risks

While the system is intentionally explicit and explainable, several risks appear as soon as it moves toward production:

* **Policy collisions**  
  Overlapping hard rules can create contradictory decision paths if policy precedence is not strictly defined.

* **Scoring bias**  
  Incorrect weights can systematically favor revenue, urgency, or workload in ways that distort operator behavior.

* **False confidence**  
  A clear recommendation UI can make weak inputs appear more trustworthy than they are.

* **Simulation drift**  
  Strategy behavior validated on synthetic or controlled datasets may not hold under real operational noise.

* **Missing audit persistence**  
  Without durable storage, overrides and rationale can be lost, reducing accountability.

---

## Mitigation Strategy (Planned)

* Explicit policy precedence rules
* Weight review and calibration against real outcomes
* Confidence-aware review thresholds
* Persistent audit trail for overrides and rationale
* Real-world validation before automated downstream actions

---

## Positioning

Decision Room is not a dashboard for passive monitoring.

It is an **AI decision workspace for high-risk operational cases**, designed to structure reasoning, expose trade-offs, and keep human control where the cost of being wrong is high.

The goal is not blind automation —  
but consistent, explainable, auditable decision-making under pressure.

---

## Screenshots

### Mission Control

![Mission Control](./public/mission-control.png)

### Simulation Lab

![Simulation Lab](./public/simulation-lab.png)

### Decision Workspace

![Decision Workspace](./public/decision-workspace.png)

---

## Project Structure

* `src/app` – pages, routes, and route handlers
* `src/components` – UI and workflow components
* `src/lib` – scoring, policies, dataset, and decision engine logic
* `public` – screenshots and static assets

---

## Local Setup

```bash
npm install
npm run dev
```

Open: http://localhost:3000

---

## Scripts

* `npm run dev`
* `npm run build`
* `npm run start`
* `npm run lint`
