# Ring of Dominance

A fully playable, highly responsive, and premium 2D single-player boxing game built in **Phaser 3** and bundled with **Vite**. The game features **Akira** as the player-controlled character and **Ryuga** as an adaptive AI opponent who learns from player behaviors.

---

## 🥊 Features

1. **High-Fidelity Assets with Canvas Processing**:
   - High-resolution sprites for **Akira** and **Ryuga**.
   - Automatic edge-based BFS flood-fill background removal performed at load time (`BootScene.js`), dynamically removing white backgrounds while preserving character details (like shorts shading).
2. **Adaptive AI System (Ryuga)**:
   - Ryuga keeps a rolling memory of the player's last 15 actions (Jabs, Hooks, Uppercuts, Blocks, Dodges).
   - Dynamically adapts defense rates (blocking/dodging) and aggression based on player attack distributions.
   - AI difficulty (reaction times, health/stamina parameters, aggression) scales upward across consecutive rounds.
3. **Web Audio Sound Synthesis**:
   - Zero-asset synthesized audio effects using the HTML5 **Web Audio API** (`SoundSynth.js`).
   - Dynamically generates custom soundwaves for jabs, hooks, uppercuts, successful blocks, dodges, knockdowns, referee counts, and the round bell.
4. **Dual Controls & Fully Responsive Layout**:
   - **Desktop Controls**: Keyboard input (Arrow keys / WASD for movement, J/K/L for Jabs/Hooks/Uppercuts, I for Block, O for Dodge, Space for Clinch).
   - **Mobile Touch Controls**: On-screen dynamic action buttons and directional controls (`TouchControls.js`).
   - Automatically fits the viewport with Phaser's scale manager.

---

## 📁 Project Structure

```bash
COUNTER/
├── public/
│   ├── assets/
│   │   ├── AKIRA.png       # Player spritesheet/image
│   │   ├── RYUGA.png       # AI Opponent spritesheet/image
│   │   └── ring.jpg        # Boxing ring background image
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── ai/
│   │   └── RyugaAI.js      # Adaptive pattern-matching AI logic
│   ├── entities/
│   │   ├── Fighter.js      # Base class with FSM (states, actions, physics, stats)
│   │   ├── Opponent.js     # Opponent class representing Ryuga
│   │   └── Player.js       # Player class representing Akira (Keyboard/Touch input)
│   ├── scenes/
│   │   ├── BootScene.js    # Loading screen & BFS transparency processor
│   │   ├── FightScene.js   # Match engine (referee loop, scoring, rounds, game states)
│   │   ├── MenuScene.js    # Cinematic main menu with animated character previews
│   │   └── ResultScene.js  # End-of-match screens (Statistics, victory/defeat splash)
│   ├── ui/
│   │   ├── HUD.js          # Health bars, stamina bars, round clock, and messages
│   │   └── TouchControls.js# On-screen buttons for touch devices
│   ├── utils/
│   │   └── SoundSynth.js   # Procedural Web Audio API sound synthesizer
│   └── main.js             # Phaser game configuration and entry point
├── index.html              # HTML shell
├── package.json            # NPM dependencies & scripts
└── vite.config.js          # Vite server configuration
```

---

## 🎮 Game Controls

| Action | Desktop Keyboard | Mobile Touch Screen |
| :--- | :--- | :--- |
| **Move Left / Right** | Left Arrow / `A` / `D` | Left & Right Arrow Buttons |
| **Jab Punch** | `J` | **JAB** Button |
| **Hook Punch** | `K` | **HOOK** Button |
| **Uppercut Punch** | `L` | **UPPER** Button |
| **Block** | `I` | **BLOCK** Button |
| **Dodge** | `O` | **DODGE** Button |
| **Clinch** | `Space` | **CLINCH** Button (Visible when close) |

---

## 🛠️ How It Works

### 1. The Adaptive AI (`RyugaAI.js`)
Ryuga monitors your patterns over a rolling window. If you spam **Jabs**, Ryuga's `adaptation.blockJabRate` rises. If you rely too much on **Hooks**, his `adaptation.dodgeHookRate` increases. If you hold **Block** continuously, he will attempt to **Clinch** you to break your guard.
The difficulty adjusts based on the round number:
- **Round 1**: Base difficulty (slower response time, moderate aggression).
- **Round 2**: Fast-paced AI with higher movement speeds and punch recovery rates.
- **Round 3**: Max difficulty (Ryuga is aggressive, reacts faster to your strikes, and blocks efficiently).

### 2. Audio Synthesis (`SoundSynth.js`)
Since there are no audio asset files, the game utilizes the browser's Web Audio API context. When an action occurs, the synthesizer programmatically configures oscillators, gain nodes, and filters:
- **Punches**: Low-pass noise filters mixed with a brief sine wave drop (creating a thudding "hit" sound).
- **Dodges**: A high-frequency pitch sweep simulating a wind-whoosh.
- **Bell**: Frequency combinations of dual sine waves with slow decay to ring the round bell.

### 3. BFS Background Removal (`BootScene.js`)
To avoid using raw white backgrounds on sprites, `BootScene.js` reads `AKIRA.png` and `RYUGA.png`, draws them onto an offscreen HTML5 Canvas, and executes a Breadth-First Search starting from the border pixels. Pure white pixels connected to borders are turned fully transparent, leaving character graphics perfectly isolated.

---

## 🚀 Running the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [NPM](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Lohith848/COUNTER.git
   cd COUNTER
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open the displayed URL (usually `http://localhost:3000` or `http://localhost:3001`) in your browser.

4. Build for production:
   ```bash
   npm run build
   ```
   This generates optimized static files inside the `dist/` directory.

---

## 🔮 Future Development & Customization Notes

If you are expanding this project in the future, keep these architecture guidelines in mind:
* **Adding New Punches**: Add the punch key state inside `Fighter.js` under the states list, and define corresponding hitboxes and durations inside the fighter's frame timers.
* **Expanding Sound Effects**: Add sound definitions inside `SoundSynth.js` by calling `this.ctx.createOscillator()` and combining with dynamic gain ramps (`linearRampToValueAtTime`).
* **AI Customization**: Adjust Ryuga's response timings, decision intervals, and weight parameters in `RyugaAI.js`. You can increase the memory buffer size `maxHistorySize` to track longer player pattern histories.
