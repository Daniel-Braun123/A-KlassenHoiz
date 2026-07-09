import { AppError } from "@/lib/domain/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("Bitte melde dich an.", "auth_required", 401);
  }

  return user;
}

export async function requireAuthenticatedProfile() {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, anzeigename, is_global_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new AppError("Profil konnte nicht geladen werden.", "profile_load_failed", 500);
  }

  if (!data) {
    const anzeigename =
      typeof user.user_metadata?.anzeigename === "string" && user.user_metadata.anzeigename.trim()
        ? user.user_metadata.anzeigename.trim()
        : "Nutzer";
    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? `${user.id}@local.invalid`,
        anzeigename,
      })
      .select("id, email, anzeigename, is_global_admin")
      .single();

    if (createError || !createdProfile) {
      throw new AppError("Profil konnte nicht erstellt werden.", "profile_create_failed", 500);
    }

    return {
      user,
      profile: {
        id: createdProfile.id as string,
        email: String(createdProfile.email),
        anzeigename: String(createdProfile.anzeigename),
        isGlobalAdmin: Boolean(createdProfile.is_global_admin),
      },
    };
  }

  return {
    user,
    profile: {
      id: data.id as string,
      email: String(data.email),
      anzeigename: String(data.anzeigename),
      isGlobalAdmin: Boolean(data.is_global_admin),
    },
  };
}

export async function requireTipprundeMembership(tipprundeId: string) {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mitgliedschaften")
    .select("id, rolle, status, tipprunden:tipprunde_id(status)")
    .eq("tipprunde_id", tipprundeId)
    .eq("nutzer_id", user.id)
    .eq("status", "active")
    .single();

  const relation = Array.isArray(data?.tipprunden) ? data.tipprunden[0] : data?.tipprunden;
  const isActiveTipprunde =
    relation &&
    typeof relation === "object" &&
    "status" in relation &&
    relation.status === "active";

  if (error || !data || !isActiveTipprunde) {
    throw new AppError("Du bist kein Mitglied dieser Tipprunde.", "membership_required", 403);
  }

  return { user, membership: data };
}
