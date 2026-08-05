import Peer from 'peerjs'

/* Room codes become PeerJS ids, so they share a global namespace with every
 * other app on the public broker. The prefix keeps a 5-character code ours. */
const PREFIX = 'jjk-kaisen-v1-'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

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
 * Opens a two-player channel. The host claims the room code as its peer id and
 * waits; the guest dials that id. Returns a handle for sending and teardown.
 */
export function createConnection({ role, code, onStatus, onData, onError }) {
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
