import { NextResponse } from "next/server";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { jsonError } from "@/lib/domain/api-response";
import {
  createLiga,
  createSupabaseLigenRepository,
  getLiga,
  updateLiga,
} from "@/lib/domain/ligen-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();
    const liga = await getLiga(createSupabaseLigenRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ liga });
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
    const body = (await request.json()) as { name?: string };
    const supabase = await createSupabaseServerClient();
    const liga = await createLiga(createSupabaseLigenRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      name: body.name ?? "",
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ liga }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tipprundeId: string }> },
) {
  try {
    const { tipprundeId } = await context.params;
    const { user, profile } = await requireAuthenticatedProfile();
    const body = (await request.json()) as { name?: string };
    const supabase = await createSupabaseServerClient();
    const liga = await updateLiga(createSupabaseLigenRepository(supabase), {
      tipprundeId,
      callerNutzerId: user.id,
      name: body.name ?? "",
      isGlobalAdmin: profile.isGlobalAdmin,
    });

    return NextResponse.json({ liga });
  } catch (error) {
    return jsonError(error);
  }
}
