window.DrivingGamepadInput = class {
  constructor(status) {
    this.status = status;
    this.previousReset = false;
    this.previousCamera = false;
    this.mappings = {
      // Standard Gamepad API indices used by Xbox-compatible controllers.
      standard: { steering: 0, accelerate: 7, brake: 6, handbrake: 0, reset: 1, camera: 3 },
      // DroidJoy's numbered layout is one-based in its UI, while pad.buttons is zero-based.
      // A=1, B=2, Y=4, LT=11 and RT=12 therefore become 0, 1, 3, 10 and 11.
      droidJoyNumbered: { steering: 0, accelerate: 11, brake: 10, handbrake: 0, reset: 1, camera: 3 }
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
    const button = (name) => pad.buttons[mapping[name]];
    const trigger = (name) => {
      const value = button(name)?.value || 0;
      return value < 0.05 ? 0 : value;
    };
    const axis = pad.axes[mapping.steering] || 0;
    input.steering = Math.abs(axis) <= 0.12 ? 0
      : -Math.sign(axis) * (Math.abs(axis) - 0.12) / 0.88;
    input.throttle = trigger('accelerate') - trigger('brake');
    input.handbrake = Boolean(button('handbrake')?.pressed);
    const reset = Boolean(button('reset')?.pressed);
    input.reset = reset && !this.previousReset;
    this.previousReset = reset;
    const camera = Boolean(button('camera')?.pressed);
    input.camera = camera && !this.previousCamera;
    this.previousCamera = camera;
    const profile = isStandard ? 'Xbox padrão' : 'DroidJoy numerado';
    this.setStatus(`Controle conectado (${profile}): ${pad.id} | RT: acelerar · LT: ré/freio · A: freio de mão · B: reiniciar`);
    return input;
  }

  setStatus(message) {
    if (this.status && this.status.textContent !== message) this.status.textContent = message;
  }
};
