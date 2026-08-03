import type { ReactNode } from 'react'

type Props = {
  brand?: string
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ brand, title, children, footer }: Props) {
  return (
    <section className="auth-card">
      {brand ? <p className="auth-card__brand">{brand}</p> : null}
      <h1 className="auth-card__title">{title}</h1>
      {children}
      {footer ? <div className="auth-links">{footer}</div> : null}
    </section>
  )
}
