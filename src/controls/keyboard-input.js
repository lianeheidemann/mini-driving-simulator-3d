// Normalizes keyboard events to the same driving commands as DrivingGamepadInput.
window.DrivingKeyboardInput = class {
  constructor(target = window) {
    this.keys = new Set();
    this.pendingReset = false;
    this.pendingCamera = false;
    this.onKeyDown = (event) => {
      const code = event.code;
      if (!['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'Space', 'KeyR', 'KeyY'].includes(code)) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      if (this.keys.has(code)) return;
      this.keys.add(code);
      if (code === 'KeyR') this.pendingReset = true;
      if (code === 'KeyY') this.pendingCamera = true;
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    this.target = target;
  }

  read() {
    const pressed = (...codes) => codes.some((code) => this.keys.has(code));
    const input = {
      throttle: Number(pressed('KeyW', 'ArrowUp')) - Number(pressed('KeyS', 'ArrowDown')),
      steering: Number(pressed('KeyA', 'ArrowLeft')) - Number(pressed('KeyD', 'ArrowRight')),
      handbrake: pressed('Space'),
      reset: this.pendingReset,
      camera: this.pendingCamera,
      active: this.keys.size > 0 || this.pendingReset || this.pendingCamera
    };
    this.pendingReset = false;
    this.pendingCamera = false;
    return input;
  }

  clear() {
    this.keys.clear();
    this.pendingReset = false;
    this.pendingCamera = false;
  }

  remove() {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.clear();
  }
};
