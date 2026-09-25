// The only module that touches the HUD's DOM: gameplay code passes plain values in.
window.DrivingHud = class {
  constructor(sceneEl) {
    this.statusElement = document.querySelector('#gamepad-status');
    this.speedometer = document.querySelector('#speedometer');
    this.speedValue = document.querySelector('#speed-value');
    this.reverseIndicator = document.querySelector('#reverse-indicator');
    this.cameraLabel = document.querySelector('#camera-mode-label');
    this.collisionFlash = document.querySelector('#collision-flash');
    this.resetFade = document.querySelector('#reset-fade');
    this.flashAnimation = null;
    this.inputMode = null;
    this.sceneEl = sceneEl;
    this.onCameraMode = (event) => this.setCameraMode(event.detail.overhead);
    sceneEl.addEventListener('camera-mode-change', this.onCameraMode);
  }

  setSpeed(kmh, reversing, maxKmh) {
    if (!this.speedValue) return;
    if (this.speedometer) this.speedometer.setAttribute('aria-valuemax', maxKmh);
    const value = String(Math.round(kmh));
    if (this.speedValue.textContent !== value) {
      this.speedValue.textContent = value;
      if (this.speedometer) this.speedometer.setAttribute('aria-valuenow', value);
    }
    if (this.reverseIndicator) this.reverseIndicator.classList.toggle('visible', reversing);
  }

  // 'keyboard' or 'gamepad': selects which controls legend and camera hint are shown.
  setInputMode(mode) {
    if (!mode || mode === this.inputMode) return;
    this.inputMode = mode;
    document.body.dataset.inputMode = mode;
  }

  setCameraMode(overhead) {
    if (this.cameraLabel) {
      this.cameraLabel.textContent = overhead ? 'Câmera: vista de cima' : 'Câmera: atrás do carro';
    }
  }

  flashCollision(opacity) {
    if (!this.collisionFlash) return;
    this.cancelFlash();
    this.flashAnimation = this.collisionFlash.animate(
      [{ opacity }, { opacity: 0 }],
      { duration: 350, easing: 'ease-out' }
    );
  }

  cancelFlash() {
    if (this.flashAnimation) this.flashAnimation.cancel();
    this.flashAnimation = null;
  }

  setResetFade(opacity) {
    if (this.resetFade) this.resetFade.style.opacity = String(opacity);
  }

  remove() {
    this.cancelFlash();
    this.sceneEl.removeEventListener('camera-mode-change', this.onCameraMode);
  }
};
