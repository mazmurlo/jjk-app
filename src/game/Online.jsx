import { useCallback, useEffect, useRef, useState } from 'react'
import { ROSTER } from './data'
import { createBattle, createFighter, resolveTurn } from './engine'
import { createConnection, makeRoomCode, normalizeCode } from '../net/connection'
import BattleView from './BattleView'
import TeamSelect from './TeamSelect'
import './game.css'

/* Versus play uses a neutral arena instead of the gauntlet's scripted stages. */
const ARENA = { title: 'Versus — Jujutsu High training ground', blurb: 'Cursed energy fills the arena.' }

/* Both players get the whole roster, Gojo included, so neither side is gated by
 * single-player progress. */
const ALL_UNLOCKED = ROSTER.filter((r) => r.locked).map((r) => r.key)

const buildTeam = (keys) => keys.map((k) => createFighter(ROSTER.find((r) => r.key === k)))

export default function Online() {
  const [step, setStep] = useState('menu')
  const [role, setRole] = useState(null)
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [handle, setHandle] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const [battle, setBattle] = useState(null)
  const [queue, setQueue] = useState([])
  const [message, setMessage] = useState(ARENA.blurb)
  const [fx, setFx] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [names, setNames] = useState({ host: 'Host', guest: 'Guest' })

  const connRef = useRef(null)
  const myKeysRef = useRef([])
  const guestKeysRef = useRef([])
  // Actions for the turn being assembled. Refs, not state, so the two arrivals
  // (local click and remote message) always see each other.
  const pendingRef = useRef({ host: null, guest: null })
  const battleRef = useRef(null)
  const roleRef = useRef(null)

  battleRef.current = battle
  roleRef.current = role

  const busy = queue.length > 0
  const perspective = role === 'host' ? 'player' : 'enemy'

  useEffect(() => () => connRef.current?.destroy(), [])

  /* ---------- frame playback (identical on both sides) ---------- */

  useEffect(() => {
    if (!queue.length) return
    const [head, ...rest] = queue
    setBattle(head.state)
    setFx(head.fx)
    if (head.message) setMessage(head.message)
    const timer = setTimeout(() => setQueue(rest), head.message ? 950 : 220)
    return () => clearTimeout(timer)
  }, [queue])

  /* ---------- host: resolve once both actions are in ---------- */

  const tryResolve = useCallback(() => {
    const { host: hostAction, guest: guestAction } = pendingRef.current
    const current = battleRef.current
    if (!hostAction || !guestAction || !current) return

    pendingRef.current = { host: null, guest: null }
    const frames = resolveTurn(current, hostAction, Math.random, {
      enemyAction: guestAction,
      autoReplace: true,
    })
    connRef.current?.send({ t: 'frames', frames })
    setSubmitted(false)
    setQueue(frames)
  }, [])

  /* ---------- message handling ---------- */

  const handleData = useCallback(
    (msg) => {
      if (msg.t === 'hello') {
        // Host side: the guest has picked a team, so the match can start.
        guestKeysRef.current = msg.keys
        const nextNames = { host: names.host, guest: msg.name || 'Guest' }
        setNames(nextNames)
        const state = createBattle(buildTeam(myKeysRef.current), buildTeam(msg.keys), ARENA)
        setBattle(state)
        setStep('battle')
        setMessage(ARENA.blurb)
        connRef.current?.send({ t: 'init', state, names: nextNames })
      } else if (msg.t === 'init') {
        setNames(msg.names)
        setBattle(msg.state)
        setStep('battle')
        setMessage(ARENA.blurb)
        setSubmitted(false)
      } else if (msg.t === 'action') {
        pendingRef.current.guest = msg.action
        tryResolve()
      } else if (msg.t === 'frames') {
        setSubmitted(false)
        setQueue(msg.frames)
      } else if (msg.t === 'rematch') {
        setNames(msg.names)
        setBattle(msg.state)
        setMessage('Rematch — cursed energy fills the arena.')
        setSubmitted(false)
        setQueue([])
      }
    },
    [names.host, tryResolve],
  )

  /* ---------- connection setup ---------- */

  // The connection captures its callbacks once, so route messages through a ref
  // that every render refreshes — otherwise late messages hit a stale closure.
  const handlerRef = useRef(handleData)
  handlerRef.current = handleData

  function connect(nextRole, roomCode, keys) {
    myKeysRef.current = keys
    const myName = handle.trim() || (nextRole === 'host' ? 'Host' : 'Guest')
    setNames((n) => ({ ...n, [nextRole]: myName }))

    connRef.current = createConnection({
      role: nextRole,
      code: roomCode,
      onStatus: (s) => {
        setStatus(s)
        if (s === 'connected' && nextRole === 'guest') {
          connRef.current?.send({ t: 'hello', keys, name: myName })
        }
      },
      onData: (msg) => handlerRef.current(msg),
      onError: (m) => {
        setError(m)
        setStatus('error')
      },
    })
  }

  function startAsHost(keys) {
    setStep('lobby')
    setStatus('connecting')
    connect('host', code, keys)
  }

  function startAsGuest(keys) {
    setStep('lobby')
    setStatus('connecting')
    connect('guest', joinCode, keys)
  }

  /* ---------- actions ---------- */

  function submitAction(action) {
    if (role === 'host') {
      pendingRef.current.host = action
      setSubmitted(true)
      tryResolve()
    } else {
      connRef.current?.send({ t: 'action', action })
      setSubmitted(true)
    }
  }

  function rematch() {
    const state = createBattle(
      buildTeam(myKeysRef.current),
      buildTeam(guestKeysRef.current),
      ARENA,
    )
    pendingRef.current = { host: null, guest: null }
    setBattle(state)
    setMessage('Rematch — cursed energy fills the arena.')
    setSubmitted(false)
    setQueue([])
    connRef.current?.send({ t: 'rematch', state, names })
  }

  function leave() {
    connRef.current?.destroy()
    connRef.current = null
    pendingRef.current = { host: null, guest: null }
    setStep('menu')
    setRole(null)
    setBattle(null)
    setQueue([])
    setStatus('idle')
    setError(null)
    setSubmitted(false)
  }

  /* ---------- screens ---------- */

  if (step === 'menu') {
    return (
      <div className="online-menu">
        <h2>Play a friend</h2>
        <p className="menu-hint">
          One of you creates a room and reads out the code; the other joins it. The connection is
          browser-to-browser — nothing about your match touches a server.
        </p>

        <label className="field-label">
          Your handle
          <input
            className="search"
            value={handle}
            maxLength={20}
            placeholder="e.g. derbi_21"
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>

        <div className="online-actions">
          <button
            className="action-btn primary"
            onClick={() => {
              setRole('host')
              setCode(makeRoomCode())
              setStep('team')
            }}
          >
            Create a room
          </button>

          <div className="join-row">
            <input
              className="search code-input"
              value={joinCode}
              placeholder="CODE"
              onChange={(e) => setJoinCode(normalizeCode(e.target.value))}
            />
            <button
              className="action-btn"
              disabled={joinCode.length !== 5}
              onClick={() => {
                setRole('guest')
                setStep('team')
              }}
            >
              Join room
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'team') {
    return (
      <>
        {role === 'host' && (
          <div className="room-banner">
            Room code <strong className="room-code">{code}</strong> — pick your team, then share it.
          </div>
        )}
        <TeamSelect
          unlocked={ALL_UNLOCKED}
          onStart={role === 'host' ? startAsHost : startAsGuest}
        />
      </>
    )
  }

  if (step === 'lobby') {
    return (
      <div className="online-menu">
        {role === 'host' ? (
          <>
            <h2>Waiting for your opponent</h2>
            <p className="menu-hint">Give them this code:</p>
            <p className="room-code big">{code}</p>
          </>
        ) : (
          <>
            <h2>Joining room {joinCode}</h2>
            <p className="menu-hint">Connecting…</p>
          </>
        )}
        <p className={`net-status net-${status}`}>
          {error ??
            { connecting: 'Contacting the matchmaking server…', waiting: 'Room is open.', connected: 'Opponent found — starting…', closed: 'Connection closed.' }[status] ??
            status}
        </p>
        <button className="action-btn" onClick={leave}>
          Cancel
        </button>
      </div>
    )
  }

  /* ---------- battle ---------- */

  const phase = battle.phase
  const decided = phase === 'win' || phase === 'lose'
  const iWon = perspective === 'player' ? phase === 'win' : phase === 'lose'
  const disconnected = status === 'closed'

  const footer = (
    <>
      {disconnected && (
        <div className="menu-panel result">
          <p>Your opponent disconnected.</p>
          <button className="action-btn primary" onClick={leave}>
            Back to lobby
          </button>
        </div>
      )}

      {decided && !busy && !disconnected && (
        <div className="menu-panel result">
          <p>{iWon ? 'You win.' : 'You lose.'}</p>
          <div className="main-menu">
            {role === 'host' && (
              <button className="action-btn primary" onClick={rematch}>
                Rematch
              </button>
            )}
            <button className="action-btn" onClick={leave}>
              Leave
            </button>
          </div>
          {role === 'guest' && <p className="menu-hint">Waiting for the host to start a rematch.</p>}
        </div>
      )}

      {submitted && !busy && !decided && !disconnected && (
        <div className="menu-panel">
          <p className="menu-hint">Order locked in — waiting for your opponent…</p>
        </div>
      )}
    </>
  )

  return (
    <BattleView
      state={battle}
      perspective={perspective}
      message={message}
      fx={fx}
      canAct={!busy && !submitted && !decided && !disconnected && phase === 'choose'}
      onAction={submitAction}
      title={`${ARENA.title} · room ${role === 'host' ? code : joinCode}`}
      labels={{
        me: `YOU · ${role === 'host' ? names.host : names.guest}`,
        foe: role === 'host' ? names.guest : names.host,
      }}
      footer={footer}
    />
  )
}
