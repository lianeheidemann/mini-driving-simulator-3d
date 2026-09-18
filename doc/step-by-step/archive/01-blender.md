# Blender and GLB Export

[← Back to documentation index](../README.md)

## Purpose

Blender is responsible for creating and preparing the visual 3D assets used by the simulator.

For this project, Blender can be used to create:

- the car;
- wheels;
- road or track;
- cones and barriers;
- buildings;
- simple environment objects.

The browser should not depend on a `.blend` file directly. The final web asset should normally be exported as **glTF 2.0**, preferably a single `.glb` file for the first version.

## Why GLB?

GLB is the binary form of glTF. It can package meshes, materials, textures, and hierarchy into one file, which makes it convenient for web projects.

Example:

```text
car.blend
   |
   | Export
   v
car.glb
   |
   v
A-Frame / Three.js
```

## Keep the first model simple

For the first milestone, the car does not need realistic mechanical parts.

A useful hierarchy is:

```text
Car
├── Body
├── Wheel_FL
├── Wheel_FR
├── Wheel_RL
└── Wheel_RR
```

Keeping the wheels separate makes it possible to rotate them later.

## Important preparation

Before exporting:

1. Put the vehicle close to the origin.
2. Check the vehicle scale.
3. Apply transforms when appropriate.
4. Give objects clear names.
5. Remove unused meshes and materials.
6. Keep polygon count reasonable.
7. Verify that materials look acceptable in Blender's material preview.

A useful operation before export is:

```text
Object > Apply > Rotation & Scale
```

Be careful when applying transforms to rigs or more complex animated objects. For the simple first car, this is normally straightforward.

## Coordinate systems

Blender and web engines can represent axes differently internally.

If the imported car points in the wrong direction, do not immediately rewrite the driving code. First check the model orientation.

Choose one convention for your project, for example:

- Y = up in the runtime scene;
- car local forward direction = negative Z.

The important part is consistency.

## Exporting

In Blender:

```text
File
> Export
> glTF 2.0 (.glb/.gltf)
```

For the first version, choose **GLB**.

Suggested output:

```text
assets/models/car.glb
```

## Test the exported model early

Before adding controls, confirm that:

- the model loads;
- materials appear;
- scale is reasonable;
- orientation is correct;
- wheels are in the expected positions.

If the car looks wrong while standing still, controller code will not solve the problem.

## Optimization tips

For a small academic prototype:

- prefer simple geometry;
- avoid extremely large textures;
- remove invisible geometry;
- reuse materials where possible;
- export only the objects required by the scene.

## Useful links

- Blender: https://www.blender.org/
- glTF specification: https://www.khronos.org/gltf/
