class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // State
    this.carrying = null;       // Reference to caught bad guy
    this.jailedCount = 0;
    this.targetPos = null;      // Where the car is heading

    // --- ENVIRONMENT ---
    this.drawEnvironment();

    // --- JAIL ---
    this.jail = this.add.rectangle(
      CONFIG.JAIL_X, CONFIG.JAIL_Y,
      CONFIG.JAIL_WIDTH, CONFIG.JAIL_HEIGHT,
      CONFIG.COLORS.JAIL_WALLS
    );
    this.physics.add.existing(this.jail, true); // static body
    this.drawJailDetail();

    // --- POLICE CAR ---
    this.car = this.createCar(150, CONFIG.HEIGHT / 2);

    // --- BAD GUYS ---
    this.badGuys = this.physics.add.group();
    this.spawnBadGuys();

    // --- HUD ---
    this.hudIcons = [];
    this.drawHUD();

    // --- TOUCH INPUT ---
    this.input.on('pointerdown', (pointer) => {
      SoundManager.init(); // Ensure audio is unlocked on first touch
      this.targetPos = { x: pointer.x, y: pointer.y };
      SoundManager.startSiren();
    });
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this.targetPos = { x: pointer.x, y: pointer.y };
      }
    });
    this.input.on('pointerup', () => {
      // Option A: car stops when finger lifts
      this.targetPos = null;
      this.car.body.setVelocity(0, 0);
      SoundManager.stopSiren();
    });

    // --- COLLISIONS ---
    this.physics.add.overlap(this.car, this.badGuys, this.catchBadGuy, null, this);
    this.physics.add.overlap(this.car, this.jail, this.deliverToJail, null, this);

    // --- SIREN ANIMATION ---
    this.sirenTimer = this.time.addEvent({
      delay: 300,
      callback: this.toggleSiren,
      callbackScope: this,
      loop: true,
    });
    this.sirenState = false;
  }

  update() {
    if (this.targetPos) {
      const dist = Phaser.Math.Distance.Between(
        this.car.x, this.car.y,
        this.targetPos.x, this.targetPos.y
      );

      if (dist > CONFIG.CAR_STOP_DISTANCE) {
        this.physics.moveToObject(this.car, this.targetPos, CONFIG.CAR_SPEED);

        // Rotate car to face movement direction
        const angle = Phaser.Math.Angle.Between(
          this.car.x, this.car.y,
          this.targetPos.x, this.targetPos.y
        );
        this.car.setRotation(angle);
      } else {
        this.car.body.setVelocity(0, 0);
        this.targetPos = null;
      }
    }

    // Update carried bad guy position
    if (this.carrying) {
      this.carrying.x = this.car.x - Math.cos(this.car.rotation) * 35;
      this.carrying.y = this.car.y - Math.sin(this.car.rotation) * 35;
      this.carrying.setRotation(this.car.rotation);
    }

    // Update bad guy wandering
    this.badGuys.children.iterate((badGuy) => {
      if (!badGuy || !badGuy.active || badGuy === this.carrying) return;
      // Keep in bounds
      if (badGuy.x < 30) badGuy.body.setVelocityX(CONFIG.BAD_GUY_SPEED);
      if (badGuy.x > CONFIG.WIDTH - 30) badGuy.body.setVelocityX(-CONFIG.BAD_GUY_SPEED);
      if (badGuy.y < 30) badGuy.body.setVelocityY(CONFIG.BAD_GUY_SPEED);
      if (badGuy.y > CONFIG.HEIGHT - 30) badGuy.body.setVelocityY(-CONFIG.BAD_GUY_SPEED);
    });
  }

  // --- ENVIRONMENT DRAWING ---

  drawEnvironment() {
    // Grass baseplate (Lego green baseplate look)
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, CONFIG.COLORS.GRASS);

    // Lego studs on grass baseplate
    const g = this.add.graphics();
    for (let sx = 20; sx < CONFIG.WIDTH; sx += 40) {
      for (let sy = 20; sy < CONFIG.HEIGHT; sy += 40) {
        // Skip road areas
        const onHRoad = Math.abs(sy - CONFIG.HEIGHT / 2) < 35;
        const onVRoad = Math.abs(sx - CONFIG.WIDTH / 2) < 35;
        if (!onHRoad && !onVRoad) {
          g.fillStyle(CONFIG.COLORS.GRASS_DARK, 0.25);
          g.fillCircle(sx, sy, 5);
          g.fillStyle(0xFFFFFF, 0.08);
          g.fillCircle(sx - 1, sy - 1, 3);
        }
      }
    }

    // Roads (cross pattern) — dark gray Lego plates
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, 60, CONFIG.COLORS.ROAD);
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 60, CONFIG.HEIGHT, CONFIG.COLORS.ROAD);
    // Road brick lines
    const rg = this.add.graphics();
    rg.lineStyle(1, 0x616161, 0.3);
    for (let x = 0; x < CONFIG.WIDTH; x += 30) {
      rg.lineBetween(x, CONFIG.HEIGHT / 2 - 30, x, CONFIG.HEIGHT / 2 + 30);
    }
    for (let y = 0; y < CONFIG.HEIGHT; y += 30) {
      rg.lineBetween(CONFIG.WIDTH / 2 - 30, y, CONFIG.WIDTH / 2 + 30, y);
    }
    // Road center lines (yellow studs)
    for (let x = 0; x < CONFIG.WIDTH; x += 30) {
      this.add.rectangle(x, CONFIG.HEIGHT / 2, 12, 4, CONFIG.COLORS.ROAD_LINE);
    }
    for (let y = 0; y < CONFIG.HEIGHT; y += 30) {
      this.add.rectangle(CONFIG.WIDTH / 2, y, 4, 12, CONFIG.COLORS.ROAD_LINE);
    }

    // Lego trees
    this.drawTree(60, 120);
    this.drawTree(200, 80);
    this.drawTree(60, 550);
    this.drawTree(250, 650);
    this.drawTree(750, 600);
    this.drawTree(900, 650);

    // Lego flowers
    const flowerColors = [CONFIG.COLORS.FLOWER_RED, CONFIG.COLORS.FLOWER_YELLOW, CONFIG.COLORS.FLOWER_PURPLE];
    for (let i = 0; i < 20; i++) {
      const fx = Phaser.Math.Between(20, CONFIG.WIDTH - 20);
      const fy = Phaser.Math.Between(20, CONFIG.HEIGHT - 20);
      const onHRoad = Math.abs(fy - CONFIG.HEIGHT / 2) < 35;
      const onVRoad = Math.abs(fx - CONFIG.WIDTH / 2) < 35;
      if (!onHRoad && !onVRoad) {
        this.drawFlower(fx, fy, Phaser.Utils.Array.GetRandom(flowerColors));
      }
    }
  }

  // Helper: draw a Lego stud (round bump on top of brick)
  drawStud(g, x, y, color) {
    g.fillStyle(color);
    g.fillCircle(x, y, 4);
    // Highlight for 3D effect
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillCircle(x - 1, y - 1, 2);
  }

  // Helper: draw a Lego brick with outline and studs
  drawBrick(g, x, y, w, h, color, studs) {
    // Brick body
    g.fillStyle(color);
    g.fillRect(x, y, w, h);
    // Dark edge (bottom and right) for 3D depth
    g.fillStyle(0x000000, 0.2);
    g.fillRect(x, y + h - 2, w, 2);
    g.fillRect(x + w - 2, y, 2, h);
    // Light edge (top and left) for 3D highlight
    g.fillStyle(0xFFFFFF, 0.15);
    g.fillRect(x, y, w, 2);
    g.fillRect(x, y, 2, h);
    // Studs on top
    if (studs) {
      const studSpacing = w / (studs + 1);
      for (let i = 1; i <= studs; i++) {
        this.drawStud(g, x + studSpacing * i, y - 2, color);
      }
    }
  }

  drawTree(x, y) {
    const g = this.add.graphics();
    // Trunk — brown Lego brick
    this.drawBrick(g, x - 8, y + 10, 16, 30, CONFIG.COLORS.TREE_TRUNK, 1);
    // Canopy — stacked green Lego bricks (pyramid)
    this.drawBrick(g, x - 28, y - 5, 56, 18, CONFIG.COLORS.TREE_LEAVES, 4);
    this.drawBrick(g, x - 20, y - 22, 40, 18, CONFIG.COLORS.TREE_LEAVES_LIGHT, 3);
    this.drawBrick(g, x - 12, y - 38, 24, 18, CONFIG.COLORS.TREE_LEAVES, 2);
  }

  drawFlower(x, y, color) {
    const g = this.add.graphics();
    // Stem — thin green brick
    g.fillStyle(0x388E3C);
    g.fillRect(x - 2, y, 4, 10);
    // Flower head — Lego round piece (like a 1x1 round plate)
    g.fillStyle(color);
    g.fillCircle(x, y - 2, 6);
    // Stud on flower
    g.fillStyle(0xFFEB3B);
    g.fillCircle(x, y - 2, 3);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillCircle(x - 1, y - 3, 1.5);
  }

  drawJailDetail() {
    const jx = CONFIG.JAIL_X;
    const jy = CONFIG.JAIL_Y;
    const jw = CONFIG.JAIL_WIDTH;
    const jh = CONFIG.JAIL_HEIGHT;
    const g = this.add.graphics();

    // Jail built from Lego bricks — stacked rows
    const brickH = 14;
    const rows = Math.floor(jh / brickH);
    for (let r = 0; r < rows; r++) {
      const by = jy - jh / 2 + r * brickH;
      const offset = (r % 2 === 0) ? 0 : jw / 4; // Alternating brick offset
      const brickW = jw / 2;
      for (let c = 0; c < 3; c++) {
        const bx = jx - jw / 2 + offset + c * brickW;
        const clippedW = Math.min(brickW, jx + jw / 2 - bx);
        if (clippedW > 0 && bx < jx + jw / 2) {
          this.drawBrick(g, bx, by, clippedW, brickH, CONFIG.COLORS.JAIL_WALLS, 0);
        }
      }
    }

    // Studs on top row of jail
    for (let s = 0; s < 5; s++) {
      this.drawStud(g, jx - jw / 2 + 12 + s * 20, jy - jh / 2 - 2, CONFIG.COLORS.JAIL_WALLS);
    }

    // Roof — flat Lego plate (darker brown)
    this.drawBrick(g, jx - jw / 2 - 8, jy - jh / 2 - 16, jw + 16, 14, 0x5D4037, 5);

    // Door — dark brown brick
    this.jailDoor = this.add.rectangle(jx, jy + jh / 2 - 22, 28, 40, CONFIG.COLORS.JAIL_DOOR);
    // Door knob (round Lego stud)
    const dk = this.add.graphics();
    this.drawStud(dk, jx + 8, jy + jh / 2 - 22, 0xFFD600);

    // Window — gray brick opening with bars
    g.fillStyle(0x37474F);
    g.fillRect(jx - 15, jy - 25, 30, 22);
    // Bars (Lego technic rods)
    g.fillStyle(CONFIG.COLORS.JAIL_BARS);
    for (let i = -10; i <= 10; i += 7) {
      g.fillRect(jx + i, jy - 25, 3, 22);
    }
    // Horizontal bar
    g.fillRect(jx - 15, jy - 14, 30, 3);

    // "JAIL" text on a Lego tile
    g.fillStyle(0x455A64);
    g.fillRect(jx - 24, jy - jh / 2 - 30, 48, 14);
    this.add.text(jx, jy - jh / 2 - 23, 'JAIL', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);
  }

  // --- CAR ---

  createCar(x, y) {
    // Only generate texture once (survives scene restart)
    if (!this.textures.exists('car')) {
      const W = 64;
      const H = 40;
      const g = this.add.graphics();

      // Shadow
      g.fillStyle(0x000000, 0.15);
      g.fillRect(4, 8, W - 4, H - 8);

      // Car body — main Lego brick
      g.fillStyle(CONFIG.COLORS.CAR_BODY);
      g.fillRect(2, 6, W - 4, H - 12);
      // 3D brick edges
      g.fillStyle(0x000000, 0.2);
      g.fillRect(2, H - 8, W - 4, 2); // bottom edge
      g.fillRect(W - 4, 6, 2, H - 12);  // right edge
      g.fillStyle(0xFFFFFF, 0.15);
      g.fillRect(2, 6, W - 4, 2); // top highlight
      g.fillRect(2, 6, 2, H - 12); // left highlight

      // Studs on car body (2 on top)
      g.fillStyle(CONFIG.COLORS.CAR_BODY);
      g.fillCircle(22, 5, 4);
      g.fillCircle(42, 5, 4);
      g.fillStyle(0xFFFFFF, 0.25);
      g.fillCircle(21, 4, 2);
      g.fillCircle(41, 4, 2);

      // Windshield — transparent blue Lego piece
      g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
      g.fillRect(46, 10, 14, 20);
      g.fillStyle(0xFFFFFF, 0.3);
      g.fillRect(46, 10, 14, 2); // glass highlight
      g.fillRect(46, 10, 2, 20);

      // Rear window
      g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
      g.fillRect(4, 12, 10, 16);
      g.fillStyle(0xFFFFFF, 0.2);
      g.fillRect(4, 12, 10, 2);

      // White stripe (police car detail)
      g.fillStyle(0xFFFFFF);
      g.fillRect(14, 6, 32, 3);
      g.fillRect(14, H - 9, 32, 3);

      // Wheels — black Lego wheel pieces
      g.fillStyle(0x222222);
      g.fillRect(8, 0, 14, 7);
      g.fillRect(8, H - 7, 14, 7);
      g.fillRect(40, 0, 14, 7);
      g.fillRect(40, H - 7, 14, 7);
      // Wheel hubs (gray studs)
      g.fillStyle(0x666666);
      g.fillCircle(15, 3, 3);
      g.fillCircle(15, H - 4, 3);
      g.fillCircle(47, 3, 3);
      g.fillCircle(47, H - 4, 3);

      // Siren bar — red and blue Lego studs
      g.fillStyle(0x333333);
      g.fillRect(26, 2, 16, 5);
      g.fillStyle(CONFIG.COLORS.SIREN_RED);
      g.fillCircle(30, 4, 4);
      g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
      g.fillCircle(38, 4, 4);
      // Siren highlights
      g.fillStyle(0xFFFFFF, 0.4);
      g.fillCircle(29, 3, 2);
      g.fillCircle(37, 3, 2);

      // Headlights (front)
      g.fillStyle(0xFFEB3B);
      g.fillRect(W - 4, 12, 4, 5);
      g.fillRect(W - 4, 23, 4, 5);

      // Taillights (rear)
      g.fillStyle(0xF44336);
      g.fillRect(0, 12, 4, 5);
      g.fillRect(0, 23, 4, 5);

      g.generateTexture('car', W, H);
      g.destroy();
    }

    const car = this.physics.add.sprite(x, y, 'car');
    car.setCollideWorldBounds(true);
    car.body.setSize(64, 40);
    return car;
  }

  toggleSiren() {
    this.sirenState = !this.sirenState;
    // We'll flash the car tint instead for simplicity
    if (this.car && this.car.active) {
      this.car.setTint(this.sirenState ? 0xFFAAAA : 0xAAAAFF);
      // Reset tint after brief flash
      this.time.delayedCall(150, () => {
        if (this.car && this.car.active) {
          this.car.clearTint();
        }
      });
    }
  }

  // --- BAD GUYS ---

  spawnBadGuys() {
    const usedPositions = [
      { x: this.car.x, y: this.car.y },
      { x: CONFIG.JAIL_X, y: CONFIG.JAIL_Y },
    ];

    for (let i = 0; i < CONFIG.BAD_GUY_COUNT; i++) {
      let bx, by, tooClose;
      do {
        bx = Phaser.Math.Between(80, CONFIG.WIDTH - 80);
        by = Phaser.Math.Between(80, CONFIG.HEIGHT - 80);
        tooClose = usedPositions.some(
          (p) => Phaser.Math.Distance.Between(bx, by, p.x, p.y) < 120
        );
      } while (tooClose);

      usedPositions.push({ x: bx, y: by });
      const badGuy = this.createBadGuy(bx, by);
      this.badGuys.add(badGuy);
      this.startWander(badGuy);
    }
  }

  createBadGuy(x, y) {
    // Only generate texture once
    if (!this.textures.exists('badguy')) {
      const g = this.add.graphics();
      // Body (blocky Lego style)
      g.fillStyle(CONFIG.COLORS.BAD_GUY_BODY);
      g.fillRect(4, 10, 20, 18);
      // Head
      g.fillStyle(CONFIG.COLORS.BAD_GUY_HEAD);
      g.fillRect(7, 0, 14, 12);
      // Eyes (shifty!)
      g.fillStyle(0x000000);
      g.fillRect(10, 4, 3, 3);
      g.fillRect(16, 4, 3, 3);
      // Mask (it's a bad guy!)
      g.fillStyle(0x333333);
      g.fillRect(7, 6, 14, 3);
      // Arms
      g.fillStyle(CONFIG.COLORS.BAD_GUY_BODY);
      g.fillRect(0, 12, 5, 12);
      g.fillRect(24, 12, 5, 12);
      // Legs
      g.fillStyle(0x333333);
      g.fillRect(6, 28, 7, 8);
      g.fillRect(16, 28, 7, 8);
      g.generateTexture('badguy', 29, 36);
      g.destroy();
    }

    const badGuy = this.physics.add.sprite(x, y, 'badguy');
    badGuy.body.setSize(29, 36);
    badGuy.setCollideWorldBounds(true);
    return badGuy;
  }

  startWander(badGuy) {
    if (!badGuy || !badGuy.active) return;

    const vx = Phaser.Math.Between(-1, 1) * CONFIG.BAD_GUY_SPEED;
    const vy = Phaser.Math.Between(-1, 1) * CONFIG.BAD_GUY_SPEED;
    badGuy.body.setVelocity(vx, vy);

    this.time.delayedCall(CONFIG.BAD_GUY_WANDER_TIME, () => {
      if (badGuy && badGuy.active && badGuy !== this.carrying) {
        this.startWander(badGuy);
      }
    });
  }

  // --- CATCH & JAIL ---

  catchBadGuy(car, badGuy) {
    if (this.carrying) return; // Already carrying one

    this.carrying = badGuy;
    badGuy.body.setVelocity(0, 0);
    badGuy.body.enable = false;

    // Snap animation
    this.tweens.add({
      targets: badGuy,
      x: car.x - 30,
      y: car.y,
      duration: 150,
      ease: 'Back.easeOut',
    });

    // Flash effect + catch sound
    this.cameras.main.flash(200, 255, 255, 255, false, null, this);
    SoundManager.playCatch();
  }

  deliverToJail(car, jail) {
    if (!this.carrying) return;

    const badGuy = this.carrying;
    this.carrying = null;

    // Animate bad guy into jail
    this.tweens.add({
      targets: badGuy,
      x: CONFIG.JAIL_X,
      y: CONFIG.JAIL_Y,
      scale: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        badGuy.destroy();
      },
    });

    // Jail door animation + sound
    this.tweens.add({
      targets: this.jailDoor,
      scaleX: 0.1,
      duration: 150,
      yoyo: true,
    });
    SoundManager.playJail();

    // Update HUD
    this.jailedCount++;
    this.updateHUD();

    // Camera shake for satisfaction
    this.cameras.main.shake(200, 0.008);

    // Check win
    if (this.jailedCount >= CONFIG.BAD_GUY_COUNT) {
      SoundManager.stopSiren();
      this.time.delayedCall(600, () => {
        this.scene.start('CelebrationScene');
      });
    }
  }

  // --- HUD ---

  drawHUD() {
    const hudY = 35;
    const iconSpacing = 55;
    const startX = CONFIG.WIDTH / 2 - ((CONFIG.BAD_GUY_COUNT - 1) * iconSpacing) / 2;

    // HUD background — larger and more visible
    const hudBg = this.add.rectangle(
      CONFIG.WIDTH / 2, hudY,
      CONFIG.BAD_GUY_COUNT * iconSpacing + 50, 60,
      0x000000, 0.5
    );
    hudBg.setStrokeStyle(2, 0xFFFFFF, 0.4);
    hudBg.setDepth(100);

    for (let i = 0; i < CONFIG.BAD_GUY_COUNT; i++) {
      const ix = startX + i * iconSpacing;
      const icon = this.add.graphics();
      icon.fillStyle(CONFIG.COLORS.HUD_EMPTY);
      // Head (bigger)
      icon.fillCircle(ix, hudY - 10, 8);
      // Body
      icon.fillRect(ix - 8, hudY - 2, 16, 18);
      icon.setDepth(101);
      this.hudIcons.push({ graphics: icon, x: ix, y: hudY });
    }
    this.hudStartX = startX;
    this.hudIconSpacing = iconSpacing;
    this.hudIconY = hudY;

    // Pause button — top right (drawn as two white bars, Lego style)
    const pauseG = this.add.graphics();
    pauseG.fillStyle(0x000000, 0.5);
    pauseG.fillRoundedRect(CONFIG.WIDTH - 62, 12, 46, 46, 8);
    pauseG.fillStyle(0xFFFFFF);
    pauseG.fillRect(CONFIG.WIDTH - 50, 22, 8, 26);
    pauseG.fillRect(CONFIG.WIDTH - 36, 22, 8, 26);
    pauseG.setDepth(102);

    const pauseHit = this.add.rectangle(CONFIG.WIDTH - 39, 35, 60, 60, 0x000000, 0)
      .setDepth(103)
      .setInteractive({ useHandCursor: true });

    pauseHit.on('pointerdown', () => {
      SoundManager.playPause();
      SoundManager.stopSiren();
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
  }

  updateHUD() {
    if (this.jailedCount <= 0 || this.jailedCount > this.hudIcons.length) return;

    const idx = this.jailedCount - 1;
    const { graphics: icon, x: ix, y: hudY } = this.hudIcons[idx];

    // Redraw as filled (orange)
    icon.clear();
    icon.fillStyle(CONFIG.COLORS.HUD_FILLED);
    icon.fillCircle(ix, hudY - 10, 8);
    icon.fillRect(ix - 8, hudY - 2, 16, 18);

    // Checkmark circle
    icon.fillStyle(0x4CAF50);
    icon.fillCircle(ix + 8, hudY + 12, 6);
    icon.lineStyle(2, 0xFFFFFF);
    icon.lineBetween(ix + 5, hudY + 12, ix + 8, hudY + 15);
    icon.lineBetween(ix + 8, hudY + 15, ix + 12, hudY + 9);
  }
}
