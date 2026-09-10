import * as THREE from 'three';

export class CombatSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    
    // Combo State
    this.comboStep = 0; // 0 (none), 1, 2, 3
    this.comboTimer = 0;
    this.comboWindow = 0.6; // Seconds to follow up
    this.isAttacking = false;
    this.attackPhase = 'idle'; // idle, prep, swing, recover
    this.attackTimer = 0;
    
    this.hitEnemies = new Set(); // Enemies already hit this swing
    
    this.initVFX();
  }

  initVFX() {
    // Spark pool
    this.sparks = [];
    this.sparkPoolSize = 30;
    const sparkGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const sparkMat = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00, 
      transparent: true, 
      blending: THREE.AdditiveBlending, 
      depthWrite: false,
      side: THREE.DoubleSide
    });

    for(let i=0; i<this.sparkPoolSize; i++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.visible = false;
      this.scene.add(spark);
      this.sparks.push({ mesh: spark, life: 0, vel: new THREE.Vector3() });
    }

    // Sword trail
    this.trailMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.trailGeo = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(30 * 3);
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailMesh = new THREE.Mesh(this.trailGeo, this.trailMat);
    this.trailMesh.visible = false;
    this.trailMesh.frustumCulled = false;
    this.scene.add(this.trailMesh);
    
    this.trailHistory = [];
  }

  attack() {
    if (this.attackPhase === 'swing' || this.attackPhase === 'prep') {
      return; // Already attacking
    }
    
    if (this.comboTimer > 0 && this.comboStep > 0) {
      this.comboStep++;
      if (this.comboStep > 3) this.comboStep = 1;
    } else {
      this.comboStep = 1;
    }
    
    this.isAttacking = true;
    this.attackPhase = 'prep';
    this.attackTimer = 0.1; // 0.1s prep
    this.comboTimer = this.comboWindow;
    this.hitEnemies.clear();
    this.trailHistory = [];
  }

  createHitSpark(position) {
    // Spawn 5-8 sparks
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const spark = this.sparks.find(s => !s.mesh.visible);
      if (spark) {
        spark.mesh.position.copy(position);
        spark.mesh.visible = true;
        spark.life = 0.2 + Math.random() * 0.1;
        // Random outward velocity
        spark.vel.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15 + 10,
          (Math.random() - 0.5) * 15
        );
      }
    }
  }

  checkHits(enemies, gameContext) {
    if (this.attackPhase !== 'swing') return;

    const playerPos = this.player.group.position;
    // Assume player is facing negative Z roughly
    const forward = new THREE.Vector3(0, 0, -1);

    for (const entity of enemies) {
      if (!entity.userData.active || entity.userData.type !== 'enemy') continue;
      if (this.hitEnemies.has(entity)) continue;
      if (entity.userData.isDead) continue;

      // Distance check
      const dist = playerPos.distanceTo(entity.position);
      if (dist < 8) { // Attack range
        // Arc check (is enemy in front of player?)
        const dirToEnemy = new THREE.Vector3().subVectors(entity.position, playerPos).normalize();
        const dot = forward.dot(dirToEnemy);
        
        // 120 degree arc in front
        if (dot > Math.cos(Math.PI / 3)) { // > 0.5
          this.registerHit(entity, gameContext);
        }
      }
    }
  }

  registerHit(entity, gameContext) {
    this.hitEnemies.add(entity);
    const playerPos = this.player.group.position;
    
    // Calculate damage (higher for combo 3)
    let damage = 40;
    if (this.comboStep === 3) damage = 80;

    if (entity.userData.health === undefined) entity.userData.health = 100;
    entity.userData.health -= damage;

    // Hit effects
    this.createHitSpark(entity.position.clone().add(new THREE.Vector3(0, 2, 0)));
    
    // Enemy hit flash
    entity.userData.justHit = true;

    // Knockback
    entity.userData.knockback = new THREE.Vector3(0, 0, -15);
    if (this.comboStep === 3) {
      entity.userData.knockback.set(0, 10, -25); // stronger push back and up
    }

    // Camera Shake
    if (gameContext) {
      gameContext.cameraShake = this.comboStep === 3 ? 1.0 : 0.4;
    }

    // Death check
    if (entity.userData.health <= 0) {
      entity.userData.isDead = true;
      if (gameContext) {
        gameContext.cameraShake = 1.5;
        gameContext.addScore(100);
        
        // Powerful third combo dust
        if (this.comboStep === 3 && gameContext.world && gameContext.world.spawnHoofDust) {
           gameContext.world.spawnHoofDust(playerPos.x, playerPos.y, playerPos.z, 2.0);
        }
      }
    }
  }

  update(delta, enemies, gameContext) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0 && this.attackPhase === 'idle') {
        this.comboStep = 0;
      }
    }

    // Update attack phases
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        if (this.attackPhase === 'prep') {
          this.attackPhase = 'swing';
          this.attackTimer = 0.2; // 0.2s swing
          if (this.player.sword) this.player.sword.material.emissive.setHex(0x555555);
          this.trailMesh.visible = true;
        } else if (this.attackPhase === 'swing') {
          this.attackPhase = 'recover';
          this.attackTimer = 0.15; // 0.15s recovery
          if (this.player.sword) this.player.sword.material.emissive.setHex(0x000000);
          this.trailMesh.visible = false;
        } else if (this.attackPhase === 'recover') {
          this.attackPhase = 'idle';
          this.isAttacking = false;
        }
      }
    }

    if (enemies && gameContext) {
      this.checkHits(enemies, gameContext);
    }

    // Update Sparks
    if (gameContext && gameContext.camera) {
      for (const spark of this.sparks) {
        if (spark.mesh.visible) {
          spark.life -= delta;
          spark.mesh.position.addScaledVector(spark.vel, delta);
          spark.vel.y -= 30 * delta; // Gravity
          
          spark.mesh.lookAt(gameContext.camera.position);

          if (spark.life <= 0) {
            spark.mesh.visible = false;
          } else {
            spark.mesh.material.opacity = spark.life / 0.3;
          }
        }
      }
    }

    // Update Sword Trail
    if (this.attackPhase === 'swing' && this.player.sword) {
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();
      
      this.player.sword.localToWorld(p1.set(0, -1.75, 0)); // Base (approx)
      this.player.sword.localToWorld(p2.set(0, 1.75, 0));  // Tip (approx)

      this.trailHistory.unshift({ p1: p1.clone(), p2: p2.clone() });
      if (this.trailHistory.length > 10) this.trailHistory.pop();

      const positions = [];
      for (let i = 0; i < this.trailHistory.length - 1; i++) {
        const curr = this.trailHistory[i];
        const next = this.trailHistory[i+1];
        
        positions.push(curr.p1.x, curr.p1.y, curr.p1.z);
        positions.push(curr.p2.x, curr.p2.y, curr.p2.z);
        positions.push(next.p1.x, next.p1.y, next.p1.z);

        positions.push(curr.p2.x, curr.p2.y, curr.p2.z);
        positions.push(next.p2.x, next.p2.y, next.p2.z);
        positions.push(next.p1.x, next.p1.y, next.p1.z);
      }
      
      if (positions.length > 0) {
        this.trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.trailGeo.computeVertexNormals();
      }
    } else if (this.trailHistory.length > 0) {
      this.trailHistory.pop(); // Fade out trail
      const positions = [];
      for (let i = 0; i < this.trailHistory.length - 1; i++) {
        const curr = this.trailHistory[i];
        const next = this.trailHistory[i+1];
        positions.push(curr.p1.x, curr.p1.y, curr.p1.z);
        positions.push(curr.p2.x, curr.p2.y, curr.p2.z);
        positions.push(next.p1.x, next.p1.y, next.p1.z);
        positions.push(curr.p2.x, curr.p2.y, curr.p2.z);
        positions.push(next.p2.x, next.p2.y, next.p2.z);
        positions.push(next.p1.x, next.p1.y, next.p1.z);
      }
      if (positions.length > 0) {
        this.trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      } else {
        this.trailMesh.visible = false;
      }
    }
  }
}
