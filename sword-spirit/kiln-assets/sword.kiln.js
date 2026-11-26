// Flying Sword — a jade-glow dao the cultivator rides. Kiln asset source.
// Only Kiln globals are used: createRoot, createPart, boxGeo, cylinderGeo,
// sphereGeo, gameMaterial. No imports/exports; rotation is in degrees.
const meta = { name: 'Flying Sword', role: 'prop' };

async function surfaces() {
  return {
    blade: gameMaterial(0xbfeaff),
    guard: gameMaterial(0xd8b25a),
    hilt:  gameMaterial(0x6b2f2a),
    glow:  gameMaterial(0x5be0ff),
  };
}

async function build() {
  const m = await surfaces();
  const root = createRoot('FlyingSword');
  createPart('Blade', boxGeo(0.18, 0.05, 4.2), m.blade, { parent: root, position: [0, 0, 0] });
  createPart('Tip', cylinderGeo(0, 0.09, 0.6, 4), m.blade, { parent: root, position: [0, 0, 2.4] });
  createPart('Guard', boxGeo(0.7, 0.08, 0.14), m.guard, { parent: root, position: [0, 0, -2.1] });
  createPart('Hilt', cylinderGeo(0.06, 0.06, 0.6, 12), m.hilt, { parent: root, position: [0, 0, -2.45], rotation: [90, 0, 0] });
  createPart('Pommel', sphereGeo(0.1, 12, 10), m.guard, { parent: root, position: [0, 0, -2.85] });
  createPart('Glow', sphereGeo(0.5, 16, 12), m.glow, { parent: root, position: [0, -0.12, 0] });
  root.userData.sword = { length: 4.8 };
  return root;
}

function animate() { return []; }
