/* Follow the vehicle's heading without inheriting the model's scale or shaking. */
AFRAME.registerComponent('follow-camera', {
  schema: {
    target: { type: 'selector' },
    ground: { type: 'selector' },
    overheadHeight: { default: 26 },
    distance: { default: 8 },
    height: { default: 4 },
    lookHeight: { default: 1 },
    smoothing: { default: 5 },
    transitionDuration: { default: 1.2 }
  },

  init() {
    this.targetPosition = new AFRAME.THREE.Vector3();
    this.targetRotation = new AFRAME.THREE.Quaternion();
    this.desiredPosition = new AFRAME.THREE.Vector3();
    this.lookTarget = new AFRAME.THREE.Vector3();
    this.transitionFromPosition = new AFRAME.THREE.Vector3();
    this.transitionFromRotation = new AFRAME.THREE.Quaternion();
    this.orientationCamera = new AFRAME.THREE.PerspectiveCamera();
    this.transitioning = false;
    this.snap = true;
    this.overhead = false;
    this.onToggle = () => {
      this.overhead = !this.overhead;
      if (!this.snap) {
        // Restart from the current view even when Y is pressed during a transition.
        this.transitionFromPosition.copy(this.el.object3D.position);
        this.transitionFromRotation.copy(this.el.getObject3D('camera').quaternion);
        this.transitionElapsed = 0;
        this.transitioning = true;
      }
      const label = document.querySelector('#camera-mode');
      if (label) label.textContent = this.overhead
        ? 'Câmera: vista de cima · Y para trocar'
        : 'Câmera: atrás do carro · Y para trocar';
    };
    this.onReset = () => {
      this.snap = true;
      this.transitioning = false;
    };
    this.el.sceneEl.addEventListener('vehicle-reset', this.onReset);
    this.el.sceneEl.addEventListener('camera-toggle', this.onToggle);
  },

  tick(time, delta) {
    const target = this.data.target;
    const view = this.el.getObject3D('camera');
    if (!target || !target.getObject3D('mesh') || !view) return;
    const car = target.object3D;
    car.getWorldPosition(this.targetPosition);
    car.getWorldQuaternion(this.targetRotation);
    // Vehicle forward is +Z; behind it is -Z.
    if (this.overhead) {
      const ground = this.data.ground;
      if (!ground) return;
      ground.object3D.getWorldPosition(this.lookTarget);
      const geometry = ground.getAttribute('geometry');
      const floor = ground.object3D;
      // Fit the full court, including a margin for walls, on wide or narrow screens.
      const halfWidth = geometry.width * Math.abs(floor.scale.x) / 2 + 1;
      const halfDepth = geometry.height * Math.abs(floor.scale.y) / 2 + 1;
      const fitHeight = Math.max(halfDepth, halfWidth / Math.max(view.aspect, 0.1))
        / Math.tan(view.fov * Math.PI / 360) * 1.1;
      this.desiredPosition.copy(this.lookTarget);
      this.desiredPosition.y += Math.max(this.data.overheadHeight, fitHeight);
      // Keep the court's orientation fixed, independent of the vehicle's heading.
    } else {
      this.desiredPosition.set(0, this.data.height, -this.data.distance)
        .applyQuaternion(this.targetRotation).add(this.targetPosition);
      this.lookTarget.copy(this.targetPosition);
      this.lookTarget.y += this.data.lookHeight;
    }
    const camera = this.el.object3D;
    const dt = Math.min((delta || 0) / 1000, 0.05);
    let rotationBlend = null;
    if (this.snap) {
      camera.position.copy(this.desiredPosition);
      this.snap = false;
    } else if (this.transitioning) {
      this.transitionElapsed += dt;
      const progress = Math.min(1, this.transitionElapsed / Math.max(0.01, this.data.transitionDuration));
      // Ease in and out, reaching the exact destination at the end.
      const blend = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(this.transitionFromPosition, this.desiredPosition, blend);
      rotationBlend = blend;
      if (progress === 1) this.transitioning = false;
    } else if (this.overhead) {
      camera.position.copy(this.desiredPosition);
    } else {
      camera.position.lerp(this.desiredPosition, 1 - Math.exp(-this.data.smoothing * dt));
    }
    // Looking straight down with Y-up is ambiguous. Use a fixed north direction
    // for the top view and interpolate rotations instead of a moving look point.
    this.orientationCamera.position.copy(rotationBlend === null ? camera.position : this.desiredPosition);
    this.orientationCamera.up.set(0, this.overhead ? 0 : 1, this.overhead ? -1 : 0);
    this.orientationCamera.lookAt(this.lookTarget);
    if (rotationBlend === null) {
      view.quaternion.copy(this.orientationCamera.quaternion);
    } else {
      view.quaternion.slerpQuaternions(this.transitionFromRotation,
        this.orientationCamera.quaternion, rotationBlend);
    }
  },

  remove() {
    this.el.sceneEl.removeEventListener('vehicle-reset', this.onReset);
    this.el.sceneEl.removeEventListener('camera-toggle', this.onToggle);
  }
});
