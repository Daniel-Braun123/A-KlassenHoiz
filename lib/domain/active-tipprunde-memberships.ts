import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";

export type ActiveTipprundeMembershipRow = {
  rolle?: unknown;
  tipprunden?: unknown;
};

export function readActiveTipprundeMembership(
  row: ActiveTipprundeMembershipRow,
): ActiveTipprundeOption | null {
  const relation = Array.isArray(row.tipprunden) ? row.tipprunden[0] : row.tipprunden;
  if (
    !relation ||
    typeof relation !== "object" ||
    !("id" in relation) ||
    !("name" in relation) ||
    !("status" in relation)
  ) {
    return null;
  }

  const tipprunde = relation as { id: unknown; name: unknown; status: unknown };
  if (tipprunde.status !== "active") {
    return null;
  }

  return {
    id: String(tipprunde.id),
    name: String(tipprunde.name),
    rolle:
      row.rolle === "admin" || row.rolle === "co_admin" || row.rolle === "nutzer"
        ? row.rolle
        : null,
  };
}
