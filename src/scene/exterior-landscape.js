// Asphalt and parking lines drawn locally onto a single ground texture.
AFRAME.registerComponent('exterior-landscape', {
  schema: { ground: { type: 'selector' } },

  init() {
    this.texture = null;
  },

  buildTexture() {
    const ground = this.data.ground;
    const parking = ground.getAttribute('geometry');
    const terrain = this.el.getAttribute('geometry');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const sx = canvas.width / terrain.width;
    const sz = canvas.height / terrain.height;
    ctx.fillStyle = '#64854b';
    ctx.fillRect(0, 0, 2048, 2048);
    let seed = 654;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const greens = ['#587a41', '#6e8e51', '#608147', '#759557'];
    for (let i = 0; i < 240000; i++) {
      ctx.fillStyle = greens[Math.floor(random() * greens.length)];
      ctx.fillRect(random() * 2048, random() * 2048, 1, 2 + random() * 3);
    }
    const floor = ground.object3D;
    const width = parking.width * Math.abs(floor.scale.x);
    const depth = parking.height * Math.abs(floor.scale.y);
    const startX = floor.position.x + width / 2;
    const roadWidth = depth * 205 / 1024;
    const offset = depth * 127 / 1024;
    const px = (x) => (x + terrain.width / 2) * sx;
    const py = (z) => (z + terrain.height / 2) * sz;
    for (const side of [-1, 1]) {
      const centerZ = floor.position.z + side * offset;
      ctx.fillStyle = '#65655b';
      ctx.fillRect(px(startX), py(centerZ - roadWidth / 2),
        canvas.width - px(startX), roadWidth * sz);
      // Muted shoulder lines and one small arrow keep the exterior unobtrusive.
      ctx.fillStyle = '#929387';
      for (const edge of [-1, 1]) {
        ctx.fillRect(px(startX), py(centerZ + edge * (roadWidth / 2 - 0.25)),
          canvas.width - px(startX), 0.08 * sz);
      }
      {
        const x = startX + 8;
        ctx.save();
        ctx.translate(px(x), py(centerZ));
        ctx.scale(sx * 0.7, sz * 0.7);
        if (side === 1) ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.moveTo(-1.5, -0.18);
        ctx.lineTo(0.4, -0.18);
        ctx.lineTo(0.4, -0.7);
        ctx.lineTo(1.5, 0);
        ctx.lineTo(0.4, 0.7);
        ctx.lineTo(0.4, 0.18);
        ctx.lineTo(-1.5, 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    this.texture = new AFRAME.THREE.CanvasTexture(canvas);
    this.texture.colorSpace = AFRAME.THREE.SRGBColorSpace;
    this.texture.anisotropy = Math.min(4,
      this.el.sceneEl.renderer?.capabilities.getMaxAnisotropy() || 1);
  },

  tick() {
    const ground = this.data.ground;
    const mesh = this.el.getObject3D('mesh');
    if (!ground || !ground.getAttribute('geometry') || !mesh) return;
    if (!this.texture) this.buildTexture();
    if (mesh.material === this.material) return;
    this.material = mesh.material;
    this.material.map = this.texture;
    this.material.color.set('#ffffff');
    this.material.needsUpdate = true;
  },

  remove() {
    if (this.material && this.material.map === this.texture) {
      this.material.map = null;
      this.material.needsUpdate = true;
    }
    if (this.texture) this.texture.dispose();
  }
});
