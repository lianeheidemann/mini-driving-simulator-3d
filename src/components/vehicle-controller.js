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
