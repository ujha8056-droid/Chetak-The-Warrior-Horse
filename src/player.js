import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;
    
    // Player State
    this.health = 100;
    this.isAttacking = false;
    this.attackTimer = 0;
    
    // Jump mechanics
    this.isJumping = false;
    this.yVelocity = 0;
    this.gravity = -60;
    this.jumpStrength = 25;
    
    // Movement params
    this.speed = 40;
    this.boundary = 35; // Increased to allow wall running
    this.isFalling = false;
    
    // Input state
    this.keys = { left: false, right: false };
    
    this.initMesh();
    this.setupInput();
  }

  initMesh() {
    this.group = new THREE.Group();

    // 1. Chetak (Horse) - Dapple Grey with Black Mane/Tail
    this.horseGroup = new THREE.Group();
    
    const horseColor = 0xdcdcdc; // Light grey / white
    const horseDark = 0x222222; // Black mane/hooves
    
    // Better material for the horse coat
    const horseMat = new THREE.MeshPhysicalMaterial({ 
      color: horseColor, 
      roughness: 0.6,
      metalness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      flatShading: true 
    });
    
    const darkMat = new THREE.MeshStandardMaterial({ color: horseDark, flatShading: true, roughness: 0.9 });
    const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1.0, roughness: 0.2, clearcoat: 1.0 }); // Armor bits

    // Horse Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 1.8, 4);
    const body = new THREE.Mesh(bodyGeo, horseMat);
    body.position.y = 2.5;
    body.castShadow = true;
    this.horseGroup.add(body);

    // Horse Neck
    const neckGeo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
    const neck = new THREE.Mesh(neckGeo, horseMat);
    neck.position.set(0, 3.5, -1.5);
    neck.rotation.x = Math.PI / 6;
    neck.castShadow = true;
    this.horseGroup.add(neck);

    // Horse Head
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 2);
    const head = new THREE.Mesh(headGeo, horseMat);
    head.position.set(0, 4.5, -2.5);
    head.rotation.x = Math.PI / 8;
    head.castShadow = true;
    this.horseGroup.add(head);

    // Horse Mane
    const maneGeo = new THREE.BoxGeometry(0.4, 2.5, 1.5);
    const mane = new THREE.Mesh(maneGeo, darkMat);
    mane.position.set(0, 3.8, -1.2);
    mane.rotation.x = Math.PI / 6;
    mane.castShadow = true;
    this.horseGroup.add(mane);

    // Horse Tail
    const tailGeo = new THREE.BoxGeometry(0.5, 2, 0.5);
    const tail = new THREE.Mesh(tailGeo, darkMat);
    tail.position.set(0, 2.5, 2);
    tail.rotation.x = -Math.PI / 8;
    tail.castShadow = true;
    this.horseGroup.add(tail);

    // Horse Legs
    const legGeo = new THREE.BoxGeometry(0.6, 2, 0.6);
    this.legs = [];
    const legPositions = [
      [-0.6, 1, -1.5], [0.6, 1, -1.5], // Front
      [-0.6, 1, 1.5], [0.6, 1, 1.5]    // Back
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, horseMat);
      leg.position.set(...pos);
      leg.castShadow = true;
      this.horseGroup.add(leg);
      this.legs.push(leg);
      
      // Hooves
      const hoofGeo = new THREE.BoxGeometry(0.7, 0.4, 0.7);
      const hoof = new THREE.Mesh(hoofGeo, darkMat);
      hoof.position.set(0, -0.8, 0);
      leg.add(hoof);
    });

    this.group.add(this.horseGroup);

    // 2. Maharana Pratap (Rider)
    this.riderGroup = new THREE.Group();
    
    // Premium Metallic Armor
    const armorMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x2b2b2b, 
      metalness: 0.8, 
      roughness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.0
    });
    
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, flatShading: true, roughness: 0.8 }); // Red sash
    const turbanMat = new THREE.MeshStandardMaterial({ color: 0xff6600, flatShading: true, roughness: 0.9 }); // Orange turban
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, flatShading: true, roughness: 0.6 }); // Skin
    
    // Rider Body (Armor)
    const riderBodyGeo = new THREE.BoxGeometry(1.4, 2, 1);
    const riderBody = new THREE.Mesh(riderBodyGeo, armorMat);
    riderBody.position.set(0, 4.5, 0.2);
    riderBody.castShadow = true;
    this.riderGroup.add(riderBody);

    // Rider Sash
    const sashGeo = new THREE.BoxGeometry(1.45, 0.4, 1.05);
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.set(0, 4.2, 0.2);
    this.riderGroup.add(sash);

    // Rider Head
    const riderHeadGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const riderHead = new THREE.Mesh(riderHeadGeo, skinMat);
    riderHead.position.set(0, 5.8, 0.2);
    riderHead.castShadow = true;
    this.riderGroup.add(riderHead);

    // Turban
    const turbanGeo = new THREE.BoxGeometry(1, 0.6, 1);
    const turban = new THREE.Mesh(turbanGeo, turbanMat);
    turban.position.set(0, 6.3, 0.2);
    this.riderGroup.add(turban);

    // Right Arm (holding sword)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.9, 5.2, 0.2);
    const armGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const arm = new THREE.Mesh(armGeo, armorMat);
    arm.position.set(0, -0.6, 0);
    this.rightArmGroup.add(arm);

    // Sword
    const swordGeo = new THREE.BoxGeometry(0.1, 3.5, 0.4);
    const swordMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xeeeeee, 
      metalness: 1.0, 
      roughness: 0.1,
      clearcoat: 1.0
    });
    this.sword = new THREE.Mesh(swordGeo, swordMat);
    this.sword.position.set(0, -0.6, -1.5);
    this.sword.rotation.x = Math.PI / 2;
    this.sword.castShadow = true;
    this.rightArmGroup.add(this.sword);

    this.riderGroup.add(this.rightArmGroup);
    
    this.group.add(this.riderGroup);

    this.group.position.set(0, 0, 20); // Near the camera
    this.scene.add(this.group);
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      
      // Jump
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !this.isJumping) {
        this.jump();
      }
      
      // Attack
      if (e.code === 'Space' && !this.isAttacking) {
        this.attack();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
    });
  }

  jump() {
    this.isJumping = true;
    this.yVelocity = this.jumpStrength;
    
    // Give horse an initial tilt when jumping
    this.horseGroup.rotation.x = -0.3;
  }

  attack() {
    this.isAttacking = true;
    this.attackTimer = 0.3; // Attack lasts for 0.3 seconds
  }

  flashRed() {
    // Flash all meshes in the group red temporarily
    const originalColors = new Map();
    
    this.group.traverse((child) => {
      if (child.isMesh && child.material) {
        originalColors.set(child, child.material.color.getHex());
        child.material.color.setHex(0xff0000);
      }
    });
    
    setTimeout(() => {
      this.group.traverse((child) => {
        if (child.isMesh && originalColors.has(child)) {
          child.material.color.setHex(originalColors.get(child));
        }
      });
    }, 200);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    // Update UI health bar
    const healthFill = document.getElementById('health-fill');
    if (healthFill) {
      healthFill.style.width = `${this.health}%`;
    }
  }

  fallIntoPit() {
    this.isFalling = true;
    this.takeDamage(100); // Instantly die
  }

  update(delta) {
    if (this.isFalling) {
      this.group.position.y -= 50 * delta;
      this.horseGroup.rotation.x -= 10 * delta;
      return; // Skip other logic
    }

    // Calculate base Y and Roll for wall running
    let targetBaseY = 0;
    let targetRoll = 0;
    
    if (Math.abs(this.group.position.x) > 20) {
      targetBaseY = (Math.abs(this.group.position.x) - 20) * 1.5;
      targetRoll = this.group.position.x > 0 ? Math.atan(1.5) : -Math.atan(1.5);
    }

    // Horizontal Movement
    if (this.keys.left && this.group.position.x > -this.boundary) {
      this.group.position.x -= this.speed * delta;
      targetRoll += 0.2; // Turn tilt
    } else if (this.keys.right && this.group.position.x < this.boundary) {
      this.group.position.x += this.speed * delta;
      targetRoll -= 0.2; // Turn tilt
    }

    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, 10 * delta);

    // Jumping & Gravity
    if (this.isJumping) {
      this.yVelocity += this.gravity * delta;
      this.group.position.y += this.yVelocity * delta;
      
      // Arc the horse while jumping
      if (this.yVelocity < 0) {
        this.horseGroup.rotation.x = THREE.MathUtils.lerp(this.horseGroup.rotation.x, 0.2, 5 * delta);
      }
      
      // Landing
      if (this.group.position.y <= targetBaseY) {
        this.group.position.y = targetBaseY;
        this.isJumping = false;
        this.yVelocity = 0;
        this.horseGroup.rotation.x = 0;
      }
    } else {
      // Horse galloping animation (only when grounded)
      this.group.position.y = targetBaseY + Math.abs(Math.sin(Date.now() * 0.01)) * 0.4;
      
      // Leg animation
      const time = Date.now() * 0.015;
      this.legs[0].rotation.x = Math.sin(time) * 0.5; // Front left
      this.legs[1].rotation.x = Math.sin(time + Math.PI) * 0.5; // Front right
      this.legs[2].rotation.x = Math.sin(time + Math.PI) * 0.5; // Back left
      this.legs[3].rotation.x = Math.sin(time) * 0.5; // Back right
    }

    // Attack animation
    if (this.isAttacking) {
      this.attackTimer -= delta;
      // Swing sword forward (rotate arm)
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -Math.PI / 1.5, 20 * delta);
      
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    } else {
      // Return arm to resting position
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, 10 * delta);
    }
  }
}
