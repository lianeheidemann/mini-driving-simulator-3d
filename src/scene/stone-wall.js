// Procedural stone-block texture, tiled per face so blocks keep a fixed physical size.
AFRAME.registerComponent('stone-wall', {
  init() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#56534d';
    ctx.fillRect(0, 0, 512, 512);
    let seed = 369;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let row = 0; row < 8; row++) {
      const offset = row % 2 ? -64 : 0;
      for (let col = 0; col < 5; col++) {
        const x = offset + col * 128;
        const y = row * 64;
        const gray = 120 + Math.floor(random() * 45);
        const gradient = ctx.createLinearGradient(0, y, 0, y + 64);
        gradient.addColorStop(0, `rgb(${gray + 15}, ${gray + 12}, ${gray + 5})`);
        gradient.addColorStop(1, `rgb(${gray - 15}, ${gray - 17}, ${gray - 23})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 4);
        ctx.lineTo(x + 119, y + 6);
        ctx.lineTo(x + 124, y + 15);
        ctx.lineTo(x + 121, y + 52);
        ctx.lineTo(x + 111, y + 60);
        ctx.lineTo(x + 12, y + 59);
        ctx.lineTo(x + 4, y + 48);
        ctx.lineTo(x + 5, y + 13);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (let i = 0; i < 18000; i++) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2);
    }
    this.canvas = canvas;
    this.textures = [];
    this.materials = [];
  },

  tick() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    if (!this.mesh) {
      this.mesh = mesh;
      this.originalMaterial = mesh.material;
      this.materials = Array.from({ length: 6 }, () => {
        const texture = new AFRAME.THREE.CanvasTexture(this.canvas);
        texture.colorSpace = AFRAME.THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = AFRAME.THREE.RepeatWrapping;
        this.textures.push(texture);
        const material = this.originalMaterial.clone();
        material.map = texture;
        material.bumpMap = texture;
        material.bumpScale = 0.035;
        material.needsUpdate = true;
        return material;
      });
      mesh.material = this.materials;
    }
    const { width, height, depth } = this.el.getAttribute('geometry');
    const key = [width, height, depth].join(',');
    if (this.layoutKey === key) return;
    this.layoutKey = key;
    // Repeat by physical face dimensions so the stones aren't stretched.
    const faces = [[depth, height], [depth, height], [width, depth],
      [width, depth], [width, height], [width, height]];
    faces.forEach(([w, h], index) => this.textures[index].repeat.set(w / 2, h / 2));
  },

  remove() {
    if (this.mesh && this.mesh.material === this.materials) this.mesh.material = this.originalMaterial;
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }
});
