import type { SpielStatus, TipprundeRolle } from "@/lib/domain/types";

export type PermissionContext = {
  rolle?: TipprundeRolle | null;
  isOwner?: boolean;
  isGlobalAdmin?: boolean;
};

export function canViewTipprunde({ rolle, isGlobalAdmin }: PermissionContext): boolean {
  return Boolean(isGlobalAdmin || rolle);
}

export function canManageTipprundeContent({ rolle, isGlobalAdmin }: PermissionContext): boolean {
  return Boolean(isGlobalAdmin || rolle === "admin" || rolle === "co_admin");
}

export function canManageCoAdmins({ rolle, isOwner, isGlobalAdmin }: PermissionContext): boolean {
  return Boolean(isGlobalAdmin || (rolle === "admin" && isOwner));
}

export function canArchiveTipprunde({ rolle, isOwner, isGlobalAdmin }: PermissionContext): boolean {
  return Boolean(isGlobalAdmin || (rolle === "admin" && isOwner));
}

export function canPermanentlyDeleteTipprunde({
  rolle,
  isOwner,
  isGlobalAdmin,
}: PermissionContext): boolean {
  return Boolean(isGlobalAdmin || (rolle === "admin" && isOwner));
}

export function canTransferBesitzerrechte(): boolean {
  return false;
}

export function canSubmitOwnTipp({
  isOwnTipp,
  now,
  anstosszeit,
  spielStatus,
}: {
  isOwnTipp: boolean;
  now: Date;
  anstosszeit: Date;
  spielStatus: SpielStatus;
}): boolean {
  return isOwnTipp && spielStatus === "geplant" && now.getTime() < anstosszeit.getTime();
}
