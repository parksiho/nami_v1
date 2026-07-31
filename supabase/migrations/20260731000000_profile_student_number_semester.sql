-- Add student number (학번) and enrolled semester (재학학기) to profiles.

alter table public.profiles
  add column if not exists student_number text,
  add column if not exists enrolled_semester int;

comment on column public.profiles.student_number is 'Student number / 학번';
comment on column public.profiles.enrolled_semester is 'Enrolled semester count / 재학학기 (0 = graduated in legacy data)';

create unique index if not exists profiles_student_number_unique
  on public.profiles (student_number)
  where student_number is not null;
