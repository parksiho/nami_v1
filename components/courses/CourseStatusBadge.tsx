import { getTranslations } from 'next-intl/server'
import type { CourseEnrollmentStatus } from '@/lib/domain/enums'

export async function CourseStatusBadge({ status }: { status: CourseEnrollmentStatus }) {
  const t = await getTranslations('courseEnrollment.statuses')

  return (
    <span className={`course-status course-status--${status.toLowerCase()}`}>
      {t(status)}
    </span>
  )
}
