# Mini Driving Simulator 3D

[![Blender](https://img.shields.io/badge/Blender-E87D0D?style=for-the-badge&logo=blender&logoColor=white)](https://www.blender.org/)
[![A-Frame](https://img.shields.io/badge/A--Frame-EF2D5E?style=for-the-badge)](https://aframe.io/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gamepad API](https://img.shields.io/badge/Gamepad%20API-4A5568?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)

[![HTML Validate](https://github.com/lianeheidemann/mini-driving-simulator-3d/actions/workflows/html-validate.yml/badge.svg)](https://github.com/lianeheidemann/mini-driving-simulator-3d/actions/workflows/html-validate.yml)
[![Deploy to GitHub Pages](https://github.com/lianeheidemann/mini-driving-simulator-3d/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/lianeheidemann/mini-driving-simulator-3d/actions/workflows/deploy-pages.yml)

A browser-based 3D driving simulator built with **[Blender](https://www.blender.org/)**, **[A-Frame](https://aframe.io/)**, and **[Three.js](https://threejs.org/)**, drivable with the keyboard or an Xbox-compatible gamepad.

![Gameplay demo](media/interface/interface-v2.webp)

**👾 Try it live: https://lianeheidemann.github.io/mini-driving-simulator-3d/**

## Overview

The car's initial 3D model was generated with [Tripo3D](https://www.tripo3d.ai/) and prepared in Blender for use in the simulator. It is drivable around a small parking-lot scene with arcade-style handling — acceleration, braking/reverse, steering, a handbrake, wall collisions with recoil, a live speedometer, and two camera modes — rendered in real time with A-Frame/Three.js on top of WebGL.

## Features

- Keyboard and Gamepad API input normalized to the same driving commands.
- Arcade vehicle physics: acceleration, braking, reverse, drag, and speed-sensitive steering.
- Collision handling against the parking-lot boundary walls, with impact recoil and camera shake.
- Two camera modes: chase camera and top-down overhead view, with smooth transitions.
- HUD with connected-controller status, live speedometer (km/h), and camera mode indicator.
- Procedurally laid out scenery: stone boundary walls, gated entrance, parking markings, and surrounding landscape.
- Vehicle reset to the starting position/orientation at any time.

## Tech stack

| Technology | Role in the project |
| --- | --- |
| [Tripo3D](https://www.tripo3d.ai/) | Generated the initial 3D car model. |
| [Blender](https://www.blender.org/) | Prepares the 3D model and other assets for use in the simulator. |
| [glTF / GLB](https://www.khronos.org/gltf/) | Format used to export 3D models from Blender to the browser. |
| [A-Frame](https://aframe.io/) | HTML-like structure for the 3D scene, entities, and custom components. |
| [Three.js](https://threejs.org/) | Lower-level access to vectors, quaternions, and custom per-frame logic (used through A-Frame). |
| [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) | Reads an Xbox-compatible controller's sticks, triggers, and buttons. |

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Steer | A/D or ←/→ | Either stick or D-pad |
| Accelerate | W or ↑ | RT (analog) or RB (digital) |
| Brake / reverse | S or ↓ | LT (analog) or LB (digital) |
| Handbrake | Space | A |
| Reset vehicle | R | B |
| Toggle camera | Y | Y or DroidJoy screen button (`8`) |

The gamepad is read through the standard [`navigator.getGamepads()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getGamepads) mapping; connect a controller and press any button to activate it.

For touch controllers, **RB also accelerates, LB also brakes/reverses, and the D-pad can steer**. These digital alternatives reproduce the immediate response of the keyboard while RT/LT and either virtual stick remain available for analog control. Moving the stick left replaces holding `A`; moving it right replaces holding `D`, including while accelerating.

### DroidJoy Xbox emulation

Downloads: [DroidJoy app for Android](https://droidjoy-gamepad-joystick-lite.br.uptodown.com/android) and [DroidJoy Server for Windows](https://grill2010.github.io/droidJoy.html).

An Android phone can act as an Xbox-compatible controller through
DroidJoy, which exposes a virtual XInput device that the Gamepad API reads
like any other controller (with a numbered-layout fallback when the
browser doesn't report a `standard` mapping):

```text
Phone -> DroidJoy Server -> virtual XInput controller -> browser Gamepad API -> game
```

<img src="media/joystick/DroidJoy-Lite-v4.png" alt="Custom DroidJoy Lite controller layout" width="40%">

Full setup, button-mapping tables, and a recommended touch layout are in the
[DroidJoy phone-controller guide](doc/step-by-step/archive/06-droidjoy-phone-controller.md).

## Input pipeline

Keyboard, Xbox-compatible gamepads, and DroidJoy continue to work with the controls listed above. The browser reads each device separately; this does **not** turn keyboard events into Xbox/XInput signals.

```text
Keyboard events -> keyboard-input.js --+
                                       +-> vehicle-controller.js -> vehicle movement
Gamepad API ----> gamepad-input.js ----+
```

Both input readers return the same logical commands: `{ throttle, steering, handbrake, reset, camera }`. `throttle` and `steering` are numeric values; the other commands are booleans. The vehicle controller combines those commands, then applies acceleration, steering, braking, collisions, and reset. If keyboard and gamepad are used together, a nonzero keyboard value takes priority on each driving axis; either device can activate the handbrake, reset, or camera. The combination and physics are still in `vehicle-controller.js`, rather than in separate pipeline modules.

## Getting started

The project is a static site with no build step, but the browser's `file://` origin blocks glTF/texture loading, so serve it over HTTP:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Project structure

```text
mini-driving-simulator-3d/
├── doc/
│   └── step-by-step/              # Learning-oriented guides for the stack
│       ├── README.md              # Guide index and learning path
│       └── archive/               # The guides themselves, numbered 01-07
├── input/                         # Source 3D assets (.glb / .blend)
├── media/                         # Screenshots and controller-layout images used in the docs
├── src/
│   ├── components/                # A-Frame components, one per file
│   │   ├── vehicle-controller.js  # Driving physics, input combination, collisions/recoil, reset
│   │   ├── boundary-walls.js      # Parking-lot walls and gated entrance, laid out from the ground size
│   │   ├── follow-camera.js       # Chase and overhead camera modes
│   │   ├── exterior-landscape.js  # Procedural grass/road texture around the parking lot
│   │   ├── stone-wall.js          # Procedural stone-block texture applied to the boundary walls
│   │   ├── parking-surface.js     # Procedural parking-lot ground texture (bays, lanes, crosswalk)
│   │   └── cloudy-sky.js          # Procedural gradient sky with cloud clusters
│   └── controls/
│       ├── gamepad-input.js       # Gamepad API -> logical driving input
│       └── keyboard-input.js      # Keyboard events -> the same logical driving input
├── index.html                     # Scene entry point, lighting/shadow setup
├── LICENSE
└── README.md
```

See [doc/step-by-step/](doc/step-by-step/) for the full, milestone-by-milestone build guide.

## License

Distributed under the [MIT License](LICENSE).
