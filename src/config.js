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
    HUD_EMPTY: 0x9E9E9E,
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

  // Round progression
  ROUNDS: [
    { round: 1, vehicle: 'car',         vehicleName: 'POLICE CAR',   vehicleW: 64, vehicleH: 40, speed: 200, badGuyCount: 3, badGuySpeed: 40, powerUps: false, obstacles: [] },
    { round: 2, vehicle: 'suv',         vehicleName: 'POLICE SUV',   vehicleW: 70, vehicleH: 46, speed: 190, badGuyCount: 4, badGuySpeed: 50, powerUps: true,  obstacles: [] },
    { round: 3, vehicle: 'jeep',        vehicleName: 'POLICE JEEP',  vehicleW: 64, vehicleH: 42, speed: 200, badGuyCount: 4, badGuySpeed: 55, powerUps: true,  obstacles: ['oilslick'] },
    { round: 4, vehicle: 'motorcycle',  vehicleName: 'MOTORCYCLE',   vehicleW: 55, vehicleH: 32, speed: 240, badGuyCount: 5, badGuySpeed: 60, powerUps: true,  obstacles: ['oilslick', 'pothole'] },
    { round: 5, vehicle: 'monstertruck', vehicleName: 'MONSTER JAM', vehicleW: 96, vehicleH: 64, speed: 180, badGuyCount: 5, badGuySpeed: 65, powerUps: true,  obstacles: ['oilslick', 'pothole'] },
  ],

  // Power-up constants
  POWERUP_BOOST_MULTIPLIER: 1.8,
  POWERUP_BOOST_DURATION: 3000,
  POWERUP_RESPAWN_DELAY: 8000,

  // Obstacle constants
  OIL_SLICK_SPIN_DURATION: 500,
  OIL_SLICK_COAST_DURATION: 1000,
  POTHOLE_SLOW_MULTIPLIER: 0.6,
  POTHOLE_SLOW_DURATION: 4000,

  // Power-up road spawn rule
  POWERUP_ON_ROADS_FROM_ROUND: 4,
};
