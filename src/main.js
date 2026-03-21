// Theo's Police Patrol — Main game config
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: CONFIG.COLORS.SKY,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [TitleScene, GameScene, CelebrationScene, VehicleRevealScene, MegaCelebrationScene, PauseScene],
  input: {
    activePointers: 1,
  },
});
