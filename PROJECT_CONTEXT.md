# Project Context: Ring of Dominance Boxing Game

This document preserves the context, architecture, design decisions, and status of the project to ensure seamless future development.

---

## 🔍 Context & Concept
The project is a 1-vs-1 boxing game titled **Ring of Dominance**, designed to run on desktop and mobile browsers.
* **Player (Akira)**: Controlled via keyboard (WASD move, J/K/L punches, Space block, Shift+Space dodge, E clinch) or on-screen touch buttons.
* **Opponent (Ryuga)**: Controlled by an adaptive AI (`src/ai/RyugaAI.js`) that watches the player's fight patterns and counter-strategizes.
* **Match Loop (Best-of-3)**: Each round is 90 seconds, won by **Knockout** (health hits 0) or **Decision** (higher health % at the bell). First to 2 round wins takes the match. Health/stamina reset between rounds via `MatchController`.

### What changed (3D conversion)
The fighters are **no longer flat images**. They are procedural **3D rigged boxers** rendered by Three.js in a layer behind a transparent Phaser canvas:

| Layer | Engine | Responsibility |
| :--- | :--- | :--- |
| `#three-layer` | **Three.js** (r185) | 3D ring, fighters with real joints, lights, shadows, sparks, camera |
| `#app` (transparent Phaser canvas) | **Phaser 4.2.1** | HUD bars, menus, round cards, floating text, touch UI, input, audio, match flow |
| Logic | Phaser-agnostic modules | AI (`RyugaAI`), `MatchController`, `StatsTracker`, `SoundSynth` — unchanged |

---

## 🏗️ Technical Stack & Architecture

1. **Phaser 4.2.1**: Scene management, 2D HUD/UI overlays, input, tween/clock for round cards & floaty text. Config uses `transparent: true` + zero-alpha background so the 3D layer shows through.
2. **Three.js ^0.185**: WebGL renderer inside `#three-layer` (see `index.html`). Both layers share a logical 1280×720 space: `worldX = screenX - 640`, `worldZ = screenY - 560`, fighters stand on the floor (worldY = 0).
3. **Procedural 3D characters** — `src/three3d/Boxer3D.js`:
   - Humanoid built from primitive boxes/spheres with named pivot groups:
     `shoulder/elbow/wrist` per arm, `hip/knee/ankle` per leg, plus `torso`,
     `head`, `hips`. Right limbs are authored once (they need no mirroring —
     forward swings use the symmetric lateral z-axis; per-side signs handle
     lateral spreads).
   - Joint rotation conventions: `rotation.z` swings a hanging limb forward
     (+x) when positive; knee flexion is negative-z; torso lean forward is
     negative-z torso rotation. Guard stance is the neutral pose; every
     action (jab/hook/uppercut/block/dodge/clinch/stagger/KO/victory) sets
     joint targets that ease in with exponential smoothing.
   - Facing is a yaw on `body`; knockdowns roll `pose` (inner group) so a
     mirrored fighter still falls toward his own corner.
4. **Image → 3D step**: `BootScene` BFS-cleans the white background of
   `AKIRA.png`/`RYUGA.png`; `src/three3d/faceCrop.js` crops the head region
   and maps it onto the rig's skull, angled toward the camera.
5. **Entity layer** — `src/three3d/Fighter3D.js` (base), `Player3D.js`,
   `Opponent3D.js`: expose the same combat API the old sprite fighters had,
   so `HUD`, `RyugaAI`, `MatchController` and `FightScene` logic mostly
   carried over. `x/y` stay in classic ring px; `facing` (±1) replaces
   `flipX`. Combat ranges were retuned to measured 3D reach
   (`PUNCH_RANGE` in FightScene; AI thresholds in RyugaAI).
6. **Web Audio API**: all sound effects are synthesized in code
   (`src/utils/SoundSynth.js`) — no audio files.
7. **img2threejs vendored at `tools/img2threejs`**: reference pipeline for
   turning the character images into animation-ready procedural models
   (Claude Code / Codex agent skill). Current rigs already follow the same
   code-only, pivot-exposed philosophy; a future pass can adopt its
   generated factories directly inside `Boxer3D`.

---

## 🧠 Core Systems (unchanged behaviour)

### 1. Fighter state & damage (`Fighter3D.js` — was `Fighter.js`)
States: `IDLE/WALK/ATTACK/BLOCK/DODGE/STAGGER/KNOCKDOWN/CLINCH`. Rules are
preserved: no actions while stunned/KO'd, blocks mitigate ~90%, dodges give
brief immunity, stamina gates actions, health at 0 → `knockout()` →
referee count → round to the standing fighter.

### 2. Adaptive AI (Ryuga) — `src/ai/RyugaAI.js`
Rolling 15-action buffer of the player; jab-spam raises `blockJabRate`,
hook-spam raises `dodgeHookRate`, uppercut-spam raises `blockUppercutRate`,
block-turtling triggers clinch attempts; round difficulty scales reaction
time & aggression. Distances are tuned for the 3D rigs (engage band
~90..300 px centre-to-centre).

### 3. Match flow — `src/match/MatchController.js`
Round wins/results log, health reset per round (`roundStartHealthFraction`),
KO/DECISION round resolution, best-of-3 end conditions, fallback to
aggregate landed punches on ties.

### 4. Statistics — `src/utils/statsTracker.js`
Single source of truth for thrown/landed/jabs/hooks/uppercuts/blocks/dodges,
shared by both fighters; accuracy clamped ≤ 100 % for the result screen.

---

## 📐 Coordinate cheat sheet (3D world)

- Classic 2D plane: x ∈ [100, 1180], y ∈ [445, 670] (movement bounds).
- 3D: `wx = x - 640`, `wz = y - 560`, up = `wy`; camera at
  `(0, 380, 850)` looking at `(0, 250, -60)` (fov 46).
- Screen-space helpers for HUD-anchored FX: `Fight3D.toScreen(worldPos)`
  and `Fight3D.toWorld(x2d, y2d, height)`.
- Ring ropes/posts at ±760/±430 world px; mat roughly x ±690, z ±300.

---

## 🚦 Current Status
* Fighters are 3D rigs with real hand/leg movement; all moves verified
  numerically (glove reach measured ~245 px from centre at full jab).
* Round flow, HUD health bars (damage trail), KO-at-zero-health, time-out
  decisions, result screen and AI all functional in the 3D build.
* Build (`npm run build`) passes; dev server runs on port 3000.

## 🔮 Future Feature Ideas
* **Body/head hit zones** — branch damage by which glove-part connects.
* **Stamina drain on punches** + tired (slower) state (noted in original
  design, still unimplemented).
* **Special / super meter** (noted in original design).
* **New opponents** — add `BotX` rig palettes in `Boxer3D` and AI profiles
  derived from `RyugaAI`.
* **img2threejs factories** — swap `Boxer3D` internals with skill-generated
  model factories for higher-fidelity fighters (see `tools/img2threejs`).
* **Broadcast polish** — ring-card walkouts, corner men, slow-mo replay on
  KO, crowd particles.
