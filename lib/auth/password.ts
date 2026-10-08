/** Matches Supabase Auth `letters_digits`: ASCII letter and ASCII digit. */
const LETTER = /[A-Za-z]/
const DIGIT = /[0-9]/

export const MIN_PASSWORD_LENGTH = 8

export type PasswordViolation = 'too_short' | 'needs_letter_and_digit'

export type PasswordMessageKey =
  | 'passwordTooShort'
  | 'passwordNeedsLetterAndDigit'
  | 'passwordRequirements'

type WeakPasswordErrorLike = {
  code?: string | null
  name?: string
  reasons?: readonly string[] | null
}

export function getPasswordViolation(password: string): PasswordViolation | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'too_short'
  if (!LETTER.test(password) || !DIGIT.test(password)) return 'needs_letter_and_digit'
  return null
}

export function passwordViolationKey(violation: PasswordViolation): PasswordMessageKey {
  return violation === 'too_short' ? 'passwordTooShort' : 'passwordNeedsLetterAndDigit'
}

export function passwordIssueMessageKey(
  issue: 'mismatch' | PasswordViolation,
): 'passwordMismatch' | PasswordMessageKey {
  if (issue === 'mismatch') return 'passwordMismatch'
  return passwordViolationKey(issue)
}

export function confirmedPasswordIssue(
  password: string,
  confirmPassword: string,
): 'mismatch' | PasswordViolation | null {
  if (password !== confirmPassword) return 'mismatch'
  return getPasswordViolation(password)
}

/**
 * Maps GoTrue's `weak_password` error (signup, password update, admin create)
 * onto a localized message key. Sign-in does not reject on this error.
 */
export function weakPasswordMessageKey(error: WeakPasswordErrorLike): PasswordMessageKey | null {
  const weak = error.code === 'weak_password' || error.name === 'AuthWeakPasswordError'
  if (!weak) return null

  const reasons = Array.isArray(error.reasons) ? error.reasons : []
  const length = reasons.includes('length')
  const characters = reasons.includes('characters')
  if (length && !characters) return 'passwordTooShort'
  if (characters && !length) return 'passwordNeedsLetterAndDigit'
  return 'passwordRequirements'
}
