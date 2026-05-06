import { items, simulateDealPortfolio } from "@/engine/deal-room";

export async function GET() {
  return Response.json(simulateDealPortfolio(items));
}
