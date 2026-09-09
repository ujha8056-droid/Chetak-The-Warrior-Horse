import * as THREE from 'three';
import { SceneryManager } from './SceneryManager.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.terrainChunks = [];
    this.chunkSize = 200;
    this.chunkSpeed = 50; // Speed at which the terrain moves towards the player

    this.initLighting();
    this.initSkybox();
    this.initParticles();
    this.initHoofDust();
    
    this.sceneryManager = new SceneryManager(this.scene);
    
    // Create initial terrain chunks
    for (let i = 0; i < 3; i++) {
      this.createTerrainChunk(i * -this.chunkSize);
    }
  }

  initLighting() {
    // Hemisphere light for natural sky/ground gradient
    const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x8b5a2b, 0.6);
    this.scene.add(hemiLight);

    // Directional light casting shadows (The hot sun)
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(100, 200, -50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);
    
    // Add a rich golden fog for the "haldi" atmosphere
    this.scene.fog = new THREE.FogExp2(0xd4af37, 0.0035);
  }

  initSkybox() {
    this.scene.background = new THREE.Color(0xf4b752); // Sunset/golden hour sky
  }

  initParticles() {
    // Dust particles
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150; // x
      positions[i + 1] = Math.random() * 20;      // y
      positions[i + 2] = (Math.random() - 0.5) * 150; // z
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xc49d29,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  initHoofDust() {
    this.hoofDustCount = 30; // Object pool size
    this.hoofDustIndex = 0;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.hoofDustCount * 3);
    
    // Hide initially by placing far away
    for (let i = 0; i < this.hoofDustCount * 3; i++) {
      positions[i] = 9999;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xc49d29,
      size: 4.0,
      transparent: true,
      opacity: 0.6,
      map: this.createCircleTexture(),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.hoofDust = new THREE.Points(geometry, material);
    this.scene.add(this.hoofDust);
    
    this.hoofDustLifetimes = new Float32Array(this.hoofDustCount);
  }

  spawnHoofDust(x, y, z) {
    if (!this.hoofDust) return;
    
    const positions = this.hoofDust.geometry.attributes.position.array;
    const idx = this.hoofDustIndex * 3;
    
    positions[idx] = x + (Math.random() - 0.5) * 3;
    positions[idx+1] = y + Math.random() * 2; // Slight vertical random
    positions[idx+2] = z + (Math.random() - 0.5) * 3;
    
    this.hoofDustLifetimes[this.hoofDustIndex] = 1.0; // 1 second lifetime
    
    this.hoofDustIndex = (this.hoofDustIndex + 1) % this.hoofDustCount;
    this.hoofDust.geometry.attributes.position.needsUpdate = true;
  }

  createTerrainChunk(zPos) {
    const geometry = new THREE.PlaneGeometry(150, this.chunkSize, 32, 32);
    geometry.rotateX(-Math.PI / 2);

    // Displace vertices to create hills on the sides, flat in the middle (the pass)
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Create a valley in the center (x between -20 and 20 is flat, outside is hills)
      if (Math.abs(x) > 20) {
        const height = (Math.abs(x) - 20) * 1.5 + Math.random() * 5;
        pos.setY(i, height);
      } else {
        pos.setY(i, Math.random() * 0.5); // Slightly uneven ground
      }
    }
    geometry.computeVertexNormals();

    // Turmeric/yellowish-brown color for Haldighati
    const material = new THREE.MeshStandardMaterial({
      color: 0xc49d29,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true // Low-poly look
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = zPos;
    chunkGroup.add(mesh);
    chunkGroup.groundMesh = mesh; // Keep reference to ground mesh
    
    this.scene.add(chunkGroup);
    this.terrainChunks.push(chunkGroup);
    
    this.sceneryManager.generateScenery(chunkGroup, 0);
  }

  update(delta, score = 0, gameSpeed = 1.0, playerPosition = null) {
    const isOpenGround = score > 500;
    const isForest = score > 1000;
    
    // Smoothly transition terrain colors based on score
    let targetHex = 0xc49d29; // Default haldighati yellow
    if (isForest) {
      targetHex = 0x4a7c29; // Lush green forest path
    } else if (isOpenGround) {
      targetHex = 0x8b5a2b; // Darker brown open ground
    }
    const targetColor = new THREE.Color(targetHex);

    // Move terrain towards camera to simulate running
    const currentSpeed = this.chunkSpeed * gameSpeed;
    for (let i = 0; i < this.terrainChunks.length; i++) {
      const chunk = this.terrainChunks[i];
      chunk.position.z += currentSpeed * delta;
      
      // Lerp color smoothly
      chunk.groundMesh.material.color.lerp(targetColor, delta * 1.5);

      // If chunk goes behind camera, move it to the front
      if (chunk.position.z > this.chunkSize) {
        // Find the furthest chunk's z position
        let minZ = 0;
        for (let j = 0; j < this.terrainChunks.length; j++) {
          if (this.terrainChunks[j].position.z < minZ) {
            minZ = this.terrainChunks[j].position.z;
          }
        }
        chunk.position.z = minZ - this.chunkSize;
        
        this.sceneryManager.generateScenery(chunk, score);
        
        // Slightly randomize the vertices again for variety
        const pos = chunk.groundMesh.geometry.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const x = pos.getX(v);
          if (!isOpenGround && Math.abs(x) > 20) {
             const height = (Math.abs(x) - 20) * 1.5 + Math.random() * 5;
             pos.setY(v, height);
          } else {
             pos.setY(v, Math.random() * 0.5);
          }
        }
        chunk.groundMesh.geometry.computeVertexNormals();
        chunk.groundMesh.geometry.attributes.position.needsUpdate = true;
      }
    }
    
    if (playerPosition) {
      this.sceneryManager.update(delta, playerPosition);
    }

    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += currentSpeed * delta * 0.5; // Dust moves towards camera
        positions[i] += Math.sin(Date.now() * 0.001 + positions[i + 1]) * 0.1; // Sway
        
        // Loop particles
        if (positions[i + 2] > 50) {
          positions[i + 2] = -100;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Animate hoof dust
    if (this.hoofDust) {
      const positions = this.hoofDust.geometry.attributes.position.array;
      let needsUpdate = false;
      for (let i = 0; i < this.hoofDustCount; i++) {
        if (this.hoofDustLifetimes[i] > 0) {
          this.hoofDustLifetimes[i] -= delta * 2; // Fade out fast
          const idx = i * 3;
          positions[idx+1] += delta * 2; // Float up
          positions[idx+2] += currentSpeed * delta; // Move towards camera
          
          if (this.hoofDustLifetimes[i] <= 0) {
            positions[idx+1] = 9999; // Hide
          }
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        this.hoofDust.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
}
