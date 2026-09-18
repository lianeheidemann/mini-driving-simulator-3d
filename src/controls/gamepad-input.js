window.DrivingGamepadInput = class {
  constructor(status) {
    this.status = status;
    this.previousReset = false;
    this.previousCamera = false;
    this.mapping = { steering: 0, accelerate: 7, brake: 6, handbrake: 0, reset: 1, camera: 3 };
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
    const pad = pads.find((p) => p && p.connected && p.mapping === 'standard');
    if (!pad) {
      this.previousReset = false;
      this.previousCamera = false;
      this.setStatus(pads.some((p) => p && p.connected)
        ? 'Controle sem mapeamento padrão. Use o teclado.'
        : 'Conecte o controle e pressione um botão. Teclado disponível.');
      return input;
    }
    const button = (name) => pad.buttons[this.mapping[name]];
    const trigger = (name) => {
      const value = button(name)?.value || 0;
      return value < 0.05 ? 0 : value;
    };
    const axis = pad.axes[this.mapping.steering] || 0;
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
    this.setStatus(`Controle conectado: ${pad.id} | RT: acelerar · LT: ré/freio · A: frear · B: reiniciar`);
    return input;
  }

  setStatus(message) {
    if (this.status && this.status.textContent !== message) this.status.textContent = message;
  }
};
