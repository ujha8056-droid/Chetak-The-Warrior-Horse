import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { World } from './world';
import { Player } from './player';
import { Enemies } from './enemies';

class Game {
  constructor() {
    this.state = 'start'; // start, playing, gameover
    this.score = 0;
    
    this.initThree();
    this.initGameObjects();
    this.initUI();
    
    this.lastTime = performance.now();
    this.animate();
  }

  initThree() {
    this.canvas = document.getElementById('gameCanvas');
    
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position camera behind and slightly above the player
    this.camera.position.set(0, 15, 45);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Post-processing setup
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
    bloomPass.threshold = 0.5;
    bloomPass.strength = 0.4;
    bloomPass.radius = 0.5;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initGameObjects() {
    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.enemies = new Enemies(this.scene, this.player);
  }

  initUI() {
    this.screens = {
      start: document.getElementById('start-screen'),
      hud: document.getElementById('hud-screen'),
      gameover: document.getElementById('game-over-screen')
    };
    
    this.uiElements = {
      score: document.getElementById('score-display'),
      finalScore: document.getElementById('final-score-display'),
      healthFill: document.getElementById('health-fill')
    };
    
    document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
  }
  
  showScreen(screenName) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.uiElements.score.innerText = '0';
    
    // Reset player
    this.player.reset();
    
    // Reset enemies
    this.enemies.reset();
    
    this.showScreen('hud');
    this.lastTime = performance.now();
  }

  gameOver() {
    this.state = 'gameover';
    this.uiElements.finalScore.innerText = Math.floor(this.score);
    this.showScreen('gameover');
  }

  addScore(amount) {
    this.score += amount;
    this.uiElements.score.innerText = Math.floor(this.score);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = performance.now();
    const delta = (time - this.lastTime) / 1000; // seconds
    this.lastTime = time;
    
    if (this.state === 'playing') {
      // Small passive score increase for surviving
      this.addScore(10 * delta);
      
      this.world.update(delta, this.score);
      this.player.update(delta, this.score);
      this.enemies.update(delta, this);
      
      if (this.player.health <= 0) {
        this.gameOver();
      }
    } else {
      // In menus, still animate the world slowly for a nice background effect
      this.world.update(delta * 0.2); 
    }
    
    // Use composer instead of renderer
    this.composer.render();
  }
}

// Start game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
