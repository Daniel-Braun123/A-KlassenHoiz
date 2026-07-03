-- Local validation seed for A-KlassenHoiz.
-- Auth users are managed by Supabase Auth; insert matching auth.users rows in
-- local validation before loading these profile rows.

insert into public.profiles (id, email, anzeigename, is_global_admin)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@example.test', 'Admin', false),
  ('00000000-0000-0000-0000-000000000002', 'nutzer@example.test', 'Nutzer', false)
on conflict (id) do nothing;

insert into public.tipprunden (id, name, besitzer_nutzer_id)
values (
  '10000000-0000-0000-0000-000000000001',
  'A-Klasse Test Tipprunde',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

insert into public.mitgliedschaften (tipprunde_id, nutzer_id, rolle, tipprunden_nickname)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Admin'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'nutzer',
    'Nutzer'
  )
on conflict do nothing;
