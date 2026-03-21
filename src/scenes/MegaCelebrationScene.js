class MegaCelebrationScene extends Phaser.Scene {
  constructor() {
    super('MegaCelebrationScene');
  }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(0x1A237E);

    // Massive confetti (100+ pieces)
    const confettiColors = [0xFF5722, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0xE91E63, 0xFF9800, 0x9C27B0, 0xFFD600, 0x00BCD4];
    for (let i = 0; i < 120; i++) {
      const px = Phaser.Math.Between(0, CONFIG.WIDTH);
      const py = Phaser.Math.Between(-300, -20);
      const color = Phaser.Utils.Array.GetRandom(confettiColors);
      const size = Phaser.Math.Between(8, 16);
      const piece = this.add.rectangle(px, py, size, size * 0.6, color);
      piece.setAngle(Phaser.Math.Between(0, 360));

      this.tweens.add({
        targets: piece,
        y: CONFIG.HEIGHT + 50,
        angle: Phaser.Math.Between(360, 1080),
        x: piece.x + Phaser.Math.Between(-120, 120),
        duration: Phaser.Math.Between(1500, 3500),
        delay: Phaser.Math.Between(0, 2000),
        repeat: -1,
        onRepeat: () => {
          piece.y = Phaser.Math.Between(-150, -20);
          piece.x = Phaser.Math.Between(0, CONFIG.WIDTH);
        },
      });
    }

    // Stars bursting outward (more of them)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const star = this.add.star(cx, cy - 40, 5, 10, 22, 0xFFD600);
      star.setAlpha(0);
      this.tweens.add({
        targets: star,
        x: cx + Math.cos(angle) * 250,
        y: (cy - 40) + Math.sin(angle) * 200,
        alpha: { from: 1, to: 0 },
        scale: { from: 0.5, to: 2.5 },
        duration: 1500,
        delay: 200,
        ease: 'Power2',
      });
    }

    // "SUPER PATROL!" text — massive, gold
    const superText = this.add.text(cx, cy - 160, 'SUPER PATROL!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#FFD600',
      stroke: '#E65100',
      strokeThickness: 10,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: superText,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Pulsing glow
    this.tweens.add({
      targets: superText,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 700,
    });

    // Fanfare + extra triumphant notes
    SoundManager.playFanfare();
    this.time.delayedCall(1200, () => {
      if (SoundManager.ctx) {
        const now = SoundManager.ctx.currentTime;
        // Extra triumphant arpeggio
        [1047, 1319, 1568, 2093].forEach((freq, i) => {
          const osc = SoundManager.ctx.createOscillator();
          const gain = SoundManager.ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.03);
          gain.gain.setValueAtTime(0.12, now + i * 0.12 + 0.3);
          gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.6);
          osc.connect(gain);
          gain.connect(SoundManager.ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.6);
        });
      }
    });

    // Vehicle parade — all 5 vehicles drive across left-to-right
    const paradeY = cy + 20;
    const vehicles = CONFIG.ROUNDS.map(r => r.vehicle);

    vehicles.forEach((type, i) => {
      const rc = CONFIG.ROUNDS[i];
      this._ensureVehicleTexture(type, rc.vehicleW, rc.vehicleH);

      const vSprite = this.add.sprite(-80 - i * 100, paradeY, type);
      vSprite.setScale(2);

      this.tweens.add({
        targets: vSprite,
        x: 120 + i * 200,
        duration: 1500,
        delay: 1500 + i * 300,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Monster Jam victory spin after parade
          if (type === 'monstertruck') {
            this.time.delayedCall(400, () => {
              // Move to center
              this.tweens.add({
                targets: vSprite,
                x: cx,
                duration: 600,
                ease: 'Power2.easeOut',
                onComplete: () => {
                  // 360 victory spin
                  this.tweens.add({
                    targets: vSprite,
                    angle: 360,
                    duration: 800,
                    ease: 'Power2.easeInOut',
                  });
                  SoundManager.playEngineRev();
                },
              });
            });
          }
        },
      });
    });

    // Police badge with "5" — after parade
    this.time.delayedCall(4500, () => {
      const badgeG = this.add.graphics();
      badgeG.fillStyle(0x1565C0, 1);
      badgeG.fillCircle(cx, cy + 140, 40);
      const starShape = this.add.star(cx, cy + 140, 5, 15, 35, 0xFFD600);
      const fiveText = this.add.text(cx, cy + 140, '5', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#FFFFFF',
        stroke: '#0D47A1',
        strokeThickness: 3,
      }).setOrigin(0.5);

      // Scale in
      badgeG.setScale(0); starShape.setScale(0); fiveText.setScale(0);
      this.tweens.add({
        targets: [badgeG, starShape, fiveText],
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
      });
    });

    // "PLAY AGAIN!" button — appears after everything
    this.time.delayedCall(5500, () => {
      const btnY = cy + 240;
      const btnW = 280;
      const btnH = 80;
      const btn = this.add.graphics();
      btn.fillStyle(0x4CAF50, 1);
      btn.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
      btn.lineStyle(4, 0x388E3C);
      btn.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);

      const btnText = this.add.text(cx, btnY, 'PLAY AGAIN!', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#FFFFFF',
        stroke: '#2E7D32',
        strokeThickness: 4,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: [btn, btnText],
        scaleX: 1.05, scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      let started = false;
      const restart = () => {
        if (started) return;
        started = true;
        SoundManager.playTap();
        this.tweens.add({
          targets: [btn, btnText],
          scaleX: 0.9, scaleY: 0.9,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.scene.start('TitleScene');
          },
        });
      };

      btnText.setInteractive({ useHandCursor: true })
        .setPadding(40, 20)
        .on('pointerdown', restart);

      this.input.on('pointerdown', (pointer) => {
        if (Math.abs(pointer.x - cx) < btnW / 2 + 20 && Math.abs(pointer.y - btnY) < btnH / 2 + 20) {
          restart();
        }
      });
    });

    // Camera shake on entry
    this.cameras.main.shake(400, 0.012);
  }

  _ensureVehicleTexture(type, W, H) {
    if (this.textures.exists(type)) return;
    const g = this.add.graphics();

    if (type === 'car') {
      this._drawCar(g, W, H);
    } else if (type === 'suv') {
      this._drawSuv(g, W, H);
    } else if (type === 'jeep') {
      this._drawJeep(g, W, H);
    } else if (type === 'motorcycle') {
      this._drawMotorcycle(g, W, H);
    } else if (type === 'monstertruck') {
      this._drawMonsterTruck(g, W, H);
    }

    g.generateTexture(type, W, H);
    g.destroy();
  }

  _drawCar(g, W, H) {
    g.fillStyle(0x000000, 0.15); g.fillRect(4, 8, W - 4, H - 8);
    g.fillStyle(CONFIG.COLORS.CAR_BODY); g.fillRect(2, 6, W - 4, H - 12);
    g.fillStyle(0x000000, 0.2); g.fillRect(2, H - 8, W - 4, 2); g.fillRect(W - 4, 6, 2, H - 12);
    g.fillStyle(0xFFFFFF, 0.15); g.fillRect(2, 6, W - 4, 2); g.fillRect(2, 6, 2, H - 12);
    g.fillStyle(CONFIG.COLORS.CAR_BODY); g.fillCircle(22, 5, 4); g.fillCircle(42, 5, 4);
    g.fillStyle(0xFFFFFF); g.fillRect(14, 6, 32, 3); g.fillRect(14, H - 9, 32, 3);
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW); g.fillRect(46, 10, 14, 20);
    g.fillStyle(0x222222);
    g.fillRect(8, 0, 14, 7); g.fillRect(8, H - 7, 14, 7);
    g.fillRect(40, 0, 14, 7); g.fillRect(40, H - 7, 14, 7);
    g.fillStyle(0x666666);
    g.fillCircle(15, 3, 3); g.fillCircle(15, H - 4, 3);
    g.fillCircle(47, 3, 3); g.fillCircle(47, H - 4, 3);
    g.fillStyle(0x333333); g.fillRect(26, 2, 16, 5);
    g.fillStyle(CONFIG.COLORS.SIREN_RED); g.fillCircle(30, 4, 4);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE); g.fillCircle(38, 4, 4);
    g.fillStyle(0xFFEB3B); g.fillRect(W - 4, 12, 4, 5); g.fillRect(W - 4, 23, 4, 5);
    g.fillStyle(0xF44336); g.fillRect(0, 12, 4, 5); g.fillRect(0, 23, 4, 5);
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
