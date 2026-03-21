# Full Arcade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 5 progressive rounds with vehicle unlocks, power-ups, obstacles, pause/escape buttons, vehicle reveal scenes, and a mega celebration finale to Theo's Police Patrol.

**Architecture:** Round config drives all per-round behavior from a single `CONFIG.ROUNDS` array. GameScene reads round data from scene init params. New scenes (VehicleRevealScene, MegaCelebrationScene) handle transitions between rounds. Vehicle textures are generated on-demand using the existing Phaser graphics → texture pattern. Pause overlay is a Phaser scene that runs on top of GameScene.

**Tech Stack:** Phaser 3.80.1 (CDN), plain JS (no build system), Web Audio API for sounds.

**Design doc:** `~/.gstack/projects/create-vibrant-impact-Theo-police-chase/kellifrieler-main-design-20260321-143346.md`

---

## Task 1: Round Configuration

**Files:**
- Modify: `src/config.js`

**Step 1: Add ROUNDS array and vehicle configs to config.js**

Add after the existing `CONFIG` properties (before the closing `};`):

```js
  // Round progression
  ROUNDS: [
    { round: 1, vehicle: 'car',         vehicleName: 'POLICE CAR',   vehicleW: 64, vehicleH: 40, speed: 200, badGuyCount: 3, badGuySpeed: 40, powerUps: false, obstacles: [] },
    { round: 2, vehicle: 'suv',         vehicleName: 'POLICE SUV',   vehicleW: 70, vehicleH: 46, speed: 190, badGuyCount: 4, badGuySpeed: 50, powerUps: true,  obstacles: [] },
    { round: 3, vehicle: 'jeep',        vehicleName: 'POLICE JEEP',  vehicleW: 64, vehicleH: 42, speed: 200, badGuyCount: 4, badGuySpeed: 55, powerUps: true,  obstacles: ['oilslick'] },
    { round: 4, vehicle: 'motorcycle',  vehicleName: 'MOTORCYCLE',   vehicleW: 55, vehicleH: 32, speed: 240, badGuyCount: 5, badGuySpeed: 60, powerUps: true,  obstacles: ['oilslick', 'pothole'] },
    { round: 5, vehicle: 'monstertruck', vehicleName: 'MONSTER JAM', vehicleW: 80, vehicleH: 50, speed: 180, badGuyCount: 5, badGuySpeed: 65, powerUps: true,  obstacles: ['oilslick', 'pothole'] },
  ],

  // Power-up constants
  POWERUP_BOOST_MULTIPLIER: 1.8,
  POWERUP_BOOST_DURATION: 3000,
  POWERUP_RESPAWN_DELAY: 8000,

  // Obstacle constants
  OIL_SLICK_SPIN_DURATION: 500,
  OIL_SLICK_COAST_DURATION: 1000,
  POTHOLE_SLOW_MULTIPLIER: 0.6,
  POTHOLE_SLOW_DURATION: 4000,

  // Power-up road spawn rule: rounds where power-ups may spawn on roads
  POWERUP_ON_ROADS_FROM_ROUND: 4,
```

**Step 2: Verify config loads**

Run: Open `http://localhost:8766` in browse, run `$B js "CONFIG.ROUNDS.length"` — expect `5`.

**Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat: add round progression config with vehicle specs and constants"
```

---

## Task 2: Vehicle Texture Factory

**Files:**
- Modify: `src/scenes/GameScene.js` (refactor `createCar` → `createVehicle`)

**Step 1: Replace `createCar` with `createVehicle(type, x, y)`**

The new method checks `this.textures.exists(type)` and draws the appropriate vehicle. Keep the existing police car drawing code for `type === 'car'`. Add new drawing code for `suv`, `jeep`, `motorcycle`, `monstertruck`.

Vehicle design guidelines (all follow existing Lego brick aesthetic):

**SUV (`suv`, 70x46):** Dark blue (0x0D47A1) body, taller than car. Roof rack = gray bar on top with 3 studs. Wider body. Same siren bar, wheels, windshield pattern. White "POLICE" stripe.

**Jeep (`jeep`, 64x42):** Olive/dark green (0x33691E) body with police blue (0x1565C0) accents. Open-top look (no full roof — just a roll bar across the top as a thin gray bar). Wider wheel arches. Siren bar on roll bar.

**Motorcycle (`motorcycle`, 55x32):** Narrow blue body (0x1565C0). Two wheels (larger, more prominent). Sidecar on the right side (small box, same blue). Single red siren light on top. Handlebars visible as thin gray bar at front.

**Monster Jam (`monstertruck`, 80x50):** BIG black body (0x212121) with yellow (0xFFD600) accent stripe. OVERSIZED wheels (bigger than car wheels, treaded look). Raised suspension (body sits higher). "MJ" text on side in yellow. Siren bar wider. Should feel powerful and chunky.

Each vehicle:
- Shadow underneath
- 3D brick edges (dark bottom/right, light top/left)
- Studs on top
- Siren lights (red + blue)
- Wheels with hubs
- Headlights and taillights

**Step 2: Update `create()` to use round config for vehicle selection**

```js
// At top of create():
this.currentRound = (this.scene.settings.data && this.scene.settings.data.round) || 1;
const roundConfig = CONFIG.ROUNDS[this.currentRound - 1];

// Replace: this.car = this.createCar(150, CONFIG.HEIGHT / 2);
// With:
this.vehicleType = roundConfig.vehicle;
this.car = this.createVehicle(roundConfig.vehicle, 150, CONFIG.HEIGHT / 2);
this.car.body.setSize(roundConfig.vehicleW, roundConfig.vehicleH);
```

**Step 3: Update all references from `CONFIG.BAD_GUY_COUNT` to `roundConfig.badGuyCount`**

In `spawnBadGuys()`, `drawHUD()`, `deliverToJail()` win check — replace all references to `CONFIG.BAD_GUY_COUNT` with `this.roundConfig.badGuyCount`. Store `this.roundConfig = roundConfig` at top of `create()`.

Also update `startWander` and `update()` bad guy speed to use `this.roundConfig.badGuySpeed`.

**Step 4: Verify Round 1 still works identically**

Serve locally, play through Round 1. Catch all 3 bad guys. Confirm game plays exactly as before.

**Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add vehicle factory with 5 Lego-style vehicles and round-aware game state"
```

---

## Task 3: New Sound Effects

**Files:**
- Modify: `src/sounds.js`

**Step 1: Add 4 new sound methods to SoundManager**

```js
// --- ENGINE REV (ascending rumble for vehicle reveal) ---
playEngineRev() { ... }

// --- WHOOSH (nitrous speed boost) ---
playWhoosh() { ... }

// --- DEFLATE (flat tire pffft) ---
playDeflate() { ... }

// --- CRUNCH (Monster Jam crushes obstacle) ---
playCrunch() { ... }

// --- PAUSE SOUND (soft click) ---
playPause() { ... }
```

Sound design:
- **Engine rev:** Low-frequency oscillator (80Hz) ramping up to 200Hz over 0.6s, with slight distortion (square wave). Gain peaks at 0.2.
- **Whoosh:** High sine sweep from 400Hz to 2000Hz in 0.3s, rapid gain envelope (sharp attack, quick decay). Like a rocket igniting.
- **Deflate:** Noise burst filtered through a low-pass, descending pitch from 300Hz to 50Hz over 0.5s. The "pffft" sound.
- **Crunch:** Short noise burst (0.1s) + low triangle wave hit at 100Hz. Metallic crunch feeling.
- **Pause:** Very short sine blip at 800Hz, 0.05s duration, gain 0.1. Subtle.

**Step 2: Verify sounds play**

In browser console: `SoundManager.init(); SoundManager.playEngineRev();` — confirm audible.

**Step 3: Commit**

```bash
git add src/sounds.js
git commit -m "feat: add engine rev, whoosh, deflate, crunch, and pause sound effects"
```

---

## Task 4: Pause & Escape Buttons

**Files:**
- Create: `src/scenes/PauseScene.js`
- Modify: `src/scenes/GameScene.js`
- Modify: `src/main.js`
- Modify: `index.html`

**Step 1: Create PauseScene**

PauseScene launches as an overlay on top of GameScene (using `this.scene.launch('PauseScene')` + `this.scene.pause('GameScene')`). It does NOT replace GameScene.

```js
class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;

    // Semi-transparent dark overlay
    this.add.rectangle(cx, cy, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.6);

    // "PAUSED" text
    this.add.text(cx, cy - 80, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '64px', fontStyle: 'bold',
      color: '#FFFFFF', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    // RESUME button (green, same style as PLAY)
    // ... (green rounded rect + "RESUME" text, interactive)
    // On click: this.scene.resume('GameScene'); this.scene.stop();

    // QUIT button (red-ish, goes back to title)
    // ... (red rounded rect + "QUIT" text, interactive)
    // On click: this.scene.stop('GameScene'); this.scene.stop(); this.scene.start('TitleScene');

    // Both buttons use the same pattern as PLAY button in TitleScene
    // (graphics rounded rect + text with setPadding + pointerdown handler)
  }
}
```

Button layout:
- RESUME: green button (0x4CAF50), 200x70, centered at (cx, cy + 20)
- QUIT: red button (0xE53935), 200x70, centered at (cx, cy + 110)
- Both have 40px padding for easy tapping by a young child

RESUME resumes GameScene physics, timers, and stops PauseScene. QUIT stops both scenes and starts TitleScene.

**Step 2: Add pause button to GameScene HUD**

In `drawHUD()`, add a pause button in the top-right corner:

```js
// Pause button — top right
const pauseBtn = this.add.text(CONFIG.WIDTH - 40, 35, '⏸', {
  fontSize: '32px',
}).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true }).setPadding(15, 10);

pauseBtn.on('pointerdown', () => {
  SoundManager.playPause();
  SoundManager.stopSiren();
  this.scene.pause();
  this.scene.launch('PauseScene');
});
```

Alternative to emoji: draw a pause icon with two small white rectangles (Lego brick style). Use `this.add.graphics()` to draw two 6x20 white rectangles side by side, wrap in a container for interactivity. Use whichever approach renders more reliably on iPad Safari.

**Step 3: Register PauseScene in main.js and index.html**

Add `PauseScene` to the scene array in `main.js` and add the script tag in `index.html`.

**Step 4: Verify pause works**

Start game, tap pause button. Confirm: game freezes, overlay appears, RESUME works, QUIT returns to title.

**Step 5: Commit**

```bash
git add src/scenes/PauseScene.js src/scenes/GameScene.js src/main.js index.html
git commit -m "feat: add pause overlay with resume and quit buttons"
```

---

## Task 5: Power-Ups (Nitrous Speed Boost)

**Files:**
- Modify: `src/scenes/GameScene.js`

**Step 1: Add power-up spawning to `create()`**

Only spawn when `this.roundConfig.powerUps === true` (Rounds 2+).

```js
this.powerUps = this.physics.add.group();
this.isBoosted = false;

if (this.roundConfig.powerUps) {
  this.spawnPowerUp();
  // Spawn a second one after a delay
  this.time.delayedCall(4000, () => this.spawnPowerUp());
}
```

**Step 2: Implement `spawnPowerUp()` and `createPowerUpTexture()`**

Power-up visual: Orange/red glowing fuel can (Lego round piece). Draw with graphics:
- Orange circle (radius 12) with flame icon (small red triangle on top)
- Subtle pulsing glow tween (scale 1.0 → 1.15, yoyo, repeat -1)

Spawn position: random position on grass (avoid roads for rounds 2-3, allow roads for rounds 4-5). Check `this.currentRound >= CONFIG.POWERUP_ON_ROADS_FROM_ROUND`.

**Step 3: Implement `collectPowerUp(car, powerUp)` overlap handler**

```js
this.physics.add.overlap(this.car, this.powerUps, this.collectPowerUp, null, this);
```

On collection:
1. Destroy the power-up sprite
2. Set `this.isBoosted = true`
3. Play `SoundManager.playWhoosh()`
4. Show boost HUD indicator (flame icon)
5. After `CONFIG.POWERUP_BOOST_DURATION` (3s), set `this.isBoosted = false`, hide indicator
6. After `CONFIG.POWERUP_RESPAWN_DELAY` (8s), call `this.spawnPowerUp()` again

**Step 4: Update `update()` movement loop for boost**

In the movement section, calculate effective speed:

```js
let speed = this.roundConfig.speed;
if (this.isBoosted) speed *= CONFIG.POWERUP_BOOST_MULTIPLIER;
if (this.isSlowed) speed *= CONFIG.POTHOLE_SLOW_MULTIPLIER;
// isSpinning handled separately (early return with coast)

this.physics.moveToObject(this.car, this.targetPos, speed);
```

**Step 5: Clean up on round complete**

In `deliverToJail`, when `this.roundComplete = true`:
- Clear all power-up timers
- Destroy remaining power-up sprites
- Reset `this.isBoosted = false`

**Step 6: Verify power-ups work in Round 2**

Force start Round 2: `game.scene.start('GameScene', { round: 2 })`. Confirm: fuel cans appear, collecting one speeds you up for 3 seconds, new one spawns after 8 seconds.

**Step 7: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add nitrous speed boost power-ups (rounds 2+)"
```

---

## Task 6: Obstacles (Oil Slicks & Potholes)

**Files:**
- Modify: `src/scenes/GameScene.js`

**Step 1: Add obstacle spawning to `create()`**

Only spawn obstacle types listed in `this.roundConfig.obstacles`.

```js
this.obstacles = this.physics.add.group();
this.isSpinning = false;
this.isSlowed = false;

if (this.roundConfig.obstacles.length > 0) {
  this.spawnObstacles();
}
```

**Step 2: Implement `spawnObstacles()`**

Place 2-3 of each enabled obstacle type on road areas:
- Road areas: horizontal band around `CONFIG.HEIGHT / 2` (±30px), vertical band around `CONFIG.WIDTH / 2` (±30px)
- Avoid intersection center (±50px from center)
- Avoid jail area

**Step 3: Create obstacle textures**

**Oil slick (`oilslick`):** Dark gray/black splotchy circle. Graphics: filled circle (radius 18) with irregular edges (draw several overlapping circles of slightly different sizes). Color: 0x1A1A1A with alpha 0.7.

**Pothole (`pothole`):** Brown cracked circle. Graphics: dark brown circle (radius 15, color 0x4E342E) with lighter brown crack lines and small debris rectangles around it.

**Step 4: Implement `hitObstacle(car, obstacle)` overlap handler**

```js
this.physics.add.overlap(this.car, this.obstacles, this.hitObstacle, null, this);
```

On hit:
- Check obstacle type (store as `obstacle.obstacleType`)
- If Monster Jam (`this.vehicleType === 'monstertruck'`): destroy obstacle, play `SoundManager.playCrunch()`, spawn particles, return
- If already spinning or slowed: return (don't stack effects)

**Oil slick effect:**
1. Set `this.isSpinning = true`
2. Capture velocity: `this.spinVx = this.car.body.velocity.x; this.spinVy = this.car.body.velocity.y`
3. Rotation tween: `this.tweens.add({ targets: this.car, angle: '+=720', duration: 500 })`
4. After 1000ms: `this.isSpinning = false`

**Pothole effect:**
1. Set `this.isSlowed = true`
2. Play `SoundManager.playDeflate()`
3. Wobble tween: `this.tweens.add({ targets: this.car, angle: { from: -3, to: 3 }, duration: 200, yoyo: true, repeat: 9 })`
4. Show flat tire HUD indicator
5. After 4000ms: `this.isSlowed = false`, hide indicator

**Step 5: Update `update()` for spinning state**

```js
if (this.isSpinning) {
  this.car.body.setVelocity(this.spinVx, this.spinVy);
  // Skip all movement — coast on captured velocity
  // Still update carried bad guy position
  if (this.carrying) { ... }
  return; // from the movement section, not from update() entirely
}
```

**Step 6: Clean up on round complete**

Clear obstacle timers, reset flags.

**Step 7: Verify obstacles work**

Force Round 3: `game.scene.start('GameScene', { round: 3 })`. Drive into oil slick — car spins. Force Round 4: drive into pothole — car slows.
Force Round 5: Monster Jam crushes obstacles.

**Step 8: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add oil slick and pothole obstacles with Monster Jam immunity"
```

---

## Task 7: CelebrationScene Updates

**Files:**
- Modify: `src/scenes/CelebrationScene.js`

**Step 1: Accept and forward round data**

```js
create() {
  this.currentRound = (this.scene.settings.data && this.scene.settings.data.round) || 1;
  // ... existing celebration code ...
}
```

**Step 2: Change button behavior based on round**

For rounds 1-4: button navigates to VehicleRevealScene with `{ round: this.currentRound }`.
The "CATCH MORE!" text is fine for all rounds since GameScene skips CelebrationScene for Round 5.

```js
const restart = () => {
  if (started) return;
  started = true;
  SoundManager.playTap();
  this.tweens.add({
    targets: [btn, btnText],
    scaleX: 0.9, scaleY: 0.9,
    duration: 100, yoyo: true,
    onComplete: () => {
      this.scene.start('VehicleRevealScene', { round: this.currentRound });
    },
  });
};
```

**Step 3: Verify scene chain**

Force: `game.scene.start('CelebrationScene', { round: 1 })`. Click button — should go to VehicleRevealScene.

**Step 4: Commit**

```bash
git add src/scenes/CelebrationScene.js
git commit -m "feat: update CelebrationScene to pass round data to VehicleRevealScene"
```

---

## Task 8: VehicleRevealScene

**Files:**
- Create: `src/scenes/VehicleRevealScene.js`
- Modify: `src/main.js`
- Modify: `index.html`

**Step 1: Create VehicleRevealScene**

Scene flow:
1. Read `this.scene.settings.data.round` — this is the round that was JUST completed
2. Next round = `round + 1`
3. Look up next vehicle from `CONFIG.ROUNDS[nextRound - 1]`
4. Dark navy background (0x1A237E)
5. "ROUND [N] COMPLETE!" slams in (Back.easeOut, scale 0 → 1, 500ms)
6. After 500ms: "NEW VEHICLE UNLOCKED!" fades in
7. After 800ms: Generate the next vehicle's texture using the same `createVehicle` method (copy or import pattern from GameScene), create sprite off-screen left, tween to center (1s, Power2.easeOut). Play `SoundManager.playEngineRev()`.
8. Vehicle name text appears below
9. Special case: if vehicleName === 'MONSTER JAM', make the text bigger (60px instead of 36px), add yellow color (0xFFD600), add a subtle fire glow behind it
10. "GO!" button appears after vehicle arrives — same green button pattern
11. GO button starts `GameScene` with `{ round: nextRound }`

**Step 2: Register in main.js and index.html**

Add `VehicleRevealScene` to scene array and add script tag.

**Step 3: Verify**

Force: `game.scene.start('VehicleRevealScene', { round: 1 })`. Should show "ROUND 1 COMPLETE!" and reveal the SUV, then GO button starts Round 2.

**Step 4: Commit**

```bash
git add src/scenes/VehicleRevealScene.js src/main.js index.html
git commit -m "feat: add VehicleRevealScene with animated vehicle unlock between rounds"
```

---

## Task 9: MegaCelebrationScene

**Files:**
- Create: `src/scenes/MegaCelebrationScene.js`
- Modify: `src/main.js`
- Modify: `index.html`

**Step 1: Create MegaCelebrationScene**

Enhanced celebration for after Round 5:
1. Dark navy background (0x1A237E)
2. Massive confetti (100+ pieces, more colors, faster)
3. "SUPER PATROL!" text — bigger than "GOT 'EM!" (96px), gold color with orange stroke, slam-in animation
4. All 5 vehicle sprites parade across the screen left-to-right in a line (generate all textures, create sprites, stagger tweens)
5. After parade: Monster Jam stops in center, does a 360° victory spin
6. Police badge with "5" on it (blue circle + gold star + "5" text)
7. Extended fanfare: `SoundManager.playFanfare()` but also add an extra triumphant note sequence
8. "PLAY AGAIN!" button (green, same pattern) — starts `TitleScene`

**Step 2: Register in main.js and index.html**

**Step 3: Verify**

Force: `game.scene.start('MegaCelebrationScene')`. Should show full celebration with vehicle parade.

**Step 4: Commit**

```bash
git add src/scenes/MegaCelebrationScene.js src/main.js index.html
git commit -m "feat: add MegaCelebrationScene with vehicle parade and Monster Jam victory spin"
```

---

## Task 10: GameScene Round Transitions

**Files:**
- Modify: `src/scenes/GameScene.js`

**Step 1: Update HUD for round info**

In `drawHUD()`:
- Add "ROUND N" text in top-left corner (depth 101)
- Add vehicle name text in top-right corner (depth 101, shifted left to make room for pause button)
- HUD bad-guy icon count uses `this.roundConfig.badGuyCount`

**Step 2: Update `deliverToJail()` win condition**

```js
if (this.jailedCount >= this.roundConfig.badGuyCount) {
  this.roundComplete = true;
  SoundManager.stopSiren();
  // Clear all timers, power-ups, obstacle effects
  this.time.delayedCall(600, () => {
    if (this.currentRound >= 5) {
      this.scene.start('MegaCelebrationScene');
    } else {
      this.scene.start('CelebrationScene', { round: this.currentRound });
    }
  });
}
```

**Step 3: Add `roundComplete` guard to `update()`**

```js
update() {
  if (this.roundComplete) return;
  // ... rest of update
}
```

**Step 4: Full playthrough test**

Play through all 5 rounds manually. Verify:
- Round 1: Police Car, 3 bad guys, no power-ups/obstacles
- Round 2: SUV, 4 bad guys, power-ups appear
- Round 3: Jeep, 4 bad guys, oil slicks on roads
- Round 4: Motorcycle, 5 bad guys, potholes added
- Round 5: Monster Jam, 5 bad guys, crushes obstacles
- After Round 5: MegaCelebrationScene

**Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: wire up round transitions, HUD round info, and win condition routing"
```

---

## Task 11: Final Wiring & QA

**Files:**
- Modify: `src/main.js` (verify all scenes registered)
- Modify: `index.html` (verify all script tags)

**Step 1: Verify scene registration order**

`main.js` scene array should be:
```js
scene: [TitleScene, GameScene, CelebrationScene, VehicleRevealScene, MegaCelebrationScene, PauseScene],
```

**Step 2: Verify script tag order in index.html**

Scripts must load in dependency order:
```html
<script src="src/config.js"></script>
<script src="src/sounds.js"></script>
<script src="src/scenes/TitleScene.js"></script>
<script src="src/scenes/GameScene.js"></script>
<script src="src/scenes/CelebrationScene.js"></script>
<script src="src/scenes/VehicleRevealScene.js"></script>
<script src="src/scenes/MegaCelebrationScene.js"></script>
<script src="src/scenes/PauseScene.js"></script>
<script src="src/main.js"></script>
```

**Step 3: End-to-end playtest**

Full playthrough from title screen through all 5 rounds. Test:
- [ ] PLAY button works
- [ ] Round 1: catch 3 bad guys, celebration, vehicle reveal
- [ ] Round 2: SUV drives differently, power-ups work
- [ ] Round 3: oil slicks cause spin
- [ ] Round 4: potholes cause flat tire
- [ ] Round 5: Monster Jam crushes obstacles
- [ ] MegaCelebration shows vehicle parade
- [ ] PLAY AGAIN returns to title
- [ ] Pause button pauses game
- [ ] Resume button resumes
- [ ] Quit button returns to title
- [ ] No console errors

**Step 4: Commit any fixes**

**Step 5: Push**

```bash
git push origin main
```

---

## Task Dependencies

```
Task 1 (Config) ──────────┐
                           ├──→ Task 5 (Power-ups) ──→ Task 10 (Transitions)
Task 2 (Vehicles) ────────┤                                    │
                           ├──→ Task 6 (Obstacles) ─────────────┤
Task 3 (Sounds) ──────────┤                                    │
                           ├──→ Task 8 (VehicleReveal) ────────┤
Task 4 (Pause/Escape) ────┤                                    ├──→ Task 11 (QA)
                           ├──→ Task 9 (MegaCelebration) ──────┤
Task 7 (CelebrationScene) ─────────────────────────────────────┘
```

**Parallelizable groups:**
- Group A (no dependencies): Tasks 1, 3, 4, 7
- Group B (needs Task 1): Tasks 2, 5, 6, 8, 9
- Group C (needs all above): Tasks 10, 11
