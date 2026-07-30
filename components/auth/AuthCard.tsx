import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, children, footer }: Props) {
  return (
    <section className="auth-card">
      <h1 className="auth-card__title">{title}</h1>
      {children}
      {footer ? <div className="auth-links">{footer}</div> : null}
    </section>
  )
}
