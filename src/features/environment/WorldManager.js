import * as THREE from 'three';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.terrainChunks = [];
    this.chunkSize = 200;
    this.chunkSpeed = 50; // Speed at which the terrain moves towards the player

    this.initLighting();
    this.initSkybox();
    this.initParticles();
    
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
    mesh.position.z = zPos;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.terrainChunks.push(mesh);
  }

  update(delta, score = 0) {
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
    for (let i = 0; i < this.terrainChunks.length; i++) {
      const chunk = this.terrainChunks[i];
      chunk.position.z += this.chunkSpeed * delta;
      
      // Lerp color smoothly
      chunk.material.color.lerp(targetColor, delta * 1.5);

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
        
        // Slightly randomize the vertices again for variety
        const pos = chunk.geometry.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const x = pos.getX(v);
          if (!isOpenGround && Math.abs(x) > 20) {
             const height = (Math.abs(x) - 20) * 1.5 + Math.random() * 5;
             pos.setY(v, height);
          } else {
             pos.setY(v, Math.random() * 0.5);
          }
        }
        chunk.geometry.computeVertexNormals();
        chunk.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += this.chunkSpeed * delta * 0.5; // Dust moves towards camera
        positions[i] += Math.sin(Date.now() * 0.001 + positions[i + 1]) * 0.1; // Sway
        
        // Loop particles
        if (positions[i + 2] > 50) {
          positions[i + 2] = -100;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
