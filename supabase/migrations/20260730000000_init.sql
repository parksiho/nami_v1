-- nami initial schema: profiles, courses, enrollments, notices, change_logs + RLS

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'STUDENT'
    check (role in ('STUDENT', 'PROFESSOR', 'ADMIN')),
  name text,
  birth_date date,
  occupation text,
  mobile text,
  email text,
  nationality text,
  address text,
  gender text,
  church_name text,
  church_position text,
  preferred_language text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, email)
  values (
    new.id,
    'STUDENT',
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_non_admin_role_change();

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  professor_id uuid not null references public.profiles (id),
  year int not null,
  semester int not null,
  credit int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- student_courses
-- ---------------------------------------------------------------------------

create table public.student_courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id),
  course_id uuid not null references public.courses (id) on delete cascade,
  enrollment_status text not null default 'APPLIED'
    check (enrollment_status in (
      'APPLIED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
  score int not null default 0,
  pass boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
);

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

create trigger student_courses_protect_fields
  before update on public.student_courses
  for each row execute function public.protect_student_course_update();

create trigger student_courses_set_updated_at
  before update on public.student_courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- enrollment_records
-- ---------------------------------------------------------------------------

create table public.enrollment_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id),
  grade_year int,
  year int not null,
  semester int not null,
  status text not null
    check (status in (
      'ADMISSION', 'ENROLLED', 'LEAVE', 'EXPELLED', 'GRADUATED'
    )),
  entrance_info text,
  graduate_info text,
  change_reason text,
  leave_start date,
  leave_end date,
  advisor_professor_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger enrollment_records_set_updated_at
  before update on public.enrollment_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- enrollment_history
-- ---------------------------------------------------------------------------

create table public.enrollment_history (
  id uuid primary key default gen_random_uuid(),
  enrollment_record_id uuid references public.enrollment_records (id) on delete cascade,
  student_id uuid not null references public.profiles (id),
  from_status text
    check (from_status is null or from_status in (
      'ADMISSION', 'ENROLLED', 'LEAVE', 'EXPELLED', 'GRADUATED'
    )),
  to_status text not null
    check (to_status in (
      'ADMISSION', 'ENROLLED', 'LEAVE', 'EXPELLED', 'GRADUATED'
    )),
  reason text,
  leave_start date,
  leave_end date,
  advisor_id uuid references public.profiles (id),
  changed_by uuid references public.profiles (id),
  changed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- notices
-- ---------------------------------------------------------------------------

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notices_set_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- change_logs
-- ---------------------------------------------------------------------------

create table public.change_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id),
  action text not null,
  target_type text not null,
  target_id uuid,
  summary text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auth helpers (after tables exist)
-- ---------------------------------------------------------------------------

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'ADMIN';
$$;

create or replace function public.is_professor_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_courses sc
    join public.courses c on c.id = sc.course_id
    where sc.student_id = p_student_id
      and c.professor_id = auth.uid()
  );
$$;

create or replace function public.is_professor_of_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and c.professor_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.student_courses enable row level security;
alter table public.enrollment_records enable row level security;
alter table public.enrollment_history enable row level security;
alter table public.notices enable row level security;
alter table public.change_logs enable row level security;

-- profiles: select own | admin all | professor select students in their courses
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_select_admin
  on public.profiles for select
  using (public.is_admin());

create policy profiles_select_professor_students
  on public.profiles for select
  using (
    public.auth_role() = 'PROFESSOR'
    and public.is_professor_of_student(profiles.id)
  );

-- profiles update: own (role guarded by trigger) | admin all
create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- courses: authenticated select; admin write
create policy courses_select_authenticated
  on public.courses for select
  using (auth.uid() is not null);

create policy courses_insert_admin
  on public.courses for insert
  with check (public.is_admin());

create policy courses_update_admin
  on public.courses for update
  using (public.is_admin())
  with check (public.is_admin());

create policy courses_delete_admin
  on public.courses for delete
  using (public.is_admin());

-- student_courses: student own; professor for courses they teach; admin all
create policy student_courses_select_own
  on public.student_courses for select
  using (student_id = auth.uid());

create policy student_courses_select_professor
  on public.student_courses for select
  using (public.is_professor_of_course(course_id));

create policy student_courses_select_admin
  on public.student_courses for select
  using (public.is_admin());

create policy student_courses_insert_own
  on public.student_courses for insert
  with check (
    student_id = auth.uid()
    and score = 0
    and pass = false
    and enrollment_status in ('APPLIED', 'IN_PROGRESS')
  );

create policy student_courses_insert_admin
  on public.student_courses for insert
  with check (public.is_admin());

create policy student_courses_update_professor
  on public.student_courses for update
  using (public.is_professor_of_course(course_id))
  with check (public.is_professor_of_course(course_id));

create policy student_courses_update_admin
  on public.student_courses for update
  using (public.is_admin())
  with check (public.is_admin());

create policy student_courses_delete_admin
  on public.student_courses for delete
  using (public.is_admin());

-- enrollment_records: student own select; professor if student in course; admin all write
create policy enrollment_records_select_own
  on public.enrollment_records for select
  using (student_id = auth.uid());

create policy enrollment_records_select_professor
  on public.enrollment_records for select
  using (public.is_professor_of_student(student_id));

create policy enrollment_records_select_admin
  on public.enrollment_records for select
  using (public.is_admin());

create policy enrollment_records_insert_admin
  on public.enrollment_records for insert
  with check (public.is_admin());

create policy enrollment_records_update_admin
  on public.enrollment_records for update
  using (public.is_admin())
  with check (public.is_admin());

create policy enrollment_records_delete_admin
  on public.enrollment_records for delete
  using (public.is_admin());

-- enrollment_history: same read pattern; admin write
create policy enrollment_history_select_own
  on public.enrollment_history for select
  using (student_id = auth.uid());

create policy enrollment_history_select_professor
  on public.enrollment_history for select
  using (public.is_professor_of_student(student_id));

create policy enrollment_history_select_admin
  on public.enrollment_history for select
  using (public.is_admin());

create policy enrollment_history_insert_admin
  on public.enrollment_history for insert
  with check (public.is_admin());

create policy enrollment_history_update_admin
  on public.enrollment_history for update
  using (public.is_admin())
  with check (public.is_admin());

create policy enrollment_history_delete_admin
  on public.enrollment_history for delete
  using (public.is_admin());

-- notices: all authenticated select; admin write
create policy notices_select_authenticated
  on public.notices for select
  using (auth.uid() is not null);

create policy notices_insert_admin
  on public.notices for insert
  with check (public.is_admin());

create policy notices_update_admin
  on public.notices for update
  using (public.is_admin())
  with check (public.is_admin());

create policy notices_delete_admin
  on public.notices for delete
  using (public.is_admin());

-- change_logs: admin select all; authenticated insert own actor_id
create policy change_logs_select_admin
  on public.change_logs for select
  using (public.is_admin());

create policy change_logs_insert_own
  on public.change_logs for insert
  with check (actor_id = auth.uid());

create policy change_logs_insert_admin
  on public.change_logs for insert
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: avatars bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_select_public
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete_own
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_admin_all
  on storage.objects for all
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());
