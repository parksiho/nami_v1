export function getCurrentSemester(
  yearEnv = process.env.NEXT_PUBLIC_CURRENT_YEAR,
  semesterEnv = process.env.NEXT_PUBLIC_CURRENT_SEMESTER
): { year: number; semester: number } {
  const year = Number(yearEnv ?? 2026)
  const semester = Number(semesterEnv ?? 1)
  return { year, semester }
}
