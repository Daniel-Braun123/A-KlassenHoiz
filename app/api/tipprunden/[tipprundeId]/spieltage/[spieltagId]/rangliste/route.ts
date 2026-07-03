import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseRanglistenRepository,
  getSpieltagRangliste,
} from "@/lib/domain/ranglisten-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string; spieltagId: string }> },
) {
  try {
    const { tipprundeId, spieltagId } = await context.params;
    const user = await requireAuthenticatedUser();
    const supabase = await createSupabaseServerClient();
    const rangliste = await getSpieltagRangliste(createSupabaseRanglistenRepository(supabase), {
      tipprundeId,
      spieltagId,
      nutzerId: user.id,
    });

    return NextResponse.json({ rangliste });
  } catch (error) {
    return jsonError(error);
  }
}
