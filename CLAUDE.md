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
  config.js             — Game constants (dimensions, speeds, colors, positions)
  main.js               — Phaser.Game initialization
  sounds.js             — SoundManager singleton (Web Audio API, all synthesized)
  scenes/
    TitleScene.js        — Title screen with PLAY button
    GameScene.js         — Main gameplay (driving, catching, jailing)
    CelebrationScene.js  — Win screen with confetti + CATCH MORE button
assets/
  images/               — (empty — all graphics are procedural via Phaser Graphics API)
  sounds/               — (empty — all sounds are synthesized via Web Audio API)
```

## Architecture Decisions

- **No asset files** — All graphics are drawn procedurally with Phaser's Graphics API. All sounds are synthesized with Web Audio API. This means zero loading screens and no external dependencies beyond Phaser itself.
- **Lego brick style** — Everything uses rectangular shapes with 3D edge shading (light top-left, dark bottom-right) and round studs on top to look like Lego bricks. Theo specifically requested this aesthetic.
- **iPad-first** — Designed for 1024x768 landscape with `Phaser.Scale.FIT` + `CENTER_BOTH`. Touch-only input (tap to move, drag to steer). Meta tags disable zoom and enable standalone web app mode.
- **Texture caching** — Car and bad guy textures are generated once with `generateTexture()` and reuse the key on scene restart. The `if (!this.textures.exists('key'))` guard prevents "texture key already in use" errors.
- **iOS audio unlock** — `SoundManager.init()` is called on the first user gesture. It creates the AudioContext, resumes if suspended, and plays a silent buffer to fully unlock audio on iOS Safari.
- **Button click reliability** — Both TitleScene and CelebrationScene use dual hit detection: `setInteractive()` with `setPadding()` on the text element, plus a scene-level `pointerdown` fallback with proximity check. A `started` flag prevents double-fires. This was needed because young kids tap imprecisely.

## Gotchas

- **iOS audio** requires `AudioContext.resume()` AND a silent buffer play on first user gesture. Just creating the context isn't enough — iOS Safari suspends it immediately.
- **Phaser texture keys** are global and persist across scene restarts. Always guard `generateTexture()` calls with `this.textures.exists()` check, or you get console errors and blank sprites.
- **Phaser Graphics hit areas** — `graphics.setInteractive()` doesn't work reliably for rounded/complex shapes. Use the text element (with padding) as the interactive target instead.
- **No build step** means script load order in `index.html` matters: config.js and sounds.js must load before scene files, which must load before main.js.

## Game Flow

1. **TitleScene** — "THEO'S POLICE PATROL" title with floating animation, police car illustration, PLAY button
2. **GameScene** — Green Lego baseplate with cross-shaped roads, jail in top-right, 3 wandering bad guys. Tap/drag to drive. Overlap with bad guy = catch (flash + sound). Drive to jail = deliver (door animation + clang). HUD tracks progress. After 3 jailed, auto-transition to celebration.
3. **CelebrationScene** — "GOT 'EM!" with confetti, stars, badge, fanfare. CATCH MORE button restarts GameScene.
