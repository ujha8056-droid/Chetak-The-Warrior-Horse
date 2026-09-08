# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Refactored
- Complete architectural restructuring of the project.
- Extracted `Game` class into `src/core/Game.js`.
- Moved `player.js` to `src/features/player/PlayerController.js`.
- Moved `enemies.js` to `src/features/enemies/EnemyManager.js`.
- Moved `world.js` to `src/features/environment/WorldManager.js`.
- Moved `style.css` to `src/components/ui/style.css`.
- Reorganized public assets into `public/assets/images` and `public/assets/icons`.

### Removed
- Unused Vite boilerplate files (`counter.js`, `vite.svg`, `javascript.svg`).
- Redundant assets (`hero.png`).

### Added
- Comprehensive project documentation in `docs/`.
- `CONTRIBUTING.md` and `CHANGELOG.md`.
