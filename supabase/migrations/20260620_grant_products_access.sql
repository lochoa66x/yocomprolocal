grant usage on schema public to anon, authenticated, service_role;

grant select on public.products to anon, authenticated;
grant all privileges on public.products to service_role;
