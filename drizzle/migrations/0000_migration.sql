create type public.org_role as enum ('owner','admin','member');
create type public.lead_stage as enum ('novo','primeiro_contato','negociacao','orcamento_enviado','venda_concluida','venda_perdida');
create type public.task_status as enum ('pendente','em_andamento','concluida','cancelada');
create type public.budget_status as enum ('rascunho','enviado','aprovado','recusado');
create type public.subscription_plan as enum ('start','pro');
create type public.subscription_status as enum ('trialing','active','past_due','canceled','expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  phone text, document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'member',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;
alter table public.organization_members enable row level security;

create or replace function public.is_org_member(_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where organization_id=_org and user_id=auth.uid() and active)
$$;
create or replace function public.is_org_admin(_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where organization_id=_org and user_id=auth.uid() and active and role in ('owner','admin'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or exists(
  select 1 from public.organization_members a join public.organization_members b on a.organization_id=b.organization_id
  where a.user_id=auth.uid() and a.active and b.user_id=profiles.id));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create policy "members read org" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "admins update org" on public.organizations for update to authenticated using (public.is_org_admin(id));

create policy "members read members" on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy "admins insert members" on public.organization_members for insert to authenticated with check (public.is_org_admin(organization_id) and role <> 'owner');
create policy "admins update members" on public.organization_members for update to authenticated using (public.is_org_admin(organization_id) and role <> 'owner');
create policy "admins delete members" on public.organization_members for delete to authenticated using (public.is_org_admin(organization_id) and role <> 'owner');

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key public.lead_stage not null,
  name text not null,
  position int not null,
  created_at timestamptz not null default now(),
  unique (organization_id, key)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, phone text, email text, source text,
  stage public.lead_stage not null default 'novo',
  assigned_to uuid, notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  name text not null, phone text, email text, address text, notes text,
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  customer_name text not null,
  description text,
  amount numeric(12,2) not null default 0,
  budget_date date not null default current_date,
  status public.budget_status not null default 'rascunho',
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text,
  due_at timestamptz,
  status public.task_status not null default 'pendente',
  assigned_to uuid,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  type text not null default 'nota',
  content text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['pipeline_stages','leads','clients','budgets','tasks','interactions'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "org members select" on public.%I for select to authenticated using (public.is_org_member(organization_id))', t);
    execute format('create policy "org members insert" on public.%I for insert to authenticated with check (public.is_org_member(organization_id))', t);
    execute format('create policy "org members update" on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', t);
    execute format('create policy "org admins delete" on public.%I for delete to authenticated using (public.is_org_admin(organization_id))', t);
  end loop;
end $$;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan public.subscription_plan not null default 'start',
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  provider text not null default 'cakto',
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "admins read subscription" on public.subscriptions for select to authenticated using (public.is_org_admin(organization_id));

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null default 'cakto',
  event_type text not null,
  payload jsonb,
  received_at timestamptz not null default now()
);
grant all on public.subscription_events to service_role;
alter table public.subscription_events enable row level security;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare org_id uuid; company text;
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  company := nullif(trim(coalesce(new.raw_user_meta_data->>'company_name','')), '');
  if company is null then company := 'Minha empresa'; end if;
  insert into public.organizations(name, owner_id) values (company, new.id) returning id into org_id;
  insert into public.organization_members(organization_id, user_id, role) values (org_id, new.id, 'owner');
  insert into public.pipeline_stages(organization_id, key, name, position) values
    (org_id,'novo','Novo lead',1),(org_id,'primeiro_contato','Primeiro contato',2),
    (org_id,'negociacao','Em negociação',3),(org_id,'orcamento_enviado','Orçamento enviado',4),
    (org_id,'venda_concluida','Venda concluída',5),(org_id,'venda_perdida','Venda perdida',6);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();