drop table if exists public.products cascade;

create extension if not exists pgcrypto;

create table public.products (
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

create index products_seller_slug_idx on public.products (seller_slug);
create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category);
create index products_created_at_idx on public.products (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "Anyone can read published products"
on public.products
for select
using (status = 'published');

insert into public.products (
  seller_slug,
  title,
  slug,
  price,
  category,
  description,
  image_url,
  status
) values (
  'la-cocina-de-maria',
  'Tamales caseros',
  'tamales-caseros',
  25,
  'Comida',
  'Tamales hechos en casa, listos para pedido por WhatsApp.',
  null,
  'published'
);
