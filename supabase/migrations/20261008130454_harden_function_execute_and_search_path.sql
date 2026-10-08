-- Close unauthenticated RPC access to SECURITY DEFINER helpers and pin
-- search_path on functions that do not set one.
--
-- Live grants before this migration (public.proacl):
--   {=X/postgres, postgres=X/postgres, anon=X/postgres,
--    authenticated=X/postgres, service_role=X/postgres}
-- The leading "=X" is EXECUTE granted to PUBLIC. anon, authenticated, and
-- service_role also have their own grants, so revoking PUBLIC alone does
-- not remove anon.
--
-- Who evaluates policies that call these helpers:
--   * authenticated — the app's server client uses the user JWT. RLS on
--     profiles, student_courses, enrollment_records, enrollment_history,
--     change_logs, notices writes, course writes, and storage admin writes
--     calls auth_role / is_admin / is_professor_of_*.
--   * service_role — bypasses RLS, but security-invoker triggers
--     prevent_non_admin_role_change and protect_student_course_update call
--     auth_role() as the current user. Admin user creation updates profiles
--     with the service-role key, so service_role must keep EXECUTE on the
--     helpers.
--   * anon — no page in this app reads those tables while signed out.
--     /login, /register, /privacy, and the locale root only call Auth
--     (getSession / getUser). courses and notices SELECT policies do not
--     call the helpers. Public avatar URLs are anon storage reads, but
--     avatars_select_public already allows the row; the redundant
--     is_admin() arm is simplified away by the planner.
--
-- These helpers stay SECURITY DEFINER. Switching them to invoker would
-- recurse: they read profiles, and profiles policies call them.
--
-- Idempotent: REVOKE/GRANT and ALTER FUNCTION ... SET search_path can run
-- more than once.

revoke execute on function public.auth_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_professor_of_course(uuid) from public, anon;
revoke execute on function public.is_professor_of_student(uuid) from public, anon;

grant execute on function public.auth_role() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_professor_of_course(uuid) to authenticated, service_role;
grant execute on function public.is_professor_of_student(uuid) to authenticated, service_role;

-- Trigger on auth.users. API roles must not call it via /rest/v1/rpc.
-- Trigger execution does not re-check EXECUTE for the inserting role.
revoke execute on function public.handle_new_user() from public, anon, authenticated, service_role;

alter function public.set_updated_at() set search_path = public;

-- Pin any other public function that still has a mutable search_path.
-- Extension-owned functions are left alone. On the linked project the only
-- match is set_updated_at, already pinned above.
do $pin_search_path$
declare
  fn record;
begin
  for fn in
    select
      p.proname as name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (
        select 1
        from pg_depend d
        where d.objid = p.oid
          and d.deptype = 'e'
      )
      and (
        p.proconfig is null
        or not exists (
          select 1
          from unnest(p.proconfig) as cfg
          where cfg like 'search_path=%'
        )
      )
  loop
    execute format(
      'alter function public.%I(%s) set search_path = public',
      fn.name,
      fn.args
    );
  end loop;
end
$pin_search_path$;

-- Rollback (re-opens anon/public RPC on the helpers; do not apply unless
-- reverting this migration):
-- grant execute on function public.auth_role() to public, anon;
-- grant execute on function public.is_admin() to public, anon;
-- grant execute on function public.is_professor_of_course(uuid) to public, anon;
-- grant execute on function public.is_professor_of_student(uuid) to public, anon;
-- grant execute on function public.handle_new_user() to public, anon, authenticated, service_role;
-- alter function public.set_updated_at() reset search_path;
