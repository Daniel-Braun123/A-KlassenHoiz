import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseEinladungenRepository,
  joinTipprundeByEinladung,
} from "@/lib/domain/einladungen-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const { user } = await requireAuthenticatedProfile();
    const body = (await request.json()) as { tipprundenNickname?: string };
    const membership = await joinTipprundeByEinladung(
      createSupabaseEinladungenRepository(createSupabaseServiceRoleClient()),
      {
        token,
        nutzerId: user.id,
        tipprundenNickname: body.tipprundenNickname ?? "",
      },
    );

    return NextResponse.json({ membership });
  } catch (error) {
    return jsonError(error);
  }
}
