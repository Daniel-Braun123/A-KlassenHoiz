-- Allow the creator/owner to read a Tipprunde immediately after insert.
-- This keeps the existing business rule intact and fixes insert(...).select()
-- before the Admin membership row is created.

alter policy "tipprunden_select_member"
  on public.tipprunden
  using (
    besitzer_nutzer_id = (select auth.uid())
    or private.is_tipprunde_member(id)
    or private.is_global_admin()
  );
