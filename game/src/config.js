// Tuning constants and the three gallery levels of The Quiet Gallery.
// One tile is 40 px; every level is a 24 x 16 grid drawn top-down.
// Map legend: # wall, . floor, C crate (blocks sight and movement),
// B bush (hides the player), L lamp (a pool of light), P player start,
// R moon-lantern relic, E exit door, G guard spawn (patrol in waypoints).

export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 640;

export const TUNE = {
  walkSpeed: 132,
  sneakSpeed: 62,
  guardPatrolSpeed: 46,
  guardChaseSpeed: 108,
  guardInvestigateSpeed: 72,
  coneRange: 215,
  coneHalfAngle: 0.61, // ~35 degrees
  detectFill: 1.7, // per second at point blank, in light, walking
  detectDecay: 0.85,
  suspiciousAt: 0.35,
  alarmedAt: 1.0,
  catchDistance: 24,
  bushHideDistance: 46,
  runNoiseRadius: 135,
  pebbleRange: 330,
  pebbleCount: 3,
  pebbleLureRadius: 230,
  memorySeconds: 3.0, // chase keeps going this long after losing sight
  searchSeconds: 4.5,
};

export const LEVELS = [
  {
    name: 'Hall of Lanterns',
    intro: 'Three relics glow in the hall. Slip past the wardens, take them, and leave by the green door.',
    map: [
      '########################',
      '#P....C....#.....R.....#',
      '#..........#...........#',
      '#..B....C..#..G........#',
      '#..........#...........#',
      '#..C....B..#.....C.....#',
      '#.........+.......B....#',
      '#..B....C..#...........#',
      '#......R...#..C...G....#',
      '#..........#...........#',
      '#..C....B..+.....C.....#',
      '#..........#...........#',
      '#..B....C..#..B........#',
      '#..........#.....R.....#',
      '#....G.....#.....E.....#',
      '########################',
    ],
    lamps: [[5, 3], [18, 5], [11, 9], [18, 12]],
    guards: [
      { waypoints: [[13, 3], [20, 3], [20, 6], [13, 6]], facing: 0 },
      { waypoints: [[18, 8], [21, 8], [21, 12], [17, 12]], facing: Math.PI },
      { waypoints: [[5, 14], [10, 14], [10, 10], [5, 10]], facing: -Math.PI / 2 },
    ],
  },
  {
    name: 'The Fern Court',
    intro: 'Four relics, four wardens, and a courtyard full of tall ferns. Crouch in the green to vanish.',
    map: [
      '########################',
      '#P...B....#....R...B...#',
      '#..........#...........#',
      '#..C...B...#..G....C...#',
      '#..........#...........#',
      '#..B....C..+..B....R...#',
      '#..........#...........#',
      '#..R...B...#..C....G...#',
      '#..........#...........#',
      '#..C....B..#..B....C...#',
      '#..........+...........#',
      '#..B....C..#..G....B...#',
      '#..........#...........#',
      '#..C....B..#.....C.....#',
      '#.....G....#..R...E....#',
      '########################',
    ],
    lamps: [[4, 4], [19, 3], [11, 8], [5, 12], [18, 13]],
    guards: [
      { waypoints: [[14, 3], [20, 3], [20, 7], [15, 7]], facing: 0 },
      { waypoints: [[17, 7], [21, 7], [21, 11], [17, 11]], facing: Math.PI },
      { waypoints: [[5, 14], [9, 14], [9, 10], [5, 10]], facing: -Math.PI / 2 },
      { waypoints: [[13, 11], [15, 11], [15, 13], [13, 13]], facing: Math.PI / 2 },
    ],
  },
  {
    name: 'The Vault of Echoes',
    intro: 'The last vault. Four wardens walk tight rounds and the lamps burn bright — patience wins.',
    map: [
      '########################',
      '#P..C....B.#..R...C....#',
      '#..........#...........#',
      '#..B...C...#.G.....B...#',
      '#..........#...........#',
      '#..C....B..+..C....R...#',
      '#..........#...........#',
      '#..R..C....#..B...G....#',
      '#..........#...........#',
      '#..B....C..#..C....B...#',
      '#..........+...........#',
      '#..C...B...#.G....C....#',
      '#..........#...........#',
      '#..B....C..#..B....R...#',
      '#....G.....#......E....#',
      '########################',
    ],
    lamps: [[3, 2], [12, 5], [20, 4], [6, 9], [16, 10], [12, 13]],
    guards: [
      { waypoints: [[13, 2], [19, 2], [19, 5], [13, 5]], facing: 0 },
      { waypoints: [[17, 6], [21, 6], [21, 9], [17, 9]], facing: Math.PI },
      { waypoints: [[13, 11], [15, 11], [15, 13], [13, 13]], facing: -Math.PI / 2 },
      { waypoints: [[5, 14], [10, 14], [10, 11], [5, 11]], facing: Math.PI / 2 },
    ],
  },
];
