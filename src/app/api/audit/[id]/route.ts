import { decideItem, replayDecisionLedger } from "@/engine/deal-room";
import { getDealById, isSupabaseConfigured } from "@/lib/deal-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { id } = await params;

  try {
    const item = await getDealById(id);

    if (!item) {
      return Response.json({ error: "Deal not found." }, { status: 404 });
    }

    const decision = decideItem(item);

    return Response.json({
      dealId: item.id,
      title: item.title,
      exportedAt: new Date().toISOString(),
      ledger: decision.ledger,
      replay: replayDecisionLedger(decision.ledger),
      auditTrail: item.auditTrail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit export failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
