# Jujutsu Kaisen — Sorcerer Registry & Battle Game

A fan-made React app with three modes:

- **Gauntlet** — single-player, five stages against the AI, ending with Sukuna.
- **Versus** — play a friend online, browser to browser.
- **Registry** — browsable character cards.

## Running locally

```bash
npm install
npm run dev
```

## Playing online

One player creates a room and gets a five-character code; the other types that
code in. The two browsers connect directly over WebRTC — the only server
involved is a matchmaking broker that introduces the two peers and then drops
out. No game state is stored anywhere.

The host's browser is authoritative: it owns the random number generator, runs
`resolveTurn`, and ships the resulting animation frames to the guest, who just
plays them back. That makes desync impossible — there is only ever one
simulation.

Versus play differs from the gauntlet in two ways: the whole roster is available
to both sides (including Gojo, who is otherwise unlocked by clearing the
gauntlet), and when a sorcerer is knocked out the next one comes in
automatically for both players.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
After the first push, enable it once:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

The site then lands at `https://<username>.github.io/<repo>/`. Asset paths are
relative (`base: './'` in `vite.config.js`), so the repo can be named anything.

Note that GitHub Pages requires a **public** repository on free accounts.

## Layout

| Path | Purpose |
| --- | --- |
| `src/game/data.js` | Type chart, roster, enemies, stage definitions |
| `src/game/engine.js` | Pure battle logic — damage, turn order, effects, AI |
| `src/game/BattleView.jsx` | Battle screen, drawn from either side's perspective |
| `src/game/Battle.jsx` | Single-player wrapper |
| `src/game/Online.jsx` | Versus lobby and networked match |
| `src/net/connection.js` | WebRTC peer setup |
| `src/Registry.jsx` | Character browser |

The engine is framework-free and returns arrays of state snapshots, which is why
it can be simulated headlessly in Node and replayed over the network unchanged.

---

Jujutsu Kaisen is created by Gege Akutami. This is an unofficial fan project.
