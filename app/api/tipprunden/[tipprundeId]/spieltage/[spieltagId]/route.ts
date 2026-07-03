import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseSpieltageRepository,
  deleteSpieltag,
  updateSpieltag,
} from "@/lib/domain/spieltage-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tipprundeId: string; spieltagId: string }> },
) {
  try {
    const { tipprundeId, spieltagId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as {
      name?: string;
      abschnitt?: unknown;
      sortOrder?: unknown;
    };
    const supabase = await createSupabaseServerClient();
    const spieltag = await updateSpieltag(createSupabaseSpieltageRepository(supabase), {
      tipprundeId,
      spieltagId,
      callerNutzerId: user.id,
      name: body.name,
      abschnitt: body.abschnitt,
      sortOrder: body.sortOrder,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ spieltag });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string; spieltagId: string }> },
) {
  try {
    const { tipprundeId, spieltagId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    await deleteSpieltag(createSupabaseSpieltageRepository(supabase), {
      tipprundeId,
      spieltagId,
      callerNutzerId: user.id,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
