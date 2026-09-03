import * as THREE from 'three';

export class Enemies {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.entities = []; // Array of enemy meshes and obstacles
    this.spawnTimer = 0;
    this.spawnRate = 1.5; // Spawn an entity every 1.5 seconds initially
    this.speed = 50; // Should match world chunk speed
  }

  spawnEntity() {
    const rand = Math.random();
    let mesh;
    
    if (rand > 0.4) {
      // Enemy (60% chance)
      const geo = new THREE.BoxGeometry(1.5, 4, 1.5);
      const mat = new THREE.MeshStandardMaterial({ color: 0xaa2222, flatShading: true }); // Red armor
      mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { type: 'enemy', active: true, baseOffset: 2 };
    } else if (rand > 0.1) {
      // Obstacle (Tree or Big Rock, 30% chance)
      mesh = new THREE.Group();
      if (Math.random() > 0.5) {
        // Tree
        const trunkGeo = new THREE.CylinderGeometry(0.8, 1, 4, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, flatShading: true });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        trunk.castShadow = true;
        mesh.add(trunk);
        
        const leavesGeo = new THREE.ConeGeometry(3, 6, 8);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, flatShading: true });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 6;
        leaves.castShadow = true;
        mesh.add(leaves);
        
        mesh.userData = { type: 'obstacle', active: true, baseOffset: 0, height: 6 }; // Too tall to jump over cleanly, must dodge
      } else {
        // Big Rock
        const geo = new THREE.DodecahedronGeometry(2.5, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true });
        const rock = new THREE.Mesh(geo, mat);
        rock.scale.set(1, 1.2, 1);
        rock.position.y = 2.5;
        rock.castShadow = true;
        mesh.add(rock);
        
        mesh.userData = { type: 'obstacle', active: true, baseOffset: 0, height: 3.5 }; // Can barely be jumped over
      }
    } else {
      // Pitfall (10% chance)
      const geo = new THREE.PlaneGeometry(8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black hole
      mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.userData = { type: 'pitfall', active: true, baseOffset: 0.1 };
    }

    // Spawn far away in the negative z direction
    mesh.position.z = -200;
    
    if (mesh.userData.type === 'pitfall') {
      // Spawn pitfall on the flat ground only
      mesh.position.x = (Math.random() - 0.5) * 30;
      mesh.position.y = mesh.userData.baseOffset;
    } else {
      // Spawn enemies and rocks anywhere including side walls
      mesh.position.x = (Math.random() - 0.5) * 60; // -30 to 30
      
      // Calculate y and rotation if on the wall
      let targetBaseY = 0;
      if (Math.abs(mesh.position.x) > 20) {
        targetBaseY = (Math.abs(mesh.position.x) - 20) * 1.5;
        mesh.rotation.z = mesh.position.x > 0 ? Math.atan(1.5) : -Math.atan(1.5);
      }
      mesh.position.y = targetBaseY + mesh.userData.baseOffset;
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.entities.push(mesh);
  }

  update(delta, gameContext) {
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnEntity();
      this.spawnTimer = this.spawnRate;
      // Slightly increase difficulty over time
      if (this.spawnRate > 0.5) {
        this.spawnRate -= 0.02;
      }
    }

    // Update entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      
      // Move towards player
      entity.position.z += this.speed * delta;
      
      // Collision detection (Simple bounding box)
      const dx = Math.abs(entity.position.x - this.player.group.position.x);
      const dz = Math.abs(entity.position.z - this.player.group.position.z);
      
      if (entity.userData.active) {
        if (entity.userData.type === 'pitfall') {
          // Special pitfall collision (only triggers if player is on the ground)
          if (dx < 3.5 && dz < 3.5 && this.player.group.position.y < entity.position.y + 1) {
            this.player.fallIntoPit();
            entity.userData.active = false;
          }
        } else if (dx < 2.5 && dz < 3.5) {
          // Standard collision for enemies/rocks
          
          // Check Y (Jump)
          // Obstacle y is based on its baseOffset + targetBaseY.
          const obstacleHeight = entity.userData.height || 1.5;
          const isJumpingOver = entity.userData.type === 'obstacle' && this.player.group.position.y > entity.position.y + obstacleHeight;
          
          if (!isJumpingOver) {
            if (entity.userData.type === 'enemy' && this.player.isAttacking) {
              // Player defeated the enemy
              entity.userData.active = false;
              // Visual feedback for defeated enemy
              entity.material.color.setHex(0x555555);
              entity.scale.set(1, 0.2, 1);
              // Readjust y so it looks like it's flat on the ground
              let targetBaseY = 0;
              if (Math.abs(entity.position.x) > 20) targetBaseY = (Math.abs(entity.position.x) - 20) * 1.5;
              entity.position.y = targetBaseY + 0.5;
              gameContext.addScore(100);
            } else {
              // Player hit an enemy without attacking or hit an obstacle
              this.player.takeDamage(20);
              entity.userData.active = false; // Prevent continuous damage
              
              // Flash player red
              if (this.player.flashRed) {
                this.player.flashRed();
              }
            }
          }
        }
      }

      // Remove entities that have passed behind the camera
      if (entity.position.z > 50) {
        this.scene.remove(entity);
        this.entities.splice(i, 1);
      }
    }
  }

  reset() {
    for (const entity of this.entities) {
      this.scene.remove(entity);
    }
    this.entities = [];
    this.spawnTimer = 0;
    this.spawnRate = 1.5;
  }
}
