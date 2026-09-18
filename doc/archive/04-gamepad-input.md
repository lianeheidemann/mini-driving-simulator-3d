# Gamepad and Xbox-Compatible Input

## Purpose

The browser can read compatible controllers through the **Gamepad API**.

The controller may be:

- a physical Xbox controller;
- another gamepad recognized by the operating system/browser;
- a compatible virtual controller produced by a remapping/emulation tool.

The browser-side code should depend on the Gamepad API rather than directly on a specific desktop emulator.

## Connection flow

```text
Physical controller
        |
        v
Operating system
        |
        +--> optional remapping/emulation layer
        |
        v
Browser
        |
        v
Gamepad API
        |
        v
Vehicle controller
```

## Detecting a connected gamepad

```javascript
window.addEventListener('gamepadconnected', (event) => {
  console.log('Gamepad connected:', event.gamepad.id);
});
```

And disconnection:

```javascript
window.addEventListener('gamepaddisconnected', (event) => {
  console.log('Gamepad disconnected:', event.gamepad.id);
});
```

## Reading the current state

Gamepad state should normally be read during the update loop:

```javascript
const gamepads = navigator.getGamepads();
const gamepad = gamepads[0];

if (!gamepad) {
  return;
}
```

## Analog stick

A common layout exposes the left horizontal stick through:

```javascript
const steering = gamepad.axes[0];
```

Typical values are approximately:

```text
-1.0 = full left
 0.0 = center
+1.0 = full right
```

Exact mappings can vary by device/browser, so inspect the controller instead of assuming all hardware is identical.

## Buttons and triggers

A button can expose:

```javascript
gamepad.buttons[index].pressed
```

and often an analog value:

```javascript
gamepad.buttons[index].value
```

For an Xbox-style standard mapping, triggers are often treated as analog controls, which is useful for acceleration and braking.

## Suggested logical mapping

Do not scatter numeric indexes everywhere in the project.

Create a logical mapping:

```javascript
const controls = {
  steering: 0,
  accelerateButton: 7,
  brakeButton: 6,
  handbrakeButton: 0,
  resetButton: 1,
  cameraButton: 3
};
```

Then isolate hardware-specific details inside one input module.

## Dead zone

Analog sticks rarely stay at exactly zero.

Use a dead zone:

```javascript
function applyDeadZone(value, deadZone = 0.12) {
  return Math.abs(value) < deadZone ? 0 : value;
}
```

Without this, the car may slowly steer while the stick appears centered.

## Debug page

Before controlling the car, create a debugging view that prints:

- controller ID;
- each axis value;
- button pressed state;
- button analog value.

This makes controller mapping much easier.

## About controller emulation

A desktop mapping/emulation application can be useful when the physical device is not exposed to the browser in the desired Xbox-compatible layout.

The web application should still read the resulting virtual controller through the standard browser Gamepad API.

Project-planning reference:

https://apps.microsoft.com/detail/9mzxvnfhgdw7?hl=en-US&gl=PT

Because controller mappings and emulation tools can differ by system, always test the actual values reported by the browser.

## Security and browser behavior

Some browsers require user interaction before gamepad information becomes available. Connect the controller and press a button after opening the page if the gamepad is not immediately detected.

## Useful links

- MDN Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
- Gamepad interface: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad
