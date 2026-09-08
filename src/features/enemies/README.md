### Enemy & Obstacle System

**Purpose:**
Manages the spawning, movement, and collision detection of enemies (Mughal soldiers) and obstacles (rocks, pitfalls).

**Main files:**
* `EnemyManager.js` → Main controller that handles an object pool of enemies and obstacles, advances them towards the player, and detects collisions.

**How to modify:**
- If you want to change enemy types, colors, or sizes, modify `createEnemy()` and `createObstacle()` in `EnemyManager.js`.
- If you want to change spawn rates or difficulty scaling, modify `update()` in `EnemyManager.js`.

**Dependencies:**
- `THREE.js`
- Requires the `PlayerController.js` instance to calculate distance and collisions.
