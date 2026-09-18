# A-Frame Scene Setup

[← Back to documentation index](../README.md)

## Purpose

A-Frame is the main scene layer of this project.

It is a web framework for 3D, AR, and VR experiences. It allows many scene objects to be declared using HTML-like elements instead of creating every Three.js object manually.

Conceptually:

```html
<a-scene>
  <a-entity></a-entity>
</a-scene>
```

## Minimal scene

A simple starting page can look like this:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mini Driving Simulator 3D</title>

  <script src="https://aframe.io/releases/1.8.0/aframe.min.js"></script>
</head>

<body>
  <a-scene>
    <a-box
      position="0 0.5 -4"
      color="#7a5cff">
    </a-box>

    <a-plane
      rotation="-90 0 0"
      width="30"
      height="30"
      color="#777">
    </a-plane>

    <a-sky color="#ECECEC"></a-sky>
  </a-scene>
</body>
</html>
```

Before loading the car, verify that this simple scene works.

## Loading the Blender model

A-Frame can preload the GLB asset:

```html
<a-assets>
  <a-asset-item
    id="car-model"
    src="./assets/models/car.glb">
  </a-asset-item>
</a-assets>
```

Then create an entity for it:

```html
<a-entity
  id="car"
  gltf-model="#car-model"
  position="0 0 0">
</a-entity>
```

## Why use an entity for the car?

The entity becomes the runtime representation of the vehicle.

Your JavaScript can access it:

```javascript
const car = document.querySelector('#car');
```

And its underlying Three.js object:

```javascript
const object3D = car.object3D;
```

This bridge is one of the most important concepts in the project.

## A-Frame responsibilities

A-Frame is a good place for:

- scene structure;
- asset declaration;
- lights;
- camera entities;
- model entities;
- reusable components;
- simple declarative positioning.

Three.js can then be used when direct vector or object manipulation is more convenient.

## Custom components

Instead of putting all logic in one script, A-Frame supports components.

Example:

```javascript
AFRAME.registerComponent('vehicle-controller', {
  init() {
    this.speed = 0;
  },

  tick(time, delta) {
    // Vehicle update logic.
  }
});
```

Then attach it to the car:

```html
<a-entity
  id="car"
  gltf-model="#car-model"
  vehicle-controller>
</a-entity>
```

This is a good architecture for the simulator.

## Camera

A simple camera entity:

```html
<a-entity
  id="cameraRig"
  position="0 3 6">

  <a-camera></a-camera>
</a-entity>
```

Later, JavaScript can update the camera rig to follow the vehicle.

## Development server

Avoid relying only on opening `index.html` through `file://`.

Use a small local HTTP server. Examples include:

```bash
python -m http.server 8000
```

or a VS Code development server extension.

Then open:

```text
http://localhost:8000
```

This prevents many asset-loading problems.

## Useful links

- A-Frame: https://aframe.io/
- A-Frame documentation: https://aframe.io/docs/
