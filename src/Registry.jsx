import { useMemo, useState } from 'react'
import { characters, grades, affiliations } from './characters'

const statLabels = {
  power: 'Power',
  technique: 'Technique',
  speed: 'Speed',
  wits: 'Wits',
}

function StatBar({ label, value, color }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function CharacterCard({ character, onSelect }) {
  return (
    <button className="card" style={{ '--accent': character.color }} onClick={() => onSelect(character)}>
      <div className="card-glow" />
      <div className="card-kana">{character.kana}</div>
      <h3 className="card-name">{character.name}</h3>
      <p className="card-technique">{character.technique}</p>
      <div className="card-tags">
        <span className="tag tag-grade">{character.grade}</span>
        <span className="tag">{character.affiliation}</span>
      </div>
    </button>
  )
}

function CharacterModal({ character, onClose }) {
  if (!character) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ '--accent': character.color }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="modal-kana">{character.kana}</div>
        <h2>{character.name}</h2>
        <div className="card-tags">
          <span className="tag tag-grade">{character.grade}</span>
          <span className="tag">{character.affiliation}</span>
        </div>

        <blockquote>&ldquo;{character.quote}&rdquo;</blockquote>
        <p className="modal-bio">{character.bio}</p>

        <dl className="modal-meta">
          <div>
            <dt>Cursed Technique</dt>
            <dd>{character.technique}</dd>
          </div>
          <div>
            <dt>Domain Expansion</dt>
            <dd>{character.domain}</dd>
          </div>
        </dl>

        <div className="stats">
          {Object.entries(character.stats).map(([key, value]) => (
            <StatBar key={key} label={statLabels[key]} value={value} color={character.color} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Registry() {
  const [query, setQuery] = useState('')
  const [grade, setGrade] = useState('All')
  const [affiliation, setAffiliation] = useState('All')
  const [selected, setSelected] = useState(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return characters.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.technique.toLowerCase().includes(q) ||
        c.kana.includes(query.trim())
      const matchesGrade = grade === 'All' || c.grade === grade
      const matchesAffiliation = affiliation === 'All' || c.affiliation === affiliation
      return matchesQuery && matchesGrade && matchesAffiliation
    })
  }, [query, grade, affiliation])

  return (
    <>
      <div className="controls">
        <input
          className="search"
          type="search"
          placeholder="Search by name or cursed technique…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="filter-row">
          <span className="filter-label">Grade</span>
          {grades.map((g) => (
            <button
              key={g}
              className={`chip ${grade === g ? 'chip-active' : ''}`}
              onClick={() => setGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <span className="filter-label">Affiliation</span>
          {affiliations.map((a) => (
            <button
              key={a}
              className={`chip ${affiliation === a ? 'chip-active' : ''}`}
              onClick={() => setAffiliation(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">No sorcerers match that search.</p>
      ) : (
        <div className="grid">
          {visible.map((c) => (
            <CharacterCard key={c.id} character={c} onSelect={setSelected} />
          ))}
        </div>
      )}

      <CharacterModal character={selected} onClose={() => setSelected(null)} />
    </>
  )
}
