import type { WorkItem } from "./types";

type IntakeResult =
  | { ok: true; item: WorkItem }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasNumber(payload: Record<string, unknown>, key: keyof WorkItem) {
  return typeof payload[key] === "number";
}

function hasString(payload: Record<string, unknown>, key: keyof WorkItem) {
  return typeof payload[key] === "string";
}

export function parseWorkItemPayload(payload: unknown): IntakeResult {
  if (!isRecord(payload)) {
    return { ok: false, error: "Request body must be a deal object." };
  }

  const requiredStrings: Array<keyof WorkItem> = [
    "id",
    "type",
    "title",
    "status",
    "decisionRisk",
    "approvalState",
    "owner",
  ];
  const requiredNumbers: Array<keyof WorkItem> = [
    "valueEur",
    "riskScore",
    "urgencyScore",
    "marginScore",
    "confidence",
    "slaHours",
    "financialImpactEur",
  ];

  const missingString = requiredStrings.find((key) => !hasString(payload, key));
  if (missingString) {
    return { ok: false, error: `Missing or invalid string field: ${missingString}` };
  }

  const missingNumber = requiredNumbers.find((key) => !hasNumber(payload, key));
  if (missingNumber) {
    return { ok: false, error: `Missing or invalid numeric field: ${missingNumber}` };
  }

  if (typeof payload.policyBlock !== "boolean") {
    return { ok: false, error: "Missing or invalid boolean field: policyBlock" };
  }

  if (!Array.isArray(payload.blockers) || !Array.isArray(payload.stakeholders) || !Array.isArray(payload.auditTrail)) {
    return { ok: false, error: "blockers, stakeholders, and auditTrail must be arrays." };
  }

  return { ok: true, item: payload as unknown as WorkItem };
}
