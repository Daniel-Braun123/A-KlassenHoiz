-- Policy smoke tests for A-KlassenHoiz.
-- Intended for Supabase local test execution after the initial migration.

begin;

create extension if not exists pgtap;
select plan(6);

select has_table('public', 'tipprunden', 'tipprunden table exists');
select has_table('public', 'mitgliedschaften', 'mitgliedschaften table exists');
select has_table('public', 'tipps', 'tipps table exists');
select policies_are('public', 'tipprunden', array[
  'tipprunden_select_member',
  'tipprunden_insert_owner',
  'tipprunden_update_owner',
  'tipprunden_delete_owner'
]);
select policies_are('public', 'tipps', array[
  'tipps_select_member',
  'tipps_insert_own_before_deadline',
  'tipps_update_own_before_deadline'
]);
select policies_are('public', 'spiele', array[
  'spiele_select_member',
  'spiele_write_admin_coadmin'
]);

select * from finish();

rollback;
