import * as THREE from 'three';

export class SceneryManager {
  constructor(scene) {
    this.scene = scene;
    
    this.materials = {};
    this.geometries = {};
    
    this.pools = {
      mountain: [],
      rock: [],
      tree: [],
      bush: [],
      banner: [],
      barricade: [],
      ruin: [],
      fire: [],
      debris: []
    };
    
    // Keep track of animated objects
    this.activeBanners = [];
    this.activeFires = [];
    
    this.windTime = 0;
    
    this.initAssets();
    this.initFireLights();
  }

  initAssets() {
    // Colors
    const colorMountain = 0x8b5a2b; // Brownish
    const colorRock = 0x665544;
    const colorWood = 0x4a3b2c;
    const colorLeaves = 0x556b2f;
    const colorBannerMewar = 0xcc2222; // Red
    const colorBannerEnemy = 0x333333; // Dark/Black
    const colorRuin = 0x888888;
    
    // Shared Materials
    this.materials.mountain = new THREE.MeshStandardMaterial({ color: colorMountain, flatShading: true, roughness: 0.9 });
    this.materials.rock = new THREE.MeshStandardMaterial({ color: colorRock, flatShading: true, roughness: 1.0 });
    this.materials.wood = new THREE.MeshStandardMaterial({ color: colorWood, flatShading: true });
    this.materials.leaves = new THREE.MeshStandardMaterial({ color: colorLeaves, flatShading: true });
    this.materials.bannerMewar = new THREE.MeshStandardMaterial({ color: colorBannerMewar, flatShading: true, side: THREE.DoubleSide });
    this.materials.bannerEnemy = new THREE.MeshStandardMaterial({ color: colorBannerEnemy, flatShading: true, side: THREE.DoubleSide });
    this.materials.ruin = new THREE.MeshStandardMaterial({ color: colorRuin, flatShading: true });
    
    // Fire & Smoke materials
    this.materials.fire = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    this.materials.smoke = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });

    // Shared Geometries
    this.geometries.mountain = new THREE.ConeGeometry(30, 40, 5);
    this.geometries.mountain.translate(0, 20, 0); // Origin at bottom
    
    this.geometries.rock = new THREE.DodecahedronGeometry(1, 0); // Will scale per instance
    this.geometries.rock.translate(0, 0.5, 0);

    this.geometries.treeTrunk = new THREE.CylinderGeometry(0.5, 0.8, 6, 5);
    this.geometries.treeTrunk.translate(0, 3, 0);
    this.geometries.treeLeaves = new THREE.ConeGeometry(3, 7, 5);
    this.geometries.treeLeaves.translate(0, 7, 0);
    
    this.geometries.bush = new THREE.DodecahedronGeometry(2, 0);
    this.geometries.bush.translate(0, 1, 0);

    this.geometries.pole = new THREE.CylinderGeometry(0.2, 0.2, 10, 5);
    this.geometries.pole.translate(0, 5, 0);
    // Banner flag geometry needs more segments for wind animation
    this.geometries.flag = new THREE.PlaneGeometry(3, 5, 4, 4);
    this.geometries.flag.translate(1.5, 7.5, 0); // Attached to pole side

    this.geometries.barricade = new THREE.BoxGeometry(4, 1, 1);
    this.geometries.ruin = new THREE.BoxGeometry(6, 4, 2);
    this.geometries.debris = new THREE.BoxGeometry(2, 0.2, 0.5);
    
    this.geometries.fire = new THREE.ConeGeometry(1, 2, 4);
    this.geometries.fire.translate(0, 1, 0);
  }

  initFireLights() {
    this.fireLights = [];
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0xff6600, 0, 40); // Intensity 0 initially
      this.scene.add(light);
      this.fireLights.push(light);
    }
  }

  getMesh(type) {
    if (this.pools[type] && this.pools[type].length > 0) {
      const mesh = this.pools[type].pop();
      mesh.userData.active = true;
      return mesh;
    }
    return this.createMesh(type);
  }

  createMesh(type) {
    let mesh;
    switch (type) {
      case 'mountain':
        mesh = new THREE.Mesh(this.geometries.mountain, this.materials.mountain);
        break;
      case 'rock':
        mesh = new THREE.Mesh(this.geometries.rock, this.materials.rock);
        break;
      case 'tree':
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(this.geometries.treeTrunk, this.materials.wood);
        const leaves = new THREE.Mesh(this.geometries.treeLeaves, this.materials.leaves);
        trunk.castShadow = true;
        leaves.castShadow = true;
        mesh.add(trunk);
        mesh.add(leaves);
        break;
      case 'bush':
        mesh = new THREE.Mesh(this.geometries.bush, this.materials.leaves);
        break;
      case 'banner':
        mesh = new THREE.Group();
        const pole = new THREE.Mesh(this.geometries.pole, this.materials.wood);
        pole.castShadow = true;
        // Use clone for flag geometry so we can animate vertices independently
        const flagGeo = this.geometries.flag.clone();
        // Randomly assign Mewar or Enemy flag
        const isMewar = Math.random() > 0.5;
        const flagMat = isMewar ? this.materials.bannerMewar : this.materials.bannerEnemy;
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.castShadow = true;
        
        mesh.add(pole);
        mesh.add(flag);
        mesh.userData = { flagMesh: flag, randomOffset: Math.random() * 100 };
        break;
      case 'barricade':
        mesh = new THREE.Mesh(this.geometries.barricade, this.materials.wood);
        break;
      case 'ruin':
        mesh = new THREE.Mesh(this.geometries.ruin, this.materials.ruin);
        break;
      case 'debris':
        mesh = new THREE.Mesh(this.geometries.debris, this.materials.wood);
        break;
      case 'fire':
        mesh = new THREE.Mesh(this.geometries.fire, this.materials.fire);
        mesh.userData = { randomOffset: Math.random() * 100 };
        break;
    }
    
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    
    mesh.userData.type = type;
    mesh.userData.active = true;
    return mesh;
  }

  releaseMesh(mesh) {
    if (!mesh || !mesh.userData.type) return;
    mesh.userData.active = false;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    this.pools[mesh.userData.type].push(mesh);
  }

  clearScenery(chunkGroup) {
    // chunkGroup is expected to have a .sceneryGroup child
    if (!chunkGroup.sceneryGroup) return;
    
    const children = [...chunkGroup.sceneryGroup.children];
    for (let child of children) {
      chunkGroup.sceneryGroup.remove(child);
      this.releaseMesh(child);
    }
  }

  generateScenery(chunkGroup, score) {
    if (!chunkGroup.sceneryGroup) {
      chunkGroup.sceneryGroup = new THREE.Group();
      chunkGroup.add(chunkGroup.sceneryGroup);
    }
    
    this.clearScenery(chunkGroup);
    
    // Progression settings
    let mountainChance = 0.8;
    let rockCount = 5 + Math.floor(score / 200);
    let treeCount = 8;
    let bannerCount = score > 300 ? 1 + Math.floor((score - 300) / 400) : 0;
    let barricadeCount = score > 300 ? 1 + Math.floor((score - 300) / 300) : 0;
    let fireCount = score > 700 ? 1 + Math.floor((score - 700) / 300) : 0;
    let ruinCount = score > 700 && Math.random() > 0.7 ? 1 : 0;
    let debrisCount = score > 500 ? 4 + Math.floor((score - 500) / 200) : 0;

    // Cap maximums to preserve performance
    rockCount = Math.min(rockCount, 15);
    treeCount = Math.min(treeCount, 12);
    bannerCount = Math.min(bannerCount, 6);
    barricadeCount = Math.min(barricadeCount, 8);
    fireCount = Math.min(fireCount, 5);
    debrisCount = Math.min(debrisCount, 15);

    // Helper to get random position outside center lane
    const getSafePosition = (xRange, zRange) => {
      let x = (Math.random() - 0.5) * xRange;
      // Force x outside the safe lane (-25 to 25)
      if (Math.abs(x) < 25) {
        x = x > 0 ? x + 25 : x - 25;
      }
      let z = (Math.random() - 0.5) * zRange;
      
      // Calculate Y based on the valley shape (same as terrain generator)
      let y = 0;
      if (score <= 500 && Math.abs(x) > 20) {
        y = (Math.abs(x) - 20) * 1.5;
      }
      return { x, y, z };
    };

    // Spawn Mountains
    for (let i = 0; i < 4; i++) {
      if (Math.random() < mountainChance) {
        const mesh = this.getMesh('mountain');
        // Place very far to the sides
        const sign = Math.random() > 0.5 ? 1 : -1;
        mesh.position.set(sign * (70 + Math.random() * 30), -5, (Math.random() - 0.5) * 200);
        mesh.scale.set(1 + Math.random() * 0.5, 1 + Math.random(), 1 + Math.random() * 0.5);
        mesh.rotation.y = Math.random() * Math.PI;
        chunkGroup.sceneryGroup.add(mesh);
      }
    }

    // Spawn Rocks
    for (let i = 0; i < rockCount; i++) {
      const mesh = this.getMesh('rock');
      const pos = getSafePosition(120, 200);
      mesh.position.set(pos.x, pos.y, pos.z);
      const scale = 1 + Math.random() * 3;
      mesh.scale.set(scale, scale * (0.5 + Math.random()), scale);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      chunkGroup.sceneryGroup.add(mesh);
    }

    // Spawn Trees & Bushes
    for (let i = 0; i < treeCount; i++) {
      const isBush = Math.random() > 0.6;
      const mesh = this.getMesh(isBush ? 'bush' : 'tree');
      const pos = getSafePosition(100, 200);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = Math.random() * Math.PI;
      const scale = 0.8 + Math.random() * 0.6;
      mesh.scale.set(scale, scale, scale);
      chunkGroup.sceneryGroup.add(mesh);
    }

    // Spawn Banners
    for (let i = 0; i < bannerCount; i++) {
      const mesh = this.getMesh('banner');
      const pos = getSafePosition(80, 200);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = (Math.random() - 0.5) * 0.5; // Slightly angled
      chunkGroup.sceneryGroup.add(mesh);
      this.activeBanners.push(mesh);
    }

    // Spawn Barricades
    for (let i = 0; i < barricadeCount; i++) {
      const mesh = this.getMesh('barricade');
      const pos = getSafePosition(70, 200);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
      chunkGroup.sceneryGroup.add(mesh);
    }

    // Spawn Ruins
    for (let i = 0; i < ruinCount; i++) {
      const mesh = this.getMesh('ruin');
      const pos = getSafePosition(90, 200);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = Math.random() * Math.PI;
      chunkGroup.sceneryGroup.add(mesh);
    }
    
    // Spawn Debris
    for (let i = 0; i < debrisCount; i++) {
      const mesh = this.getMesh('debris');
      const pos = getSafePosition(60, 200);
      mesh.position.set(pos.x, pos.y + 0.2, pos.z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      chunkGroup.sceneryGroup.add(mesh);
    }

    // Spawn Fire
    for (let i = 0; i < fireCount; i++) {
      const mesh = this.getMesh('fire');
      const pos = getSafePosition(80, 200);
      mesh.position.set(pos.x, pos.y, pos.z);
      // Attach a small ruin block near it for context
      const logs = this.getMesh('debris');
      logs.position.set(pos.x, pos.y, pos.z);
      logs.scale.set(1.5, 2, 1.5);
      chunkGroup.sceneryGroup.add(logs);
      
      chunkGroup.sceneryGroup.add(mesh);
      this.activeFires.push(mesh);
    }
  }

  update(delta, playerPosition) {
    this.windTime += delta * 2;
    
    // Clean up inactive tracked objects
    this.activeBanners = this.activeBanners.filter(b => b.userData.active);
    this.activeFires = this.activeFires.filter(f => f.userData.active);

    // Animate Banners (Wind)
    for (const banner of this.activeBanners) {
      if (!banner.userData.flagMesh) continue;
      const flagGeo = banner.userData.flagMesh.geometry;
      const pos = flagGeo.attributes.position;
      const offset = banner.userData.randomOffset;
      
      for (let i = 0; i < pos.count; i++) {
        // Simple flag wave: wave depends on X coordinate of the vertex
        const x = pos.getX(i);
        if (x > 0.5) { // Don't move vertices attached to pole
          const wave = Math.sin(this.windTime + offset + x * 2) * (x * 0.2);
          pos.setZ(i, wave);
        }
      }
      flagGeo.computeVertexNormals();
      pos.needsUpdate = true;
    }

    // Animate Fires (Flicker)
    for (const fire of this.activeFires) {
      const t = this.windTime * 5 + fire.userData.randomOffset;
      const scaleY = 1.0 + Math.sin(t) * 0.2 + Math.random() * 0.1;
      const scaleXZ = 1.0 + Math.cos(t * 1.3) * 0.1;
      fire.scale.set(scaleXZ, scaleY, scaleXZ);
    }

    // Update Fire Lights (Snap to closest active fires)
    // Gather absolute world positions of active fires
    const fireWorldPositions = [];
    for (const fire of this.activeFires) {
      const worldPos = new THREE.Vector3();
      fire.getWorldPosition(worldPos);
      
      // Calculate distance to player (camera view area approx)
      const dist = worldPos.distanceTo(playerPosition);
      if (dist < 200) { // Only consider nearby fires
        fireWorldPositions.push({ pos: worldPos, dist: dist });
      }
    }
    
    // Sort by distance
    fireWorldPositions.sort((a, b) => a.dist - b.dist);
    
    // Assign to lights
    for (let i = 0; i < this.fireLights.length; i++) {
      const light = this.fireLights[i];
      if (i < fireWorldPositions.length) {
        light.position.copy(fireWorldPositions[i].pos);
        light.position.y += 2; // Slightly above fire
        
        // Flicker intensity
        const flicker = 1.0 + Math.random() * 0.3;
        light.intensity = THREE.MathUtils.lerp(light.intensity, flicker * 2, 10 * delta);
      } else {
        light.intensity = THREE.MathUtils.lerp(light.intensity, 0, 10 * delta);
      }
    }
  }
}
