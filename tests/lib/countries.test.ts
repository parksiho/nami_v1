import { describe, expect, it } from 'vitest'
import {
  getCountryLabel,
  getCountryOptions,
  resolveNationalityCode,
} from '@/lib/countries'

describe('resolveNationalityCode', () => {
  it('resolves ISO alpha-2 codes', () => {
    expect(resolveNationalityCode('py')).toBe('PY')
    expect(resolveNationalityCode('KR')).toBe('KR')
  })

  it('resolves common free-text nationality labels', () => {
    expect(resolveNationalityCode('Argentina')).toBe('AR')
    expect(resolveNationalityCode('Paraguay')).toBe('PY')
    expect(resolveNationalityCode('Brasil')).toBe('BR')
  })

  it('resolves messy legacy Korea labels', () => {
    expect(
      resolveNationalityCode('Republic Of Korea (대한민국) (South Korea)'),
    ).toBe('KR')
  })

  it('returns null for blank or unknown values', () => {
    expect(resolveNationalityCode(null)).toBeNull()
    expect(resolveNationalityCode('   ')).toBeNull()
    expect(resolveNationalityCode('NotARealCountryXYZ')).toBeNull()
  })
})

describe('getCountryOptions', () => {
  it('puts preferred SETESS countries first', () => {
    const options = getCountryOptions('ko')
    expect(options.slice(0, 3).map((o) => o.code)).toEqual(['PY', 'AR', 'KR'])
    expect(options.length).toBeGreaterThan(100)
  })
})

describe('getCountryLabel', () => {
  it('returns a localized official name for codes and legacy text', () => {
    expect(getCountryLabel('AR', 'ko')).toMatch(/아르헨티나|Argentina/)
    expect(getCountryLabel('Argentina', 'en')).toBe('Argentina')
  })
})
