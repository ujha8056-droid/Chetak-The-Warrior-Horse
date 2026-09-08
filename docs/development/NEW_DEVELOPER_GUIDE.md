# New Developer Guide

Welcome to the Chetak - The Warrior Horse project! This guide will help you understand the project quickly.

## Where do I start?

### Step 1
Clone the repository to your local machine.

### Step 2
Install dependencies by running:
```bash
npm install
```

### Step 3
Run the project using Vite:
```bash
npm run dev
```
Open the provided localhost URL in your browser.

### Step 4
Understand the architecture by reading `docs/architecture/PROJECT_ARCHITECTURE.md`.

### Step 5
Understand the main game loop. Look at `src/core/Game.js`. This file bootstraps the application and handles the `animate()` loop.

### Step 6
Find the player system. Head to `src/features/player/PlayerController.js`.

### Step 7
Find the enemies system. Head to `src/features/enemies/EnemyManager.js`.

### Step 8
Find the environment system. Head to `src/features/environment/WorldManager.js`.

### Step 9
Make your first small change. Try changing the horse speed in `PlayerController.js` or the sky color in `WorldManager.js`.

## "I want to change X — where should I go?"

- **Change player movement or horse behavior**
  → `src/features/player/PlayerController.js`

- **Change enemy speed or collision logic**
  → `src/features/enemies/EnemyManager.js`

- **Change the terrain shape or colors**
  → `src/features/environment/WorldManager.js`

- **Change the start screen or UI layout**
  → `index.html` and `src/components/ui/style.css`

- **Change game rendering settings (bloom, shadows)**
  → `src/core/Game.js`
