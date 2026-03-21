class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;

    // Sky background
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.SKY);

    // Green ground
    const ground = this.add.rectangle(cx, CONFIG.HEIGHT - 100, CONFIG.WIDTH, 200, CONFIG.COLORS.GRASS);

    // Draw some flowers on the ground
    for (let i = 0; i < 12; i++) {
      const fx = Phaser.Math.Between(50, CONFIG.WIDTH - 50);
      const fy = Phaser.Math.Between(CONFIG.HEIGHT - 180, CONFIG.HEIGHT - 30);
      const colors = [CONFIG.COLORS.FLOWER_RED, CONFIG.COLORS.FLOWER_YELLOW, CONFIG.COLORS.FLOWER_PURPLE];
      const color = Phaser.Utils.Array.GetRandom(colors);
      this.drawFlower(fx, fy, color);
    }

    // Draw trees
    this.drawTree(120, CONFIG.HEIGHT - 200);
    this.drawTree(CONFIG.WIDTH - 150, CONFIG.HEIGHT - 200);

    // Title badge background
    const badge = this.add.graphics();
    badge.fillStyle(0x1565C0, 0.95);
    badge.fillRoundedRect(cx - 280, 60, 560, 200, 20);
    badge.lineStyle(6, 0xFFD600);
    badge.strokeRoundedRect(cx - 280, 60, 560, 200, 20);

    // Star decorations on badge
    this.drawStar(cx - 240, 100, 20, 0xFFD600);
    this.drawStar(cx + 240, 100, 20, 0xFFD600);
    this.drawStar(cx - 240, 220, 20, 0xFFD600);
    this.drawStar(cx + 240, 220, 20, 0xFFD600);

    // Title text
    const titleStyle = {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#0D47A1',
      strokeThickness: 6,
      align: 'center',
    };
    const title = this.add.text(cx, 120, "THEO'S", titleStyle).setOrigin(0.5);
    const subtitle = this.add.text(cx, 190, 'POLICE PATROL', {
      ...titleStyle,
      fontSize: '44px',
    }).setOrigin(0.5);

    // Police car illustration on title
    this.drawPoliceCar(cx, 340, 2);

    // Siren flash on title car
    const sirenRed = this.add.circle(cx - 10, 314, 12, CONFIG.COLORS.SIREN_RED, 0.6);
    const sirenBlue = this.add.circle(cx + 10, 314, 12, CONFIG.COLORS.SIREN_BLUE, 0.6);
    sirenBlue.setAlpha(0);
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        sirenRed.setAlpha(sirenRed.alpha > 0 ? 0 : 0.6);
        sirenBlue.setAlpha(sirenBlue.alpha > 0 ? 0 : 0.6);
      },
    });

    // PLAY button
    const btnW = 220;
    const btnH = 80;
    const btnY = 490;
    const btn = this.add.graphics();
    btn.fillStyle(0x4CAF50, 1);
    btn.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);
    btn.lineStyle(4, 0x388E3C);
    btn.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 16);

    const playText = this.add.text(cx, btnY, 'PLAY!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#2E7D32',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Make button interactive — use the text element with padding for reliable hit detection
    let started = false;
    const startGame = () => {
      if (started) return;
      started = true;
      SoundManager.init(); // Unlock audio on first user gesture (required by iOS)
      SoundManager.playTap();
      this.tweens.add({
        targets: [btn, playText],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.scene.start('GameScene');
        },
      });
    };

    playText.setInteractive({ useHandCursor: true })
      .setPadding(40, 20)
      .on('pointerdown', startGame);

    // Also make the whole scene clickable as fallback for young kids
    this.input.on('pointerdown', (pointer) => {
      const dy = Math.abs(pointer.y - btnY);
      const dx = Math.abs(pointer.x - cx);
      if (dx < btnW / 2 + 20 && dy < btnH / 2 + 20) {
        startGame();
      }
    });

    // Gentle float animation on title
    this.tweens.add({
      targets: [title, subtitle],
      y: '+=6',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  drawPoliceCar(x, y, scale) {
    const g = this.add.graphics();
    const s = scale || 1;

    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRect(x - 28 * s, y - 8 * s, 60 * s, 28 * s);

    // Car body — Lego brick with 3D edges
    g.fillStyle(CONFIG.COLORS.CAR_BODY);
    g.fillRect(x - 30 * s, y - 10 * s, 60 * s, 24 * s);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(x - 30 * s, y + 12 * s, 60 * s, 2 * s);
    g.fillRect(x + 28 * s, y - 10 * s, 2 * s, 24 * s);
    g.fillStyle(0xFFFFFF, 0.15);
    g.fillRect(x - 30 * s, y - 10 * s, 60 * s, 2 * s);
    g.fillRect(x - 30 * s, y - 10 * s, 2 * s, 24 * s);

    // Studs on top
    g.fillStyle(CONFIG.COLORS.CAR_BODY);
    g.fillCircle(x - 12 * s, y - 12 * s, 5 * s);
    g.fillCircle(x + 12 * s, y - 12 * s, 5 * s);
    g.fillStyle(0xFFFFFF, 0.25);
    g.fillCircle(x - 13 * s, y - 13 * s, 2.5 * s);
    g.fillCircle(x + 11 * s, y - 13 * s, 2.5 * s);

    // White police stripe
    g.fillStyle(0xFFFFFF);
    g.fillRect(x - 26 * s, y - 10 * s, 52 * s, 3 * s);
    g.fillRect(x - 26 * s, y + 10 * s, 52 * s, 3 * s);

    // Windshield — transparent blue
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(x - 12 * s, y - 8 * s, 24 * s, 10 * s);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillRect(x - 12 * s, y - 8 * s, 24 * s, 2 * s);

    // Wheels — black Lego pieces
    g.fillStyle(0x222222);
    g.fillRect(x - 26 * s, y + 12 * s, 16 * s, 8 * s);
    g.fillRect(x + 10 * s, y + 12 * s, 16 * s, 8 * s);
    g.fillStyle(0x666666);
    g.fillCircle(x - 18 * s, y + 16 * s, 4 * s);
    g.fillCircle(x + 18 * s, y + 16 * s, 4 * s);

    // Siren — red and blue round studs
    g.fillStyle(0x333333);
    g.fillRect(x - 10 * s, y - 16 * s, 20 * s, 6 * s);
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillCircle(x - 5 * s, y - 13 * s, 5 * s);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
    g.fillCircle(x + 5 * s, y - 13 * s, 5 * s);
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(x - 6 * s, y - 14 * s, 2.5 * s);
    g.fillCircle(x + 4 * s, y - 14 * s, 2.5 * s);

    // Headlights
    g.fillStyle(0xFFEB3B);
    g.fillRect(x + 28 * s, y - 4 * s, 4 * s, 5 * s);
    g.fillRect(x + 28 * s, y + 3 * s, 4 * s, 5 * s);
  }

  drawFlower(x, y, color) {
    const g = this.add.graphics();
    // Stem — green brick
    g.fillStyle(0x388E3C);
    g.fillRect(x - 2, y - 8, 4, 12);
    // Flower head — round Lego piece
    g.fillStyle(color);
    g.fillCircle(x, y - 10, 6);
    // Stud center
    g.fillStyle(0xFFEB3B);
    g.fillCircle(x, y - 10, 3);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillCircle(x - 1, y - 11, 1.5);
  }

  drawTree(x, y) {
    const g = this.add.graphics();
    // Trunk — brown Lego brick with edges
    g.fillStyle(CONFIG.COLORS.TREE_TRUNK);
    g.fillRect(x - 8, y, 16, 40);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(x - 8, y + 38, 16, 2);
    g.fillRect(x + 6, y, 2, 40);
    g.fillStyle(0xFFFFFF, 0.15);
    g.fillRect(x - 8, y, 16, 2);
    // Stud on trunk
    g.fillStyle(CONFIG.COLORS.TREE_TRUNK);
    g.fillCircle(x, y - 2, 4);
    g.fillStyle(0xFFFFFF, 0.25);
    g.fillCircle(x - 1, y - 3, 2);
    // Canopy — stacked green Lego bricks
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillRect(x - 30, y - 18, 60, 22);
    g.fillStyle(0x000000, 0.15);
    g.fillRect(x - 30, y + 2, 60, 2);
    g.fillStyle(0xFFFFFF, 0.12);
    g.fillRect(x - 30, y - 18, 60, 2);
    // Studs on bottom canopy
    for (let i = -2; i <= 2; i++) {
      g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
      g.fillCircle(x + i * 12, y - 20, 4);
    }
    // Middle canopy
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES_LIGHT);
    g.fillRect(x - 22, y - 38, 44, 22);
    g.fillStyle(0x000000, 0.12);
    g.fillRect(x - 22, y - 18, 44, 2);
    for (let i = -1; i <= 1; i++) {
      g.fillStyle(CONFIG.COLORS.TREE_LEAVES_LIGHT);
      g.fillCircle(x + i * 12, y - 40, 4);
    }
    // Top canopy
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillRect(x - 14, y - 55, 28, 18);
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillCircle(x - 4, y - 57, 4);
    g.fillCircle(x + 4, y - 57, 4);
    g.fillStyle(0xFFFFFF, 0.2);
    g.fillCircle(x - 5, y - 58, 2);
    g.fillCircle(x + 3, y - 58, 2);
  }

  drawStar(x, y, size, color) {
    const g = this.add.graphics();
    g.fillStyle(color);
    // Simple 4-point star
    g.fillRect(x - size / 6, y - size / 2, size / 3, size);
    g.fillRect(x - size / 2, y - size / 6, size, size / 3);
  }
}
