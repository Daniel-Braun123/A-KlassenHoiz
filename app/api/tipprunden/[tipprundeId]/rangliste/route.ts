import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseRanglistenRepository,
  getGesamtRangliste,
} from "@/lib/domain/ranglisten-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    const user = await requireAuthenticatedUser();
    const supabase = await createSupabaseServerClient();
    const rangliste = await getGesamtRangliste(createSupabaseRanglistenRepository(supabase), {
      tipprundeId,
      nutzerId: user.id,
    });

    return NextResponse.json({ rangliste });
  } catch (error) {
    return jsonError(error);
  }
}
