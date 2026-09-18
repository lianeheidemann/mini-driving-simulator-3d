# Three.js in the Project

[← Back to documentation index](../README.md)

## Purpose

Three.js is the lower-level JavaScript 3D library used underneath the scene.

A-Frame already manages a Three.js scene internally, so this project does **not** need two completely separate 3D scenes.

Instead, custom A-Frame code can access Three.js objects.

## The important relationship

```text
A-Frame entity
      |
      v
entity.object3D
      |
      v
THREE.Object3D
```

Example:

```javascript
const carEntity = document.querySelector('#car');
const carObject = carEntity.object3D;
```

Now you can use Three.js-style transformations.

## Position

```javascript
carObject.position.x += 0.1;
```

Or:

```javascript
carObject.position.set(0, 0, -5);
```

## Rotation

```javascript
carObject.rotation.y += 0.02;
```

For the simulator, rotation around the Y axis can represent steering direction.

## Forward movement

A useful concept is to create a local forward vector and rotate it using the car orientation.

```javascript
const forward = new THREE.Vector3(0, 0, -1);

forward.applyQuaternion(carObject.quaternion);

carObject.position.addScaledVector(
  forward,
  speed
);
```

This means the car moves in the direction it is currently facing.

## Delta time

Movement should not depend directly on frame rate.

A-Frame's `tick` function receives a delta value:

```javascript
tick(time, delta) {
  const dt = delta / 1000;

  this.el.object3D.position.z -=
    this.speed * dt;
}
```

Using time-based movement gives more consistent behavior across different computers.

## Basic vehicle state

A first vehicle controller may only need:

```javascript
this.speed = 0;
this.maxSpeed = 12;
this.acceleration = 8;
this.braking = 12;
this.steeringSpeed = 1.8;
```

Do not confuse this with realistic vehicle physics. It is intentionally simple.

## Steering concept

A simplified steering update can be:

```javascript
car.rotation.y += steeringInput
  * steeringSpeed
  * dt;
```

Movement can then use the car's updated quaternion.

## Follow camera

Three.js vectors are also useful for the camera.

Concept:

```text
Car position
+
offset behind and above car
=
desired camera position
```

The offset can be rotated by the car quaternion so the camera remains behind the vehicle.

## When Three.js is useful here

Use direct Three.js access for:

- vectors;
- quaternions;
- movement math;
- direction calculations;
- raycasting;
- camera interpolation;
- object hierarchy inspection;
- advanced scene behavior.

Use A-Frame for the surrounding entity/component architecture.

## Useful links

- Three.js: https://threejs.org/
- Documentation: https://threejs.org/docs/
