import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseSpieleRepository,
  deleteSpiel,
  updateSpiel,
} from "@/lib/domain/spiele-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tipprundeId: string; spielId: string }> },
) {
  try {
    const { tipprundeId, spielId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as {
      spieltagId?: string;
      heimteamId?: string;
      auswaertsteamId?: string;
      anstossDatum?: string;
      anstossUhrzeit?: string;
      status?: unknown;
    };
    const supabase = await createSupabaseServerClient();
    const spiel = await updateSpiel(createSupabaseSpieleRepository(supabase), {
      tipprundeId,
      spielId,
      callerNutzerId: user.id,
      spieltagId: body.spieltagId,
      heimteamId: body.heimteamId,
      auswaertsteamId: body.auswaertsteamId,
      anstossDatum: body.anstossDatum,
      anstossUhrzeit: body.anstossUhrzeit,
      status: body.status,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ spiel });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string; spielId: string }> },
) {
  try {
    const { tipprundeId, spielId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    await deleteSpiel(createSupabaseSpieleRepository(supabase), {
      tipprundeId,
      spielId,
      callerNutzerId: user.id,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
