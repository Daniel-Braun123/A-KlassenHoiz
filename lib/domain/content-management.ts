import { canManageTipprundeContent } from "@/lib/auth/permissions";
import { AppError } from "@/lib/domain/errors";
import type { TipprundeRolle } from "@/lib/domain/types";

export type ContentMembership = {
  rolle: TipprundeRolle;
};

export type ContentManagerRepositoryPart = {
  getAktiveMitgliedschaft(tipprundeId: string, nutzerId: string): Promise<ContentMembership | null>;
};

export async function assertCanManageContent(
  repository: ContentManagerRepositoryPart,
  input: { tipprundeId: string; callerNutzerId: string; isGlobalAdmin?: boolean },
): Promise<void> {
  if (input.isGlobalAdmin) {
    return;
  }

  const membership = await repository.getAktiveMitgliedschaft(
    input.tipprundeId,
    input.callerNutzerId,
  );
  if (!canManageTipprundeContent({ rolle: membership?.rolle ?? null })) {
    throw new AppError(
      "Nur Admins und Co-Admins duerfen den Spielplan verwalten.",
      "content_manager_required",
      403,
    );
  }
}

export function normalizeOptionalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export function requireNonBlank(value: string, message: string, code: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AppError(message, code, 400);
  }

  return trimmed;
}
