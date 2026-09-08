# Project Architecture

## 1. Project Overview
This project is an endless-runner style 3D game named "Chetak - The Warrior Horse". The player controls Maharana Pratap riding Chetak through dynamically generated terrain, dodging obstacles, and defeating enemies.

## 2. Technology Stack
* **Core:** Vanilla JavaScript (ES6 Modules)
* **Graphics:** Three.js (WebGL rendering, 3D math, materials)
* **Styling:** Vanilla CSS
* **Build Tool:** Vite

## 3. Folder Structure
```text
PROJECT_ROOT/
├── docs/                   # Documentation and guides
│   ├── architecture/       # Architecture maps
│   └── development/        # Developer onboarding guides
├── public/                 # Static assets (images, icons)
├── src/
│   ├── components/ui/      # CSS and UI elements
│   ├── core/               # Core game loop and state management
│   ├── features/           # Game features (player, enemies, environment)
│   └── main.js             # Application entry point
├── index.html              # Main HTML container and UI layout
├── package.json            # Node dependencies
└── vite.config.js          # Vite build configuration (if any)
```

## 4. Main Systems
- **Core (`Game.js`)**: Manages the main game loop, initializes Three.js, handles game states (start, playing, gameover), and delegates updates to features.
- **Player (`PlayerController.js`)**: Handles input (A/D/W/Space), jump physics, health tracking, combat logic, and meshes.
- **Environment (`WorldManager.js`)**: Procedurally generates the terrain chunks, moves them to simulate speed, and handles lighting.
- **Enemies (`EnemyManager.js`)**: Spawns and recycles enemies/obstacles using an object pool pattern and calculates collisions against the player.

## 5. Data Flow
```text
DOM Load -> main.js -> instantiates Game -> Game.js setup
Game Loop:
   Game.animate()
     ↓
   WorldManager.update(delta, score)  -> updates terrain colors/shapes
     ↓
   PlayerController.update(delta, score) -> handles input, jump physics, collision bounding
     ↓
   EnemyManager.update(delta, gameContext) -> moves obstacles, checks intersections -> Game.addScore() or Player.takeDamage()
     ↓
   ThreeJS Render Pass
```

## 6. Where new features should be added
- **New Gameplay feature**: `src/features/`
- **New UI styles**: `src/components/ui/`
- **Core system changes**: `src/core/`
- **Assets**: `public/assets/`

## 7. Development Rules
- One responsibility per file.
- Do not mix logic in `Game.js`. If logic grows large, extract it into a feature folder.
- Always use PascalCase for classes (`PlayerController.js`) and camelCase for methods/variables.
