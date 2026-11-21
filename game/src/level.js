// Level parsing and queries: walls, crates, bushes, lamps, relics and the exit.
// Tiles are 40 px; the level is a grid of characters from config.js.

import { TILE } from './config.js';

export class Level {
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.intro = def.intro;
    const rows = def.map.map((row) => row.padEnd(24, '#'));
    this.rows = rows.length;
    this.cols = Math.max(...rows.map((r) => r.length));
    this.walls = new Set();
    this.crates = new Set();
    this.bushes = new Set();
    this.relics = [];
    this.exit = null;
    this.playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
    this.guardSpawns = [];
    rows.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        const key = `${c},${r}`;
        if (ch === '#') this.walls.add(key);
        else if (ch === 'C') this.crates.add(key);
        else if (ch === 'B') this.bushes.add(key);
        else if (ch === 'R') this.relics.push({ tx: c, ty: r, x: (c + 0.5) * TILE, y: (r + 0.5) * TILE, taken: false });
        else if (ch === 'E') this.exit = { tx: c, ty: r, x: (c + 0.5) * TILE, y: (r + 0.5) * TILE };
        else if (ch === 'P') this.playerStart = { x: (c + 0.5) * TILE, y: (r + 0.5) * TILE };
        else if (ch === 'G') this.guardSpawns.push({ tx: c, ty: r, x: (c + 0.5) * TILE, y: (r + 0.5) * TILE });
      });
    });
    this.lamps = (def.lamps || []).map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, radius: 130 }));
    this.relicsTotal = this.relics.length;
  }

  get width() {
    return this.cols * TILE;
  }

  get height() {
    return this.rows * TILE;
  }

  tileAt(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return '#';
    return this.def.map[r][c] ?? '#';
  }

  isSolidTile(c, r) {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return true;
    const ch = this.def.map[r][c];
    return ch === '#' || ch === 'C';
  }

  /** True when a circle of radius r at (x, y) overlaps a wall or a crate. */
  blockedAt(x, y, r) {
    const c0 = Math.floor((x - r) / TILE);
    const c1 = Math.floor((x + r) / TILE);
    const r0 = Math.floor((y - r) / TILE);
    const r1 = Math.floor((y + r) / TILE);
    for (let ty = r0; ty <= r1; ty++) {
      for (let tx = c0; tx <= c1; tx++) {
        if (!this.isSolidTile(tx, ty)) continue;
        const bx = tx * TILE;
        const by = ty * TILE;
        const nx = Math.max(bx, Math.min(x, bx + TILE));
        const ny = Math.max(by, Math.min(y, by + TILE));
        if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
      }
    }
    return false;
  }

  /** Slide a circle along (dx, dy): try the full step, then each axis alone. */
  moveCircle(x, y, r, dx, dy) {
    if (!this.blockedAt(x + dx, y + dy, r)) return { x: x + dx, y: y + dy };
    if (!this.blockedAt(x + dx, y, r)) return { x: x + dx, y };
    if (!this.blockedAt(x, y + dy, r)) return { x, y: y + dy };
    return { x, y };
  }

  /** True when the segment between two points crosses no wall or crate. */
  lineOfSight(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      if (this.blockedAt(x, y, 1)) return false;
    }
    return true;
  }

  inBush(x, y) {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    return this.bushes.has(`${c},${r}`);
  }

  /** How bright the player's tile is: 1 inside a lamp pool, 0.45 in the dark. */
  lightAt(x, y) {
    for (const lamp of this.lamps) {
      if (Math.hypot(x - lamp.x, y - lamp.y) < lamp.radius * 0.7) return 1;
    }
    return 0.45;
  }

  relicsLeft() {
    return this.relics.filter((relic) => !relic.taken).length;
  }

  /** Breadth-first reachability from the player start over walkable tiles. */
  reachableFromStart() {
    const startC = Math.floor(this.playerStart.x / TILE);
    const startR = Math.floor(this.playerStart.y / TILE);
    const seen = new Set([`${startC},${startR}`]);
    const queue = [[startC, startR]];
    while (queue.length > 0) {
      const [c, r] = queue.pop();
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        const key = `${nc},${nr}`;
        if (seen.has(key) || this.isSolidTile(nc, nr)) continue;
        seen.add(key);
        queue.push([nc, nr]);
      }
    }
    return seen;
  }
}
