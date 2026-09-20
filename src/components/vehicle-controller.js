/* Arcade vehicle physics driven by normalized input. */
AFRAME.registerComponent('vehicle-controller', {
  schema: {
    ground: { type: 'selector' },
    // Configurable limits in km/h; movement uses meters per second.
    maxSpeed: { default: 60 },
    reverseSpeed: { default: 15 }
  },

  init() {
    this.keyboardInput = new window.DrivingKeyboardInput();
    this.gamepadInput = new window.DrivingGamepadInput(document.querySelector('#gamepad-status'));
    this.speed = 0;
    this.speedometer = document.querySelector('#speedometer');
    this.speedValue = document.querySelector('#speed-value');
    this.impactCooldown = 0;
    this.recoilTime = 0;
    this.impactVelocity = new AFRAME.THREE.Vector3();
    this.shakeTime = 0;
    this.flash = document.querySelector('#collision-flash');
    this.startPosition = this.el.object3D.position.clone();
    this.startQuaternion = this.el.object3D.quaternion.clone();
    this.forward = new AFRAME.THREE.Vector3();
    this.carBounds = new AFRAME.THREE.Box3();
    this.clearInput = () => {
      this.keyboardInput.clear();
      this.speed = 0;
      this.recoilTime = 0;
      this.resetImpact();
      this.updateSpeedometer();
    };
    this.onVisibilityChange = () => {
      if (document.hidden) this.clearInput();
    };
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  },

  tick(time, delta) {
    if (!delta || document.hidden || !document.hasFocus()) return;
    const keyboard = this.keyboardInput.read();
    const gamepad = this.gamepadInput.read();
    // Keyboard takes precedence on each analog axis; either source can trigger actions.
    const input = {
      throttle: keyboard.throttle || gamepad.throttle,
      steering: keyboard.steering || gamepad.steering,
      handbrake: keyboard.handbrake || gamepad.handbrake,
      reset: keyboard.reset || gamepad.reset,
      camera: keyboard.camera || gamepad.camera
    };
    if (input.reset) this.resetVehicle();
    if (input.camera) this.el.emit('camera-toggle');
    if (!this.el.getObject3D('mesh')) return;
    const dt = Math.min(delta / 1000, 0.05);
    const mesh = this.el.getObject3D('mesh');
    if (this.shakeMesh !== mesh) {
      this.shakeMesh = mesh;
      this.meshRotation = mesh.rotation.clone();
    }
    mesh.rotation.copy(this.meshRotation);
    this.impactCooldown = Math.max(0, this.impactCooldown - dt);
    if (this.recoilTime > 0) {
      this.el.object3D.position.addScaledVector(this.impactVelocity, dt);
      this.impactVelocity.multiplyScalar(Math.exp(-6 * dt));
      this.recoilTime = Math.max(0, this.recoilTime - dt);
      this.enforceBounds();
      this.updateShake(dt);
      this.updateSpeedometer();
      return;
    }
    const { throttle, steering, handbrake } = input;
    if (this.recoilTime > 0 || handbrake || throttle === 0) {
      const slowing = (handbrake ? 12 : 3) * dt;
      this.speed = Math.sign(this.speed) * Math.max(0, Math.abs(this.speed) - slowing);
    } else {
      const acceleration = this.speed * throttle < 0 ? 12 : 5;
      this.speed = Math.max(-Math.max(0, this.data.reverseSpeed) / 3.6,
        Math.min(Math.max(0, this.data.maxSpeed) / 3.6, this.speed + throttle * acceleration * dt));
    }
    const car = this.el.object3D;
    // This model faces local +Z; rotation="0 90 0" turns it toward +X.
    car.rotation.y -= steering * Math.min(Math.abs(this.speed) / 3, 1)
      * Math.sign(this.speed) * 1.5 * dt;
    this.forward.set(0, 0, 1).applyQuaternion(car.quaternion);
    car.position.addScaledVector(this.forward, this.speed * dt);
    this.enforceBounds();
    this.updateShake(dt);
    this.updateSpeedometer();
  },

  updateSpeedometer() {
    if (!this.speedValue) return;
    if (this.speedometer) {
      this.speedometer.setAttribute('aria-valuemax', Math.max(0, this.data.maxSpeed, this.data.reverseSpeed));
    }
    // Scene units are treated as meters; m/s * 3.6 gives km/h.
    const speed = this.recoilTime > 0 ? this.impactVelocity.length() : Math.abs(this.speed);
    const value = String(Math.round(speed * 3.6));
    if (this.speedValue.textContent !== value) {
      this.speedValue.textContent = value;
      if (this.speedometer) this.speedometer.setAttribute('aria-valuenow', value);
    }
  },

  resetVehicle() {
    this.el.object3D.position.copy(this.startPosition);
    this.el.object3D.quaternion.copy(this.startQuaternion);
    this.speed = 0;
    this.impactCooldown = 0;
    this.recoilTime = 0;
    this.resetImpact();
    this.el.emit('vehicle-reset');
    if (this.flashAnimation) this.flashAnimation.cancel();
    this.keyboardInput.clear();
    this.updateSpeedometer();
  },

  resetImpact() {
    this.impactVelocity.set(0, 0, 0);
    this.shakeTime = 0;
    if (this.shakeMesh) this.shakeMesh.rotation.copy(this.meshRotation);
  },

  updateShake(dt) {
    if (!this.shakeMesh || this.shakeTime <= 0) return;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    const wobble = Math.sin((0.4 - this.shakeTime) * 55)
      * (this.shakeTime / 0.4) * this.shakeStrength;
    this.shakeMesh.rotation.x += wobble;
    this.shakeMesh.rotation.z += wobble * 0.5;
  },

  enforceBounds() {
    const ground = this.data.ground;
    if (!ground) return;
    // The ground is horizontal and aligned with world X/Z, as in index.html.
    const geometry = ground.getAttribute('geometry');
    const floor = ground.object3D;
    const halfWidth = geometry.width * Math.abs(floor.scale.x) / 2;
    const halfDepth = geometry.height * Math.abs(floor.scale.y) / 2;
    const minX = floor.position.x - halfWidth;
    const maxX = floor.position.x + halfWidth;
    const minZ = floor.position.z - halfDepth;
    const maxZ = floor.position.z + halfDepth;
    // Measure the whole model, including its scale and current rotation.
    this.el.object3D.updateWorldMatrix(true, true);
    this.carBounds.setFromObject(this.el.object3D);
    if (this.carBounds.isEmpty()) return;
    const box = this.carBounds;
    const correctionX = box.min.x < minX ? minX - box.min.x
      : box.max.x > maxX ? maxX - box.max.x : 0;
    const correctionZ = box.min.z < minZ ? minZ - box.min.z
      : box.max.z > maxZ ? maxZ - box.max.z : 0;
    if (correctionX || correctionZ) {
      this.el.object3D.position.x += correctionX;
      this.el.object3D.position.z += correctionZ;
      const impactSpeed = this.speed;
      if (Math.abs(impactSpeed) >= 0.5 && this.impactCooldown === 0) {
        // Reflect the velocity on the impacted wall, retaining some sideways motion.
        this.impactVelocity.copy(this.forward).multiplyScalar(impactSpeed);
        this.impactVelocity.x *= correctionX ? -0.35 : 0.65;
        this.impactVelocity.z *= correctionZ ? -0.35 : 0.65;
        if (correctionX) this.impactVelocity.x = Math.sign(correctionX) * Math.abs(this.impactVelocity.x);
        if (correctionZ) this.impactVelocity.z = Math.sign(correctionZ) * Math.abs(this.impactVelocity.z);
        this.speed = 0;
        this.recoilTime = 0.35;
        this.shakeTime = 0.4;
        this.shakeStrength = Math.min(0.07, Math.abs(impactSpeed) * 0.012);
        this.impactCooldown = 0.5;
        if (this.flash) {
          if (this.flashAnimation) this.flashAnimation.cancel();
          this.flashAnimation = this.flash.animate(
            [{ opacity: Math.min(1, 0.35 + Math.abs(impactSpeed) / 6) }, { opacity: 0 }],
            { duration: 350, easing: 'ease-out' }
          );
        }
      } else {
        this.speed = 0;
        if (correctionX) this.impactVelocity.x = 0;
        if (correctionZ) this.impactVelocity.z = 0;
      }
    }
  },

  remove() {
    this.resetImpact();
    if (this.flashAnimation) this.flashAnimation.cancel();
    this.keyboardInput.remove();
    window.removeEventListener('blur', this.clearInput);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
});

// The walls' inner faces coincide with the driving limits at the ground edges.
AFRAME.registerComponent('boundary-walls', {
  schema: {
    ground: { type: 'selector' },
    height: { default: 1 },
    thickness: { default: 0.4 }
  },

  init() {
    const createWall = () => {
      const wall = document.createElement('a-box');
      wall.setAttribute('material', 'color: #ffffff; roughness: 1; metalness: 0');
      wall.setAttribute('stone-wall', '');
      wall.setAttribute('shadow', 'cast: true; receive: true');
      this.el.appendChild(wall);
      return wall;
    };
    this.walls = Array.from({ length: 4 }, createWall);
    this.walls[1].setAttribute('visible', false);
    this.gateWallSections = Array.from({ length: 3 }, createWall);
    this.gates = Array.from({ length: 2 }, () => {
      const gate = document.createElement('a-entity');
      const part = (y, z, height, depth, color = '#41494f') => {
        const box = document.createElement('a-box');
        box.setAttribute('geometry', { primitive: 'box', width: this.data.thickness, height, depth });
        box.setAttribute('position', { x: 0, y, z });
        box.setAttribute('material', { color, roughness: 0.65, metalness: 0.45 });
        box.setAttribute('shadow', 'cast: true; receive: true');
        gate.appendChild(box);
      };
      for (const y of [0.08, 0.5, 0.94]) part(y, 0, 0.06, 1);
      for (let i = 0; i <= 20; i++) part(0.5, -0.5 + i / 20, 0.9, 0.012);
      for (const z of [-0.5, 0.5]) part(0.5, z, 1, 0.025, '#777970');
      // Red reflectors make the closed gates easy to identify from inside.
      part(0.5, -0.07, 0.09, 0.025, '#bb493a');
      part(0.5, 0.07, 0.09, 0.025, '#bb493a');
      this.el.appendChild(gate);
      return gate;
    });
    this.layoutKey = '';
  },

  tick() {
    const ground = this.data.ground;
    if (!ground) return;
    const geometry = ground.getAttribute('geometry');
    if (!geometry) return;
    const floor = ground.object3D;
    const width = geometry.width * Math.abs(floor.scale.x);
    const depth = geometry.height * Math.abs(floor.scale.y);
    const { height, thickness } = this.data;
    const { x, y, z } = floor.position;
    const layoutKey = [width, depth, height, thickness, x, y, z].join(',');
    if (layoutKey === this.layoutKey) return;
    this.layoutKey = layoutKey;
    const layouts = [
      [x - (width + thickness) / 2, z, thickness, depth + thickness * 2],
      [x + (width + thickness) / 2, z, thickness, depth + thickness * 2],
      [x, z - (depth + thickness) / 2, width, thickness],
      [x, z + (depth + thickness) / 2, width, thickness]
    ];
    layouts.forEach(([wallX, wallZ, wallWidth, wallDepth], index) => {
      this.walls[index].setAttribute('geometry', {
        primitive: 'box', width: wallWidth, height, depth: wallDepth
      });
      this.walls[index].setAttribute('position', { x: wallX, y: y + height / 2, z: wallZ });
    });
    // The PARE markings occupy two lanes on the +X side of the parking texture.
    const gateWidth = depth * 205 / 1024;
    const offset = depth * 127 / 1024;
    const wallX = x + (width + thickness) / 2;
    const ranges = [
      [-depth / 2 - thickness, -offset - gateWidth / 2],
      [-offset + gateWidth / 2, offset - gateWidth / 2],
      [offset + gateWidth / 2, depth / 2 + thickness]
    ];
    ranges.forEach(([start, end], index) => {
      this.gateWallSections[index].setAttribute('geometry', {
        primitive: 'box', width: thickness, height, depth: end - start
      });
      this.gateWallSections[index].setAttribute('position', {
        x: wallX, y: y + height / 2, z: z + (start + end) / 2
      });
    });
    this.gates.forEach((gate, index) => {
      gate.setAttribute('position', { x: wallX, y, z: z + (index === 0 ? -offset : offset) });
      gate.setAttribute('scale', { x: 1, y: height + 0.2, z: gateWidth });
    });
  },

  remove() {
    this.walls.forEach((wall) => wall.remove());
    this.gateWallSections.forEach((wall) => wall.remove());
    this.gates.forEach((gate) => gate.remove());
  }
});
