import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('final review security regressions', () => {
  const initSql = read('supabase/migrations/20260730000000_init.sql')

  it('does not give students update or delete policies on student_courses', () => {
    expect(initSql).not.toContain('student_courses_update_own')
    expect(initSql).not.toContain('student_courses_delete_own')
  })

  it('limits student enrollment inserts to safe grade defaults', () => {
    expect(initSql).toMatch(/student_courses_insert_own[\s\S]*score = 0/)
    expect(initSql).toMatch(/student_courses_insert_own[\s\S]*pass = false/)
    expect(initSql).toMatch(
      /student_courses_insert_own[\s\S]*enrollment_status in \('APPLIED', 'IN_PROGRESS'\)/,
    )
  })

  it('prevents professors from changing enrollment identity fields', () => {
    expect(initSql).toContain('protect_student_course_update')
    expect(initSql).toMatch(/old\.student_id is distinct from new\.student_id/)
    expect(initSql).toMatch(/old\.course_id is distinct from new\.course_id/)
  })

  it('ships an idempotent repair migration for deployed databases', () => {
    const fixSql = read(
      'supabase/migrations/20260730000001_fix_rls_student_courses.sql',
    )
    expect(fixSql).toContain('drop policy if exists student_courses_update_own')
    expect(fixSql).toContain('drop policy if exists student_courses_delete_own')
    expect(fixSql).toContain('create or replace function public.prevent_non_admin_role_change')
  })

  it('permits trusted service-role and SQL Editor role bootstrap', () => {
    expect(initSql).toMatch(/auth\.jwt\(\) ->> 'role'[\s\S]{0,40}'service_role'/)
    expect(initSql).toMatch(
      /current_setting\('request\.jwt\.claim\.role', true\)[\s\S]{0,40}'service_role'/,
    )
    expect(initSql).toMatch(/current_user in \('postgres', 'supabase_admin'\)/)
  })
  it('adds student number and enrolled semester to profiles', () => {
    expect(initSql).toContain('student_number text')
    expect(initSql).toContain('enrolled_semester int')
    expect(initSql).toContain('profiles_student_number_unique')

    const migration = read(
      'supabase/migrations/20260731000000_profile_student_number_semester.sql',
    )
    expect(migration).toContain('add column if not exists student_number text')
    expect(migration).toContain('add column if not exists enrolled_semester int')
    expect(migration).toContain('profiles_student_number_unique')
  })
})

describe('locale root page', () => {
  it('routes users according to authentication state', () => {
    const page = read('app/[locale]/page.tsx')
    expect(page).toContain("redirect({ href: user ? '/home' : '/login', locale })")
    expect(page).not.toContain('scaffolding in progress')
  })
})
