import { decideItem, parseWorkItemPayload } from "@/engine/deal-room";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const intake = parseWorkItemPayload(payload);

  if (!intake.ok) {
    return Response.json({ error: intake.error }, { status: 400 });
  }

  return Response.json(decideItem(intake.item));
}
