# Project Context: Ring of Dominance Boxing Game

This document preserves the context, architecture, design decisions, and status of the project to ensure seamless future development.

---

## 🔍 Context & Concept
The project is a 2D single-player boxing game titled **Ring of Dominance**, designed to run on desktop and mobile browsers.
* **Player (Akira)**: Controlled by the user via keyboard or on-screen touch buttons. Akira can move left/right, throw a Jab, Hook, or Uppercut, Block, Dodge, or Clinch.
* **Opponent (Ryuga)**: Controlled by an adaptive AI that monitors the player's fight patterns and dynamically counter-strategies.
* **Match Loop (Best-of-3)**: Each round is 90 seconds and is won independently by either **Knockout** (opponent health hits 0) or **Time-out Decision** (higher health % when the clock hits 0). The first fighter to win **2 rounds** wins the match (2-0 ends early; otherwise all 3 rounds are played). Between rounds, health/stamina reset (configurable carry-over in `MatchController`).

---

## 🏗️ Technical Stack & Architecture

1. **Phaser 3 (v3.87.0)**: Used as the game engine for rendering, animations, physics (Arcade Physics), and scene management.
2. **Vite**: Modern front-end toolchain for fast builds and hot module replacement.
3. **Web Audio API (Procedural Audio)**: 
   - Instead of static MP3/WAV assets, all sound effects (hits, swooshes, bells, referee voice count) are procedurally generated in code via oscillators, filter nodes, and envelopes.
   - Saves file size, avoids asset loading latency, and allows dynamic variation.
4. **HTML5 Canvas BFS Transparency**:
   - The characters' raw assets (`AKIRA.png` and `RYUGA.png`) originally had solid white backgrounds.
   - At startup, the game draws these onto an offscreen canvas and runs a Breadth-First Search (BFS) starting from the edges, replacing white pixels with transparent ones. This keeps interior white parts (e.g., logos, eyes, or white shorts) intact.

---

## 🧠 Core System Design Details

### 1. Fighter FSM (Finite State Machine)
The state of both characters is managed in `src/entities/Fighter.js` with the following states:
* `IDLE`, `WALK`, `ATTACK`, `BLOCK`, `DODGE`, `HIT`, `KNOCKDOWN`
Each state restricts certain actions (e.g., you cannot walk or attack while in `KNOCKDOWN` or `HIT` stun).

### 2. Adaptive AI (Ryuga)
In `src/ai/RyugaAI.js`, Ryuga doesn't just punch randomly. He has:
* **Rolling Action Buffer**: Stores the player's last 15 actions.
* **Frequency Tuning**: If the buffer contains high ratio of Jabs, `adaptation.blockJabRate` rises. If there is a high ratio of Hooks, `adaptation.dodgeHookRate` rises.
* **Clinch Trigger**: If the player is constantly blocking, Ryuga detects it and clinches to break the guard.
* **Round Scaling**: Each round, the AI's decision tick interval decreases (making him react faster), and stats like speed scale up.

---

### 3. Match Flow (Best-of-3) — `src/match/MatchController.js`
Owns the round lifecycle so `FightScene` stays a thin coordinator:
* Tracks `roundWins` (player/opponent) and a `roundResults` log `[{ round, winner, method }]`.
* `recordRoundResult(winner, method)` awards the just-finished round (KO or DECISION) and returns whether the match is over (first to `roundsToWin`, or all `maxRounds` played).
* `resetFighterForRound(fighter)` re-applies health (full or partial via `roundStartHealthFraction`) and stamina between rounds.
* `getMatchWinner()` resolves the overall winner by round wins (falling back to aggregate landed punches).

### 4. Statistics — `src/utils/statsTracker.js`
Single source of truth for `thrown / landed / jabs / hooks / uppercuts / blocks / dodges` for both fighters. Both `Fighter` instances reference the shared `player` / `opponent` sub-objects, so there is exactly one stats object for the match. `accuracy()` is clamped to 100% to guarantee a valid percentage on the result screen.

## 🔮 Future Feature Ideas & Implementation Guidance

If you are returning to this codebase to add new features, follow these implementation paths:

### 1. Adding a Stamina / Fatigue System for Punching
* **Currently**: Stamina is displayed and drains on blocks/hits, but punches don't drain it.
* **To Implement**:
  - In `src/entities/Fighter.js`, subtract stamina inside `performPunch(type)`.
  - Check if stamina is above a threshold (e.g., 10) before allowing a punch. If too low, trigger a tired state or slower punches.

### 2. Adding Special Moves / Super Meter
* **Concept**: A meter that fills as you land punches, allowing a special "Super Punch".
* **To Implement**:
  - Add a `superMeter` variable to `Fighter.js`.
  - Draw a Super Bar overlay in `src/ui/HUD.js`.
  - Listen for a key (e.g., `S` or a mobile HUD button) that transitions the fighter into a high-damage special attack animation.

### 3. Adding New Opponents / Match Select
* **Concept**: Fighting different characters instead of only Ryuga.
* **To Implement**:
  - Add new character asset configurations in `BootScene.js` and `MenuScene.js`.
  - Create specialized AI profiles (e.g., `KenjiAI.js`, `IvanAI.js`) with different adaptation styles (e.g., aggressive vs. defensive).
  - Update `FightScene.js` to initialize the selected opponent's sprite key and AI controller.

---

## 🚦 Current Status
* **Updated**: Character sprites have been successfully replaced with new high-resolution images (`assets/AKIRA.png` and `assets/RYUGA.png`).
* **Resolved**: Edge transparency BFS flood-fill works perfectly on the new sprites without cutting out internal white details.
* **Match Structure**: Best-of-3 rounds implemented via `MatchController` — KO or time-out decision per round, first to 2 round wins takes the match, animated "ROUND N / 3-2-1-FIGHT" intro cards, and a top-center 3-pip round indicator.
* **HUD Overhaul**: Segmented health meters with green→yellow→red color transition and a white "damage trail", a thinner blue stamina bar, upright per-fighter name plates, and a bold combo counter with a scale-pop animation.
* **Result Screen**: Round-by-round breakdown (e.g. `R1 Akira (KO) • R2 Ryuga (DEC)`), clamped accuracy, and a celebratory victory animation on the winner portrait.
* **Stats**: Single `StatsTracker` source of truth; landed jab/hook/uppercut counts are now recorded on connection.
* **Build/Dev**: Tested and running stably on Vite dev server on port `3000`.
