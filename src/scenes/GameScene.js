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
      this.targetPos = { x: pointer.x, y: pointer.y };
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
    // Grass background
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, CONFIG.COLORS.GRASS);

    // Darker grass patches
    for (let i = 0; i < 8; i++) {
      const px = Phaser.Math.Between(50, CONFIG.WIDTH - 50);
      const py = Phaser.Math.Between(50, CONFIG.HEIGHT - 50);
      this.add.rectangle(px, py, Phaser.Math.Between(40, 100), Phaser.Math.Between(30, 60), CONFIG.COLORS.GRASS_DARK, 0.3);
    }

    // Roads (cross pattern)
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, 60, CONFIG.COLORS.ROAD); // horizontal
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 60, CONFIG.HEIGHT, CONFIG.COLORS.ROAD); // vertical
    // Road center lines
    for (let x = 0; x < CONFIG.WIDTH; x += 40) {
      this.add.rectangle(x, CONFIG.HEIGHT / 2, 16, 3, CONFIG.COLORS.ROAD_LINE);
    }
    for (let y = 0; y < CONFIG.HEIGHT; y += 40) {
      this.add.rectangle(CONFIG.WIDTH / 2, y, 3, 16, CONFIG.COLORS.ROAD_LINE);
    }

    // Trees
    this.drawTree(60, 120);
    this.drawTree(200, 80);
    this.drawTree(60, 550);
    this.drawTree(250, 650);
    this.drawTree(750, 600);
    this.drawTree(900, 650);

    // Flowers scattered around
    const flowerColors = [CONFIG.COLORS.FLOWER_RED, CONFIG.COLORS.FLOWER_YELLOW, CONFIG.COLORS.FLOWER_PURPLE];
    for (let i = 0; i < 20; i++) {
      const fx = Phaser.Math.Between(20, CONFIG.WIDTH - 20);
      const fy = Phaser.Math.Between(20, CONFIG.HEIGHT - 20);
      // Don't draw on roads
      const onHRoad = Math.abs(fy - CONFIG.HEIGHT / 2) < 35;
      const onVRoad = Math.abs(fx - CONFIG.WIDTH / 2) < 35;
      if (!onHRoad && !onVRoad) {
        this.drawFlower(fx, fy, Phaser.Utils.Array.GetRandom(flowerColors));
      }
    }
  }

  drawTree(x, y) {
    const g = this.add.graphics();
    g.fillStyle(CONFIG.COLORS.TREE_TRUNK);
    g.fillRect(x - 6, y + 10, 12, 25);
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillRect(x - 22, y - 5, 44, 22);
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES_LIGHT);
    g.fillRect(x - 16, y - 20, 32, 18);
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillRect(x - 10, y - 32, 20, 15);
  }

  drawFlower(x, y, color) {
    const g = this.add.graphics();
    g.fillStyle(0x388E3C);
    g.fillRect(x - 1, y, 2, 7);
    g.fillStyle(color);
    g.fillCircle(x, y - 2, 4);
    g.fillStyle(0xFFEB3B);
    g.fillCircle(x, y - 2, 1.5);
  }

  drawJailDetail() {
    const jx = CONFIG.JAIL_X;
    const jy = CONFIG.JAIL_Y;
    const jw = CONFIG.JAIL_WIDTH;
    const jh = CONFIG.JAIL_HEIGHT;
    const g = this.add.graphics();

    // Roof
    g.fillStyle(0x5D4037);
    g.fillTriangle(jx - jw / 2 - 10, jy - jh / 2, jx + jw / 2 + 10, jy - jh / 2, jx, jy - jh / 2 - 30);

    // Door
    this.jailDoor = this.add.rectangle(jx, jy + jh / 2 - 25, 30, 45, CONFIG.COLORS.JAIL_DOOR);

    // Window bars
    g.lineStyle(3, CONFIG.COLORS.JAIL_BARS);
    const wy = jy - 15;
    for (let i = -12; i <= 12; i += 8) {
      g.lineBetween(jx + i, wy - 10, jx + i, wy + 10);
    }
    g.lineBetween(jx - 14, wy, jx + 14, wy);

    // "JAIL" text
    this.add.text(jx, jy - jh / 2 - 8, 'JAIL', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#5D4037',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  // --- CAR ---

  createCar(x, y) {
    // Create a container with graphics for the car
    const g = this.add.graphics();

    // Car body
    g.fillStyle(CONFIG.COLORS.CAR_BODY);
    g.fillRect(-25, -12, 50, 24);

    // Windshield
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(12, -8, 10, 16);

    // Rear window
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(-22, -6, 8, 12);

    // Wheels
    g.fillStyle(0x333333);
    g.fillRect(-18, -16, 12, 5);
    g.fillRect(-18, 11, 12, 5);
    g.fillRect(8, -16, 12, 5);
    g.fillRect(8, 11, 12, 5);

    // Siren bar
    this.sirenLeft = this.add.rectangle(-4, -14, 6, 5, CONFIG.COLORS.SIREN_RED);
    this.sirenRight = this.add.rectangle(4, -14, 6, 5, CONFIG.COLORS.SIREN_BLUE);

    // Generate texture from graphics
    g.generateTexture('car', 50, 32);
    g.destroy();

    // Create the actual sprite
    const car = this.physics.add.sprite(x, y, 'car');
    car.setCollideWorldBounds(true);
    car.body.setSize(50, 32);

    // Move siren lights to track car (we'll use separate tracking)
    this.sirenLeft.setVisible(false);
    this.sirenRight.setVisible(false);

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
    const g = this.add.graphics();

    // Body (blocky Lego style)
    g.fillStyle(CONFIG.COLORS.BAD_GUY_BODY);
    g.fillRect(-10, -4, 20, 18);

    // Head
    g.fillStyle(CONFIG.COLORS.BAD_GUY_HEAD);
    g.fillRect(-7, -14, 14, 12);

    // Eyes (shifty!)
    g.fillStyle(0x000000);
    g.fillRect(-4, -10, 3, 3);
    g.fillRect(2, -10, 3, 3);

    // Mask (it's a bad guy!)
    g.fillStyle(0x333333);
    g.fillRect(-7, -8, 14, 3);

    // Arms
    g.fillStyle(CONFIG.COLORS.BAD_GUY_BODY);
    g.fillRect(-14, -2, 5, 12);
    g.fillRect(10, -2, 5, 12);

    // Legs
    g.fillStyle(0x333333);
    g.fillRect(-8, 14, 7, 8);
    g.fillRect(2, 14, 7, 8);

    g.generateTexture('badguy', 28, 24);
    g.destroy();

    const badGuy = this.physics.add.sprite(x, y, 'badguy');
    badGuy.body.setSize(28, 24);
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

    // Flash effect
    this.cameras.main.flash(200, 255, 255, 255, false, null, this);
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

    // Jail door animation
    this.tweens.add({
      targets: this.jailDoor,
      scaleX: 0.1,
      duration: 150,
      yoyo: true,
    });

    // Update HUD
    this.jailedCount++;
    this.updateHUD();

    // Camera shake for satisfaction
    this.cameras.main.shake(200, 0.008);

    // Check win
    if (this.jailedCount >= CONFIG.BAD_GUY_COUNT) {
      this.time.delayedCall(600, () => {
        this.scene.start('CelebrationScene');
      });
    }
  }

  // --- HUD ---

  drawHUD() {
    const startX = CONFIG.WIDTH / 2 - ((CONFIG.BAD_GUY_COUNT - 1) * CONFIG.HUD_ICON_SPACING) / 2;

    // HUD background
    const hudBg = this.add.rectangle(
      CONFIG.WIDTH / 2, CONFIG.HUD_Y,
      CONFIG.BAD_GUY_COUNT * CONFIG.HUD_ICON_SPACING + 30, 44,
      0x000000, 0.3
    );
    hudBg.setScrollFactor(0);

    for (let i = 0; i < CONFIG.BAD_GUY_COUNT; i++) {
      // Silhouette icon (person shape)
      const ix = startX + i * CONFIG.HUD_ICON_SPACING;
      const icon = this.add.graphics();
      icon.fillStyle(CONFIG.COLORS.HUD_EMPTY);
      // Head
      icon.fillCircle(ix, CONFIG.HUD_Y - 8, 6);
      // Body
      icon.fillRect(ix - 6, CONFIG.HUD_Y - 2, 12, 14);
      icon.setScrollFactor(0);
      this.hudIcons.push(icon);
    }
  }

  updateHUD() {
    if (this.jailedCount <= 0 || this.jailedCount > this.hudIcons.length) return;

    const idx = this.jailedCount - 1;
    const icon = this.hudIcons[idx];
    const startX = CONFIG.WIDTH / 2 - ((CONFIG.BAD_GUY_COUNT - 1) * CONFIG.HUD_ICON_SPACING) / 2;
    const ix = startX + idx * CONFIG.HUD_ICON_SPACING;

    // Redraw as filled
    icon.clear();
    icon.fillStyle(CONFIG.COLORS.HUD_FILLED);
    icon.fillCircle(ix, CONFIG.HUD_Y - 8, 6);
    icon.fillRect(ix - 6, CONFIG.HUD_Y - 2, 12, 14);

    // Checkmark
    icon.fillStyle(0xFFFFFF);
    icon.fillCircle(ix + 5, CONFIG.HUD_Y + 8, 4);
    icon.lineStyle(2, 0xFFFFFF);
    icon.lineBetween(ix + 3, CONFIG.HUD_Y + 8, ix + 5, CONFIG.HUD_Y + 10);
    icon.lineBetween(ix + 5, CONFIG.HUD_Y + 10, ix + 8, CONFIG.HUD_Y + 5);
  }
}
