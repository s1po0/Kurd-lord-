// ڕۆحی شمشێر · Sword Spirit — runnable 3D Donghua game (three.js)
// A playable web preview of the Estrella project. Same design: fly a sword,
// collect qi, fight demon spirits, break through realms, face the demon lord.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ARENA = 130, FLY_Y = 6, PROJ_SPEED = 72;
const REALMS = ['练气 · Qi Refining', '筑基 · Foundation', '金丹 · Golden Core', '元婴 · Nascent Soul', '化神 · Spirit Severing'];
const REALM_SCORE = [0, 60, 180, 420, 900];
const FIRE_RATE = [0.34, 0.27, 0.21, 0.15, 0.10];
const FIRE_DMG = [1, 1, 2, 2, 3];
const ENEMY_TINT = [0xb34a55, 0xb86bdc, 0x4ce6c8];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x4a5a78, 0.0042);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 4000);
camera.position.set(0, 17, 24);
camera.lookAt(0, FLY_Y, -4);

// Lights
const sun = new THREE.DirectionalLight(0xffd0a0, 2.2);
sun.position.set(40, 60, 20);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x88aaff, 1.1));
const moon = new THREE.PointLight(0xff6a88, 1.2, 800);
moon.position.set(-60, 120, -120);
scene.add(moon);

// Sky dome (painted Donghua backdrop)
scene.background = new THREE.Color(0x10182a);
new THREE.TextureLoader().load('/web/assets/donghua_bg.png', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);
});

// Ground
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(400, 64),
  new THREE.MeshStandardMaterial({ color: 0x1b2433, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Distant ink mountains (silhouette in the fog)
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2;
  const r = 280 + rand(-30, 30);
  const h = rand(60, 160);
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(rand(40, 90), h, 5),
    new THREE.MeshStandardMaterial({ color: 0x10182a, roughness: 1 })
  );
  m.position.set(Math.cos(a) * r, h / 2 - 8, Math.sin(a) * r);
  scene.add(m);
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------
function makePlayer() {
  const g = new THREE.Group();
  const jade = new THREE.MeshStandardMaterial({ color: 0x2f6f6b, roughness: .6 });
  const light = new THREE.MeshStandardMaterial({ color: 0x9fe6d6, roughness: .5 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0c9a0 });
  const red  = new THREE.MeshStandardMaterial({ color: 0xd84f6a });
  const glow = new THREE.MeshStandardMaterial({ color: 0x5be0ff, emissive: 0x2aa0c0, emissiveIntensity: 1.4, roughness: .3 });
  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 4.2), glow); sword.position.y = -1.55; g.add(sword);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 2.2, 16), jade); robe.position.y = -0.35; g.add(robe);
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.22, 16), red); sash.position.y = 0.25; g.add(sash);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.5, 16), light); sh.position.y = 0.7; g.add(sh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 16), skin); head.position.y = 1.25; g.add(head);
  const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 12), jade); knot.position.y = 1.7; g.add(knot);
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 12), jade); sl.position.set(-0.7, 0.1, 0); sl.rotation.z = 0.32; g.add(sl);
  const sr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 12), jade); sr.position.set(0.7, 0.1, 0); sr.rotation.z = -0.32; g.add(sr);
  scene.add(g);
  return g;
}

function makeEnemy(boss = false) {
  const g = new THREE.Group();
  const kind = boss ? 3 : (Math.random() * 3) | 0;
  const col = boss ? 0x9a1020 : ENEMY_TINT[kind];
  const body = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: .8 });
  const eye = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2020, emissiveIntensity: 2 });
  const horn = new THREE.MeshStandardMaterial({ color: 0xe8c46a, roughness: .5 });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.7, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0x2a0d18, roughness: 1 }));
  tail.position.y = -1.4; g.add(tail);
  const b = new THREE.Mesh(new THREE.SphereGeometry(boss ? 2.2 : 0.85, 20, 18), body); g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(boss ? 1.4 : 0.55, 18, 16), body); h.position.y = 0.95; g.add(h);
  for (const sx of [-1, 1]) {
    const hn = new THREE.Mesh(new THREE.ConeGeometry(boss ? 0.3 : 0.12, boss ? 1.6 : 0.7, 8), horn);
    hn.position.set(sx * (boss ? 0.8 : 0.3), boss ? 2.0 : 1.4, 0); hn.rotation.z = sx * 0.5; g.add(hn);
  }
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(boss ? 0.28 : 0.1, 10, 10), eye);
    e.position.set(sx * (boss ? 0.5 : 0.2), boss ? 1.1 : 1.0, boss ? 1.1 : 0.45); g.add(e);
  }
  scene.add(g);
  return g;
}

function makeOrb() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 18),
    new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffb000, emissiveIntensity: 1.6, roughness: .3 }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.25, depthWrite: false }));
  g.add(core); g.add(halo);
  scene.add(g);
  return g;
}

function makeProjectile() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xaff6ff, emissive: 0x60e0ff, emissiveIntensity: 2.2, roughness: .2 }));
  scene.add(m);
  return m;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const S = {
  phase: 'menu', hp: 100, maxHp: 100, qi: 0, score: 0, realm: 0, wave: 1, t: 0,
  fireT: 0, orbT: 0, waveT: 4, boss: null, bossDone: false, toast: '', toastT: 0,
};
let player = makePlayer(); player.position.set(0, FLY_Y, 0);
const enemies = [], orbs = [], shots = [];

const keys = {};
let edge = { start: false, restart: false, burst: false };
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') { if (S.phase === 'menu') edge.start = true; else edge.burst = true; e.preventDefault(); }
  if ((e.code === 'KeyR' || e.code === 'Space') && (S.phase === 'over' || S.phase === 'win')) edge.restart = true;
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const key of Object.keys(keys)) keys[key] = false; });

// On-screen controls use the same input state as the keyboard.
for (const button of document.querySelectorAll('[data-key]')) {
  const key = button.dataset.key;
  const release = () => { keys[key] = false; button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys[key] = true;
    button.classList.add('pressed');
    if (key === 'Space') {
      if (S.phase === 'menu') edge.start = true;
      else if (S.phase === 'over' || S.phase === 'win') edge.restart = true;
      else edge.burst = true;
    }
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}


// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
function setHUD() {
  $('hp').firstChild.textContent = `ڕۆح: ${Math.ceil(S.hp)}`;
  $('hpbar').firstElementChild.style.width = `${(S.hp / S.maxHp) * 100}%`;
  $('qi').textContent = `تۆزی ڕۆح: ${S.qi} · خاڵ: ${S.score}`;
  $('realm').textContent = `پلە: ${REALMS[S.realm]}`;
  $('wave').textContent = `قۆناغ: ${S.wave}${S.boss && !S.bossDone ? ' · بۆسس' : ''}`;
  $('message').textContent = S.toastT > 0 ? S.toast : '';
  $('title').style.display = S.phase === 'menu' ? 'block' : 'none';
  $('action').textContent = S.phase === 'menu' ? 'دەستپێک' : (S.phase === 'over' || S.phase === 'win') ? 'دووبارە' : 'تیشک';
}
const say = (m, s = 2.4) => { S.toast = m; S.toastT = s; };

// ---------------------------------------------------------------------------
// Spawning / lifecycle
// ---------------------------------------------------------------------------
function clearActors() {
  for (const e of enemies) scene.remove(e.g); enemies.length = 0;
  for (const o of orbs) scene.remove(o.g); orbs.length = 0;
  for (const s of shots) scene.remove(s.g); shots.length = 0;
  if (S.boss) { scene.remove(S.boss); S.boss = null; }
}
function startGame() {
  clearActors();
  S.phase = 'playing'; S.hp = S.maxHp; S.qi = 0; S.score = 0; S.realm = 0; S.wave = 1;
  S.bossDone = false; S.fireT = 0; S.orbT = 0; S.waveT = 3;
  player.position.set(0, FLY_Y, 0);
  say('بەرزبوونەوەی ڕۆح — دەستپێک!', 2.5);
}
function endGame(win) {
  S.phase = win ? 'win' : 'over';
  say(win ? 'گەیشتیتە 化神 — سەرکەوتوو!' : 'ڕۆحەکەت تێکشکا... (R) دووبارە', 999);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  S.t += dt;
  if (S.phase === 'menu') { if (edge.start) startGame(); edge.start = false; setHUD(); return; }
  if (S.phase === 'over' || S.phase === 'win') { if (edge.restart) startGame(); edge.restart = false; setHUD(); return; }

  // Player movement (XZ)
  const l = keys['KeyA'] || keys['ArrowLeft'], r = keys['KeyD'] || keys['ArrowRight'];
  const u = keys['KeyW'] || keys['ArrowUp'], d = keys['KeyS'] || keys['ArrowDown'];
  const sp = (keys['ShiftLeft'] ? 30 : 20) * dt;
  player.position.x = clamp(player.position.x + ((r ? 1 : 0) - (l ? 1 : 0)) * sp, -ARENA, ARENA);
  player.position.z = clamp(player.position.z + ((d ? 1 : 0) - (u ? 1 : 0)) * sp, -ARENA, ARENA);
  player.position.y = FLY_Y + Math.sin(S.t * 2) * 0.4;
  player.rotation.y = Math.sin(S.t * 1.3) * 0.15;

  // Camera follow
  camera.position.set(player.position.x, player.position.y + 11, player.position.z + 24);
  camera.lookAt(player.position.x, player.position.y, player.position.z - 4);

  // Firing
  S.fireT -= dt;
  let nx = 0, ny = 0, nz = -1, nearest = Infinity;
  for (const e of enemies) {
    const dx = e.g.position.x - player.position.x, dy = e.g.position.y - player.position.y, dz = e.g.position.z - player.position.z;
    const dd = dx * dx + dy * dy + dz * dz;
    if (dd < nearest) { nearest = dd; nx = dx; ny = dy; nz = dz; }
  }
  if (S.fireT <= 0) {
    const dmg = FIRE_DMG[S.realm];
    const len = Math.hypot(nx, ny, nz) || 1;
    spawnShot(nx / len, ny / len, nz / len, dmg);
    if (edge.burst) { spawnShot(0.4, 0, -1, dmg); spawnShot(-0.4, 0, -1, dmg); }
    S.fireT = FIRE_RATE[S.realm];
  }
  edge.burst = false;

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.position.x - e.g.position.x, dy = player.position.y - e.g.position.y, dz = player.position.z - e.g.position.z;
    const dist = Math.hypot(dx, dy, dz) || 1;
    const speed = e.boss ? 6 : 14;
    e.g.position.x += dx / dist * speed * dt; e.g.position.y += dy / dist * speed * dt; e.g.position.z += dz / dist * speed * dt;
    e.g.rotation.y += dt * (e.boss ? 0.6 : 1.6);
    e.contactCooldown = Math.max(0, (e.contactCooldown || 0) - dt);
    if (dist < 3 && e.contactCooldown === 0) {
      S.hp = Math.max(0, S.hp - (e.boss ? 18 : 8));
      if (e.boss) { e.contactCooldown = 1.5; }
      else { scene.remove(e.g); enemies.splice(i, 1); }
      say('تۆ نەخۆش کرایتەوە!', 1.2);
      if (S.hp <= 0) { endGame(false); setHUD(); return; }
    }
  }

  // Projectiles
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.g.position.x += s.vx * dt; s.g.position.y += s.vy * dt; s.g.position.z += s.vz * dt;
    s.life -= dt;
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = e.g.position.x - s.g.position.x, dy = e.g.position.y - s.g.position.y, dz = e.g.position.z - s.g.position.z;
      if (dx * dx + dy * dy + dz * dz < (e.boss ? 16 : 9)) {
        e.hp -= s.dmg; hit = true;
        if (e.hp <= 0) {
          scene.remove(e.g); enemies.splice(j, 1);
          S.score += e.boss ? 200 : 12; S.qi += e.boss ? 40 : 4;
          if (e.boss) { S.bossDone = true; say('شاهێنەکە تێکشکا!', 3); } else say('ڕۆحێک تێکشکا +12', 0.8);
        }
        break;
      }
    }
    if (hit || s.life <= 0) { scene.remove(s.g); shots.splice(i, 1); }
  }

  // Orbs
  S.orbT -= dt;
  if (S.orbT <= 0) {
    const a = rand(0, Math.PI * 2), rad = rand(20, 90);
    const o = makeOrb(); o.position.set(player.position.x + Math.cos(a) * rad, FLY_Y + rand(-6, 10), player.position.z + Math.sin(a) * rad);
    orbs.push({ g: o }); S.orbT = rand(1.2, 2.4);
  }
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i]; o.g.rotation.y += dt * 2;
    const dx = player.position.x - o.g.position.x, dy = player.position.y - o.g.position.y, dz = player.position.z - o.g.position.z;
    if (dx * dx + dy * dy + dz * dz < 16) { S.qi += 5; S.score += 3; scene.remove(o.g); orbs.splice(i, 1); }
  }

  // Waves
  S.waveT -= dt;
  if (S.waveT <= 0 && !(S.boss && !S.bossDone)) {
    if (S.wave >= 5 && !S.boss) {
      S.boss = makeEnemy(true); S.boss.position.set(player.position.x, FLY_Y + 4, player.position.z - 70);
      enemies.push({ g: S.boss, hp: 60, boss: true });
      say('شاهێنێکی تاریک ده‌رهێنرا!', 3);
    } else {
      const count = 3 + S.wave * 2;
      for (let i = 0; i < count; i++) {
        const a = rand(0, Math.PI * 2);
        const e = makeEnemy(); e.position.set(player.position.x + Math.cos(a) * 55, FLY_Y + rand(-8, 12), player.position.z + Math.sin(a) * 55);
        enemies.push({ g: e, hp: 3, boss: false });
      }
      S.wave++; say(`قۆناغی ${S.wave}`, 1.5);
    }
    S.waveT = Math.max(3.5, 7 - S.wave * 0.6);
  }
  if (S.bossDone) { endGame(true); setHUD(); return; }

  // Realm progression
  while (S.realm < REALM_SCORE.length - 1 && S.score >= REALM_SCORE[S.realm + 1]) {
    S.realm++; S.hp = Math.min(S.maxHp, S.hp + 25);
    say(`پلە بۆ ${REALMS[S.realm]} به‌رز بووەوە!`, 2.2);
  }

  if (S.toastT > 0) S.toastT -= dt;
  setHUD();
}

function spawnShot(dx, dy, dz, dmg) {
  const g = makeProjectile(); g.position.copy(player.position);
  shots.push({ g, vx: dx * PROJ_SPEED, vy: dy * PROJ_SPEED, vz: dz * PROJ_SPEED, life: 2.2, dmg });
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
