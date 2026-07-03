import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import { createSupabaseTippsRepository, submitTipp } from "@/lib/domain/tipps-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ tipprundeId: string; spielId: string }> },
) {
  try {
    const { tipprundeId, spielId } = await context.params;
    const { user } = await requireAuthenticatedProfile();
    const body = (await request.json()) as {
      heimtoreTipp?: number;
      auswaertstoreTipp?: number;
    };
    const supabase = await createSupabaseServerClient();
    const tipp = await submitTipp(createSupabaseTippsRepository(supabase), {
      tipprundeId,
      spielId,
      nutzerId: user.id,
      heimtoreTipp: Number(body.heimtoreTipp),
      auswaertstoreTipp: Number(body.auswaertstoreTipp),
    });

    return NextResponse.json({ tipp });
  } catch (error) {
    return jsonError(error);
  }
}
