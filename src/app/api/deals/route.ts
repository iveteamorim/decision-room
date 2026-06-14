import { getDealStoreSnapshot, isSupabaseConfigured } from "@/lib/deal-store";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  try {
    const snapshot = await getDealStoreSnapshot();
    return Response.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load deals.";
    return Response.json({ error: message }, { status: 500 });
  }
}
