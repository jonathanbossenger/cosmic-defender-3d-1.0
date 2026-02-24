# Cosmic Defender 3D

A first-person wave-based shooter built with Three.js and Vite.

## History

- https://github.com/jonathanbossenger/cosmic-defender-3d-0.1/
- https://github.com/jonathanbossenger/cosmic-defender-3d-0.2/
- https://jonathanbossenger.com/a-year-of-progress-ai-agentic-coding-and-the-cosmic-defender-experiment/

## Features

- First-person shooter controls
- Wave-based enemy spawning with increasing difficulty
- Two enemy types: drones and soldiers
- Weapon system with shooting mechanics and reload
- Combo multiplier system for consecutive kills
- Procedural audio via Web Audio API (no audio files)
- DOM-based HUD and menus
- High score persistence via localStorage

## Technologies Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Frontend build tool

## Project Structure

```
cosmic-defender-3d/
├── index.html              # Main HTML file with inline UI/HUD
├── package.json            # Project dependencies
├── vite.config.js          # Vite configuration
└── src/                    # Source code
    ├── main.js             # Entry point
    ├── Game.js             # Central game orchestrator and loop
    ├── core/               # Input handling and audio
    ├── entities/           # Player, enemies, projectiles, weapon
    ├── systems/            # Combat, particles, wave management
    ├── ui/                 # HUD and screen management
    └── world/              # Arena geometry
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jonathanbossenger/cosmic-defender-3d.git
   cd cosmic-defender-3d
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Game Controls

- **W, A, S, D** - Move
- **Mouse** - Look around
- **Left Click** - Shoot
- **R** - Reload
- **Escape** - Pause

## Building for Production

To build the game for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Three.js examples](https://threejs.org/examples/) for inspiration
