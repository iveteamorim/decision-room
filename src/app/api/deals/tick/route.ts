import { isSupabaseConfigured, tickDealStore } from "@/lib/deal-store";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const result = await tickDealStore();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tick failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
