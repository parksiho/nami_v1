import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { getCurrentSemester } from '@/lib/domain/semester'
import type { UserRole } from '@/lib/domain/enums'
import { signOut } from '@/app/[locale]/(app)/actions/auth'

export type AppHeaderProfile = {
  name: string | null
  role: UserRole
}

type Props = {
  profile?: AppHeaderProfile | null
}

function initials(name: string | null): string {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export async function AppHeader({ profile }: Props) {
  const tApp = await getTranslations('app')
  const tNav = await getTranslations('nav')
  const { year, semester } = getCurrentSemester()

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <p className="site-header__title">{tApp('brand')}</p>
        <p className="site-header__university">{tApp('university')}</p>
        <p className="site-header__semester">
          {tApp('semester', { year, semester })}
        </p>
      </div>
      <div className="site-header__actions">
        <LocaleSwitcher />
        {profile ? (
          <details className="profile-menu">
            <summary className="profile-menu__trigger" aria-label={tNav('profile')}>
              <span className="profile-menu__avatar" aria-hidden>
                {initials(profile.name)}
              </span>
              <span className="profile-menu__name">{profile.name ?? profile.role}</span>
            </summary>
            <div className="profile-menu__panel">
              <Link className="profile-menu__link" href="/change-password">
                {tNav('changePassword')}
              </Link>
              <form action={signOut}>
                <button className="profile-menu__button" type="submit">
                  {tNav('logout')}
                </button>
              </form>
            </div>
          </details>
        ) : null}
      </div>
    </header>
  )
}
