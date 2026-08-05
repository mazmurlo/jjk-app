import Peer from 'peerjs'

/* Room codes become PeerJS ids, so they share a global namespace with every
 * other app on the public broker. The prefix keeps a 5-character code ours. */
const PREFIX = 'jjk-kaisen-v1-'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/* Set VITE_RELAY_URL to a deployed server/index.js to route matches through it.
 * Without it the client falls back to direct peer-to-peer. */
const RELAY_URL = import.meta.env.VITE_RELAY_URL

export const TRANSPORT = RELAY_URL ? 'relay' : 'p2p'

export function makeRoomCode() {
  return Array.from(
    { length: 5 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join('')
}

export function normalizeCode(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

const FRIENDLY_ERRORS = {
  'unavailable-id': 'That room code is already in use. Try creating a new room.',
  'peer-unavailable': 'No room with that code. Check the code and try again.',
  'browser-incompatible': 'This browser does not support peer-to-peer connections.',
  network: 'Lost contact with the matchmaking server. Check your connection.',
  'server-error': 'The matchmaking server is unreachable right now.',
}

/**
 * Opens a two-player channel. Both transports expose the same surface — send a
 * plain object, receive one — so the game layer never knows which is in use.
 */
export function createConnection(opts) {
  return RELAY_URL ? createRelayConnection(opts) : createPeerConnection(opts)
}

/* ---------------- relay: through our own server ---------------- */

function createRelayConnection({ role, code, onStatus, onData, onError }) {
  const url = `${RELAY_URL.replace(/\/$/, '')}/?room=${encodeURIComponent(code)}&role=${role}`
  const ws = new WebSocket(url)
  let closed = false

  ws.onmessage = (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.t === '__waiting') onStatus('waiting')
    else if (msg.t === '__peer') onStatus('connected')
    else if (msg.t === '__peer-left') onStatus('closed')
    else onData(msg)
  }

  ws.onerror = () => {
    if (!closed) onError('Could not reach the game server.')
  }

  ws.onclose = (ev) => {
    if (closed) return
    if (ev.code === 4001) onError('That room code is already in use. Try another.')
    else if (ev.code === 4002) onError('The game server is full right now.')
    else if (ev.code === 4000) onError('Invalid room code.')
    else onStatus('closed')
  }

  return {
    send(msg) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
    },
    destroy() {
      closed = true
      ws.close()
    },
  }
}

/* ---------------- p2p: browser to browser ---------------- */

function createPeerConnection({ role, code, onStatus, onData, onError }) {
  const peer = new Peer(role === 'host' ? PREFIX + code : undefined, { debug: 0 })
  let conn = null
  let closed = false

  function attach(c) {
    conn = c
    c.on('open', () => onStatus('connected'))
    c.on('data', (msg) => onData(msg))
    c.on('close', () => !closed && onStatus('closed'))
    c.on('error', () => !closed && onStatus('closed'))
  }

  peer.on('open', () => {
    if (role === 'host') {
      onStatus('waiting')
    } else {
      attach(peer.connect(PREFIX + code, { reliable: true }))
    }
  })

  if (role === 'host') peer.on('connection', attach)

  peer.on('error', (err) => {
    if (closed) return
    onError(FRIENDLY_ERRORS[err.type] ?? `Connection failed (${err.type}).`)
  })

  peer.on('disconnected', () => !closed && onStatus('closed'))

  return {
    send(msg) {
      if (conn && conn.open) conn.send(msg)
    },
    destroy() {
      closed = true
      try {
        conn?.close()
      } catch {
        /* already gone */
      }
      peer.destroy()
    },
  }
}
