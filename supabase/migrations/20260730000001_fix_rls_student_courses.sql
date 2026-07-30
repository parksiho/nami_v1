-- Restrict student_courses writes and allow trusted first-admin bootstrap.

create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.role is distinct from new.role
    and coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
    and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
    and current_user not in ('postgres', 'supabase_admin')
    and public.auth_role() is distinct from 'ADMIN'
  then
    raise exception 'Only admins may change profile role';
  end if;
  return new;
end;
$$;

update public.student_courses
set score = coalesce(score, 0),
    pass = coalesce(pass, false)
where score is null or pass is null;

alter table public.student_courses
  alter column score set default 0,
  alter column score set not null,
  alter column pass set default false,
  alter column pass set not null;

create or replace function public.protect_student_course_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin')
    or public.auth_role() = 'ADMIN'
  then
    return new;
  end if;

  if public.auth_role() = 'PROFESSOR' then
    if old.id is distinct from new.id
      or old.student_id is distinct from new.student_id
      or old.course_id is distinct from new.course_id
      or old.created_at is distinct from new.created_at
      or old.updated_at is distinct from new.updated_at
    then
      raise exception 'Professors may update only score, pass, and enrollment_status';
    end if;
    return new;
  end if;

  raise exception 'Students may not update course enrollments';
end;
$$;

drop trigger if exists student_courses_protect_fields
  on public.student_courses;
create trigger student_courses_protect_fields
  before update on public.student_courses
  for each row execute function public.protect_student_course_update();

drop policy if exists student_courses_insert_own
  on public.student_courses;
create policy student_courses_insert_own
  on public.student_courses for insert
  with check (
    student_id = auth.uid()
    and score = 0
    and pass = false
    and enrollment_status in ('APPLIED', 'IN_PROGRESS')
  );

drop policy if exists student_courses_update_own
  on public.student_courses;
drop policy if exists student_courses_delete_own
  on public.student_courses;
