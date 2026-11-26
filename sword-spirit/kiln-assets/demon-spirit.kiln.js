// Demon Spirit — a malevolent wraith the cultivator fights. Kiln asset source.
const meta = { name: 'Demon Spirit', role: 'enemy' };

async function surfaces() {
  return {
    body:  gameMaterial(0x7a1f2b),
    ghost: gameMaterial(0x3a0d18),
    horn:  gameMaterial(0xe8c46a),
    eye:   gameMaterial(0xff3b3b),
  };
}

async function build() {
  const m = await surfaces();
  const root = createRoot('DemonSpirit');
  // wispy tail
  createPart('Tail', cylinderGeo(0.1, 0.7, 2.2, 14), m.ghost, { parent: root, position: [0, -1.4, 0] });
  // torso
  createPart('Body', sphereGeo(0.85, 20, 18), m.body, { parent: root, position: [0, 0, 0] });
  // head
  createPart('Head', sphereGeo(0.55, 18, 16), m.body, { parent: root, position: [0, 0.95, 0] });
  // horns (tapered cylinders = cones)
  createPart('HornL', cylinderGeo(0, 0.12, 0.7, 8), m.horn, { parent: root, position: [-0.3, 1.4, 0], rotation: [0, 0, 30] });
  createPart('HornR', cylinderGeo(0, 0.12, 0.7, 8), m.horn, { parent: root, position: [0.3, 1.4, 0], rotation: [0, 0, -30] });
  // eyes
  createPart('EyeL', sphereGeo(0.1, 10, 10), m.eye, { parent: root, position: [-0.2, 1.0, 0.45] });
  createPart('EyeR', sphereGeo(0.1, 10, 10), m.eye, { parent: root, position: [0.2, 1.0, 0.45] });
  // ragged arms
  createPart('ArmL', cylinderGeo(0.12, 0.18, 1.3, 14), m.body, { parent: root, position: [-0.8, 0.1, 0], rotation: [0, 0, 25] });
  createPart('ArmR', cylinderGeo(0.12, 0.18, 1.3, 14), m.body, { parent: root, position: [0.8, 0.1, 0], rotation: [0, 0, -25] });
  root.userData.demon = { radius: 1.0 };
  return root;
}

function animate() { return []; }
