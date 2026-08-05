import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { WebSocket } from 'ws'

/**
 * Integration tests for the relay. Boots a real server on a scratch port and
 * drives it with real sockets — no mocks, since the whole job is byte plumbing.
 */

const PORT = 8899
const URL_BASE = `ws://127.0.0.1:${PORT}`

const connect = (room, role) => new WebSocket(`${URL_BASE}/?room=${room}&role=${role}`)
const nextMessage = (ws) => once(ws, 'message').then(([d]) => JSON.parse(d.toString()))

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`)
    failed++
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const server = spawn(process.execPath, ['index.js'], {
  cwd: import.meta.dirname,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
})
await once(server.stdout, 'data')

console.log('relay integration tests\n')

await test('host alone is told it is waiting', async () => {
  const host = connect('AAAAA', 'host')
  const msg = await nextMessage(host)
  assert(msg.t === '__waiting', `expected __waiting, got ${msg.t}`)
  host.close()
})

await test('both sides are notified when the room fills', async () => {
  const host = connect('BBBBB', 'host')
  assert((await nextMessage(host)).t === '__waiting', 'host should wait first')
  const guest = connect('BBBBB', 'guest')
  const [g, h] = await Promise.all([nextMessage(guest), nextMessage(host)])
  assert(g.t === '__peer' && h.t === '__peer', 'both should get __peer')
  host.close()
  guest.close()
})

await test('forwards a realistic turn payload host → guest', async () => {
  const host = connect('CCCCC', 'host')
  await nextMessage(host)
  const guest = connect('CCCCC', 'guest')
  await Promise.all([nextMessage(guest), nextMessage(host)])

  const payload = { t: 'frames', frames: Array.from({ length: 40 }, (_, i) => ({ i, pad: 'x'.repeat(600) })) }
  const raw = JSON.stringify(payload)
  host.send(raw)
  const got = await nextMessage(guest)
  assert(got.frames.length === 40, 'frame count mismatch')
  assert(raw.length > 20000, `payload should be realistic size, was ${raw.length}`)
  host.close()
  guest.close()
})

await test('forwards guest → host as well', async () => {
  const host = connect('DDDDD', 'host')
  await nextMessage(host)
  const guest = connect('DDDDD', 'guest')
  await Promise.all([nextMessage(guest), nextMessage(host)])

  guest.send(JSON.stringify({ t: 'action', action: { kind: 'move', index: 2 } }))
  const got = await nextMessage(host)
  assert(got.action.index === 2, 'action did not arrive intact')
  host.close()
  guest.close()
})

await test('rejects a second host for the same room', async () => {
  const host = connect('EEEEE', 'host')
  await nextMessage(host)
  const intruder = connect('EEEEE', 'host')
  const [code] = await once(intruder, 'close')
  assert(code === 4001, `expected close 4001, got ${code}`)
  host.close()
})

await test('rooms are isolated from each other', async () => {
  const h1 = connect('FFFFF', 'host')
  await nextMessage(h1)
  const g1 = connect('FFFFF', 'guest')
  await Promise.all([nextMessage(g1), nextMessage(h1)])

  const h2 = connect('GGGGG', 'host')
  await nextMessage(h2)
  const g2 = connect('GGGGG', 'guest')
  await Promise.all([nextMessage(g2), nextMessage(h2)])

  let leaked = false
  g2.on('message', () => {
    leaked = true
  })
  h1.send(JSON.stringify({ t: 'secret' }))
  await nextMessage(g1)
  await new Promise((r) => setTimeout(r, 120))
  assert(!leaked, 'message leaked into another room')
  ;[h1, g1, h2, g2].forEach((s) => s.close())
})

await test('rejects a malformed room code', async () => {
  const bad = connect('xx', 'host')
  const [code] = await once(bad, 'close')
  assert(code === 4000, `expected close 4000, got ${code}`)
})

await test('rejects an unknown role', async () => {
  const bad = new WebSocket(`${URL_BASE}/?room=HHHHH&role=referee`)
  const [code] = await once(bad, 'close')
  assert(code === 4000, `expected close 4000, got ${code}`)
})

await test('surviving peer is told when the other leaves', async () => {
  const host = connect('IIIII', 'host')
  await nextMessage(host)
  const guest = connect('IIIII', 'guest')
  await Promise.all([nextMessage(guest), nextMessage(host)])
  guest.close()
  const msg = await nextMessage(host)
  assert(msg.t === '__peer-left', `expected __peer-left, got ${msg.t}`)
  host.close()
})

await test('health endpoint reports room count', async () => {
  const res = await fetch(`http://127.0.0.1:${PORT}/health`)
  const body = await res.json()
  assert(res.status === 200 && body.ok === true, 'health check failed')
  assert(typeof body.rooms === 'number', 'rooms should be a number')
})

await test('empty rooms are cleaned up', async () => {
  const host = connect('JJJJJ', 'host')
  await nextMessage(host)
  host.close()
  await new Promise((r) => setTimeout(r, 150))
  const { rooms } = await (await fetch(`http://127.0.0.1:${PORT}/health`)).json()
  assert(rooms === 0, `expected 0 rooms after cleanup, got ${rooms}`)
})

console.log(`\n${passed} passed, ${failed} failed`)
server.kill()
process.exit(failed ? 1 : 0)
