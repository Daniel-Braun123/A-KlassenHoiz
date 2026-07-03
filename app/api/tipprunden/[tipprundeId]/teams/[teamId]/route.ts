import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseTeamsRepository,
  deleteTeam,
  updateTeam,
} from "@/lib/domain/teams-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tipprundeId: string; teamId: string }> },
) {
  try {
    const { tipprundeId, teamId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as { name?: string; logoUrl?: string | null };
    const supabase = await createSupabaseServerClient();
    const team = await updateTeam(createSupabaseTeamsRepository(supabase), {
      tipprundeId,
      teamId,
      callerNutzerId: user.id,
      name: body.name,
      logoUrl: body.logoUrl,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ team });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string; teamId: string }> },
) {
  try {
    const { tipprundeId, teamId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    await deleteTeam(createSupabaseTeamsRepository(supabase), {
      tipprundeId,
      teamId,
      callerNutzerId: user.id,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
