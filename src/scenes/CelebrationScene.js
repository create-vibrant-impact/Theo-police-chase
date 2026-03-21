class CelebrationScene extends Phaser.Scene {
  constructor() {
    super('CelebrationScene');
  }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(CONFIG.COLORS.CELEBRATION_BG);

    // Confetti particles using graphics
    this.confettiGroup = this.add.group();
    const confettiColors = [0xFF5722, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0xE91E63, 0xFF9800, 0x9C27B0];
    for (let i = 0; i < 60; i++) {
      const px = Phaser.Math.Between(20, CONFIG.WIDTH - 20);
      const py = Phaser.Math.Between(-200, -20);
      const color = Phaser.Utils.Array.GetRandom(confettiColors);
      const size = Phaser.Math.Between(6, 14);
      const piece = this.add.rectangle(px, py, size, size * 0.6, color);
      piece.setAngle(Phaser.Math.Between(0, 360));
      this.confettiGroup.add(piece);

      // Fall and spin animation
      this.tweens.add({
        targets: piece,
        y: CONFIG.HEIGHT + 50,
        angle: Phaser.Math.Between(360, 720),
        x: piece.x + Phaser.Math.Between(-80, 80),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        repeat: -1,
        onRepeat: () => {
          piece.y = Phaser.Math.Between(-100, -20);
          piece.x = Phaser.Math.Between(20, CONFIG.WIDTH - 20);
        },
      });
    }

    // Stars bursting outward
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const star = this.add.star(cx, cy, 5, 10, 22, 0xFFD600);
      star.setAlpha(0);
      this.tweens.add({
        targets: star,
        x: cx + Math.cos(angle) * 200,
        y: cy + Math.sin(angle) * 150,
        alpha: { from: 1, to: 0 },
        scale: { from: 0.5, to: 2 },
        duration: 1200,
        delay: 200,
        ease: 'Power2',
      });
    }

    // "GOT 'EM!" text — big and punchy
    const gotEm = this.add.text(cx, cy - 100, "GOT 'EM!", {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '80px',
      fontStyle: 'bold',
      color: '#FFD600',
      stroke: '#E65100',
      strokeThickness: 8,
    }).setOrigin(0.5).setScale(0);

    // Slam-in animation
    this.tweens.add({
      targets: gotEm,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Pulsing glow
    this.tweens.add({
      targets: gotEm,
      scale: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600,
    });

    // Police badge / shield
    const badge = this.add.graphics();
    badge.fillStyle(0x1565C0, 1);
    badge.fillCircle(cx, cy + 30, 50);
    badge.fillStyle(0xFFD600, 1);
    // Star in badge
    const starShape = this.add.star(cx, cy + 30, 5, 18, 40, 0xFFD600);

    // "CATCH MORE!" button
    const btnY = cy + 160;
    const btnW = 280;
    const btnH = 80;
    const btn = this.add.graphics();
    btn.fillStyle(0x4CAF50, 1);
    btn.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
    btn.lineStyle(4, 0x388E3C);
    btn.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);

    const btnText = this.add.text(cx, btnY, 'CATCH MORE!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#2E7D32',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Button pulse
    this.tweens.add({
      targets: [btn, btnText],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1000,
    });

    // Button interaction — use text with padding for reliable click
    btnText.setInteractive({ useHandCursor: true })
      .setPadding(40, 20)
      .on('pointerdown', () => {
        this.tweens.add({
          targets: [btn, btnText],
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.scene.start('GameScene');
          },
        });
      });

    // Fallback — scene-level click near button area
    this.input.on('pointerdown', (pointer) => {
      const dy = Math.abs(pointer.y - btnY);
      const dx = Math.abs(pointer.x - cx);
      if (dx < btnW / 2 + 20 && dy < btnH / 2 + 20) {
        this.scene.start('GameScene');
      }
    });

    // Camera shake on entry
    this.cameras.main.shake(300, 0.01);
  }
}
