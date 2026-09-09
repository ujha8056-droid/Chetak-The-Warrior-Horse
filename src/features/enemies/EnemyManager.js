import * as THREE from 'three';

export class EnemyManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.entities = []; // Array of enemy meshes and obstacles
    this.spawnTimer = 0;
    this.spawnRate = 0.8; // Spawn an entity every 0.8 seconds initially
    this.speed = 50; // Should match world chunk speed
  }

  spawnEntity(gameContext) {
    const rand = Math.random();
    let mesh;
    
    if (rand > 0.4) {
      // Enemy (60% chance)
      const geo = new THREE.BoxGeometry(1.5, 4, 1.5);
      const mat = new THREE.MeshStandardMaterial({ color: 0xaa2222, flatShading: true }); // Red armor
      mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { type: 'enemy', active: true, baseOffset: 2 };
    } else {
      // Obstacle (Tree or Big Rock, 40% chance)
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
    }

    // Spawn far away in the negative z direction
    mesh.position.z = -200;
    
    const isOpenGround = gameContext && gameContext.score > 500;

    // Spawn enemies and rocks anywhere including side walls
    mesh.position.x = (Math.random() - 0.5) * 60; // -30 to 30
    
    // Calculate y and rotation if on the wall
    let targetBaseY = 0;
    if (!isOpenGround && Math.abs(mesh.position.x) > 20) {
      targetBaseY = (Math.abs(mesh.position.x) - 20) * 1.5;
      mesh.rotation.z = mesh.position.x > 0 ? Math.atan(1.5) : -Math.atan(1.5);
    }
    mesh.position.y = targetBaseY + mesh.userData.baseOffset;
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.entities.push(mesh);
  }

  update(delta, gameContext, gameSpeed = 1.0) {
    // Make spawn timer tick faster based on gameSpeed
    this.spawnTimer -= delta * gameSpeed;
    if (this.spawnTimer <= 0) {
      this.spawnEntity(gameContext);
      this.spawnTimer = this.spawnRate;
      
      // Increase difficulty over time by decreasing the base spawn interval
      if (this.spawnRate > 0.2) {
        this.spawnRate -= 0.01; // Faster decrement to increase difficulty noticeably
      }
    }

    // Update entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      
      // Move towards player (match terrain speed)
      entity.position.z += this.speed * gameSpeed * delta;
      
      // Collision detection (Simple bounding box)
      const dx = Math.abs(entity.position.x - this.player.group.position.x);
      const dz = Math.abs(entity.position.z - this.player.group.position.z);
      
      if (entity.userData.active) {
        if (dx < 2.5 && dz < 3.5) {
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
              const isOpenGround = gameContext && gameContext.score > 500;
              if (!isOpenGround && Math.abs(entity.position.x) > 20) targetBaseY = (Math.abs(entity.position.x) - 20) * 1.5;
              entity.position.y = targetBaseY + 0.5;
              gameContext.addScore(100);
            } else {
              // Player hit an enemy without attacking or hit an obstacle
              this.player.takeDamage(10); // Reduced from 20 to 10
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
    this.spawnRate = 0.8;
  }
}
