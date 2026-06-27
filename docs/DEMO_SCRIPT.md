# NOVUA Decision Room - 15-Minute Demo Script

Use this flow for live demos, pilot calls, and recruiter walkthroughs.

The story is fixed: **Acme 18% enterprise rollout (`deal-1`)** under SLA pressure on a Tuesday afternoon.

## Demo Setup

1. Open `https://decision-room-six.vercel.app/dashboard` or local `/dashboard`.
2. Confirm `deal-1` is ranked first in the queue.
3. If the queue looks burned, open `/dashboard?demo=1` and click **Reset demo deals**.
4. Keep `/decisions/deal-1` and `/simulation` open in separate tabs.
5. Optional: enable basic auth in production before sharing the link externally.

## 1. Opening - 60 seconds

Say:

> Commercial approvals happen under pressure across Sales, Finance, and Legal. Decision Room ranks what needs human attention first, explains why, and keeps every action auditable. AI can assist the reasoning, but humans stay in control.

Show:

- Priority decision card: `deal-1`, `REVIEW`
- Pressure strip: revenue at risk, SLA pressure, required action
- Role switcher: Finance, Sales, Legal, Policy

Point:

- This is not a chatbot.
- It is an operational approval workspace with governed next steps.

## 2. Role Views - 2 minutes

Switch roles in the nav:

| Role | What changes |
| --- | --- |
| Finance | Full queue and flagship operating view |
| Sales | Legal-only deals drop out |
| Legal | Contract and liability decisions only |
| Policy | Margin conflicts and policy exceptions |

Say:

> The same backend supports different operator contexts, similar to enterprise permissions without turning it into a separate product.

## 3. Live Queue - 2 minutes

Scroll the ranked queue.

Call out:

- Deadline countdown
- Rank changes as urgency increases
- Owner, blockers, and recommended action per deal

Line:

> The queue answers one question: what needs human attention first, and why?

Open `deal-1` and click **Review decision**.

## 4. Decision Brief - 4 minutes

Walk in this order:

1. Status
2. Owner
3. Deadline
4. Recommendation
5. Stakeholder positions
6. Next valid action
7. Recent activity

Line:

> The system does not approve autonomously. It prepares the recommendation, surfaces blockers, and records the human decision.

Perform one valid action, such as **Route to Finance** or **Approve and close** as Finance.

Return to the workspace and show that the queue persists and updates.

## 5. Decision Trail and Audit - 2 minutes

Back on the dashboard, open the **Decision trail** panel.

Show:

- Audit entry count
- Recent live events
- Export audit packet

Line:

> If someone asks why a deal was routed, delayed, or approved, the workspace already contains the answer.

## 6. Live Pressure - 2 minutes

Wait for or explain the live tick, which runs every 60 seconds in production.

Show or describe:

- Priority changed toast
- SLA countdown movement
- Pressure strip update

Line:

> The workspace remembers state. Deadlines move, signals arrive, and the queue reorders. It is not a static snapshot.

## 7. Simulation - 2 minutes

Open `/simulation`.

Explain:

- Scenario analysis tests weight changes before changing live policy.
- Decision shifts compare baseline behavior against a margin-first or revenue-first profile.

Line:

> Simulation is for strategy discussion, not autonomous execution.

## 8. Close - 1 minute

Say:

> Decision Room is a live B2B decision workspace for commercial approvals: ranked queue, policy checks, human sign-off, simulation, and audit trail. It is ready for pilot conversations and design-partner evaluation.

## 5-Minute Version

1. Dashboard: priority card, pressure strip, role switcher
2. `deal-1` brief: recommendation, valid action, audit trail
3. Simulation: strategy comparison before workflow changes

## If Asked "Where Is the AI?"

Say:

> Deterministic policies and scoring are the source of truth. AI can assist context and reasoning, but approval authority stays human and auditable. That is intentional for commercial governance.

## Demo Roles Cheat Sheet

- Finance: approve `deal-1`, show full queue
- Sales: show slimmer queue, read-only on Finance-owned deals
- Legal: open liability story
- Policy: open margin conflict
