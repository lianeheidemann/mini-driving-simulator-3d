# Mini Driving Simulator 3D

A small browser-based 3D driving simulator built to study the integration of **Blender**, **A-Frame**, **Three.js**, and gamepad input.

The project idea is simple: create a 3D car and environment in Blender, export them to the web, render the scene with A-Frame, use Three.js for lower-level 3D behavior, and drive the vehicle using an Xbox-compatible controller or an emulated controller.

## Project goals

- Model a simple car and driving environment in Blender.
- Export 3D assets as `.glb` / `.gltf`.
- Build the web 3D scene with A-Frame.
- Use Three.js when more direct access to the 3D scene is needed.
- Read controller input through the browser Gamepad API.
- Support Xbox-compatible input, including virtual/emulated controllers when necessary.
- Start with simple movement before adding realistic vehicle physics.

## Technology overview

| Technology | Role in the project |
| --- | --- |
| Blender | Creates and prepares the car, track, obstacles, and other 3D assets. |
| glTF / GLB | Format used to export optimized 3D models from Blender to the browser. |
| A-Frame | Provides the main HTML-like structure for the 3D scene. |
| Three.js | Gives lower-level access to objects, vectors, rotations, cameras, and custom 3D behavior. |
| Gamepad API | Reads buttons, triggers, and analog sticks from a controller in the browser. |
| Xbox-compatible controller / emulator | Provides the driving input used by the simulator. |

## Proposed architecture

```text
Blender
  |
  | export .glb / .gltf
  v
3D Assets
  |
  v
A-Frame scene
  |
  +--> Camera / lights / entities
  |
  +--> Three.js objects and custom logic
                    ^
                    |
              Gamepad API
                    ^
                    |
        Xbox controller / emulator
```

## Initial controls

| Input | Action |
| --- | --- |
| Left analog stick | Steering |
| RT | Accelerate |
| LT | Brake / reverse |
| A | Handbrake |
| Y | Change camera |
| B | Reset vehicle |

The final mapping can be changed during development.

## Suggested project structure

```text
mini-driving-simulator-3d/
├── assets/
│   ├── models/
│   └── textures/
├── doc/
│   ├── README.md
│   ├── 01-blender.md
│   ├── 02-aframe.md
│   ├── 03-threejs.md
│   ├── 04-gamepad-input.md
│   └── 05-integration-guide.md
├── src/
│   ├── components/
│   └── controls/
├── index.html
└── README.md
```

> The code folders above represent the intended structure. They can be created gradually as the implementation begins.

## Recommended development order

1. Create a very simple car model in Blender.
2. Export the model as GLB.
3. Display the car in an A-Frame scene.
4. Add a ground plane, camera, and lighting.
5. Make the vehicle move with keyboard input first.
6. Read a connected controller with the Gamepad API.
7. Map steering, acceleration, and braking.
8. Add a follow camera.
9. Add simple collisions or boundaries.
10. Only then consider more realistic physics.

## Documentation

The `doc/` folder contains individual guides:

- [Documentation index](doc/README.md)
- [Blender and GLB export](doc/01-blender.md)
- [A-Frame scene setup](doc/02-aframe.md)
- [Three.js inside the project](doc/03-threejs.md)
- [Gamepad and Xbox-compatible input](doc/04-gamepad-input.md)
- [Complete integration guide](doc/05-integration-guide.md)

## Useful links

- Blender: https://www.blender.org/
- A-Frame: https://aframe.io/
- Three.js: https://threejs.org/
- MDN Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
- Microsoft Store controller/emulation tool referenced during project planning: https://apps.microsoft.com/detail/9mzxvnfhgdw7?hl=en-US&gl=PT

## First milestone

The first milestone is intentionally small:

> A car model exported from Blender appears in the browser and can move forward, backward, left, and right using an Xbox-compatible controller.

No realistic engine, suspension, transmission, or tire simulation is required for the first version.

## Status

Early development / learning project.
