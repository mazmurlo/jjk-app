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
code in.

The host's browser is authoritative: it owns the random number generator, runs
`resolveTurn`, and ships the resulting animation frames to the guest, who just
plays them back. That makes desync impossible — there is only ever one
simulation.

There are two interchangeable transports, chosen at build time:

| Transport | When | Trade-off |
| --- | --- | --- |
| **WebRTC** (default) | `VITE_RELAY_URL` unset | No server to run, but can fail behind strict campus/corporate NATs |
| **Relay** | `VITE_RELAY_URL` set | Works everywhere; you host the small server in `server/` |

### Running the relay

```bash
cd server && npm install && npm start   # listens on :8787
```

Then build the frontend with `VITE_RELAY_URL=ws://localhost:8787`. For a hosted
version, `render.yaml` deploys `server/` on Render's free tier; point
`VITE_RELAY_URL` at `wss://<your-service>.onrender.com`. In CI, set a repository
variable named `VITE_RELAY_URL` and the workflow picks it up.

The relay is deliberately dumb: it pairs two sockets by room code and forwards
bytes. It has no idea what a cursed technique is, stores nothing, and keeps no
state once both players leave.

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
| `src/net/connection.js` | Transport layer — relay and WebRTC |
| `src/Registry.jsx` | Character browser |
| `server/index.js` | Two-seat WebSocket relay |

The engine is framework-free and returns arrays of state snapshots, which is why
it can be simulated headlessly in Node and replayed over the network unchanged.

## Images

Character portraits in `src/assets/characters/` were pulled from the
[Jujutsu Kaisen Wiki](https://jujutsu-kaisen.fandom.com/) via its public API.
They are screenshots from the anime and remain the copyright of Gege Akutami,
Shueisha, and MAPPA — reproduced here under fair use for a non-commercial fan
project, not licensed with this repository's code. If you fork this for anything
public-facing or commercial, replace them.

Re-download them at any time with `node scripts/fetch-images.mjs`.

---

Jujutsu Kaisen is created by Gege Akutami. This is an unofficial fan project.
