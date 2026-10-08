import { describe, expect, it } from 'vitest'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import ko from '../../messages/ko.json'
import {
  getPasswordViolation,
  passwordIssueMessageKey,
  passwordViolationKey,
  weakPasswordMessageKey,
} from '@/lib/auth/password'

describe('password rules', () => {
  it('requires 8 characters and both a letter and a digit', () => {
    expect(getPasswordViolation('abc123')).toBe('too_short')
    expect(getPasswordViolation('12345678')).toBe('needs_letter_and_digit')
    expect(getPasswordViolation('abcdefgh')).toBe('needs_letter_and_digit')
    expect(getPasswordViolation('가나다라마바사아1')).toBe('needs_letter_and_digit')
    expect(getPasswordViolation('abc12345')).toBeNull()
    expect(getPasswordViolation('Abcdefg1')).toBeNull()
  })

  it('maps violations to message keys', () => {
    expect(passwordViolationKey('too_short')).toBe('passwordTooShort')
    expect(passwordViolationKey('needs_letter_and_digit')).toBe(
      'passwordNeedsLetterAndDigit',
    )
    expect(passwordIssueMessageKey('mismatch')).toBe('passwordMismatch')
    expect(passwordIssueMessageKey('too_short')).toBe('passwordTooShort')
  })

  it('maps Supabase weak_password reasons without showing the raw message', () => {
    expect(
      weakPasswordMessageKey({ code: 'weak_password', reasons: ['length'] }),
    ).toBe('passwordTooShort')
    expect(
      weakPasswordMessageKey({
        name: 'AuthWeakPasswordError',
        reasons: ['characters'],
      }),
    ).toBe('passwordNeedsLetterAndDigit')
    expect(
      weakPasswordMessageKey({
        code: 'weak_password',
        reasons: ['length', 'characters'],
      }),
    ).toBe('passwordRequirements')
    expect(weakPasswordMessageKey({ code: 'weak_password', reasons: ['pwned'] })).toBe(
      'passwordRequirements',
    )
    expect(weakPasswordMessageKey({ code: 'weak_password' })).toBe('passwordRequirements')
    expect(weakPasswordMessageKey({ code: 'invalid_credentials' })).toBeNull()
  })

  it('states the rule in every locale', () => {
    for (const messages of [ko, en, es]) {
      expect(messages.auth.passwordRequirements.length).toBeGreaterThan(0)
      expect(messages.auth.errors.passwordTooShort.length).toBeGreaterThan(0)
      expect(messages.auth.errors.passwordNeedsLetterAndDigit.length).toBeGreaterThan(0)
      expect(messages.auth.errors.passwordRequirements.length).toBeGreaterThan(0)
    }
  })
})
