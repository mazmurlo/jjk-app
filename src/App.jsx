import { useState } from 'react'
import Registry from './Registry'
import Game from './game/Game'
import Online from './game/Online'
import './App.css'

const TABS = [
  { key: 'battle', label: 'Gauntlet' },
  { key: 'online', label: 'Versus' },
  { key: 'registry', label: 'Registry' },
]

const SUBTITLES = {
  battle: 'Five missions. Three sorcerers. One Domain Expansion each.',
  online: 'Play a friend, browser to browser.',
  registry: 'A sorcerer registry — 12 entries on file.',
}

export default function App() {
  const [tab, setTab] = useState('battle')

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">呪術廻戦</p>
        <h1>Jujutsu Kaisen</h1>
        <p className="subtitle">{SUBTITLES[tab]}</p>
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
      </footer>
    </div>
  )
}
