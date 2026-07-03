-- A-KlassenHoiz initial schema

-- ============================================================================
-- Extensions/Types
-- ============================================================================

create extension if not exists "pgcrypto";

create type public.tipprunde_status as enum ('active', 'archived', 'deleted');
create type public.mitgliedschaft_status as enum ('active', 'removed');
create type public.tipprunde_rolle as enum ('nutzer', 'admin', 'co_admin');
create type public.einladung_status as enum ('active', 'revoked', 'expired');
create type public.spieltag_abschnitt as enum ('hinrunde', 'rueckrunde', 'nachholspiele', 'frei');
create type public.spiel_status as enum ('geplant', 'beendet', 'verschoben', 'abgesagt', 'abgebrochen');
create type public.wertungstyp as enum ('exakt', 'tordifferenz', 'tendenz', 'keine');

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  anzeigename text not null,
  echter_name text,
  is_global_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tipprunden (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  besitzer_nutzer_id uuid not null references public.profiles (id) on delete restrict,
  status public.tipprunde_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table public.mitgliedschaften (
  id uuid primary key default gen_random_uuid(),
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  nutzer_id uuid not null references public.profiles (id) on delete cascade,
  rolle public.tipprunde_rolle not null default 'nutzer',
  tipprunden_nickname text not null,
  status public.mitgliedschaft_status not null default 'active',
  joined_at timestamptz not null default now(),
  removed_at timestamptz
);

create table public.einladungen (
  id uuid primary key default gen_random_uuid(),
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  status public.einladung_status not null default 'active',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  name text not null,
  logo_url text,
  external_source text,
  external_team_id text,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spieltage (
  id uuid primary key default gen_random_uuid(),
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  name text not null,
  abschnitt public.spieltag_abschnitt not null default 'frei',
  sort_order integer not null default 0,
  external_source text,
  external_league_id text,
  external_matchday_id text,
  external_url text,
  last_synced_at timestamptz,
  import_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spiele (
  id uuid primary key default gen_random_uuid(),
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  spieltag_id uuid not null references public.spieltage (id) on delete cascade,
  heimteam_id uuid not null references public.teams (id) on delete restrict,
  auswaertsteam_id uuid not null references public.teams (id) on delete restrict,
  anstosszeit timestamptz not null,
  timezone text not null default 'Europe/Berlin',
  status public.spiel_status not null default 'geplant',
  external_source text,
  external_match_id text,
  external_url text,
  last_synced_at timestamptz,
  import_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tipps (
  id uuid primary key default gen_random_uuid(),
  spiel_id uuid not null references public.spiele (id) on delete cascade,
  nutzer_id uuid not null references public.profiles (id) on delete cascade,
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  heimtore_tipp integer not null,
  auswaertstore_tipp integer not null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ergebnisse (
  id uuid primary key default gen_random_uuid(),
  spiel_id uuid not null unique references public.spiele (id) on delete cascade,
  heimtore integer not null,
  auswaertstore integer not null,
  entered_by uuid not null references public.profiles (id) on delete restrict,
  entered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_changed_after_scoring boolean not null default false
);

create table public.ergebnis_aenderungen (
  id uuid primary key default gen_random_uuid(),
  spiel_id uuid not null references public.spiele (id) on delete cascade,
  old_heimtore integer,
  old_auswaertstore integer,
  new_heimtore integer not null,
  new_auswaertstore integer not null,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  changed_at timestamptz not null default now(),
  reason text
);

create table public.punktewertungen (
  id uuid primary key default gen_random_uuid(),
  spiel_id uuid not null references public.spiele (id) on delete cascade,
  nutzer_id uuid not null references public.profiles (id) on delete cascade,
  tipprunde_id uuid not null references public.tipprunden (id) on delete cascade,
  punkte integer not null,
  wertungstyp public.wertungstyp not null,
  calculated_at timestamptz not null default now()
);

-- ============================================================================
-- Constraints/Indexes
-- ============================================================================

alter table public.profiles
  add constraint profiles_anzeigename_not_blank check (length(trim(anzeigename)) > 0);

alter table public.tipprunden
  add constraint tipprunden_name_not_blank check (length(trim(name)) > 0);

alter table public.mitgliedschaften
  add constraint mitgliedschaften_nickname_not_blank check (length(trim(tipprunden_nickname)) > 0);

alter table public.teams
  add constraint teams_name_not_blank check (length(trim(name)) > 0);

alter table public.spiele
  add constraint spiele_different_teams check (heimteam_id <> auswaertsteam_id),
  add constraint spiele_timezone_berlin check (timezone = 'Europe/Berlin');

alter table public.tipps
  add constraint tipps_scores_non_negative check (heimtore_tipp >= 0 and auswaertstore_tipp >= 0);

alter table public.ergebnisse
  add constraint ergebnisse_scores_non_negative check (heimtore >= 0 and auswaertstore >= 0);

alter table public.ergebnis_aenderungen
  add constraint ergebnis_aenderungen_scores_non_negative check (
    new_heimtore >= 0 and new_auswaertstore >= 0
  );

alter table public.punktewertungen
  add constraint punktewertungen_punkte_valid check (punkte in (0, 2, 3, 4));

create unique index mitgliedschaften_one_active_per_user_tipprunde
  on public.mitgliedschaften (tipprunde_id, nutzer_id)
  where status = 'active';

create unique index einladungen_one_active_per_tipprunde
  on public.einladungen (tipprunde_id)
  where status = 'active';

create unique index tipps_one_per_user_spiel
  on public.tipps (spiel_id, nutzer_id);

create unique index punktewertungen_one_per_user_spiel
  on public.punktewertungen (spiel_id, nutzer_id);

create index mitgliedschaften_nutzer_idx on public.mitgliedschaften (nutzer_id);
create index spiele_spieltag_idx on public.spiele (spieltag_id);
create index tipps_tipprunde_nutzer_idx on public.tipps (tipprunde_id, nutzer_id);
create index punktewertungen_tipprunde_idx on public.punktewertungen (tipprunde_id);

-- ============================================================================
-- Functions
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_tipprunden_updated_at
  before update on public.tipprunden
  for each row execute function public.set_updated_at();

create trigger set_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create trigger set_spieltage_updated_at
  before update on public.spieltage
  for each row execute function public.set_updated_at();

create trigger set_spiele_updated_at
  before update on public.spiele
  for each row execute function public.set_updated_at();

create trigger set_tipps_updated_at
  before update on public.tipps
  for each row execute function public.set_updated_at();

create trigger set_ergebnisse_updated_at
  before update on public.ergebnisse
  for each row execute function public.set_updated_at();

create or replace function public.is_global_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_global_admin = true
  );
$$;

create or replace function public.is_tipprunde_member(target_tipprunde_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mitgliedschaften
    where tipprunde_id = target_tipprunde_id
      and nutzer_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function public.has_tipprunde_role(
  target_tipprunde_id uuid,
  allowed_roles public.tipprunde_rolle[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_global_admin() or exists (
    select 1
    from public.mitgliedschaften
    where tipprunde_id = target_tipprunde_id
      and nutzer_id = (select auth.uid())
      and status = 'active'
      and rolle = any(allowed_roles)
  );
$$;

create or replace function public.is_tipprunde_owner(target_tipprunde_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_global_admin() or exists (
    select 1
    from public.tipprunden
    where id = target_tipprunde_id
      and besitzer_nutzer_id = (select auth.uid())
  );
$$;

-- ============================================================================
-- Grants
-- ============================================================================

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.tipprunden to authenticated;
grant select, insert, update, delete on table public.mitgliedschaften to authenticated;
grant select, insert, update, delete on table public.einladungen to authenticated;
grant select, insert, update, delete on table public.teams to authenticated;
grant select, insert, update, delete on table public.spieltage to authenticated;
grant select, insert, update, delete on table public.spiele to authenticated;
grant select, insert, update, delete on table public.tipps to authenticated;
grant select, insert, update, delete on table public.ergebnisse to authenticated;
grant select, insert on table public.ergebnis_aenderungen to authenticated;
grant select, insert, update, delete on table public.punktewertungen to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

grant execute on function public.is_global_admin() to authenticated, service_role;
grant execute on function public.is_tipprunde_member(uuid) to authenticated, service_role;
grant execute on function public.has_tipprunde_role(uuid, public.tipprunde_rolle[]) to authenticated, service_role;
grant execute on function public.is_tipprunde_owner(uuid) to authenticated, service_role;

-- ============================================================================
-- RLS Policies
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.tipprunden enable row level security;
alter table public.mitgliedschaften enable row level security;
alter table public.einladungen enable row level security;
alter table public.teams enable row level security;
alter table public.spieltage enable row level security;
alter table public.spiele enable row level security;
alter table public.tipps enable row level security;
alter table public.ergebnisse enable row level security;
alter table public.ergebnis_aenderungen enable row level security;
alter table public.punktewertungen enable row level security;

create policy "profiles_select_visible"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_global_admin()
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

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_global_admin())
  with check (id = (select auth.uid()) or public.is_global_admin());

create policy "tipprunden_select_member"
  on public.tipprunden for select
  to authenticated
  using (public.is_tipprunde_member(id) or public.is_global_admin());

create policy "tipprunden_insert_owner"
  on public.tipprunden for insert
  to authenticated
  with check (besitzer_nutzer_id = (select auth.uid()));

create policy "tipprunden_update_owner"
  on public.tipprunden for update
  to authenticated
  using (public.is_tipprunde_owner(id))
  with check (public.is_tipprunde_owner(id));

create policy "tipprunden_delete_owner"
  on public.tipprunden for delete
  to authenticated
  using (public.is_tipprunde_owner(id));

create policy "mitgliedschaften_select_member"
  on public.mitgliedschaften for select
  to authenticated
  using (public.is_tipprunde_member(tipprunde_id) or public.is_global_admin());

create policy "mitgliedschaften_insert_admin"
  on public.mitgliedschaften for insert
  to authenticated
  with check (
    nutzer_id = (select auth.uid())
    or public.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[])
  );

create policy "mitgliedschaften_update_admin_or_self"
  on public.mitgliedschaften for update
  to authenticated
  using (
    nutzer_id = (select auth.uid())
    or public.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[])
  )
  with check (
    nutzer_id = (select auth.uid())
    or public.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[])
  );

create policy "einladungen_select_admin"
  on public.einladungen for select
  to authenticated
  using (public.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[]));

create policy "einladungen_write_admin"
  on public.einladungen for all
  to authenticated
  using (public.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[]))
  with check (public.has_tipprunde_role(tipprunde_id, array['admin']::public.tipprunde_rolle[]));

create policy "teams_select_member"
  on public.teams for select
  to authenticated
  using (public.is_tipprunde_member(tipprunde_id) or public.is_global_admin());

create policy "teams_write_admin_coadmin"
  on public.teams for all
  to authenticated
  using (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));

create policy "spieltage_select_member"
  on public.spieltage for select
  to authenticated
  using (public.is_tipprunde_member(tipprunde_id) or public.is_global_admin());

create policy "spieltage_write_admin_coadmin"
  on public.spieltage for all
  to authenticated
  using (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));

create policy "spiele_select_member"
  on public.spiele for select
  to authenticated
  using (public.is_tipprunde_member(tipprunde_id) or public.is_global_admin());

create policy "spiele_write_admin_coadmin"
  on public.spiele for all
  to authenticated
  using (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));

create policy "tipps_select_member"
  on public.tipps for select
  to authenticated
  using (public.is_tipprunde_member(tipprunde_id) or public.is_global_admin());

create policy "tipps_insert_own_before_deadline"
  on public.tipps for insert
  to authenticated
  with check (
    nutzer_id = (select auth.uid())
    and public.is_tipprunde_member(tipprunde_id)
    and exists (
      select 1
      from public.spiele
      where spiele.id = tipps.spiel_id
        and spiele.tipprunde_id = tipps.tipprunde_id
        and spiele.status = 'geplant'
        and now() < spiele.anstosszeit
    )
  );

create policy "tipps_update_own_before_deadline"
  on public.tipps for update
  to authenticated
  using (nutzer_id = (select auth.uid()) and public.is_tipprunde_member(tipprunde_id))
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

create policy "ergebnisse_select_member"
  on public.ergebnisse for select
  to authenticated
  using (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnisse.spiel_id
        and (public.is_tipprunde_member(spiele.tipprunde_id) or public.is_global_admin())
    )
  );

create policy "ergebnisse_write_admin_coadmin"
  on public.ergebnisse for all
  to authenticated
  using (
    exists (
      select 1
      from public.spiele
      where Spiele.id = ergebnisse.spiel_id
        and public.has_tipprunde_role(spiele.tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    )
  )
  with check (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnisse.spiel_id
        and public.has_tipprunde_role(spiele.tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    )
  );

create policy "ergebnis_aenderungen_select_member"
  on public.ergebnis_aenderungen for select
  to authenticated
  using (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnis_aenderungen.spiel_id
        and (public.is_tipprunde_member(spiele.tipprunde_id) or public.is_global_admin())
    )
  );

create policy "ergebnis_aenderungen_insert_admin_coadmin"
  on public.ergebnis_aenderungen for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.spiele
      where spiele.id = ergebnis_aenderungen.spiel_id
        and public.has_tipprunde_role(spiele.tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    )
  );

create policy "punktewertungen_select_member"
  on public.punktewertungen for select
  to authenticated
  using (public.is_tipprunde_member(tipprunde_id) or public.is_global_admin());

create policy "punktewertungen_write_admin_coadmin"
  on public.punktewertungen for all
  to authenticated
  using (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]))
  with check (public.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[]));
