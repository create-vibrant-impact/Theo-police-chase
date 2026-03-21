class VehicleRevealScene extends Phaser.Scene {
  constructor() {
    super('VehicleRevealScene');
  }

  create() {
    const completedRound = (this.scene.settings.data && this.scene.settings.data.round) || 1;
    const nextRound = completedRound + 1;
    const nextConfig = CONFIG.ROUNDS[nextRound - 1];

    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(0x1A237E);

    // "ROUND N COMPLETE!" slams in
    const completeText = this.add.text(cx, cy - 140, 'ROUND ' + completedRound + ' COMPLETE!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: completeText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // "NEW VEHICLE UNLOCKED!" fades in after 500ms
    const unlockedText = this.add.text(cx, cy - 80, 'NEW VEHICLE UNLOCKED!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFD600',
      stroke: '#E65100',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: unlockedText,
      alpha: 1,
      duration: 400,
      delay: 500,
    });

    // Generate the vehicle texture and drive it in from the left
    this.time.delayedCall(800, () => {
      // Ensure texture exists using same approach as GameScene
      this._ensureVehicleTexture(nextConfig.vehicle, nextConfig.vehicleW, nextConfig.vehicleH);

      const vehicle = this.add.sprite(-100, cy + 20, nextConfig.vehicle);
      vehicle.setScale(2.5);

      this.tweens.add({
        targets: vehicle,
        x: cx,
        duration: 1000,
        ease: 'Power2.easeOut',
      });

      SoundManager.playEngineRev();

      // Vehicle name text below
      const isMonsterJam = nextConfig.vehicleName === 'MONSTER JAM';
      const nameText = this.add.text(cx, cy + 100, nextConfig.vehicleName, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: isMonsterJam ? '60px' : '36px',
        fontStyle: 'bold',
        color: isMonsterJam ? '#FFD600' : '#FFFFFF',
        stroke: isMonsterJam ? '#E65100' : '#000000',
        strokeThickness: isMonsterJam ? 6 : 4,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: nameText,
        alpha: 1,
        duration: 400,
        delay: 600,
      });

      // Monster Jam special fire glow
      if (isMonsterJam) {
        const glow = this.add.circle(cx, cy + 100, 80, 0xFF6D00, 0.15);
        this.tweens.add({
          targets: glow,
          scale: 1.3,
          alpha: 0.05,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      }

      // "GO!" button after vehicle arrives
      this.time.delayedCall(1200, () => {
        const btnY = cy + 200;
        const btnW = 180;
        const btnH = 70;
        const btn = this.add.graphics();
        btn.fillStyle(0x4CAF50, 1);
        btn.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);
        btn.lineStyle(3, 0x388E3C);
        btn.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);

        const goText = this.add.text(cx, btnY, 'GO!', {
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '42px',
          fontStyle: 'bold',
          color: '#FFFFFF',
          stroke: '#2E7D32',
          strokeThickness: 4,
        }).setOrigin(0.5);

        // Button pulse
        this.tweens.add({
          targets: [btn, goText],
          scaleX: 1.05, scaleY: 1.05,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        let started = false;
        const go = () => {
          if (started) return;
          started = true;
          SoundManager.playTap();
          this.tweens.add({
            targets: [btn, goText],
            scaleX: 0.9, scaleY: 0.9,
            duration: 100,
            yoyo: true,
            onComplete: () => {
              this.scene.start('GameScene', { round: nextRound });
            },
          });
        };

        goText.setInteractive({ useHandCursor: true })
          .setPadding(40, 20)
          .on('pointerdown', go);

        this.input.on('pointerdown', (pointer) => {
          if (Math.abs(pointer.x - cx) < btnW / 2 + 20 && Math.abs(pointer.y - btnY) < btnH / 2 + 20) {
            go();
          }
        });
      });
    });
  }

  _ensureVehicleTexture(type, W, H) {
    if (this.textures.exists(type)) return;
    const g = this.add.graphics();

    if (type === 'suv') {
      this._drawSuv(g, W, H);
    } else if (type === 'jeep') {
      this._drawJeep(g, W, H);
    } else if (type === 'motorcycle') {
      this._drawMotorcycle(g, W, H);
    } else if (type === 'monstertruck') {
      this._drawMonsterTruck(g, W, H);
    } else {
      // car (fallback)
      g.fillStyle(CONFIG.COLORS.CAR_BODY);
      g.fillRect(2, 6, W - 4, H - 12);
    }

    g.generateTexture(type, W, H);
    g.destroy();
  }

  _drawSuv(g, W, H) {
    const c = 0x0D47A1;
    g.fillStyle(0x000000, 0.15); g.fillRect(4, 10, W - 4, H - 10);
    g.fillStyle(c); g.fillRect(2, 8, W - 4, H - 16);
    g.fillStyle(0x000000, 0.2); g.fillRect(2, H - 10, W - 4, 2); g.fillRect(W - 4, 8, 2, H - 16);
    g.fillStyle(0xFFFFFF, 0.15); g.fillRect(2, 8, W - 4, 2); g.fillRect(2, 8, 2, H - 16);
    g.fillStyle(0x888888); g.fillRect(14, 4, 42, 5);
    g.fillStyle(0xAAAAAA); g.fillCircle(22, 3, 3); g.fillCircle(35, 3, 3); g.fillCircle(48, 3, 3);
    g.fillStyle(0xFFFFFF); g.fillRect(14, 8, 40, 3); g.fillRect(14, H - 11, 40, 3);
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW); g.fillRect(50, 12, 16, 22);
    g.fillStyle(0xFFFFFF, 0.3); g.fillRect(50, 12, 16, 2);
    g.fillStyle(0x222222);
    g.fillRect(8, 0, 16, 9); g.fillRect(8, H - 9, 16, 9);
    g.fillRect(44, 0, 16, 9); g.fillRect(44, H - 9, 16, 9);
    g.fillStyle(0x666666);
    g.fillCircle(16, 4, 4); g.fillCircle(16, H - 5, 4);
    g.fillCircle(52, 4, 4); g.fillCircle(52, H - 5, 4);
    g.fillStyle(0x333333); g.fillRect(28, 4, 16, 5);
    g.fillStyle(CONFIG.COLORS.SIREN_RED); g.fillCircle(32, 6, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE); g.fillCircle(40, 6, 4);
    g.fillStyle(0xFFEB3B); g.fillRect(W - 4, 14, 4, 6); g.fillRect(W - 4, 26, 4, 6);
    g.fillStyle(0xF44336); g.fillRect(0, 14, 4, 6); g.fillRect(0, 26, 4, 6);
  }

  _drawJeep(g, W, H) {
    const c = 0x33691E;
    g.fillStyle(0x000000, 0.15); g.fillRect(4, 8, W - 4, H - 8);
    g.fillStyle(c); g.fillRect(2, 7, W - 4, H - 14);
    g.fillStyle(0x000000, 0.2); g.fillRect(2, H - 9, W - 4, 2); g.fillRect(W - 4, 7, 2, H - 14);
    g.fillStyle(0xFFFFFF, 0.15); g.fillRect(2, 7, W - 4, 2); g.fillRect(2, 7, 2, H - 14);
    g.fillStyle(0x1565C0); g.fillRect(14, 7, 36, 3); g.fillRect(14, H - 10, 36, 3);
    g.fillStyle(0x888888); g.fillRect(12, 3, 40, 4);
    g.fillStyle(0xAAAAAA); g.fillCircle(24, 2, 3); g.fillCircle(40, 2, 3);
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW); g.fillRect(46, 10, 12, 22);
    g.fillStyle(0x222222);
    g.fillRect(6, 0, 16, 8); g.fillRect(6, H - 8, 16, 8);
    g.fillRect(42, 0, 16, 8); g.fillRect(42, H - 8, 16, 8);
    g.fillStyle(0x666666);
    g.fillCircle(14, 4, 4); g.fillCircle(14, H - 4, 4);
    g.fillCircle(50, 4, 4); g.fillCircle(50, H - 4, 4);
    g.fillStyle(0x333333); g.fillRect(28, 0, 14, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_RED); g.fillCircle(31, 2, 3);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE); g.fillCircle(39, 2, 3);
    g.fillStyle(0xFFEB3B); g.fillRect(W - 4, 12, 4, 5); g.fillRect(W - 4, 25, 4, 5);
    g.fillStyle(0xF44336); g.fillRect(0, 12, 4, 5); g.fillRect(0, 25, 4, 5);
  }

  _drawMotorcycle(g, W, H) {
    const c = 0x1565C0;
    g.fillStyle(0x000000, 0.15); g.fillRect(4, 6, W - 8, H - 6);
    g.fillStyle(c); g.fillRect(12, 8, 30, H - 16);
    g.fillStyle(0x000000, 0.2); g.fillRect(12, H - 10, 30, 2); g.fillRect(40, 8, 2, H - 16);
    g.fillStyle(0xFFFFFF, 0.15); g.fillRect(12, 8, 30, 2); g.fillRect(12, 8, 2, H - 16);
    g.fillStyle(c); g.fillRect(18, H - 12, 20, 10);
    g.fillStyle(0x222222);
    g.fillRect(2, 10, 12, 12); g.fillRect(40, 10, 12, 12);
    g.fillStyle(0x666666); g.fillCircle(8, 16, 4); g.fillCircle(46, 16, 4);
    g.fillStyle(0x222222); g.fillRect(24, H - 6, 10, 6);
    g.fillStyle(0x888888); g.fillRect(44, 6, 8, 3); g.fillRect(44, H - 9, 8, 3);
    g.fillStyle(CONFIG.COLORS.SIREN_RED); g.fillCircle(27, 7, 4);
    g.fillStyle(0xFFFFFF, 0.4); g.fillCircle(26, 6, 2);
    g.fillStyle(0xFFEB3B); g.fillRect(W - 4, 14, 4, 4);
    g.fillStyle(0xF44336); g.fillRect(0, 14, 4, 4);
  }

  _drawMonsterTruck(g, W, H) {
    const c = 0x212121; const a = 0xFFD600;
    g.fillStyle(0x000000, 0.15); g.fillRect(6, 12, W - 6, H - 12);
    g.fillStyle(c); g.fillRect(4, 10, W - 8, H - 22);
    g.fillStyle(0x000000, 0.25); g.fillRect(4, H - 14, W - 8, 2); g.fillRect(W - 6, 10, 2, H - 22);
    g.fillStyle(0xFFFFFF, 0.12); g.fillRect(4, 10, W - 8, 2); g.fillRect(4, 10, 2, H - 22);
    g.fillStyle(a); g.fillRect(14, 10, 50, 4); g.fillRect(14, H - 16, 50, 4);
    g.fillStyle(a); g.fillRect(28, 18, 14, 10);
    g.fillStyle(c); g.fillRect(30, 20, 10, 6);
    g.fillStyle(c);
    g.fillCircle(20, 8, 4); g.fillCircle(40, 8, 4); g.fillCircle(60, 8, 4);
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW); g.fillRect(58, 14, 16, 20);
    g.fillStyle(0xFFFFFF, 0.3); g.fillRect(58, 14, 16, 2); g.fillRect(58, 14, 2, 20);
    g.fillStyle(0x111111);
    g.fillRect(6, 0, 20, 12); g.fillRect(6, H - 12, 20, 12);
    g.fillRect(54, 0, 20, 12); g.fillRect(54, H - 12, 20, 12);
    g.fillStyle(0x333333);
    for (let t = 0; t < 4; t++) {
      g.fillRect(8 + t * 5, 1, 2, 10); g.fillRect(8 + t * 5, H - 11, 2, 10);
      g.fillRect(56 + t * 5, 1, 2, 10); g.fillRect(56 + t * 5, H - 11, 2, 10);
    }
    g.fillStyle(0x888888);
    g.fillCircle(16, 6, 5); g.fillCircle(16, H - 6, 5);
    g.fillCircle(64, 6, 5); g.fillCircle(64, H - 6, 5);
    g.fillStyle(0x333333); g.fillRect(22, 6, 24, 5);
    g.fillStyle(CONFIG.COLORS.SIREN_RED); g.fillCircle(28, 8, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE); g.fillCircle(40, 8, 4);
    g.fillStyle(0xFFEB3B); g.fillRect(W - 6, 16, 6, 7); g.fillRect(W - 6, 27, 6, 7);
    g.fillStyle(0xF44336); g.fillRect(0, 16, 6, 7); g.fillRect(0, 27, 6, 7);
  }
}
