import http from 'node:http'
import { WebSocketServer } from 'ws'

/**
 * A dumb two-seat relay. It knows nothing about the game — it pairs a host and a
 * guest by room code and forwards bytes between them. All rules and dice stay in
 * the host's browser, exactly as in the peer-to-peer path.
 */

const PORT = process.env.PORT || 8787
const MAX_ROOMS = 500
const MAX_PAYLOAD = 1024 * 1024 // one turn of frames is ~30 KB
const ROOM_RE = /^[A-Z0-9]{5}$/

/** @type {Map<string, {host?: import('ws').WebSocket, guest?: import('ws').WebSocket}>} */
const rooms = new Map()

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server, maxPayload: MAX_PAYLOAD })

const send = (ws, obj) => ws?.readyState === ws?.OPEN && ws.send(JSON.stringify(obj))
const otherRole = (role) => (role === 'host' ? 'guest' : 'host')

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://relay')
  const code = (url.searchParams.get('room') || '').toUpperCase()
  const role = url.searchParams.get('role')

  if (!ROOM_RE.test(code) || (role !== 'host' && role !== 'guest')) {
    ws.close(4000, 'bad room or role')
    return
  }

  let room = rooms.get(code)
  if (!room) {
    if (rooms.size >= MAX_ROOMS) {
      ws.close(4002, 'server full')
      return
    }
    room = {}
    rooms.set(code, room)
  }

  if (room[role] && room[role].readyState === ws.OPEN) {
    ws.close(4001, 'seat taken')
    return
  }

  room[role] = ws
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  const peer = room[otherRole(role)]
  if (peer && peer.readyState === ws.OPEN) {
    send(ws, { t: '__peer' })
    send(peer, { t: '__peer' })
  } else {
    send(ws, { t: '__waiting' })
  }

  ws.on('message', (data) => {
    const p = room[otherRole(role)]
    if (p && p.readyState === ws.OPEN) p.send(data.toString())
  })

  ws.on('close', () => {
    if (room[role] === ws) delete room[role]
    const p = room[otherRole(role)]
    if (p && p.readyState === ws.OPEN) send(p, { t: '__peer-left' })
    if (!room.host && !room.guest) rooms.delete(code)
  })

  ws.on('error', () => ws.terminate())
})

// Free hosts drop idle sockets; ping keeps the match alive between slow turns.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate()
      continue
    }
    ws.isAlive = false
    ws.ping()
  }
}, 30000)

wss.on('close', () => clearInterval(heartbeat))

server.listen(PORT, () => console.log(`relay listening on :${PORT}`))
