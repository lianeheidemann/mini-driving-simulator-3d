// Parking-lot ground texture: numbered bays, lane markings, and a crosswalk.
AFRAME.registerComponent('parking-surface', {
  init() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#56534e';
    ctx.fillRect(0, 0, 1024, 1024);
    let seed = 12345;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const colors = ['#514e49', '#5c5953', '#55524c', '#605d57'];
    for (let i = 0; i < 65000; i++) {
      ctx.fillStyle = colors[Math.floor(random() * colors.length)];
      ctx.fillRect(random() * 1024, random() * 1024, 0.5 + random(), 0.5 + random());
    }
    // Two rows of spaces, leaving the middle clear for driving.
    const spacesPerRow = 8;
    const spaceWidth = (935 - 85) / spacesPerRow;
    ctx.strokeStyle = '#c9cdd1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const [outer, inner] of [[64, 240], [960, 784]]) {
      ctx.moveTo(85, inner);
      ctx.lineTo(935, inner);
      for (let i = 0; i <= spacesPerRow; i++) {
        const x = 85 + i * spaceWidth;
        ctx.moveTo(x, outer);
        ctx.lineTo(x, inner);
      }
    }
    ctx.stroke();
    // Numbered bays with wheel-stop markings at their far ends.
    ctx.fillStyle = '#c9cdd1';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < spacesPerRow; i++) {
      const x = 85 + (i + 0.5) * spaceWidth;
      ctx.fillText(String(i + 1).padStart(2, '0'), x, 210);
      ctx.save();
      ctx.translate(x, 814);
      ctx.rotate(Math.PI);
      ctx.fillText(String(i + spacesPerRow + 1).padStart(2, '0'), 0, 0);
      ctx.restore();
      ctx.fillRect(x - 25, 87, 50, 5);
      ctx.fillRect(x - 25, 932, 50, 5);
    }
    // Two opposing lanes, separated by a yellow dashed center line.
    ctx.strokeStyle = '#d4b76b';
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 20]);
    ctx.beginPath();
    ctx.moveTo(95, 512);
    ctx.lineTo(810, 512);
    ctx.stroke();
    ctx.setLineDash([]);
    const arrow = (x, y, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = '#c9cdd1';
      ctx.beginPath();
      ctx.moveTo(-45, -9);
      ctx.lineTo(10, -9);
      ctx.lineTo(10, -26);
      ctx.lineTo(48, 0);
      ctx.lineTo(10, 26);
      ctx.lineTo(10, 9);
      ctx.lineTo(-45, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    for (const x of [260, 520, 720]) {
      arrow(x, 385, 0);
      arrow(x, 640, Math.PI);
    }
    // A pedestrian crossing spans both lanes at one end of the parking aisle.
    ctx.fillStyle = '#c9cdd1';
    for (let x = 850; x < 920; x += 20) ctx.fillRect(x, 275, 12, 474);
    ctx.fillRect(817, 275, 7, 205);
    ctx.fillRect(944, 545, 7, 204);
    ctx.font = 'bold 30px sans-serif';
    for (const [x, y, angle] of [[780, 385, Math.PI / 2], [980, 640, -Math.PI / 2]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText('PARE', 0, 0);
      ctx.restore();
    }
    this.texture = new AFRAME.THREE.CanvasTexture(canvas);
    this.texture.colorSpace = AFRAME.THREE.SRGBColorSpace;
    this.texture.anisotropy = Math.min(4,
      this.el.sceneEl.renderer?.capabilities.getMaxAnisotropy() || 1);
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
