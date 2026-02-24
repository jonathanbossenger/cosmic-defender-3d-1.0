# 3D Shooter Game

A 3D first-person shooter game built with Three.js, Cannon.js for physics, and Vite for building.

## History

- https://github.com/jonathanbossenger/cosmic-defender-3d-0.1/
- https://github.com/jonathanbossenger/cosmic-defender-3d-0.2/

## Features

- First-person shooter controls
- Physics-based gameplay using Cannon.js
- Realistic 3D environment with lighting and shadows
- Weapon system with shooting mechanics
- Performance monitoring with Stats.js
- Debug UI with Tweakpane

## Technologies Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [Cannon.js](https://schteppe.github.io/cannon.js/) - Physics engine
- [Vite](https://vitejs.dev/) - Frontend build tool
- [GSAP](https://greensock.com/gsap/) - Animation library
- [Tweakpane](https://cocopon.github.io/tweakpane/) - Debug UI
- [Stats.js](https://github.com/mrdoob/stats.js/) - Performance monitoring

## Project Structure

```
3d-shooter-game/
├── index.html              # Main HTML file
├── package.json            # Project dependencies
├── src/                    # Source code
│   ├── js/                 # JavaScript files
│   │   ├── components/     # Game components
│   │   ├── controls/       # Player controls
│   │   ├── enemies/        # Enemy logic
│   │   ├── physics/        # Physics system
│   │   ├── scenes/         # Game scenes
│   │   ├── utils/          # Utility functions
│   │   ├── weapons/        # Weapon system
│   │   └── main.js         # Main entry point
│   └── assets/             # Game assets
│       ├── models/         # 3D models
│       ├── textures/       # Textures
│       └── sounds/         # Sound effects
└── public/                 # Static files
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/3d-shooter-game.git
   cd 3d-shooter-game
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Game Controls

- **W, A, S, D** - Move
- **Mouse** - Look around
- **Left Click** - Shoot
- **R** - Reload
- **Space** - Jump

## Building for Production

To build the game for production:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Future Improvements

- Add more weapon types
- Implement enemy AI
- Add game levels
- Implement scoring system
- Add sound effects and music
- Create a main menu

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Three.js examples](https://threejs.org/examples/) for inspiration
- [Cannon.js documentation](https://schteppe.github.io/cannon.js/docs/) for physics implementation 
