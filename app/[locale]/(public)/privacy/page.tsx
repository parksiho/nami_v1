import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LegalDocument } from '@/components/legal/LegalDocument'

const SECTION_KEYS = [
  'purpose',
  'collection',
  'usage',
  'retention',
  'sharing',
  'security',
  'rights',
  'cookies',
  'changes',
  'contact',
] as const

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal.privacy')

  const sections = SECTION_KEYS.map((key) => ({
    key,
    heading: t(`sections.${key}.heading`),
    body: t(`sections.${key}.body`),
  }))

  return (
    <main className="page-main legal-page">
      <LegalDocument
        title={t('title')}
        lastUpdatedLabel={t('lastUpdatedLabel', { date: t('lastUpdated') })}
        intro={t('intro')}
        sections={sections}
      />
    </main>
  )
}
