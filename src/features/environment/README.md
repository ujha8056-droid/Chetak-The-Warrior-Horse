### Environment System

**Purpose:**
Generates and manages the infinite 3D terrain, procedural geometry, lighting, sky, and particles.

**Main files:**
* `WorldManager.js` → Creates the lighting, particles, and recycles terrain chunks to simulate infinite running.

**How to modify:**
- If you want to change lighting, fog, or sky color, modify `initLighting()` and `initSkybox()` in `WorldManager.js`.
- If you want to change the procedural terrain shape or color transitions based on score, modify `update()` in `WorldManager.js`.

**Dependencies:**
- `THREE.js`
