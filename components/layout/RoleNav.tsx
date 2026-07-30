'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import type { NavItem } from '@/lib/home/build-home-model'

type Props = {
  items: NavItem[]
}

export function RoleNav({ items }: Props) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav aria-label="Main" className="role-nav">
      <ul className="role-nav__list">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive ? 'role-nav__link is-active' : 'role-nav__link'
                }
              >
                {t(item.labelKey)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
