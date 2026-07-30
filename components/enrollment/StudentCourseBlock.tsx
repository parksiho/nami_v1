import type { CourseEnrollmentStatus } from '@/lib/domain/enums'

export type StudentCourseItem = {
  id: string
  enrollment_status: CourseEnrollmentStatus
  score: number | null
  pass: boolean | null
  course: {
    name: string
    year: number
    semester: number
    credit: number
  } | null
}

export function StudentCourseBlock({
  courses,
  title,
  emptyLabel,
  statusLabels,
}: {
  courses: StudentCourseItem[]
  title: string
  emptyLabel: string
  statusLabels: Record<CourseEnrollmentStatus, string>
}) {
  return (
    <section className="admin-card">
      <h2>{title}</h2>
      {!courses.length ? <p>{emptyLabel}</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Course</th><th>Term</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {courses.map((item) => (
                <tr key={item.id}>
                  <td>{item.course?.name ?? '–'}</td>
                  <td>{item.course ? `${item.course.year} / ${item.course.semester}` : '–'}</td>
                  <td>{statusLabels[item.enrollment_status]}</td>
                  <td>{item.score ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
