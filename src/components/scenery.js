// Asphalt and parking lines drawn locally onto a single ground texture.
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
