import type { AcademicStatus } from '@/lib/domain/enums'

export type TimelineItem = {
  id: string
  from_status: AcademicStatus | null
  to_status: AcademicStatus
  reason: string | null
  leave_start: string | null
  leave_end: string | null
  changed_at: string
  advisor?: { name: string | null } | null
}

type Props = {
  items: TimelineItem[]
  labels: Record<AcademicStatus, string>
  emptyLabel: string
  reasonLabel: string
  leaveLabel: string
  advisorLabel: string
}

export function EnrollmentTimeline({
  items, labels, emptyLabel, reasonLabel, leaveLabel, advisorLabel,
}: Props) {
  if (!items.length) return <p className="admin-notice">{emptyLabel}</p>
  return (
    <ol className="enrollment-timeline">
      {items.map((item) => (
        <li key={item.id}>
          <strong>
            {item.from_status ? `${labels[item.from_status]} → ` : ''}{labels[item.to_status]}
          </strong>
          <time dateTime={item.changed_at}>{new Date(item.changed_at).toLocaleDateString()}</time>
          {item.reason ? <p>{reasonLabel}: {item.reason}</p> : null}
          {item.leave_start || item.leave_end ? (
            <p>{leaveLabel}: {item.leave_start ?? '–'} – {item.leave_end ?? '–'}</p>
          ) : null}
          {item.advisor?.name ? <p>{advisorLabel}: {item.advisor.name}</p> : null}
        </li>
      ))}
    </ol>
  )
}
