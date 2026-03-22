# Theo's Police Patrol

A Lego-themed police chase iPad game built by Kelli and her son Theo. Theo drives a police car, catches bad guys, and delivers them to jail. This is a mother-son project — Theo wanted to understand what mom builds and help create something together.

**GitHub:** https://github.com/create-vibrant-impact/Theo-police-chase.git
**Live:** Deployed on Vercel (auto-deploys from `main`)

## Tech Stack

- **Phaser 3.80.1** via CDN (`<script>` tag) — no bundler, no build step
- **Vanilla JS** — plain script files loaded in order via `index.html`
- **Web Audio API** — synthesized sound effects (siren, catch, jail clang, fanfare, tap), no audio files needed
- **Vercel** — static site deployment (`outputDirectory: "."`, no build command)

There is no TypeScript, no npm build, no bundler. The `package.json` exists only for metadata — there are no build or dev scripts to run. To develop locally, just serve the root directory with any static file server.

## Project Structure

```
index.html              — Entry point, loads Phaser CDN + all scripts
vercel.json             — Vercel config (static deploy, no build)
src/
  config.js             — Game constants (dimensions, speeds, colors, positions, round configs)
  main.js               — Phaser.Game initialization
  sounds.js             — SoundManager singleton (Web Audio API, all synthesized)
  scenes/
    TitleScene.js        — Title screen with PLAY button
    GameScene.js         — Main gameplay (driving, catching, jailing, power-ups, obstacles)
    CelebrationScene.js  — Per-round win screen with confetti + NEXT ROUND / CATCH MORE
    VehicleRevealScene.js — Between-round vehicle reveal with drive-in animation
    MegaCelebrationScene.js — Final celebration after all 5 rounds with vehicle parade
    PauseScene.js        — Overlay scene for pause/resume during gameplay
assets/
  images/               — (empty — all graphics are procedural via Phaser Graphics API)
  sounds/               — (empty — all sounds are synthesized via Web Audio API)
docs/
  plans/                — Session planning docs
  handoffs/             — Session handoff documents
```

## Architecture Decisions

- **No asset files** — All graphics are drawn procedurally with Phaser's Graphics API. All sounds are synthesized with Web Audio API. This means zero loading screens and no external dependencies beyond Phaser itself.
- **Lego brick style** — Everything uses rectangular shapes with 3D edge shading (light top-left, dark bottom-right) and round studs on top to look like Lego bricks. Theo specifically requested this aesthetic.
- **iPad-first** — Designed for 1024x768 landscape with `Phaser.Scale.FIT` + `CENTER_BOTH`. Touch-only input (tap to move, drag to steer). Meta tags disable zoom and enable standalone web app mode.
- **Texture caching** — Car and bad guy textures are generated once with `generateTexture()` and reuse the key on scene restart. The `if (!this.textures.exists('key'))` guard prevents "texture key already in use" errors.
- **iOS audio unlock** — `SoundManager.init()` is called on the first user gesture. It creates the AudioContext, resumes if suspended, and plays a silent buffer to fully unlock audio on iOS Safari.
- **Button click reliability** — Both TitleScene and CelebrationScene use dual hit detection: `setInteractive()` with `setPadding()` on the text element, plus a scene-level `pointerdown` fallback with proximity check. A `started` flag prevents double-fires. This was needed because young kids tap imprecisely.
- **Arcade mode with round progression** — 5 rounds with escalating difficulty (more bad guys, faster speeds, added obstacles). Each round has a unique vehicle. Config-driven via `CONFIG.ROUNDS[]` array so adding rounds only requires a new config entry plus a vehicle draw function.
- **5 unique vehicles** — Police car (round 1), SUV (round 2), Jeep (round 3), Motorcycle (round 4), Monster Truck (round 5). Each drawn procedurally with distinct silhouettes, colors, and Lego-style details. Vehicle drawing is dispatched via `drawVehicle(type)` in GameScene.
- **Power-ups and obstacles** — Nitrous boost power-up (blue lightning bolt, 1.8x speed for 3s) appears from round 2+. Oil slicks (spin the vehicle) from round 3+. Potholes (slow the vehicle) from round 4+. All configured per-round in `CONFIG.ROUNDS[]`.
- **Pause/resume system** — PauseScene is launched as a parallel scene over GameScene. GameScene pauses its own scene (physics, tweens, timers) and launches PauseScene as overlay. Resume stops PauseScene and resumes GameScene. Pause button is a "II" icon in the top-left HUD area.
- **Vehicle reveal between rounds** — VehicleRevealScene shows the next vehicle with a drive-in animation between rounds. Builds anticipation for each new vehicle unlock.
- **Smarter bad guys (zig-zag + flee)** — From round 3, bad guys change direction more frequently (zig-zag). From round 4, they also flee directly away from the player when the car gets close. Both behaviors are config-driven per round (`zigZag`, `zigZagInterval`, `fleeEnabled`, `fleeSpeed`, `fleeRange`). Flee logic runs in `update()` via `_updateBadGuyFlee()` and sets a `badGuy.fleeing` flag to prevent wander from overriding flee velocity.
- **Wiggle & slow when carrying** — Caught bad guys wiggle (rotation tween) and slow the car down. Intensity and speed penalty scale per round (`wiggleIntensity`, `carrySpeedPenalty`). Wiggle tween is stored as `this.wiggleTween` and cleaned up on jail delivery.

## Gotchas

- **iOS audio** requires `AudioContext.resume()` AND a silent buffer play on first user gesture. Just creating the context isn't enough — iOS Safari suspends it immediately.
- **Phaser texture keys** are global and persist across scene restarts. Always guard `generateTexture()` calls with `this.textures.exists()` check, or you get console errors and blank sprites.
- **Phaser Graphics hit areas** — `graphics.setInteractive()` doesn't work reliably for rounded/complex shapes. Use the text element (with padding) as the interactive target instead.
- **No build step** means script load order in `index.html` matters: config.js and sounds.js must load before scene files, which must load before main.js.
- **Obstacles must not spawn on the player's starting position** — Early implementation spawned oil slicks/potholes at random road positions including where the vehicle starts, causing immediate spin/slow on round begin. Fix: obstacle placement must exclude a radius around the vehicle's spawn point.
- **Oil slick spin must be a one-shot effect** — Initial implementation used a tween that could re-trigger or loop indefinitely if the player stayed on the oil slick, causing an infinite spin. Fix: use a `spinning` flag on the vehicle to prevent re-entry, and clear it with a timed callback after the spin completes.
- **Round state must fully reset after completing all 5 rounds** — After beating round 5 and returning to play again, the round counter was not resetting to 1. The "CATCH MORE" / "PLAY AGAIN" flow from MegaCelebrationScene must explicitly pass `{ round: 1 }` to GameScene to restart from the beginning.
- **Flee must not be overridden by wander** — When a bad guy is fleeing (car is nearby), `startWander()` must skip setting new velocity and just reschedule. The `badGuy.fleeing` flag gates this. Without it, wander timers fire during flee and reset the bad guy's escape velocity, making flee feel broken.
- **Fleeing bad guys escape off screen without boundary clamping** — Flee logic calculates velocity directly away from the player, which can send bad guys straight off the edge of the play area. Fix is two layers: (1) in `_updateBadGuyFlee()`, reverse velocity components when the bad guy is near an edge (50px margin) so they flee parallel to the boundary instead of through it; (2) `_updateBadGuyBounds()` runs every frame as a safety net, forcing velocity away from any edge within 30px. Both layers are needed — the flee clamp alone isn't sufficient because wander can also push bad guys to edges between flee triggers.

## Game Flow

1. **TitleScene** — "THEO'S POLICE PATROL" title with floating animation, police car illustration, PLAY button. Starts round 1.
2. **GameScene** — Green Lego baseplate with cross-shaped roads, jail in top-right. Vehicle and difficulty are set by the current round config (`CONFIG.ROUNDS[round-1]`). Tap/drag to drive. Overlap with bad guy = catch (flash + sound). Drive to jail = deliver (door animation + clang). HUD tracks progress (round indicator + bad guy count). Power-ups (nitrous boost) and obstacles (oil slicks, potholes) appear based on round config. Pause button in top-left. After all bad guys jailed, transitions to CelebrationScene.
3. **CelebrationScene** — "GOT 'EM!" with confetti, stars, badge, fanfare. If rounds remain: NEXT ROUND button transitions to VehicleRevealScene. If all 5 rounds complete: transitions to MegaCelebrationScene.
4. **VehicleRevealScene** — "ROUND N COMPLETE!" slam-in text, then reveals the next round's vehicle with a drive-in animation and vehicle name. "LET'S GO!" button starts the next round's GameScene.
5. **MegaCelebrationScene** — Final celebration after all 5 rounds. "ULTIMATE POLICE HERO!" with massive confetti, vehicle parade (all 5 vehicles drive across), and "PLAY AGAIN" button that restarts from round 1.
6. **PauseScene** — Overlay scene launched from GameScene. Shows "PAUSED" with a RESUME button. GameScene physics/tweens/timers are paused underneath.

### Vehicles by Round

| Round | Vehicle | Key Visual Traits |
|---|---|---|
| 1 | Police Car | Classic blue/white, racing stripes, red/blue sirens |
| 2 | Police SUV | Taller body, bull bar/push bumper, roof rack |
| 3 | Police Jeep | Open-top, roll cage, chunky off-road tires |
| 4 | Motorcycle | Low-profile, single rider silhouette, fastest vehicle |
| 5 | Monster Truck | Oversized tires, lifted suspension, largest vehicle |
