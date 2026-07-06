import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import { createSupabaseTeamsRepository, createTeam } from "@/lib/domain/teams-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    const vereine = await createSupabaseTeamsRepository(supabase).listTeams(tipprundeId);

    return NextResponse.json({ vereine, teams: vereine });
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
    const body = (await request.json()) as { name?: string; logoUrl?: string | null };
    const supabase = await createSupabaseServerClient();
    const team = await createTeam(createSupabaseTeamsRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      name: body.name ?? "",
      logoUrl: body.logoUrl ?? null,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ team, verein: team }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
