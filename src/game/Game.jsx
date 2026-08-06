import { useState } from 'react'
import { ROSTER, STAGES } from './data'
import { createFighter, healTeam } from './engine'
import Battle from './Battle'
import TeamSelect from './TeamSelect'
import './game.css'

const UNLOCK_KEY = 'jjk.unlocked'

function loadUnlocked() {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_KEY)) ?? []
  } catch {
    return []
  }
}

export default function Game() {
  const [phase, setPhase] = useState('select')
  const [team, setTeam] = useState([])
  const [stageIndex, setStageIndex] = useState(0)
  const [unlocked, setUnlocked] = useState(loadUnlocked)
  const [justUnlocked, setJustUnlocked] = useState(false)

  function start(keys) {
    setTeam(keys.map((k) => createFighter(ROSTER.find((r) => r.key === k))))
    setStageIndex(0)
    setPhase('battle')
  }

  function handleWin(survivingTeam) {
    const next = stageIndex + 1
    if (next >= STAGES.length) {
      if (!unlocked.includes('gojo')) {
        const updated = [...unlocked, 'gojo']
        setUnlocked(updated)
        setJustUnlocked(true)
        try {
          localStorage.setItem(UNLOCK_KEY, JSON.stringify(updated))
        } catch {
          /* storage unavailable — unlock just won't persist */
        }
      }
      setPhase('victory')
      return
    }
    // Between stages the team is patched up and grows a little stronger.
    setTeam(healTeam(survivingTeam, 0.09))
    setStageIndex(next)
    setPhase('interlude')
  }

  function retry() {
    setPhase('select')
    setTeam([])
    setStageIndex(0)
  }

  if (phase === 'select') {
    return <TeamSelect unlocked={unlocked} onStart={start} />
  }

  if (phase === 'interlude') {
    const stage = STAGES[stageIndex]
    return (
      <div className="interlude">
        <p className="eyebrow">Between missions</p>
        <h2>Your team is patched up.</h2>
        <p className="menu-hint">
          Reverse cursed technique restores everyone to full HP and PP — and the fight left them
          slightly stronger.
        </p>
        <div className="interlude-team">
          {team.map((f) => (
            <span key={f.key} className="interlude-chip" style={{ '--accent': f.color }}>
              {f.name}
            </span>
          ))}
        </div>
        <div className="interlude-next">
          <p className="stage-title">{stage.title}</p>
          <p>{stage.blurb}</p>
        </div>
        <button className="action-btn primary" onClick={() => setPhase('battle')}>
          Move out
        </button>
      </div>
    )
  }

  if (phase === 'victory') {
    return (
      <div className="interlude">
        <p className="eyebrow">Gauntlet cleared</p>
        <h2>Sukuna falls.</h2>
        <p className="menu-hint">
          {STAGES.length} missions, no retreat. The King of Curses is sealed again — for now.
        </p>
        {justUnlocked && (
          <p className="unlock-note">
            🔓 Satoru Gojo is now selectable. Good luck losing with him.
          </p>
        )}
        <button className="action-btn primary" onClick={retry}>
          Run it again
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="stage-track">
        {STAGES.map((s, i) => (
          <span
            key={i}
            className={`track-pip ${i < stageIndex ? 'done' : ''} ${i === stageIndex ? 'current' : ''}`}
          />
        ))}
      </div>
      <Battle
        key={stageIndex}
        team={team}
        stage={STAGES[stageIndex]}
        onWin={handleWin}
        onLose={retry}
      />
    </>
  )
}
