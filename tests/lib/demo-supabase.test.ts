import { describe, expect, it } from 'vitest'
import { DEMO_IDS } from '@/lib/demo/data'
import { createDemoServerClient } from '@/lib/demo/supabase'

describe('demo supabase client', () => {
  it('filters courses by professor and embeds professor name', async () => {
    const supabase = createDemoServerClient()
    const result = await supabase
      .from('courses')
      .select('id, name, year, semester, credit, professor:profiles!courses_professor_id_fkey(id, name)')
      .eq('professor_id', DEMO_IDS.professor)

    const rows = result.data as Array<{ name: string; professor: { name: string } | null }>
    expect(result.error).toBeNull()
    expect(rows.length).toBe(2)
    expect(rows[0]?.professor?.name).toBe('Alicia Maria Argalás')
  })

  it('returns a single profile by id', async () => {
    const supabase = createDemoServerClient()
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', DEMO_IDS.student)
      .maybeSingle()

    expect((result.data as { student_number: string }).student_number).toBe('202301012A')
  })

  it('filters nested course.professor_id for teaching ownership', async () => {
    const supabase = createDemoServerClient()
    const result = await supabase
      .from('student_courses')
      .select('student_id, course:courses!inner(professor_id)')
      .eq('course.professor_id', DEMO_IDS.professor)

    const rows = result.data as Array<{ student_id: string }>
    expect(rows.map((row) => row.student_id).sort()).toEqual(
      [DEMO_IDS.student, DEMO_IDS.student, DEMO_IDS.student2].sort(),
    )
  })

  it('counts profiles with a head query', async () => {
    const supabase = createDemoServerClient()
    const result = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    expect(result.count).toBe(4)
    expect(result.data).toBeNull()
  })
})
