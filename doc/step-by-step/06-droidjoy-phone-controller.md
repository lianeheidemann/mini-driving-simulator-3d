# 06 — Use an Android phone as an Xbox-compatible controller with DroidJoy

[← Documentation index](README.md)

This phase connects the **Android phone as the controller** to the simulator **running in a browser on the Windows PC**. DroidJoy provides the virtual controller; the game's existing Gamepad API code reads it. The phone does not send Xbox signals directly to the web page.

```text
Phone touch controls → DroidJoy app → local Wi-Fi/Bluetooth → DroidJoy Server on Windows
                    → virtual Xbox 360 / XInput controller → PC browser Gamepad API
                    → src/controls/gamepad-input.js → vehicle-controller.js → car
```

## 1. Check what the game already supports

The current [gamepad input module](../../src/controls/gamepad-input.js) calls `navigator.getGamepads()` and selects the first connected controller whose browser `mapping` is `standard`. The [vehicle controller](../../src/components/vehicle-controller.js) applies its steering and throttle. This means the game needs **no code change** if DroidJoy's virtual controller appears in the browser with the expected standard mapping. XInput in Windows alone is not proof that the browser mapping and trigger values are correct; verify both below.

| Game action | Phone control in Xbox-style layout | Standard Gamepad API input |
| --- | --- | --- |
| Steer | Left stick, horizontal | `axes[0]` |
| Accelerate | RT | `buttons[7].value` |
| Brake / reverse | LT | `buttons[6].value` |
| Handbrake | A | `buttons[0]` |
| Reset | B | `buttons[1]` |
| Toggle camera | Y | `buttons[3]` |

The game subtracts LT from RT for throttle. Keep the left stick centered and both triggers released when testing idle input.

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
4. Select a phone layout with a **left stick, LT, RT, A, B, and Y**. Hold the phone in landscape orientation if that makes the controls easier to reach.

The developer also lists Bluetooth as an option. Start with the same-network connection because it is easier to diagnose.

## 4. Verify the Windows virtual controller first

1. Press `Win + R` on the PC, enter `joy.cpl`, and press Enter.
2. Look for the virtual controller and open **Properties**.
3. Move the left stick, press A/B/Y, and squeeze both triggers. Check that Windows registers the actions. The Windows test panel may show triggers as axes rather than named buttons; the browser test below checks the exact indices the game needs.
4. If no controller appears, return to the server: check that it is running, one XInput device is configured, the driver installed successfully, and the phone is connected. Restart the server or PC after installing a driver if prompted.

## 5. Verify the browser mapping

1. On the **PC**, open the [live simulator](https://lianeheidemann.github.io/mini-driving-simulator-3d/) in a current browser. Click the page and press a phone button. The game's status should say **“Controle conectado”**.
2. For precise diagnostics, open the browser developer console (`F12` → **Console**) on that page and run:

```js
const pad = [...navigator.getGamepads()].find(p => p?.connected);
console.log(pad && {
  id: pad.id,
  mapping: pad.mapping,
  steering: pad.axes[0],
  A: pad.buttons[0]?.pressed,
  B: pad.buttons[1]?.pressed,
  Y: pad.buttons[3]?.pressed,
  LT: pad.buttons[6]?.value,
  RT: pad.buttons[7]?.value
});
```

3. Run it again while holding each control. Expect `mapping: "standard"`, a centered `steering` near zero, and LT/RT values rising toward 1 when pressed. This console snippet is read-only.
4. If `pad` is absent, press a button, click the game page, and reload it after DroidJoy is connected. If `mapping` is not `standard`, the current game code will reject this controller. If indices differ, record the actual values before changing the input mapping in `src/controls/gamepad-input.js`. Do not guess indices.

## 6. Drive and accept the integration

Test in this order: RT moves forward; left stick turns while moving; LT brakes and reverses; A applies the handbrake; B resets; Y switches the camera. Compare the control status and the car's behavior. Leave the PC game tab visible and focused; the vehicle component pauses when its document is hidden or the window loses focus.

The phase is complete when:

- [ ] DroidJoy Server exposes one virtual XInput controller in Windows.
- [ ] The phone operates its controls in `joy.cpl`.
- [ ] The PC browser reports `mapping: "standard"` and the expected stick, trigger and button indices.
- [ ] The game's status says “Controle conectado” and all six actions above work.

## Troubleshooting by layer

| Symptom | Check |
| --- | --- |
| Phone cannot find the server | Same reachable local network, server running, Windows firewall permission for DroidJoy on the private network; follow the [DroidJoy FAQ](https://github.com/grill2010/DroidJoy_Server/wiki/FAQ). |
| Phone connects, but `joy.cpl` has no gamepad | Server's XInput virtual device and driver installation; restart the server after changing the output profile. |
| Windows sees the pad, browser does not | Start DroidJoy before opening/reloading the game; focus the page and press a button. Try a current desktop browser. |
| Game says “Controle sem mapeamento padrão” | Check `pad.mapping`; the current code deliberately accepts only `standard`. Verify XInput output in DroidJoy Server. |
| Game says connected, but controls are wrong | Inspect `axes[0]` and `buttons[0,1,3,6,7]` in the console while pressing each control; adjust DroidJoy's layout or the code only after measuring. |
| Vehicle stops when switching windows | Keep the game tab focused; `vehicle-controller.js` pauses on hidden or unfocused documents. |

**Scope:** This setup controls the browser game running on the PC. Opening the game on the phone and touching a separate DroidJoy app on that same phone is a different setup. No Xbox console or physical Xbox controller is required.
