# Project Handoff — 2026-03-21

**Session focus:** Added smarter bad guy AI (zig-zag, flee, wiggle, carry speed penalty) with per-round scaling, then fixed fleeing-off-screen bug.
**Commits pushed:**
- `fe33b49` — feat: add smarter bad guy AI with zig-zag movement, flee behavior, wiggle-on-carry, and carry speed penalty scaling across rounds
- `4787178` — fix: prevent fleeing bad guys from escaping off screen with boundary clamping and world bounds

---

## Completed Today

1. **Added zig-zag movement for bad guys (rounds 3+).** Instead of the original slow wander (random direction every 2 seconds, sometimes stationary), bad guys in rounds 3-5 pick a random angle and always move at full speed, changing direction on a configurable interval (`zigZagInterval`). Round 3 changes every 800ms, round 4 every 600ms, round 5 every 400ms. This makes them significantly harder to catch as rounds progress.

2. **Added flee behavior for bad guys (rounds 4+).** When the player's vehicle gets within `fleeRange` pixels, bad guys now run directly away from the car at `badGuySpeed * fleeSpeed`. Round 4 has a 150px flee range at 1.5x speed; round 5 has 200px range at 1.8x speed. Flee logic runs every frame in `_updateBadGuyFlee()` and sets a `badGuy.fleeing` flag so the wander timer doesn't override flee velocity mid-escape.

3. **Added wiggle-on-carry with per-round intensity scaling.** When a bad guy is caught and being carried to jail, they now do a rotation wiggle tween. The intensity (`wiggleIntensity` in degrees) and speed scale per round: 0 degrees in round 1 (no wiggle), 8 in round 2, 15 in round 3, 25 in round 4, 35 in round 5. Higher intensity also means faster wiggle frequency. The tween is stored as `this.wiggleTween` and cleaned up on jail delivery.

4. **Added carry speed penalty per round.** Carrying a bad guy now slows the vehicle by a configurable multiplier (`carrySpeedPenalty`). Round 1 is 1.0 (no penalty), scaling down to 0.75 for round 5. This stacks with the pothole slow and boost multipliers in the speed calculation in `update()`.

5. **Fixed fleeing bad guys escaping off screen.** Before the fix, when a bad guy fled from the car near the edge of the screen, the flee velocity pushed them beyond the visible play area and they became uncatchable. The fix has two layers: (a) `_updateBadGuyFlee()` now clamps flee velocity components near boundaries — if a bad guy is within 50px of an edge and its flee velocity would push it further out, that component is reversed; (b) `_updateBadGuyBounds()` runs every frame and pushes any bad guy within 30px of an edge back inward, plus bad guys have `setCollideWorldBounds(true)` as a hard backstop.

6. **Added all new config properties to CONFIG.ROUNDS.** Each of the 5 round entries in `config.js` now includes: `zigZag` (bool), `zigZagInterval` (ms), `fleeEnabled` (bool), `fleeSpeed` (multiplier), `fleeRange` (px), `wiggleIntensity` (degrees), `carrySpeedPenalty` (multiplier). These are all read from `this.roundConfig` in GameScene, so no round-specific logic exists in the scene code itself.

7. **Updated CLAUDE.md with new architecture decisions and gotchas.** Added entries for "Smarter bad guys (zig-zag + flee)" and "Wiggle & slow when carrying" in Architecture Decisions. Added "Flee must not be overridden by wander" in Gotchas.

## Key Decisions Made

- **All bad guy AI is config-driven** — No behavior is hardcoded per round. The same `startWander()` and `_updateBadGuyFlee()` code paths handle all rounds; they just read different config values. This means adding a round 6 with even more aggressive AI is just a config entry.
- **Flee logic runs in `update()`, not in timed callbacks** — Flee needs to respond instantly when the car enters range and re-evaluate every frame as both the car and bad guy move. It could not be a scheduled event like wander.
- **Wander defers to flee via a flag** — Rather than canceling/restarting wander timers when flee kicks in, the wander callback simply checks `badGuy.fleeing` and reschedules itself without changing velocity. This avoids complex timer management.
- **Three-layer boundary enforcement for fleeing bad guys** — The off-screen bug required a belt-and-suspenders approach: (1) velocity clamping inside `_updateBadGuyFlee()` to prevent fleeing toward edges, (2) `_updateBadGuyBounds()` as a per-frame backstop that bounces any bad guy near an edge, (3) `setCollideWorldBounds(true)` as a hard Phaser-level guarantee. Any single layer could have edge cases, but all three together make escape impossible.
- **Wiggle intensity maps to both amplitude and frequency** — Higher `wiggleIntensity` means wider rotation AND faster oscillation (duration formula: `150 + (35 - deg) * 4`). This makes the wiggle feel increasingly frantic in later rounds.

## Known Issues

- **Vehicle draw code is still duplicated 3 times** — GameScene, VehicleRevealScene, and MegaCelebrationScene each have their own copies of all 5 vehicle draw methods. Extracting a shared VehicleFactory.js is still pending.
- **No persistent state** — Game resets fully on page refresh. No saved round progress, no high scores.
- **Audio may not work on older iOS** — Three-layer unlock covers iOS 15+/Safari 16+ but untested on earlier versions.

## Still Waiting On

| Item | Owner | Status | Needed For |
|---|---|---|---|
| Theo playtest of arcade mode with AI | Theo | Pending | Feedback on difficulty curve — is zig-zag frustrating or fun? Does flee feel "smart"? Is the carry wiggle + slow too punishing in round 5? |
| iPad hands-on QA | Kelli | Pending | Confirm touch, audio, all 5 rounds, and bad guy AI work on actual device |

## Next Steps (Priority Order)

### Immediate (Next Session)

1. **iPad playtest with Theo** — Have him play through all 5 rounds. Key questions: Does zig-zag make bad guys hard to catch or just more interesting? Does flee in rounds 4-5 feel like a real chase? Is the carry speed penalty in round 5 (0.75x) too punishing?
2. **Extract shared VehicleFactory** — Create `src/vehicles.js` loaded before scenes that centralizes all vehicle draw methods. Eliminates 3x duplication.
3. **Difficulty tuning based on playtest** — Adjust `zigZagInterval`, `fleeRange`, `fleeSpeed`, `carrySpeedPenalty`, and `wiggleIntensity` values based on Theo's experience.
4. **Add caught animation** — Visual feedback (particles, "CAUGHT!" text pop) when the car catches a bad guy. Currently just a white flash + sound.
5. **Consider bad guy personality types** — Some bad guys could be "runners" (always flee) vs "sneakers" (hide behind trees) vs "wanderers" (current default). Would add variety beyond just speed/range scaling.

### When Playtest Feedback Arrives

- Tune all per-round AI config values based on what Theo finds too easy or too hard
- May need to adjust the flee boundary margin (currently 50px) if bad guys get "stuck" in corners during flee

### Deferred

- Persistent high score / round progress using localStorage
- Additional environment themes per round (city, highway, park)
- PWA offline support with add-to-homescreen
- Second player mode on same iPad

## Architecture State Summary

### Data Pipeline / System Status

- **Vercel:** Auto-deploys from `main`. Static site, no build step. Live and working.
- **GitHub:** https://github.com/create-vibrant-impact/Theo-police-chase.git — all work pushed to `main`.
- **No backend/database** — Entirely client-side.

### Key Technical Decisions Locked

- Phaser 3 via CDN (no bundler, no npm dependencies at runtime)
- Procedural graphics only (no external image/sprite assets)
- Synthesized audio only (no external sound files)
- Vercel static deploy (no build command, outputDirectory is `.`)
- iPad landscape orientation (1024x768)
- Vanilla JS (no TypeScript, no framework)
- Config-driven round progression via `CONFIG.ROUNDS[]` array
- All bad guy AI config-driven (zigZag, flee, wiggle, carrySpeedPenalty)
- Flee runs per-frame in `update()`, wander defers via `fleeing` flag
- Three-layer boundary enforcement (velocity clamp + bounds check + world bounds)

### Files Changed This Session

| File | Description |
|---|---|
| `src/config.js` | Added 6 new per-round properties: `zigZag`, `zigZagInterval`, `fleeEnabled`, `fleeSpeed`, `fleeRange`, `wiggleIntensity`, `carrySpeedPenalty` |
| `src/scenes/GameScene.js` | Added `_updateBadGuyFlee()` with boundary clamping, `_updateBadGuyBounds()` backstop, zig-zag logic in `startWander()`, wiggle tween in `catchBadGuy()`, carry speed penalty in `update()`, wiggle cleanup in `deliverToJail()` |
| `CLAUDE.md` | Added architecture decisions for smart bad guys and wiggle/carry; added gotcha for flee-vs-wander override |
