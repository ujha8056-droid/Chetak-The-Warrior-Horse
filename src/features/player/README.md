### Player System

**Purpose:**
Controls the player's main character (horse and rider) movement, jumping, combat actions, health, and animations.

**Main files:**
* `PlayerController.js` → Main player controller holding horse and rider state, mesh construction, and physics updates.

**How to modify:**
- If you want to change the horse movement or jump mechanics, update the `update()` and `jump()` functions in `PlayerController.js`.
- If you want to change the mesh (e.g. change rider's armor or horse's color), modify `initMesh()` in `PlayerController.js`.

**Dependencies:**
- `THREE.js`
- Requires DOM `health-fill` element for UI health updates.
