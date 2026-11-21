// Guard patrol AI: waypoint patrols, vision cones, suspicion and chase.
// A guard fills its detection meter while the player is inside its cone with a
// clear line of sight; at a threshold it investigates, at full meter it chases.

import { TILE, TUNE } from './config.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  SEARCH: 'search',
  RETURN: 'return',
};

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function angleLerp(a, b, t) {
  return a + angleDiff(b, a) * Math.min(1, t);
}

export class Guard {
  constructor(def, level) {
    this.level = level;
    this.waypoints = def.waypoints.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.facing = def.facing ?? 0;
    this.targetFacing = this.facing;
    this.wpIndex = 1 % this.waypoints.length;
    this.state = GUARD_STATE.PATROL;
    this.detection = 0;
    this.waitTimer = 0;
    this.lastSeen = null;
    this.lostTimer = 0;
    this.searchTimer = 0;
    this.investigatePoint = null;
    this.lookTimer = 0;
    this.stepTimer = 0;
    this.wasSuspicious = false;
    this.wasAlarmed = false;
    this.radius = 13;
    this.hue = 0;
  }

  get alerted() {
    return this.state === GUARD_STATE.CHASE;
  }

  get suspicious() {
    return this.state === GUARD_STATE.SUSPICIOUS || this.state === GUARD_STATE.SEARCH;
  }

  /** Can this guard see the player right now (cone + line of sight + cover)? */
  canSee(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > TUNE.coneRange) return { seen: false, dist };
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, this.facing)) > TUNE.coneHalfAngle) return { seen: false, dist };
    if (!this.level.lineOfSight(this.x, this.y, player.x, player.y)) return { seen: false, dist };
    if (this.level.inBush(player.x, player.y) && dist > TUNE.bushHideDistance) return { seen: false, dist };
    return { seen: true, dist };
  }

  /** Hear a noise at (x, y) with the given radius: turn and investigate. */
  hearNoise(x, y, radius) {
    if (this.state === GUARD_STATE.CHASE) return;
    if (Math.hypot(x - this.x, y - this.y) > radius) return;
    this.investigatePoint = { x, y };
    if (this.state === GUARD_STATE.PATROL || this.state === GUARD_STATE.RETURN) {
      this.state = GUARD_STATE.SUSPICIOUS;
      this.lookTimer = 0;
    }
  }

  update(dt, player, sounds) {
    const { seen, dist } = this.canSee(player);
    const light = this.level.lightAt(player.x, player.y);
    const sneakFactor = player.sneaking ? 0.55 : 1;
    const runFactor = player.running ? 1.3 : 1;
    const rangeFactor = 1 - (dist / TUNE.coneRange) * 0.55;

    if (seen) {
      const rate = TUNE.detectFill * light * sneakFactor * runFactor * rangeFactor;
      this.detection = Math.min(1.2, this.detection + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.lostTimer = 0;
    } else {
      this.detection = Math.max(0, this.detection - TUNE.detectDecay * dt);
      if (this.lastSeen) this.lostTimer += dt;
    }

    const suspiciousNow = this.detection >= TUNE.suspiciousAt && this.detection < TUNE.alarmedAt;
    if (suspiciousNow && !this.wasSuspicious && !this.wasAlarmed) sounds.suspicious();
    if (this.detection >= TUNE.alarmedAt && !this.wasAlarmed) sounds.alarm();
    this.wasSuspicious = suspiciousNow;
    this.wasAlarmed = this.detection >= TUNE.alarmedAt;

    if (this.detection >= TUNE.alarmedAt && this.lastSeen) {
      if (this.state !== GUARD_STATE.CHASE) this.state = GUARD_STATE.CHASE;
    } else if (this.state === GUARD_STATE.CHASE) {
      if (!seen && this.lostTimer > TUNE.memorySeconds) {
        this.state = GUARD_STATE.SEARCH;
        this.searchTimer = TUNE.searchSeconds;
        this.investigatePoint = { ...this.lastSeen };
      }
    }

    if (this.state === GUARD_STATE.PATROL) this.updatePatrol(dt);
    else if (this.state === GUARD_STATE.SUSPICIOUS) this.updateInvestigate(dt);
    else if (this.state === GUARD_STATE.CHASE) this.updateChase(dt, player);
    else if (this.state === GUARD_STATE.SEARCH) this.updateSearch(dt);
    else if (this.state === GUARD_STATE.RETURN) this.updateReturn(dt);

    // Footsteps: a soft tick per step so the player can track a guard by ear.
    const moving =
      this.state === GUARD_STATE.PATROL ||
      this.state === GUARD_STATE.CHASE ||
      this.state === GUARD_STATE.RETURN ||
      this.state === GUARD_STATE.SEARCH;
    if (moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.state === GUARD_STATE.CHASE ? 0.34 : 0.55;
        const pan = Math.max(-1, Math.min(1, (this.x - player.x) / 400));
        const vol = Math.hypot(this.x - player.x, this.y - player.y);
        if (vol < 420) sounds.footstep(this.state === GUARD_STATE.CHASE, pan);
      }
    }
  }

  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const moved = this.level.moveCircle(this.x, this.y, this.radius, nx - this.x, ny - this.y);
    this.x = moved.x;
    this.y = moved.y;
    this.targetFacing = Math.atan2(dy, dx);
    this.facing = angleLerp(this.facing, this.targetFacing, dt * 6);
    return dist - step < 3;
  }

  updatePatrol(dt) {
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      this.facing = angleLerp(this.facing, this.targetFacing, dt * 2);
      if (this.waitTimer <= 0) this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      return;
    }
    const wp = this.waypoints[this.wpIndex];
    if (this.moveToward(wp.x, wp.y, TUNE.guardPatrolSpeed, dt)) {
      this.waitTimer = 1.1;
      this.targetFacing = this.facing + (Math.random() - 0.5) * 1.2;
    }
  }

  updateInvestigate(dt) {
    const point = this.investigatePoint ?? this.lastSeen;
    if (!point) {
      this.state = GUARD_STATE.RETURN;
      return;
    }
    if (!this.moveToward(point.x, point.y, TUNE.guardInvestigateSpeed, dt)) return;
    this.lookTimer += dt;
    this.facing += dt * 1.6;
    if (this.lookTimer > 2.2) {
      this.investigatePoint = null;
      this.state = this.detection >= TUNE.suspiciousAt ? GUARD_STATE.SEARCH : GUARD_STATE.RETURN;
      this.searchTimer = TUNE.searchSeconds;
    }
  }

  updateChase(dt, player) {
    const target = this.lastSeen ?? { x: player.x, y: player.y };
    this.moveToward(target.x, target.y, TUNE.guardChaseSpeed, dt);
    if (this.detection < TUNE.alarmedAt * 0.6) {
      this.state = GUARD_STATE.SEARCH;
      this.searchTimer = TUNE.searchSeconds;
      this.investigatePoint = { ...target };
    }
  }

  updateSearch(dt) {
    this.searchTimer -= dt;
    if (this.searchTimer <= 0) {
      this.state = GUARD_STATE.RETURN;
      return;
    }
    const point = this.investigatePoint ?? this.waypoints[0];
    if (this.moveToward(point.x, point.y, TUNE.guardInvestigateSpeed, dt)) {
      this.facing += dt * 2.2;
    }
  }

  updateReturn(dt) {
    let best = this.waypoints[0];
    let bestDist = Infinity;
    for (const wp of this.waypoints) {
      const d = Math.hypot(wp.x - this.x, wp.y - this.y);
      if (d < bestDist) {
        bestDist = d;
        best = wp;
      }
    }
    if (this.moveToward(best.x, best.y, TUNE.guardPatrolSpeed, dt)) {
      this.wpIndex = this.waypoints.indexOf(best);
      this.state = GUARD_STATE.PATROL;
      this.waitTimer = 0.6;
    }
  }
}
