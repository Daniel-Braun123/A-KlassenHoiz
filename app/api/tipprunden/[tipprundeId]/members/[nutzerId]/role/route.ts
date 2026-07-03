import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  changeMitgliedschaftRolle,
  createSupabaseMitgliedschaftenRepository,
} from "@/lib/domain/mitgliedschaften-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ tipprundeId: string; nutzerId: string }> },
) {
  try {
    const { tipprundeId, nutzerId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as { rolle?: "nutzer" | "co_admin" };

    if (body.rolle !== "nutzer" && body.rolle !== "co_admin") {
      return NextResponse.json(
        { error: { code: "role_invalid", message: "Ungueltige Rolle." } },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const membership = await changeMitgliedschaftRolle(
      createSupabaseMitgliedschaftenRepository(supabase),
      {
        tipprundeId,
        targetNutzerId: nutzerId,
        callerNutzerId: user.id,
        rolle: body.rolle,
        isGlobalAdmin: profile.isGlobalAdmin,
      },
    );

    return NextResponse.json({ membership });
  } catch (error) {
    return jsonError(error);
  }
}
