import type { UserRole } from '@/lib/domain/enums'

export type Profile = {
  id: string
  role: UserRole
  name: string | null
  birth_date: string | null
  occupation: string | null
  mobile: string | null
  email: string | null
  nationality: string | null
  address: string | null
  gender: string | null
  church_name: string | null
  church_position: string | null
  preferred_language: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}
