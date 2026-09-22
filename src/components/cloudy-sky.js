// Procedural gradient sky with scattered cloud clusters, wrapped for the sky sphere's seam.
AFRAME.registerComponent('cloudy-sky', {
  init() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#397fba');
    gradient.addColorStop(0.3, '#76add4');
    gradient.addColorStop(0.5, '#bfd5e2');
    gradient.addColorStop(1, '#a1bdcf');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);
    let seed = 789;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    // Soft cloud clusters all around the upper hemisphere, wrapping at the seam.
    for (let i = 0; i < 32; i++) {
      const x = random() * 2048;
      const y = 150 + random() * 300;
      const size = 24 + random() * 40;
      const puffs = Array.from({ length: 7 }, (_, j) => ({
        x: x + (j - 3) * size * 0.65,
        y: y - random() * size * 0.4,
        radius: size * (0.7 + random() * 0.4)
      }));
      for (const wrap of [-2048, 0, 2048]) {
        for (const puff of puffs) {
          const cloud = ctx.createRadialGradient(
            puff.x + wrap, puff.y, 0, puff.x + wrap, puff.y, puff.radius);
          cloud.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          cloud.addColorStop(0.55, 'rgba(242, 247, 251, 0.55)');
          cloud.addColorStop(1, 'rgba(242, 247, 251, 0)');
          ctx.fillStyle = cloud;
          ctx.save();
          ctx.translate(puff.x + wrap, puff.y);
          ctx.scale(1, 0.55);
          ctx.translate(-puff.x - wrap, -puff.y);
          ctx.fillRect(puff.x + wrap - puff.radius, puff.y - puff.radius,
            puff.radius * 2, puff.radius * 2);
          ctx.restore();
        }
      }
    }
    this.texture = new AFRAME.THREE.CanvasTexture(canvas);
    this.texture.colorSpace = AFRAME.THREE.SRGBColorSpace;
  },

  tick() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh || mesh.material === this.material) return;
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
    this.texture.dispose();
  }
});
