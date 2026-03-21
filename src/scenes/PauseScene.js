class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;

    // Semi-transparent dark overlay
    this.add.rectangle(cx, cy, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.6);

    // "PAUSED" text
    this.add.text(cx, cy - 80, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // RESUME button (green)
    const resumeY = cy + 20;
    const btnW = 200;
    const btnH = 70;
    const resumeBtn = this.add.graphics();
    resumeBtn.fillStyle(0x4CAF50, 1);
    resumeBtn.fillRoundedRect(cx - btnW / 2, resumeY - btnH / 2, btnW, btnH, 14);
    resumeBtn.lineStyle(3, 0x388E3C);
    resumeBtn.strokeRoundedRect(cx - btnW / 2, resumeY - btnH / 2, btnW, btnH, 14);

    const resumeText = this.add.text(cx, resumeY, 'RESUME', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#2E7D32',
      strokeThickness: 3,
    }).setOrigin(0.5);

    let resumeClicked = false;
    const doResume = () => {
      if (resumeClicked) return;
      resumeClicked = true;
      SoundManager.playPause();
      this.scene.resume('GameScene');
      this.scene.stop();
    };

    resumeText.setInteractive({ useHandCursor: true })
      .setPadding(40, 20)
      .on('pointerdown', doResume);

    // QUIT button (red)
    const quitY = cy + 110;
    const quitBtn = this.add.graphics();
    quitBtn.fillStyle(0xE53935, 1);
    quitBtn.fillRoundedRect(cx - btnW / 2, quitY - btnH / 2, btnW, btnH, 14);
    quitBtn.lineStyle(3, 0xC62828);
    quitBtn.strokeRoundedRect(cx - btnW / 2, quitY - btnH / 2, btnW, btnH, 14);

    const quitText = this.add.text(cx, quitY, 'QUIT', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#B71C1C',
      strokeThickness: 3,
    }).setOrigin(0.5);

    let quitClicked = false;
    const doQuit = () => {
      if (quitClicked) return;
      quitClicked = true;
      SoundManager.playTap();
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('TitleScene');
    };

    quitText.setInteractive({ useHandCursor: true })
      .setPadding(40, 20)
      .on('pointerdown', doQuit);

    // Scene-level fallback for imprecise taps
    this.input.on('pointerdown', (pointer) => {
      const dx = Math.abs(pointer.x - cx);
      // Check resume button area
      if (dx < btnW / 2 + 20 && Math.abs(pointer.y - resumeY) < btnH / 2 + 20) {
        doResume();
      }
      // Check quit button area
      if (dx < btnW / 2 + 20 && Math.abs(pointer.y - quitY) < btnH / 2 + 20) {
        doQuit();
      }
    });
  }
}
