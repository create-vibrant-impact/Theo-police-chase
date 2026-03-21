class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // Round config
    this.currentRound = (this.scene.settings.data && this.scene.settings.data.round) || 1;
    this.roundConfig = CONFIG.ROUNDS[this.currentRound - 1];

    // State
    this.carrying = null;       // Reference to caught bad guy
    this.jailedCount = 0;
    this.targetPos = null;      // Where the car is heading
    this.roundComplete = false;

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

    // --- VEHICLE ---
    this.vehicleType = this.roundConfig.vehicle;
    this.car = this.createVehicle(this.roundConfig.vehicle, 150, CONFIG.HEIGHT / 2);
    this.car.body.setSize(this.roundConfig.vehicleW, this.roundConfig.vehicleH);

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

    // --- POWER-UPS ---
    this.powerUps = this.physics.add.group();
    this.isBoosted = false;
    if (this.roundConfig.powerUps) {
      this.spawnPowerUp();
      this.time.delayedCall(4000, () => this.spawnPowerUp());
    }
    this.physics.add.overlap(this.car, this.powerUps, this.collectPowerUp, null, this);

    // --- OBSTACLES ---
    this.obstacles = this.physics.add.group();
    this.isSpinning = false;
    this.isSlowed = false;
    this.obstacleImmune = false;
    if (this.roundConfig.obstacles.length > 0) {
      this.spawnObstacles();
    }
    this.physics.add.overlap(this.car, this.obstacles, this.hitObstacle, null, this);

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
    if (this.roundComplete) return;

    // Spinning state — coast on captured velocity
    if (this.isSpinning) {
      this.car.body.setVelocity(this.spinVx, this.spinVy);
      if (this.carrying) {
        this.carrying.x = this.car.x - Math.cos(this.car.rotation) * 35;
        this.carrying.y = this.car.y - Math.sin(this.car.rotation) * 35;
        this.carrying.setRotation(this.car.rotation);
      }
      this._updateBadGuyBounds();
      return;
    }

    if (this.targetPos) {
      const dist = Phaser.Math.Distance.Between(
        this.car.x, this.car.y,
        this.targetPos.x, this.targetPos.y
      );

      if (dist > CONFIG.CAR_STOP_DISTANCE) {
        let speed = this.roundConfig.speed;
        if (this.isBoosted) speed *= CONFIG.POWERUP_BOOST_MULTIPLIER;
        if (this.isSlowed) speed *= CONFIG.POTHOLE_SLOW_MULTIPLIER;
        this.physics.moveToObject(this.car, this.targetPos, speed);

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

    this._updateBadGuyBounds();
  }

  _updateBadGuyBounds() {
    this.badGuys.children.iterate((badGuy) => {
      if (!badGuy || !badGuy.active || badGuy === this.carrying) return;
      if (badGuy.x < 30) badGuy.body.setVelocityX(this.roundConfig.badGuySpeed);
      if (badGuy.x > CONFIG.WIDTH - 30) badGuy.body.setVelocityX(-this.roundConfig.badGuySpeed);
      if (badGuy.y < 30) badGuy.body.setVelocityY(this.roundConfig.badGuySpeed);
      if (badGuy.y > CONFIG.HEIGHT - 30) badGuy.body.setVelocityY(-this.roundConfig.badGuySpeed);
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

  // --- VEHICLES ---

  createVehicle(type, x, y) {
    if (!this.textures.exists(type)) {
      const rc = CONFIG.ROUNDS.find(r => r.vehicle === type);
      const W = rc.vehicleW;
      const H = rc.vehicleH;
      const g = this.add.graphics();

      if (type === 'car') {
        this._drawCarTexture(g, W, H);
      } else if (type === 'suv') {
        this._drawSuvTexture(g, W, H);
      } else if (type === 'jeep') {
        this._drawJeepTexture(g, W, H);
      } else if (type === 'motorcycle') {
        this._drawMotorcycleTexture(g, W, H);
      } else if (type === 'monstertruck') {
        this._drawMonsterTruckTexture(g, W, H);
      }

      g.generateTexture(type, W, H);
      g.destroy();
    }

    const vehicle = this.physics.add.sprite(x, y, type);
    vehicle.setCollideWorldBounds(true);
    return vehicle;
  }

  _drawCarTexture(g, W, H) {
    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRect(4, 8, W - 4, H - 8);
    // Car body
    g.fillStyle(CONFIG.COLORS.CAR_BODY);
    g.fillRect(2, 6, W - 4, H - 12);
    // 3D brick edges
    g.fillStyle(0x000000, 0.2);
    g.fillRect(2, H - 8, W - 4, 2);
    g.fillRect(W - 4, 6, 2, H - 12);
    g.fillStyle(0xFFFFFF, 0.15);
    g.fillRect(2, 6, W - 4, 2);
    g.fillRect(2, 6, 2, H - 12);
    // Studs
    g.fillStyle(CONFIG.COLORS.CAR_BODY);
    g.fillCircle(22, 5, 4);
    g.fillCircle(42, 5, 4);
    g.fillStyle(0xFFFFFF, 0.25);
    g.fillCircle(21, 4, 2);
    g.fillCircle(41, 4, 2);
    // Windshield
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(46, 10, 14, 20);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillRect(46, 10, 14, 2);
    g.fillRect(46, 10, 2, 20);
    // Rear window
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(4, 12, 10, 16);
    g.fillStyle(0xFFFFFF, 0.2);
    g.fillRect(4, 12, 10, 2);
    // White stripe
    g.fillStyle(0xFFFFFF);
    g.fillRect(14, 6, 32, 3);
    g.fillRect(14, H - 9, 32, 3);
    // Wheels
    g.fillStyle(0x222222);
    g.fillRect(8, 0, 14, 7);
    g.fillRect(8, H - 7, 14, 7);
    g.fillRect(40, 0, 14, 7);
    g.fillRect(40, H - 7, 14, 7);
    g.fillStyle(0x666666);
    g.fillCircle(15, 3, 3);
    g.fillCircle(15, H - 4, 3);
    g.fillCircle(47, 3, 3);
    g.fillCircle(47, H - 4, 3);
    // Siren bar
    g.fillStyle(0x333333);
    g.fillRect(26, 2, 16, 5);
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillCircle(30, 4, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
    g.fillCircle(38, 4, 4);
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(29, 3, 2);
    g.fillCircle(37, 3, 2);
    // Headlights
    g.fillStyle(0xFFEB3B);
    g.fillRect(W - 4, 12, 4, 5);
    g.fillRect(W - 4, 23, 4, 5);
    // Taillights
    g.fillStyle(0xF44336);
    g.fillRect(0, 12, 4, 5);
    g.fillRect(0, 23, 4, 5);
  }

  _drawSuvTexture(g, W, H) {
    // WHITE body with blue stripe — classic NYPD look
    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRect(4, 10, W - 4, H - 10);
    // Body — crisp white
    g.fillStyle(0xF0F0F0);
    g.fillRect(2, 7, W - 4, H - 14);
    // 3D edges
    g.fillStyle(0x000000, 0.15);
    g.fillRect(2, H - 9, W - 4, 2);
    g.fillRect(W - 4, 7, 2, H - 14);
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillRect(2, 7, W - 4, 2);
    g.fillRect(2, 7, 2, H - 14);
    // Bold blue stripe down the middle
    g.fillStyle(0x1565C0);
    g.fillRect(10, 14, 50, 4);
    g.fillRect(10, H - 18, 50, 4);
    // Blue hood and trunk accents
    g.fillStyle(0x1565C0);
    g.fillRect(2, 7, 10, H - 14);
    g.fillRect(W - 12, 7, 10, H - 14);
    // Roof rack — chrome bar with blue lights
    g.fillStyle(0xCCCCCC);
    g.fillRect(14, 3, 42, 5);
    g.fillStyle(0x1565C0);
    g.fillCircle(22, 5, 3);
    g.fillCircle(35, 5, 3);
    g.fillCircle(48, 5, 3);
    // Bull bar at front
    g.fillStyle(0xAAAAAA);
    g.fillRect(W - 4, 8, 4, H - 16);
    g.fillStyle(0x888888);
    g.fillRect(W - 3, 12, 3, 3);
    g.fillRect(W - 3, H - 15, 3, 3);
    // Windshield — big
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(50, 10, 14, 26);
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillRect(50, 10, 14, 2);
    // Chunky wheels
    g.fillStyle(0x111111);
    g.fillRect(8, 0, 18, 9);
    g.fillRect(8, H - 9, 18, 9);
    g.fillRect(44, 0, 18, 9);
    g.fillRect(44, H - 9, 18, 9);
    g.fillStyle(0x888888);
    g.fillCircle(17, 4, 4);
    g.fillCircle(17, H - 5, 4);
    g.fillCircle(53, 4, 4);
    g.fillCircle(53, H - 5, 4);
    // Siren bar
    g.fillStyle(0x333333);
    g.fillRect(26, 2, 18, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillCircle(30, 3, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
    g.fillCircle(40, 3, 4);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(29, 2, 2);
    g.fillCircle(39, 2, 2);
    // Headlights (bright)
    g.fillStyle(0xFFEB3B);
    g.fillRect(W - 6, 12, 6, 7);
    g.fillRect(W - 6, 27, 6, 7);
    // Taillights
    g.fillStyle(0xF44336);
    g.fillRect(0, 12, 4, 6);
    g.fillRect(0, 28, 4, 6);
  }

  _drawJeepTexture(g, W, H) {
    // BRIGHT LIME GREEN off-road jeep with chunky fender flares
    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRect(2, 8, W - 2, H - 8);
    // Body — vibrant green
    g.fillStyle(0x4CAF50);
    g.fillRect(4, 9, W - 8, H - 18);
    // 3D edges
    g.fillStyle(0x000000, 0.2);
    g.fillRect(4, H - 11, W - 8, 2);
    g.fillRect(W - 6, 9, 2, H - 18);
    g.fillStyle(0xFFFFFF, 0.2);
    g.fillRect(4, 9, W - 8, 2);
    g.fillRect(4, 9, 2, H - 18);
    // Dark green camo patches
    g.fillStyle(0x2E7D32, 0.6);
    g.fillRect(12, 12, 12, 8);
    g.fillRect(30, 16, 10, 6);
    g.fillRect(18, H - 18, 14, 6);
    // Yellow accent stripe
    g.fillStyle(0xFFEB3B);
    g.fillRect(10, 9, 44, 3);
    g.fillRect(10, H - 12, 44, 3);
    // Fender flares — extend BEYOND body (key visual difference)
    g.fillStyle(0x333333);
    g.fillRect(4, 0, 20, 10);
    g.fillRect(4, H - 10, 20, 10);
    g.fillRect(38, 0, 20, 10);
    g.fillRect(38, H - 10, 20, 10);
    // Wheels inside flares — big round
    g.fillStyle(0x111111);
    g.fillCircle(14, 4, 7);
    g.fillCircle(14, H - 4, 7);
    g.fillCircle(48, 4, 7);
    g.fillCircle(48, H - 4, 7);
    g.fillStyle(0x888888);
    g.fillCircle(14, 4, 3);
    g.fillCircle(14, H - 4, 3);
    g.fillCircle(48, 4, 3);
    g.fillCircle(48, H - 4, 3);
    // Roll bar — chrome
    g.fillStyle(0xAAAAAA);
    g.fillRect(16, 6, 30, 3);
    // Open top visible — darker interior
    g.fillStyle(0x1B5E20, 0.4);
    g.fillRect(18, 13, 26, H - 26);
    // Windshield (short)
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(48, 12, 8, 18);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillRect(48, 12, 8, 2);
    // Spare tire on back (circle)
    g.fillStyle(0x222222);
    g.fillCircle(4, H / 2, 7);
    g.fillStyle(0x555555);
    g.fillCircle(4, H / 2, 3);
    // Siren on roll bar
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillCircle(28, 5, 3);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
    g.fillCircle(36, 5, 3);
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(27, 4, 1.5);
    g.fillCircle(35, 4, 1.5);
    // Headlights
    g.fillStyle(0xFFEB3B);
    g.fillRect(W - 4, 14, 4, 5);
    g.fillRect(W - 4, 23, 4, 5);
    // Taillights
    g.fillStyle(0xF44336);
    g.fillRect(0, 14, 3, 5);
    g.fillRect(0, 23, 3, 5);
  }

  _drawMotorcycleTexture(g, W, H) {
    // BLACK & WHITE highway patrol bike — narrow, rounded, exposed wheels
    const cx = W / 2;
    const cy = H / 2;
    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(cx, cy + 2, W - 8, H - 10);
    // Big exposed rear wheel (circle)
    g.fillStyle(0x111111);
    g.fillCircle(10, cy, 10);
    g.fillStyle(0x555555);
    g.fillCircle(10, cy, 5);
    g.fillStyle(0x333333);
    g.fillCircle(10, cy, 2);
    // Big exposed front wheel (circle)
    g.fillStyle(0x111111);
    g.fillCircle(W - 10, cy, 10);
    g.fillStyle(0x555555);
    g.fillCircle(W - 10, cy, 5);
    g.fillStyle(0x333333);
    g.fillCircle(W - 10, cy, 2);
    // Narrow body — black, connecting wheels
    g.fillStyle(0x222222);
    g.fillRect(14, cy - 5, W - 28, 10);
    // White fairing/body panels (rounded look using overlapping shapes)
    g.fillStyle(0xF5F5F5);
    g.fillEllipse(cx, cy, 22, 14);
    // Black seat
    g.fillStyle(0x111111);
    g.fillEllipse(cx - 4, cy, 12, 8);
    // Blue police stripe on fairing
    g.fillStyle(0x1565C0);
    g.fillRect(cx - 8, cy - 2, 16, 4);
    // Windscreen at front — angled
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW, 0.8);
    g.fillRect(W - 18, cy - 7, 6, 14);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillRect(W - 18, cy - 7, 6, 2);
    // Handlebars
    g.fillStyle(0x888888);
    g.fillRect(W - 14, cy - 10, 4, 4);
    g.fillRect(W - 14, cy + 6, 4, 4);
    // Single red siren light on top
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillCircle(cx + 2, cy - 8, 4);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(cx + 1, cy - 9, 2);
    // Headlight (bright circle)
    g.fillStyle(0xFFEB3B);
    g.fillCircle(W - 4, cy, 4);
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(W - 5, cy - 1, 2);
    // Taillight
    g.fillStyle(0xF44336);
    g.fillCircle(4, cy, 3);
    // Exhaust pipes
    g.fillStyle(0x666666);
    g.fillRect(8, cy + 8, 12, 3);
    g.fillRect(8, cy - 11, 12, 3);
  }

  _drawMonsterTruckTexture(g, W, H) {
    // MASSIVE black truck with orange flames, HUGE round wheels, raised high
    const cx = W / 2;
    const cy = H / 2;
    // --- HUGE WHEELS (the star of the show) ---
    // Rear wheels
    g.fillStyle(0x0A0A0A);
    g.fillCircle(16, 10, 14);
    g.fillCircle(16, H - 10, 14);
    // Rear tire treads
    g.fillStyle(0x333333);
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      g.fillRect(16 + Math.cos(ang) * 10 - 2, 10 + Math.sin(ang) * 10 - 1, 4, 2);
      g.fillRect(16 + Math.cos(ang) * 10 - 2, H - 10 + Math.sin(ang) * 10 - 1, 4, 2);
    }
    // Rear hubs — chrome
    g.fillStyle(0xCCCCCC);
    g.fillCircle(16, 10, 5);
    g.fillCircle(16, H - 10, 5);
    g.fillStyle(0x888888);
    g.fillCircle(16, 10, 2);
    g.fillCircle(16, H - 10, 2);
    // Front wheels
    g.fillStyle(0x0A0A0A);
    g.fillCircle(W - 18, 10, 14);
    g.fillCircle(W - 18, H - 10, 14);
    g.fillStyle(0x333333);
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      g.fillRect(W - 18 + Math.cos(ang) * 10 - 2, 10 + Math.sin(ang) * 10 - 1, 4, 2);
      g.fillRect(W - 18 + Math.cos(ang) * 10 - 2, H - 10 + Math.sin(ang) * 10 - 1, 4, 2);
    }
    g.fillStyle(0xCCCCCC);
    g.fillCircle(W - 18, 10, 5);
    g.fillCircle(W - 18, H - 10, 5);
    g.fillStyle(0x888888);
    g.fillCircle(W - 18, 10, 2);
    g.fillCircle(W - 18, H - 10, 2);
    // --- RAISED BODY (sits above wheels) ---
    // Suspension visible — axle bars
    g.fillStyle(0x555555);
    g.fillRect(12, cy - 2, W - 24, 4);
    // Body — black, raised above wheels
    g.fillStyle(0x1A1A1A);
    g.fillRect(20, cy - 14, W - 40, 28);
    // 3D edges on body
    g.fillStyle(0x000000, 0.3);
    g.fillRect(20, cy + 12, W - 40, 2);
    g.fillRect(W - 22, cy - 14, 2, 28);
    g.fillStyle(0xFFFFFF, 0.1);
    g.fillRect(20, cy - 14, W - 40, 2);
    g.fillRect(20, cy - 14, 2, 28);
    // FLAME DECALS — orange/red triangles on sides
    g.fillStyle(0xFF6D00);
    g.fillTriangle(24, cy - 6, 24, cy + 6, 44, cy);
    g.fillTriangle(24, cy - 6, 24, cy + 6, 44, cy);
    g.fillStyle(0xF44336);
    g.fillTriangle(24, cy - 4, 24, cy + 4, 38, cy);
    g.fillStyle(0xFFD600);
    g.fillTriangle(24, cy - 2, 24, cy + 2, 32, cy);
    // Mirror flames on other side
    g.fillStyle(0xFF6D00);
    g.fillTriangle(24, cy - 6, 24, cy + 6, 44, cy);
    // Yellow "MJ" badge
    g.fillStyle(0xFFD600);
    g.fillRect(cx - 6, cy - 8, 16, 10);
    g.fillStyle(0x1A1A1A);
    g.fillRect(cx - 4, cy - 6, 12, 6);
    // Windshield — aggressive angle
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(W - 28, cy - 10, 8, 20);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillRect(W - 28, cy - 10, 8, 2);
    // Roof — flat top
    g.fillStyle(0x111111);
    g.fillRect(30, cy - 16, W - 50, 4);
    // Wide siren bar on roof
    g.fillStyle(0x333333);
    g.fillRect(35, cy - 18, 26, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillCircle(41, cy - 17, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
    g.fillCircle(55, cy - 17, 4);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(40, cy - 18, 2);
    g.fillCircle(54, cy - 18, 2);
    // Headlights — big and bright
    g.fillStyle(0xFFEB3B);
    g.fillCircle(W - 22, cy - 6, 4);
    g.fillCircle(W - 22, cy + 6, 4);
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(W - 23, cy - 7, 2);
    g.fillCircle(W - 23, cy + 5, 2);
    // Taillights — red glow
    g.fillStyle(0xF44336);
    g.fillCircle(22, cy - 6, 3);
    g.fillCircle(22, cy + 6, 3);
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

    for (let i = 0; i < this.roundConfig.badGuyCount; i++) {
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

    const vx = Phaser.Math.Between(-1, 1) * this.roundConfig.badGuySpeed;
    const vy = Phaser.Math.Between(-1, 1) * this.roundConfig.badGuySpeed;
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
    if (this.jailedCount >= this.roundConfig.badGuyCount) {
      this.roundComplete = true;
      SoundManager.stopSiren();
      // Clean up power-ups and obstacle effects
      this.isBoosted = false;
      this.isSpinning = false;
      this.isSlowed = false;
      if (this.boostIndicator) { this.boostIndicator.destroy(); this.boostIndicator = null; }
      if (this.flatIndicator) { this.flatIndicator.destroy(); this.flatIndicator = null; }
      this.powerUps.clear(true, true);
      this.time.delayedCall(600, () => {
        if (this.currentRound >= 5) {
          this.scene.start('MegaCelebrationScene');
        } else {
          this.scene.start('CelebrationScene', { round: this.currentRound });
        }
      });
    }
  }

  // --- POWER-UPS ---

  spawnPowerUp() {
    if (this.roundComplete) return;
    if (!this.textures.exists('powerup')) {
      const g = this.add.graphics();
      // Fuel can body — orange circle
      g.fillStyle(0xFF6D00);
      g.fillCircle(14, 14, 12);
      // Inner glow
      g.fillStyle(0xFFAB00, 0.6);
      g.fillCircle(14, 14, 8);
      // Flame icon on top — small red triangle
      g.fillStyle(0xF44336);
      g.fillTriangle(14, 2, 8, 12, 20, 12);
      // Highlight
      g.fillStyle(0xFFFFFF, 0.4);
      g.fillCircle(11, 11, 4);
      g.generateTexture('powerup', 28, 28);
      g.destroy();
    }
    // Spawn position: grass for rounds 2-3, allow roads for 4+
    let px, py;
    if (this.currentRound >= CONFIG.POWERUP_ON_ROADS_FROM_ROUND) {
      px = Phaser.Math.Between(60, CONFIG.WIDTH - 60);
      py = Phaser.Math.Between(80, CONFIG.HEIGHT - 80);
    } else {
      // Stay on grass (avoid roads and jail)
      do {
        px = Phaser.Math.Between(60, CONFIG.WIDTH - 60);
        py = Phaser.Math.Between(80, CONFIG.HEIGHT - 80);
      } while (
        Math.abs(py - CONFIG.HEIGHT / 2) < 40 ||
        Math.abs(px - CONFIG.WIDTH / 2) < 40 ||
        Phaser.Math.Distance.Between(px, py, CONFIG.JAIL_X, CONFIG.JAIL_Y) < 100
      );
    }
    const pu = this.physics.add.sprite(px, py, 'powerup');
    pu.body.setSize(28, 28);
    this.powerUps.add(pu);
    // Pulsing glow
    this.tweens.add({
      targets: pu,
      scale: 1.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collectPowerUp(car, powerUp) {
    powerUp.destroy();
    this.isBoosted = true;
    SoundManager.playWhoosh();
    // Boost HUD indicator
    this.boostIndicator = this.add.text(CONFIG.WIDTH - 110, 70, 'BOOST!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px', fontStyle: 'bold',
      color: '#FF6D00', stroke: '#000000', strokeThickness: 3,
    }).setDepth(102);
    this.tweens.add({
      targets: this.boostIndicator,
      alpha: 0.4,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
    // End boost after duration
    this.time.delayedCall(CONFIG.POWERUP_BOOST_DURATION, () => {
      this.isBoosted = false;
      if (this.boostIndicator) { this.boostIndicator.destroy(); this.boostIndicator = null; }
    });
    // Respawn after delay
    this.time.delayedCall(CONFIG.POWERUP_RESPAWN_DELAY, () => this.spawnPowerUp());
  }

  // --- OBSTACLES ---

  spawnObstacles() {
    const types = this.roundConfig.obstacles;
    const roadCenterX = CONFIG.WIDTH / 2;
    const roadCenterY = CONFIG.HEIGHT / 2;

    types.forEach(type => {
      const count = Phaser.Math.Between(2, 3);
      for (let i = 0; i < count; i++) {
        let ox, oy, attempts = 0;
        do {
          // Place on roads
          if (Math.random() > 0.5) {
            // Horizontal road
            ox = Phaser.Math.Between(80, CONFIG.WIDTH - 80);
            oy = roadCenterY + Phaser.Math.Between(-25, 25);
          } else {
            // Vertical road
            ox = roadCenterX + Phaser.Math.Between(-25, 25);
            oy = Phaser.Math.Between(80, CONFIG.HEIGHT - 80);
          }
          attempts++;
        } while (
          attempts < 20 && (
            (Math.abs(ox - roadCenterX) < 50 && Math.abs(oy - roadCenterY) < 50) ||
            Phaser.Math.Distance.Between(ox, oy, CONFIG.JAIL_X, CONFIG.JAIL_Y) < 80 ||
            Phaser.Math.Distance.Between(ox, oy, 150, CONFIG.HEIGHT / 2) < 120
          )
        );

        this._createObstacle(type, ox, oy);
      }
    });
  }

  _createObstacle(type, x, y) {
    if (type === 'oilslick' && !this.textures.exists('oilslick')) {
      const g = this.add.graphics();
      g.fillStyle(0x1A1A1A, 0.7);
      g.fillCircle(20, 20, 18);
      g.fillCircle(16, 22, 14);
      g.fillCircle(24, 18, 12);
      g.fillCircle(20, 16, 10);
      // Sheen
      g.fillStyle(0x444444, 0.3);
      g.fillCircle(16, 16, 6);
      g.generateTexture('oilslick', 40, 40);
      g.destroy();
    }
    if (type === 'pothole' && !this.textures.exists('pothole')) {
      const g = this.add.graphics();
      // Brown cracked circle
      g.fillStyle(0x4E342E);
      g.fillCircle(16, 16, 15);
      // Lighter crack lines
      g.lineStyle(2, 0x795548);
      g.lineBetween(8, 12, 24, 20);
      g.lineBetween(12, 8, 20, 24);
      // Debris
      g.fillStyle(0x6D4C41);
      g.fillRect(4, 10, 4, 3);
      g.fillRect(26, 18, 3, 4);
      g.fillRect(10, 26, 4, 3);
      g.generateTexture('pothole', 32, 32);
      g.destroy();
    }

    const obs = this.physics.add.sprite(x, y, type);
    obs.obstacleType = type;
    obs.body.setImmovable(true);
    this.obstacles.add(obs);
  }

  hitObstacle(car, obstacle) {
    const type = obstacle.obstacleType;

    // Monster Jam crushes obstacles
    if (this.vehicleType === 'monstertruck') {
      obstacle.destroy();
      SoundManager.playCrunch();
      this.cameras.main.shake(100, 0.005);
      return;
    }

    if (this.isSpinning || this.isSlowed || this.obstacleImmune) return;

    if (type === 'oilslick') {
      this.isSpinning = true;
      this.obstacleImmune = true;
      this.spinVx = this.car.body.velocity.x;
      this.spinVy = this.car.body.velocity.y;
      this.tweens.add({
        targets: this.car,
        angle: '+=720',
        duration: CONFIG.OIL_SLICK_SPIN_DURATION,
      });
      this.time.delayedCall(CONFIG.OIL_SLICK_COAST_DURATION, () => {
        this.isSpinning = false;
      });
      // Immunity window — prevents re-trigger while still overlapping
      this.time.delayedCall(CONFIG.OIL_SLICK_COAST_DURATION + 500, () => {
        this.obstacleImmune = false;
      });
    } else if (type === 'pothole') {
      this.isSlowed = true;
      this.obstacleImmune = true;
      SoundManager.playDeflate();
      this.tweens.add({
        targets: this.car,
        angle: { from: -3, to: 3 },
        duration: 200,
        yoyo: true,
        repeat: 9,
      });
      // Flat tire indicator
      this.flatIndicator = this.add.text(CONFIG.WIDTH - 110, 70, 'FLAT!', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px', fontStyle: 'bold',
        color: '#F44336', stroke: '#000000', strokeThickness: 3,
      }).setDepth(102);
      this.time.delayedCall(CONFIG.POTHOLE_SLOW_DURATION, () => {
        this.isSlowed = false;
        if (this.flatIndicator) { this.flatIndicator.destroy(); this.flatIndicator = null; }
      });
      this.time.delayedCall(CONFIG.POTHOLE_SLOW_DURATION + 500, () => {
        this.obstacleImmune = false;
      });
    }
  }

  // --- HUD ---

  drawHUD() {
    const hudY = 35;
    const iconSpacing = 55;
    const startX = CONFIG.WIDTH / 2 - ((this.roundConfig.badGuyCount - 1) * iconSpacing) / 2;

    // HUD background — larger and more visible
    const hudBg = this.add.rectangle(
      CONFIG.WIDTH / 2, hudY,
      this.roundConfig.badGuyCount * iconSpacing + 50, 60,
      0x000000, 0.5
    );
    hudBg.setStrokeStyle(2, 0xFFFFFF, 0.4);
    hudBg.setDepth(100);

    // Round info — top left
    this.add.text(15, 15, 'ROUND ' + this.currentRound, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px', fontStyle: 'bold',
      color: '#FFFFFF', stroke: '#000000', strokeThickness: 3,
    }).setDepth(101);

    // Vehicle name — top right (shifted left for pause button)
    this.add.text(CONFIG.WIDTH - 80, 15, this.roundConfig.vehicleName, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px', fontStyle: 'bold',
      color: '#FFD600', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(101);

    for (let i = 0; i < this.roundConfig.badGuyCount; i++) {
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
