# NOVUA Decision Room — 15-Minute Demo Script

Use this flow for live demos, pilot calls, and recruiter walkthroughs. The story is fixed: **Acme 18% enterprise rollout (deal-1)** under SLA pressure on a Tuesday afternoon.

## Demo Setup

1. Open `https://decision-room-six.vercel.app/dashboard` (or local `/dashboard`).
2. Confirm **deal-1** is `#1` in the queue. If the queue looks burned, open `/dashboard?demo=1` and click **Reset demo deals**, or reload — auto-reseed restores the scenario when needed.
3. Keep `/decisions/deal-1` and `/simulation` in separate tabs.
4. Optional: enable basic auth in production before sharing the link.

## 1. Opening — 60 seconds

Say:

> Commercial approvals happen under pressure across Sales, Finance, and Legal. Decision Room ranks what needs human attention first, explains why, and keeps every action auditable. AI assists — humans stay in control.

What to show:

- **Priority decision** card (deal-1, REVIEW)
- **Pressure strip** — EUR at risk, SLA breaches, need action
- **Role switcher** in the nav — Finance / Sales / Legal / Policy

Point:

- This is not a chatbot.
- It is an operational approval workspace with governed next steps.

## 2. Role Views — 2 minutes

Switch roles in the nav:

| Role | What changes |
|------|----------------|
| **Finance** | Full queue — flagship view |
| **Sales** | Legal-only deals drop out (e.g. liability clause) |
| **Legal** | Contract / liability decisions only |
| **Policy** | Margin conflicts and rule exceptions |

Say:

> The same backend, different operator context — like real enterprise permissions without a separate product.

## 3. Live Queue — 2 minutes

Scroll the ranked queue.

Call out:

- live **deadline countdown**
- rank changes as urgency increases
- owner, blockers, and recommended action per deal

Line:

> The queue answers one question: what needs human attention first, and why?

Open **deal-1** → **Review decision**.

## 4. Decision Brief — 4 minutes

Walk in this order:

1. **Status**
2. **Owner**
3. **Deadline**
4. **Recommendation**

Then show:

- **Stakeholder positions**
- **Next action** (only valid actions for this deal state)
- **Recent activity**

Line:

> The system does not approve autonomously. It prepares the recommendation, surfaces blockers, and records the human decision.

Perform one valid action (e.g. **Route to Finance** or **Approve and close** as Finance). Return to the workspace — the queue persists and updates.

## 5. Decision Trail & Audit — 2 minutes

Back on the dashboard, open the **Decision trail** panel.

Show:

- audit entry count
- recent live events
- **Export audit packet** (JSON download)

Line:

> If someone asks why a deal was routed, delayed, or approved, the workspace already contains the answer.

## 6. Live Pressure — 2 minutes

Wait for or explain the live tick (every 60s in prod):

- toast: **Priority changed** or new operational signal
- SLA countdown moving
- pressure strip updating

Line:

> The workspace remembers state. Deadlines move, signals arrive, and the queue reorders — it is not a static snapshot.

## 7. Simulation — 2 minutes

Open `/simulation`.

Explain:

- **Scenario analysis** — test weight changes before changing live policy
- **Decision shifts** — compare baseline vs margin-first profile

Line:

> Simulation is for strategy discussion, not autonomous execution.

## 8. Close — 1 minute

Say:

> Decision Room is a live B2B decision workspace for commercial approvals — ranked queue, policy checks, human sign-off, and audit trail. It is ready for pilot conversations and design-partner evaluation today.

## 5-Minute Version

1. Dashboard — priority card + pressure strip + role switch
2. deal-1 brief — recommendation + export audit
3. One sentence on simulation

## If Asked “Where Is the AI?”

> Deterministic policies and scoring are the source of truth. AI assists context and reasoning, but approval authority stays human and auditable. That is intentional for real commercial governance.

## Demo Roles Cheat Sheet

- **Finance** — approve deal-1, show full queue
- **Sales** — show slimmer queue, read-only on Finance-owned deals
- **Legal** — open deal-3 liability story
- **Policy** — open deal-2 margin conflict
