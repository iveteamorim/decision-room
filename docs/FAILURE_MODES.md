# Failure Modes

This document captures the main failure modes expected in Decision Room as it moves from demo-grade decision support toward production-grade operational tooling.

## 001 - Policy collisions

### Risk

Two or more hard rules may apply to the same case and point toward different actions.
Without strict precedence, the system can behave inconsistently.

### Current handling

The product assumes a relatively controlled policy set and does not yet expose a formal precedence management system.

### Missing

- Explicit policy priority model
- Policy conflict testing
- Clear operator-facing conflict visibility

### Production mitigation

- Add policy precedence rules
- Test overlapping rules systematically
- Surface conflict reasons when override behavior occurs

## 002 - Scoring bias from incorrect weights

### Risk

A poorly tuned scoring model can systematically favor one business objective over another and distort decisions.

### Current handling

The product exposes simulation so weight changes are visible, but this does not guarantee calibrated decisions.

### Missing

- Calibration against historical outcomes
- Change review around weight updates
- Stronger validation of domain-specific weighting assumptions

### Production mitigation

- Compare simulated decisions against real outcomes
- Version weight configurations
- Introduce review gates for material strategy changes

## 003 - False confidence from explainable output

### Risk

A clean explanation UI can make a recommendation appear more reliable than the underlying inputs justify.

### Current handling

The system exposes signal breakdowns and human override paths, but it does not yet model confidence rigorously across all decision flows.

### Missing

- Confidence thresholds in the recommendation layer
- Stronger low-confidence handling
- Clearer distinction between recommendation and approved action

### Production mitigation

- Add explicit confidence-aware review thresholds
- Require human review for low-confidence cases
- Separate recommendation state from execution state

## 004 - Simulation drift

### Risk

A strategy that looks good on controlled data may fail on messy real-world inputs.

### Current handling

The current product uses a designed dataset to make system behavior legible and testable.

### Missing

- Validation against historical operational data
- Monitoring of strategy drift over time
- Feedback loop between simulation and actual outcomes

### Production mitigation

- Validate simulation against real case histories
- Track post-decision outcomes
- Recalibrate strategies periodically

## 005 - Missing audit persistence

### Risk

If overrides, rationale, and recommendations are not durably stored, decision accountability breaks down quickly.

### Current handling

The product models auditability conceptually, but persistence is not yet the core of the current implementation.

### Missing

- Durable decision log
- Override history
- User attribution for changes

### Production mitigation

- Persist recommendation, override, and rationale history
- Attribute changes to users and timestamps
- Add reviewable audit timelines per case
