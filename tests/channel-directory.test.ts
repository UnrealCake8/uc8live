import { describe, expect, it } from 'vitest'
import { isLiveDirectoryChannel } from '@/server/channels/channel-service'

describe('channel directory eligibility', () => {
  it('includes a live channel regardless of a stale enabled flag', () => {
    expect(isLiveDirectoryChannel({ mux_stream_status: 'live', is_enabled: false })).toBe(true)
  })

  it.each(['offline', 'connecting', 'reconnecting', 'disabled', 'error'])(
    'excludes a channel whose stream status is %s',
    (mux_stream_status) => {
      expect(isLiveDirectoryChannel({ mux_stream_status })).toBe(false)
    },
  )
})
