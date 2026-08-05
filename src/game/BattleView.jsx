import { useMemo, useState } from 'react'
import { TYPE_COLORS } from './data'
import { effectiveness } from './engine'
import { portraitFor } from '../assets/characters'

const hpClass = (pct) => (pct > 0.5 ? 'hp-ok' : pct > 0.2 ? 'hp-warn' : 'hp-low')
const otherSide = (side) => (side === 'player' ? 'enemy' : 'player')

export function TypeBadge({ type }) {
  return (
    <span className="type-badge" style={{ background: TYPE_COLORS[type] }}>
      {type}
    </span>
  )
}

function Sprite({ fighter, side, fx }) {
  const hit = fx?.target === side && ['hit', 'crit'].includes(fx.kind)
  const domain = fx?.target === side && fx.kind === 'domain'
  const portrait = portraitFor(fighter.key)
  return (
    <div
      className={`sprite ${fighter.fainted ? 'fainted' : ''} ${hit ? 'shake' : ''} ${
        domain ? 'domain-flare' : ''
      }`}
      style={{ '--accent': fighter.color }}
    >
      {portrait ? (
        <img className="sprite-img" src={portrait} alt={fighter.name} loading="lazy" />
      ) : (
        <span className="sprite-kana">{fighter.kana}</span>
      )}
    </div>
  )
}

function Nameplate({ fighter, label, owner }) {
  const pct = fighter.hp / fighter.maxHp
  return (
    <div className={`nameplate plate-${owner}`}>
      <div className="nameplate-top">
        <strong>{fighter.name}</strong>
        <span className="nameplate-types">
          {fighter.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </span>
      </div>

      <div className="hp-track">
        <div className={`hp-fill ${hpClass(pct)}`} style={{ width: `${pct * 100}%` }} />
      </div>

      <div className="nameplate-bottom">
        <span className="hp-text">
          {fighter.hp} / {fighter.maxHp}
        </span>
        {fighter.status && (
          <span className={`status-badge status-${fighter.status}`}>{fighter.status}</span>
        )}
      </div>

      {fighter.domain && (
        <div className="ce-row" title="Cursed energy — fills to unlock your Domain Expansion">
          <span className="ce-label">CE</span>
          <div className="ce-track">
            <div
              className={`ce-fill ${fighter.ce >= 100 && !fighter.domain.used ? 'ce-ready' : ''}`}
              style={{ width: `${fighter.ce}%` }}
            />
          </div>
        </div>
      )}
      <span className={`plate-label label-${owner}`}>{label}</span>
    </div>
  )
}

/**
 * The battle screen, drawn from one side's point of view. `perspective` picks
 * which team is "yours" — the AI game always passes 'player', while the guest in
 * a versus match passes 'enemy' and sees the mirror image of the host's screen.
 */
export default function BattleView({
  state,
  perspective = 'player',
  message,
  fx,
  canAct,
  onAction,
  title,
  labels = {},
  footer,
}) {
  const [menu, setMenu] = useState('main')

  const meSide = perspective
  const foeSide = otherSide(perspective)
  const myTeam = meSide === 'player' ? state.playerTeam : state.enemyTeam
  const foeTeam = foeSide === 'player' ? state.playerTeam : state.enemyTeam
  const myActive = meSide === 'player' ? state.playerActive : state.enemyActive
  const foeActive = foeSide === 'player' ? state.playerActive : state.enemyActive

  const me = myTeam[myActive]
  const foe = foeTeam[foeActive]

  const moveHints = useMemo(
    () => me.moves.map((m) => (m.category === 'status' ? 1 : effectiveness(m.type, foe.types))),
    [me, foe],
  )

  function act(action) {
    if (!canAct) return
    setMenu('main')
    onAction(action)
  }

  const domainReady = me.domain && !me.domain.used && me.ce >= 100

  return (
    <div className="battle">
      <div className="battle-stage">
        <p className="stage-title">{title}</p>

        {/* Both rows keep the same plate-then-sprite order, so each row reads as
            one fighter. A mirrored layout put the opponent's plate directly above
            your own sprite, which made the two look swapped. */}
        <div className="field field-enemy">
          <Nameplate fighter={foe} label={labels.foe ?? 'OPPONENT'} owner="foe" />
          <Sprite fighter={foe} side={foeSide} fx={fx} />
        </div>

        <div className="field field-player">
          <Nameplate fighter={me} label={labels.me ?? 'YOU'} owner="me" />
          <Sprite fighter={me} side={meSide} fx={fx} />
        </div>

        <div className="enemy-dots">
          {foeTeam.map((f, i) => (
            <span key={i} className={`dot ${f.fainted ? 'dot-out' : ''}`} title={f.name} />
          ))}
        </div>
      </div>

      <div className="message-box">{message}</div>

      {footer}

      {canAct && menu === 'main' && (
        <div className="menu-panel main-menu">
          <button className="action-btn primary" onClick={() => setMenu('moves')}>
            Fight
          </button>
          <button
            className={`action-btn domain-btn ${domainReady ? 'ready' : ''}`}
            disabled={!domainReady}
            onClick={() => act({ kind: 'domain' })}
          >
            {me.domain
              ? domainReady
                ? `領域展開 · ${me.domain.name}`
                : me.domain.used
                  ? 'Domain spent'
                  : `Domain ${me.ce}%`
              : 'No domain'}
          </button>
          <button className="action-btn" onClick={() => setMenu('switch')}>
            Switch
          </button>
        </div>
      )}

      {canAct && menu === 'moves' && (
        <div className="menu-panel">
          <div className="move-grid">
            {me.moves.map((m, i) => (
              <button
                key={m.name}
                className="move-btn"
                disabled={m.pp <= 0}
                style={{ '--accent': TYPE_COLORS[m.type] }}
                onClick={() => act({ kind: 'move', index: i })}
              >
                <span className="move-name">{m.name}</span>
                <span className="move-meta">
                  <TypeBadge type={m.type} />
                  <span className="move-pp">
                    {m.pp}/{m.maxPp}
                  </span>
                </span>
                <span className="move-sub">
                  {m.category === 'status' ? 'status' : `power ${m.power} · acc ${m.acc}`}
                  {moveHints[i] > 1 && <em className="hint-good"> ×{moveHints[i]}</em>}
                  {moveHints[i] < 1 && <em className="hint-bad"> ×{moveHints[i]}</em>}
                </span>
              </button>
            ))}
          </div>
          <button className="action-btn back" onClick={() => setMenu('main')}>
            Back
          </button>
        </div>
      )}

      {canAct && menu === 'switch' && (
        <div className="menu-panel">
          <div className="switch-grid">
            {myTeam.map((f, i) => (
              <button
                key={i}
                className="switch-btn"
                disabled={f.fainted || i === myActive}
                style={{ '--accent': f.color }}
                onClick={() => act({ kind: 'switch', index: i })}
              >
                <span className="switch-name">{f.name}</span>
                <span className="switch-hp">
                  {f.fainted ? 'down' : i === myActive ? 'active' : `${f.hp}/${f.maxHp}`}
                </span>
              </button>
            ))}
          </div>
          <button className="action-btn back" onClick={() => setMenu('main')}>
            Back
          </button>
        </div>
      )}
    </div>
  )
}
