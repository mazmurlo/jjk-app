import { useState } from 'react'
import { ENEMIES, ROSTER, TYPE_COLORS } from './data'
import { portraitFor } from '../assets/characters'

const TEAM_SIZE = 3
const CURSE_KEYS = new Set(ENEMIES.map((e) => e.key))

export default function TeamSelect({
  unlocked,
  onStart,
  pool = ROSTER,
  hint,
  cta = 'Begin the gauntlet',
}) {
  const [picked, setPicked] = useState([])

  const available = pool.filter((r) => !r.locked || unlocked.includes(r.key))
  const locked = pool.filter((r) => r.locked && !unlocked.includes(r.key))

  // Versus opens the curse side up too, so split the grid in two when it's there.
  const sections = [
    { label: 'Sorcerers', entries: available.filter((r) => !CURSE_KEYS.has(r.key)) },
    { label: 'Curses & curse users', entries: available.filter((r) => CURSE_KEYS.has(r.key)) },
  ].filter((s) => s.entries.length)
  const showLabels = sections.length > 1

  function toggle(key) {
    setPicked((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length < TEAM_SIZE
          ? [...prev, key]
          : prev,
    )
  }

  function card(r) {
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
        {r.domain ? (
          <p className="select-domain">領域 {r.domain.name}</p>
        ) : (
          <p className="select-domain no-domain">no domain — raw physicality</p>
        )}
        {on && <span className="select-check">✓</span>}
      </button>
    )
  }

  return (
    <div className="select">
      <div className="select-head">
        <h2>Assemble your team</h2>
        <p className="menu-hint">
          {hint ?? (
            <>
              Pick {TEAM_SIZE} sorcerers for the gauntlet. Types beat each other in a wheel:
              Physical → Technique → Domain → Cursed → Spirit → Physical.
            </>
          )}
        </p>
      </div>

      {sections.map((s) => (
        <section key={s.label} className="select-section">
          {showLabels && <h3 className="select-section-label">{s.label}</h3>}
          <div className="select-grid">{s.entries.map(card)}</div>
        </section>
      ))}

      {locked.length > 0 && (
        <div className="select-grid select-section">
          {locked.map((r) => (
            <div key={r.key} className="select-card locked">
              <div className="select-kana">???</div>
              <h3>Locked</h3>
              <p className="menu-hint">Clear the gauntlet once to unlock.</p>
            </div>
          ))}
        </div>
      )}

      <div className="select-footer">
        <span>
          {picked.length} / {TEAM_SIZE} selected
        </span>
        <button
          className="action-btn primary"
          disabled={picked.length !== TEAM_SIZE}
          onClick={() => onStart(picked)}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}
