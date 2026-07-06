-- Extensions/Types

-- Tables
create table if not exists public.ligen (
  id uuid primary key default gen_random_uuid(),
  tipprunde_id uuid not null references public.tipprunden(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spieltage
  add column if not exists nummer integer;

with numbered_spieltage as (
  select
    id,
    row_number() over (
      partition by tipprunde_id, abschnitt
      order by sort_order asc, created_at asc, id asc
    )::integer as generated_nummer
  from public.spieltage
)
update public.spieltage
set nummer = numbered_spieltage.generated_nummer
from numbered_spieltage
where public.spieltage.id = numbered_spieltage.id
  and public.spieltage.nummer is null;

alter table public.spieltage
  alter column nummer set default 1;

alter table public.spieltage
  alter column nummer set not null;

-- Constraints/Indexes
alter table public.ligen
  drop constraint if exists ligen_name_not_blank;

alter table public.ligen
  add constraint ligen_name_not_blank check (length(trim(name)) > 0);

alter table public.ligen
  drop constraint if exists ligen_tipprunde_unique;

alter table public.ligen
  add constraint ligen_tipprunde_unique unique (tipprunde_id);

alter table public.spieltage
  drop constraint if exists spieltage_nummer_positive;

alter table public.spieltage
  add constraint spieltage_nummer_positive check (nummer > 0);

create unique index if not exists spieltage_tipprunde_abschnitt_nummer_unique
  on public.spieltage (tipprunde_id, abschnitt, nummer);

create index if not exists ligen_tipprunde_idx
  on public.ligen (tipprunde_id);

-- Functions
drop trigger if exists set_ligen_updated_at on public.ligen;

create trigger set_ligen_updated_at
  before update on public.ligen
  for each row
  execute function public.set_updated_at();

create or replace function public.enforce_team_name_unique_on_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
    or new.name is distinct from old.name
    or new.tipprunde_id is distinct from old.tipprunde_id
  then
    if exists (
      select 1
      from public.teams existing_team
      where existing_team.tipprunde_id = new.tipprunde_id
        and lower(trim(existing_team.name)) = lower(trim(new.name))
        and existing_team.id <> new.id
    ) then
      raise exception 'duplicate team name in tipprunde'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_team_name_unique_on_change() from public, anon, authenticated;
grant execute on function public.enforce_team_name_unique_on_change() to service_role;

drop trigger if exists enforce_team_name_unique_on_change on public.teams;

create trigger enforce_team_name_unique_on_change
  before insert or update on public.teams
  for each row
  execute function public.enforce_team_name_unique_on_change();

-- Grants
grant select, insert, update on table public.ligen to authenticated;
grant select, insert, update, delete on table public.ligen to service_role;

-- RLS Policies
alter table public.ligen enable row level security;

drop policy if exists "ligen_select_member" on public.ligen;
create policy "ligen_select_member"
  on public.ligen
  for select
  to authenticated
  using (private.is_tipprunde_member(tipprunde_id) or private.is_global_admin());

drop policy if exists "ligen_insert_admin_coadmin" on public.ligen;
create policy "ligen_insert_admin_coadmin"
  on public.ligen
  for insert
  to authenticated
  with check (
    private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    or private.is_global_admin()
  );

drop policy if exists "ligen_update_admin_coadmin" on public.ligen;
create policy "ligen_update_admin_coadmin"
  on public.ligen
  for update
  to authenticated
  using (
    private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    or private.is_global_admin()
  )
  with check (
    private.has_tipprunde_role(tipprunde_id, array['admin','co_admin']::public.tipprunde_rolle[])
    or private.is_global_admin()
  );
