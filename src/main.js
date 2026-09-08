import './components/ui/style.css';
import { Game } from './core/Game.js';

// Start game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
