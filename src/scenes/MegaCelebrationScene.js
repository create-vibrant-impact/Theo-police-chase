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
        x: 100 + i * 190,
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

  _drawSuv(g, W, H) {
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

  _drawJeep(g, W, H) {
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

  _drawMotorcycle(g, W, H) {
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

  _drawMonsterTruck(g, W, H) {
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
}
