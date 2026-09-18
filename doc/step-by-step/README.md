# Project Documentation

This folder is a practical guide for building the Mini Driving Simulator 3D from scratch.

## Learning path

Read the documents in this order:

1. [Blender and GLB export](archive/01-blender.md)
2. [A-Frame scene setup](archive/02-aframe.md)
3. [Three.js in the project](archive/03-threejs.md)
4. [Gamepad and Xbox-compatible input](archive/04-gamepad-input.md)
5. [Complete integration guide](05-integration-guide.md)

## What each layer does

```text
Blender
  -> creates the 3D content

GLB / glTF
  -> transports the 3D content to the web

A-Frame
  -> organizes the 3D scene with HTML-like entities

Three.js
  -> provides lower-level 3D objects and custom behavior

Gamepad API
  -> reads controller axes, buttons, and triggers

Controller / emulator
  -> produces the player's driving input
```

## Recommended strategy

Do not begin with realistic car physics.

Build the project in small milestones:

- [x] show a cube in A-Frame;
- [x] replace the cube with a Blender car;
- [x] move the car with the keyboard;
- [x] read the gamepad;
- [x] control steering and speed;
- [x] add a follow camera;
- [x] add boundaries/collisions;
- [ ] improve the model and environment.

This approach makes it easier to identify whether a problem comes from the 3D model, browser scene, movement logic, or controller input.
