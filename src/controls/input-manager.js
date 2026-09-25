// Owns the keyboard and gamepad readers and merges them into one set of driving commands.
window.DrivingInput = class {
  constructor(statusElement) {
    this.keyboard = new window.DrivingKeyboardInput();
    this.gamepad = new window.DrivingGamepadInput(statusElement);
    this.device = null;
  }

  read() {
    const keyboard = this.keyboard.read();
    const gamepad = this.gamepad.read();
    // The device used last wins; the keyboard wins a tie.
    if (keyboard.active) this.device = 'keyboard';
    else if (gamepad.active) this.device = 'gamepad';
    // Keyboard takes precedence on each analog axis; either source can trigger actions.
    return {
      throttle: keyboard.throttle || gamepad.throttle,
      steering: keyboard.steering || gamepad.steering,
      handbrake: keyboard.handbrake || gamepad.handbrake,
      reset: keyboard.reset || gamepad.reset,
      camera: keyboard.camera || gamepad.camera,
      device: this.device
    };
  }

  clear() {
    this.keyboard.clear();
  }

  remove() {
    this.keyboard.remove();
  }
};
