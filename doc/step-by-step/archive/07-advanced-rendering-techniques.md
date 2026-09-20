# 07 — Advanced Rendering & Simulation Techniques

[← Back to documentation index](../README.md)

## Purpose

Guides 01–06 cover the working simulator: model import, scene setup, the
vehicle/camera components, and both input devices. This guide is not a
build step — it is a set of extensions to the systems that already exist
(the quaternion-driven camera, the lighting/shadow rig, the procedural
textures, the arcade vehicle model), each chosen to go deeper into a
technique the project already touches, rather than to add a missing
generic feature. Ordered so each item can be done independently without
reworking the others.

## 1. Custom shader for the car paint

**Current state:** the car mesh (`#car-model` in
[`index.html`](../../../index.html)) keeps whatever `MeshStandardMaterial`
glTF exports with — `roughness`/`metalness` only, no view-dependent term.

**Proposal:** inject a fresnel-based rim term through
`material.onBeforeCompile` (or swap in a small `ShaderMaterial` for the
body mesh once `model-loaded` fires), so the paint brightens toward
grazing angles independent of the light rig. Hook point:
[`vehicle-controller.js`](../../../src/components/vehicle-controller.js)
already listens for the mesh becoming available (`this.el.getObject3D('mesh')`
in `tick()`) — the material swap belongs next to that, not in a new
component.

**Why this one:** it moves the project from *configuring* a PBR material
to *authoring* shader code — Fresnel/Schlick terms, `varying` view vectors,
GLSL control flow.

## 2. GPU-based procedural texture synthesis

**Current state:**
[`exterior-landscape.js`](../../../src/components/exterior-landscape.js)'s
`buildTexture()` rasterizes grass/road markings on a `<canvas>` with a
hand-rolled LCG PRNG, once, on the CPU, then uploads the result as a
`THREE.CanvasTexture` — the same pattern repeats, with a different seed
each, in [`stone-wall.js`](../../../src/components/stone-wall.js),
[`parking-surface.js`](../../../src/components/parking-surface.js), and
[`cloudy-sky.js`](../../../src/components/cloudy-sky.js).

**Proposal:** replace the CPU rasterization with a fragment shader that
reproduces the same deterministic pattern using a hash-based value-noise
function, rendered once into a `WebGLRenderTarget` and read back as the
ground texture. Same visual seed/determinism, different execution model.

**Why this one:** demonstrates GPU noise synthesis (hash functions,
value/gradient noise) instead of an imperative 2D-canvas loop — and opens
the door to changing seed/density at runtime without a CPU re-rasterize.

## 3. Slip-based tire model

**Current state:** in `tick()` of
[`vehicle-controller.js`](../../../src/components/vehicle-controller.js),
throttle maps to acceleration through one constant
(`this.speed * throttle < 0 ? 12 : 5`), and steering authority scales only
with `|speed|` — there is no notion of grip being exceeded.

**Proposal:** separate longitudinal and lateral force limits and pass
slip through a saturating curve (a simplified, clipped approximation of
Pacejka's "magic formula" is enough — full tire modeling is explicitly out
of scope per [guide 05](05-integration-guide.md#what-not-to-build-first)).
Above a slip threshold, lateral grip drops off instead of steering just
scaling linearly with speed, so oversteer becomes possible under hard
throttle + steering combinations.

**Why this one:** shows understanding of contact-patch/slip dynamics
distinct from "cap the top speed and turn slower when fast", while keeping
the arcade feel intentionally, not accidentally.

## 4. Dynamic shadow-camera frustum

**Current state:** the directional light in
[`index.html`](../../../index.html) has a hand-fitted orthographic frustum
(`shadowCameraLeft/Right/Top/Bottom: -25/25/25/-25`), sized once for the
current scene extent.

**Proposal:** compute the world-space bounding sphere of the shadow
casters each frame (or on layout change, the same trigger
[`boundary-walls.js`](../../../src/components/boundary-walls.js) already
uses via its own `layoutKey`) and fit the orthographic frustum to it. This
is the same core idea behind a single cascade of cascaded shadow maps,
just not split into cascades.

**Why this one:** demonstrates awareness of shadow-map texel density and
the precision/coverage trade-off, instead of picking bounds that "look
right" for one fixed layout.

## 5. Image-based ambient lighting

**Current state:** [`index.html`](../../../index.html) approximates sky/bounce
light with one `hemisphere` light — a flat two-color gradient, not derived
from the actual sky.

**Proposal:** pre-filter the `<a-sky>` (or a small procedural sky texture)
into an environment map with Three.js's `PMREMGenerator`, and assign it as
`scene.environment` so `MeshStandardMaterial` surfaces receive physically
-consistent image-based irradiance and specular response instead of one
constant color.

**Why this one:** demonstrates working knowledge of irradiance
maps/PMREM prefiltering, not "add another light".

## Suggested order

`4 → 5 → 1 → 3 → 2`. Items 4 and 5 only touch `index.html` plus a small
setup script; 1 is scoped to the car entity's material; 3 is scoped to
`vehicle-controller.js`'s `tick()`; 2 is the most invasive change, since it
replaces a working CPU system with a GPU one. Doing the cheaper, more
contained changes first keeps the working build drivable between steps.

## Still out of scope

Per [guide 05](05-integration-guide.md#what-not-to-build-first): full
suspension simulation, drivetrain/gearbox modeling, and networking/AI
traffic remain out of scope. The five items above refine rendering and
vehicle feel within the existing arcade model — they are not a physics- or
render-engine rewrite.
