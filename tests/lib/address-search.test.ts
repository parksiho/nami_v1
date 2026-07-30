import { describe, expect, it } from 'vitest'
import { searchAddresses } from '@/lib/address/search'

describe('searchAddresses', () => {
  it('matches addresses case-insensitively while preserving corpus order', () => {
    expect(
      searchAddresses('seoul', [
        'Seoul Gangnam',
        'Busan',
        'seoul jongno',
      ]),
    ).toEqual(['Seoul Gangnam', 'seoul jongno'])
  })

  it('trims the keyword and returns at most ten matches', () => {
    const corpus = Array.from({ length: 12 }, (_, index) => `Address ${index}`)

    expect(searchAddresses(' address ', corpus)).toEqual(corpus.slice(0, 10))
  })

  it('returns no suggestions for a blank keyword', () => {
    expect(searchAddresses('   ', ['Seoul Gangnam'])).toEqual([])
  })
})
