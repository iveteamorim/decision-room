import { scoreDeal } from "@/engine/deal-room";
import type { ScoreWeights, WorkItem } from "@/engine/deal-room";

export { defaultWeights, extractAiAssistedSignals } from "@/engine/deal-room";

export function scoreItem(item: WorkItem, weights?: ScoreWeights) {
  return scoreDeal(item, weights).breakdown;
}
