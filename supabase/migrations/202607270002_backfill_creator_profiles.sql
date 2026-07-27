-- Users that existed before the profile trigger was installed could authenticate,
-- but requireRole rejected them because they had no matching profile row.
insert into public.profiles (id, display_name, username, role)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data->>'display_name', ''), split_part(users.email, '@', 1), 'Creator'),
  replace(users.id::text, '-', ''),
  'creator'::public.user_role
from auth.users as users
where not exists (select 1 from public.profiles where profiles.id = users.id)
on conflict do nothing;
