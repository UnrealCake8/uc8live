import { describe, expect, it } from 'vitest'
import { parseDirectoryData } from '@/components/LiveDirectory'

describe('live directory responses', () => {
  it('accepts a directory response', () => {
    const response = { live: [], replays: [] }

    expect(parseDirectoryData(response)).toEqual(response)
  })

  it.each([
    undefined,
    null,
    { error: 'Database unavailable' },
    { live: [] },
    { live: undefined, replays: [] },
  ])('rejects an invalid response instead of rendering it (%j)', (response) => {
    expect(parseDirectoryData(response)).toBeNull()
  })
})
