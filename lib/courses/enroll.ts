export function canEnroll(existingCourseIds: readonly string[], courseId: string): boolean {
  return !existingCourseIds.includes(courseId)
}
