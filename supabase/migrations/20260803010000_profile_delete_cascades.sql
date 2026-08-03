-- Allow auth/profile deletion when related academic rows exist.
-- Optional refs become NULL; required ownership rows cascade-delete.

alter table public.courses
  drop constraint if exists courses_professor_id_fkey,
  add constraint courses_professor_id_fkey
    foreign key (professor_id) references public.profiles (id) on delete cascade;

alter table public.student_courses
  drop constraint if exists student_courses_student_id_fkey,
  add constraint student_courses_student_id_fkey
    foreign key (student_id) references public.profiles (id) on delete cascade;

alter table public.enrollment_records
  drop constraint if exists enrollment_records_student_id_fkey,
  add constraint enrollment_records_student_id_fkey
    foreign key (student_id) references public.profiles (id) on delete cascade;

alter table public.enrollment_records
  drop constraint if exists enrollment_records_advisor_professor_id_fkey,
  add constraint enrollment_records_advisor_professor_id_fkey
    foreign key (advisor_professor_id) references public.profiles (id) on delete set null;

alter table public.enrollment_history
  drop constraint if exists enrollment_history_student_id_fkey,
  add constraint enrollment_history_student_id_fkey
    foreign key (student_id) references public.profiles (id) on delete cascade;

alter table public.enrollment_history
  drop constraint if exists enrollment_history_advisor_id_fkey,
  add constraint enrollment_history_advisor_id_fkey
    foreign key (advisor_id) references public.profiles (id) on delete set null;

alter table public.enrollment_history
  drop constraint if exists enrollment_history_changed_by_fkey,
  add constraint enrollment_history_changed_by_fkey
    foreign key (changed_by) references public.profiles (id) on delete set null;

alter table public.notices
  drop constraint if exists notices_author_id_fkey,
  add constraint notices_author_id_fkey
    foreign key (author_id) references public.profiles (id) on delete cascade;

alter table public.change_logs
  drop constraint if exists change_logs_actor_id_fkey,
  add constraint change_logs_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete cascade;
