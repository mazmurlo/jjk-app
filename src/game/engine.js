import { TYPES } from './data.js'

const LEVEL = 55
const CE_PER_HIT = 20
const CE_PER_TAKEN = 13
const clone = (x) => structuredClone(x)

/* ---------------- type chart ---------------- */

export function effectiveness(atkType, defTypes) {
  const i = TYPES.indexOf(atkType)
  let mult = 1
  for (const d of defTypes) {
    const j = TYPES.indexOf(d)
    if (j === (i + 1) % TYPES.length) mult *= 2
    else if (i === (j + 1) % TYPES.length) mult *= 0.5
  }
  return mult
}

export function effectivenessLabel(mult) {
  if (mult >= 2) return "It's super effective!"
  if (mult > 1) return "It's effective."
  if (mult === 1) return null
  if (mult >= 0.5) return "It's not very effective…"
  return 'It barely lands.'
}

/* ---------------- fighters ---------------- */

export function createFighter(def, boost = 0) {
  const scale = 1 + boost
  const r = (n) => Math.round(n * scale)
  return {
    key: def.key,
    name: def.name,
    kana: def.kana,
    types: [...def.types],
    color: def.color,
    maxHp: r(def.stats.hp),
    hp: r(def.stats.hp),
    stats: { atk: r(def.stats.atk), def: r(def.stats.def), spd: r(def.stats.spd) },
    stages: { atk: 0, def: 0, spd: 0 },
    moves: def.moves.map((m) => ({ ...m, pp: m.pp, maxPp: m.pp })),
    domain: def.domain ? { ...def.domain, used: false } : null,
    ce: 0,
    status: null,
    statusTurns: 0,
    fainted: false,
  }
}

const stageMult = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))
const statOf = (f, key) => Math.max(1, Math.round(f.stats[key] * stageMult(f.stages[key])))

const active = (state, side) =>
  side === 'player' ? state.playerTeam[state.playerActive] : state.enemyTeam[state.enemyActive]

const teamOf = (state, side) => (side === 'player' ? state.playerTeam : state.enemyTeam)
const other = (side) => (side === 'player' ? 'enemy' : 'player')

/* ---------------- battle state ---------------- */

export function createBattle(playerTeam, enemyTeam, stage) {
  return {
    playerTeam,
    enemyTeam,
    playerActive: 0,
    enemyActive: 0,
    stage,
    turn: 1,
    phase: 'choose',
  }
}

/* ---------------- damage ---------------- */

export function calcDamage(attacker, defender, move, rng) {
  const a = statOf(attacker, 'atk')
  const d = statOf(defender, 'def')
  const base = Math.floor(Math.floor((Math.floor((2 * LEVEL) / 5) + 2) * move.power * a) / d / 50) + 2

  const crit = rng() < (move.highCrit ? 0.125 : 0.0625)
  const stab = attacker.types.includes(move.type) ? 1.5 : 1
  const eff = effectiveness(move.type, defender.types)
  const spread = 0.85 + rng() * 0.15

  const damage = Math.max(1, Math.floor(base * (crit ? 1.5 : 1) * stab * eff * spread))
  return { damage, crit, eff }
}

/* ---------------- frame helpers ---------------- */

function frame(frames, state, message, fx = null) {
  frames.push({ state: clone(state), message, fx })
}

function gainCe(f, amount) {
  if (!f.fainted) f.ce = Math.min(100, f.ce + amount)
}

function applyStatStage(target, stat, stages) {
  const before = target.stages[stat]
  target.stages[stat] = Math.max(-3, Math.min(3, before + stages))
  return target.stages[stat] - before
}

function statMessage(name, stat, delta) {
  const label = { atk: 'attack', def: 'defense', spd: 'speed' }[stat]
  if (delta === 0) return `${name}'s ${label} can't go any further!`
  const dir = delta > 0 ? 'rose' : 'fell'
  const much = Math.abs(delta) >= 2 ? ' sharply' : ''
  return `${name}'s ${label} ${dir}${much}!`
}

function faintCheck(state, side, frames) {
  const f = active(state, side)
  if (f.hp > 0 || f.fainted) return false
  f.hp = 0
  f.fainted = true
  f.stages = { atk: 0, def: 0, spd: 0 }
  f.status = null
  frame(frames, state, `${f.name} is down!`, { target: side, kind: 'faint' })
  return true
}

/* ---------------- effects ---------------- */

function applyEffect(state, side, move, frames, rng, dealt = 0) {
  const eff = move.effect
  if (!eff) return
  const self = active(state, side)
  const foe = active(state, other(side))

  if (eff.recoil && dealt > 0) {
    const r = Math.max(1, Math.floor(dealt * eff.recoil))
    self.hp = Math.max(0, self.hp - r)
    frame(frames, state, `${self.name} is hurt by the strain!`, { target: side, kind: 'hit' })
  }

  if (eff.drain && dealt > 0) {
    const heal = Math.max(1, Math.floor(dealt * eff.drain))
    const before = self.hp
    self.hp = Math.min(self.maxHp, self.hp + heal)
    if (self.hp > before) frame(frames, state, `${self.name} drains cursed energy.`, { target: side, kind: 'heal' })
  }

  if (eff.heal) {
    const before = self.hp
    self.hp = Math.min(self.maxHp, self.hp + Math.floor(self.maxHp * eff.heal))
    if (self.hp > before) frame(frames, state, `${self.name} recovers.`, { target: side, kind: 'heal' })
    else frame(frames, state, `${self.name} is already at full health.`)
  }

  if (eff.stat && rng() < (eff.chance ?? 1)) {
    const targetSide = eff.target === 'foe' ? other(side) : side
    const target = targetSide === side ? self : foe
    if (!target.fainted && target.hp > 0) {
      for (const stat of [eff.stat, eff.alsoStat].filter(Boolean)) {
        const delta = applyStatStage(target, stat, eff.stages)
        frame(frames, state, statMessage(target.name, stat, delta), null)
      }
    }
  }

  if (eff.status && rng() < (eff.chance ?? 1)) {
    const targetSide = eff.target === 'self' ? side : other(side)
    const target = targetSide === side ? self : foe
    if (!target.fainted && target.hp > 0 && !target.status) {
      target.status = eff.status
      target.statusTurns = eff.status === 'bound' ? 3 : 0
      const text =
        eff.status === 'cursed'
          ? `${target.name} is corroded by cursed energy!`
          : `${target.name} is bound and can barely move!`
      frame(frames, state, text, { target: targetSide, kind: 'status' })
    }
  }
}

/* ---------------- actions ---------------- */

function doSwitch(state, side, index, frames) {
  const team = teamOf(state, side)
  const current = active(state, side)
  if (!current.fainted) {
    current.stages = { atk: 0, def: 0, spd: 0 }
    if (current.status === 'bound') {
      current.status = null
      current.statusTurns = 0
    }
  }
  if (side === 'player') state.playerActive = index
  else state.enemyActive = index
  const who = side === 'player' ? 'You send out' : 'The enemy sends out'
  frame(frames, state, `${who} ${team[index].name}!`, { target: side, kind: 'switch' })
}

function doMove(state, side, move, frames, rng, { isDomain = false } = {}) {
  const attacker = active(state, side)
  const defender = active(state, other(side))
  if (attacker.fainted) return

  if (attacker.status === 'bound' && rng() < 0.33) {
    frame(frames, state, `${attacker.name} is bound and can't move!`, { target: side, kind: 'status' })
    return
  }

  if (isDomain) {
    attacker.domain.used = true
    attacker.ce = 0
    frame(frames, state, `${attacker.name}: DOMAIN EXPANSION — ${move.name}!`, { target: side, kind: 'domain' })
    if (move.flavor) frame(frames, state, move.flavor, null)
  } else {
    move.pp -= 1
    frame(frames, state, `${attacker.name} used ${move.name}!`, null)
  }

  // Domain expansions are guaranteed to connect.
  if (!isDomain && rng() * 100 >= (move.acc ?? 100)) {
    frame(frames, state, `${attacker.name}'s attack missed!`)
    return
  }

  if (move.category === 'status') {
    applyEffect(state, side, move, frames, rng, 0)
    return
  }

  const { damage, crit, eff } = calcDamage(attacker, defender, move, rng)
  defender.hp = Math.max(0, defender.hp - damage)
  frame(frames, state, `${defender.name} takes ${damage} damage.`, {
    target: other(side),
    kind: crit ? 'crit' : 'hit',
  })

  if (crit) frame(frames, state, 'A critical hit!')
  const label = effectivenessLabel(eff)
  if (label) frame(frames, state, label)

  gainCe(attacker, CE_PER_HIT)
  gainCe(defender, CE_PER_TAKEN)

  // applyEffect skips stat/status changes on fainted targets, so recoil and
  // drain still resolve even if this blow was the finisher.
  applyEffect(state, side, move, frames, rng, damage)

  faintCheck(state, other(side), frames)
  faintCheck(state, side, frames)
}

/* ---------------- end of turn ---------------- */

function endOfTurn(state, frames) {
  for (const side of ['player', 'enemy']) {
    const f = active(state, side)
    if (f.fainted) continue
    if (f.status === 'cursed') {
      const chip = Math.max(1, Math.floor(f.maxHp / 10))
      f.hp = Math.max(0, f.hp - chip)
      frame(frames, state, `${f.name} is eaten away by cursed energy. (-${chip})`, { target: side, kind: 'hit' })
      faintCheck(state, side, frames)
    } else if (f.status === 'bound') {
      f.statusTurns -= 1
      if (f.statusTurns <= 0) {
        f.status = null
        frame(frames, state, `${f.name} broke free!`)
      }
    }
  }
}

/* ---------------- enemy AI ---------------- */

function scoreMove(attacker, defender, move) {
  if (move.category === 'status') return 30
  return move.power * (attacker.types.includes(move.type) ? 1.5 : 1) * effectiveness(move.type, defender.types) * ((move.acc ?? 100) / 100)
}

export function chooseEnemyAction(state, rng) {
  const self = active(state, 'enemy')
  const foe = active(state, 'player')

  const bench = state.enemyTeam
    .map((f, i) => ({ f, i }))
    .filter(({ f, i }) => !f.fainted && i !== state.enemyActive)

  if (self.hp / self.maxHp < 0.22 && bench.length && rng() < 0.3) {
    return { kind: 'switch', index: bench[Math.floor(rng() * bench.length)].i }
  }

  if (self.domain && !self.domain.used && self.ce >= 100 && rng() < 0.75) {
    return { kind: 'domain' }
  }

  const usable = self.moves.map((m, i) => ({ m, i })).filter(({ m }) => m.pp > 0)
  if (!usable.length) return { kind: 'move', index: 0 }

  const ranked = usable
    .map(({ m, i }) => ({ i, score: scoreMove(self, foe, m) }))
    .sort((a, b) => b.score - a.score)

  const pick = rng() < 0.75 ? ranked[0] : ranked[Math.floor(rng() * ranked.length)]
  return { kind: 'move', index: pick.i }
}

/* ---------------- turn resolution ---------------- */

function actionSpeed(state, side, action) {
  if (action.kind === 'switch') return { tier: 2, speed: 0 }
  const f = active(state, side)
  const move = action.kind === 'domain' ? f.domain : f.moves[action.index]
  return { tier: 1, speed: statOf(f, 'spd'), priority: move?.priority ?? 0 }
}

/**
 * Resolve one turn. In single-player the enemy action comes from the AI; in
 * versus play the host passes both actions in, so no AI runs and only the host
 * ever rolls the dice.
 */
export function resolveTurn(state, playerAction, rng = Math.random, opts = {}) {
  const { enemyAction: suppliedEnemyAction = null, autoReplace = false } = opts
  const s = clone(state)
  const frames = []
  const enemyAction = suppliedEnemyAction ?? chooseEnemyAction(s, rng)

  const entries = [
    { side: 'player', action: playerAction, ...actionSpeed(s, 'player', playerAction) },
    { side: 'enemy', action: enemyAction, ...actionSpeed(s, 'enemy', enemyAction) },
  ]

  entries.sort((a, b) => {
    if (a.tier !== b.tier) return b.tier - a.tier
    if ((a.priority ?? 0) !== (b.priority ?? 0)) return (b.priority ?? 0) - (a.priority ?? 0)
    if (a.speed !== b.speed) return b.speed - a.speed
    return rng() < 0.5 ? -1 : 1
  })

  for (const entry of entries) {
    const f = active(s, entry.side)
    if (f.fainted) continue
    if (isOver(s)) break

    if (entry.action.kind === 'switch') {
      doSwitch(s, entry.side, entry.action.index, frames)
    } else if (entry.action.kind === 'domain') {
      doMove(s, entry.side, f.domain, frames, rng, { isDomain: true })
    } else {
      const move = f.moves[entry.action.index]
      doMove(s, entry.side, move, frames, rng)
    }
  }

  if (!isOver(s)) endOfTurn(s, frames)

  // Auto-replace a downed enemy so the player never faces an empty field.
  if (active(s, 'enemy').fainted) {
    const next = s.enemyTeam.findIndex((f) => !f.fainted)
    if (next >= 0) doSwitch(s, 'enemy', next, frames)
  }

  // Versus play applies the same rule to both sides, so neither player owes the
  // other a round trip just to pick a replacement.
  if (autoReplace && active(s, 'player').fainted) {
    const next = s.playerTeam.findIndex((f) => !f.fainted)
    if (next >= 0) doSwitch(s, 'player', next, frames)
  }

  s.turn += 1
  s.phase = nextPhase(s)
  frame(frames, s, null)

  return frames
}

function isOver(state) {
  return state.playerTeam.every((f) => f.fainted) || state.enemyTeam.every((f) => f.fainted)
}

function nextPhase(state) {
  if (state.enemyTeam.every((f) => f.fainted)) return 'win'
  if (state.playerTeam.every((f) => f.fainted)) return 'lose'
  if (state.playerTeam[state.playerActive].fainted) return 'forceSwitch'
  return 'choose'
}

export function switchInPlayer(state, index) {
  const s = clone(state)
  const frames = []
  doSwitch(s, 'player', index, frames)
  s.phase = nextPhase(s)
  frame(frames, s, null)
  return frames
}

export function healTeam(team, boost = 0) {
  return team.map((f) => ({
    ...f,
    maxHp: Math.round(f.maxHp * (1 + boost)),
    hp: Math.round(f.maxHp * (1 + boost)),
    stats: {
      atk: Math.round(f.stats.atk * (1 + boost)),
      def: Math.round(f.stats.def * (1 + boost)),
      spd: Math.round(f.stats.spd * (1 + boost)),
    },
    stages: { atk: 0, def: 0, spd: 0 },
    status: null,
    statusTurns: 0,
    fainted: false,
    ce: 0,
    domain: f.domain ? { ...f.domain, used: false } : null,
    moves: f.moves.map((m) => ({ ...m, pp: m.maxPp })),
  }))
}
