import { useEffect, useState } from 'react'
import { armAutoResume, loadFile, subscribe, toggle } from './music'

export default function MusicToggle() {
  const [{ playing, label }, setState] = useState({ playing: false, label: 'Music off' })

  useEffect(() => subscribe(setState), [])
  useEffect(armAutoResume, [])

  return (
    <div className="music-row">
      <button
        className={`music-toggle ${playing ? 'music-on' : ''}`}
        onClick={() => toggle()}
        title={playing ? `Playing: ${label}` : 'Play music'}
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

      <label
        className="music-load"
        title="Play an audio file from this device. It stays in your browser — nothing is uploaded, and nothing is sent to your opponent."
      >
        <input
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) loadFile(file)
            e.target.value = ''
          }}
        />
        Load a track
      </label>
    </div>
  )
}
