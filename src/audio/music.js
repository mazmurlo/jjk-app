/* Background music.
 *
 * The intended track is "Judas" by Lady Gaga, loaded from public/audio/judas.mp3
 * — a file you drop in yourself (see public/audio/README.md). The recording is
 * not in this repo and is not committed by it.
 *
 * If that file isn't there, we fall back to a short synthesized loop written for
 * this app, so the toggle always does something.
 *
 * Browsers refuse to start audio without a user gesture, so nothing plays until
 * the toggle is clicked (or, if music was on last visit, until the first click
 * anywhere on the page).
 */

const TRACK_URL = `${import.meta.env.BASE_URL}audio/judas.mp3`
const PREF_KEY = 'jjk.music'

export const TRACK_LABEL = 'Judas — Lady Gaga'
export const FALLBACK_LABEL = 'Cursed Energy (synth loop)'

let el = null // <audio> for the real track
let source = 'none' // 'track' | 'synth' | 'none'
let playing = false

const listeners = new Set()
const snapshot = () => ({ playing, source })

function notify() {
  for (const fn of listeners) fn(snapshot())
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(snapshot())
  return () => listeners.delete(fn)
}

export const prefersMusic = () => {
  try {
    return localStorage.getItem(PREF_KEY) === 'on'
  } catch {
    return false
  }
}

function savePref(on) {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off')
  } catch {
    /* storage unavailable — the choice just won't persist */
  }
}

/* ---------------- the real track ---------------- */

async function trackExists() {
  try {
    const res = await fetch(TRACK_URL, { method: 'HEAD' })
    return res.ok && !(res.headers.get('content-type') || '').includes('text/html')
  } catch {
    return false
  }
}

async function startTrack() {
  if (!(await trackExists())) return false
  if (!el) {
    el = new Audio(TRACK_URL)
    el.loop = true
    el.volume = 0.5
  }
  try {
    await el.play()
    return true
  } catch {
    return false
  }
}

/* ---------------- synthesized fallback ---------------- */

const BPM = 128
const STEP = 60 / BPM / 2 // eighth notes
const ROOT = 55 // A1
const semi = (n) => ROOT * 2 ** (n / 12)

// Sixteen-step arpeggio over a four-bar minor progression.
const ARP = [12, 19, 24, 27, 26, 24, 22, 19, 12, 19, 24, 31, 29, 27, 24, 19]
const BASS = [0, -2, -5, -4]

let ctx = null
let master = null
let noise = null
let timer = null
let step = 0
let nextTime = 0

function tone(freq, at, dur, type, gain) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(gain, at + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(env).connect(master)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

function kick(at) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, at)
  osc.frequency.exponentialRampToValueAtTime(45, at + 0.12)
  env.gain.setValueAtTime(0.5, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
  osc.connect(env).connect(master)
  osc.start(at)
  osc.stop(at + 0.25)
}

function hat(at) {
  const src = ctx.createBufferSource()
  const hp = ctx.createBiquadFilter()
  const env = ctx.createGain()
  src.buffer = noise
  hp.type = 'highpass'
  hp.frequency.value = 7000
  env.gain.setValueAtTime(0.09, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.05)
  src.connect(hp).connect(env).connect(master)
  src.start(at)
  src.stop(at + 0.06)
}

function tick(i, at) {
  const bar = Math.floor(i / 16) % BASS.length
  tone(semi(ARP[i % 16]), at, 0.22, 'triangle', 0.07)
  if (i % 4 === 0) tone(semi(BASS[bar]), at, 0.42, 'sawtooth', 0.1)
  if (i % 8 === 0) kick(at)
  if (i % 2 === 1) hat(at)
}

function schedule() {
  // Schedule a little ahead of the clock so timer jitter never gaps the loop.
  while (nextTime < ctx.currentTime + 0.3) {
    tick(step, nextTime)
    nextTime += STEP
    step = (step + 1) % (16 * BASS.length)
  }
}

async function startSynth() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0.18
    master.connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  await ctx.resume()
  if (ctx.state !== 'running') return false
  step = 0
  nextTime = ctx.currentTime + 0.05
  schedule()
  timer = setInterval(schedule, 60)
  return true
}

function stopSynth() {
  clearInterval(timer)
  timer = null
  ctx?.suspend()
}

/* ---------------- public controls ---------------- */

export async function start() {
  if (playing) return true
  if (await startTrack()) source = 'track'
  else if (await startSynth()) source = 'synth'
  else return false

  playing = true
  savePref(true)
  notify()
  return true
}

export function stop() {
  if (!playing) return
  if (source === 'track') el?.pause()
  else stopSynth()
  playing = false
  savePref(false)
  notify()
}

export const toggle = () => (playing ? (stop(), false) : start())

/** Resume on the first click of the session if music was on last time. */
export function armAutoResume() {
  if (!prefersMusic()) return () => {}
  const go = () => {
    window.removeEventListener('pointerdown', go)
    start()
  }
  window.addEventListener('pointerdown', go)
  return () => window.removeEventListener('pointerdown', go)
}
