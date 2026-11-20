
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ==================================================
// GUM SPIT V6 — MINIATURE CITY + THREE SHOT SYSTEM
// ==================================================

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#8bbfba");
scene.fog = new THREE.Fog("#8bbfba", 105, 260);

const camera = new THREE.PerspectiveCamera(
  76,
  window.innerWidth / window.innerHeight,
  0.04,
  500
);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;

$("game").appendChild(renderer.domElement);

// ==================================================
// LIGHTING
// ==================================================

scene.add(
  new THREE.HemisphereLight(0xfff4db, 0x668e83, 2.6)
);

const sun = new THREE.DirectionalLight(0xffe3b7, 3.2);
sun.position.set(-35, 65, -28);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90;
sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 180;
sun.shadow.normalBias = 0.035;
sun.shadow.radius = 3;
scene.add(sun);

// ==================================================
// MATERIALS
// ==================================================

const mat = (color, roughness = 0.88) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0
  });

const M = {
  grass: mat("#9ed46c"),
  grassLight: mat("#b4dd7f"),
  grassDark: mat("#78b568"),
  road: mat("#777476"),
  sidewalk: mat("#e4e4c9"),
  curb: mat("#c5c8ad"),
  white: mat("#fff1d9"),
  cream: mat("#f1dec0"),
  tan: mat("#dfb78a"),
  peach: mat("#edba92"),
  coral: mat("#d97f65"),
  red: mat("#e65f54"),
  yellow: mat("#f2ca72"),
  teal: mat("#39b9a7"),
  turquoise: mat("#1dd1bd"),
  blue: mat("#6e9bb3"),
  darkBlue: mat("#3e617a"),
  lavender: mat("#b6a6c7"),
  roof: mat("#a76e58"),
  glass: mat("#76b3b7", 0.35),
  glassLight: mat("#c1e4d6", 0.35),
  windowDark: mat("#3b6c75"),
  tree: mat("#4b9c56"),
  treeLight: mat("#80c46a"),
  treeDark: mat("#377c4b"),
  trunk: mat("#9c7653"),
  metal: mat("#617a7b"),
  metalLight: mat("#b3c1b6"),
  tire: mat("#354449"),
  skin: mat("#e4af8d"),
  gum: mat("#ee8f9b"),
  gumWrapper: mat("#f9edcb"),
  gumGreen: mat("#61b48b")
};

const shirts = [
  M.coral, M.yellow, M.blue,
  M.treeLight, M.lavender, M.peach
];

const skins = [
  mat("#f1c9a8"),
  mat("#dfa784"),
  mat("#bd8065"),
  mat("#8b5a49")
];

const hairs = [
  mat("#423935"),
  mat("#805941"),
  mat("#b58a56"),
  mat("#3b4c55")
];

// ==================================================
// GEOMETRY HELPERS
// ==================================================

const geometryCache = new Map();

function rounded(w, h, d, radius = 0.1) {
  const r = Math.min(
    radius,
    w * 0.45,
    h * 0.45,
    d * 0.45
  );

  const key = `${w}:${h}:${d}:${r}`;

  if (!geometryCache.has(key)) {
    geometryCache.set(
      key,
      new RoundedBoxGeometry(w, h, d, 3, r)
    );
  }

  return geometryCache.get(key);
}

function box(
  parent, w, h, d, material,
  x = 0, y = 0, z = 0, radius = 0.1
) {
  const mesh = new THREE.Mesh(
    rounded(w, h, d, radius),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent, rt, rb, h, material,
  x = 0, y = 0, z = 0, sides = 12
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, sides),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(
  parent, r, material,
  x = 0, y = 0, z = 0
) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 16, 12),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cone(
  parent, radius, height, material,
  x = 0, y = 0, z = 0
) {
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 5),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function seeded(n) {
  const x = Math.sin(n * 127.1 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function labelTexture(text, bg, fg) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = fg;
  ctx.font = "bold 86px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 130);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ==================================================
// WORLD GROUPS
// ==================================================

const world = new THREE.Group();
const balcony = new THREE.Group();
const bin = new THREE.Group();
const peopleGroup = new THREE.Group();
const hands = new THREE.Group();

scene.add(world, balcony, bin, peopleGroup, camera);
camera.add(hands);

// ==================================================
// CITY STREETS
// ==================================================

function road(x, z, w, d) {
  box(world, w, 0.12, d, M.road, x, 0.02, z);
}

function pavement(x, z, w, d) {
  box(world, w, 0.32, d, M.sidewalk, x, 0.16, z);
}

function grass(x, z, w, d) {
  box(world, w, 0.36, d, M.grassLight, x, 0.2, z);
}

function stripe(x, z, w, d) {
  box(world, w, 0.025, d, M.cream, x, 0.1, z);
}

function makeRoads() {
  box(world, 350, 0.4, 350, M.grass, 0, -0.3, -65);

  road(0, -34, 190, 20);
  road(0, -84, 190, 17);
  road(-39, -65, 16, 100);
  road(39, -65, 16, 100);

  pavement(0, -17, 190, 14);
  pavement(0, -51, 190, 12);

  for (const x of [-64, 0, 64]) {
    pavement(x, -67, x === 0 ? 53 : 34, 21);
    pavement(x, -104, x === 0 ? 53 : 34, 20);
  }

  for (let x = -90; x <= 90; x += 12) {
    stripe(x, -34, 5, 0.2);
    stripe(x, -84, 5, 0.2);
  }

  for (const cx of [-39, 39]) {
    for (const cz of [-34, -84]) {
      for (let i = -3; i <= 3; i++) {
        stripe(cx + i * 1.25, cz - 7, 0.7, 3.4);
      }
    }
  }
}

// ==================================================
// BUILDINGS
// ==================================================

function building(
  x, z, w, d, h,
  wall, roof,
  shop = false,
  seed = 0
) {
  const g = new THREE.Group();
  g.position.set(x, 0.34, z);
  world.add(g);

  box(g, w, h, d, wall, 0, h / 2, 0, 0.22);
  box(
    g, w + 0.5, 0.42, d + 0.5,
    roof, 0, h + 0.15, 0
  );

  if (h > 12) {
    box(
      g, 2, 0.75, 1.8,
      M.cream, -w * 0.2, h + 0.7, 0
    );
  }

  for (let y = 3.4; y < h - 1; y += 3.2) {
    for (
      let xx = -w / 2 + 1.7;
      xx <= w / 2 - 1.3;
      xx += 2.8
    ) {
      const lit =
        seeded(seed + xx * 3 + y) > 0.72;

      box(
        g, 1.25, 1.65, 0.12,
        lit ? M.yellow : M.windowDark,
        xx, y, -d / 2 - 0.08
      );

      box(
        g, 1.5, 0.17, 0.34,
        M.cream,
        xx, y - 0.9, -d / 2 - 0.2
      );
    }
  }

  if (shop) {
    box(
      g, w - 1, 2.9, 0.18,
      M.glass, 0, 1.7, -d / 2 - 0.12
    );

    box(
      g, 1.4, 2.6, 0.2,
      M.darkBlue, 0, 1.45, -d / 2 - 0.26
    );

    const awning = new THREE.Group();
    awning.position.set(0, 3.25, -d / 2 - 1);
    g.add(awning);

    box(
      awning, w + 0.25, 0.22, 2,
      M.cream
    );

    const count = Math.max(4, Math.round(w / 1.1));
    const width = w / count;

    for (let i = 0; i < count; i += 2) {
      box(
        awning, width, 0.24, 2.02,
        roof,
        -w / 2 + width * (i + 0.5),
        0.015, 0
      );
    }

    box(
      g, w - 0.8, 0.62, 0.22,
      roof, 0, 4.15, -d / 2 - 0.15
    );
  } else {
    box(
      g, 1.6, 2.5, 0.16,
      M.darkBlue, 0, 1.32, -d / 2 - 0.14
    );
  }
}

function house(x, z, color) {
  const g = new THREE.Group();
  g.position.set(x, 0.34, z);
  world.add(g);

  box(g, 8, 5.8, 7, color, 0, 2.9, 0);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(6.2, 3.2, 4),
    M.roof
  );

  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.8;
  roof.position.y = 7.2;
  roof.castShadow = true;
  g.add(roof);

  box(
    g, 1.7, 2.5, 0.14,
    M.darkBlue, 0, 1.35, -3.58
  );

  for (const xx of [-2.3, 2.3]) {
    box(
      g, 1.25, 1.4, 0.15,
      M.glassLight, xx, 3.65, -3.58
    );
  }
}

// ==================================================
// TREES, PARKS AND DECORATIONS
// ==================================================

function tree(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.35, z);
  g.scale.setScalar(scale);
  world.add(g);

  cylinder(g, 0.24, 0.32, 2, M.trunk, 0, 1, 0);
  cone(g, 1.4, 3.2, M.treeDark, 0, 3.1, 0);
  cone(g, 1.12, 2.7, M.tree, 0, 4, 0);
  cone(g, 0.8, 2.2, M.treeLight, 0, 4.8, 0);
}

function bush(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.5, z);
  g.scale.setScalar(scale);
  world.add(g);

  for (let i = 0; i < 3; i++) {
    box(
      g, 0.9, 0.85, 0.9,
      i % 2 ? M.tree : M.treeDark,
      (i - 1) * 0.65,
      0.3 + (i % 2) * 0.2,
      0
    );
  }
}

function bench(x, z, rotation = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.4, z);
  g.rotation.y = rotation;
  world.add(g);

  box(g, 2.6, 0.18, 0.75, M.roof, 0, 0.75, 0);
  box(g, 2.6, 0.85, 0.16, M.roof, 0, 1.23, 0.32);

  for (const xx of [-1, 1]) {
    box(g, 0.13, 0.7, 0.13, M.metal, xx, 0.35, 0);
  }
}

function fountain(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.36, z);
  world.add(g);

  box(g, 10, 1.2, 10, M.cream, 0, 0.6, 0);
  box(g, 8.3, 0.08, 8.3, M.turquoise, 0, 1.23, 0);

  cylinder(g, 0.7, 0.9, 1.8, M.white, 0, 2.1, 0);
  cylinder(g, 1.45, 1.15, 0.4, M.white, 0, 3.05, 0);
  sphere(g, 0.45, M.turquoise, 0, 3.45, 0);
}

function park(x, z, w, d, type) {
  grass(x, z, w, d);

  if (type === "fountain") {
    fountain(x, z);

    for (const dx of [-w / 2 + 3, w / 2 - 3]) {
      for (const dz of [-d / 2 + 3, d / 2 - 3]) {
        tree(x + dx, z + dz, 0.85);
      }
    }

    bench(x - 8, z, Math.PI / 2);
    bench(x + 8, z, -Math.PI / 2);
  }

  if (type === "garden") {
    for (let i = 0; i < 6; i++) {
      const xx =
        x - w / 2 + 3 + i * (w - 6) / 5;

      if (i % 2 === 0) {
        tree(xx, z - 2, 0.75);
      } else {
        bush(xx, z + 2);
      }
    }

    bench(x, z);
  }

  if (type === "playground") {
    box(world, 6, 0.3, 5, M.yellow, x - 4, 0.55, z);

    box(
      world, 1.6, 0.3, 4.8,
      M.blue, x + 4, 1.65, z
    ).rotation.x = -0.45;

    box(
      world, 2, 2.3, 2,
      M.coral, x + 4, 1.3, z + 2
    );

    for (const dx of [-1.4, 1.4]) {
      for (const dz of [-1, 1]) {
        cylinder(
          world, 0.12, 0.12, 2.8,
          M.roof,
          x - 4 + dx, 1.8, z + 6 + dz
        );
      }
    }

    box(
      world, 3.4, 0.2, 2.5,
      M.roof, x - 4, 3.25, z + 6
    );

    tree(x + w / 2 - 3, z - d / 2 + 3, 0.9);
  }
}

// ==================================================
// TOY CARS
// ==================================================

const cars = [];

function car(x, z, color, direction = 1, moving = false) {
  const g = new THREE.Group();
  g.position.set(x, 0.16, z);
  world.add(g);

  box(g, 4.2, 1.05, 2.1, color, 0, 0.85, 0, 0.42);
  box(g, 2.3, 1.1, 1.9, color, -0.25, 1.6, 0, 0.4);

  box(
    g, 1.5, 0.5, 0.06,
    M.glassLight, -0.2, 1.7, -0.98
  );

  for (const xx of [-1.35, 1.35]) {
    for (const zz of [-1.03, 1.03]) {
      const wheel = cylinder(
        g, 0.48, 0.48, 0.24,
        M.tire, xx, 0.5, zz, 20
      );
      wheel.rotation.x = Math.PI / 2;
    }
  }

  g.rotation.y = direction < 0 ? Math.PI : 0;

  if (moving) {
    cars.push({
      g,
      direction,
      speed: 2.2 + seeded(x + z) * 1.5
    });
  }
}

function updateCars(dt) {
  for (const c of cars) {
    c.g.position.x += c.direction * c.speed * dt;

    if (c.g.position.x > 92) c.g.position.x = -92;
    if (c.g.position.x < -92) c.g.position.x = 92;
  }
}

// ==================================================
// CITY LAYOUT
// ==================================================

function makeCity() {
  makeRoads();

  building(-69, -59, 14, 12, 12, M.cream, M.red, true, 1);
  building(-52, -59, 14, 12, 18, M.peach, M.roof, false, 2);
  building(-18, -59, 15, 12, 16, M.tan, M.coral, true, 3);
  building(18, -59, 15, 12, 20, M.cream, M.darkBlue, true, 4);
  building(54, -59, 14, 12, 14, M.peach, M.red, true, 5);
  building(71, -59, 13, 12, 17, M.lavender, M.darkBlue, false, 6);

  building(-65, 11, 15, 13, 19, M.cream, M.darkBlue, true, 10);
  building(-45, 11, 14, 13, 15, M.coral, M.red, true, 11);
  building(45, 11, 15, 13, 17, M.peach, M.roof, true, 12);
  building(65, 11, 15, 13, 21, M.cream, M.darkBlue, true, 13);

  building(-64, -104, 15, 12, 17, M.cream, M.red, true, 20);
  building(0, -104, 16, 12, 21, M.tan, M.roof, false, 21);
  building(64, -104, 15, 12, 19, M.blue, M.darkBlue, true, 22);

  house(-19, -104, M.cream);
  house(21, -104, M.peach);

  park(0, -68, 25, 18, "fountain");
  park(-64, -82, 25, 15, "garden");
  park(64, -82, 25, 15, "playground");

  grass(-19, -51, 14, 9);
  grass(19, -51, 14, 9);

  for (const x of [-24, -14, 14, 24]) {
    bush(x, -50, 0.65);
  }

  for (let x = -84; x <= 84; x += 12) {
    if (Math.abs(x) < 10) continue;
    if (Math.abs(x - 39) < 9) continue;
    if (Math.abs(x + 39) < 9) continue;
    tree(x, -11.3, 0.78);
  }

  bench(-24, -19);
  bench(24, -19);

  for (const x of [-30, -15, 15, 30]) {
    box(
      world, 2.6, 0.75, 1.2,
      M.cream, x, 0.58, -21
    );
    bush(x, -21, 0.75);
  }

  for (const x of [-31, 31]) {
    cylinder(
      world, 0.12, 0.14, 6.5,
      M.metal, x, 3.4, -24
    );

    box(
      world, 1.7, 0.2, 0.4,
      M.metal, x + 0.7, 6.65, -24
    );

    box(
      world, 1, 0.06, 0.3,
      M.yellow, x + 0.75, 6.52, -24
    );
  }

  car(-70, -30, M.red, 1, true);
  car(24, -39, M.blue, -1, true);
  car(65, -30, M.yellow, 1, true);
  car(-20, -88, M.teal, -1, false);
}

// ==================================================
// PEDESTRIANS WITH HIT REACTIONS
// ==================================================

const pedestrians = [];

function pedestrian(x, z, direction, speed, index) {
  const g = new THREE.Group();
  g.position.set(x, 0.38, z);
  peopleGroup.add(g);

  const shirt = shirts[index % shirts.length];
  const skin = skins[index % skins.length];
  const hair = hairs[index % hairs.length];

  const body = sphere(g, 0.46, shirt, 0, 1.2, 0);
  body.scale.set(0.9, 1.18, 0.72);

  const head = sphere(g, 0.36, skin, 0, 2.03, 0);
  head.scale.y = 1.08;

  const hairCap = sphere(g, 0.37, hair, 0, 2.25, 0.04);
  hairCap.scale.y = 0.42;

  for (const ex of [-0.12, 0.12]) {
    sphere(g, 0.035, M.tire, ex, 2.06, -0.34);
  }

  const arms = [];
  const legs = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.47, 1.47, 0);
    g.add(arm);

    const sleeve = sphere(
      arm, 0.19, shirt,
      side * 0.03, -0.2, 0
    );
    sleeve.scale.set(0.8, 1.45, 0.8);

    cylinder(
      arm, 0.10, 0.10, 0.38,
      skin, side * 0.03, -0.5, 0
    );

    sphere(
      arm, 0.11, skin,
      side * 0.03, -0.7, 0
    );

    arms.push(arm);

    const leg = new THREE.Group();
    leg.position.set(side * 0.19, 0.85, 0);
    g.add(leg);

    box(
      leg, 0.26, 0.7, 0.28,
      M.darkBlue, 0, -0.35, 0
    );

    const shoe = sphere(
      leg, 0.18, M.tire,
      0, -0.72, -0.09
    );
    shoe.scale.set(0.9, 0.65, 1.4);

    legs.push(leg);
  }

  if (index % 5 === 0) {
    const backpack = sphere(
      g, 0.3, M.treeDark,
      0, 1.22, 0.35
    );
    backpack.scale.set(0.85, 1.2, 0.6);
  }

  g.rotation.y =
    direction > 0 ? -Math.PI / 2 : Math.PI / 2;

  g.scale.setScalar(
    0.85 + seeded(index + 30) * 0.25
  );

  pedestrians.push({
    g,
    arms,
    legs,
    direction,
    speed,
    phase: seeded(index + 80) * Math.PI * 2,
    reaction: 0,
    hitCooldown: 0,
    baseScale: g.scale.x
  });
}

function makePedestrians() {
  for (let i = 0; i < 12; i++) {
    pedestrian(
      -72 + i * 13,
      -14 - (i % 3) * 2,
      i % 2 ? 1 : -1,
      0.8 + seeded(i + 10) * 0.9,
      i
    );
  }

  for (let i = 0; i < 10; i++) {
    pedestrian(
      -70 + i * 15,
      -49 - (i % 2) * 2,
      i % 2 ? -1 : 1,
      0.8 + seeded(i + 60),
      i + 12
    );
  }
}

function updatePedestrians(dt) {
  for (const p of pedestrians) {
    p.hitCooldown = Math.max(0, p.hitCooldown - dt);

    if (p.reaction > 0) {
      p.reaction = Math.max(0, p.reaction - dt);

      const intensity = Math.sin(
        (1 - p.reaction / 0.75) * Math.PI
      );

      p.arms[0].rotation.z = -2 * intensity;
      p.arms[1].rotation.z = 2 * intensity;
      p.g.rotation.z = Math.sin(p.reaction * 22) * 0.18;
      p.g.position.y = 0.38 + intensity * 0.22;

      if (p.reaction === 0) {
        p.arms[0].rotation.z = 0;
        p.arms[1].rotation.z = 0;
      }

      continue;
    }

    p.phase += dt * p.speed * 5;
    p.g.position.x += p.direction * p.speed * dt;

    if (p.g.position.x > 90) p.g.position.x = -90;
    if (p.g.position.x < -90) p.g.position.x = 90;

    const step = Math.sin(p.phase);

    p.legs[0].rotation.x = step * 0.5;
    p.legs[1].rotation.x = -step * 0.5;

    p.arms[0].rotation.x = -step * 0.4;
    p.arms[1].rotation.x = step * 0.4;

    p.g.position.y = 0.38 + Math.abs(step) * 0.055;
    p.g.rotation.z = Math.sin(p.phase * 0.5) * 0.025;
  }
}

// ==================================================
// GAME STATE
// ==================================================

const MAX_SHOTS = 3;
const PEDESTRIAN_PENALTY = 50;

let floor = 1;
let score = 0;
let shotsLeft = MAX_SHOTS;
let wind = 0;
let power = 60;
let height = 12;

let state = "idle";
let introTime = 0;
let yaw = 0;
let pitch = -0.2;
let locked = false;

let projectile = null;
let flightTime = 0;
let shotResetTimer = 0;

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

// ==================================================
// NEW SHOT COUNTER HUD
// ==================================================

const shotHud = document.createElement("div");
shotHud.id = "shotHud";

shotHud.innerHTML = `
  <div class="shot-label">GUM LEFT</div>
  <div id="shotIcons"></div>
`;

$("hud").appendChild(shotHud);

const extraStyles = document.createElement("style");
extraStyles.textContent = `
  #shotHud {
    position: absolute;
    top: 110px;
    right: 24px;
    padding: 12px 17px;
    border-radius: 15px;
    background: #293e45d9;
    border: 1px solid #ffffff55;
    color: white;
    text-align: center;
    backdrop-filter: blur(8px);
  }

  .shot-label {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  #shotIcons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .gum-icon {
    width: 24px;
    height: 12px;
    border-radius: 5px;
    background: #f4a0aa;
    border: 2px solid #fff1d9;
    transform: rotate(-18deg);
    box-shadow: 0 2px 0 #a65c72;
    transition: opacity .2s, transform .2s;
  }

  .gum-icon.used {
    opacity: .2;
    transform: rotate(15deg) scale(.8);
  }

  #scorePopup {
    position: absolute;
    top: 32%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 34px;
    font-weight: 900;
    color: #ff9d91;
    text-shadow: 0 3px 8px #293e45;
    pointer-events: none;
    opacity: 0;
    transition: opacity .2s;
  }

  #scorePopup.visible {
    opacity: 1;
  }

  @media(max-width:600px) {
    #shotHud {
      top: 92px;
      right: 12px;
      padding: 9px 12px;
    }

    .gum-icon {
      width: 19px;
      height: 10px;
    }
  }
`;

document.head.appendChild(extraStyles);

const scorePopup = document.createElement("div");
scorePopup.id = "scorePopup";
$("hud").appendChild(scorePopup);

let popupTimer = 0;

function showPopup(text) {
  scorePopup.textContent = text;
  scorePopup.classList.add("visible");
  popupTimer = 1.1;
}

function updateShotHud() {
  $("shotIcons").innerHTML = Array.from(
    { length: MAX_SHOTS },
    (_, i) =>
      `<div class="gum-icon ${i >= shotsLeft ? "used" : ""}"></div>`
  ).join("");
}

// ==================================================
// BALCONY
// ==================================================

function makeBalcony() {
  balcony.clear();

  const ground = height - 1.65;

  box(
    balcony, 32, 100, 11,
    M.peach, 0, ground - 14, 9.2
  );

  box(
    balcony, 8.6, 0.32, 6.3,
    M.sidewalk, 0, ground - 0.2, -1.05
  );

  box(
    balcony, 8.8, 0.15, 0.32,
    M.cream, 0, ground - 0.08, -4.12
  );

  box(
    balcony, 8.6, 0.18, 0.16,
    M.metal, 0, ground + 1.1, RAIL_Z
  );

  box(
    balcony, 8.6, 0.1, 0.12,
    M.metal, 0, ground + 0.45, RAIL_Z
  );

  for (let x = -4.1; x <= 4.2; x += 0.65) {
    cylinder(
      balcony, 0.055, 0.055, 1.15,
      M.metal, x, ground + 0.58, RAIL_Z
    );
  }

  for (const side of [-1, 1]) {
    box(
      balcony, 0.16, 0.16, 6.3,
      M.metal,
      side * 4.25, ground + 1.1, -1.05
    );

    for (let z = -3.9; z < 2; z += 0.75) {
      cylinder(
        balcony, 0.055, 0.055, 1.15,
        M.metal,
        side * 4.25, ground + 0.58, z
      );
    }
  }

  box(
    balcony, 3.5, 4.5, 0.3,
    M.cream, 0, ground + 2.15, 3.65
  );

  box(
    balcony, 2.7, 3.9, 0.08,
    M.glass, 0, ground + 2.1, 3.47
  );

  box(
    balcony, 0.12, 3.9, 0.15,
    M.white, 0, ground + 2.1, 3.38
  );

  sphere(
    balcony, 0.1, M.yellow,
    1, ground + 1.9, 3.3
  );

  cylinder(
    balcony, 0.44, 0.34, 0.55,
    M.coral, 3.1, ground + 0.28, 0.6
  );

  sphere(
    balcony, 0.55, M.treeLight,
    3.1, ground + 0.86, 0.6
  );
}

// ==================================================
// TRASH CAN
// ==================================================

function makeTrash() {
  bin.clear();
  bin.position.copy(target);

  cylinder(
    bin, 0.73, 0.56, 1.35,
    M.teal, 0, 0.675, 0, 32
  );

  cylinder(
    bin, 0.6, 0.6, 0.035,
    M.tire, 0, 1.37, 0, 32
  );

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.075, 12, 40),
    M.metalLight
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.4;
  bin.add(rim);

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;

    box(
      bin, 0.045, 0.95, 0.045,
      M.treeDark,
      Math.cos(a) * 0.6,
      0.67,
      Math.sin(a) * 0.6
    );
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.035, 7, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd780,
      transparent: true,
      opacity: 0.85
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.72;
  ring.name = "targetRing";
  bin.add(ring);
}

// ==================================================
// FIRST PERSON HANDS
// ==================================================

function makeHands() {
  hands.clear();

  function hand(side) {
    const group = new THREE.Group();

    group.position.set(
      side * 0.42, -0.48, -0.64
    );

    hands.add(group);

    const arm = cylinder(
      group, 0.12, 0.15, 0.42,
      M.blue, side * 0.03, -0.27, 0
    );
    arm.rotation.z = side * 0.25;

    const palm = sphere(
      group, 0.16, M.skin, 0, 0, 0
    );
    palm.scale.set(0.9, 1.2, 0.55);

    for (let i = 0; i < 4; i++) {
      cylinder(
        group,
        0.035, 0.043, 0.18 - i * 0.012,
        M.skin,
        side * 0.04 + (i - 1.5) * 0.075,
        0.14, -0.04
      );
    }

    return group;
  }

  leftHand = hand(-1);
  rightHand = hand(1);

  pack = new THREE.Group();
  pack.position.set(-0.03, -0.3, -0.76);
  hands.add(pack);

  box(pack, 0.74, 0.36, 0.16, M.gumWrapper);
  box(
    pack, 0.75, 0.085, 0.17,
    M.gumGreen, 0, 0.13, 0
  );
  box(
    pack, 0.75, 0.075, 0.17,
    M.gumGreen, 0, -0.14, 0
  );

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.18),
    new THREE.MeshBasicMaterial({
      map: labelTexture(
        "GUM", "#f9edcb", "#416f61"
      )
    })
  );

  label.position.set(0, 0, 0.088);
  pack.add(label);

  flap = new THREE.Group();
  flap.position.set(0, 0.18, -0.04);
  pack.add(flap);

  box(
    flap, 0.74, 0.19, 0.035,
    M.gumWrapper, 0, 0.09, 0
  );

  for (let i = 0; i < 5; i++) {
    box(
      pack, 0.105, 0.25, 0.04,
      M.white,
      -0.25 + i * 0.125,
      0.015, -0.12
    );
  }

  stick = new THREE.Group();
  pack.add(stick);
  stick.position.set(0.1, 0.02, -0.18);

  box(stick, 0.115, 0.28, 0.05, M.white);

  chewGum = sphere(
    hands, 0.08, M.gum,
    0, -0.1, -0.48
  );

  chewGum.visible = false;
}

// ==================================================
// HUD
// ==================================================

function updateHud() {
  $("floor").textContent = floor;
  $("score").textContent = score;

  $("wind").textContent =
    (wind >= 0 ? "+" : "") + wind.toFixed(1);

  $("powerText").textContent = power + "%";
  $("powerFill").style.width = power + "%";

  updateShotHud();
}

function message(text) {
  $("message").textContent = text;
}

function applyAngles() {
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function targetAngles() {
  const direction = target.clone()
    .add(new THREE.Vector3(0, 1.35, 0))
    .sub(camera.position)
    .normalize();

  return {
    yaw: Math.atan2(-direction.x, -direction.z),
    pitch: Math.asin(direction.y)
  };
}

// ==================================================
// LEVEL RESET
// ==================================================

function removeProjectile() {
  if (!projectile) return;

  scene.remove(projectile);
  projectile.geometry.dispose();
  projectile = null;
}

function resetLevel() {
  height = 12 + (floor - 1) * 6;
  power = 60;
  shotsLeft = MAX_SHOTS;

  wind =
    (Math.random() - 0.5) *
    Math.min(0.5 * floor, 3);

  target.set(
    (Math.random() - 0.5) * 3,
    0.34,
    -12 - Math.random() * 1.8
  );

  camera.position.set(0, height, START_Z);

  yaw = 0;
  pitch = -0.16;
  applyAngles();

  removeProjectile();
  makeBalcony();
  makeTrash();
  makeHands();

  hands.visible = true;

  $("crosshair").classList.add("hidden");
  $("powerHud").classList.add("hidden");

  state = "intro";
  introTime = 0;
  shotResetTimer = 0;

  message("UNWRAPPING THE GUM...");
  updateHud();
}

$("startButton").addEventListener("click", () => {
  if (state !== "idle") return;

  $("startScreen").classList.add("hidden");
  $("hud").classList.remove("hidden");

  resetLevel();
});

// ==================================================
// AUTOMATIC INTRO
// ==================================================

function updateIntro(dt) {
  if (state !== "intro") return;

  introTime += dt;
  const t = introTime;

  if (t < 0.8) {
    message("UNWRAPPING THE GUM...");

    flap.rotation.x = -2.45 * smooth(t / 0.7);
    pack.rotation.z = Math.sin(t * 8) * 0.06;
  }

  else if (t < 1.4) {
    message("ONE FRESH STICK...");

    const p = smooth((t - 0.8) / 0.6);

    stick.position.set(
      0.1 + p * 0.18,
      0.02 + p * 0.37,
      -0.18 + p * 0.16
    );

    rightHand.position.y = -0.48 + p * 0.24;
  }

  else if (t < 2) {
    message("CHOMP CHOMP...");

    const p = smooth((t - 1.4) / 0.6);

    pack.position.y = -0.3 - p * 0.6;

    rightHand.position.set(
      0.42 - p * 0.35,
      -0.24 + p * 0.13,
      -0.64 - p * 0.12
    );

    chewGum.visible = true;
    chewGum.scale.setScalar(
      1 + Math.sin(t * 26) * 0.12
    );
  }

  else if (t < 3.5) {
    message("TO THE BALCONY...");

    hands.visible = false;

    const p = smooth((t - 2) / 1.5);

    camera.position.z = mix(START_Z, EDGE_Z, p);

    camera.position.y =
      height +
      Math.sin((t - 2) * 17) *
      0.038 * (1 - p);

    pitch = mix(-0.16, -0.48, p);
    applyAngles();
  }

  else if (t < 4) {
    message("THERE IT IS...");

    camera.position.set(0, height, EDGE_Z);

    const aim = targetAngles();
    const p = smooth((t - 3.5) / 0.5);

    yaw = mix(0, aim.yaw, p);
    pitch = mix(-0.48, aim.pitch, p);

    applyAngles();
  }

  else {
    camera.position.set(0, height, EDGE_Z);

    const aim = targetAngles();

    yaw = aim.yaw;
    pitch = aim.pitch;
    applyAngles();

    state = "aiming";

    $("crosshair").classList.remove("hidden");
    $("powerHud").classList.remove("hidden");

    message("3 SHOTS · CLICK TO AIM");
  }
}

// ==================================================
// AIMING
// ==================================================

function lockMouse() {
  if (document.pointerLockElement === renderer.domElement) {
    return;
  }

  const request =
    renderer.domElement.requestPointerLock?.();

  if (request?.catch) {
    request.catch(() => {});
  }
}

document.addEventListener("pointerlockchange", () => {
  locked =
    document.pointerLockElement === renderer.domElement;

  if (state === "aiming" && !locked) {
    message("CLICK TO AIM · THEN CLICK TO SPIT");
  }
});

document.addEventListener("mousemove", e => {
  if (!locked || state !== "aiming") return;

  yaw = clamp(
    yaw - e.movementX * 0.0022,
    -1.35, 1.35
  );

  pitch = clamp(
    pitch - e.movementY * 0.0022,
    -1.54, 0.35
  );

  applyAngles();
});

document.addEventListener(
  "wheel",
  e => {
    if (state !== "aiming") return;

    power = clamp(
      power + (e.deltaY > 0 ? -3 : 3),
      10, 100
    );

    updateHud();
  },
  { passive: true }
);

document.addEventListener("keydown", e => {
  if (state !== "aiming") return;

  if ([
    "Space",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
  ].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === "Space") spit();

  if (e.code === "KeyW") {
    power = Math.min(100, power + 3);
  }

  if (e.code === "KeyS") {
    power = Math.max(10, power - 3);
  }

  if (e.code === "ArrowLeft") yaw += 0.035;
  if (e.code === "ArrowRight") yaw -= 0.035;
  if (e.code === "ArrowUp") pitch += 0.035;
  if (e.code === "ArrowDown") pitch -= 0.035;

  pitch = clamp(pitch, -1.54, 0.35);

  applyAngles();
  updateHud();
});

renderer.domElement.addEventListener("mousedown", e => {
  if (e.button !== 0 || state !== "aiming") return;

  if (!locked) {
    lockMouse();
    message("MOUSE TO AIM · CLICK TO SPIT");
  } else {
    spit();
  }
});

// ==================================================
// SHOOTING
// ==================================================

function spit() {
  if (state !== "aiming" || shotsLeft <= 0) return;

  shotsLeft--;
  updateHud();

  state = "flying";
  flightTime = 0;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  velocity.copy(direction).multiplyScalar(
    5 + power * 0.24
  );

  projectile = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10),
    M.gum
  );

  projectile.scale.set(1.2, 0.65, 0.95);

  projectile.position
    .copy(camera.position)
    .addScaledVector(direction, 0.75);

  projectile.position.y -= 0.12;
  projectile.castShadow = true;

  scene.add(projectile);

  message("BON VOYAGE, GUM!");
}

// ==================================================
// PEDESTRIAN COLLISION
// ==================================================

function segmentSphereHit(a, b, center, radius) {
  const ab = b.clone().sub(a);
  const lengthSquared = ab.lengthSq();

  if (lengthSquared < 0.000001) {
    return a.distanceTo(center) <= radius;
  }

  const t = clamp(
    center.clone().sub(a).dot(ab) / lengthSquared,
    0, 1
  );

  const closest = a.clone().addScaledVector(ab, t);

  return closest.distanceTo(center) <= radius;
}

function checkPedestrianHit(from, to) {
  for (const p of pedestrians) {
    if (p.hitCooldown > 0) continue;

    const center = p.g.localToWorld(
      new THREE.Vector3(0, 1.3, 0)
    );

    const radius = 0.7 * p.baseScale;

    if (segmentSphereHit(from, to, center, radius)) {
      return p;
    }
  }

  return null;
}

function hitPedestrian(person) {
  person.reaction = 0.75;
  person.hitCooldown = 1.5;

  score = Math.max(0, score - PEDESTRIAN_PENALTY);

  showPopup("-50 POINTS!");
  message("HEY! WATCH WHERE YOU SPIT!");

  updateHud();
  completeShot(false);
}

// ==================================================
// PROJECTILE PHYSICS
// ==================================================

function updateFlight(dt) {
  if (state !== "flying" || !projectile) return;

  flightTime += dt;
  previous.copy(projectile.position);

  velocity.y -= 9.81 * dt;
  velocity.x += wind * dt;

  projectile.position.addScaledVector(velocity, dt);

  projectile.rotation.x += dt * 6;
  projectile.rotation.z += dt * 4;

  const openingHeight = target.y + 1.38;

  // Check trash can opening.
  if (
    previous.y > openingHeight &&
    projectile.position.y <= openingHeight &&
    velocity.y < 0
  ) {
    const t =
      (previous.y - openingHeight) /
      (previous.y - projectile.position.y);

    const x = mix(
      previous.x, projectile.position.x, t
    );

    const z = mix(
      previous.z, projectile.position.z, t
    );

    if (
      Math.hypot(
        x - target.x,
        z - target.z
      ) < 0.55
    ) {
      completeShot(true);
      return;
    }
  }

  // Check people, including fast-moving gum.
  const person = checkPedestrianHit(
    previous,
    projectile.position
  );

  if (person) {
    hitPedestrian(person);
    return;
  }

  // Check ground / timeout.
  if (
    projectile.position.y <= 0.34 ||
    flightTime > 12
  ) {
    completeShot(false);
  }
}

// ==================================================
// THREE-SHOT ROUND SYSTEM
// ==================================================

function completeShot(hit) {
  if (state !== "flying") return;

  if (hit) {
    score += floor * 100;
    updateHud();

    showPopup(`+${floor * 100} POINTS!`);
    showResult(true);
    return;
  }

  // No results screen after ordinary misses.
  // Give the shot a short beat, then allow another.
  state = "betweenShots";
  shotResetTimer = 0.65;

  if (shotsLeft > 0) {
    message(`${shotsLeft} SHOT${shotsLeft === 1 ? "" : "S"} LEFT`);
  } else {
    message("OUT OF GUM!");
  }
}

function updateBetweenShots(dt) {
  if (state !== "betweenShots") return;

  shotResetTimer -= dt;

  if (shotResetTimer > 0) return;

  removeProjectile();

  if (shotsLeft <= 0) {
    showResult(false);
    return;
  }

  state = "aiming";

  message(
    `${shotsLeft} SHOT${shotsLeft === 1 ? "" : "S"} LEFT · KEEP GOING!`
  );
}

// ==================================================
// RESULT SCREEN
// ==================================================

function showResult(hit) {
  state = hit ? "success" : "outOfShots";

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  if (hit) {
    $("resultEyebrow").textContent = "ABSOLUTE LEGEND";
    $("resultTitle").textContent = "DIRECT HIT!";

    $("resultDescription").textContent =
      `+${floor * 100} points! You made it in ${
        MAX_SHOTS - shotsLeft
      } shot${MAX_SHOTS - shotsLeft === 1 ? "" : "s"}.`;

    $("resultButton").textContent = "NEXT FLOOR";
  } else {
    $("resultEyebrow").textContent = "ALL OUT OF GUM";
    $("resultTitle").textContent = "TRY AGAIN!";

    $("resultDescription").textContent =
      "You used all three shots. Give this floor another try!";

    $("resultButton").textContent = "RETRY FLOOR";
  }

  $("resultScreen").classList.remove("hidden");
}

$("resultButton").addEventListener("click", () => {
  $("resultScreen").classList.add("hidden");

  if (state === "success") {
    floor++;
    resetLevel();
  } else if (state === "outOfShots") {
    resetLevel();
  }
});

// ==================================================
// MAIN LOOP
// ==================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);

  updateIntro(dt);
  updateFlight(dt);
  updateBetweenShots(dt);
  updatePedestrians(dt);
  updateCars(dt);

  if (popupTimer > 0) {
    popupTimer -= dt;

    if (popupTimer <= 0) {
      scorePopup.classList.remove("visible");
    }
  }

  const ring = bin.getObjectByName("targetRing");

  if (ring) {
    ring.position.y =
      1.72 +
      Math.sin(clock.elapsedTime * 2.2) * 0.09;
  }

  renderer.render(scene, camera);
}

// ==================================================
// RESIZE
// ==================================================

window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

// ==================================================
// INITIALIZE
// ==================================================

makeCity();
makePedestrians();

height = 12;
target.set(0, 0.34, -13);

camera.position.set(0, height, START_Z);

makeBalcony();
makeTrash();
makeHands();

hands.visible = false;

yaw = 0;
pitch = -0.16;

applyAngles();
updateHud();

state = "idle";

animate();
