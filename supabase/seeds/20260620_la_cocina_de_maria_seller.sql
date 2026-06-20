insert into public.sellers (
  name,
  email,
  whatsapp,
  zona,
  description
)
select
  'La Cocina de María',
  'demo+la-cocina-de-maria@yocomprolocal.com',
  '5512345678',
  'Centro Urbano',
  'Tamales caseros y comida hecha en casa para pedidos locales por WhatsApp.'
where not exists (
  select 1
  from public.sellers
  where lower(name) = lower('La Cocina de María')
);
