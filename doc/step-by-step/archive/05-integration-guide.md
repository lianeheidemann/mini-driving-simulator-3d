# Complete Integration Guide

[← Back to documentation index](../README.md)

This guide describes a practical order for creating the first working version of the simulator.

The target is intentionally modest:

> Load a Blender car in the browser and drive it forward, backward, left, and right with a gamepad.

> **Status:** every phase and checklist item below is implemented in the current codebase. The guide is kept as a learning path for anyone rebuilding the project from scratch; code snippets and paths were updated to match what actually ships today. Anything still missing lives in [Good second-version features](#good-second-version-features) below, and further extensions in [guide 07](07-advanced-rendering-techniques.md).

## Phase 1 — Create the web scene

Create:

```text
index.html
```

Start with A-Frame and a basic ground plane.

Do not add the car immediately.

Confirm that the browser displays a 3D scene.

## Phase 2 — Create the Blender car

Create a simple vehicle in Blender.

For the first version:

- one body mesh is enough;
- wheels can be separate objects;
- use simple materials;
- avoid excessive geometry.

Export:

```text
assets/models/car.glb
```

> In this project the exported model lives at `input/car-v1.glb` (with later iterations `input/car-v2.blend` / `input/car-v2-2.glb` kept alongside it), not under `assets/`.

## Phase 3 — Load the car

Add the asset:

```html
<a-assets>
  <a-asset-item
    id="car-model"
    src="./assets/models/car.glb">
  </a-asset-item>
</a-assets>
```

Add the entity:

```html
<a-entity
  id="car"
  gltf-model="#car-model"
  position="0 0 0">
</a-entity>
```

Do not continue until scale and orientation are correct.

> The actual entity in `index.html` also sets `shadow`, `rotation="0 90 0"` (the model faces local +Z), `scale="5 5 5"`, and the `vehicle-controller` component described in Phase 4.

## Phase 4 — Build a vehicle component

Create:

```text
src/components/vehicle-controller.js
```

Suggested state:

```javascript
this.speed = 0;
this.maxForwardSpeed = 12;
this.maxReverseSpeed = 4;
this.acceleration = 8;
this.braking = 12;
this.drag = 4;
this.steeringSpeed = 1.8;
```

The component should update the car every frame.

## Phase 5 — Add keyboard controls first

Before debugging a controller, test the driving logic with keys.

Example idea:

```text
W = accelerate
S = brake / reverse
A = steer left
D = steer right
```

This separates vehicle bugs from gamepad bugs.

If keyboard movement works, the vehicle logic is probably correct.

> In this project keyboard handling was kept inline in `vehicle-controller.js` (its `onKeyDown`/`onKeyUp` listeners and the `keys` set) rather than split into a separate `src/controls/keyboard.js` module — the separation described in Phase 6 turned out to matter for the gamepad, not the keyboard.

## Phase 6 — Create a gamepad input module

Create:

```text
src/controls/gamepad-input.js
```

Its job should be to return logical values such as:

```javascript
{
  steering: 0.0,
  throttle: 0.0,
  brake: 0.0,
  handbrake: false,
  reset: false
}
```

The vehicle controller should not need to know which physical button index produced those values.

This is an important separation of responsibilities.

> `DrivingGamepadInput.read()` returns `{ throttle, steering, handbrake, reset, camera }`, where `throttle` already combines the accelerate/brake triggers into one signed value and `camera` toggles the view (see [gamepad-input.js](../../../src/controls/gamepad-input.js)). It also auto-selects between the browser's `standard` mapping (Xbox-compatible controllers) and a numbered fallback used by DroidJoy — see [06-droidjoy-phone-controller.md](06-droidjoy-phone-controller.md).

## Phase 7 — Connect input to movement

Concept:

```text
Gamepad API
    |
    v
gamepad.js
    |
    v
logical controls
    |
    v
vehicle-controller.js
    |
    v
Three.js transform
    |
    v
car moves
```

## Phase 8 — Implement simple acceleration

Pseudo-code:

```javascript
if (throttle > 0) {
  speed += acceleration * throttle * dt;
}

if (brake > 0) {
  speed -= braking * brake * dt;
}
```

Clamp the resulting speed.

## Phase 9 — Implement steering

Pseudo-code:

```javascript
car.rotation.y +=
  steering *
  steeringSpeed *
  dt;
```

A later version can reduce steering sensitivity at high speed.

## Phase 10 — Move in the car direction

Use a Three.js vector:

```javascript
const forward = new THREE.Vector3(0, 0, -1);
forward.applyQuaternion(car.quaternion);

car.position.addScaledVector(
  forward,
  speed * dt
);
```

This is more correct than changing a fixed global axis because the car may be rotated.

## Phase 11 — Add a follow camera

Start with a simple camera behind and above the car.

Example conceptual offset:

```text
x = 0
y = 3
z = 6
```

Rotate the offset with the vehicle and add it to the vehicle position.

Later, interpolate toward the desired position for smoother motion.

## Phase 12 — Add reset

Store a starting transform:

```text
position = 0, 0, 0
rotation = 0, 0, 0
```

A reset button should:

- zero the speed;
- restore position;
- restore rotation.

This is useful even before collision physics exists.

## Phase 13 — Add boundaries

The first track does not require a full physics engine.

Possible first solution:

- define road limits;
- detect when the car leaves the allowed region;
- reduce speed or reset the car.

Only introduce a physics library if the project actually needs it.

## Proposed source structure

```text
mini-driving-simulator-3d/
├── assets/
│   ├── models/
│   │   └── car.glb
│   └── textures/
│
├── doc/
│
├── src/
│   ├── components/
│   │   ├── vehicle-controller.js
│   │   └── follow-camera.js
│   │
│   └── controls/
│       ├── keyboard.js
│       └── gamepad.js
│
├── index.html
└── README.md
```

### Current source structure

What the project actually settled on (see the main [README's Project structure](../../../README.md#project-structure) for the full, up-to-date tree):

```text
mini-driving-simulator-3d/
├── doc/step-by-step/               # This guide and the rest of the docs
├── input/                          # car-v1.glb (used by index.html) and later .blend/.glb iterations
├── src/
│   ├── components/
│   │   ├── vehicle-controller.js   # Driving physics, keyboard input, collisions/recoil, reset, boundary-walls
│   │   ├── follow-camera.js        # Chase and overhead camera modes
│   │   └── scenery.js              # Stone-wall/parking/exterior-landscape textures, cloudy sky
│   └── controls/
│       └── gamepad-input.js        # Gamepad API -> logical driving input (Xbox-standard + DroidJoy fallback)
├── index.html
└── README.md
```

There is no `assets/` folder and no separate `keyboard.js` — keyboard handling stayed inline in `vehicle-controller.js`, which also grew to include the `boundary-walls` A-Frame component (the walls and gated entrance), beyond what the original phase-by-phase plan proposed.

## Minimum viable project

The first version is complete when all of these work:

- [x] Browser scene opens without errors.
- [x] Blender car loads.
- [x] Scale and orientation are correct.
- [x] Keyboard can move the car.
- [x] Gamepad is detected.
- [x] Left stick steers.
- [x] Trigger accelerates.
- [x] Brake/reverse input works.
- [x] Camera follows the car.
- [x] Vehicle can be reset.

All ten items are live in the current build — try it at the [live demo](../../../README.md).

## Good second-version features

After the minimum version works, consider:

- [ ] wheel rotation;
- [ ] front-wheel steering animation;
- [x] speedometer;
- [ ] checkpoints;
- [ ] lap timer;
- [x] simple collisions;
- [ ] engine audio;
- [x] multiple camera modes;
- [x] better lighting;
- [ ] larger Blender environment;
- [ ] mobile touch controls;

## What not to build first

Avoid starting with:

- realistic tire friction;
- suspension simulation;
- gearbox simulation;
- drivetrain modeling;
- networking;
- multiplayer;
- advanced AI traffic.

Those features make debugging much harder before the core architecture is working.
