// SPDX-License-Identifier: MIT
// ڕۆحی شمشێر · Sword Spirit — a 3D Donghua-themed action game for the Estrella engine.
//
// Built with the Estrella TypeScript ECS SDK. 3D assets are authored in Kiln
// (see ../kiln-assets) and the visual target is locked by the AGAS art-direction
// brief (see ../../art-direction/ART_DIRECTION.md). This file holds the game
// logic: flight, combat, qi collection, realm progression, waves and a boss.

import {
  addPlugin, defineComponent, defineSystem, addSystem,
  Commands, GetWorld, Res, Query, Mut, Time, Input,
  Transform, MeshRenderer, Text,
  type Entity, type World,
} from 'esengine';

// ---------------------------------------------------------------------------
// Components (plain data; systems read & write them)
// ---------------------------------------------------------------------------
const Player     = defineComponent('Player', { shield: 0 });
const Enemy      = defineComponent('Enemy', { kind: 0, boss: false });
const Orb        = defineComponent('Orb', { value: 5 });
const Projectile = defineComponent('Projectile', { damage: 1 });
const Velocity   = defineComponent('Velocity', { x: 0, y: 0, z: 0 });
const Health     = defineComponent('Health', { value: 1 });
const Lifetime   = defineComponent('Lifetime', { remaining: 2 });

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------
const ARENA = 130;          // half-size of the play field (XZ)
const FLY_Y = 6;            // flight altitude
const PROJ_SPEED = 72;
const REALMS = [
  '练气 · Qi Refining',
  '筑基 · Foundation',
  '金丹 · Golden Core',
  '元婴 · Nascent Soul',
  '化神 · Spirit Severing',
];
const REALM_SCORE = [0, 60, 180, 420, 900];
const FIRE_RATE   = [0.34, 0.27, 0.21, 0.15, 0.10];
const FIRE_DMG    = [1, 1, 2, 2, 3];
const ENEMY_TINT = [
  { r: 1.0, g: 0.30, b: 0.35, a: 1 }, // ember wraith
  { r: 0.72, g: 0.42, b: 0.95, a: 1 }, // violet spectre
  { r: 0.30, g: 0.92, b: 0.80, a: 1 }, // jade spirit
];
const C = (r: number, g: number, b: number, a = 1) => ({ r, g, b, a });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ---------------------------------------------------------------------------
// Shared game state (one instance for the whole session)
// ---------------------------------------------------------------------------
interface State {
  phase: 'menu' | 'playing' | 'over' | 'win';
  hp: number; maxHp: number;
  qi: number; score: number;
  realm: number; wave: number; t: number;
  player: Entity | null;
  boss: Entity | null; bossDone: boolean;
  fireT: number; orbT: number; waveT: number; toast: number;
}
const S: State = {
  phase: 'menu', hp: 100, maxHp: 100, qi: 0, score: 0, realm: 0, wave: 0, t: 0,
  player: null, boss: null, bossDone: false,
  fireT: 0, orbT: 0, waveT: 4, toast: 0,
};

let toasts: { t: number; msg: string } = { t: 0, msg: '' };
const say = (m: string, secs = 2.4) => { toasts = { t: secs, msg: m }; };

// ---------------------------------------------------------------------------
// Spawning helpers
// ---------------------------------------------------------------------------
function spawnPlayer(cmds: any): Entity {
  const e = cmds.spawn('Player')
    .insert(Transform, { position: { x: 0, y: FLY_Y, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 2.2, y: 2.2, z: 2.2 } })
    .insert(MeshRenderer, { mesh: 'builtin:cone', lit: true, color: C(0.45, 1.0, 0.78), opaque: true, enabled: true })
    .insert(Player, { shield: 0 })
    .id();
  return e;
}
function spawnEnemy(cmds: any, x: number, y: number, z: number, kind: number, hp: number, boss = false): Entity {
  const tint = boss ? C(0.85, 0.12, 0.18) : ENEMY_TINT[kind % ENEMY_TINT.length];
  const scale = boss ? 9 : rand(1.3, 2.0);
  return cmds.spawn(boss ? 'Boss' : 'Enemy')
    .insert(Transform, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: scale, y: scale, z: scale } })
    .insert(MeshRenderer, { mesh: 'builtin:sphere', lit: true, color: tint, opaque: true, enabled: true })
    .insert(Enemy, { kind, boss })
    .insert(Health, { value: hp })
    .insert(Velocity, { x: 0, y: 0, z: 0 })
    .id();
}
function spawnOrb(cmds: any, x: number, y: number, z: number): Entity {
  return cmds.spawn('Orb')
    .insert(Transform, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1.1, y: 1.1, z: 1.1 } })
    .insert(MeshRenderer, { mesh: 'builtin:sphere', lit: false, color: C(1.0, 0.85, 0.35), opaque: true, enabled: true })
    .insert(Orb, { value: 5 })
    .id();
}
function fire(cmds: any, px: number, py: number, pz: number, dx: number, dy: number, dz: number, dmg: number) {
  const len = Math.hypot(dx, dy, dz) || 1;
  const vx = dx / len * PROJ_SPEED, vy = dy / len * PROJ_SPEED, vz = dz / len * PROJ_SPEED;
  cmds.spawn('Projectile')
    .insert(Transform, { position: { x: px, y: py, z: pz }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 0.9, y: 0.9, z: 0.9 } })
    .insert(MeshRenderer, { mesh: 'builtin:sphere', lit: false, color: C(0.7, 1.0, 1.0), opaque: true, enabled: true })
    .insert(Projectile, { damage: dmg })
    .insert(Velocity, { x: vx, y: vy, z: vz })
    .insert(Lifetime, { remaining: 2.2 });
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function setText(world: World, name: string, content: string, color?: { r: number; g: number; b: number; a: number }) {
  const e = world.findEntityByName(name);
  if (e === null) return;
  const t = world.get(e, Text);
  if (t.content !== content || (color && (t.color.r !== color.r || t.color.g !== color.g || t.color.b !== color.b))) {
    world.insert(e, Text, color ? { ...t, content, color } : { ...t, content });
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function startGame(cmds: any) {
  // clear any leftovers
  S.player = spawnPlayer(cmds);
  S.phase = 'playing';
  S.hp = S.maxHp; S.qi = 0; S.score = 0; S.realm = 0; S.wave = 1;
  S.boss = null; S.bossDone = false; S.fireT = 0; S.orbT = 0; S.waveT = 3;
  say('بەرزبوونەوەی ڕۆح — دەستپێک!', 2.5);
}
function endGame(win: boolean) {
  S.phase = win ? 'win' : 'over';
  say(win ? 'گەیشتیتە 化神 — سەرکەوتوو!' : 'ڕۆحەکەت تێکشکا... (R) دووبارە', 999);
}
// Despawn every dynamic actor using the live queries, then return to the menu.
function restart(cmds: any, enemyQ: any, projQ: any, orbQ: any) {
  for (const [e] of enemyQ) cmds.despawn(e);
  for (const [e] of projQ) cmds.despawn(e);
  for (const [e] of orbQ) cmds.despawn(e);
  if (S.player !== null) { cmds.despawn(S.player); S.player = null; }
  S.phase = 'menu';
  say('بۆ دەستپێک: Space', 999);
}

// ---------------------------------------------------------------------------
// Systems
// ---------------------------------------------------------------------------

// Core gameplay loop.
const gameSystem = defineSystem(
  [
    Commands(), GetWorld(), Res(Input), Res(Time),
    Query(Enemy, Mut(Transform), Mut(Health), Velocity),
    Query(Projectile, Mut(Transform), Velocity, Mut(Lifetime)),
    Query(Orb, Mut(Transform)),
  ],
  (cmds, world, input, time, enemyQ, projQ, orbQ) => {
    const dt = Math.min(time.delta, 0.05);
    S.t += dt;

    // --- Menu / restart handling ---
    if (S.phase === 'menu') {
      setText(world, 'Title', 'ڕۆحی شمشێر · Sword Spirit');
      setText(world, 'Message', 'بۆ دەستپێک: Space    ·    WASD: جوڵە    ·    R: دووبارە', C(1, 0.9, 0.7));
      if (input.isKeyPressed('Space')) startGame(cmds);
      return;
    }
    if (S.phase === 'over' || S.phase === 'win') {
      if (input.isKeyPressed('KeyR')) restart(cmds, enemyQ, projQ, orbQ);
      return;
    }

    // --- Player ---
    const p = S.player;
    if (p === null) { startGame(cmds); return; }
    const pt = world.get(p, Transform);
    const l = Number(input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft'));
    const r = Number(input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight'));
    const u = Number(input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp'));
    const d = Number(input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown'));
    const sp = (input.isKeyDown('ShiftLeft') ? 30 : 20) * dt;
    pt.position.x = clamp(pt.position.x + (r - l) * sp, -ARENA, ARENA);
    pt.position.z = clamp(pt.position.z + (d - u) * sp, -ARENA, ARENA);
    pt.position.y = FLY_Y + Math.sin(S.t * 2) * 0.4;
    world.insert(p, Transform, pt);

    // Camera follow (third-person, behind & above).
    const cam = world.findEntityByName('Camera');
    if (cam !== null) {
      const ct = world.get(cam, Transform);
      ct.position = { x: pt.position.x, y: pt.position.y + 11, z: pt.position.z + 24 };
      ct.rotation = { x: -0.2, y: 0, z: 0, w: 0.98 };
      world.insert(cam, Transform, ct);
    }

    // --- Firing (auto toward nearest enemy) ---
    S.fireT -= dt;
    let nx = 0, ny = 0, nz = -1, nearest = Infinity;
    for (const [e, en, et] of enemyQ) {
      const dx = et.position.x - pt.position.x, dy = et.position.y - pt.position.y, dz = et.position.z - pt.position.z;
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist < nearest) { nearest = dist; nx = dx; ny = dy; nz = dz; }
    }
    const canFire = S.fireT <= 0;
    if (canFire) {
      const dmg = FIRE_DMG[S.realm];
      if (nearest < Infinity) fire(cmds, pt.position.x, pt.position.y, pt.position.z, nx, ny, nz, dmg);
      else fire(cmds, pt.position.x, pt.position.y, pt.position.z, 0, 0, -1, dmg);
      // burst on Space
      if (input.isKeyPressed('Space')) {
        fire(cmds, pt.position.x, pt.position.y, pt.position.z, 0.4, 0, -1, dmg);
        fire(cmds, pt.position.x, pt.position.y, pt.position.z, -0.4, 0, -1, dmg);
      }
      S.fireT = FIRE_RATE[S.realm];
    }

    // --- Enemy movement + contact damage ---
    for (const [e, en, et, hp, vel] of enemyQ) {
      const dx = pt.position.x - et.position.x, dy = pt.position.y - et.position.y, dz = pt.position.z - et.position.z;
      const dist = Math.hypot(dx, dy, dz) || 1;
      const speed = en.boss ? 6 : 14;
      vel.x = dx / dist * speed; vel.y = dy / dist * speed; vel.z = dz / dist * speed;
      et.position.x += vel.x * dt; et.position.y += vel.y * dt; et.position.z += vel.z * dt;
      if (dist < 3) {
        S.hp = Math.max(0, S.hp - (hp.value > 30 ? 18 : 8));
        cmds.despawn(e);
        say('تۆ نەخۆش کرایتەوە!', 1.2);
        if (S.hp <= 0) { endGame(false); return; }
      }
    }

    // --- Projectiles: move, age, hit enemies ---
    for (const [e, pr, et, vel, life] of projQ) {
      et.position.x += vel.x * dt; et.position.y += vel.y * dt; et.position.z += vel.z * dt;
      life.remaining -= dt;
      let hit = false;
      for (const [ee, een, eet, ehp] of enemyQ) {
        const dx = eet.position.x - et.position.x, dy = eet.position.y - et.position.y, dz = eet.position.z - et.position.z;
        if (dx * dx + dy * dy + dz * dz < 9) {
          ehp.value -= pr.damage;
          hit = true;
          if (ehp.value <= 0) {
            cmds.despawn(ee);
            S.score += een.boss ? 200 : 12;
            S.qi += een.boss ? 40 : 4;
            if (een.boss) { S.bossDone = true; say('شاهێنەکە تێکشکا!', 3); }
            else say('ڕۆحێک تێکشکا +12', 0.8);
          }
          break;
        }
      }
      if (hit || life.remaining <= 0) cmds.despawn(e);
    }

    // --- Orbs: spawn + collect ---
    S.orbT -= dt;
    if (S.orbT <= 0) {
      const a = rand(0, Math.PI * 2), rad = rand(20, 90);
      spawnOrb(cmds, pt.position.x + Math.cos(a) * rad, FLY_Y + rand(-6, 10), pt.position.z + Math.sin(a) * rad);
      S.orbT = rand(1.2, 2.4);
    }
    for (const [e, et] of orbQ) {
      const dx = pt.position.x - et.position.x, dy = pt.position.y - et.position.y, dz = pt.position.z - et.position.z;
      if (dx * dx + dy * dy + dz * dz < 16) {
        S.qi += 5; S.score += 3;
        cmds.despawn(e);
      }
    }

    // --- Wave spawning ---
    S.waveT -= dt;
    if (S.waveT <= 0 && !(S.boss && !S.bossDone)) {
      if (S.wave >= 5 && !S.boss) {
        S.boss = spawnEnemy(cmds, pt.position.x, FLY_Y + 4, pt.position.z - 70, 0, 60, true);
        say('شاهێنێکی تاریک ده‌رهێنرا!', 3);
      } else {
        const count = 3 + S.wave * 2;
        for (let i = 0; i < count; i++) {
          const a = rand(0, Math.PI * 2);
          spawnEnemy(cmds, pt.position.x + Math.cos(a) * 55, FLY_Y + rand(-8, 12), pt.position.z + Math.sin(a) * 55, i % 3, 3);
        }
        S.wave++;
        say(`قۆناغی ${S.wave}`, 1.5);
      }
      S.waveT = Math.max(3.5, 7 - S.wave * 0.6);
    }
    if (S.bossDone) endGame(true);

    // --- Realm progression ---
    while (S.realm < REALM_SCORE.length - 1 && S.score >= REALM_SCORE[S.realm + 1]) {
      S.realm++;
      S.hp = Math.min(S.maxHp, S.hp + 25);
      say(`پلە بۆ ${REALMS[S.realm]} به‌رز بووەوە!`, 2.2);
    }

    // --- Toast ---
    if (toasts.t > 0) { toasts.t -= dt; setText(world, 'Message', toasts.msg, C(1, 0.92, 0.7)); }
    else if (S.phase === 'playing') setText(world, 'Message', '', C(1, 0.92, 0.7));
  },
  { name: 'SwordSpiritGame' },
);

// HUD sync (separate system so it always runs after gameplay).
const hudSystem = defineSystem([GetWorld()], (world) => {
  if (S.phase === 'menu') return;
  setText(world, 'HP', `ڕۆح: ${Math.ceil(S.hp)}/${S.maxHp}`, C(0.55, 1, 0.78));
  setText(world, 'Qi', `تۆزی ڕۆح: ${S.qi}   خاڵ: ${S.score}`, C(1, 0.85, 0.4));
  setText(world, 'Realm', `پلە: ${REALMS[S.realm]}`, C(0.7, 0.85, 1));
  setText(world, 'Wave', `قۆناغ: ${S.wave}${S.boss && !S.bossDone ? '  ·  بۆسس' : ''}`, C(1, 1, 1));
  setText(world, 'Title', '', C(1, 0.86, 0.5));
}, { name: 'SwordSpiritHUD' });

// ---------------------------------------------------------------------------
// Plugin registration — Estrella calls this when the module loads.
// ---------------------------------------------------------------------------
addPlugin({
  name: 'sword-spirit',
  build(app) {
    app.addSystem(gameSystem);
    app.addSystem(hudSystem);
  },
});
