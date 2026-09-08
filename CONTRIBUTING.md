# Contributing to Chetak - The Warrior Horse

Thank you for contributing! To maintain a clean and professional codebase, please follow these guidelines.

## Getting Started
1. Clone the repo: `git clone <repository_url>`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## "Where should I put this?" Rule
- **New gameplay feature** → `src/features/`
- **Reusable game system/Core logic** → `src/core/`
- **Reusable UI/CSS** → `src/components/ui/`
- **3D models/Images/Icons** → `public/assets/`
- **Documentation** → `docs/`

A new developer should NEVER have to guess where a file belongs.

## Adding a New Feature
1. Create a new folder inside `src/features/`.
2. Add your main controller file using PascalCase (e.g., `NewFeatureManager.js`).
3. Create a `README.md` inside your feature folder explaining its purpose, main files, dependencies, and how to modify it.

## Naming Rules
- **Files/Classes:** PascalCase (e.g. `PlayerController.js`)
- **Functions/Variables:** camelCase (e.g. `initThree()`)
- **Constants:** UPPER_SNAKE_CASE (e.g. `MAX_SPEED`)

## Git Rules
- Keep commits small and descriptive.
- Branch naming convention: `feature/your-feature-name` or `bugfix/issue-name`.
- Update the `CHANGELOG.md` when submitting a Pull Request.
