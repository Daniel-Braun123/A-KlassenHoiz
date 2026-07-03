import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  archiveTipprunde,
  createSupabaseTipprundenRepository,
} from "@/lib/domain/tipprunden-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    const tipprunde = await archiveTipprunde(createSupabaseTipprundenRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ tipprunde });
  } catch (error) {
    return jsonError(error);
  }
}
