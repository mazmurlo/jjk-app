import { useState } from 'react'
import { ROSTER, TYPE_COLORS } from './data'
import { portraitFor } from '../assets/characters'

const TEAM_SIZE = 3

export default function TeamSelect({ unlocked, onStart }) {
  const [picked, setPicked] = useState([])

  const available = ROSTER.filter((r) => !r.locked || unlocked.includes(r.key))
  const locked = ROSTER.filter((r) => r.locked && !unlocked.includes(r.key))

  function toggle(key) {
    setPicked((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length < TEAM_SIZE
          ? [...prev, key]
          : prev,
    )
  }

  return (
    <div className="select">
      <div className="select-head">
        <h2>Assemble your team</h2>
        <p className="menu-hint">
          Pick {TEAM_SIZE} sorcerers for the gauntlet. Types beat each other in a wheel:
          Physical → Technique → Domain → Cursed → Spirit → Physical.
        </p>
      </div>

      <div className="select-grid">
        {available.map((r) => {
          const on = picked.includes(r.key)
          return (
            <button
              key={r.key}
              className={`select-card ${on ? 'selected' : ''}`}
              style={{ '--accent': r.color }}
              onClick={() => toggle(r.key)}
            >
              {portraitFor(r.key) && (
                <img className="select-portrait" src={portraitFor(r.key)} alt="" loading="lazy" />
              )}
              <div className="select-kana">{r.kana}</div>
              <h3>{r.name}</h3>
              <div className="nameplate-types">
                {r.types.map((t) => (
                  <span key={t} className="type-badge" style={{ background: TYPE_COLORS[t] }}>
                    {t}
                  </span>
                ))}
              </div>
              <ul className="select-stats">
                <li>
                  HP <b>{r.stats.hp}</b>
                </li>
                <li>
                  ATK <b>{r.stats.atk}</b>
                </li>
                <li>
                  DEF <b>{r.stats.def}</b>
                </li>
                <li>
                  SPD <b>{r.stats.spd}</b>
                </li>
              </ul>
              <p className="select-domain">領域 {r.domain.name}</p>
              {on && <span className="select-check">✓</span>}
            </button>
          )
        })}

        {locked.map((r) => (
          <div key={r.key} className="select-card locked">
            <div className="select-kana">???</div>
            <h3>Locked</h3>
            <p className="menu-hint">Clear the gauntlet once to unlock.</p>
          </div>
        ))}
      </div>

      <div className="select-footer">
        <span>
          {picked.length} / {TEAM_SIZE} selected
        </span>
        <button
          className="action-btn primary"
          disabled={picked.length !== TEAM_SIZE}
          onClick={() => onStart(picked)}
        >
          Begin the gauntlet
        </button>
      </div>
    </div>
  )
}
