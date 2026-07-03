import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  buildEinladungslink,
  createEinladung,
  createSupabaseEinladungenRepository,
} from "@/lib/domain/einladungen-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getOrigin(request: Request): string {
  return process.env.APP_URL || new URL(request.url).origin;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    const { user } = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    const einladung = await createEinladung(createSupabaseEinladungenRepository(supabase), {
      tipprundeId,
      createdBy: user.id,
    });

    return NextResponse.json(
      {
        einladung,
        einladungslink: buildEinladungslink(getOrigin(request), einladung.token),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
