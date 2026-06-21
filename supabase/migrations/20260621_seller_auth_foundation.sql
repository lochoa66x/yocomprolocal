create extension if not exists pgcrypto;
create extension if not exists unaccent;

alter table public.sellers
  add column if not exists id uuid default gen_random_uuid();

alter table public.sellers
  add column if not exists slug text;

alter table public.sellers
  add column if not exists user_id uuid;

alter table public.sellers
  add column if not exists created_at timestamptz not null default now();

alter table public.sellers
  add column if not exists updated_at timestamptz not null default now();

update public.sellers
set id = gen_random_uuid()
where id is null;

with base_slugs as (
  select
    id,
    coalesce(
      nullif(
        trim(both '-' from lower(regexp_replace(unaccent(coalesce(name, 'vendedor-local')), '[^a-zA-Z0-9]+', '-', 'g'))),
        ''
      ),
      'vendedor-local'
    ) as base_slug
  from public.sellers
  where slug is null or trim(slug) = ''
),
numbered_slugs as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as duplicate_number
  from base_slugs
)
update public.sellers as sellers
set slug = case
  when numbered_slugs.duplicate_number = 1 then numbered_slugs.base_slug
  else numbered_slugs.base_slug || '-' || numbered_slugs.duplicate_number::text
end
from numbered_slugs
where sellers.id = numbered_slugs.id;

alter table public.sellers
  alter column id set not null;

alter table public.sellers
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sellers'::regclass
      and contype = 'p'
  ) then
    alter table public.sellers add constraint sellers_pkey primary key (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sellers_slug_key'
      and conrelid = 'public.sellers'::regclass
  ) then
    alter table public.sellers add constraint sellers_slug_key unique (slug);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sellers_user_id_fkey'
      and conrelid = 'public.sellers'::regclass
  ) then
    alter table public.sellers
      add constraint sellers_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

create unique index if not exists sellers_user_id_unique_idx
  on public.sellers (user_id)
  where user_id is not null;

create index if not exists sellers_email_idx on public.sellers (lower(email));
create index if not exists sellers_slug_idx on public.sellers (slug);

alter table public.products
  add column if not exists seller_id uuid;

update public.products as products
set seller_id = sellers.id
from public.sellers as sellers
where products.seller_id is null
  and products.seller_slug = sellers.slug;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_seller_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_seller_id_fkey
      foreign key (seller_id)
      references public.sellers(id)
      on delete cascade;
  end if;
end $$;

create index if not exists products_seller_id_idx on public.products (seller_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sellers_set_updated_at on public.sellers;

create trigger sellers_set_updated_at
before update on public.sellers
for each row
execute function public.set_updated_at();

alter table public.sellers enable row level security;
alter table public.products enable row level security;

drop policy if exists "Anyone can read sellers" on public.sellers;
drop policy if exists "Seller owners can update their profile" on public.sellers;
drop policy if exists "Seller owners can read their full profile" on public.sellers;
drop policy if exists "Seller owners can insert products" on public.products;
drop policy if exists "Seller owners can update products" on public.products;
drop policy if exists "Seller owners can delete products" on public.products;

create policy "Anyone can read sellers"
on public.sellers
for select
using (true);

create policy "Seller owners can read their full profile"
on public.sellers
for select
to authenticated
using (auth.uid() = user_id);

create policy "Seller owners can update their profile"
on public.sellers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Seller owners can insert products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sellers
    where sellers.id = products.seller_id
      and sellers.user_id = auth.uid()
  )
);

create policy "Seller owners can update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.sellers
    where sellers.id = products.seller_id
      and sellers.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sellers
    where sellers.id = products.seller_id
      and sellers.user_id = auth.uid()
  )
);

create policy "Seller owners can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.sellers
    where sellers.id = products.seller_id
      and sellers.user_id = auth.uid()
  )
);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.sellers to anon, authenticated;
grant update on public.sellers to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant all privileges on public.sellers to service_role;
grant all privileges on public.products to service_role;
