# Complete Integration Guide

This guide describes a practical order for creating the first working version of the simulator.

The target is intentionally modest:

> Load a Blender car in the browser and drive it forward, backward, left, and right with a gamepad.

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

## Phase 6 — Create a gamepad input module

Create:

```text
src/controls/gamepad.js
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

## Minimum viable project

The first version is complete when all of these work:

- [ ] Browser scene opens without errors.
- [ ] Blender car loads.
- [ ] Scale and orientation are correct.
- [ ] Keyboard can move the car.
- [ ] Gamepad is detected.
- [ ] Left stick steers.
- [ ] Trigger accelerates.
- [ ] Brake/reverse input works.
- [ ] Camera follows the car.
- [ ] Vehicle can be reset.

## Good second-version features

After the minimum version works, consider:

- wheel rotation;
- front-wheel steering animation;
- speedometer;
- checkpoints;
- lap timer;
- simple collisions;
- engine audio;
- multiple camera modes;
- better lighting;
- larger Blender environment;
- mobile touch controls.

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
