-- Harden RLS helper functions for Supabase Security Advisor warnings.
-- No business rules are changed: policies keep the same predicates and move
-- SECURITY DEFINER helpers out of the exposed public schema.

-- ============================================================================
-- Schemas/Search Path
-- ============================================================================

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.set_updated_at()
  set search_path = pg_catalog;

-- ============================================================================
-- Private RLS Helper Functions
-- ============================================================================

create or replace function private.is_global_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_global_admin = true
  );
$$;

create or replace function private.is_tipprunde_member(target_tipprunde_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.mitgliedschaften
    where tipprunde_id = target_tipprunde_id
      and nutzer_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function private.has_tipprunde_role(
  target_tipprunde_id uuid,
  allowed_roles public.tipprunde_rolle[]
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select private.is_global_admin() or exists (
    select 1
    from public.mitgliedschaften
    where tipprunde_id = target_tipprunde_id
      and nutzer_id = (select auth.uid())
      and status = 'active'
      and rolle = any(allowed_roles)
  );
$$;

create or replace function private.is_tipprunde_owner(target_tipprunde_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select private.is_global_admin() or exists (
    select 1
    from public.tipprunden
    where id = target_tipprunde_id
      and besitzer_nutzer_id = (select auth.uid())
  );
$$;

revoke all on function private.is_global_admin() from public, anon, authenticated, service_role;
revoke all on function private.is_tipprunde_member(uuid) from public, anon, authenticated, service_role;
revoke all on function private.has_tipprunde_role(uuid, public.tipprunde_rolle[]) from public, anon, authenticated, service_role;
revoke all on function private.is_tipprunde_owner(uuid) from public, anon, authenticated, service_role;

grant execute on function private.is_global_admin() to authenticated, service_role;
grant execute on function private.is_tipprunde_member(uuid) to authenticated, service_role;
grant execute on function private.has_tipprunde_role(uuid, public.tipprunde_rolle[]) to authenticated, service_role;
grant execute on function private.is_tipprunde_owner(uuid) to authenticated, service_role;

-- Public copies are no longer used by RLS policies and should not be callable
-- through the exposed public schema by client roles.
revoke all on function public.is_global_admin() from public, anon, authenticated, service_role;
revoke all on function public.is_tipprunde_member(uuid) from public, anon, authenticated, service_role;
revoke all on function public.has_tipprunde_role(uuid, public.tipprunde_rolle[]) from public, anon, authenticated, service_role;
revoke all on function public.is_tipprunde_owner(uuid) from public, anon, authenticated, service_role;

-- ============================================================================
-- RLS Policies
-- ============================================================================

alter policy "profiles_select_visible"
  on public.profiles
  using (
    id = (select auth.uid())
    or private.is_global_admin()
    or exists (
      select 1
      from public.mitgliedschaften viewer
      join public.mitgliedschaften target
        on target.tipprunde_id = viewer.tipprunde_id
      where viewer.nutzer_id = (select auth.uid())
        and viewer.status = 'active'
        and target.nutzer_id = profiles.id
        and target.status = 'active'
    )
  );

alter policy "profiles_update_own"
  on public.profiles
  using (id = (select auth.uid()) or private.is_global_admin())
  with check (id = (select auth.uid()) or private.is_global_admin());

alter policy "tipprunden_select_member"
  on public.tipprunden
  using (private.is_tipprunde_member(id) or private.is_global_admin());

alter policy "tipprunden_update_owner"
  on public.tipprunden
  using (private.is_tipprunde_owner(id))
  with check (private.is_tipprunde_owner(id));

alter policy "tipprunden_delete_owner"
  on public.tipprunden
  using (private.is_tipprunde_owner(id));

alter policy "mitgliedschaften_select_member"
  on public.mitgliedschaften
  using (private.is_tipprunde_member(tipprunde_id) or private.is_global_admin());

alter policy "mitgliedschaften_insert_admin"
  on public.mitgliedschaften
  with check (
    nutzer_id = (select auth.uid())
    or private.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[])
  );

alter policy "mitgliedschaften_update_admin_or_self"
  on public.mitgliedschaften
  using (
    nutzer_id = (select auth.uid())
    or private.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[])
  )
  with check (
    nutzer_id = (select auth.uid())
    or private.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[])
  );

alter policy "einladungen_select_admin"
  on public.einladungen
  using (private.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[]));

alter policy "einladungen_write_admin"
  on public.einladungen
  using (private.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[]))
  with check (private.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[]));

alter policy "teams_select_member"
  on public.teams
  using (private.is_tipprunde_member(tipprunde_id) or private.is_global_admin());

alter policy "teams_write_admin_coadmin"
  on public.teams
  using (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));

alter policy "spieltage_select_member"
  on public.spieltage
  using (private.is_tipprunde_member(tipprunde_id) or private.is_global_admin());

alter policy "spieltage_write_admin_coadmin"
  on public.spieltage
  using (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));

alter policy "spiele_select_member"
  on public.spiele
  using (private.is_tipprunde_member(tipprunde_id) or private.is_global_admin());

alter policy "spiele_write_admin_coadmin"
  on public.spiele
  using (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));

alter policy "tipps_select_member"
  on public.tipps
  using (
    private.is_global_admin()
    or (
      private.is_tipprunde_member(tipprunde_id)
      and (
        nutzer_id = (select auth.uid())
        or exists (
          select 1
          from public.spiele
          where spiele.id = tipps.spiel_id
            and spiele.tipprunde_id = tipps.tipprunde_id
            and now() >= spiele.anstosszeit
        )
      )
    )
  );

alter policy "tipps_insert_own_before_deadline"
  on public.tipps
  with check (
    nutzer_id = (select auth.uid())
    and private.is_tipprunde_member(tipprunde_id)
    and exists (
      select 1
      from public.spiele
      where spiele.id = tipps.spiel_id
        and spiele.tipprunde_id = tipps.tipprunde_id
        and spiele.status = 'geplant'
        and now() < spiele.anstosszeit
    )
  );

alter policy "tipps_update_own_before_deadline"
  on public.tipps
  using (nutzer_id = (select auth.uid()) and private.is_tipprunde_member(tipprunde_id))
  with check (
    nutzer_id = (select auth.uid())
    and exists (
      select 1
      from public.spiele
      where spiele.id = tipps.spiel_id
        and spiele.tipprunde_id = tipps.tipprunde_id
        and spiele.status = 'geplant'
        and now() < spiele.anstosszeit
    )
  );

alter policy "ergebnisse_select_member"
  on public.ergebnisse
  using (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnisse.spiel_id
        and (private.is_tipprunde_member(spiele.tipprunde_id) or private.is_global_admin())
    )
  );

alter policy "ergebnisse_write_admin_coadmin"
  on public.ergebnisse
  using (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnisse.spiel_id
        and private.has_tipprunde_role(spiele.tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    )
  )
  with check (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnisse.spiel_id
        and private.has_tipprunde_role(spiele.tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    )
  );

alter policy "ergebnis_aenderungen_select_member"
  on public.ergebnis_aenderungen
  using (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnis_aenderungen.spiel_id
        and (private.is_tipprunde_member(spiele.tipprunde_id) or private.is_global_admin())
    )
  );

alter policy "ergebnis_aenderungen_insert_admin_coadmin"
  on public.ergebnis_aenderungen
  with check (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnis_aenderungen.spiel_id
        and private.has_tipprunde_role(spiele.tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    )
  );

alter policy "punktewertungen_select_member"
  on public.punktewertungen
  using (private.is_tipprunde_member(tipprunde_id) or private.is_global_admin());

alter policy "punktewertungen_write_admin_coadmin"
  on public.punktewertungen
  using (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));
