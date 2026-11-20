
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// =====================================================
// GUM SPIT V11
// Moving aim, hold-to-charge power, randomized targets
// =====================================================

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

function ease(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// =====================================================
// SCENE AND RENDERER
// =====================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#91c3bf");
scene.fog = new THREE.Fog("#91c3bf", 115, 245);

const camera = new THREE.PerspectiveCamera(
  74,
  innerWidth / innerHeight,
  0.04,
  420
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

$("game").prepend(renderer.domElement);

scene.add(
  new THREE.HemisphereLight(0xfff4d8, 0x5c8d83, 2.2)
);

const sun = new THREE.DirectionalLight(0xffe2b8, 3);
sun.position.set(-45, 85, -30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);

Object.assign(sun.shadow.camera, {
  left: -100,
  right: 100,
  top: 100,
  bottom: -100,
  near: 1,
  far: 220
});

sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.04;
sun.shadow.radius = 3;

scene.add(sun);

// =====================================================
// MATERIALS
// =====================================================

const mat = (color, roughness = 0.9) =>
  new THREE.MeshStandardMaterial({ color, roughness });

const M = {
  grass: mat("#95c977"),
  grass2: mat("#a8d67f"),
  road: mat("#777b80"),
  walk: mat("#dedbca"),
  curb: mat("#b7b9a9"),
  line: mat("#eee6d5"),
  cream: mat("#f4dfb9"),
  white: mat("#fff0d5"),
  sand: mat("#dcb18b"),
  peach: mat("#e9a77f"),
  coral: mat("#dc826b"),
  orange: mat("#d98c50"),
  red: mat("#c95f5b"),
  mint: mat("#a9cdb7"),
  teal: mat("#4d9c9a"),
  blue: mat("#6c99ae"),
  navy: mat("#405f73"),
  lavender: mat("#afa2bd"),
  brown: mat("#98725d"),
  dark: mat("#30454b"),
  glass: mat("#6ca8b2", 0.35),
  lit: mat("#f5d99e"),
  leaf: mat("#5c9b63"),
  leaf2: mat("#85b96d"),
  leaf3: mat("#397b60"),
  wood: mat("#8d7657"),
  metal: mat("#788c89"),
  skin: mat("#e9b18c"),
  gum: mat("#f3a0af"),
  black: mat("#344147")
};

const walls = [
  M.cream, M.sand, M.peach,
  M.mint, M.blue, M.lavender, M.coral
];

const roofs = [
  M.orange, M.navy, M.brown, M.red, M.teal
];

const shirts = [
  M.coral, M.blue, M.orange,
  M.leaf, M.lavender, M.cream
];

// =====================================================
// SCENE GROUPS
// =====================================================

const city = new THREE.Group();
const balcony = new THREE.Group();
const bin = new THREE.Group();
const peopleGroup = new THREE.Group();
const hands = new THREE.Group();

scene.add(city, balcony, bin, peopleGroup, camera);
camera.add(hands);

// =====================================================
// GEOMETRY HELPERS
// =====================================================

const geometryCache = new Map();

function shape(w, h, d, r = 0.08) {
  r = Math.min(r, w * 0.45, h * 0.45, d * 0.45);

  const key = [w, h, d, r].join(",");

  if (!geometryCache.has(key)) {
    geometryCache.set(
      key,
      new RoundedBoxGeometry(w, h, d, 2, r)
    );
  }

  return geometryCache.get(key);
}

function box(
  parent, w, h, d, material,
  x = 0, y = 0, z = 0, radius = 0.08
) {
  const mesh = new THREE.Mesh(
    shape(w, h, d, radius),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function cyl(
  parent, top, bottom, h, material,
  x = 0, y = 0, z = 0, segments = 10
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      top, bottom, h, segments
    ),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function ball(
  parent, radius, material,
  x = 0, y = 0, z = 0
) {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);

  return mesh;
}

// =====================================================
// SEEDED RANDOM CITY GENERATION
// =====================================================

function rng(seed) {
  let n = seed >>> 0;

  return () => {
    n = (
      Math.imul(n, 1664525) + 1013904223
    ) >>> 0;

    return n / 4294967296;
  };
}

let rand = Math.random;

function pick(array) {
  return array[Math.floor(rand() * array.length)];
}

// =====================================================
// SIGNS
// =====================================================

function textTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f6e9cf";
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = "#30454b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 65px Arial";
  ctx.fillText(text, 256, 65, 485);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

const signCache = new Map();

function sign(parent, text, width, x, y, z) {
  if (!signCache.has(text)) {
    signCache.set(
      text,
      new THREE.MeshBasicMaterial({
        map: textTexture(text),
        side: THREE.DoubleSide
      })
    );
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / 4),
    signCache.get(text)
  );

  mesh.position.set(x, y, z);
  parent.add(mesh);
}

// =====================================================
// STREET DECORATIONS
// =====================================================

function tree(x, z, size = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0.37, z);
  group.scale.setScalar(size);
  city.add(group);

  cyl(group, 0.18, 0.24, 2.1, M.wood, 0, 1.1);

  for (let i = 0; i < 3; i++) {
    const crown = ball(
      group,
      1.25 - i * 0.16,
      [M.leaf3, M.leaf, M.leaf2][i],
      (i - 1) * 0.18,
      2.65 + i * 0.65
    );

    crown.scale.set(1.1, 1.1, 0.95);
  }
}

function planter(x, z) {
  box(city, 2.3, 0.65, 1.15, M.cream, x, 0.65, z);

  for (let i = -1; i <= 1; i++) {
    ball(
      city, 0.43, M.leaf2,
      x + i * 0.6, 1.15, z
    );
  }
}

function bench(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.36, z);
  city.add(group);

  box(group, 2.3, 0.16, 0.68, M.wood, 0, 0.65);
  box(group, 2.3, 0.7, 0.13, M.wood, 0, 1.08, 0.31);

  for (const xPos of [-0.8, 0.8]) {
    box(
      group, 0.12, 0.68, 0.12,
      M.metal, xPos, 0.3
    );
  }
}

function lamp(x, z) {
  cyl(city, 0.09, 0.11, 5.5, M.metal, x, 3.1, z);

  box(
    city, 1.35, 0.15, 0.35,
    M.metal, x + 0.55, 5.85, z
  );

  box(
    city, 0.95, 0.05, 0.27,
    M.lit, x + 0.67, 5.72, z
  );
}

// =====================================================
// BUILDINGS
// =====================================================

function building(x, z, w, d, h, kind) {
  const group = new THREE.Group();
  group.position.set(x, 0.38, z);
  city.add(group);

  const wall = pick(walls);
  const trim = pick(roofs);

  box(group, w, h, d, wall, 0, h / 2, 0, 0.17);

  box(
    group, w + 0.5, 0.42, d + 0.5,
    trim, 0, h + 0.17, 0, 0.1
  );

  box(
    group, w + 0.15, 0.14, d + 0.15,
    M.cream, 0, h - 0.4
  );

  const floors = Math.max(
    1,
    Math.floor((h - 2.5) / 3.2)
  );

  const cols = Math.max(
    2,
    Math.floor((w - 2) / 2.55)
  );

  const sideCols = Math.max(
    2,
    Math.floor((d - 2) / 2.8)
  );

  // Keep all building windows.
  for (let f = 0; f < floors; f++) {
    const yy = 3.3 + f * 3.2;

    if (yy > h - 1.1) break;

    for (let j = 0; j < cols; j++) {
      const xx = -w / 2 + (j + 0.5) * w / cols;

      box(
        group, 1.15, 1.55, 0.13,
        rand() < 0.15 ? M.lit : M.glass,
        xx, yy, -d / 2 - 0.09, 0.035
      );

      box(
        group, 1.4, 0.13, 0.31,
        M.cream, xx, yy - 0.83, -d / 2 - 0.16
      );

      box(
        group, 0.07, 1.53, 0.15,
        M.navy, xx, yy, -d / 2 - 0.17, 0.015
      );
    }

    for (let j = 0; j < sideCols; j++) {
      const zz = -d / 2 + (j + 0.5) * d / sideCols;

      for (const side of [-1, 1]) {
        box(
          group, 0.13, 1.55, 1.15,
          rand() < 0.12 ? M.lit : M.glass,
          side * (w / 2 + 0.09), yy, zz, 0.035
        );

        box(
          group, 0.3, 0.12, 1.38,
          M.cream,
          side * (w / 2 + 0.18),
          yy - 0.83,
          zz
        );
      }
    }
  }

  if (kind === "shop" || kind === "cafe") {
    box(
      group, w - 0.8, 2.35, 0.18,
      M.glass, 0, 1.35, -d / 2 - 0.13
    );

    box(
      group, 1.45, 2.3, 0.22,
      M.navy, 0, 1.25, -d / 2 - 0.25
    );

    box(
      group, w + 0.4, 0.18, 2.2,
      M.cream, 0, 3.05, -d / 2 - 1.1
    );

    const stripes = Math.max(
      5,
      Math.round(w / 1.1)
    );

    for (let i = 0; i < stripes; i += 2) {
      box(
        group, w / stripes, 0.2, 2.23,
        trim,
        -w / 2 + (i + 0.5) * w / stripes,
        3.08,
        -d / 2 - 1.1
      );
    }

    box(
      group, w - 0.8, 0.75, 0.17,
      trim, 0, 4.1, -d / 2 - 0.17
    );

    sign(
      group,
      kind === "cafe"
        ? "CAFE"
        : pick(["MARKET", "BAKERY", "SHOP", "DINER"]),
      Math.min(w - 1, 7),
      0, 4.1, -d / 2 - 0.28
    );
  } else {
    box(
      group, 1.7, 2.5, 0.16,
      M.navy, 0, 1.25, -d / 2 - 0.16
    );

    box(
      group, 2.3, 0.17, 0.5,
      M.cream, 0, 2.55, -d / 2 - 0.3
    );

    if (kind === "apartment") {
      for (let f = 1; f < floors; f += 2) {
        const yy = 3.3 + f * 3.2;

        box(
          group, 3, 0.13, 1,
          M.cream,
          -w * 0.22,
          yy - 0.95,
          -d / 2 - 0.65
        );

        box(
          group, 3, 0.08, 0.08,
          M.metal,
          -w * 0.22,
          yy + 0.05,
          -d / 2 - 1.08
        );

        for (const a of [-1.2, 0, 1.2]) {
          cyl(
            group, 0.035, 0.035, 0.95,
            M.metal,
            -w * 0.22 + a,
            yy - 0.45,
            -d / 2 - 1.08
          );
        }
      }
    }
  }

  if (h > 10) {
    box(
      group, 2.5, 0.8, 2.2,
      M.cream, w * 0.18, h + 0.72, d * 0.15
    );

    cyl(
      group, 0.55, 0.55, 0.7,
      M.metal, -w * 0.2, h + 0.75, d * 0.12
    );
  }
}

// =====================================================
// PARKS
// =====================================================

function park(x, z, w, d, type) {
  box(city, w, 0.35, d, M.grass2, x, 0.34, z);

  for (let i = 0; i < 5; i++) {
    const xx = x - w / 2 + 2 + rand() * (w - 4);
    const zz = z - d / 2 + 2 + rand() * (d - 4);

    if (type === "plaza" && i < 2) continue;

    tree(xx, zz, 0.7 + rand() * 0.4);
  }

  if (type === "plaza") {
    box(city, 6, 1, 6, M.cream, x, 0.85, z);
    box(city, 4.7, 0.08, 4.7, M.teal, x, 1.4, z);

    cyl(
      city, 0.4, 0.65, 1.5,
      M.white, x, 2.1, z
    );

    ball(city, 0.5, M.blue, x, 3, z);
  } else {
    bench(x, z);
    planter(x + 3, z + 2);
  }
}

// =====================================================
// CARS
// =====================================================

const cars = [];

function car(x, z, material, dir = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0.2, z);
  city.add(group);

  box(
    group, 3.6, 0.85, 1.9,
    material, 0, 0.8, 0, 0.36
  );

  box(
    group, 2.05, 0.9, 1.7,
    material, -0.2, 1.45, 0, 0.28
  );

  box(
    group, 1.3, 0.42, 0.08,
    M.glass, -0.2, 1.52, -0.88
  );

  for (const xx of [-1.1, 1.1]) {
    for (const zz of [-0.93, 0.93]) {
      const wheel = cyl(
        group, 0.38, 0.38, 0.2,
        M.black, xx, 0.42, zz, 14
      );

      wheel.rotation.x = Math.PI / 2;
    }
  }

  group.rotation.y = dir < 0 ? Math.PI : 0;

  cars.push({
    group,
    dir,
    speed: 1.4 + rand() * 2
  });
}

// =====================================================
// PEDESTRIANS
// =====================================================

const pedestrians = [];

function pedestrian(x, z, dir, speed, index) {
  const group = new THREE.Group();
  group.position.set(x, 0.4, z);
  peopleGroup.add(group);

  const shirt = shirts[index % shirts.length];
  const skin = index % 4 === 0 ? M.sand : M.skin;

  const torso = ball(group, 0.48, shirt, 0, 1.28);
  torso.scale.set(0.95, 1.12, 0.75);

  ball(group, 0.36, skin, 0, 2.03);

  const hair = ball(
    group, 0.36,
    index % 3 ? M.brown : M.dark,
    0, 2.27
  );

  hair.scale.y = 0.43;

  const arms = [];
  const legs = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.47, 1.55, 0);
    group.add(arm);

    box(
      arm, 0.24, 0.65, 0.25,
      shirt, 0, -0.33, 0, 0.12
    );

    ball(arm, 0.13, skin, 0, -0.7);
    arms.push(arm);

    const leg = new THREE.Group();
    leg.position.set(side * 0.2, 0.88, 0);
    group.add(leg);

    box(leg, 0.27, 0.7, 0.3, M.navy, 0, -0.35);

    box(
      leg, 0.35, 0.17, 0.47,
      M.black, 0, -0.72, -0.08
    );

    legs.push(leg);
  }

  group.rotation.y =
    dir > 0 ? -Math.PI / 2 : Math.PI / 2;

  const scale = 0.85 + rand() * 0.25;
  group.scale.setScalar(scale);

  pedestrians.push({
    group,
    dir,
    speed,
    arms,
    legs,
    phase: rand() * Math.PI * 2,
    reaction: 0,
    scale
  });
}

function updatePeople(dt) {
  for (const person of pedestrians) {
    person.phase += dt * person.speed * 5;

    if (person.reaction > 0) {
      person.reaction = Math.max(
        0,
        person.reaction - dt
      );

      const k = Math.sin(
        (1 - person.reaction / 0.8) * Math.PI
      );

      person.arms[0].rotation.z = -k * 2;
      person.arms[1].rotation.z = k * 2;
      person.group.position.y = 0.4 + k * 0.2;

      continue;
    }

    person.arms.forEach(arm => {
      arm.rotation.z = 0;
    });

    person.group.position.x +=
      person.dir * person.speed * dt;

    if (person.group.position.x > 140) {
      person.group.position.x = -140;
    }

    if (person.group.position.x < -140) {
      person.group.position.x = 140;
    }

    const step = Math.sin(person.phase);

    person.legs[0].rotation.x = step * 0.5;
    person.legs[1].rotation.x = -step * 0.5;
    person.arms[0].rotation.x = -step * 0.4;
    person.arms[1].rotation.x = step * 0.4;

    person.group.position.y =
      0.4 + Math.abs(step) * 0.04;
  }
}

function updateCars(dt) {
  for (const vehicle of cars) {
    vehicle.group.position.x +=
      vehicle.dir * vehicle.speed * dt;

    if (vehicle.group.position.x > 140) {
      vehicle.group.position.x = -140;
    }

    if (vehicle.group.position.x < -140) {
      vehicle.group.position.x = 140;
    }
  }
}

// =====================================================
// GENERATE THE FULL CITY
// =====================================================

function createCity(level) {
  city.clear();
  cars.length = 0;
  peopleGroup.clear();
  pedestrians.length = 0;

  rand = rng(2026 + level * 9173);

  box(
    city, 320, 0.4, 300,
    M.grass, 0, -0.3, -86
  );

  for (const z of [-34, -82, -130]) {
    box(
      city, 300, 0.12, 14,
      M.road, 0, 0.02, z
    );
  }

  for (const x of [-96, -48, 0, 48, 96]) {
    box(
      city, 13, 0.12, 245,
      M.road, x, 0.025, -100
    );
  }

  // Continuous foreground sidewalk.
  box(
    city, 300, 0.28, 14,
    M.walk, 0, 0.15, -17
  );

  for (let x = -140; x <= 140; x += 9) {
    box(city, 3, 0.02, 0.16, M.line, x, 0.1, -34);
    box(city, 3, 0.02, 0.16, M.line, x, 0.1, -82);
  }

  for (const x of [-96, -48, 0, 48, 96]) {
    for (const z of [-34, -82, -130]) {
      for (let i = -3; i <= 3; i++) {
        box(
          city, 0.8, 0.025, 3,
          M.line, x + i * 1.4, 0.11, z - 4
        );
      }
    }
  }

  const xs = [-120, -72, -24, 24, 72, 120];
  const zs = [-58, -106, -154, -194];

  for (let row = 0; row < zs.length; row++) {
    for (let col = 0; col < xs.length; col++) {
      const x = xs[col];
      const z = zs[row];

      box(city, 32, 0.34, 27, M.walk, x, 0.18, z);

      const parkChance =
        row === 0 && col === 2 ? 0 : 0.13;

      if (rand() < parkChance) {
        park(
          x, z, 28, 23,
          rand() < 0.5 ? "plaza" : "garden"
        );

        continue;
      }

      const count = rand() < 0.5 ? 2 : 3;

      for (let k = 0; k < count; k++) {
        const width = count === 2 ? 12.5 : 8.3;

        const px =
          x +
          (k - (count - 1) / 2) *
          (count === 2 ? 14 : 9.4);

        const h =
          7 +
          Math.floor(rand() * 4) * 3.2 +
          (level > 3
            ? Math.min(level - 3, 9) * 0.8
            : 0);

        const kind =
          rand() < 0.27 ? "shop" :
          rand() < 0.22 ? "cafe" :
          rand() < 0.45 ? "apartment" :
          "office";

        building(
          px,
          z + (rand() - 0.5) * 2,
          width,
          16 + rand() * 2,
          h,
          kind
        );
      }

      if (rand() < 0.8) {
        tree(x - 14, z + 10, 0.8);
        tree(x + 14, z - 10, 0.8);
      }

      if (rand() < 0.5) {
        planter(x + rand() * 12 - 6, z + 12);
      }
    }
  }

  // Foreground decorations remain clear of
  // the trash can's central spawn area.
  for (let x = -138; x <= 138; x += 10) {
    if (Math.abs(x) < 11) continue;

    if (rand() < 0.74) {
      tree(x, -11, 0.65 + rand() * 0.25);
    } else {
      planter(x, -11);
    }
  }

  for (const x of [-35, -20, 20, 35]) {
    bench(x, -19);

    if (rand() < 0.6) {
      lamp(x + 4, -24);
    }
  }

  for (let i = 0; i < 13; i++) {
    car(
      -135 + rand() * 270,
      i % 2 ? -30 : -38,
      pick([
        M.red, M.blue, M.cream,
        M.orange, M.teal
      ]),
      i % 2 ? 1 : -1
    );
  }

  for (let i = 0; i < 28; i++) {
    const near = i < 18;

    pedestrian(
      -110 + rand() * 220,
      near
        ? -13 - rand() * 8
        : -47 - rand() * 6,
      rand() < 0.5 ? -1 : 1,
      0.7 + rand() * 1.1,
      i
    );
  }

  rand = Math.random;
}

// =====================================================
// GAME STATE
// =====================================================

let floor = 1;
let score = 0;
let shots = 3;

let power = 10;
let wind = 0;
let height = 12;

let state = "idle";
let intro = 0;

let yaw = 0;
let pitch = -0.16;

let locked = false;
let charging = false;

let projectile = null;
let flight = 0;
let wait = 0;
let popupTime = 0;

const START_Z = 1.35;
const EDGE_Z = -4.66;

const target = new THREE.Vector3();
const velocity = new THREE.Vector3();
const previous = new THREE.Vector3();

let previousTarget = null;

// =====================================================
// NEW AIMING SYSTEM
// =====================================================

let aimLocked = false;
let swivelTime = 0;
let swivelCenter = 0;
let swivelRange = 0.5;
let swivelSpeed = 0.9;

let chargeDirection = 1;

// Charge speed is percentage points per second.
const CHARGE_SPEED = 75;
const MIN_POWER = 10;
const MAX_POWER = 100;

function isSwivelLevel() {
  return floor >= 4;
}

function swivelSettings() {
  if (floor <= 5) {
    return { speed: 0.85, range: 0.48 };
  }

  if (floor <= 8) {
    return { speed: 1.25, range: 0.55 };
  }

  return {
    speed: Math.min(2.1, 1.55 + (floor - 9) * 0.07),
    range: 0.65
  };
}

function angles() {
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function aimAngles() {
  const direction = target.clone()
    .add(new THREE.Vector3(0, 1.38, 0))
    .sub(camera.position)
    .normalize();

  return {
    yaw: Math.atan2(-direction.x, -direction.z),
    pitch: Math.asin(direction.y)
  };
}

// Compute a usable initial elevation for the
// target at a medium shot power.
// Horizontal timing is still controlled by the player.
function suggestedPitch() {
  const launch = camera.position.clone();

  const dx = target.x - launch.x;
  const dz = target.z - launch.z;

  const horizontal = Math.hypot(dx, dz);

  const dy = target.y + 1.38 - (launch.y - 0.12);

  const speed = 5 + 65 * 0.24;
  const g = 9.81;

  const discriminant =
    Math.pow(speed, 4) -
    g * (g * horizontal * horizontal + 2 * dy * speed * speed);

  if (discriminant < 0) {
    return aimAngles().pitch;
  }

  const tangent =
    (speed * speed - Math.sqrt(discriminant)) /
    (g * horizontal);

  return clamp(Math.atan(tangent), -1.52, 0.25);
}

function prepareAim() {
  charging = false;
  chargeDirection = 1;
  power = MIN_POWER;

  aimLocked = !isSwivelLevel();
  swivelTime = 0;

  const settings = swivelSettings();

  swivelSpeed = settings.speed;
  swivelRange = settings.range;

  const a = aimAngles();

  swivelCenter = a.yaw;
  pitch = suggestedPitch();

  if (isSwivelLevel()) {
    yaw = swivelCenter - swivelRange;
  } else {
    yaw = a.yaw;
  }

  angles();

  state = "aiming";

  $("crosshair").classList.remove("hidden");
  $("powerHud").classList.remove("hidden");
  $("aimHud").classList.remove("hidden");

  updateAimHUD();
  hud();
}

function updateAimHUD() {
  if (!isSwivelLevel()) {
    $("aimMode").textContent = "FREE AIM";
    $("aimInstruction").textContent = charging
      ? "RELEASE TO SPIT"
      : "MOVE MOUSE TO AIM";

    $("powerInstruction").textContent = charging
      ? "RELEASE AT YOUR DESIRED POWER"
      : "HOLD CLICK TO CHARGE · RELEASE TO SPIT";

    $("crosshair").classList.remove("locked");

    return;
  }

  if (!aimLocked) {
    $("aimMode").textContent = "MOVING AIM";
    $("aimInstruction").textContent = "CLICK TO LOCK DIRECTION";

    $("powerInstruction").textContent =
      "LOCK AIM FIRST · THEN HOLD TO CHARGE";

    $("crosshair").classList.remove("locked");
  } else {
    $("aimMode").textContent = "AIM LOCKED";
    $("aimInstruction").textContent = charging
      ? "RELEASE TO SHOOT"
      : "HOLD CLICK TO CHARGE";

    $("powerInstruction").textContent = charging
      ? "RELEASE AT YOUR DESIRED POWER"
      : "HOLD CLICK · RELEASE TO SPIT";

    $("crosshair").classList.add("locked");
  }
}

function updateSwivel(dt) {
  if (
    state !== "aiming" ||
    !isSwivelLevel() ||
    aimLocked
  ) {
    return;
  }

  swivelTime += dt * swivelSpeed;

  // Smooth side-to-side oscillation.
  yaw =
    swivelCenter +
    Math.sin(swivelTime - Math.PI / 2) *
    swivelRange;

  angles();
}

function startCharge() {
  if (state !== "aiming") return;

  if (isSwivelLevel() && !aimLocked) return;

  charging = true;
  chargeDirection = 1;
  power = MIN_POWER;

  updateAimHUD();
  hud();
}

function updateCharge(dt) {
  if (state !== "aiming" || !charging) return;

  power += chargeDirection * CHARGE_SPEED * dt;

  if (power >= MAX_POWER) {
    power = MAX_POWER;
    chargeDirection = -1;
  }

  if (power <= MIN_POWER) {
    power = MIN_POWER;
    chargeDirection = 1;
  }

  hud();
}

function releaseCharge() {
  if (state !== "aiming" || !charging) return;

  charging = false;
  spit();
}

// =====================================================
// RANDOM TRASH CAN LOCATIONS
// =====================================================

function randomTargetPosition() {
  // All positions are on the wide foreground sidewalk.
  // Avoid immediately repeating the previous location.
  let x, z;

  for (let tries = 0; tries < 30; tries++) {
    x = -8 + Math.random() * 16;
    z = -13 + Math.random() * -7;

    if (!previousTarget) break;

    if (
      Math.hypot(
        x - previousTarget.x,
        z - previousTarget.z
      ) > 4
    ) {
      break;
    }
  }

  previousTarget = { x, z };
  target.set(x, 0.34, z);
}

// =====================================================
// BALCONY
// =====================================================

function makeBalcony() {
  balcony.clear();

  const ground = height - 1.65;

  box(
    balcony, 28, 100, 10,
    M.peach, 0, ground - 14, 9.4
  );

  box(
    balcony, 8.6, 0.32, 6.3,
    M.walk, 0, ground - 0.2, -1.05
  );

  box(
    balcony, 8.8, 0.15, 0.3,
    M.cream, 0, ground - 0.08, -4.12
  );

  for (const y of [0.42, 1.08]) {
    box(
      balcony, 8.5, 0.12, 0.13,
      M.metal, 0, ground + y, -4.02
    );
  }

  for (let x = -4.1; x <= 4.1; x += 0.65) {
    cyl(
      balcony, 0.055, 0.055, 1.1,
      M.metal, x, ground + 0.56, -4.02
    );
  }

  for (const side of [-1, 1]) {
    box(
      balcony, 0.13, 0.13, 6.3,
      M.metal,
      side * 4.25,
      ground + 1.08,
      -1.05
    );

    for (let z = -3.9; z < 2; z += 0.7) {
      cyl(
        balcony, 0.05, 0.05, 1.1,
        M.metal,
        side * 4.25,
        ground + 0.56,
        z
      );
    }
  }

  box(
    balcony, 3.5, 4.5, 0.25,
    M.cream, 0, ground + 2.15, 3.6
  );

  box(
    balcony, 2.7, 3.9, 0.08,
    M.glass, 0, ground + 2.1, 3.4
  );

  cyl(
    balcony, 0.43, 0.35, 0.6,
    M.coral, 3.1, ground + 0.3, 0.5
  );

  ball(
    balcony, 0.6, M.leaf2,
    3.1, ground + 1, 0.5
  );
}

// =====================================================
// TRASH CAN
// =====================================================

function makeBin() {
  bin.clear();
  bin.position.copy(target);

  cyl(
    bin, 0.73, 0.56, 1.35,
    M.teal, 0, 0.675, 0, 24
  );

  cyl(
    bin, 0.6, 0.6, 0.035,
    M.dark, 0, 1.37, 0, 24
  );

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.07, 10, 32),
    M.cream
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.4;
  bin.add(ring);

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.87, 0.035, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd886
    })
  );

  glow.rotation.x = Math.PI / 2;
  glow.position.y = 1.73;
  glow.name = "glow";
  bin.add(glow);

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;

    box(
      bin, 0.045, 0.94, 0.045,
      M.leaf3,
      Math.cos(a) * 0.6,
      0.7,
      Math.sin(a) * 0.6
    );
  }
}

// =====================================================
// REFERENCE-STYLE FACETED HANDS
// =====================================================

const handSkin = new THREE.MeshStandardMaterial({
  color: "#edc19e",
  roughness: 1,
  flatShading: true
});

const wrapperWhite = mat("#fffdf5", 0.64);
const wrapperRed = mat("#ae2339", 0.7);
const wrapperGreen = mat("#075844", 0.68);

const foilMat = new THREE.MeshStandardMaterial({
  color: "#e3e6d9",
  metalness: 0.24,
  roughness: 0.42
});

function facetedMitten(
  parent,
  rings,
  material,
  sides = 7
) {
  const vertices = [];
  const indices = [];

  for (const ring of rings) {
    for (let j = 0; j < sides; j++) {
      const a = 2 * Math.PI * j / sides;

      vertices.push(
        ring.x + Math.cos(a) * ring.rx,
        ring.y,
        ring.z + Math.sin(a) * ring.rz
      );
    }
  }

  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const next = (j + 1) % sides;

      const a = i * sides + j;
      const b = i * sides + next;
      const c = (i + 1) * sides + j;
      const d = (i + 1) * sides + next;

      indices.push(a, b, c, b, d, c);
    }
  }

  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j + 1, j);

    const last = (rings.length - 1) * sides;

    indices.push(
      last,
      last + j,
      last + j + 1
    );
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  parent.add(mesh);

  return mesh;
}

function createHand(side) {
  const group = new THREE.Group();
  hands.add(group);

  group.position.set(
    side * 0.66,
    -0.44,
    -1.19
  );

  group.rotation.z = -side * 0.075;

  // Blue sleeve.
  facetedMitten(
    group,
    [
      {
        x: side * 0.018, y: -0.56, z: -0.025,
        rx: 0.091, rz: 0.075
      },
      {
        x: side * 0.014, y: -0.37, z: -0.02,
        rx: 0.103, rz: 0.077
      },
      {
        x: 0, y: -0.23, z: 0,
        rx: 0.09, rz: 0.066
      }
    ],
    M.blue,
    8
  );

  // Single-piece angular hand silhouette.
  facetedMitten(
    group,
    [
      { x: 0, y: -0.27, z: 0, rx: 0.071, rz: 0.053 },
      { x: 0, y: -0.16, z: 0, rx: 0.096, rz: 0.068 },
      { x: side * 0.012, y: 0.005, z: 0, rx: 0.142, rz: 0.087 },
      { x: side * 0.006, y: 0.17, z: -0.004, rx: 0.151, rz: 0.085 },
      { x: -side * 0.004, y: 0.29, z: -0.014, rx: 0.133, rz: 0.074 },
      { x: -side * 0.009, y: 0.345, z: -0.023, rx: 0.105, rz: 0.058 },
      { x: -side * 0.01, y: 0.37, z: -0.027, rx: 0.073, rz: 0.043 }
    ],
    handSkin,
    7
  );

  const thumb = new THREE.Group();

  thumb.position.set(
    -side * 0.105,
    0.035,
    0.012
  );

  thumb.rotation.z = side * 0.54;
  group.add(thumb);

  facetedMitten(
    thumb,
    [
      { x: 0, y: 0, z: 0, rx: 0.065, rz: 0.055 },
      { x: 0, y: 0.095, z: 0.004, rx: 0.062, rz: 0.052 },
      { x: -side * 0.008, y: 0.18, z: 0.002, rx: 0.047, rz: 0.041 },
      { x: -side * 0.015, y: 0.235, z: -0.008, rx: 0.029, rz: 0.029 }
    ],
    handSkin,
    6
  );

  return { group, thumb };
}

// =====================================================
// SPEARMINT WRAPPER
// =====================================================

function gumPackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 640;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, 1536, 640);

  ctx.fillStyle = "#ae2035";
  ctx.fillRect(0, 0, 175, 640);
  ctx.fillRect(1375, 0, 161, 640);

  ctx.fillStyle = "#fffdf8";
  ctx.beginPath();
  ctx.moveTo(105, 0);
  ctx.lineTo(1425, 0);
  ctx.lineTo(1320, 640);
  ctx.lineTo(180, 640);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ad2637";
  ctx.font = "900 104px Arial";
  ctx.textAlign = "center";
  ctx.fillText("WRIGLEY'S", 790, 175);

  ctx.fillStyle = "#065740";
  ctx.beginPath();
  ctx.moveTo(275, 235);
  ctx.lineTo(1160, 235);
  ctx.lineTo(1300, 332);
  ctx.lineTo(1160, 430);
  ctx.lineTo(275, 430);
  ctx.lineTo(195, 332);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 15;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 105px Arial";
  ctx.fillText("SPEARMINT", 770, 363);

  ctx.fillStyle = "#ad2637";
  ctx.font = "800 54px Arial";
  ctx.fillText("CHEWING GUM", 780, 512);

  ctx.font = "800 36px Arial";
  ctx.fillText("7 STICKS", 1320, 570);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  texture.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy()
  );

  return texture;
}

let leftHand;
let rightHand;
let pack;
let flap;
let stick;
let chew;

function makeHands() {
  hands.clear();

  leftHand = createHand(-1);
  rightHand = createHand(1);

  pack = new THREE.Group();
  hands.add(pack);

  pack.position.set(0, -0.23, -1.03);
  pack.rotation.set(-0.045, 0, 0);

  box(
    pack, 1.02, 0.405, 0.18,
    wrapperWhite, 0, 0, 0, 0.025
  );

  box(
    pack, 0.12, 0.407, 0.184,
    wrapperRed, -0.46, 0, 0, 0.018
  );

  box(
    pack, 0.12, 0.407, 0.184,
    wrapperRed, 0.46, 0, 0, 0.018
  );

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.965, 0.37),
    new THREE.MeshBasicMaterial({
      map: gumPackTexture()
    })
  );

  label.position.z = 0.093;
  pack.add(label);

  box(
    pack, 0.96, 0.022, 0.185,
    wrapperWhite, 0, 0.204, 0, 0.009
  );

  box(
    pack, 0.96, 0.022, 0.185,
    wrapperRed, 0, -0.204, 0, 0.009
  );

  box(
    pack, 0.74, 0.009, 0.014,
    wrapperGreen, 0, 0.212, 0.03, 0.003
  );

  flap = new THREE.Group();
  flap.position.set(0, 0.204, -0.01);
  pack.add(flap);

  box(
    flap, 1, 0.145, 0.024,
    wrapperWhite, 0, 0.072, 0, 0.008
  );

  box(
    flap, 0.13, 0.145, 0.026,
    wrapperRed, -0.435, 0.072, 0, 0.006
  );

  box(
    flap, 0.13, 0.145, 0.026,
    wrapperRed, 0.435, 0.072, 0, 0.006
  );

  stick = new THREE.Group();
  pack.add(stick);

  stick.position.set(0.16, 0.025, -0.12);

  box(
    stick, 0.145, 0.315, 0.055,
    foilMat, 0, 0, 0, 0.012
  );

  for (let i = 0; i < 3; i++) {
    box(
      stick, 0.13, 0.009, 0.058,
      wrapperWhite,
      0,
      -0.095 + i * 0.095,
      0.004,
      0.002
    );
  }

  chew = ball(
    hands, 0.052, M.gum,
    0, -0.05, -0.68
  );

  chew.visible = false;
}

// =====================================================
// HUD
// =====================================================

function hud() {
  $("floor").textContent = floor;
  $("score").textContent = score;

  $("wind").textContent =
    (wind >= 0 ? "+" : "") + wind.toFixed(1);

  $("powerText").textContent =
    Math.round(power) + "%";

  $("powerFill").style.width =
    power + "%";

  $("shotPieces").innerHTML = Array.from(
    { length: 3 },
    (_, i) =>
      `<div class="piece ${i >= shots ? "used" : ""}"></div>`
  ).join("");
}

function message(text) {
  $("message").textContent = text;
}

function popup(text) {
  $("popup").textContent = text;
  $("popup").classList.add("show");
  popupTime = 1.2;
}

// =====================================================
// LEVEL RESET
// =====================================================

function removeGum() {
  if (!projectile) return;

  scene.remove(projectile);
  projectile.geometry.dispose();
  projectile = null;
}

function resetLevel() {
  height = 12 + (floor - 1) * 6;

  shots = 3;
  power = MIN_POWER;
  charging = false;

  wind =
    (Math.random() - 0.5) *
    Math.min(0.5 * floor, 3);

  randomTargetPosition();

  createCity(floor);
  makeBalcony();
  makeBin();
  makeHands();

  hands.visible = true;

  removeGum();

  camera.position.set(0, height, START_Z);

  yaw = 0;
  pitch = -0.16;
  angles();

  intro = 0;
  state = "intro";

  $("crosshair").classList.add("hidden");
  $("crosshair").classList.remove("locked");
  $("powerHud").classList.add("hidden");
  $("aimHud").classList.add("hidden");

  message("UNWRAPPING THE GUM...");
  hud();
}

// =====================================================
// INTRO ANIMATION
// =====================================================

function updateIntro(dt) {
  if (state !== "intro") return;

  intro += dt;
  const t = intro;

  if (t < 0.8) {
    message("UNWRAPPING THE GUM...");

    const p = ease(t / 0.8);

    flap.rotation.x = -2.2 * p;
    pack.rotation.z = Math.sin(t * 7) * 0.008;

    rightHand.group.rotation.z =
      -0.075 + 0.012 * p;

  } else if (t < 1.4) {
    message("ONE FRESH STICK...");

    const p = ease((t - 0.8) / 0.6);

    stick.position.set(
      0.16 + 0.1 * p,
      0.025 + 0.39 * p,
      -0.12 + 0.08 * p
    );

    rightHand.group.position.set(
      0.66,
      -0.44 + 0.045 * p,
      -1.19
    );

  } else if (t < 2) {
    message("CHOMP CHOMP...");

    const p = ease((t - 1.4) / 0.6);

    stick.position.y = 0.415 + p * 0.26;
    stick.position.z = -0.04 + p * 0.15;

    pack.position.y = -0.23 - 0.52 * p;

    leftHand.group.position.y =
      -0.44 - 0.52 * p;

    rightHand.group.position.y =
      -0.395 - 0.52 * p;

    chew.visible = true;
    chew.scale.setScalar(
      0.75 + Math.sin(t * 24) * 0.12
    );

  } else if (t < 3.5) {
    message("TO THE BALCONY...");

    hands.visible = false;

    const p = ease((t - 2) / 1.5);

    camera.position.z = lerp(
      START_Z, EDGE_Z, p
    );

    camera.position.y =
      height +
      Math.sin((t - 2) * 17) *
      0.03 * (1 - p);

    pitch = lerp(-0.16, -0.48, p);
    angles();

  } else if (t < 4) {
    message("FIND THE TRASH CAN...");

    camera.position.set(0, height, EDGE_Z);

    const a = aimAngles();
    const p = ease((t - 3.5) / 0.5);

    yaw = lerp(0, a.yaw, p);
    pitch = lerp(-0.48, a.pitch, p);

    angles();

  } else {
    camera.position.set(0, height, EDGE_Z);

    prepareAim();

    message(
      isSwivelLevel()
        ? "CLICK TO LOCK YOUR AIM"
        : "HOLD CLICK TO CHARGE"
    );
  }
}

// =====================================================
// INPUT CONTROLS
// =====================================================

function lockMouse() {
  const promise =
    renderer.domElement.requestPointerLock?.();

  promise?.catch?.(() => {});
}

document.addEventListener(
  "pointerlockchange",
  () => {
    locked =
      document.pointerLockElement ===
      renderer.domElement;

    // Cancel an unfinished charge if mouse capture
    // is lost, rather than firing an accidental shot.
    if (!locked && charging) {
      charging = false;
      power = MIN_POWER;
      hud();
      updateAimHUD();
    }

    if (!locked && state === "aiming") {
      message("CLICK THE GAME TO RESUME");
    }
  }
);

document.addEventListener("mousemove", event => {
  if (!locked || state !== "aiming") return;

  // Levels 4+ use the automatic horizontal swivel.
  if (isSwivelLevel()) return;

  yaw = clamp(
    yaw - event.movementX * 0.0022,
    -1.35,
    1.35
  );

  pitch = clamp(
    pitch - event.movementY * 0.0022,
    -1.54,
    0.35
  );

  angles();
});

renderer.domElement.addEventListener(
  "mousedown",
  event => {
    if (event.button !== 0) return;
    if (state !== "aiming") return;

    if (!locked) {
      lockMouse();
      return;
    }

    if (isSwivelLevel() && !aimLocked) {
      // First click freezes the horizontal aim.
      aimLocked = true;

      message("AIM LOCKED · HOLD TO CHARGE");
      updateAimHUD();

      return;
    }

    // Subsequent press starts charging.
    startCharge();
  }
);

document.addEventListener("mouseup", event => {
  if (event.button !== 0) return;

  if (charging) {
    releaseCharge();
  }
});

document.addEventListener("keydown", event => {
  if (state !== "aiming") return;

  if (
    [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight"
    ].includes(event.code)
  ) {
    event.preventDefault();
  }

  // Space remains an optional keyboard alternative.
  if (event.code === "Space" && !event.repeat) {
    if (isSwivelLevel() && !aimLocked) {
      aimLocked = true;
      message("AIM LOCKED · HOLD TO CHARGE");
      updateAimHUD();
    } else {
      startCharge();
    }
  }

  // Free aim levels retain keyboard fine adjustments.
  if (!isSwivelLevel()) {
    if (event.code === "ArrowLeft") yaw += 0.035;
    if (event.code === "ArrowRight") yaw -= 0.035;
    if (event.code === "ArrowUp") pitch += 0.035;
    if (event.code === "ArrowDown") pitch -= 0.035;

    pitch = clamp(pitch, -1.54, 0.35);
    angles();
  }
});

document.addEventListener("keyup", event => {
  if (event.code === "Space" && charging) {
    releaseCharge();
  }
});

// =====================================================
// PROJECTILE
// =====================================================

function spit() {
  if (state !== "aiming" || shots <= 0) return;

  charging = false;

  shots--;
  hud();

  state = "flying";
  flight = 0;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const speed = 5 + power * 0.24;

  velocity.copy(direction).multiplyScalar(speed);

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

  $("powerHud").classList.add("hidden");
  $("aimHud").classList.add("hidden");
  $("crosshair").classList.add("hidden");

  message("BON VOYAGE, GUM!");
}

// =====================================================
// COLLISION DETECTION
// =====================================================

function segmentHit(a, b, center, radius) {
  const vector = b.clone().sub(a);
  const length = vector.lengthSq();

  const t = length < 1e-8
    ? 0
    : clamp(
        center.clone().sub(a).dot(vector) / length,
        0,
        1
      );

  return a.clone()
    .addScaledVector(vector, t)
    .distanceTo(center) < radius;
}

function completeShot(hit) {
  if (state !== "flying") return;

  if (hit) {
    score += floor * 100;
    hud();

    popup("+" + floor * 100);
    showResult(true);
    return;
  }

  state = "between";
  wait = 0.7;

  message(
    shots > 0
      ? `SHOT MISSED · ${shots} LEFT`
      : "OUT OF GUM!"
  );
}

function updateFlight(dt) {
  if (state !== "flying" || !projectile) return;

  flight += dt;
  previous.copy(projectile.position);

  velocity.y -= 9.81 * dt;
  velocity.x += wind * dt;

  projectile.position.addScaledVector(
    velocity,
    dt
  );

  projectile.rotation.x += dt * 6;
  projectile.rotation.z += dt * 4;

  // Trash can opening.
  const opening = target.y + 1.38;

  if (
    previous.y > opening &&
    projectile.position.y <= opening &&
    velocity.y < 0
  ) {
    const t =
      (previous.y - opening) /
      (previous.y - projectile.position.y);

    const x = lerp(
      previous.x,
      projectile.position.x,
      t
    );

    const z = lerp(
      previous.z,
      projectile.position.z,
      t
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

  // Pedestrian penalty.
  for (const person of pedestrians) {
    const center = person.group.localToWorld(
      new THREE.Vector3(0, 1.3, 0)
    );

    if (
      segmentHit(
        previous,
        projectile.position,
        center,
        0.7 * person.scale
      )
    ) {
      person.reaction = 0.8;

      score = Math.max(0, score - 50);
      hud();

      popup("-50 PEDESTRIAN!");
      completeShot(false);

      message("WATCH WHERE YOU SPIT!");
      return;
    }
  }

  if (
    projectile.position.y <= 0.34 ||
    flight > 12
  ) {
    completeShot(false);
  }
}

// =====================================================
// THREE SHOTS PER LEVEL
// =====================================================

function updateBetween(dt) {
  if (state !== "between") return;

  wait -= dt;

  if (wait > 0) return;

  removeGum();

  if (shots <= 0) {
    showResult(false);
    return;
  }

  // Each missed shot starts a fresh aiming cycle.
  prepareAim();

  message(
    isSwivelLevel()
      ? "NEW SHOT · CLICK TO LOCK AIM"
      : `${shots} SHOTS LEFT · HOLD TO CHARGE`
  );
}

// =====================================================
// RESULTS
// =====================================================

function showResult(hit) {
  state = hit ? "success" : "out";

  charging = false;

  if (
    document.pointerLockElement ===
    renderer.domElement
  ) {
    document.exitPointerLock();
  }

  $("resultEyebrow").textContent = hit
    ? "ABSOLUTE LEGEND"
    : "ALL OUT OF GUM";

  $("resultTitle").textContent = hit
    ? "DIRECT HIT!"
    : "TRY AGAIN!";

  $("resultDescription").textContent = hit
    ? `+${floor * 100} points! You made it in ${
        3 - shots
      } shot${3 - shots === 1 ? "" : "s"}.`
    : "Three shots used. Try this floor again!";

  $("resultButton").textContent = hit
    ? "NEXT FLOOR"
    : "RETRY FLOOR";

  $("resultScreen").classList.remove("hidden");
}

$("startButton").addEventListener("click", () => {
  if (state !== "idle") return;

  $("startScreen").classList.add("hidden");
  $("hud").classList.remove("hidden");

  resetLevel();
});

$("resultButton").addEventListener("click", () => {
  $("resultScreen").classList.add("hidden");

  if (state === "success") {
    floor++;
  }

  resetLevel();
});

// =====================================================
// MAIN LOOP
// =====================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(
    clock.getDelta(),
    0.033
  );

  updateIntro(dt);
  updateSwivel(dt);
  updateCharge(dt);
  updateFlight(dt);
  updateBetween(dt);
  updatePeople(dt);
  updateCars(dt);

  if (popupTime > 0) {
    popupTime -= dt;

    if (popupTime <= 0) {
      $("popup").classList.remove("show");
    }
  }

  const glow = bin.getObjectByName("glow");

  if (glow) {
    glow.position.y =
      1.73 +
      Math.sin(clock.elapsedTime * 2) * 0.08;
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// =====================================================
// INITIALIZE
// =====================================================

target.set(0, 0.34, -13);
camera.position.set(0, 12, START_Z);

createCity(1);
makeBalcony();
makeBin();
makeHands();

hands.visible = false;

angles();
hud();
animate();
