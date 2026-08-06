/* Background music.
 *
 * Two sources, in order of preference:
 *
 *   1. public/audio/judas.mp3 — Lady Gaga's "Judas", a file you drop in
 *      yourself (see public/audio/README.md). The recording is copyrighted, so
 *      it is not in this repo and .gitignore keeps it out of commits.
 *   2. A built-in 8-bit chiptune loop, synthesized in this file. It is an
 *      original composition written for this app in the style of that era of
 *      dance-pop — four-on-the-floor kick, pulse-wave arpeggios, minor-key
 *      progression — not a transcription of any particular song.
 *
 * Browsers refuse to start audio without a user gesture, so nothing plays until
 * the toggle is clicked (or, if music was on last visit, until the first click
 * anywhere on the page).
 */

const TRACK_URL = `${import.meta.env.BASE_URL}audio/judas.mp3`
const PREF_KEY = 'jjk.music'

export const TRACK_LABEL = 'Judas — Lady Gaga'
export const FALLBACK_LABEL = '8-bit Dance Floor (original)'

let el = null // <audio> for the real track
let source = 'none' // 'track' | 'chip' | 'none'
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
    // A dev server's SPA fallback answers 200 with HTML, which is not a song.
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

/* ---------------- chiptune fallback ----------------
 *
 * Laid out like an NES sound chip: two pulse channels (lead and arpeggio), a
 * triangle bass, and a noise channel for drums. Everything is on a 16th-note
 * grid, sequenced from the arrangement below.
 */

const BPM = 130
const STEP = 60 / BPM / 4 // one 16th note
const BAR = 16 // steps
const SECTION = 4 * BAR // steps

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12)

// Chords as [root, third, fifth] in MIDI numbers, A minor throughout.
const CHORDS = {
  Am: [57, 60, 64],
  Dm: [50, 53, 57],
  F: [53, 57, 60],
  C: [48, 52, 55],
  G: [55, 59, 62],
}

// Drum grid: one character per 16th note.
const DRUMS = {
  intro: { k: 'x-------x-------', s: '----------------', h: '--x---x---x---x-' },
  four: { k: 'x---x---x---x---', s: '----x-------x---', h: '-x-x-x-x-x-x-x-x' },
  chorus: { k: 'x---x---x---x-x-', s: '----x-------x---', h: '-x-x-x-x-x-x-xxx' },
  break: { k: 'x-------x-------', s: '------------x---', h: '--x---x---x---x-' },
}

// Bass plays straight eighths, with the fifth as a pickup at the end of each bar.
const BASS_STEPS = [0, 2, 4, 6, 8, 10, 12, 14]

// Lead lines, one array of [step, midi, lengthInSteps] per bar.
const LEAD_VERSE = [
  [[0, 76, 2], [3, 74, 1], [4, 72, 2], [7, 69, 3]],
  [[0, 77, 2], [3, 76, 1], [4, 74, 2], [8, 72, 4]],
  [[0, 79, 2], [2, 76, 2], [6, 72, 2], [10, 74, 4]],
  [[0, 74, 2], [4, 71, 2], [8, 79, 4], [12, 76, 3]],
]

const LEAD_CHORUS = [
  [[0, 81, 2], [2, 81, 1], [3, 79, 1], [4, 77, 2], [8, 76, 2], [10, 77, 2], [12, 79, 4]],
  [[0, 76, 2], [2, 72, 2], [4, 76, 2], [6, 79, 2], [8, 81, 4], [12, 79, 2], [14, 76, 2]],
  [[0, 74, 2], [2, 79, 2], [4, 83, 2], [6, 81, 2], [8, 79, 4], [12, 74, 4]],
  [[0, 81, 2], [2, 79, 1], [3, 77, 1], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 69, 4]],
]

const LEAD_BREAK = [
  [[0, 74, 6], [8, 77, 4], [12, 76, 2]],
  [[0, 72, 6], [8, 69, 6]],
  [[0, 77, 4], [4, 76, 4], [8, 74, 6]],
  [[0, 71, 4], [4, 74, 4], [8, 79, 8]],
]

const SONG = [
  { chords: ['Am', 'F', 'C', 'G'], drums: 'intro', arp: true, lead: null },
  { chords: ['Am', 'F', 'C', 'G'], drums: 'four', arp: true, lead: LEAD_VERSE },
  { chords: ['F', 'C', 'G', 'Am'], drums: 'chorus', arp: true, lead: LEAD_CHORUS },
  { chords: ['Am', 'F', 'C', 'G'], drums: 'four', arp: true, lead: LEAD_VERSE },
  { chords: ['F', 'C', 'G', 'Am'], drums: 'chorus', arp: true, lead: LEAD_CHORUS },
  { chords: ['Dm', 'Am', 'F', 'G'], drums: 'break', arp: false, lead: LEAD_BREAK },
]

const TOTAL_STEPS = SONG.length * SECTION

let ctx = null
let master = null
let noise = null
const waves = new Map()
let timer = null
let step = 0
let nextTime = 0

/** Band-limited pulse wave of a given duty cycle — the chip's square channels. */
function pulseWave(duty) {
  if (!waves.has(duty)) {
    const n = 24
    const real = new Float32Array(n)
    const imag = new Float32Array(n)
    for (let i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty)
    waves.set(duty, ctx.createPeriodicWave(real, imag, { disableNormalization: false }))
  }
  return waves.get(duty)
}

/** Hard attack, flat sustain, quick cut — no analogue swells on a 2A03. */
function blip(node, at, dur, gain) {
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(gain, at + 0.004)
  env.gain.setValueAtTime(gain, at + dur * 0.7)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  node.connect(env).connect(master)
  node.start(at)
  node.stop(at + dur + 0.02)
}

function pulse(midi, at, dur, duty, gain) {
  const osc = ctx.createOscillator()
  osc.setPeriodicWave(pulseWave(duty))
  osc.frequency.value = freq(midi)
  blip(osc, at, dur, gain)
}

function triangle(midi, at, dur, gain) {
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq(midi)
  blip(osc, at, dur, gain)
}

function kick(at) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(160, at)
  osc.frequency.exponentialRampToValueAtTime(42, at + 0.1)
  env.gain.setValueAtTime(0.55, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.2)
  osc.connect(env).connect(master)
  osc.start(at)
  osc.stop(at + 0.22)
}

function noiseHit(at, dur, gain, cutoff, type = 'highpass') {
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const env = ctx.createGain()
  src.buffer = noise
  filter.type = type
  filter.frequency.value = cutoff
  env.gain.setValueAtTime(gain, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(filter).connect(env).connect(master)
  src.start(at)
  src.stop(at + dur + 0.02)
}

const snare = (at) => noiseHit(at, 0.13, 0.3, 1400, 'bandpass')
const hat = (at) => noiseHit(at, 0.04, 0.1, 8000)

function tick(i, at) {
  const section = SONG[Math.floor(i / SECTION) % SONG.length]
  const bar = Math.floor((i % SECTION) / BAR)
  const st = i % BAR
  const chord = CHORDS[section.chords[bar]]
  const drums = DRUMS[section.drums]

  // Bass: root an octave down, with the fifth leading into the next bar.
  if (BASS_STEPS.includes(st)) {
    const note = st === 14 ? chord[2] - 12 : chord[0] - 12
    triangle(note, at, STEP * 1.6, 0.2)
  }

  // Arpeggio on the second pulse channel, climbing an octave halfway through.
  if (section.arp) {
    const note = chord[st % 3] + (st % 8 >= 4 ? 12 : 0)
    pulse(note, at, STEP * 0.85, 0.25, 0.075)
  }

  // Lead on the first pulse channel, 50% duty for the fatter tone.
  for (const [when, midi, len] of section.lead?.[bar] ?? []) {
    if (when === st) pulse(midi, at, STEP * len * 0.9, 0.5, 0.15)
  }

  if (drums.k[st] === 'x') kick(at)
  if (drums.s[st] === 'x') snare(at)
  if (drums.h[st] === 'x') hat(at)
}

function schedule() {
  // Schedule a little ahead of the clock so timer jitter never gaps the loop.
  while (nextTime < ctx.currentTime + 0.3) {
    tick(step, nextTime)
    nextTime += STEP
    step = (step + 1) % TOTAL_STEPS
  }
}

async function startChiptune() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0.2
    master.connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
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

function stopChiptune() {
  clearInterval(timer)
  timer = null
  ctx?.suspend()
}

/* ---------------- public controls ---------------- */

export async function start() {
  if (playing) return true
  if (await startTrack()) source = 'track'
  else if (await startChiptune()) source = 'chip'
  else return false

  playing = true
  savePref(true)
  notify()
  return true
}

export function stop() {
  if (!playing) return
  if (source === 'track') el?.pause()
  else stopChiptune()
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
