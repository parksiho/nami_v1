import type { ReactNode } from 'react'
import { Header } from '@/components/Header'

type Props = {
  children: ReactNode
}

export default function PublicLayout({ children }: Props) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
