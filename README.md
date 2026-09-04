# Ring of Dominance — 90s Retro Arcade 3D Boxing Game

A fully playable 90s Retro Arcade 3D boxing game built on **Three.js** and **Phaser 4**. Features high-fidelity procedural 3D anatomical characters with realistic boxing kinematics (footwork, jabs, hooks, uppercuts, special moves, slips, blocks, and 10-count knockdowns), a 100% procedural 3D championship arena with dynamic lighting and camera flashbulbs, and retro arcade synthesizer audio.

Play as **Akira** and fight **Ryuga**, the adaptive AI champion who counters your patterns across a Best-of-3 Championship Match.

---

## 🥊 Features

1. **High-Fidelity Procedural 3D Characters (`src/three3d/Boxer3D.js`)**
   - Anatomical muscular body (pecs, abs, deltoids, biceps, quads, calves).
   - 3D sculpted heads with stylized 90s anime hair, 3D curved boxing gloves, satin trunks with champion belts, and high-top boots.
   - Dynamic footwork step-drag shuffle, weight distribution shifts, and lead-foot planting.
   - Snapping Jabs, Rotational Power Hooks, Crushing Uppercuts, and Cinematic Super Special Moves with spinning energy aura.
2. **90s Championship Arena (`src/three3d/Ring3D.js` + `Fight3D.js`)**
   - 100% procedural canvas mat with retro championship decals and Red/Blue corner accents (no external `ring.jpg` image).
   - Unobstructed 1st-person POV view (foreground ropes removed, side and back ropes preserved).
   - 4 steel posts with padded corner protectors and turnbuckles.
   - Dynamic overhead lighting truss with moving searchlights and 36 audience flashbulbs.
   - Comic arcade hit sparks and expanding shockwave blast rings.
3. **90s Retro Arcade Audio Engine (`src/utils/SoundSynth.js`)**
   - Synthesized live with Web Audio API (zero audio files needed).
   - Crisp snapping jab cracks, resonant hook thuds, explosive uppercut crashes, and super move charge sweeps.
   - 90s arcade announcer voice stings ("ROUND 1", "FIGHT!", "KO!", "WINNER!"), rhythmic fight beats, and dual ring bells.
4. **Dynamic Health, Stamina & Super Meter HUD (`src/ui/HUD.js`)**
   - Segmented glowing health bars with smooth damage-trail decay and danger pulse (<25%).
   - Glowing Super Meter that fills on hits and damage; pulses `★ MAX READY! ★` when ready.
   - Round victory indicator stars, central arcade timer, and bouncy combo counter popups.
5. **Best-of-3 Championship Loop (`src/scenes/FightScene.js` & `MatchController.js`)**
   - 3 rounds with animated round cards ("ROUND 1", "ROUND 2", "FINAL ROUND", "3.. 2.. 1.. FIGHT!").
   - Referee 10-count Knockdown sequence and timeout decision resolutions.
6. **Adaptive AI Brain (`src/ai/RyugaAI.js`)**
   - Evaluates distances and tracks player attack habits.
   - Dynamically reacts with high guard blocks, slip dodges, counter-punches, and AI special moves in rounds 2 and 3.
7. **New 90s Arcade Scenes**
   - **Boot Scene**: Flashing arcade boot sequence + VS match-up screen with character stat cards.
   - **Menu Scene**: Neon glowing title `"RING OF DOMINANCE"`, controls guide, and "INSERT COIN / START".
   - **Result Scene**: Arcade victory declaration, performance rank grade (`S`, `A`, `B`, `C`, `D`), and punch statistics table.

---

## 🎮 Controls

| Action | Desktop Keyboard | Mobile Touch |
| :--- | :--- | :--- |
| **Move in the ring** | `W`, `A`, `S`, `D` or Arrow Keys | Left Virtual Joystick |
| **Snapping Jab** | `J` | **JAB** (Green) |
| **Power Hook** | `K` | **HOOK** (Orange) |
| **Uppercut Drive** | `L` | **UPPR** (Pink) |
| **SUPER SPECIAL MOVE**| `U` or `I` | **SUPER** (Cyan Glow) |
| **High Guard Block** | `Space` | **GUARD** (Blue) |
| **Slip & Roll Dodge** | `Shift` | **SLIP** (Purple) |
| **Clinch Push** | `E` | **CLNC** (Teal) |
| **Pause Game** | `ESC` | Pause Button |

---

## 📁 Project Structure

```text
├── src/
│   ├── three3d/                   # 3D Layer (Three.js)
│   │   ├── Boxer3D.js             # Procedural 3D anatomical boxer rig & kinematics
│   │   ├── Fighter3D.js           # Combat logic, Super Meter, damage mitigation
│   │   ├── Player3D.js            # Keyboard & mobile touch input handler
│   │   ├── Opponent3D.js          # AI fighter entity
│   │   ├── Fight3D.js             # WebGL renderer, camera dynamics & VFX
│   │   └── Ring3D.js              # Procedural championship arena & lighting
│   ├── scenes/
│   │   ├── BootScene.js           # 90s arcade boot & VS showdown screen
│   │   ├── MenuScene.js           # Title screen, controls guide, start trigger
│   │   ├── FightScene.js          # 3-round match flow, combat loop, referee KO
│   │   └── ResultScene.js         # Victory presentation, rank grades, punch analytics
│   ├── ai/RyugaAI.js              # Adaptive pattern-counter AI brain
│   ├── ui/
│   │   ├── HUD.js                 # 90s retro health bars, super meter, round stars
│   │   └── TouchControls.js       # Virtual joystick & diamond arcade buttons
│   ├── match/MatchController.js   # Best-of-3 round tracking & resets
│   ├── utils/
│   │   ├── SoundSynth.js          # 90s retro audio synthesis engine
│   │   └── statsTracker.js        # Fight analytics & accuracy tracking
│   └── main.js                    # Phaser game instance (transparent canvas)
└── index.html                     # Responsive layout & 90s CRT scanline overlay
```

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```
