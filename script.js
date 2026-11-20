
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

// ======================================
// GUM SPIT — BALCONY CLUB V3
// Animated pedestrians + low-poly city
// ======================================

const $ = id => document.getElementById(id);

// THREE.JS SETUP

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a8c9c7');
scene.fog = new THREE.FogExp2('#a8c9c7', 0.006);

const camera = new THREE.PerspectiveCamera(
  76,
  innerWidth / innerHeight,
  0.04,
  450
);

camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;

$('game').appendChild(renderer.domElement);

// LIGHTING

scene.add(
  new THREE.HemisphereLight(
    0xeaf5ec,
    0x73847a,
    2.5
  )
);

const sunlight = new THREE.DirectionalLight(
  0xffdfb3,
  3.2
);

sunlight.position.set(-28, 56, -24);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -65;
sunlight.shadow.camera.right = 65;
sunlight.shadow.camera.top = 65;
sunlight.shadow.camera.bottom = -65;
sunlight.shadow.normalBias = 0.035;

scene.add(sunlight);

// MATERIALS

const mat = (color, roughness = 0.95) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    flatShading: true
  });

const M = {
  cream: mat('#f2e5cb'),
  ivory: mat('#fff2d7'),
  cement: mat('#b8b4a5'),
  edge: mat('#e5d6ba'),
  brick: mat('#b9705d'),
  brick2: mat('#d29a78'),
  brick3: mat('#a87d77'),
  rail: mat('#364a4c', 0.65),
  metal: mat('#a3aba0', 0.5),
  glass: mat('#6d9ea4', 0.3),
  glass2: mat('#b5d4c9', 0.3),
  asphalt: mat('#66777a'),
  sidewalk: mat('#c8c5b4'),
  yellow: mat('#f1d17b'),
  grass: mat('#789c77'),
  leaves: mat('#739b7b'),
  leaves2: mat('#93ad81'),
  trunk: mat('#8b6b56'),
  green: mat('#578e78'),
  greenDark: mat('#355d50'),
  pink: mat('#e8a6a7'),
  skin: mat('#dba781'),
  sleeve: mat('#6f8d99'),
  gumPack: mat('#e5e9d8'),
  gumStripe: mat('#4d9a70'),
  carRed: mat('#c7796c'),
  carBlue: mat('#668b9a'),
  tire: mat('#3c4546'),
  white: mat('#f7f0df'),
  black: mat('#2c3d3d')
};

// GEOMETRY HELPERS

function cube(parent, w, h, d, material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  );

  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;

  parent.add(o);
  return o;
}

function cyl(
  parent,
  rTop,
  rBottom,
  h,
  material,
  x = 0,
  y = 0,
  z = 0,
  segments = 10
) {
  const o = new THREE.Mesh(
    new THREE.CylinderGeometry(
      rTop, rBottom, h, segments
    ),
    material
  );

  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;

  parent.add(o);
  return o;
}

function ball(
  parent,
  r,
  material,
  x = 0,
  y = 0,
  z = 0,
  detail = 0
) {
  const o = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, detail),
    material
  );

  o.position.set(x, y, z);
  o.castShadow = true;

  parent.add(o);
  return o;
}

function labelTexture(text, bg, fg) {
  const c = document.createElement('canvas');

  c.width = 512;
  c.height = 256;

  const ctx = c.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 92px Arial';

  ctx.fillText(text, 256, 132);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;

  return t;
}

// GROUPS

const city = new THREE.Group();
const balcony = new THREE.Group();
const trash = new THREE.Group();
const pedestrianGroup = new THREE.Group();

scene.add(
  city,
  balcony,
  trash,
  pedestrianGroup,
  camera
);

const hands = new THREE.Group();
camera.add(hands);

// ======================================
// CITY ENVIRONMENT
// ======================================

function random(seed) {
  const n =
    Math.sin(seed * 127.1 + 78.233) *
    43758.5453;

  return n - Math.floor(n);
}

function makeBuilding(x, z, w, d, h, material) {
  const g = new THREE.Group();

  g.position.set(x, 0, z);
  city.add(g);

  cube(g, w, h, d, material, 0, h / 2, 0);

  cube(
    g, w + 0.45, 0.45, d + 0.45,
    M.cream, 0, h + 0.1, 0
  );

  cube(
    g, w + 0.25, 0.4, d + 0.25,
    M.brick3, 0, h - 0.45, 0
  );

  for (let y = 3; y < h - 2; y += 3.9) {
    for (
      let xx = -w / 2 + 1.8;
      xx < w / 2 - 0.5;
      xx += 3.2
    ) {
      for (const side of [-1, 1]) {
        cube(
          g,
          1.65, 2.1, 0.08,
          ((y + xx) % 3 > 1
            ? M.glass2
            : M.glass),
          xx,
          y,
          side * (d / 2 + 0.05)
        );

        cube(
          g,
          1.95, 0.16, 0.36,
          M.cream,
          xx,
          y - 1.15,
          side * (d / 2 + 0.2)
        );

        cube(
          g,
          0.12, 2.1, 0.11,
          M.cream,
          xx,
          y,
          side * (d / 2 + 0.12)
        );
      }
    }
  }

  for (let i = 0; i < 2; i++) {
    const ax = -w / 4 + i * w / 2;

    cube(
      g, 1.6, 0.8, 1.5,
      M.metal, ax, h + 0.5, 0
    );

    cube(
      g, 1.35, 0.08, 1.3,
      M.rail, ax, h + 0.94, 0
    );
  }

  return g;
}

function makeTree(x, z, size = 1) {
  cyl(
    city,
    0.2 * size,
    0.32 * size,
    2.5 * size,
    M.trunk,
    x,
    1.25 * size,
    z,
    7
  );

  ball(
    city, 1.55 * size,
    M.leaves,
    x, 3.2 * size, z, 1
  );

  ball(
    city, 1.2 * size,
    M.leaves2,
    x - 0.65 * size,
    3.45 * size,
    z,
    1
  );

  ball(
    city, 1.15 * size,
    M.leaves,
    x + 0.65 * size,
    3.5 * size,
    z + 0.2 * size,
    1
  );
}

function makeCar(x, z, color) {
  const g = new THREE.Group();

  g.position.set(x, 0.1, z);
  city.add(g);

  cube(g, 3.3, 0.75, 1.6, color, 0, 0.67, 0);
  cube(g, 1.7, 0.75, 1.45, color, -0.1, 1.34, 0);

  cube(
    g, 1.4, 0.42, 0.035,
    M.glass2,
    -0.12, 1.37, -0.74
  );

  for (const dx of [-1.05, 1.05]) {
    for (const dz of [-0.85, 0.85]) {
      const wheel = cyl(
        g, 0.36, 0.36, 0.17,
        M.tire, dx, 0.38, dz, 12
      );

      wheel.rotation.x = Math.PI / 2;

      cyl(
        g, 0.14, 0.14, 0.18,
        M.metal, dx, 0.38, dz, 12
      ).rotation.x = Math.PI / 2;
    }
  }
}

function makeCity() {
  cube(city, 500, 0.6, 500, M.grass, 0, -0.35, -60);

  cube(city, 180, 0.14, 18, M.sidewalk, 0, 0, -14);
  cube(city, 180, 0.11, 25, M.asphalt, 0, -0.01, -36);
  cube(city, 180, 0.14, 14, M.sidewalk, 0, 0, -56);

  cube(city, 180, 0.18, 0.35, M.edge, 0, 0.08, -23.2);
  cube(city, 180, 0.18, 0.35, M.edge, 0, 0.08, -48.6);

  for (let x = -85; x < 85; x += 5) {
    cube(
      city, 0.04, 0.02, 18,
      M.cement, x, 0.09, -14
    );

    cube(
      city, 0.04, 0.02, 14,
      M.cement, x, 0.09, -56
    );
  }

  for (let x = -82; x < 85; x += 12) {
    cube(
      city, 5.2, 0.025, 0.17,
      M.yellow, x, 0.07, -36
    );
  }

  for (let i = -5; i <= 5; i++) {
    makeBuilding(
      i * 19,
      -83,
      16,
      15,
      20 + Math.floor(random(i + 11) * 17),
      [M.brick, M.brick2, M.brick3][Math.abs(i) % 3]
    );
  }

  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;

    makeBuilding(
      i * 21,
      23,
      18,
      14,
      18 + Math.floor(random(i + 40) * 16),
      [M.brick2, M.brick3, M.brick][Math.abs(i) % 3]
    );
  }

  for (let i = -7; i <= 7; i++) {
    if (Math.abs(i) < 2) continue;

    makeTree(
      i * 10.5,
      -7.2,
      0.75 + random(i + 100) * 0.3
    );
  }

  makeCar(-19, -29, M.carRed);
  makeCar(15, -42, M.carBlue);
  makeCar(39, -29, M.green);

  for (const x of [-31, -16, 18, 33]) {
    cube(
      city, 2.3, 0.55, 1.3,
      M.brick3, x, 0.3, -20
    );

    ball(
      city, 0.9,
      M.leaves2, x, 1.2, -20, 1
    );
  }

  for (const x of [-28, 27]) {
    cyl(
      city, 0.08, 0.1, 6.4,
      M.rail, x, 3.2, -23, 8
    );

    cube(
      city, 1.3, 0.18, 0.45,
      M.rail, x + 0.55, 6.4, -23
    );

    cube(
      city, 0.9, 0.05, 0.32,
      M.yellow, x + 0.6, 6.25, -23
    );
  }
}

// ======================================
// ANIMATED PEDESTRIANS
// ======================================

const pedestrians = [];

const pedestrianColors = [
  '#e5a36b',
  '#a5b7d2',
  '#d98986',
  '#e4cb82',
  '#83aa91',
  '#b7a1c8',
  '#d4a06f',
  '#8db5b1'
];

const skinColors = [
  '#f1c7a4',
  '#dba781',
  '#bb8065',
  '#8e5c49'
];

const hairColors = [
  '#42352e',
  '#6b4a37',
  '#b17d52',
  '#343c42'
];

function createPedestrian(x, z, direction, speed, index) {
  const person = new THREE.Group();

  const outfit = mat(
    pedestrianColors[index % pedestrianColors.length]
  );

  const pants = mat(
    index % 3 === 0
      ? '#596978'
      : index % 3 === 1
        ? '#827d72'
        : '#45575d'
  );

  const shoes = M.tire;
  const skin = mat(skinColors[index % skinColors.length]);
  const hairMat = mat(hairColors[index % hairColors.length]);

  // Torso
  cube(
    person,
    0.65, 0.85, 0.38,
    outfit,
    0, 1.35, 0
  );

  // Neck
  cyl(
    person,
    0.12, 0.12, 0.18,
    skin,
    0, 1.88, 0,
    8
  );

  // Oversized head
  const head = ball(
    person,
    0.35,
    skin,
    0, 2.17, 0,
    1
  );

  head.scale.set(1, 1.1, 0.9);

  // Chunky hair
  const hair = ball(
    person,
    0.36,
    hairMat,
    0, 2.37, -0.035,
    1
  );

  hair.scale.set(1, 0.46, 0.92);

  // Eyes
  const eyeMat = M.black;

  ball(
    person, 0.035,
    eyeMat, -0.12, 2.2, -0.31, 1
  );

  ball(
    person, 0.035,
    eyeMat, 0.12, 2.2, -0.31, 1
  );

  // Arms with shoulder pivots
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();

  leftArm.position.set(-0.43, 1.66, 0);
  rightArm.position.set(0.43, 1.66, 0);

  cube(
    leftArm, 0.22, 0.68, 0.25,
    outfit, 0, -0.34, 0
  );

  cube(
    rightArm, 0.22, 0.68, 0.25,
    outfit, 0, -0.34, 0
  );

  ball(
    leftArm, 0.105,
    skin, 0, -0.72, 0, 1
  );

  ball(
    rightArm, 0.105,
    skin, 0, -0.72, 0, 1
  );

  person.add(leftArm, rightArm);

  // Legs with hip pivots
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();

  leftLeg.position.set(-0.18, 0.95, 0);
  rightLeg.position.set(0.18, 0.95, 0);

  cube(
    leftLeg, 0.25, 0.82, 0.28,
    pants, 0, -0.41, 0
  );

  cube(
    rightLeg, 0.25, 0.82, 0.28,
    pants, 0, -0.41, 0
  );

  cube(
    leftLeg, 0.29, 0.16, 0.42,
    shoes, 0, -0.83, -0.08
  );

  cube(
    rightLeg, 0.29, 0.16, 0.42,
    shoes, 0, -0.83, -0.08
  );

  person.add(leftLeg, rightLeg);

  // Optional backpack
  if (index % 4 === 0) {
    cube(
      person, 0.5, 0.65, 0.22,
      M.greenDark,
      0, 1.35, 0.3
    );
  }

  // Optional hat
  if (index % 5 === 0) {
    cyl(
      person,
      0.38, 0.38, 0.15,
      M.cream,
      0, 2.5, 0,
      10
    );
  }

  person.position.set(x, 0.1, z);

  // Characters face their walking direction.
  // Their modeled faces point toward -Z.
  person.rotation.y =
    direction > 0
      ? -Math.PI / 2
      : Math.PI / 2;

  pedestrianGroup.add(person);

  pedestrians.push({
    person,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    direction,
    speed,
    walkTime: random(index + 300) * Math.PI * 2,
    baseZ: z
  });
}

function createPedestrians() {
  pedestrianGroup.clear();
  pedestrians.length = 0;

  // Near sidewalk — visible below balcony
  for (let i = 0; i < 10; i++) {
    const direction = i % 2 === 0 ? 1 : -1;

    createPedestrian(
      -62 + i * 13.5,
      -10 - (i % 3) * 2,
      direction,
      0.9 + random(i + 200) * 1.1,
      i
    );
  }

  // Opposite sidewalk
  for (let i = 0; i < 8; i++) {
    const direction = i % 2 === 0 ? -1 : 1;

    createPedestrian(
      -58 + i * 17,
      -53 - (i % 2) * 2,
      direction,
      0.9 + random(i + 500) * 1.2,
      i + 10
    );
  }
}

function updatePedestrians(dt) {
  for (const p of pedestrians) {
    p.walkTime += dt * p.speed * 5;

    // Walk along the sidewalk
    p.person.position.x +=
      p.direction * p.speed * dt;

    // Wrap around when off-screen
    if (p.person.position.x > 85) {
      p.person.position.x = -85;
    }

    if (p.person.position.x < -85) {
      p.person.position.x = 85;
    }

    // Cartoon walking cycle
    const step = Math.sin(p.walkTime);

    p.leftLeg.rotation.x = step * 0.55;
    p.rightLeg.rotation.x = -step * 0.55;

    p.leftArm.rotation.x = -step * 0.45;
    p.rightArm.rotation.x = step * 0.45;

    // Little bouncing motion
    p.person.position.y =
      0.1 + Math.abs(step) * 0.045;

    // Slight body lean
    p.person.rotation.z =
      Math.sin(p.walkTime * 0.5) * 0.025;
  }
}

// ======================================
// GAME STATE
// ======================================

let floor = 1;
let score = 0;
let wind = 0;
let power = 60;
let height = 12;

let state = 'idle';
let introTime = 0;
let yaw = 0;
let pitch = -0.2;
let locked = false;

let projectile = null;
let flightTime = 0;

const velocity = new THREE.Vector3();
const previous = new THREE.Vector3();
const target = new THREE.Vector3();

const START_Z = 1.35;
const EDGE_Z = -4.66;
const RAIL_Z = -4.02;

let pack;
let flap;
let stick;
let rightHand;
let leftHand;
let chewGum;

// ======================================
// BALCONY
// ======================================

function makeBalcony() {
  balcony.clear();

  const ground = height - 1.65;

  cube(
    balcony, 32, 100, 11,
    M.brick,
    0, ground - 14, 9.2
  );

  cube(
    balcony, 8.6, 0.32, 6.3,
    M.cement,
    0, ground - 0.2, -1.05
  );

  cube(
    balcony, 8.8, 0.13, 0.3,
    M.edge,
    0, ground - 0.08, -4.12
  );

  cube(
    balcony, 8.6, 0.15, 0.14,
    M.rail,
    0, ground + 1.1, RAIL_Z
  );

  cube(
    balcony, 8.6, 0.09, 0.11,
    M.rail,
    0, ground + 0.45, RAIL_Z
  );

  for (let x = -4.1; x <= 4.2; x += 0.65) {
    cube(
      balcony, 0.085, 1.15, 0.085,
      M.rail,
      x, ground + 0.58, RAIL_Z
    );
  }

  for (const side of [-1, 1]) {
    cube(
      balcony, 0.14, 0.15, 6.3,
      M.rail,
      side * 4.25,
      ground + 1.1,
      -1.05
    );

    for (let z = -3.9; z < 2; z += 0.75) {
      cube(
        balcony, 0.085, 1.15, 0.085,
        M.rail,
        side * 4.25,
        ground + 0.58,
        z
      );
    }
  }

  // Apartment door
  cube(
    balcony, 3.5, 4.5, 0.3,
    M.cream,
    0, ground + 2.15, 3.65
  );

  cube(
    balcony, 2.7, 3.9, 0.08,
    M.glass,
    0, ground + 2.1, 3.47
  );

  cube(
    balcony, 0.12, 3.9, 0.15,
    M.cream,
    0, ground + 2.1, 3.38
  );

  cube(
    balcony, 0.17, 0.17, 0.16,
    M.metal,
    1.0, ground + 1.9, 3.3
  );

  // Small table
  cube(
    balcony, 1.0, 0.12, 0.7,
    M.cream,
    -3.15, ground + 0.65, 0.3
  );

  for (const dx of [-0.37, 0.37]) {
    for (const dz of [-0.24, 0.24]) {
      cube(
        balcony, 0.1, 0.62, 0.1,
        M.trunk,
        -3.15 + dx,
        ground + 0.31,
        0.3 + dz
      );
    }
  }

  // Plant pot
  cyl(
    balcony, 0.44, 0.34, 0.55,
    M.brick3,
    3.1, ground + 0.28, 0.6, 9
  );

  ball(
    balcony, 0.55,
    M.leaves2,
    3.1, ground + 0.86, 0.6, 1
  );
}

// ======================================
// TRASH CAN
// ======================================

function makeTrash() {
  trash.clear();
  trash.position.copy(target);

  cyl(
    trash, 0.7, 0.55, 1.35,
    M.green,
    0, 0.675, 0, 12
  );

  cyl(
    trash, 0.59, 0.59, 0.035,
    M.greenDark,
    0, 1.37, 0, 16
  );

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.66, 0.07, 8, 28
    ),
    M.metal
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.4;

  trash.add(rim);

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;

    cube(
      trash, 0.045, 0.95, 0.045,
      M.greenDark,
      Math.cos(a) * 0.6,
      0.67,
      Math.sin(a) * 0.6
    );
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.86, 0.035, 7, 32
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffd780,
      transparent: true,
      opacity: 0.8
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.72;
  ring.name = 'targetRing';

  trash.add(ring);

  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.28),
    new THREE.MeshBasicMaterial({
      map: labelTexture(
        'BIN',
        '#e8e2c8',
        '#365d50'
      ),
      side: THREE.DoubleSide
    })
  );

  sticker.position.set(0, 0.85, 0.61);
  trash.add(sticker);
}

// ======================================
// FIRST-PERSON HANDS AND GUM
// ======================================

function makeHands() {
  hands.clear();

  const palmGeo = new THREE.SphereGeometry(
    0.16, 10, 8
  );

  function hand(side) {
    const group = new THREE.Group();

    group.position.set(
      side * 0.42,
      -0.48,
      -0.64
    );

    hands.add(group);

    const arm = cyl(
      group,
      0.12, 0.15, 0.42,
      M.sleeve,
      side * 0.03,
      -0.27,
      0,
      9
    );

    arm.rotation.z = side * 0.25;

    const palm = new THREE.Mesh(
      palmGeo,
      M.skin
    );

    palm.scale.set(0.9, 1.2, 0.55);
    group.add(palm);

    for (let i = 0; i < 4; i++) {
      const finger = cyl(
        group,
        0.035,
        0.043,
        0.18 - i * 0.012,
        M.skin,
        side * 0.04 + (i - 1.5) * 0.075,
        0.14,
        -0.04,
        7
      );

      finger.rotation.z = (i - 1.5) * 0.1;
    }

    return group;
  }

  leftHand = hand(-1);
  rightHand = hand(1);

  // Gum pack
  pack = new THREE.Group();
  pack.position.set(-0.03, -0.3, -0.76);
  hands.add(pack);

  cube(
    pack, 0.74, 0.36, 0.16,
    M.gumPack
  );

  cube(
    pack, 0.75, 0.085, 0.17,
    M.gumStripe,
    0, 0.13, 0
  );

  cube(
    pack, 0.75, 0.075, 0.17,
    M.gumStripe,
    0, -0.14, 0
  );

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.18),
    new THREE.MeshBasicMaterial({
      map: labelTexture(
        'GUM',
        '#e5e9d8',
        '#2f624b'
      )
    })
  );

  face.position.set(0, 0, 0.088);
  pack.add(face);

  // Flap
  flap = new THREE.Group();
  flap.position.set(0, 0.18, -0.04);
  pack.add(flap);

  cube(
    flap, 0.74, 0.19, 0.035,
    M.gumPack,
    0, 0.09, 0
  );

  // Wrapped sticks
  for (let i = 0; i < 5; i++) {
    cube(
      pack, 0.105, 0.25, 0.04,
      M.ivory,
      -0.25 + i * 0.125,
      0.015,
      -0.12
    );
  }

  // Pulled stick
  stick = new THREE.Group();
  pack.add(stick);

  stick.position.set(0.1, 0.02, -0.18);

  cube(
    stick, 0.115, 0.28, 0.05,
    M.ivory
  );

  cube(
    stick, 0.115, 0.055, 0.052,
    M.metal,
    0, 0.1, 0
  );

  chewGum = ball(
    hands,
    0.08,
    M.pink,
    0, -0.1, -0.48, 1
  );

  chewGum.visible = false;
}

// ======================================
// HUD AND CAMERA
// ======================================

function updateHud() {
  $('floor').textContent = floor;
  $('score').textContent = score;

  $('wind').textContent =
    (wind >= 0 ? '+' : '') +
    wind.toFixed(1);

  $('powerText').textContent =
    power + '%';

  $('powerFill').style.width =
    power + '%';
}

function message(text) {
  $('message').textContent = text;
}

function angles() {
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function targetAngles() {
  const d = target.clone()
    .add(new THREE.Vector3(0, 1.35, 0))
    .sub(camera.position)
    .normalize();

  return {
    yaw: Math.atan2(-d.x, -d.z),
    pitch: Math.asin(d.y)
  };
}

function smooth(x) {
  x = THREE.MathUtils.clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
}

// ======================================
// LEVEL SETUP
// ======================================

function resetLevel() {
  height = 12 + (floor - 1) * 6;
  power = 60;

  wind =
    (Math.random() - 0.5) *
    Math.min(0.5 * floor, 3);

  target.set(
    (Math.random() - 0.5) * 3,
    0,
    -12.0 - Math.random() * 1.8
  );

  camera.position.set(
    0,
    height,
    START_Z
  );

  yaw = 0;
  pitch = -0.16;
  angles();

  if (projectile) {
    scene.remove(projectile);
    projectile.geometry.dispose();
    projectile = null;
  }

  makeBalcony();
  makeTrash();
  makeHands();

  hands.visible = true;

  $('crosshair').classList.add('hidden');
  $('powerHud').classList.add('hidden');

  state = 'intro';
  introTime = 0;

  message('UNWRAPPING THE GUM…');
  updateHud();
}

// START BUTTON

$('startButton').addEventListener('click', () => {
  if (state !== 'idle') return;

  $('startScreen').classList.add('hidden');
  $('hud').classList.remove('hidden');

  resetLevel();
});

// ======================================
// AUTOMATIC FOUR-SECOND INTRO
// ======================================

function updateIntro(dt) {
  if (state !== 'intro') return;

  introTime += dt;

  const t = introTime;

  // OPEN PACK
  if (t < 0.8) {
    message('UNWRAPPING THE GUM…');

    flap.rotation.x =
      -2.45 * smooth(t / 0.7);

    pack.rotation.z =
      Math.sin(t * 8) * 0.06;

    leftHand.rotation.z =
      -0.08 * Math.sin(t * 8);
  }

  // REMOVE STICK
  else if (t < 1.4) {
    message('ONE FRESH STICK…');

    const p = smooth(
      (t - 0.8) / 0.6
    );

    stick.position.set(
      0.1 + p * 0.18,
      0.02 + p * 0.37,
      -0.18 + p * 0.16
    );

    rightHand.position.y =
      -0.48 + p * 0.24;

    pack.rotation.z = -0.07;
  }

  // CHEW
  else if (t < 2.0) {
    message('CHOMP CHOMP…');

    const p = smooth(
      (t - 1.4) / 0.6
    );

    pack.position.y =
      -0.3 - p * 0.6;

    rightHand.position.set(
      0.42 - p * 0.35,
      -0.24 + p * 0.13,
      -0.64 - p * 0.12
    );

    chewGum.visible = true;

    chewGum.scale.setScalar(
      1 + Math.sin(t * 26) * 0.12
    );

    chewGum.position.y =
      -0.13 + p * 0.2;
  }

  // WALK TO EDGE
  else if (t < 3.5) {
    message('TO THE BALCONY…');

    hands.visible = false;

    const p = smooth(
      (t - 2) / 1.5
    );

    camera.position.z =
      THREE.MathUtils.lerp(
        START_Z,
        EDGE_Z,
        p
      );

    camera.position.y =
      height +
      Math.sin((t - 2) * 17) *
      0.038 * (1 - p);

    pitch =
      THREE.MathUtils.lerp(
        -0.16,
        -0.48,
        p
      );

    angles();
  }

  // LOOK DOWN
  else if (t < 4.0) {
    message('THERE IT IS…');

    camera.position.set(
      0,
      height,
      EDGE_Z
    );

    const aim = targetAngles();

    const p = smooth(
      (t - 3.5) / 0.5
    );

    yaw = THREE.MathUtils.lerp(
      0,
      aim.yaw,
      p
    );

    pitch = THREE.MathUtils.lerp(
      -0.48,
      aim.pitch,
      p
    );

    angles();
  }

  // AIMING MODE
  else {
    camera.position.set(
      0,
      height,
      EDGE_Z
    );

    const aim = targetAngles();

    yaw = aim.yaw;
    pitch = aim.pitch;

    angles();

    state = 'aiming';

    $('crosshair').classList.remove('hidden');
    $('powerHud').classList.remove('hidden');

    message(
      'CLICK TO AIM · THEN CLICK TO SPIT'
    );
  }
}

// ======================================
// AIMING CONTROLS
// ======================================

function lockMouse() {
  if (
    document.pointerLockElement ===
    renderer.domElement
  ) return;

  const promise =
    renderer.domElement.requestPointerLock?.();

  if (promise && typeof promise.catch === 'function') {
    promise.catch(() => {});
  }
}

document.addEventListener(
  'pointerlockchange',
  () => {
    locked =
      document.pointerLockElement ===
      renderer.domElement;

    if (state === 'aiming' && !locked) {
      message(
        'CLICK TO AIM · THEN CLICK TO SPIT'
      );
    }
  }
);

document.addEventListener('mousemove', e => {
  if (!locked || state !== 'aiming') return;

  yaw = THREE.MathUtils.clamp(
    yaw - e.movementX * 0.0022,
    -1.35,
    1.35
  );

  pitch = THREE.MathUtils.clamp(
    pitch - e.movementY * 0.0022,
    -1.54,
    0.35
  );

  angles();
});

document.addEventListener(
  'wheel',
  e => {
    if (state !== 'aiming') return;

    power = THREE.MathUtils.clamp(
      power + (e.deltaY > 0 ? -3 : 3),
      10,
      100
    );

    updateHud();
  },
  { passive: true }
);

document.addEventListener('keydown', e => {
  if (state !== 'aiming') return;

  if ([
    'Space',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight'
  ].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === 'Space') {
    spit();
  }

  if (e.code === 'KeyW') {
    power = Math.min(100, power + 3);
  }

  if (e.code === 'KeyS') {
    power = Math.max(10, power - 3);
  }

  if (e.code === 'ArrowLeft') yaw += 0.035;
  if (e.code === 'ArrowRight') yaw -= 0.035;
  if (e.code === 'ArrowUp') pitch += 0.035;
  if (e.code === 'ArrowDown') pitch -= 0.035;

  pitch = THREE.MathUtils.clamp(
    pitch,
    -1.54,
    0.35
  );

  angles();
  updateHud();
});

renderer.domElement.addEventListener(
  'mousedown',
  e => {
    if (
      e.button !== 0 ||
      state !== 'aiming'
    ) return;

    if (!locked) {
      lockMouse();
      message('MOUSE TO AIM · CLICK TO SPIT');
    } else {
      spit();
    }
  }
);

// ======================================
// SPIT GUM
// ======================================

function spit() {
  if (state !== 'aiming') return;

  state = 'flying';
  flightTime = 0;

  const d = new THREE.Vector3();
  camera.getWorldDirection(d);

  velocity.copy(d).multiplyScalar(
    5 + power * 0.24
  );

  projectile = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.14, 1),
    M.pink
  );

  projectile.scale.set(1.2, 0.65, 0.95);

  projectile.position
    .copy(camera.position)
    .addScaledVector(d, 0.75);

  projectile.position.y -= 0.12;
  projectile.castShadow = true;

  scene.add(projectile);

  message('BON VOYAGE, GUM!');
}

// ======================================
// PROJECTILE PHYSICS
// ======================================

function updateFlight(dt) {
  if (
    state !== 'flying' ||
    !projectile
  ) return;

  flightTime += dt;
  previous.copy(projectile.position);

  velocity.y -= 9.81 * dt;
  velocity.x += wind * dt;

  projectile.position.addScaledVector(
    velocity,
    dt
  );

  projectile.rotation.x += dt * 6;
  projectile.rotation.z += dt * 4;

  const y = 1.38;

  if (
    previous.y > y &&
    projectile.position.y <= y &&
    velocity.y < 0
  ) {
    const p =
      (previous.y - y) /
      (previous.y - projectile.position.y);

    const x = THREE.MathUtils.lerp(
      previous.x,
      projectile.position.x,
      p
    );

    const z = THREE.MathUtils.lerp(
      previous.z,
      projectile.position.z,
      p
    );

    if (
      Math.hypot(
        x - target.x,
        z - target.z
      ) < 0.55
    ) {
      finish(true);
      return;
    }
  }

  if (
    projectile.position.y <= 0 ||
    flightTime > 12
  ) {
    finish(false);
  }
}

// ======================================
// RESULTS
// ======================================

function finish(hit) {
  state = hit ? 'success' : 'miss';

  if (
    document.pointerLockElement ===
    renderer.domElement
  ) {
    document.exitPointerLock();
  }

  if (hit) {
    score += floor * 100;
  }

  updateHud();

  $('resultEyebrow').textContent =
    hit
      ? 'ABSOLUTE LEGEND'
      : 'SO CLOSE (MAYBE)';

  $('resultTitle').textContent =
    hit
      ? 'DIRECT HIT!'
      : 'SPLAT!';

  $('resultDescription').textContent =
    hit
      ? `+${floor * 100} points! The next balcony is higher.`
      : 'Missed the can. Adjust your angle and power.';

  $('resultButton').textContent =
    hit
      ? 'NEXT FLOOR'
      : 'TRY AGAIN';

  $('resultScreen').classList.remove('hidden');
}

// NEXT FLOOR / RETRY

$('resultButton').addEventListener(
  'click',
  () => {
    $('resultScreen').classList.add('hidden');

    if (state === 'success') {
      floor++;
      resetLevel();
      return;
    }

    if (state === 'miss') {
      if (projectile) {
        scene.remove(projectile);
        projectile.geometry.dispose();
        projectile = null;
      }

      state = 'aiming';

      message(
        'CLICK TO AIM · THEN CLICK TO SPIT'
      );
    }
  }
);

// ======================================
// ANIMATION LOOP
// ======================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(
    clock.getDelta(),
    0.033
  );

  updateIntro(dt);
  updateFlight(dt);
  updatePedestrians(dt);

  const ring = trash.getObjectByName(
    'targetRing'
  );

  if (ring) {
    ring.position.y =
      1.72 +
      Math.sin(
        clock.elapsedTime * 2.2
      ) * 0.09;
  }

  renderer.render(scene, camera);
}

// RESIZE

window.addEventListener('resize', () => {
  camera.aspect =
    innerWidth / innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );
});

// ======================================
// INITIALIZE
// ======================================

makeCity();
createPedestrians();

height = 12;
target.set(0, 0, -13);

camera.position.set(
  0,
  height,
  START_Z
);

makeBalcony();
makeTrash();
makeHands();

hands.visible = false;

yaw = 0;
pitch = -0.16;

angles();
updateHud();

state = 'idle';

animate();
