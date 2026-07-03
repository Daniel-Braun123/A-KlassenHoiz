import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseTipprundenRepository,
  permanentlyDeleteTipprunde,
} from "@/lib/domain/tipprunden-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as { confirmation?: string };
    const supabase = await createSupabaseServerClient();
    const tipprunde = await permanentlyDeleteTipprunde(
      createSupabaseTipprundenRepository(supabase),
      {
        tipprundeId,
        callerNutzerId: user.id,
        isGlobalAdmin: profile.isGlobalAdmin,
        confirmation: body.confirmation ?? "",
      },
    );

    return NextResponse.json({ tipprunde });
  } catch (error) {
    return jsonError(error);
  }
}
