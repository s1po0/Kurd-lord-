// Qi Orb — a glowing spirit-energy pearl the cultivator collects. Kiln asset source.
const meta = { name: 'Qi Orb', role: 'pickup' };

async function surfaces() {
  return {
    core: gameMaterial(0xffd24a),
    glow: gameMaterial(0xffe9a0),
  };
}

async function build() {
  const m = await surfaces();
  const root = createRoot('QiOrb');
  createPart('Core', sphereGeo(0.55, 24, 18), m.core, { parent: root, position: [0, 0, 0] });
  createPart('Halo', sphereGeo(0.85, 20, 16), m.glow, { parent: root, position: [0, 0, 0] });
  root.userData.orb = { radius: 0.85 };
  return root;
}

function animate() { return []; }
