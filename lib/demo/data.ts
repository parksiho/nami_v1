import {
  AcademicStatus,
  CourseEnrollmentStatus,
  UserRole,
} from '@/lib/domain/enums'
import type { Profile } from '@/lib/domain/profile'

const NOW = '2026-08-01T12:00:00.000Z'

function profile(partial: Partial<Profile> & Pick<Profile, 'id' | 'role' | 'name' | 'email'>): Profile {
  return {
    birth_date: null,
    occupation: null,
    mobile: null,
    nationality: null,
    address: null,
    gender: null,
    church_name: null,
    church_position: null,
    preferred_language: 'ko',
    avatar_path: null,
    student_number: null,
    enrolled_semester: null,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
    ...partial,
  }
}

export const DEMO_IDS = {
  student: 'demo-student',
  student2: 'demo-student-2',
  professor: 'demo-professor',
  admin: 'demo-admin',
  course1: 'demo-course-1',
  course2: 'demo-course-2',
  notice1: 'demo-notice-1',
  notice2: 'demo-notice-2',
  record1: 'demo-record-1',
} as const

export const demoProfiles: Profile[] = [
  profile({
    id: DEMO_IDS.student,
    role: UserRole.STUDENT,
    name: 'Lara Lourdes Rivero',
    email: 'lara.rivero@example.com',
    birth_date: '2004-09-30',
    occupation: 'Maestra de apoyo',
    mobile: '1162846926',
    nationality: 'AR',
    address: 'Pedro Laurenz 280, Buenos Aires',
    gender: '여',
    church_name: 'Dios es Nuestro Amparo Libertad',
    church_position: '성가대',
    student_number: '202301012A',
    enrolled_semester: 3,
  }),
  profile({
    id: DEMO_IDS.student2,
    role: UserRole.STUDENT,
    name: 'Juan Bautista Pallares',
    email: 'pallares.juan@example.com',
    nationality: 'AR',
    student_number: '202407001A',
    enrolled_semester: 1,
    address: 'Granaderos 2340',
  }),
  profile({
    id: DEMO_IDS.professor,
    role: UserRole.PROFESSOR,
    name: 'Alicia Maria Argalás',
    email: 'alicia.argalas@example.com',
    occupation: '교수',
    mobile: '1137815068',
    nationality: 'AR',
    church_name: 'Faro',
    church_position: 'Pastora',
  }),
  profile({
    id: DEMO_IDS.admin,
    role: UserRole.ADMIN,
    name: '학사 관리자',
    email: 'admin@setess.edu',
    occupation: '관리자',
  }),
]

export const demoCourses = [
  {
    id: DEMO_IDS.course1,
    name: 'Evangelio según Marcos',
    professor_id: DEMO_IDS.professor,
    year: 2026,
    semester: 1,
    credit: 2,
  },
  {
    id: DEMO_IDS.course2,
    name: 'Epístolas Pastorales',
    professor_id: DEMO_IDS.professor,
    year: 2026,
    semester: 1,
    credit: 3,
  },
]

export const demoStudentCourses = [
  {
    id: 'demo-sc-1',
    student_id: DEMO_IDS.student,
    course_id: DEMO_IDS.course1,
    enrollment_status: CourseEnrollmentStatus.IN_PROGRESS,
    score: null,
    pass: null,
    created_at: NOW,
  },
  {
    id: 'demo-sc-2',
    student_id: DEMO_IDS.student,
    course_id: DEMO_IDS.course2,
    enrollment_status: CourseEnrollmentStatus.COMPLETED,
    score: 95,
    pass: true,
    created_at: '2026-07-01T12:00:00.000Z',
  },
  {
    id: 'demo-sc-3',
    student_id: DEMO_IDS.student2,
    course_id: DEMO_IDS.course1,
    enrollment_status: CourseEnrollmentStatus.APPLIED,
    score: 0,
    pass: false,
    created_at: NOW,
  },
]

export const demoEnrollmentRecords = [
  {
    id: DEMO_IDS.record1,
    student_id: DEMO_IDS.student,
    grade_year: 2,
    year: 2026,
    semester: 1,
    status: AcademicStatus.ENROLLED,
    entrance_info: '2023년 1학기 입학',
    graduate_info: null,
    change_reason: '정규 재학',
    leave_start: null,
    leave_end: null,
    advisor_professor_id: DEMO_IDS.professor,
  },
  {
    id: 'demo-record-2',
    student_id: DEMO_IDS.student2,
    grade_year: 1,
    year: 2026,
    semester: 1,
    status: AcademicStatus.ADMISSION,
    entrance_info: '2024년 입학',
    graduate_info: null,
    change_reason: null,
    leave_start: null,
    leave_end: null,
    advisor_professor_id: DEMO_IDS.professor,
  },
]

export const demoEnrollmentHistory = [
  {
    id: 'demo-hist-1',
    student_id: DEMO_IDS.student,
    from_status: AcademicStatus.ADMISSION,
    to_status: AcademicStatus.ENROLLED,
    reason: '1학기 등록 완료',
    leave_start: null,
    leave_end: null,
    changed_at: '2024-03-01T12:00:00.000Z',
    advisor_id: DEMO_IDS.professor,
  },
  {
    id: 'demo-hist-2',
    student_id: DEMO_IDS.student,
    from_status: null,
    to_status: AcademicStatus.ADMISSION,
    reason: '신입 입학',
    leave_start: null,
    leave_end: null,
    changed_at: '2023-03-01T12:00:00.000Z',
    advisor_id: DEMO_IDS.professor,
  },
]

export const demoNotices = [
  {
    id: DEMO_IDS.notice1,
    title: '2026년 1학기 개강 안내',
    body: '2026년 1학기 수업은 3월 2일에 시작합니다. 수강신청은 학적 포털에서 진행해 주세요.',
    created_at: '2026-02-20T09:00:00.000Z',
    updated_at: '2026-02-20T09:00:00.000Z',
  },
  {
    id: DEMO_IDS.notice2,
    title: '성적 입력 마감 안내',
    body: '담당 교수님께서는 기말 성적을 포털의 담당 강의 화면에서 입력해 주시기 바랍니다.',
    created_at: '2026-07-15T09:00:00.000Z',
    updated_at: '2026-07-15T09:00:00.000Z',
  },
]

export const demoChangeLogs = [
  {
    id: 'demo-log-1',
    action: 'course.update',
    target_type: 'course',
    summary: '강의 Epístolas Pastorales 학점을 3으로 수정',
    created_at: '2026-08-18T10:12:00.000Z',
    actor_id: DEMO_IDS.admin,
  },
  {
    id: 'demo-log-2',
    action: 'enrollment.create',
    target_type: 'enrollment_record',
    summary: 'Lara Lourdes Rivero 2026년 1학기 재학 기록 생성',
    created_at: '2026-08-10T14:30:00.000Z',
    actor_id: DEMO_IDS.admin,
  },
  {
    id: 'demo-log-3',
    action: 'user.update',
    target_type: 'profile',
    summary: 'Juan Bautista Pallares 학번 저장',
    created_at: '2026-08-05T11:02:00.000Z',
    actor_id: DEMO_IDS.admin,
  },
]

export const demoTables: Record<string, Record<string, unknown>[]> = {
  profiles: demoProfiles as unknown as Record<string, unknown>[],
  courses: demoCourses,
  student_courses: demoStudentCourses,
  enrollment_records: demoEnrollmentRecords,
  enrollment_history: demoEnrollmentHistory,
  notices: demoNotices,
  change_logs: demoChangeLogs,
}

export function demoProfileByRole(role: Profile['role']): Profile {
  const found = demoProfiles.find((item) => item.role === role)
  if (!found) return demoProfiles[0]
  return found
}
