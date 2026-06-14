import { materializeSeedItems, simulateDealPortfolio } from "@/engine/deal-room";

export async function GET() {
  return Response.json(simulateDealPortfolio(materializeSeedItems()));
}
