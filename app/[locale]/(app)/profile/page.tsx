import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { requireUser } from '@/lib/auth/require-user'
import { UserRole } from '@/lib/domain/enums'
import type { Profile } from '@/lib/domain/profile'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
}

const demoProfile: Profile = {
  id: 'demo',
  role: UserRole.STUDENT,
  name: 'Demo Student',
  birth_date: null,
  occupation: null,
  mobile: null,
  email: 'demo@example.com',
  nationality: null,
  address: null,
  gender: null,
  church_name: null,
  church_position: null,
  preferred_language: null,
  avatar_path: null,
  student_number: null,
  enrolled_semester: null,
  is_active: true,
  created_at: '',
  updated_at: '',
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('profile')

  let profile = demoProfile
  let addressCorpus: string[] = []
  let avatarUrl: string | null = null

  if (isSupabaseConfigured()) {
    profile = (await requireUser()).profile
    const supabase = await createClient()
    const { data: rows } = await supabase
      .from('profiles')
      .select('address')
      .not('address', 'is', null)
      .limit(100)

    addressCorpus = Array.from(
      new Set(
        (rows ?? [])
          .map((row) => row.address)
          .filter((address): address is string => Boolean(address)),
      ),
    )

    if (profile.avatar_path) {
      avatarUrl = supabase.storage
        .from('avatars')
        .getPublicUrl(profile.avatar_path).data.publicUrl
    }
  }

  return (
    <main className="page-main profile-page">
      <header className="profile-page__header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      <ProfileForm
        profile={profile}
        addressCorpus={addressCorpus}
        avatarUrl={avatarUrl}
      />
    </main>
  )
}
