// Game constants
const CONFIG = {
  // Game dimensions (iPad landscape)
  WIDTH: 1024,
  HEIGHT: 768,

  // Police car
  CAR_SPEED: 200,         // pixels per second
  CAR_STOP_DISTANCE: 10,  // stop when this close to target

  // Bad guys
  BAD_GUY_COUNT: 3,
  BAD_GUY_SPEED: 40,      // wandering speed
  BAD_GUY_WANDER_TIME: 2000, // ms before changing direction

  // Colors (Lego-inspired)
  COLORS: {
    GRASS: 0x4CAF50,
    GRASS_DARK: 0x388E3C,
    SKY: 0x87CEEB,
    ROAD: 0x757575,
    ROAD_LINE: 0xFFEB3B,
    CAR_BODY: 0x1565C0,
    CAR_WINDOW: 0x90CAF9,
    SIREN_RED: 0xF44336,
    SIREN_BLUE: 0x2196F3,
    BAD_GUY_BODY: 0xFF5722,
    BAD_GUY_HEAD: 0xFFCC80,
    JAIL_WALLS: 0x795548,
    JAIL_DOOR: 0x5D4037,
    JAIL_BARS: 0x424242,
    FLOWER_RED: 0xE91E63,
    FLOWER_YELLOW: 0xFFEB3B,
    FLOWER_PURPLE: 0x9C27B0,
    TREE_TRUNK: 0x795548,
    TREE_LEAVES: 0x66BB6A,
    TREE_LEAVES_LIGHT: 0x81C784,
    TITLE_TEXT: 0xFFFFFF,
    HUD_EMPTY: 0x555555,
    HUD_FILLED: 0xFF5722,
    CELEBRATION_BG: 0x1A237E,
  },

  // Jail position
  JAIL_X: 900,
  JAIL_Y: 150,
  JAIL_WIDTH: 100,
  JAIL_HEIGHT: 120,

  // HUD
  HUD_Y: 20,
  HUD_ICON_SIZE: 30,
  HUD_ICON_SPACING: 40,
};
