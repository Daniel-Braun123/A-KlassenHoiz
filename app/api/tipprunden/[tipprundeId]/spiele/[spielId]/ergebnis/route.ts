import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseErgebnisseRepository,
  enterErgebnis,
} from "@/lib/domain/ergebnisse-repository";
import {
  createSupabasePunktewertungRepository,
  recalculatePunktewertungen,
} from "@/lib/domain/punktewertung-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ tipprundeId: string; spielId: string }> },
) {
  try {
    const { tipprundeId, spielId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as {
      heimtore?: number;
      auswaertstore?: number;
      reason?: string | null;
    };
    const supabase = await createSupabaseServerClient();
    const ergebnis = await enterErgebnis(createSupabaseErgebnisseRepository(supabase), {
      tipprundeId,
      spielId,
      callerNutzerId: user.id,
      heimtore: Number(body.heimtore),
      auswaertstore: Number(body.auswaertstore),
      reason: body.reason,
      isGlobalAdmin: profile.isGlobalAdmin,
    });
    const punktewertungen = await recalculatePunktewertungen(
      createSupabasePunktewertungRepository(supabase),
      {
        tipprundeId,
        spielId,
        ergebnis: { heimtore: ergebnis.heimtore, auswaertstore: ergebnis.auswaertstore },
      },
    );

    return NextResponse.json({ ergebnis, punktewertungen });
  } catch (error) {
    return jsonError(error);
  }
}
