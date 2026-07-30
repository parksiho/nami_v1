export const ADMIN_COURSE_PAGE_SIZE = 10

type SearchParams = {
  q?: string
  page?: string
  professorId?: string
}

export type CourseFormValues = {
  name: string
  professorId: string
  year: number
  semester: number
  credit: number
}

export type CourseFormParseResult =
  | { data: CourseFormValues }
  | { error: 'required' | 'invalidNumbers' }

export function getAdminCourseListParams(searchParams: SearchParams) {
  const query = searchParams.q?.trim() ?? ''
  const professorId = searchParams.professorId?.trim() ?? ''
  const parsedPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const from = (page - 1) * ADMIN_COURSE_PAGE_SIZE

  return {
    query,
    professorId,
    page,
    pageSize: ADMIN_COURSE_PAGE_SIZE,
    from,
    to: from + ADMIN_COURSE_PAGE_SIZE - 1,
  }
}

function readInteger(formData: FormData, field: string): number {
  const raw = String(formData.get(field) ?? '').trim()
  return /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN
}

export function parseCourseFormData(formData: FormData): CourseFormParseResult {
  const name = String(formData.get('name') ?? '').trim()
  const professorId = String(formData.get('professorId') ?? '').trim()

  if (!name || !professorId) return { error: 'required' }

  const year = readInteger(formData, 'year')
  const semester = readInteger(formData, 'semester')
  const credit = readInteger(formData, 'credit')

  if (
    !Number.isInteger(year)
    || year < 1
    || ![1, 2].includes(semester)
    || !Number.isInteger(credit)
    || credit < 1
  ) {
    return { error: 'invalidNumbers' }
  }

  return { data: { name, professorId, year, semester, credit } }
}
