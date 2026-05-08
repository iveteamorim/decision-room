import { decideItem, items, replayDecisionLedger } from "@/engine/deal-room";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return Response.json({ error: "Deal not found." }, { status: 404 });
  }

  const decision = decideItem(item);

  return Response.json({
    ledger: decision.ledger,
    replay: replayDecisionLedger(decision.ledger),
  });
}
