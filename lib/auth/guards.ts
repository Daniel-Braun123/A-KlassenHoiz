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

export async function requireTipprundeMembership(tipprundeId: string) {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mitgliedschaften")
    .select("id, rolle, status")
    .eq("tipprunde_id", tipprundeId)
    .eq("nutzer_id", user.id)
    .eq("status", "active")
    .single();

  if (error || !data) {
    throw new AppError("Du bist kein Mitglied dieser Tipprunde.", "membership_required", 403);
  }

  return { user, membership: data };
}
