# NOVUA Decision Room — 15-Minute Demo Script

Use this flow for live demos, pilot calls, and recruiter walkthroughs. The goal is to show operational pressure, explainability, and human-controlled action without improvising.

## Demo Setup

1. Open `/dashboard`.
2. Make sure demo auth is enabled in production if sharing the live link.
3. If you need a clean state, use the demo reset path before the call.
4. Keep `/decisions/deal-1` and `/simulation` ready in separate tabs.

## 1. Opening Narrative — 60 seconds

Say:

> Commercial approvals often happen under pressure across Sales, Finance, and Policy. Decision Room prepares each deal with policy checks, weighted scoring, reasoning traces, and explicit human checkpoints so teams can move fast without losing control.

What to show:

- `Under review`
- `Needs action`
- `Policy-blocked`
- `Team conflicts`

Point:

- This is not a chatbot.
- It is a decision workspace with governed next steps.

## 2. Live Queue — 3 minutes

Scroll the ranked queue.

Call out:

- deals are ranked by urgency, risk, and policy pressure
- deadlines are live
- actions are not static; they depend on deal state

Recommended line:

> The queue is designed to answer a practical question: what needs human attention first, and why?

Open `deal-1`.

## 3. Decision Brief — 4 minutes

Explain the brief in this order:

1. `State`
2. `Owner`
3. `Deadline`
4. `Action`

Then show:

- stakeholder positions
- recent activity
- valid next actions only

Recommended line:

> The system does not approve the deal autonomously. It prepares the recommendation, shows the blockers, and keeps the approval path human-controlled.

If useful, click one valid action and return to the workspace to show that the queue persists and updates.

## 4. Auditability — 2 minutes

Show:

- recent activity in the brief
- `Export audit packet`

Explain:

- every meaningful action leaves an auditable trail
- the point is traceability, not just recommendation

Recommended line:

> If someone asks why a deal was routed, delayed, or approved, the workspace already contains the answer.

## 5. Pressure & Time — 2 minutes

Back on the dashboard, point out:

- live deadline countdown
- changing priority
- pressure strip

Recommended line:

> This is where the product shifts from static demo to operational behavior. The workspace remembers state, deadlines keep moving, and the queue reorders as pressure changes.

## 6. Simulation — 2 minutes

Open `/simulation`.

Explain:

- teams can test weighting changes before changing policy
- simulation is for strategy discussion, not autonomous execution

Recommended line:

> Simulation helps leadership test governance choices before pushing them into the live approval flow.

## 7. Close — 1 minute

Say:

> Decision Room is best positioned today as an AI-assisted commercial decision workspace for pilots, approval governance experiments, and design-partner conversations. It is already strong for demos and pilot discussions, and the roadmap to enterprise hardening is clear.

## If You Only Have 5 Minutes

Show only:

1. Dashboard queue
2. One deal brief
3. Audit export

## If You Get Asked “Where is the AI?”

Answer:

> Today the product combines deterministic policies, explicit scoring, and an AI-assisted reasoning layer. Policy and human approval remain the source of truth. That makes it safer, more explainable, and easier to deploy in real approval workflows.
