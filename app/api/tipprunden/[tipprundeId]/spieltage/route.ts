import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSpieltag,
  createSupabaseSpieltageRepository,
} from "@/lib/domain/spieltage-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    const spieltage = await createSupabaseSpieltageRepository(supabase).listSpieltage(tipprundeId);

    return NextResponse.json({ spieltage });
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
    const body = (await request.json()) as {
      name?: string;
      abschnitt?: unknown;
      sortOrder?: unknown;
    };
    const supabase = await createSupabaseServerClient();
    const spieltag = await createSpieltag(createSupabaseSpieltageRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      name: body.name,
      abschnitt: body.abschnitt ?? "frei",
      sortOrder: body.sortOrder,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ spieltag }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
