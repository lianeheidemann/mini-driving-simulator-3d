window.DrivingGamepadInput = class {
  constructor(status) {
    this.status = status;
    this.previousReset = false;
    this.previousCamera = false;
    this.mappings = {
      // Standard Gamepad API indices used by Xbox-compatible controllers.
      standard: {
        steeringAxes: [0, 2],
        accelerate: 7,
        brake: 6,
        digitalAccelerate: 5,
        digitalBrake: 4,
        steerLeft: 14,
        steerRight: 15,
        handbrake: 0,
        reset: 1,
        camera: 3,
        cameraScreen: 9
      },
      // DroidJoy's numbered layout is one-based in its UI, while pad.buttons is zero-based.
      // A=1, B=2, Y=4, LB=5, RB=6, LT=11 and RT=12 become indices 0, 1, 3,
      // 4, 5, 10 and 11. The D-pad fallback requires a standard browser mapping.
      droidJoyNumbered: {
        steeringAxes: [0, 2],
        accelerate: 11,
        brake: 10,
        digitalAccelerate: 5,
        digitalBrake: 4,
        handbrake: 0,
        reset: 1,
        camera: 3,
        cameraScreen: 7
      }
    };
  }

  read() {
    const input = { throttle: 0, steering: 0, handbrake: false, reset: false, camera: false };
    let pads;
    try {
      pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    } catch (error) {
      this.setStatus('Controle indisponível. Abra o jogo por localhost.');
      return input;
    }
    // Prefer a browser-normalized controller, but also accept DroidJoy when the
    // browser exposes it as an unrecognized/non-standard gamepad.
    const pad = pads.find((p) => p && p.connected && p.mapping === 'standard')
      || pads.find((p) => p && p.connected);
    if (!pad) {
      this.previousReset = false;
      this.previousCamera = false;
      this.setStatus('Conecte o controle e pressione um botão. Teclado disponível.');
      return input;
    }
    const isStandard = pad.mapping === 'standard';
    const mapping = isStandard ? this.mappings.standard : this.mappings.droidJoyNumbered;
    const button = (name) => {
      const index = mapping[name];
      return Number.isInteger(index) ? pad.buttons[index] : undefined;
    };
    const pressed = (name) => Boolean(button(name)?.pressed);
    const trigger = (name) => {
      const value = button(name)?.value || 0;
      return value < 0.05 ? 0 : value;
    };
    // Accept either DroidJoy stick. The custom layout can expose its only
    // on-screen joystick as the left (axis 0) or right (axis 2) Xbox stick.
    const axis = mapping.steeringAxes
      .map((index) => pad.axes[index] || 0)
      .reduce((strongest, value) => Math.abs(value) > Math.abs(strongest) ? value : strongest, 0);
    const deadzone = 0.12;
    const normalizedAxis = Math.abs(axis) <= deadzone ? 0
      : (Math.abs(axis) - deadzone) / (1 - deadzone);
    // A softer-than-linear curve compensates for the short travel of a phone stick.
    const analogSteering = -Math.sign(axis) * Math.pow(normalizedAxis, 0.65);
    const digitalSteering = Number(pressed('steerLeft')) - Number(pressed('steerRight'));
    input.steering = digitalSteering || analogSteering;
    const accelerate = Math.max(trigger('accelerate'), trigger('digitalAccelerate'));
    const brake = Math.max(trigger('brake'), trigger('digitalBrake'));
    input.throttle = accelerate - brake;
    input.handbrake = pressed('handbrake');
    const reset = pressed('reset');
    input.reset = reset && !this.previousReset;
    this.previousReset = reset;
    // DroidJoy's screen/menu control is number 8 in its editor. XInput exposes
    // it as Start (button 9); the raw numbered profile exposes it as index 7.
    const camera = pressed('camera') || pressed('cameraScreen');
    input.camera = camera && !this.previousCamera;
    this.previousCamera = camera;
    const profile = isStandard ? 'Xbox padrão' : 'DroidJoy numerado';
    this.setStatus(`Controle conectado (${profile}): ${pad.id} | RT/RB: acelerar · LT/LB: ré/freio · A: freio de mão · B: reiniciar · 8: câmera`);
    return input;
  }

  setStatus(message) {
    if (this.status && this.status.textContent !== message) this.status.textContent = message;
  }
};
