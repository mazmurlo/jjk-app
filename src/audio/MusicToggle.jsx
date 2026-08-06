import { useEffect, useState } from 'react'
import { FALLBACK_LABEL, TRACK_LABEL, armAutoResume, subscribe, toggle } from './music'

export default function MusicToggle() {
  const [{ playing, source }, setState] = useState({ playing: false, source: 'none' })

  useEffect(() => subscribe(setState), [])
  useEffect(armAutoResume, [])

  const label =
    source === 'track' ? TRACK_LABEL : source === 'chip' ? FALLBACK_LABEL : 'Music off'

  return (
    <button
      className={`music-toggle ${playing ? 'music-on' : ''}`}
      onClick={() => toggle()}
      title={
        playing
          ? `Playing: ${label}`
          : 'Play music — drop judas.mp3 in public/audio/ for the real track'
      }
      aria-pressed={playing}
    >
      <span className="music-icon" aria-hidden="true">
        {playing ? '♪' : '♪̸'}
      </span>
      <span className="music-label">{playing ? label : 'Music'}</span>
      {playing && (
        <span className="music-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </button>
  )
}
