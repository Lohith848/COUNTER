# Project Context: Ring of Dominance Boxing Game

This document preserves the context, architecture, design decisions, and status of the project to ensure seamless future development.

---

## 🔍 Context & Concept
The project is a 2D single-player boxing game titled **Ring of Dominance**, designed to run on desktop and mobile browsers.
* **Player (Akira)**: Controlled by the user via keyboard or on-screen touch buttons. Akira can move left/right, throw a Jab, Hook, or Uppercut, Block, Dodge, or Clinch.
* **Opponent (Ryuga)**: Controlled by an adaptive AI that monitors the player's fight patterns and dynamically counter-strategies.
* **Match Loop**: 3 rounds, each 90 seconds. Win condition is determined by Knockout (KO) or Referee Decision based on health percentage or round wins.

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
* **Build/Dev**: Tested and running stably on Vite dev server on port `3001` (if `3000` is occupied).
