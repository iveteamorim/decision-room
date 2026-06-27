# Architecture

Decision Room is structured as a product engine with a thin UI layer.

The goal is to keep business logic inspectable, testable, and independent from presentation concerns.

## System Boundary

Decision Room is responsible for:

- Capturing commercial approval requests
- Evaluating deterministic policy constraints
- Calculating weighted approval readiness
- Planning human checkpoints and owner actions
- Explaining the recommendation
- Recording decision events
- Simulating strategy changes against the same engine contract

Decision Room is not responsible for:

- Autonomously approving commercial decisions
- Replacing Finance, Legal, or leadership approval
- Acting as a generic chatbot
- Optimizing policy without human review

## Runtime Flow

```txt
Request intake
  -> input validation
  -> deterministic policy evaluation
  -> weighted scoring
  -> action selection
  -> workflow planning
  -> explanation trace
  -> event persistence
  -> UI/API response
```

## Engine Layout

```txt
src/engine/deal-room/
|-- decision-engine.ts
|-- policies.ts
|-- scoring.ts
|-- workflow.ts
|-- explainability.ts
|-- simulation.ts
|-- intake.ts
|-- events.ts
|-- fixtures.ts
|-- types.ts
`-- index.ts
```

### `decision-engine.ts`

Coordinates the decision pipeline. It keeps orchestration in one place so policy, scoring, workflow, and explanation can evolve independently.

### `policies.ts`

Contains deterministic governance rules. These rules run before scoring so hard constraints cannot be overruled by a favorable score.

### `scoring.ts`

Calculates weighted readiness from inspectable business signals. The score is not treated as truth; it is one input into the recommendation.

### `workflow.ts`

Builds the human review path: owner, checkpoints, blockers, side effects, and valid next actions.

### `explainability.ts`

Turns policy results, scores, thresholds, and workflow state into a reviewable reasoning trace.

### `simulation.ts`

Runs portfolio scenarios through the same engine contract used by live decisions. This keeps simulation aligned with production logic.

### `events.ts`

Models decision events for audit trails and operational history.

## Data Model

The current persistence layer focuses on:

- `deals`: current state and structured approval inputs
- `deal_events`: decision history, state transitions, and audit records

This is intentionally small. A production version would likely add:

- Organizations and workspaces
- Users and role permissions
- Policy configuration versions
- Decision outcome tracking
- Approval packets and exported evidence

## Design Choices

### Policy before score

Non-negotiable business constraints must run before weighted scoring. A high-value deal should not bypass margin, legal, or policy constraints only because its numeric score looks attractive.

### Explainable before autonomous

The product is designed for governed decisions. Operators must be able to see why an action was recommended and where human judgment is required.

### Simulation through the same engine

Strategy simulation should not be a separate approximation. It should use the same policy and scoring path so teams can discuss trade-offs before changing live behavior.

## Production Hardening Path

The next hardening steps are:

- Version policy configurations
- Add stronger policy collision tests
- Persist recommendation snapshots
- Require reason capture on overrides
- Track outcomes after approval
- Add role-based access control around sensitive cases
- Add monitoring for simulation drift and policy drift
