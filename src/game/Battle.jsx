import { useEffect, useState } from 'react'
import { createBattle, createFighter, resolveTurn, switchInPlayer } from './engine'
import BattleView from './BattleView'

/** Single-player battle against the AI. */
export default function Battle({ team, stage, onWin, onLose }) {
  const [battle, setBattle] = useState(() =>
    createBattle(team, stage.team.map((e) => createFighter(e, stage.boost)), stage),
  )
  const [queue, setQueue] = useState([])
  const [message, setMessage] = useState(stage.blurb)
  const [fx, setFx] = useState(null)

  const busy = queue.length > 0

  useEffect(() => {
    if (!queue.length) return
    const [head, ...rest] = queue
    setBattle(head.state)
    setFx(head.fx)
    if (head.message) setMessage(head.message)
    const timer = setTimeout(() => setQueue(rest), head.message ? 950 : 220)
    return () => clearTimeout(timer)
  }, [queue])

  const footer = (
    <>
      {battle.phase === 'win' && !busy && (
        <div className="menu-panel result">
          <p>Threat neutralized.</p>
          <button className="action-btn primary" onClick={() => onWin(battle.playerTeam)}>
            Continue
          </button>
        </div>
      )}

      {battle.phase === 'lose' && !busy && (
        <div className="menu-panel result">
          <p>Your team is wiped out.</p>
          <button className="action-btn primary" onClick={onLose}>
            Try again
          </button>
        </div>
      )}

      {battle.phase === 'forceSwitch' && !busy && (
        <div className="menu-panel">
          <p className="menu-hint">Send out your next sorcerer.</p>
          <div className="switch-grid">
            {battle.playerTeam.map((f, i) => (
              <button
                key={i}
                className="switch-btn"
                disabled={f.fainted}
                style={{ '--accent': f.color }}
                onClick={() => setQueue(switchInPlayer(battle, i))}
              >
                <span className="switch-name">{f.name}</span>
                <span className="switch-hp">{f.fainted ? 'down' : `${f.hp}/${f.maxHp}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <BattleView
      state={battle}
      perspective="player"
      message={message}
      fx={fx}
      canAct={!busy && battle.phase === 'choose'}
      onAction={(action) => setQueue(resolveTurn(battle, action))}
      title={stage.title}
      footer={footer}
    />
  )
}
