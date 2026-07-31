import { describe, expect, it } from 'vitest'
import { profileInitials } from '@/lib/profile/avatar'

describe('profileInitials', () => {
  it('builds initials from the first two name parts', () => {
    expect(profileInitials('Bernabé Sanghoon Jung')).toBe('BS')
  })

  it('returns a placeholder when the name is empty', () => {
    expect(profileInitials(null)).toBe('?')
    expect(profileInitials('   ')).toBe('?')
  })
})
