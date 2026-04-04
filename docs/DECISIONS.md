# Decisions

This document captures the main architectural decisions behind Decision Room at its current stage.

## 001 - Policy layer before weighted scoring

### Context

Some operational constraints should not be left to weighted optimization.
If policy-sensitive cases are treated like ordinary score inputs, the system can produce recommendations that are numerically reasonable but operationally unacceptable.

### Decision

The system evaluates hard policy conditions before it applies weighted scoring.

### Why

This makes decision precedence explicit.
It also keeps non-negotiable constraints separate from tunable strategy preferences.

### Trade-off

This adds rule-management complexity, but it prevents soft-scoring logic from overruling hard constraints.

### What would change in production

Policies would likely move toward a more formal configuration or policy engine with stronger validation and test coverage.

## 002 - Deterministic scoring instead of opaque model-led recommendations

### Context

The product needs explainability and operator trust, especially in high-risk cases.

### Decision

Recommendations are derived from explicit, weighted signals rather than from a purely model-generated outcome.

### Why

Operators need to understand how value, risk, urgency, and workload affected the decision.
That is much harder to defend with opaque output.

### Trade-off

This reduces flexibility compared with an autonomous AI-first approach, but it improves traceability and control.

### What would change in production

Model-assisted reasoning could be added as a secondary layer, but the core recommendation path should remain inspectable and bounded.

## 003 - Human override as part of the product, not as an exception

### Context

High-stakes decisions often require human intervention even when a recommendation exists.

### Decision

The system includes explicit human override behavior rather than treating override as an edge case outside the product model.

### Why

This keeps the system honest about ambiguity and supports auditability in cases where confidence or sensitivity is too high for automation alone.

### Trade-off

Manual review reduces automation throughput, but it preserves accountability in the cases where mistakes are most expensive.

### What would change in production

Override actions would need durable audit logs, user attribution, and reason capture.

## 004 - Simulation as a first-class workflow

### Context

Teams need to compare strategies before operationalizing them.
Without simulation, weight tuning becomes guesswork.

### Decision

Decision Room exposes strategy simulation directly in the product rather than hiding it as an internal-only tool.

### Why

This makes strategy trade-offs legible and allows teams to compare revenue-first, risk-first, and balanced approaches before changing the decision model.

### Trade-off

Simulation improves strategic clarity, but it depends heavily on dataset quality and can create false confidence if users assume simulated outcomes equal real-world performance.

### What would change in production

Simulation should be validated against historical outcomes and real operating metrics, not only synthetic scenarios.
