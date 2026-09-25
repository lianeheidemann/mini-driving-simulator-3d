// The walls' inner faces coincide with the driving limits at the ground edges.
AFRAME.registerComponent('boundary-walls', {
  schema: {
    ground: { type: 'selector' },
    height: { default: 1 },
    thickness: { default: 0.4 }
  },

  init() {
    const createWall = () => {
      const wall = document.createElement('a-box');
      wall.setAttribute('material', 'color: #ffffff; roughness: 1; metalness: 0');
      wall.setAttribute('stone-wall', '');
      wall.setAttribute('shadow', 'cast: true; receive: true');
      this.el.appendChild(wall);
      return wall;
    };
    this.walls = Array.from({ length: 4 }, createWall);
    this.walls[1].setAttribute('visible', false);
    this.gateWallSections = Array.from({ length: 3 }, createWall);
    this.gates = Array.from({ length: 2 }, () => {
      const gate = document.createElement('a-entity');
      const part = (y, z, height, depth, color = '#41494f') => {
        const box = document.createElement('a-box');
        box.setAttribute('geometry', { primitive: 'box', width: this.data.thickness, height, depth });
        box.setAttribute('position', { x: 0, y, z });
        box.setAttribute('material', { color, roughness: 0.65, metalness: 0.45 });
        box.setAttribute('shadow', 'cast: true; receive: true');
        gate.appendChild(box);
      };
      for (const y of [0.08, 0.5, 0.94]) part(y, 0, 0.06, 1);
      for (let i = 0; i <= 20; i++) part(0.5, -0.5 + i / 20, 0.9, 0.012);
      for (const z of [-0.5, 0.5]) part(0.5, z, 1, 0.025, '#777970');
      // Red reflectors make the closed gates easy to identify from inside.
      part(0.5, -0.07, 0.09, 0.025, '#bb493a');
      part(0.5, 0.07, 0.09, 0.025, '#bb493a');
      this.el.appendChild(gate);
      return gate;
    });
    this.layoutKey = '';
  },

  tick() {
    const ground = this.data.ground;
    if (!ground) return;
    const geometry = ground.getAttribute('geometry');
    if (!geometry) return;
    const floor = ground.object3D;
    const width = geometry.width * Math.abs(floor.scale.x);
    const depth = geometry.height * Math.abs(floor.scale.y);
    const { height, thickness } = this.data;
    const { x, y, z } = floor.position;
    const layoutKey = [width, depth, height, thickness, x, y, z].join(',');
    if (layoutKey === this.layoutKey) return;
    this.layoutKey = layoutKey;
    const layouts = [
      [x - (width + thickness) / 2, z, thickness, depth + thickness * 2],
      [x + (width + thickness) / 2, z, thickness, depth + thickness * 2],
      [x, z - (depth + thickness) / 2, width, thickness],
      [x, z + (depth + thickness) / 2, width, thickness]
    ];
    layouts.forEach(([wallX, wallZ, wallWidth, wallDepth], index) => {
      this.walls[index].setAttribute('geometry', {
        primitive: 'box', width: wallWidth, height, depth: wallDepth
      });
      this.walls[index].setAttribute('position', { x: wallX, y: y + height / 2, z: wallZ });
    });
    // The PARE markings occupy two lanes on the +X side of the parking texture.
    const gateWidth = depth * 205 / 1024;
    const offset = depth * 127 / 1024;
    const wallX = x + (width + thickness) / 2;
    const ranges = [
      [-depth / 2 - thickness, -offset - gateWidth / 2],
      [-offset + gateWidth / 2, offset - gateWidth / 2],
      [offset + gateWidth / 2, depth / 2 + thickness]
    ];
    ranges.forEach(([start, end], index) => {
      this.gateWallSections[index].setAttribute('geometry', {
        primitive: 'box', width: thickness, height, depth: end - start
      });
      this.gateWallSections[index].setAttribute('position', {
        x: wallX, y: y + height / 2, z: z + (start + end) / 2
      });
    });
    this.gates.forEach((gate, index) => {
      gate.setAttribute('position', { x: wallX, y, z: z + (index === 0 ? -offset : offset) });
      gate.setAttribute('scale', { x: 1, y: height + 0.2, z: gateWidth });
    });
  },

  remove() {
    this.walls.forEach((wall) => wall.remove());
    this.gateWallSections.forEach((wall) => wall.remove());
    this.gates.forEach((gate) => gate.remove());
  }
});
