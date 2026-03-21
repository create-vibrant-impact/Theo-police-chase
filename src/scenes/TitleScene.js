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

    // Car body
    g.fillStyle(CONFIG.COLORS.CAR_BODY);
    g.fillRect(x - 30 * s, y - 12 * s, 60 * s, 24 * s);

    // Windshield
    g.fillStyle(CONFIG.COLORS.CAR_WINDOW);
    g.fillRect(x - 10 * s, y - 10 * s, 20 * s, 8 * s);

    // Wheels
    g.fillStyle(0x333333);
    g.fillRect(x - 26 * s, y + 10 * s, 14 * s, 8 * s);
    g.fillRect(x + 12 * s, y + 10 * s, 14 * s, 8 * s);

    // Siren
    g.fillStyle(CONFIG.COLORS.SIREN_RED);
    g.fillRect(x - 8 * s, y - 18 * s, 7 * s, 6 * s);
    g.fillStyle(CONFIG.COLORS.SIREN_BLUE);
    g.fillRect(x + 1 * s, y - 18 * s, 7 * s, 6 * s);
  }

  drawFlower(x, y, color) {
    const g = this.add.graphics();
    // Stem
    g.fillStyle(0x388E3C);
    g.fillRect(x - 1, y - 8, 3, 10);
    // Petals
    g.fillStyle(color);
    g.fillCircle(x, y - 10, 5);
    g.fillCircle(x - 4, y - 7, 4);
    g.fillCircle(x + 4, y - 7, 4);
    // Center
    g.fillStyle(0xFFEB3B);
    g.fillCircle(x, y - 8, 2);
  }

  drawTree(x, y) {
    const g = this.add.graphics();
    // Trunk
    g.fillStyle(CONFIG.COLORS.TREE_TRUNK);
    g.fillRect(x - 8, y, 16, 40);
    // Canopy layers (blocky Lego style)
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillRect(x - 30, y - 20, 60, 30);
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES_LIGHT);
    g.fillRect(x - 22, y - 40, 44, 25);
    g.fillStyle(CONFIG.COLORS.TREE_LEAVES);
    g.fillRect(x - 14, y - 55, 28, 20);
  }

  drawStar(x, y, size, color) {
    const g = this.add.graphics();
    g.fillStyle(color);
    // Simple 4-point star
    g.fillRect(x - size / 6, y - size / 2, size / 3, size);
    g.fillRect(x - size / 2, y - size / 6, size, size / 3);
  }
}
