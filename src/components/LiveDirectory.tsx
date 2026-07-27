import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Radio, RefreshCw, VideoOff } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

type Channel = {
  slug: string
  title: string
  category: string
  thumbnail_url: string | null
  mux_stream_status: string
}

type Replay = {
  id: string
  title: string
  mux_playback_id: string | null
  ended_at: string | null
}

export type DirectoryData = { live: Channel[]; replays: Replay[] }

export function parseDirectoryData(value: unknown): DirectoryData | null {
  if (!value || typeof value !== 'object') return null
  const { live, replays } = value as Record<string, unknown>
  return Array.isArray(live) && Array.isArray(replays) ? { live, replays } : null
}

export function LiveDirectory() {
  const [data, setData] = useState<DirectoryData | null>(null)
  const [error, setError] = useState(false)
  const [request, setRequest] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setError(false)

    fetch('/api/channels', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Directory request failed')
        const directory = parseDirectoryData(await response.json())
        if (!directory) throw new Error('Invalid directory response')
        return directory
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(true)
      })

    return () => controller.abort()
  }, [request])

  if (error) {
    return (
      <div className="empty">
        <VideoOff />
        <h2>Live broadcasts could not be loaded</h2>
        <p>Please try again in a moment.</p>
        <button className="secondary" onClick={() => setRequest((value) => value + 1)}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className="grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
  }

  return <>
    <section className="sectionHead">
      <div><span className="eyebrow"><Radio size={14} /> LIVE NOW</span><h1>What’s broadcasting</h1></div>
    </section>
    {data.live.length ? <div className="grid">{data.live.map((channel) =>
      <Link to="/live/$channelSlug" params={{ channelSlug: channel.slug }} className="streamCard" key={channel.slug}>
        <div className="thumb" style={channel.thumbnail_url ? { backgroundImage: `url(${channel.thumbnail_url})` } : undefined}><StatusBadge status="live" /></div>
        <div><h3>{channel.title}</h3><p>{channel.category}</p></div>
      </Link>)}</div> : <div className="empty"><VideoOff /><h2>Nobody is live right now</h2><p>Check back soon, or explore recent broadcasts below.</p></div>}
    <section className="sectionHead compact">
      <div><span className="eyebrow">RECENT BROADCASTS</span><h2>Watch the replay</h2></div>
    </section>
    {data.replays.length ? <div className="replayList">{data.replays.map((replay) =>
      <article key={replay.id}><div className="miniThumb">REPLAY</div><div><b>{replay.title}</b><p>{replay.ended_at ? new Date(replay.ended_at).toLocaleDateString() : ''}</p></div></article>)}</div> : <p className="muted">No public replays yet.</p>}
  </>
}
