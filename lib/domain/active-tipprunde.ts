export const ACTIVE_TIPPRUNDE_STORAGE_KEY = "a-klassenhoiz.active-tipprunde";
export const ACTIVE_TIPPRUNDE_COOKIE = "a_klassenhoiz_active_tipprunde";

export type ActiveTipprundeOption = {
  id: string;
  name: string;
  currentSpieltagId?: string | null;
};

export function getTipprundeStartPath(
  option: Pick<ActiveTipprundeOption, "id" | "currentSpieltagId">,
): string {
  const spieltagId = option.currentSpieltagId || "demo-spieltag";
  return `/${option.id}/spieltage/${spieltagId}`;
}

export function readActiveTipprundeId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_TIPPRUNDE_STORAGE_KEY);
}

export function writeActiveTipprundeId(tipprundeId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_TIPPRUNDE_STORAGE_KEY, tipprundeId);
  document.cookie = `${ACTIVE_TIPPRUNDE_COOKIE}=${encodeURIComponent(
    tipprundeId,
  )}; path=/; max-age=31536000; samesite=lax`;
}
