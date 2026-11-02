-- ===== Enums =====
alter type public.org_role add value if not exists 'sales' before 'member';
alter type public.subscription_status add value if not exists 'suspended';

-- ===== Columns (additive) =====
alter table public.organizations add column if not exists status text not null default 'active',
  add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.organizations add constraint organizations_status_chk check (status in ('active','suspended','canceled'));
alter table public.organizations add constraint organizations_name_chk check (length(trim(name)) between 1 and 120);

alter table public.profiles add column if not exists phone text;

alter table public.organization_members add column if not exists status text generated always as (case when active then 'active' else 'inactive' end) stored;

alter table public.leads add column if not exists description text;
alter table public.leads add constraint leads_name_chk check (length(trim(name)) between 1 and 200);
alter table public.leads add constraint leads_value_chk check (estimated_value is null or estimated_value >= 0);

alter table public.pipeline_stages add column if not exists color text not null default '#64748B',
  add column if not exists is_won boolean not null default false,
  add column if not exists is_lost boolean not null default false;
update public.pipeline_stages set is_won = (key = 'venda_concluida'), is_lost = (key = 'venda_perdida'),
  color = case key when 'novo' then '#2563EB' when 'primeiro_contato' then '#0EA5E9' when 'negociacao' then '#F59E0B'
    when 'orcamento_enviado' then '#6366F1' when 'venda_concluida' then '#16A34A' else '#DC2626' end;

alter table public.budgets add column if not exists created_by uuid default auth.uid(),
  add column if not exists title text,
  add column if not exists valid_until date;
alter table public.budgets add constraint budgets_amount_chk check (amount >= 0);

alter table public.tasks add constraint tasks_title_chk check (length(trim(title)) between 1 and 200);

alter table public.subscriptions add column if not exists trial_start timestamptz,
  add column if not exists current_period_start timestamptz;

alter table public.subscription_events add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null,
  add column if not exists external_event_id text,
  add column if not exists processed_at timestamptz,
  add column if not exists created_at timestamptz not null default now();
create unique index if not exists subscription_events_external_uq on public.subscription_events(provider, external_event_id) where external_event_id is not null;

-- ===== Invites =====
create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.org_role not null default 'member',
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index organization_invites_pending_uq on public.organization_invites(organization_id, lower(email)) where status = 'pending';
grant select, insert, update on public.organization_invites to authenticated;
grant all on public.organization_invites to service_role;
alter table public.organization_invites enable row level security;

-- ===== Audit logs =====
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs(organization_id, created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

-- ===== Helper functions =====
create or replace function public.is_org_owner(_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where organization_id=_org and user_id=auth.uid() and active and role='owner')
$$;
create or replace function public.is_active_member(_org uuid, _user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where organization_id=_org and user_id=_user and active)
$$;
revoke all on function public.is_org_member(uuid), public.is_org_admin(uuid), public.is_org_owner(uuid), public.is_active_member(uuid, uuid) from public, anon;
grant execute on function public.is_org_member(uuid), public.is_org_admin(uuid), public.is_org_owner(uuid), public.is_active_member(uuid, uuid) to authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ===== Membership policies (no self-edit, no owner grants) =====
drop policy "admins insert members" on public.organization_members;
drop policy "admins update members" on public.organization_members;
drop policy "admins delete members" on public.organization_members;
create policy "admins update members" on public.organization_members for update to authenticated
  using (public.is_org_admin(organization_id) and role <> 'owner' and user_id <> auth.uid())
  with check (public.is_org_admin(organization_id) and role <> 'owner' and user_id <> auth.uid());
create policy "admins delete members" on public.organization_members for delete to authenticated
  using (public.is_org_admin(organization_id) and role <> 'owner' and user_id <> auth.uid());
-- inserts happen only via signup trigger or accept_invites() (security definer)
revoke insert on public.organization_members from authenticated;

create or replace function public.guard_member_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.organization_id <> old.organization_id or new.user_id <> old.user_id then
    raise exception 'Não é permitido mover membros entre empresas';
  end if;
  return new;
end $$;
create trigger guard_member_changes before update on public.organization_members for each row execute function public.guard_member_changes();

-- ===== Invite policies =====
create policy "admins read invites" on public.organization_invites for select to authenticated using (public.is_org_admin(organization_id));
create policy "admins create invites" on public.organization_invites for insert to authenticated
  with check (public.is_org_admin(organization_id) and role <> 'owner' and invited_by = auth.uid() and status = 'pending');
create policy "admins revoke invites" on public.organization_invites for update to authenticated
  using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id) and role <> 'owner');

create or replace function public.accept_pending_invites() returns integer
language plpgsql security definer set search_path = public as $$
declare uemail text; n int := 0; inv record;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into uemail from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if uemail is null then return 0; end if;
  for inv in select * from public.organization_invites where lower(email) = uemail and status = 'pending' for update loop
    insert into public.organization_members(organization_id, user_id, role)
    values (inv.organization_id, auth.uid(), inv.role)
    on conflict (organization_id, user_id) do nothing;
    update public.organization_invites set status='accepted', accepted_at=now() where id = inv.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.accept_pending_invites() from public, anon;
grant execute on function public.accept_pending_invites() to authenticated;

-- ===== Subscriptions: owner only =====
drop policy "admins read subscription" on public.subscriptions;
create policy "owner reads subscription" on public.subscriptions for select to authenticated using (public.is_org_owner(organization_id));

-- ===== Audit read: admins =====
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.is_org_admin(organization_id));

-- ===== Cross-organization integrity =====
create or replace function public.enforce_same_org() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new);
begin
  if tg_op = 'UPDATE' and new.organization_id <> old.organization_id then
    raise exception 'organization_id não pode ser alterado';
  end if;
  if j ? 'lead_id' and (j->>'lead_id') is not null and not exists (select 1 from public.leads where id=(j->>'lead_id')::uuid and organization_id=new.organization_id) then
    raise exception 'Lead pertence a outra empresa';
  end if;
  if j ? 'client_id' and (j->>'client_id') is not null and not exists (select 1 from public.clients where id=(j->>'client_id')::uuid and organization_id=new.organization_id) then
    raise exception 'Cliente pertence a outra empresa';
  end if;
  if j ? 'assigned_to' and (j->>'assigned_to') is not null and not public.is_active_member(new.organization_id, (j->>'assigned_to')::uuid) then
    raise exception 'Responsável não é membro ativo da empresa';
  end if;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['leads','clients','budgets','tasks','interactions','pipeline_stages'] loop
    execute format('create trigger enforce_same_org before insert or update on public.%I for each row execute function public.enforce_same_org()', t);
  end loop;
end $$;

-- ===== updated_at =====
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['organizations','profiles','leads','clients','budgets','tasks','subscriptions'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ===== Audit triggers =====
create or replace function public.write_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_logs(organization_id, user_id, action, entity_type, entity_id, metadata)
  values ((r->>'organization_id')::uuid, auth.uid(), lower(tg_op), tg_table_name, (r->>'id')::uuid,
    case when tg_table_name = 'organization_members' then jsonb_build_object('role', r->>'role', 'active', r->>'active') else '{}'::jsonb end);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['leads','clients','budgets','tasks','organization_members','organization_invites'] loop
    execute format('create trigger write_audit after insert or update or delete on public.%I for each row execute function public.write_audit()', t);
  end loop;
end $$;
revoke all on function public.write_audit(), public.enforce_same_org(), public.guard_member_changes(), public.touch_updated_at() from public, anon, authenticated;

-- ===== Indexes =====
create index if not exists org_members_user_idx on public.organization_members(user_id);
create index if not exists leads_org_stage_idx on public.leads(organization_id, stage);
create index if not exists leads_org_assigned_idx on public.leads(organization_id, assigned_to);
create index if not exists leads_org_created_idx on public.leads(organization_id, created_at desc);
create index if not exists clients_org_idx on public.clients(organization_id, created_at desc);
create index if not exists budgets_org_idx on public.budgets(organization_id, budget_date desc);
create index if not exists tasks_org_due_idx on public.tasks(organization_id, status, due_at);
create index if not exists interactions_lead_idx on public.interactions(lead_id, created_at desc);
create index if not exists pipeline_org_idx on public.pipeline_stages(organization_id, position);
create unique index if not exists clients_lead_uq on public.clients(lead_id) where lead_id is not null;

-- ===== Signup: profile + org + owner + stages + trial (single transaction, idempotent) =====
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare org_id uuid; company text;
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120), new.email)
  on conflict (id) do nothing;
  if exists (select 1 from public.organization_members where user_id = new.id) then return new; end if;
  -- invited users join the inviting company instead of creating a new one
  if exists (select 1 from public.organization_invites where lower(email)=lower(new.email) and status='pending') then return new; end if;
  company := left(nullif(trim(coalesce(new.raw_user_meta_data->>'company_name','')), ''), 120);
  if company is null then company := 'Minha empresa'; end if;
  insert into public.organizations(name, owner_id) values (company, new.id) returning id into org_id;
  insert into public.organization_members(organization_id, user_id, role) values (org_id, new.id, 'owner');
  insert into public.pipeline_stages(organization_id, key, name, position, color, is_won, is_lost) values
    (org_id,'novo','Novo lead',1,'#2563EB',false,false),(org_id,'primeiro_contato','Primeiro contato',2,'#0EA5E9',false,false),
    (org_id,'negociacao','Em negociação',3,'#F59E0B',false,false),(org_id,'orcamento_enviado','Orçamento enviado',4,'#6366F1',false,false),
    (org_id,'venda_concluida','Venda concluída',5,'#16A34A',true,false),(org_id,'venda_perdida','Venda perdida',6,'#DC2626',false,true);
  insert into public.subscriptions(organization_id, plan, status, trial_start, trial_ends_at)
  values (org_id, 'start', 'trialing', now(), now() + interval '7 days');
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Backfill trial rows for existing companies without a subscription record
insert into public.subscriptions(organization_id, plan, status, trial_start, trial_ends_at)
select o.id, 'start', 'trialing', o.created_at, o.created_at + interval '7 days'
from public.organizations o where not exists (select 1 from public.subscriptions s where s.organization_id = o.id);