import { isSupabaseConfigured, resetDealStore } from "@/lib/deal-store";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const demoMode = process.env.DEMO_MODE === "1" || new URL(request.url).searchParams.get("demo") === "1";

  if (!demoMode) {
    return Response.json({ error: "Reset is only available in demo mode." }, { status: 403 });
  }

  try {
    const snapshot = await resetDealStore();
    return Response.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
