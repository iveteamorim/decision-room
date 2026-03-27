import { decideItem } from "@/lib/decision-engine";
import type { WorkItem } from "@/types/decision";

export async function POST(request: Request) {
  const item = (await request.json()) as WorkItem;
  const result = decideItem(item);

  return Response.json(result);
}
