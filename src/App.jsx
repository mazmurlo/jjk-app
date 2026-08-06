import { useState } from 'react'
import Registry from './Registry'
import Game from './game/Game'
import Online from './game/Online'
import MusicToggle from './audio/MusicToggle'
import { characters } from './characters'
import { STAGES } from './game/data'
import './App.css'

const TABS = [
  { key: 'battle', label: 'Gauntlet' },
  { key: 'online', label: 'Versus' },
  { key: 'registry', label: 'Registry' },
]

const SUBTITLES = {
  battle: `${STAGES.length} missions. Three sorcerers. One Domain Expansion each.`,
  online: 'Play a friend, browser to browser — curses included.',
  registry: `A sorcerer registry — ${characters.length} entries on file.`,
}

export default function App() {
  const [tab, setTab] = useState('battle')

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">呪術廻戦</p>
        <h1>Jujutsu Kaisen</h1>
        <p className="subtitle">{SUBTITLES[tab]}</p>
        <MusicToggle />
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'battle' && <Game />}
      {tab === 'online' && <Online />}
      {tab === 'registry' && <Registry />}

      <footer className="footer">
        Fan-made demo. Jujutsu Kaisen is created by Gege Akutami.
        <br />
        Character art from the{' '}
        <a
          href="https://jujutsu-kaisen.fandom.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Jujutsu Kaisen Wiki
        </a>
        , © Shueisha / MAPPA — used non-commercially.
      </footer>
    </div>
  )
}
