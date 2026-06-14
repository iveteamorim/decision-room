import {
  applyDealAction as applyDealActionInRepository,
  ensureSeeded,
  getDealById as getDealByIdFromRepository,
  getDealStoreSnapshot as getDealStoreSnapshotFromRepository,
  resetDealStore as resetDealStoreInRepository,
  tickDealStore as tickDealStoreInRepository,
} from "@/lib/deal-repository";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { HumanAction } from "@/lib/deal-actions";

export { isSupabaseConfigured };

function assertSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
}

export async function getDealStoreSnapshot() {
  assertSupabase();
  return getDealStoreSnapshotFromRepository();
}

export async function getDealById(id: string) {
  assertSupabase();
  return getDealByIdFromRepository(id);
}

export async function applyDealAction(id: string, action: HumanAction) {
  assertSupabase();
  return applyDealActionInRepository(id, action);
}

export async function tickDealStore() {
  assertSupabase();
  return tickDealStoreInRepository();
}

export async function resetDealStore() {
  assertSupabase();
  return resetDealStoreInRepository();
}

export async function warmDealStore() {
  assertSupabase();
  await ensureSeeded();
}
