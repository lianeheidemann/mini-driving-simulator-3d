# Project Documentation

[← Back to the main README](../../README.md)

This folder is a practical guide for building the Mini Driving Simulator 3D from scratch.

> **Status:** the simulator described by guides 01–06 is fully implemented and
> running at the [live demo](https://lianeheidemann.github.io/mini-driving-simulator-3d/).
> The guides are kept as a learning path; their code snippets and paths match
> what ships today. Guide 07 lists optional extensions that are **not**
> implemented yet.

## Learning path

Read the documents in this order:

| # | Guide | What you get out of it |
| --- | --- | --- |
| 01 | [Blender and GLB export](archive/01-blender.md) | A car model exported as a single `.glb` with correct scale and orientation. |
| 02 | [A-Frame scene setup](archive/02-aframe.md) | A scene that loads the model and hosts custom components. |
| 03 | [Three.js in the project](archive/03-threejs.md) | Position, rotation, delta time, and forward movement through `object3D`. |
| 04 | [Gamepad and Xbox-compatible input](archive/04-gamepad-input.md) | Reading sticks, triggers, and buttons through the Gamepad API. |
| 05 | [Complete integration guide](archive/05-integration-guide.md) | The 13 phases that turn the pieces above into a drivable car. |
| 06 | [Android phone as a controller with DroidJoy](archive/06-droidjoy-phone-controller.md) | Driving with a phone through a virtual XInput controller. |
| 07 | [Advanced rendering & simulation techniques](archive/07-advanced-rendering-techniques.md) | Optional extensions: paint shader, GPU textures, tire slip, shadow frustum, image-based lighting. |

## What each layer does

```text
Blender
  -> creates the 3D content

GLB / glTF
  -> transports the 3D content to the web

A-Frame
  -> organizes the 3D scene with HTML-like entities and custom components

Three.js
  -> provides lower-level 3D objects and custom per-frame behavior

Keyboard events / Gamepad API
  -> read keys, controller axes, buttons, and triggers

Controller / emulator (Xbox pad, DroidJoy)
  -> produces the player's driving input
```

## Where each layer lives in the code

| Layer | Files |
| --- | --- |
| 3D assets | `input/car-v1.glb` (loaded by the scene); `input/car-v2.blend` / `car-v2-2.glb` (newer model in progress) |
| Scene, lighting, HUD | `index.html` |
| Vehicle physics, input combination, collisions, reset | `src/components/vehicle-controller.js` |
| Chase and overhead cameras | `src/components/follow-camera.js` |
| Walls and gated entrance | `src/components/boundary-walls.js` |
| Procedural textures and sky | `src/components/parking-surface.js`, `stone-wall.js`, `exterior-landscape.js`, `cloudy-sky.js` |
| Fullscreen toggle | `src/components/fullscreen-button.js` |
| Input readers | `src/controls/keyboard-input.js`, `src/controls/gamepad-input.js` |

Both input readers return the same logical commands —
`{ throttle, steering, handbrake, reset, camera }` — which
`vehicle-controller.js` combines before applying movement:

```text
Keyboard events -> keyboard-input.js --+
                                       +-> vehicle-controller.js -> vehicle movement
Gamepad API ----> gamepad-input.js ----+
```

The full source tree is in the main README's
[Project structure](../../README.md#project-structure).

## Recommended strategy

Do not begin with realistic car physics.

Build the project in small milestones:

- [x] show a cube in A-Frame;
- [x] replace the cube with a Blender car;
- [x] move the car with the keyboard;
- [x] read the gamepad;
- [x] normalize keyboard and gamepad into the same driving commands;
- [x] control steering and speed;
- [x] add a follow camera, then an overhead camera mode;
- [x] add boundaries/collisions with recoil;
- [x] build a gated parking-lot environment (walls, gates, ground/exterior textures, sky);
- [x] add a HUD (controller status, speedometer with reverse indicator, camera mode);
- [x] drive with an Android phone through DroidJoy;
- [x] add a fullscreen toggle;
- [ ] keep improving the model and environment further.

This approach makes it easier to identify whether a problem comes from the 3D model, browser scene, movement logic, or controller input.

The remaining specific goals (wheel animation, checkpoints, lap timer, engine audio, mobile touch controls, a larger environment) are tracked in the [Complete Integration Guide's second-version list](archive/05-integration-guide.md#good-second-version-features).

## Going further

Once the build above is working, [Advanced Rendering & Simulation Techniques](archive/07-advanced-rendering-techniques.md) proposes five extensions to the existing camera, lighting, texture, and vehicle systems — a custom paint shader, GPU-based procedural texturing, a slip-based tire model, a dynamic shadow-camera frustum, and image-based ambient lighting.
