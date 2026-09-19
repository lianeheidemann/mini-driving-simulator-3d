# 06 — Use an Android phone as an Xbox-compatible controller with DroidJoy

[← Documentation index](README.md)

This phase connects the **Android phone as the controller** to the simulator **running in a browser on the Windows PC**. DroidJoy provides the virtual controller; the game's existing Gamepad API code reads it. The phone does not send Xbox signals directly to the web page.

```text
Phone touch controls → DroidJoy app → local Wi-Fi/Bluetooth → DroidJoy Server on Windows
                    → virtual Xbox 360 / XInput controller → PC browser Gamepad API
                    → src/controls/gamepad-input.js → vehicle-controller.js → car
```

## 1. Check what the game already supports

The current [gamepad input module](../../src/controls/gamepad-input.js) calls `navigator.getGamepads()` and prefers a connected controller whose browser `mapping` is `standard`. If DroidJoy is exposed as a non-standard controller, the game automatically falls back to its numbered layout. The [vehicle controller](../../src/components/vehicle-controller.js) applies its steering and throttle.

| Game action | Phone control in Xbox-style layout | Standard Gamepad API input |
| --- | --- | --- |
| Steer | Either virtual stick, horizontal | `axes[0]` or `axes[2]` |
| Accelerate | RT or RB | `buttons[7].value` or `buttons[5]` |
| Brake / reverse | LT or LB | `buttons[6].value` or `buttons[4]` |
| Handbrake | A | `buttons[0]` |
| Reset | B | `buttons[1]` |
| Toggle camera | Y or screen button `8` | `buttons[3]` or `buttons[9]` |

The game subtracts braking from acceleration. RT/LT preserve analog pressure; RB/LB produce full acceleration/braking like the keyboard. Keep the selected stick centered and all four controls released when testing idle input.

### Recommended phone layout

A full Xbox layout wastes touch space and makes it too easy to lose the controls under the thumbs. Keep the Xbox/XInput logic, but leave only the controls the simulator uses:

<img src="media/DroidJoy-Lite-v2.jpg" alt="Custom DroidJoy Lite controller layout" width="50%">

```text
┌──────────────────────────────────────────────────────────┐
│  LB — BRAKE / REVERSE             RB — ACCELERATE      │
│                                                          │
│       LARGE STICK                       B  reset          │
│       left = A / right = D              A  handbrake      │
│       screen button 8 = camera                             │
└──────────────────────────────────────────────────────────┘
```

- Make the single stick large and place it where the steering thumb rests naturally. The game accepts either DroidJoy stick type: moving it left replaces keyboard `A`, and moving it right replaces keyboard `D`.
- Keep LB and RB as large shoulder areas. They act like `S` and `W`, which is more reliable on a flat screen than trying to hold an analog trigger at an intermediate value.
- Keep A and B separated on the right. A applies the handbrake and B resets the vehicle.
- Configure the small button with two rectangles as number `8`. It switches the camera just like keyboard `Y`; a separate phone Y button remains supported but is optional.
- Remove the second stick, X, Start, L3/R3, and duplicate LT/RT controls from this dedicated layout. They do not perform an action in the simulator.
- If preferred, keep LT/RT instead of LB/RB; the game supports both. LB/RB are recommended for DroidJoy because they are explicitly treated as full-pressure digital pedals.

The stick curve in the game boosts the useful beginning of its travel while retaining a center dead zone. You keep one thumb on it to steer while another finger holds R/RB to accelerate. With a standard browser mapping, the D-pad is also accepted as keyboard-like full-left/full-right steering.

For DroidJoy's non-standard numbered profile, its one-based server values are converted to the browser's zero-based button indices:

| Game action | DroidJoy server number | Browser input |
| --- | --- | --- |
| Accelerate (RT) | `12` | `buttons[11]` |
| Brake / reverse (LT) | `11` | `buttons[10]` |
| Handbrake (A) | `1` | `buttons[0]` |
| Reset (B) | `2` | `buttons[1]` |
| Brake / reverse, digital (LB) | `5` | `buttons[4]` |
| Accelerate, digital (RB) | `6` | `buttons[5]` |
| Toggle camera (Y) | `4` | `buttons[3]` |
| Toggle camera (screen button) | `8` | `buttons[7]` |

## 2. Install DroidJoy on both devices

1. On the Android phone, install [DroidJoy Lite](https://play.google.com/store/apps/details?id=com.grill.droidjoy_demo) for the initial test. The [paid version](https://play.google.com/store/apps/details?id=com.grill.droidjoy) is also available; the Lite layout and button options can be limited.
2. On the Windows PC, download the **DroidJoy Server** from the [developer's download page](https://grill2010.github.io/droidJoy.html#download). Install the server and its required virtual controller driver using the installer instructions, then start the server.
3. In the server's virtual gamepad settings, configure **one XInput / Xbox 360 controller**, not a DInput or keyboard-only profile. Consult the [developer's server tutorial](https://github.com/grill2010/DroidJoy_Server/wiki/DroidJoy-Server-Tutorial) if your server version labels the option differently.
4. Keep the server running before opening the simulator. You do **not** need InputMapper in this route: DroidJoy Server creates the XInput output.

The developer documents Android-to-PC connection and Xbox 360 XInput emulation in the [DroidJoy Play Store description](https://play.google.com/store/apps/details?id=com.grill.droidjoy_demo). Follow the currently installed version's screens if labels differ.

## 3. Connect the phone to the PC

1. Connect phone and PC to the same local network. The PC may use Ethernet if it is on the same reachable LAN as the phone's Wi-Fi. Avoid a guest network that isolates devices.
2. Open DroidJoy Server on the PC.
3. Open DroidJoy on Android, go to **Connect**, select **Search server**, and choose your PC when it appears.
4. Create or select a landscape phone layout with a **stick, LB, RB, A, B, and screen button 8**. LT and RT may be used instead of LB and RB if you prefer the traditional trigger mapping; a separate Y button is optional.

The developer also lists Bluetooth as an option. Start with the same-network connection because it is easier to diagnose.

## 4. Verify the Windows virtual controller first

1. Press `Win + R` on the PC, enter `joy.cpl`, and press Enter.
2. Look for the virtual controller and open **Properties**.
3. Move the custom stick and press A, B, LB/RB, and screen button 8. Check that Windows registers the actions. If using LT/RT, the Windows test panel may show them as axes rather than named buttons; the browser test below checks the exact indices the game needs.
4. If no controller appears, return to the server: check that it is running, one XInput device is configured, the driver installed successfully, and the phone is connected. Restart the server or PC after installing a driver if prompted.

## 5. Verify the browser mapping

1. On the **PC**, open the [live simulator](https://lianeheidemann.github.io/mini-driving-simulator-3d/) in a current browser. Click the page and press a phone button. The game's status should say **“Controle conectado”**.
2. For precise diagnostics, open the browser developer console (`F12` → **Console**) on that page and run:

```js
const pad = [...navigator.getGamepads()].find(p => p?.connected);
console.log(pad && {
  id: pad.id,
  mapping: pad.mapping,
  leftStick: pad.axes[0],
  rightStick: pad.axes[2],
  A: pad.buttons[0]?.pressed,
  B: pad.buttons[1]?.pressed,
  Y: pad.buttons[3]?.pressed,
  screen8Standard: pad.buttons[9]?.pressed,
  screen8Numbered: pad.buttons[7]?.pressed,
  LB: pad.buttons[4]?.value,
  RB: pad.buttons[5]?.value,
  LT: pad.buttons[6]?.value,
  RT: pad.buttons[7]?.value
});
```

3. Run it again while holding each control. Moving the custom stick horizontally should change either `leftStick` or `rightStick`; both should remain near zero when centered. The screen button `8` should activate `screen8Standard` with a standard mapping or `screen8Numbered` with a raw numbered mapping. Read only the fields for the mapping reported by the browser: in the standard profile, button 8 and RT use different indices (`9` and `7`); in the raw numbered profile, button 8 uses index `7` while RT uses index `11`. With `mapping: "standard"`, expect LB/RB in `buttons[4]` and `buttons[5]`, or LT/RT in `buttons[6]` and `buttons[7]`. With an empty/non-standard mapping, expect LB/RB in `buttons[4]` and `buttons[5]`, or LT/RT in `buttons[10]` and `buttons[11]`. This console snippet is read-only.
4. If `pad` is absent, press a button, click the game page, and reload it after DroidJoy is connected. If the reported indices differ from both supported profiles, record the actual values before changing the input mapping in `src/controls/gamepad-input.js`.

## 6. Drive and accept the integration

Test in this order: RB (or RT) moves forward; the stick turns while moving; LB (or LT) brakes and reverses; A applies the handbrake; B resets; screen button 8 switches the camera. Compare the control status and the car's behavior. Leave the PC game tab visible and focused; the vehicle component pauses when its document is hidden or the window loses focus.

The phase is complete when:

- [ ] DroidJoy Server exposes one virtual XInput controller in Windows.
- [ ] The phone operates its controls in `joy.cpl`.
- [ ] The PC browser reports either `mapping: "standard"` or the expected DroidJoy numbered button indices.
- [ ] Stick left/right steers while R/RB remains held to accelerate.
- [ ] L/LB brakes and reverses; A applies the handbrake; B resets the vehicle.
- [ ] Screen button 8 toggles the camera once per tap.
- [ ] The game's status says “Controle conectado”.

## Troubleshooting by layer

| Symptom | Check |
| --- | --- |
| Phone cannot find the server | Same reachable local network, server running, Windows firewall permission for DroidJoy on the private network; follow the [DroidJoy FAQ](https://github.com/grill2010/DroidJoy_Server/wiki/FAQ). |
| Phone connects, but `joy.cpl` has no gamepad | Server's XInput virtual device and driver installation; restart the server after changing the output profile. |
| Windows sees the pad, browser does not | Start DroidJoy before opening/reloading the game; focus the page and press a button. Try a current desktop browser. |
| Game says “DroidJoy numerado”, but controls are wrong | Check that the server uses A=`1`, B=`2`, Y=`4`, LB=`5`, RB=`6`, screen=`8`, LT=`11`, and RT=`12`; inspect the browser indices if necessary. |
| Game says connected, but controls are wrong | Inspect `axes[0]`, `axes[2]`, and `buttons[0,1,3,4,5,6,7,9,10,11]` in the console while pressing each control; adjust DroidJoy's layout or the code only after measuring. |
| Screen button 8 does not toggle the camera | Confirm the DroidJoy element is configured as `8`. In a standard mapping it should activate `buttons[9]`; in a raw numbered mapping it should activate `buttons[7]`. Tap rather than hold it. |
| Vehicle stops when switching windows | Keep the game tab focused; `vehicle-controller.js` pauses on hidden or unfocused documents. |

**Scope:** This setup controls the browser game running on the PC. Opening the game on the phone and touching a separate DroidJoy app on that same phone is a different setup. No Xbox console or physical Xbox controller is required.
