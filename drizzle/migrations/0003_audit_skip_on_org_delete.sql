create or replace function public.write_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb := to_jsonb(coalesce(new, old)); org uuid := (to_jsonb(coalesce(new, old))->>'organization_id')::uuid;
begin
  if not exists (select 1 from public.organizations where id = org) then return coalesce(new, old); end if;
  insert into public.audit_logs(organization_id, user_id, action, entity_type, entity_id, metadata)
  values (org, auth.uid(), lower(tg_op), tg_table_name, (r->>'id')::uuid,
    case when tg_table_name = 'organization_members' then jsonb_build_object('role', r->>'role', 'active', r->>'active') else '{}'::jsonb end);
  return coalesce(new, old);
end $$;
revoke all on function public.write_audit() from public, anon, authenticated;