create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_slug text not null,
  title text not null,
  slug text not null,
  price numeric(10, 2) not null check (price >= 0),
  category text not null,
  description text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_slug, slug)
);

create index if not exists products_seller_slug_idx on public.products (seller_slug);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "Anyone can read published products" on public.products;

create policy "Anyone can read published products"
on public.products
for select
using (status = 'published');
