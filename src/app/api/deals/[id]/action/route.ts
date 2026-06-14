import { applyDealAction, isSupabaseConfigured } from "@/lib/deal-store";
import { buildHumanAuditExport } from "@/lib/deal-actions";
import type { HumanAction } from "@/lib/deal-actions";

const ACTIONS = new Set<HumanAction>(["approve", "negotiate", "route"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const action = typeof body === "object" && body !== null && "action" in body
    ? body.action
    : null;

  if (typeof action !== "string" || !ACTIONS.has(action as HumanAction)) {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const updated = await applyDealAction(id, action as HumanAction);
    if (!updated) {
      return Response.json({ error: "Deal not found." }, { status: 404 });
    }

    return Response.json({
      item: updated,
      audit: buildHumanAuditExport(updated, action as HumanAction),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
