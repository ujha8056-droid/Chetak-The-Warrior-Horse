import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { WorldManager } from '../features/environment/WorldManager.js';
import { PlayerController } from '../features/player/PlayerController.js';
import { EnemyManager } from '../features/enemies/EnemyManager.js';

export class Game {
  constructor() {
    this.state = 'start'; // start, playing, gameover
    this.score = 0;
    
    // Camera state
    this.cameraShake = 0;
    this.cameraBobTime = 0;
    this.cameraTarget = new THREE.Vector3();
    this.currentFOV = 60;
    this.currentTilt = 0;
    
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
    this.world = new WorldManager(this.scene);
    this.player = new PlayerController(this.scene);
    this.enemies = new EnemyManager(this.scene, this.player);
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

  updateCamera(delta, gameSpeed) {
    // 1. Base Follow
    const playerX = this.player.group.position.x;
    const playerY = this.player.group.position.y;
    const playerZ = this.player.group.position.z;

    this.cameraTarget.set(playerX * 0.6, 15 + playerY * 0.3, playerZ + 25);
    
    // Jump effect: Follow jump smoothly
    if (this.player.isJumping) {
      this.cameraTarget.y += 2;
    }

    this.camera.position.lerp(this.cameraTarget, 5 * delta);

    // 2. Camera Bob
    if (!this.player.isJumping) {
      this.cameraBobTime += delta * gameSpeed * 15;
      const bobAmount = 0.4 * gameSpeed;
      this.camera.position.y += Math.sin(this.cameraBobTime) * bobAmount * delta;
    }

    // 3. Effects / Shakes
    if (this.player.justDamaged) {
      this.cameraShake = 1.5;
      this.player.justDamaged = false;
    }
    if (this.player.justLanded) {
      this.cameraShake = 0.5;
      this.player.justLanded = false;
    }
    if (this.player.justAttacked) {
      this.cameraShake = 0.4;
      this.camera.position.z -= 1.5; // Slight forward push
      this.player.justAttacked = false;
    }

    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake -= delta * 5;
      if (this.cameraShake < 0) this.cameraShake = 0;
    }

    // 4. LookAt and Tilt
    const lookTarget = new THREE.Vector3(playerX * 0.3, playerY + 2, playerZ - 30);
    this.camera.lookAt(lookTarget);
    
    // Subtly tilt left/right based on lateral movement
    let targetTilt = 0;
    if (this.player.keys.left) targetTilt = 0.03;
    if (this.player.keys.right) targetTilt = -0.03;
    
    // Apply smooth roll
    this.currentTilt = THREE.MathUtils.lerp(this.currentTilt, targetTilt, 5 * delta);
    this.camera.rotateZ(this.currentTilt);

    // 5. Speed-based FOV and Post-processing
    const targetFOV = 60 + (gameSpeed - 1.0) * 10;
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, 2 * delta);
    if (Math.abs(this.camera.fov - this.currentFOV) > 0.1) {
      this.camera.fov = this.currentFOV;
      this.camera.updateProjectionMatrix();
    }
    
    if (this.composer.passes.length > 1) {
      const bloomPass = this.composer.passes[1];
      if (bloomPass.strength !== undefined) {
         bloomPass.strength = 0.4 + (gameSpeed - 1.0) * 0.4;
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = performance.now();
    const delta = (time - this.lastTime) / 1000; // seconds
    this.lastTime = time;
    
    if (this.state === 'playing') {
      // Small passive score increase for surviving
      this.addScore(10 * delta);
      
      // Calculate speed progression (caps at 2.0x base speed)
      const gameSpeed = Math.min(1.0 + (this.score / 1500), 2.0);
      
      this.world.update(delta, this.score, gameSpeed, this.player.group.position);
      this.player.update(delta, this.score, gameSpeed);
      this.enemies.update(delta, this, gameSpeed);
      
      this.updateCamera(delta, gameSpeed);
      
      // Periodically spawn hoof dust when galloping
      if (!this.player.isJumping) {
         if (Math.random() < delta * 6 * gameSpeed) { 
            this.world.spawnHoofDust(
               this.player.group.position.x,
               this.player.group.position.y,
               this.player.group.position.z + 1.5 // Near the back legs
            );
         }
      }
      
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
