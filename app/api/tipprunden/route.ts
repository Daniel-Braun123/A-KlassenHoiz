import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createSupabaseTipprundenRepository,
  createTipprunde,
} from "@/lib/domain/tipprunden-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthenticatedProfile();
    const body = (await request.json()) as {
      name?: string;
      tipprundenNickname?: string;
    };
    const supabase = await createSupabaseServerClient();
    const tipprunde = await createTipprunde(createSupabaseTipprundenRepository(supabase), {
      name: body.name ?? "",
      besitzerNutzerId: user.id,
      tipprundenNickname: body.tipprundenNickname ?? body.name ?? "",
    });

    return NextResponse.json({ tipprunde }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
