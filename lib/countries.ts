import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import es from 'i18n-iso-countries/langs/es.json'
import ko from 'i18n-iso-countries/langs/ko.json'

countries.registerLocale(en)
countries.registerLocale(es)
countries.registerLocale(ko)

/** Frequently used in SETESS records — shown first in the picker. */
export const PREFERRED_COUNTRY_CODES = [
  'PY',
  'AR',
  'KR',
  'UY',
  'BR',
  'CL',
  'BO',
  'US',
] as const

export type CountryOption = {
  code: string
  name: string
}

function localeToCountryLang(locale: string): 'ko' | 'en' | 'es' {
  if (locale.startsWith('ko')) return 'ko'
  if (locale.startsWith('es')) return 'es'
  return 'en'
}

export function getCountryOptions(locale: string): CountryOption[] {
  const lang = localeToCountryLang(locale)
  const names = countries.getNames(lang, { select: 'official' })
  const preferred = new Set<string>(PREFERRED_COUNTRY_CODES)

  const preferredOptions = PREFERRED_COUNTRY_CODES.flatMap((code) => {
    const name = names[code]
    return name ? [{ code, name }] : []
  })

  const rest = Object.entries(names)
    .filter(([code]) => !preferred.has(code))
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, lang))

  return [...preferredOptions, ...rest]
}

export function getCountryLabel(
  codeOrName: string | null | undefined,
  locale: string,
): string | null {
  if (!codeOrName?.trim()) return null
  const code = resolveNationalityCode(codeOrName)
  if (!code) return codeOrName.trim()
  return (
    countries.getName(code, localeToCountryLang(locale), { select: 'official' }) ??
    codeOrName.trim()
  )
}

/**
 * Accepts ISO alpha-2 codes or legacy free-text nationality values
 * (e.g. "Argentina", "Republic Of Korea (대한민국) (South Korea)").
 */
export function resolveNationalityCode(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const code = trimmed.toUpperCase()
    if (countries.isValid(code)) return code
  }

  for (const lang of ['en', 'es', 'ko'] as const) {
    const code = countries.getAlpha2Code(trimmed, lang)
    if (code) return code
  }

  const lowered = trimmed.toLowerCase()
  for (const lang of ['en', 'es', 'ko'] as const) {
    const names = countries.getNames(lang, { select: 'official' })
    for (const [code, name] of Object.entries(names)) {
      if (name.toLowerCase() === lowered) return code
    }
  }

  // Legacy messy labels from imports, e.g. "Brazil (Brasil)".
  for (const lang of ['en', 'es', 'ko'] as const) {
    const names = countries.getNames(lang, { select: 'official' })
    for (const [code, name] of Object.entries(names)) {
      if (
        lowered.includes(name.toLowerCase()) ||
        name.toLowerCase().includes(lowered)
      ) {
        return code
      }
    }
  }

  if (lowered.includes('korea') || lowered.includes('한국') || lowered.includes('대한민국')) {
    return 'KR'
  }

  return null
}
