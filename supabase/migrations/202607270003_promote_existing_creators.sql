-- Account registration has always promised immediate Creator Area access. Profiles
-- made by older versions of the signup trigger may still carry the viewer default.
update public.profiles
set role = 'creator'::public.user_role,
    updated_at = now()
where role = 'viewer'::public.user_role;
