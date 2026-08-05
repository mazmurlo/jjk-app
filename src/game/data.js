/* Type wheel: each type is strong against the next and weak to the previous. */
export const TYPES = ['Physical', 'Technique', 'Domain', 'Cursed', 'Spirit']

export const TYPE_COLORS = {
  Physical: '#e63946',
  Technique: '#4cc9f0',
  Domain: '#c084fc',
  Cursed: '#f72585',
  Spirit: '#90be6d',
}

/* ---------------- playable sorcerers ---------------- */

export const ROSTER = [
  {
    key: 'yuji',
    name: 'Yuji Itadori',
    kana: '虎杖 悠仁',
    types: ['Physical'],
    color: '#f72585',
    stats: { hp: 225, atk: 122, def: 100, spd: 108 },
    moves: [
      { name: 'Divergent Fist', type: 'Physical', power: 75, acc: 100, pp: 15 },
      { name: 'Black Flash', type: 'Physical', power: 115, acc: 60, pp: 5, highCrit: true },
      { name: 'Manji Kick', type: 'Physical', power: 60, acc: 100, pp: 20, effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.35 } },
      { name: 'Steel Nerves', type: 'Physical', category: 'status', acc: 100, pp: 10, effect: { heal: 0.3, stat: 'def', stages: 1, target: 'self', chance: 1 } },
    ],
    domain: { name: "Sukuna's Hand", type: 'Domain', power: 130, pp: 1, effect: { recoil: 0.2 }, flavor: 'Yuji lets the King of Curses surface — just for a moment.' },
  },
  {
    key: 'megumi',
    name: 'Megumi Fushiguro',
    kana: '伏黒 恵',
    types: ['Technique'],
    color: '#3a0ca3',
    stats: { hp: 215, atk: 108, def: 112, spd: 100 },
    moves: [
      { name: 'Divine Dogs', type: 'Technique', power: 70, acc: 100, pp: 20, effect: { stat: 'spd', stages: -1, target: 'foe', chance: 0.3 } },
      { name: 'Nue', type: 'Technique', power: 65, acc: 95, pp: 15, effect: { status: 'bound', chance: 0.35 } },
      { name: 'Rabbit Escape', type: 'Technique', category: 'status', acc: 100, pp: 10, effect: { stat: 'spd', stages: 2, target: 'self', chance: 1 } },
      { name: 'Great Serpent', type: 'Technique', power: 95, acc: 85, pp: 10 },
    ],
    domain: { name: 'Chimera Shadow Garden', type: 'Domain', power: 120, pp: 1, effect: { stat: 'spd', stages: 1, target: 'self', chance: 1 }, flavor: 'Shadow floods the arena. Every shikigami answers at once.' },
  },
  {
    key: 'nobara',
    name: 'Nobara Kugisaki',
    kana: '釘崎 野薔薇',
    types: ['Cursed'],
    color: '#ff9e00',
    stats: { hp: 205, atk: 118, def: 96, spd: 104 },
    moves: [
      { name: 'Hairpin', type: 'Cursed', power: 75, acc: 100, pp: 15 },
      { name: 'Resonance', type: 'Cursed', power: 90, acc: 90, pp: 10, effect: { status: 'cursed', chance: 0.3 } },
      { name: 'Nail Barrage', type: 'Cursed', power: 50, acc: 100, pp: 20, priority: 1 },
      { name: 'Black Flash', type: 'Cursed', power: 115, acc: 60, pp: 5, highCrit: true },
    ],
    domain: { name: 'Resonance Overload', type: 'Cursed', power: 125, pp: 1, effect: { drain: 0.3 }, flavor: 'Every straw doll in her bag screams at once.' },
  },
  {
    key: 'maki',
    name: 'Maki Zenin',
    kana: '禪院 真希',
    types: ['Physical'],
    color: '#2a9d8f',
    stats: { hp: 210, atk: 128, def: 98, spd: 124 },
    moves: [
      { name: 'Playful Cloud', type: 'Physical', power: 85, acc: 95, pp: 15 },
      { name: 'Split Soul Katana', type: 'Physical', power: 90, acc: 90, pp: 10, effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.4 } },
      { name: 'Heavenly Restriction', type: 'Physical', category: 'status', acc: 100, pp: 10, effect: { stat: 'atk', stages: 1, target: 'self', chance: 1, alsoStat: 'spd' } },
      { name: 'Inverted Spear', type: 'Physical', power: 100, acc: 85, pp: 8, effect: { status: 'cursed', chance: 0.2 } },
    ],
    domain: { name: 'Zenin Massacre', type: 'Physical', power: 132, pp: 1, effect: { recoil: 0.25 }, flavor: 'No cursed energy. No hesitation. No survivors.' },
  },
  {
    key: 'nanami',
    name: 'Kento Nanami',
    kana: '七海 建人',
    types: ['Technique', 'Physical'],
    color: '#c9a227',
    stats: { hp: 220, atk: 120, def: 110, spd: 96 },
    moves: [
      { name: 'Ratio Technique', type: 'Technique', power: 80, acc: 100, pp: 15, highCrit: true },
      { name: 'Blade Cleave', type: 'Physical', power: 85, acc: 95, pp: 15 },
      { name: 'Collapse', type: 'Physical', power: 70, acc: 100, pp: 15, effect: { stat: 'atk', stages: -1, target: 'foe', chance: 0.4 } },
      { name: 'Overtime', type: 'Technique', category: 'status', acc: 100, pp: 8, effect: { stat: 'atk', stages: 2, target: 'self', chance: 1 } },
    ],
    domain: { name: 'Overtime: Full Force', type: 'Domain', power: 122, pp: 1, flavor: 'He checks his watch. The workday is over.' },
  },
  {
    key: 'toge',
    name: 'Toge Inumaki',
    kana: '狗巻 棘',
    types: ['Cursed'],
    color: '#90be6d',
    stats: { hp: 195, atk: 124, def: 92, spd: 106 },
    moves: [
      { name: 'Blast Away', type: 'Cursed', power: 80, acc: 95, pp: 15 },
      { name: "Don't Move", type: 'Cursed', category: 'status', acc: 90, pp: 10, effect: { status: 'bound', chance: 1, target: 'foe' } },
      { name: 'Crush', type: 'Cursed', power: 65, acc: 100, pp: 20, effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.35 } },
      { name: 'Explode', type: 'Cursed', power: 120, acc: 70, pp: 5, effect: { recoil: 0.15 } },
    ],
    domain: { name: 'Cursed Speech: Die', type: 'Cursed', power: 145, pp: 1, effect: { recoil: 0.25 }, flavor: 'One word. His throat tears open saying it.' },
  },
  {
    key: 'panda',
    name: 'Panda',
    kana: 'パンダ',
    types: ['Physical', 'Spirit'],
    color: '#8d99ae',
    stats: { hp: 245, atk: 112, def: 118, spd: 86 },
    moves: [
      { name: 'Palm Strike', type: 'Physical', power: 75, acc: 100, pp: 20 },
      { name: 'Gorilla Mode', type: 'Physical', category: 'status', acc: 100, pp: 8, effect: { stat: 'atk', stages: 2, target: 'self', chance: 1 } },
      { name: 'Bear Hug', type: 'Physical', power: 60, acc: 100, pp: 15, effect: { status: 'bound', chance: 0.4 } },
      { name: 'Core Swap', type: 'Spirit', category: 'status', acc: 100, pp: 8, effect: { heal: 0.45 } },
    ],
    domain: { name: 'Triple Core Assault', type: 'Physical', power: 118, pp: 1, effect: { stat: 'def', stages: 1, target: 'self', chance: 1 }, flavor: 'Brother core. Sister core. Both wake up angry.' },
  },
  {
    key: 'todo',
    name: 'Aoi Todo',
    kana: '東堂 葵',
    types: ['Technique', 'Physical'],
    color: '#e63946',
    stats: { hp: 230, atk: 126, def: 106, spd: 98 },
    moves: [
      { name: 'Boogie Woogie', type: 'Technique', power: 55, acc: 100, pp: 20, priority: 1 },
      { name: 'Grand Slam', type: 'Physical', power: 95, acc: 90, pp: 10 },
      { name: 'Best Friend', type: 'Technique', category: 'status', acc: 100, pp: 10, effect: { stat: 'atk', stages: 1, target: 'self', chance: 1, alsoStat: 'spd' } },
      { name: 'Black Flash', type: 'Physical', power: 115, acc: 60, pp: 5, highCrit: true },
    ],
    domain: { name: 'Unrivaled Strength', type: 'Technique', power: 120, pp: 1, effect: { stat: 'atk', stages: 1, target: 'self', chance: 1 }, flavor: 'He claps. The world rearranges itself around the clap.' },
  },
  {
    key: 'gojo',
    name: 'Satoru Gojo',
    kana: '五条 悟',
    types: ['Cursed', 'Domain'],
    color: '#4cc9f0',
    locked: true,
    stats: { hp: 240, atk: 138, def: 124, spd: 132 },
    moves: [
      { name: 'Blue', type: 'Cursed', power: 85, acc: 100, pp: 15, effect: { stat: 'spd', stages: -1, target: 'foe', chance: 0.35 } },
      { name: 'Red', type: 'Cursed', power: 110, acc: 90, pp: 10 },
      { name: 'Infinity', type: 'Domain', category: 'status', acc: 100, pp: 10, effect: { stat: 'def', stages: 2, target: 'self', chance: 1 } },
      { name: 'Hollow Purple', type: 'Cursed', power: 135, acc: 85, pp: 5 },
    ],
    domain: { name: 'Unlimited Void', type: 'Domain', power: 140, pp: 1, effect: { stat: 'atk', stages: -1, target: 'foe', chance: 1, alsoStat: 'def' }, flavor: 'Infinite information pours in. The opponent forgets how to move.' },
  },
]

/* ---------------- enemies, in gauntlet order ---------------- */

const grade3 = {
  key: 'grade3',
  name: 'Grade 3 Curse',
  kana: '三級呪霊',
  types: ['Spirit'],
  color: '#6a5d7b',
  stats: { hp: 170, atk: 92, def: 84, spd: 76 },
  moves: [
    { name: 'Flail', type: 'Spirit', power: 65, acc: 95, pp: 20 },
    { name: 'Gnaw', type: 'Spirit', power: 50, acc: 100, pp: 20, effect: { status: 'cursed', chance: 0.2 } },
    { name: 'Screech', type: 'Cursed', category: 'status', acc: 100, pp: 10, effect: { stat: 'atk', stages: -1, target: 'foe', chance: 1 } },
    { name: 'Lunge', type: 'Physical', power: 60, acc: 100, pp: 20 },
  ],
}

const fingerBearer = {
  key: 'finger',
  name: 'Finger Bearer',
  kana: '指喰い',
  types: ['Spirit', 'Cursed'],
  color: '#7b2d5e',
  stats: { hp: 215, atk: 116, def: 100, spd: 88 },
  moves: [
    { name: 'Devour', type: 'Spirit', power: 80, acc: 95, pp: 15, effect: { drain: 0.3 } },
    { name: 'Cursed Slam', type: 'Cursed', power: 90, acc: 90, pp: 10 },
    { name: 'Rot Touch', type: 'Cursed', power: 55, acc: 100, pp: 20, effect: { status: 'cursed', chance: 0.4 } },
    { name: 'Harden', type: 'Physical', category: 'status', acc: 100, pp: 10, effect: { stat: 'def', stages: 2, target: 'self', chance: 1 } },
  ],
}

const jogo = {
  key: 'jogo',
  name: 'Jogo',
  kana: '漏瑚',
  types: ['Spirit'],
  color: '#e85d04',
  stats: { hp: 220, atk: 130, def: 98, spd: 104 },
  moves: [
    { name: 'Ember Insects', type: 'Spirit', power: 75, acc: 100, pp: 15, effect: { status: 'cursed', chance: 0.3 } },
    { name: 'Volcano', type: 'Spirit', power: 105, acc: 85, pp: 8 },
    { name: 'Maximum: Meteor', type: 'Cursed', power: 125, acc: 80, pp: 5, effect: { recoil: 0.15 } },
    { name: 'Disaster Plants', type: 'Cursed', power: 70, acc: 100, pp: 15, effect: { stat: 'spd', stages: -1, target: 'foe', chance: 0.4 } },
  ],
  domain: { name: 'Coffin of the Iron Mountain', type: 'Domain', power: 128, pp: 1, flavor: 'A volcano closes over the battlefield.' },
}

const hanami = {
  key: 'hanami',
  name: 'Hanami',
  kana: '花御',
  types: ['Spirit', 'Technique'],
  color: '#52b788',
  stats: { hp: 250, atk: 118, def: 126, spd: 82 },
  moves: [
    { name: 'Wooden Ball', type: 'Spirit', power: 85, acc: 95, pp: 15 },
    { name: 'Root Bind', type: 'Technique', power: 60, acc: 100, pp: 15, effect: { status: 'bound', chance: 0.45 } },
    { name: 'Life Drain', type: 'Spirit', power: 75, acc: 100, pp: 12, effect: { drain: 0.5 } },
    { name: 'Bark Armor', type: 'Physical', category: 'status', acc: 100, pp: 10, effect: { stat: 'def', stages: 1, target: 'self', chance: 1, heal: 0.25 } },
  ],
}

const mahito = {
  key: 'mahito',
  name: 'Mahito',
  kana: '真人',
  types: ['Spirit'],
  color: '#7209b7',
  stats: { hp: 232, atk: 122, def: 104, spd: 110 },
  moves: [
    { name: 'Idle Transfiguration', type: 'Spirit', power: 90, acc: 95, pp: 12, effect: { status: 'cursed', chance: 0.35 } },
    { name: 'Soul Multiplicity', type: 'Spirit', power: 70, acc: 100, pp: 20, priority: 1 },
    { name: 'Body Repel', type: 'Physical', power: 100, acc: 90, pp: 10 },
    { name: 'Reshape', type: 'Cursed', category: 'status', acc: 100, pp: 8, effect: { heal: 0.4 } },
  ],
  domain: { name: 'Self-Embodiment of Perfection', type: 'Domain', power: 135, pp: 1, flavor: 'Every hand in the domain reaches for your soul.' },
}

const geto = {
  key: 'geto',
  name: 'Suguru Geto',
  kana: '夏油 傑',
  types: ['Cursed'],
  color: '#480ca8',
  stats: { hp: 236, atk: 120, def: 112, spd: 104 },
  moves: [
    { name: 'Curse Barrage', type: 'Cursed', power: 85, acc: 100, pp: 15 },
    { name: 'Rainbow Dragon', type: 'Spirit', power: 105, acc: 90, pp: 8 },
    { name: 'Absorb Spirit', type: 'Cursed', power: 70, acc: 100, pp: 15, effect: { drain: 0.5 } },
    { name: 'Uzumaki', type: 'Cursed', power: 130, acc: 80, pp: 5, effect: { recoil: 0.15 } },
  ],
  domain: { name: 'Cursed Spirit Manipulation', type: 'Domain', power: 130, pp: 1, effect: { stat: 'atk', stages: 1, target: 'self', chance: 1 }, flavor: 'A thousand swallowed curses answer at once.' },
}

const sukuna = {
  key: 'sukuna',
  name: 'Ryomen Sukuna',
  kana: '両面宿儺',
  types: ['Domain', 'Physical'],
  color: '#d00000',
  stats: { hp: 288, atk: 138, def: 122, spd: 122 },
  moves: [
    { name: 'Dismantle', type: 'Physical', power: 95, acc: 100, pp: 20 },
    { name: 'Cleave', type: 'Domain', power: 110, acc: 95, pp: 12, highCrit: true },
    { name: 'Open', type: 'Domain', power: 130, acc: 85, pp: 6 },
    { name: 'Reverse Cursed Technique', type: 'Cursed', category: 'status', acc: 100, pp: 5, effect: { heal: 0.45 } },
  ],
  domain: { name: 'Malevolent Shrine', type: 'Domain', power: 142, pp: 1, flavor: 'A shrine of skulls. No barrier, and nowhere outside it is safe.' },
}

export const STAGES = [
  {
    title: 'Stage 1 — Abandoned School',
    blurb: 'Two low-grade curses have nested in the gymnasium.',
    team: [grade3, { ...grade3, name: 'Grade 3 Curse B' }],
    boost: 0,
  },
  {
    title: 'Stage 2 — Juvenile Detention',
    blurb: 'A cursed womb has hatched around a special-grade finger.',
    team: [grade3, fingerBearer],
    boost: 0.05,
  },
  {
    title: 'Stage 3 — Shibuya Station',
    blurb: 'Jogo and Hanami are waiting past the turnstiles.',
    team: [jogo, hanami],
    boost: 0.08,
  },
  {
    title: 'Stage 4 — Sealed Gojo',
    blurb: 'With the strongest sealed, Geto and Mahito close in.',
    team: [mahito, geto],
    boost: 0.10,
  },
  {
    title: 'Stage 5 — The King of Curses',
    blurb: 'Sukuna has taken the vessel. There is no plan for this.',
    team: [sukuna],
    boost: 0.11,
  },
]
