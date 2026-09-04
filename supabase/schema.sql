create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_mi_mapa_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

create table if not exists public.app_settings (
  id text primary key default 'directory',
  directory_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, directory_enabled)
values ('directory', false)
on conflict (id) do nothing;

create table if not exists public.consultants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo text not null default '',
  description text not null default '',
  training text[] not null default '{}',
  specialties text[] not null default '{}',
  modalities text[] not null default '{Videollamada}',
  city text not null default '',
  languages text[] not null default '{Español}',
  duration_minutes integer not null default 60,
  price_label text not null default '',
  contact_url text not null default '',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid references public.consultants(id) on delete set null,
  client_name text not null,
  contact text not null,
  requested_at timestamptz not null default now(),
  session_at timestamptz,
  status text not null default 'Nueva' check (status in ('Nueva','Contactada','Reservada','Realizada','Cancelada')),
  price numeric(12,2) not null default 0,
  commission_paid boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
alter table public.consultants enable row level security;
alter table public.referrals enable row level security;

drop policy if exists "public reads directory setting" on public.app_settings;
create policy "public reads directory setting" on public.app_settings for select using (true);
drop policy if exists "admin manages directory setting" on public.app_settings;
create policy "admin manages directory setting" on public.app_settings for all to authenticated using (public.is_mi_mapa_admin()) with check (public.is_mi_mapa_admin());

drop policy if exists "public reads active consultants" on public.consultants;
create policy "public reads active consultants" on public.consultants for select using (active = true or public.is_mi_mapa_admin());
drop policy if exists "admin manages consultants" on public.consultants;
create policy "admin manages consultants" on public.consultants for all to authenticated using (public.is_mi_mapa_admin()) with check (public.is_mi_mapa_admin());

drop policy if exists "admin manages referrals" on public.referrals;
create policy "admin manages referrals" on public.referrals for all to authenticated using (public.is_mi_mapa_admin()) with check (public.is_mi_mapa_admin());

insert into storage.buckets (id, name, public)
values ('consultant-photos', 'consultant-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public reads consultant photos" on storage.objects;
create policy "public reads consultant photos" on storage.objects for select using (bucket_id = 'consultant-photos');
drop policy if exists "admin uploads consultant photos" on storage.objects;
create policy "admin uploads consultant photos" on storage.objects for insert to authenticated with check (bucket_id = 'consultant-photos' and public.is_mi_mapa_admin());
drop policy if exists "admin updates consultant photos" on storage.objects;
create policy "admin updates consultant photos" on storage.objects for update to authenticated using (bucket_id = 'consultant-photos' and public.is_mi_mapa_admin()) with check (bucket_id = 'consultant-photos' and public.is_mi_mapa_admin());
drop policy if exists "admin removes consultant photos" on storage.objects;
create policy "admin removes consultant photos" on storage.objects for delete to authenticated using (bucket_id = 'consultant-photos' and public.is_mi_mapa_admin());
