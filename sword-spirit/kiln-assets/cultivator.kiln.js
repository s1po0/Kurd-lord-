// Cultivator — a robed sword-immortal standing on a flying sword. Kiln asset source.
const meta = { name: 'Cultivator', role: 'character' };

async function surfaces() {
  return {
    robe:  gameMaterial(0x2f6f6b),
    robe2: gameMaterial(0x9fe6d6),
    skin:  gameMaterial(0xf0c9a0),
    sword: gameMaterial(0xbfeaff),
    sash:  gameMaterial(0xd84f6a),
  };
}

async function build() {
  const m = await surfaces();
  const root = createRoot('Cultivator');
  // flying sword beneath the feet
  createPart('Mount', boxGeo(0.16, 0.05, 3.6), m.sword, { parent: root, position: [0, -1.55, 0] });
  // robe (tapered body)
  createPart('Robe', cylinderGeo(0.55, 0.95, 2.2, 16), m.robe, { parent: root, position: [0, -0.35, 0] });
  // sash
  createPart('Sash', cylinderGeo(0.97, 0.97, 0.22, 16), m.sash, { parent: root, position: [0, 0.25, 0] });
  // shoulders
  createPart('Shoulders', cylinderGeo(0.62, 0.55, 0.5, 16), m.robe2, { parent: root, position: [0, 0.7, 0] });
  // head + top-knot
  createPart('Head', sphereGeo(0.42, 18, 16), m.skin, { parent: root, position: [0, 1.25, 0] });
  createPart('Topknot', cylinderGeo(0.12, 0.16, 0.3, 12), m.robe, { parent: root, position: [0, 1.7, 0] });
  // sleeves
  createPart('SleeveL', cylinderGeo(0.16, 0.22, 1.1, 12), m.robe, { parent: root, position: [-0.7, 0.1, 0], rotation: [0, 0, 18] });
  createPart('SleeveR', cylinderGeo(0.16, 0.22, 1.1, 12), m.robe, { parent: root, position: [0.7, 0.1, 0], rotation: [0, 0, -18] });
  root.userData.cultivator = { height: 2.6 };
  return root;
}

function animate() { return []; }
