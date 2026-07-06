import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import { createSpiel, createSupabaseSpieleRepository } from "@/lib/domain/spiele-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, context: { params: Promise<{ tipprundeId: string }> }) {
  try {
    const { tipprundeId } = await context.params;
    await requireAuthenticatedProfile();
    const { searchParams } = new URL(request.url);
    const spieltagId = searchParams.get("spieltagId") ?? undefined;
    const supabase = await createSupabaseServerClient();
    const spiele = await createSupabaseSpieleRepository(supabase).listSpiele(
      tipprundeId,
      spieltagId,
    );

    return NextResponse.json({ spiele });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
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
    const spiel = await createSpiel(createSupabaseSpieleRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      spieltagId: body.spieltagId ?? "",
      heimteamId: body.heimteamId ?? "",
      auswaertsteamId: body.auswaertsteamId ?? "",
      anstossDatum: body.anstossDatum ?? "",
      anstossUhrzeit: body.anstossUhrzeit ?? "",
      status: body.status ?? "geplant",
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ spiel }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
