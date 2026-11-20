
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ============================================================
// GUM SPIT V13 — COMPLETE SCRIPT
// ============================================================

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const ease = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

// ============================================================
// THREE.JS SETUP
// ============================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#91c3bf");
scene.fog = new THREE.Fog("#91c3bf", 115, 245);

const camera = new THREE.PerspectiveCamera(
  74, innerWidth / innerHeight, 0.04, 420
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

scene.add(new THREE.HemisphereLight(0xfff4d8, 0x5c8d83, 2.2));

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

// ============================================================
// MATERIALS
// ============================================================

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
  M.cream, M.sand, M.peach, M.mint,
  M.blue, M.lavender, M.coral
];

const roofs = [
  M.orange, M.navy, M.brown, M.red, M.teal
];

const shirts = [
  M.coral, M.blue, M.orange,
  M.leaf, M.lavender, M.cream
];

// ============================================================
// GROUPS AND GEOMETRY
// ============================================================

const city = new THREE.Group();
const balcony = new THREE.Group();
const bin = new THREE.Group();
const peopleGroup = new THREE.Group();
const hands = new THREE.Group();

scene.add(city, balcony, bin, peopleGroup, camera);
camera.add(hands);

const geoCache = new Map();

function shape(w, h, d, r = 0.08) {
  r = Math.min(r, w * 0.45, h * 0.45, d * 0.45);
  const key = [w, h, d, r].join(",");

  if (!geoCache.has(key)) {
    geoCache.set(key, new RoundedBoxGeometry(w, h, d, 2, r));
  }
  return geoCache.get(key);
}

function box(parent, w, h, d, material, x = 0, y = 0, z = 0, r = 0.08) {
  const o = new THREE.Mesh(shape(w, h, d, r), material);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function cyl(parent, top, bottom, h, material, x = 0, y = 0, z = 0, n = 10) {
  const o = new THREE.Mesh(
    new THREE.CylinderGeometry(top, bottom, h, n),
    material
  );
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function ball(parent, radius, material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    material
  );
  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
}

// ============================================================
// RANDOM CITY GENERATION
// ============================================================

function rng(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

let rand = Math.random;
const pick = array => array[Math.floor(rand() * array.length)];

function textTexture(text) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;

  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f6e9cf";
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = "#30454b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 65px Arial";
  ctx.fillText(text, 256, 65, 485);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const signCache = new Map();

function sign(parent, text, width, x, y, z) {
  if (!signCache.has(text)) {
    signCache.set(text, new THREE.MeshBasicMaterial({
      map: textTexture(text),
      side: THREE.DoubleSide
    }));
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / 4),
    signCache.get(text)
  );

  mesh.position.set(x, y, z);
  parent.add(mesh);
}

function tree(x, z, size = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.37, z);
  g.scale.setScalar(size);
  city.add(g);

  cyl(g, 0.18, 0.24, 2.1, M.wood, 0, 1.1);

  for (let i = 0; i < 3; i++) {
    const crown = ball(
      g,
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
    ball(city, 0.43, M.leaf2, x + i * 0.6, 1.15, z);
  }
}

function bench(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.36, z);
  city.add(g);

  box(g, 2.3, 0.16, 0.68, M.wood, 0, 0.65);
  box(g, 2.3, 0.7, 0.13, M.wood, 0, 1.08, 0.31);

  for (const a of [-0.8, 0.8]) {
    box(g, 0.12, 0.68, 0.12, M.metal, a, 0.3);
  }
}

function lamp(x, z) {
  cyl(city, 0.09, 0.11, 5.5, M.metal, x, 3.1, z);
  box(city, 1.35, 0.15, 0.35, M.metal, x + 0.55, 5.85, z);
  box(city, 0.95, 0.05, 0.27, M.lit, x + 0.67, 5.72, z);
}

// ============================================================
// BUILDINGS — FRONT AND SIDE WINDOWS RETAINED
// ============================================================

function building(x, z, w, d, h, kind) {
  const g = new THREE.Group();
  g.position.set(x, 0.38, z);
  city.add(g);

  const wall = pick(walls);
  const trim = pick(roofs);

  box(g, w, h, d, wall, 0, h / 2, 0, 0.17);
  box(g, w + 0.5, 0.42, d + 0.5, trim, 0, h + 0.17, 0, 0.1);
  box(g, w + 0.15, 0.14, d + 0.15, M.cream, 0, h - 0.4);

  const floors = Math.max(1, Math.floor((h - 2.5) / 3.2));
  const cols = Math.max(2, Math.floor((w - 2) / 2.55));
  const sideCols = Math.max(2, Math.floor((d - 2) / 2.8));

  for (let f = 0; f < floors; f++) {
    const yy = 3.3 + f * 3.2;
    if (yy > h - 1.1) break;

    for (let j = 0; j < cols; j++) {
      const xx = -w / 2 + (j + 0.5) * w / cols;

      box(g, 1.15, 1.55, 0.13,
        rand() < 0.15 ? M.lit : M.glass,
        xx, yy, -d / 2 - 0.09, 0.035);

      box(g, 1.4, 0.13, 0.31, M.cream,
        xx, yy - 0.83, -d / 2 - 0.16);

      box(g, 0.07, 1.53, 0.15, M.navy,
        xx, yy, -d / 2 - 0.17, 0.015);
    }

    for (let j = 0; j < sideCols; j++) {
      const zz = -d / 2 + (j + 0.5) * d / sideCols;

      for (const side of [-1, 1]) {
        box(g, 0.13, 1.55, 1.15,
          rand() < 0.12 ? M.lit : M.glass,
          side * (w / 2 + 0.09), yy, zz, 0.035);

        box(g, 0.3, 0.12, 1.38, M.cream,
          side * (w / 2 + 0.18), yy - 0.83, zz);
      }
    }
  }

  if (kind === "shop" || kind === "cafe") {
    box(g, w - 0.8, 2.35, 0.18, M.glass,
      0, 1.35, -d / 2 - 0.13);

    box(g, 1.45, 2.3, 0.22, M.navy,
      0, 1.25, -d / 2 - 0.25);

    box(g, w + 0.4, 0.18, 2.2, M.cream,
      0, 3.05, -d / 2 - 1.1);

    const n = Math.max(5, Math.round(w / 1.1));

    for (let i = 0; i < n; i += 2) {
      box(g, w / n, 0.2, 2.23, trim,
        -w / 2 + (i + 0.5) * w / n,
        3.08, -d / 2 - 1.1);
    }

    box(g, w - 0.8, 0.75, 0.17, trim,
      0, 4.1, -d / 2 - 0.17);

    sign(g,
      kind === "cafe" ? "CAFE" : pick(["MARKET", "BAKERY", "SHOP", "DINER"]),
      Math.min(w - 1, 7),
      0, 4.1, -d / 2 - 0.28
    );
  } else {
    box(g, 1.7, 2.5, 0.16, M.navy,
      0, 1.25, -d / 2 - 0.16);

    box(g, 2.3, 0.17, 0.5, M.cream,
      0, 2.55, -d / 2 - 0.3);

    if (kind === "apartment") {
      for (let f = 1; f < floors; f += 2) {
        const yy = 3.3 + f * 3.2;

        box(g, 3, 0.13, 1, M.cream,
          -w * 0.22, yy - 0.95, -d / 2 - 0.65);

        box(g, 3, 0.08, 0.08, M.metal,
          -w * 0.22, yy + 0.05, -d / 2 - 1.08);

        for (const a of [-1.2, 0, 1.2]) {
          cyl(g, 0.035, 0.035, 0.95, M.metal,
            -w * 0.22 + a, yy - 0.45, -d / 2 - 1.08);
        }
      }
    }
  }

  if (h > 10) {
    box(g, 2.5, 0.8, 2.2, M.cream,
      w * 0.18, h + 0.72, d * 0.15);

    cyl(g, 0.55, 0.55, 0.7, M.metal,
      -w * 0.2, h + 0.75, d * 0.12);
  }
}

function park(x, z, w, d, type) {
  box(city, w, 0.35, d, M.grass2, x, 0.34, z);

  for (let i = 0; i < 5; i++) {
    if (type === "plaza" && i < 2) continue;
    tree(
      x - w / 2 + 2 + rand() * (w - 4),
      z - d / 2 + 2 + rand() * (d - 4),
      0.7 + rand() * 0.4
    );
  }

  if (type === "plaza") {
    box(city, 6, 1, 6, M.cream, x, 0.85, z);
    box(city, 4.7, 0.08, 4.7, M.teal, x, 1.4, z);
    cyl(city, 0.4, 0.65, 1.5, M.white, x, 2.1, z);
    ball(city, 0.5, M.blue, x, 3, z);
  } else {
    bench(x, z);
    planter(x + 3, z + 2);
  }
}

// ============================================================
// CARS
// ============================================================

const cars = [];

function car(x, z, material, dir = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.2, z);
  city.add(g);

  box(g, 3.6, 0.85, 1.9, material, 0, 0.8, 0, 0.36);
  box(g, 2.05, 0.9, 1.7, material, -0.2, 1.45, 0, 0.28);
  box(g, 1.3, 0.42, 0.08, M.glass, -0.2, 1.52, -0.88);

  for (const xx of [-1.1, 1.1]) {
    for (const zz of [-0.93, 0.93]) {
      const wheel = cyl(g, 0.38, 0.38, 0.2,
        M.black, xx, 0.42, zz, 14);
      wheel.rotation.x = Math.PI / 2;
    }
  }

  g.rotation.y = dir < 0 ? Math.PI : 0;
  cars.push({ g, dir, speed: 1.4 + rand() * 2 });
}

const pedestrians = [];

function pedestrian(x, z, dir, speed, i) {
  const g = new THREE.Group();
  g.position.set(x, 0.4, z);
  peopleGroup.add(g);

  const shirt = shirts[i % shirts.length];
  const skin = i % 4 === 0 ? M.sand : M.skin;

  const torso = ball(g, 0.48, shirt, 0, 1.28);
  torso.scale.set(0.95, 1.12, 0.75);

  ball(g, 0.36, skin, 0, 2.03);

  const hair = ball(g, 0.36,
    i % 3 ? M.brown : M.dark, 0, 2.27);
  hair.scale.y = 0.43;

  const arms = [];
  const legs = [];

  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.47, 1.55, 0);
    g.add(arm);

    box(arm, 0.24, 0.65, 0.25, shirt, 0, -0.33, 0, 0.12);
    ball(arm, 0.13, skin, 0, -0.7);
    arms.push(arm);

    const leg = new THREE.Group();
    leg.position.set(s * 0.2, 0.88, 0);
    g.add(leg);

    box(leg, 0.27, 0.7, 0.3, M.navy, 0, -0.35);
    box(leg, 0.35, 0.17, 0.47, M.black, 0, -0.72, -0.08);
    legs.push(leg);
  }

  g.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;

  const scale = 0.85 + rand() * 0.25;
  g.scale.setScalar(scale);

  pedestrians.push({
    g, dir, speed, arms, legs,
    phase: rand() * Math.PI * 2,
    reaction: 0, scale
  });
}

function updatePeople(dt) {
  for (const p of pedestrians) {
    p.phase += dt * p.speed * 5;

    if (p.reaction > 0) {
      p.reaction = Math.max(0, p.reaction - dt);
      const k = Math.sin((1 - p.reaction / 0.8) * Math.PI);

      p.arms[0].rotation.z = -k * 2;
      p.arms[1].rotation.z = k * 2;
      p.g.position.y = 0.4 + k * 0.2;
      continue;
    }

    p.arms.forEach(a => a.rotation.z = 0);
    p.g.position.x += p.dir * p.speed * dt;

    if (p.g.position.x > 140) p.g.position.x = -140;
    if (p.g.position.x < -140) p.g.position.x = 140;

    const step = Math.sin(p.phase);

    p.legs[0].rotation.x = step * 0.5;
    p.legs[1].rotation.x = -step * 0.5;
    p.arms[0].rotation.x = -step * 0.4;
    p.arms[1].rotation.x = step * 0.4;
    p.g.position.y = 0.4 + Math.abs(step) * 0.04;
  }
}

function updateCars(dt) {
  for (const c of cars) {
    c.g.position.x += c.dir * c.speed * dt;
    if (c.g.position.x > 140) c.g.position.x = -140;
    if (c.g.position.x < -140) c.g.position.x = 140;
  }
}

// ============================================================
// FULL CITY
// ============================================================

function createCity(level) {
  city.clear();
  cars.length = 0;
  peopleGroup.clear();
  pedestrians.length = 0;

  rand = rng(2026 + level * 9173);

  box(city, 320, 0.4, 300, M.grass, 0, -0.3, -86);

  for (const z of [-34, -82, -130]) {
    box(city, 300, 0.12, 14, M.road, 0, 0.02, z);
  }

  for (const x of [-96, -48, 0, 48, 96]) {
    box(city, 13, 0.12, 245, M.road, x, 0.025, -100);
  }

  box(city, 300, 0.28, 14, M.walk, 0, 0.15, -17);

  for (let x = -140; x <= 140; x += 9) {
    box(city, 3, 0.02, 0.16, M.line, x, 0.1, -34);
    box(city, 3, 0.02, 0.16, M.line, x, 0.1, -82);
  }

  for (const x of [-96, -48, 0, 48, 96]) {
    for (const z of [-34, -82, -130]) {
      for (let i = -3; i <= 3; i++) {
        box(city, 0.8, 0.025, 3, M.line,
          x + i * 1.4, 0.11, z - 4);
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

      const parkChance = row === 0 && col === 2 ? 0 : 0.13;

      if (rand() < parkChance) {
        park(x, z, 28, 23, rand() < 0.5 ? "plaza" : "garden");
        continue;
      }

      const count = rand() < 0.5 ? 2 : 3;

      for (let k = 0; k < count; k++) {
        const w = count === 2 ? 12.5 : 8.3;
        const px = x + (k - (count - 1) / 2) *
          (count === 2 ? 14 : 9.4);

        const h = 7 + Math.floor(rand() * 4) * 3.2 +
          (level > 3 ? Math.min(level - 3, 9) * 0.8 : 0);

        const kind = rand() < 0.27 ? "shop" :
          rand() < 0.22 ? "cafe" :
          rand() < 0.45 ? "apartment" : "office";

        building(
          px, z + (rand() - 0.5) * 2,
          w, 16 + rand() * 2, h, kind
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

  for (let x = -138; x <= 138; x += 10) {
    if (Math.abs(x) < 9) continue;

    if (rand() < 0.74) {
      tree(x, -11, 0.65 + rand() * 0.25);
    } else {
      planter(x, -11);
    }
  }

  for (const x of [-35, -20, 20, 35]) {
    bench(x, -19);
    if (rand() < 0.6) lamp(x + 4, -24);
  }

  for (let i = 0; i < 13; i++) {
    car(
      -135 + rand() * 270,
      i % 2 ? -30 : -38,
      pick([M.red, M.blue, M.cream, M.orange, M.teal]),
      i % 2 ? 1 : -1
    );
  }

  for (let i = 0; i < 28; i++) {
    const near = i < 18;

    pedestrian(
      -110 + rand() * 220,
      near ? -13 - rand() * 8 : -47 - rand() * 6,
      rand() < 0.5 ? -1 : 1,
      0.7 + rand() * 1.1,
      i
    );
  }

  rand = Math.random;
}

// ============================================================
// GAME VARIABLES
// ============================================================

let floor = 1;
let score = 0;
let shots = 3;
let power = 10;
let wind = 0;
let height = 12;

let state = "idle";
let difficulty = "normal";
let intro = 0;

let yaw = 0;
let pitch = -0.16;
let locked = false;
let charging = false;
let chargeDirection = 1;

let aimLocked = false;
let swivelTime = 0;
let swivelCenter = 0;
let swivelRange = 0.5;
let swivelSpeed = 0.9;

let projectile = null;
let flight = 0;
let wait = 0;
let popupTime = 0;

let perfectStreak = 0;
let comboMultiplier = 1;
let resultTimer = null;
let comboTimer = null;
let previousTarget = null;

const MIN_POWER = 10;
const MAX_POWER = 100;
const CHARGE_SPEED = 75;

const START = 1.35;
const EDGE = -4.66;

const target = new THREE.Vector3();
const velocity = new THREE.Vector3();
const previous = new THREE.Vector3();

// ============================================================
// RED TRAJECTORY GUIDE
// ============================================================

const guideMaterial = new THREE.LineBasicMaterial({
  color: 0xe84646,
  transparent: true,
  opacity: 0.72,
  depthTest: true,
  depthWrite: false
});

const guideLine = new THREE.Line(
  new THREE.BufferGeometry(),
  guideMaterial
);

const landingRing = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.55, 48),
  new THREE.MeshBasicMaterial({
    color: 0xe84646,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);

landingRing.rotation.x = -Math.PI / 2;
guideLine.visible = false;
landingRing.visible = false;

scene.add(guideLine, landingRing);

function updateGuide() {
  const show = difficulty === "easy" && state === "aiming";

  guideLine.visible = show;
  landingRing.visible = show;

  if (!show) return;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const origin = camera.position.clone()
    .addScaledVector(direction, 0.75);

  origin.y -= 0.12;

  const v = direction.multiplyScalar(5 + power * 0.24);

  const a = -0.5 * 9.81;
  const b = v.y;
  const c = origin.y - 0.34;
  const disc = b * b - 4 * a * c;

  if (disc < 0) {
    guideLine.visible = false;
    landingRing.visible = false;
    return;
  }

  const t = (-b - Math.sqrt(disc)) / (2 * a);

  if (!Number.isFinite(t) || t <= 0) {
    guideLine.visible = false;
    landingRing.visible = false;
    return;
  }

  const points = [];
  const count = 54;

  for (let i = 0; i <= count; i++) {
    const sec = t * i / count;

    points.push(new THREE.Vector3(
      origin.x + v.x * sec + 0.5 * wind * sec * sec,
      origin.y + v.y * sec - 4.905 * sec * sec,
      origin.z + v.z * sec
    ));
  }

  guideLine.geometry.dispose();
  guideLine.geometry = new THREE.BufferGeometry()
    .setFromPoints(points);

  const landing = points[points.length - 1];

  landingRing.position.set(landing.x, 0.38, landing.z);
}

// ============================================================
// BALCONY AND TRASH CAN
// ============================================================

function makeBalcony() {
  balcony.clear();
  const ground = height - 1.65;

  box(balcony, 28, 100, 10, M.peach, 0, ground - 14, 9.4);
  box(balcony, 8.6, 0.32, 6.3, M.walk, 0, ground - 0.2, -1.05);
  box(balcony, 8.8, 0.15, 0.3, M.cream, 0, ground - 0.08, -4.12);

  for (const y of [0.42, 1.08]) {
    box(balcony, 8.5, 0.12, 0.13, M.metal,
      0, ground + y, -4.02);
  }

  for (let x = -4.1; x <= 4.1; x += 0.65) {
    cyl(balcony, 0.055, 0.055, 1.1, M.metal,
      x, ground + 0.56, -4.02);
  }

  for (const s of [-1, 1]) {
    box(balcony, 0.13, 0.13, 6.3, M.metal,
      s * 4.25, ground + 1.08, -1.05);

    for (let z = -3.9; z < 2; z += 0.7) {
      cyl(balcony, 0.05, 0.05, 1.1, M.metal,
        s * 4.25, ground + 0.56, z);
    }
  }

  box(balcony, 3.5, 4.5, 0.25, M.cream,
    0, ground + 2.15, 3.6);

  box(balcony, 2.7, 3.9, 0.08, M.glass,
    0, ground + 2.1, 3.4);

  cyl(balcony, 0.43, 0.35, 0.6, M.coral,
    3.1, ground + 0.3, 0.5);

  ball(balcony, 0.6, M.leaf2,
    3.1, ground + 1, 0.5);
}

function makeBin() {
  bin.clear();
  bin.position.copy(target);

  cyl(bin, 0.73, 0.56, 1.35, M.teal, 0, 0.675, 0, 24);
  cyl(bin, 0.6, 0.6, 0.035, M.dark, 0, 1.37, 0, 24);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.07, 10, 32),
    M.cream
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.4;
  bin.add(ring);

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.87, 0.035, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd886 })
  );

  glow.rotation.x = Math.PI / 2;
  glow.position.y = 1.73;
  glow.name = "glow";
  bin.add(glow);

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;

    box(bin, 0.045, 0.94, 0.045, M.leaf3,
      Math.cos(a) * 0.6, 0.7, Math.sin(a) * 0.6);
  }
}

// ============================================================
// LOW-POLY HANDS AND GUM PACKAGE
// ============================================================

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

let leftHand;
let rightHand;
let pack;
let flap;
let stick;
let chew;

function facetedMitten(parent, rings, material, sides = 7) {
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
      const n = (j + 1) % sides;
      const a = i * sides + j;
      const b = i * sides + n;
      const c = (i + 1) * sides + j;
      const d = (i + 1) * sides + n;

      indices.push(a, b, c, b, d, c);
    }
  }

  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j + 1, j);

    const last = (rings.length - 1) * sides;
    indices.push(last, last + j, last + j + 1);
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
  const g = new THREE.Group();
  hands.add(g);

  g.position.set(side * 0.66, -0.44, -1.19);
  g.rotation.z = -side * 0.075;

  facetedMitten(g, [
    { x: side * 0.018, y: -0.56, z: -0.025, rx: 0.091, rz: 0.075 },
    { x: side * 0.014, y: -0.37, z: -0.02, rx: 0.103, rz: 0.077 },
    { x: 0, y: -0.23, z: 0, rx: 0.09, rz: 0.066 }
  ], M.blue, 8);

  facetedMitten(g, [
    { x: 0, y: -0.27, z: 0, rx: 0.071, rz: 0.053 },
    { x: 0, y: -0.16, z: 0, rx: 0.096, rz: 0.068 },
    { x: side * 0.012, y: 0.005, z: 0, rx: 0.142, rz: 0.087 },
    { x: side * 0.006, y: 0.17, z: -0.004, rx: 0.151, rz: 0.085 },
    { x: -side * 0.004, y: 0.29, z: -0.014, rx: 0.133, rz: 0.074 },
    { x: -side * 0.009, y: 0.345, z: -0.023, rx: 0.105, rz: 0.058 },
    { x: -side * 0.01, y: 0.37, z: -0.027, rx: 0.073, rz: 0.043 }
  ], handSkin, 7);

  const thumb = new THREE.Group();
  thumb.position.set(-side * 0.105, 0.035, 0.012);
  thumb.rotation.z = side * 0.54;
  g.add(thumb);

  facetedMitten(thumb, [
    { x: 0, y: 0, z: 0, rx: 0.065, rz: 0.055 },
    { x: 0, y: 0.095, z: 0.004, rx: 0.062, rz: 0.052 },
    { x: -side * 0.008, y: 0.18, z: 0.002, rx: 0.047, rz: 0.041 },
    { x: -side * 0.015, y: 0.235, z: -0.008, rx: 0.029, rz: 0.029 }
  ], handSkin, 6);

  return { g, thumb };
}

function gumPackTexture() {
  const c = document.createElement("canvas");
  c.width = 1536;
  c.height = 640;

  const a = c.getContext("2d");

  a.fillStyle = "#fffdf8";
  a.fillRect(0, 0, 1536, 640);

  a.fillStyle = "#ae2035";
  a.fillRect(0, 0, 175, 640);
  a.fillRect(1375, 0, 161, 640);

  a.fillStyle = "#fffdf8";
  a.beginPath();
  a.moveTo(105, 0);
  a.lineTo(1425, 0);
  a.lineTo(1320, 640);
  a.lineTo(180, 640);
  a.closePath();
  a.fill();

  a.fillStyle = "#ad2637";
  a.font = "900 104px Arial";
  a.textAlign = "center";
  a.fillText("WRIGLEY'S", 790, 175);

  a.fillStyle = "#065740";
  a.beginPath();
  a.moveTo(275, 235);
  a.lineTo(1160, 235);
  a.lineTo(1300, 332);
  a.lineTo(1160, 430);
  a.lineTo(275, 430);
  a.lineTo(195, 332);
  a.closePath();
  a.fill();

  a.strokeStyle = "#ffffff";
  a.lineWidth = 15;
  a.stroke();

  a.fillStyle = "#ffffff";
  a.font = "900 105px Arial";
  a.fillText("SPEARMINT", 770, 363);

  a.fillStyle = "#ad2637";
  a.font = "800 54px Arial";
  a.fillText("CHEWING GUM", 780, 512);

  a.font = "800 36px Arial";
  a.fillText("7 STICKS", 1320, 570);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(
    8, renderer.capabilities.getMaxAnisotropy()
  );

  return texture;
}

function makeHands() {
  hands.clear();

  leftHand = createHand(-1);
  rightHand = createHand(1);

  pack = new THREE.Group();
  hands.add(pack);
  pack.position.set(0, -0.23, -1.03);
  pack.rotation.set(-0.045, 0, 0);

  box(pack, 1.02, 0.405, 0.18, wrapperWhite, 0, 0, 0, 0.025);
  box(pack, 0.12, 0.407, 0.184, wrapperRed, -0.46, 0, 0, 0.018);
  box(pack, 0.12, 0.407, 0.184, wrapperRed, 0.46, 0, 0, 0.018);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.965, 0.37),
    new THREE.MeshBasicMaterial({ map: gumPackTexture() })
  );

  label.position.z = 0.093;
  pack.add(label);

  box(pack, 0.96, 0.022, 0.185, wrapperWhite,
    0, 0.204, 0, 0.009);

  box(pack, 0.96, 0.022, 0.185, wrapperRed,
    0, -0.204, 0, 0.009);

  box(pack, 0.74, 0.009, 0.014, wrapperGreen,
    0, 0.212, 0.03, 0.003);

  flap = new THREE.Group();
  flap.position.set(0, 0.204, -0.01);
  pack.add(flap);

  box(flap, 1, 0.145, 0.024, wrapperWhite,
    0, 0.072, 0, 0.008);

  box(flap, 0.13, 0.145, 0.026, wrapperRed,
    -0.435, 0.072, 0, 0.006);

  box(flap, 0.13, 0.145, 0.026, wrapperRed,
    0.435, 0.072, 0, 0.006);

  stick = new THREE.Group();
  pack.add(stick);
  stick.position.set(0.16, 0.025, -0.12);

  box(stick, 0.145, 0.315, 0.055, foilMat,
    0, 0, 0, 0.012);

  for (let i = 0; i < 3; i++) {
    box(stick, 0.13, 0.009, 0.058, wrapperWhite,
      0, -0.095 + i * 0.095, 0.004, 0.002);
  }

  chew = ball(hands, 0.052, M.gum, 0, -0.05, -0.68);
  chew.visible = false;
}

// ============================================================
// HUD AND WIND DIRECTION
// ============================================================

function hud() {
  $("floor").textContent = floor;
  $("score").textContent = score.toLocaleString();

  const screenWind = wind * Math.cos(yaw);
  const arrow = Math.abs(screenWind) < 0.05
    ? "•"
    : screenWind > 0 ? "→" : "←";

  $("wind").textContent = arrow + " " + Math.abs(wind).toFixed(1);

  $("powerText").textContent = Math.round(power) + "%";
  $("powerFill").style.width = power + "%";

  $("shots").innerHTML =
    '<div>GUM LEFT</div><div class="pieces">' +
    Array.from({ length: 3 }, (_, i) =>
      `<div class="piece ${i >= shots ? "used" : ""}"></div>`
    ).join("") +
    "</div>";
}

function message(text) {
  $("message").textContent = text;
}

function popup(text) {
  $("popup").textContent = text;
  $("popup").classList.add("show");
  popupTime = 1.2;
}

// ============================================================
// AIMING MODES
// ============================================================

function isHard() {
  return difficulty === "hard";
}

function angles() {
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function aimAngles() {
  const d = target.clone()
    .add(new THREE.Vector3(0, 1.38, 0))
    .sub(camera.position)
    .normalize();

  return {
    yaw: Math.atan2(-d.x, -d.z),
    pitch: Math.asin(d.y)
  };
}

function updateAimStatus() {
  const status = $("aimStatus");

  if (state !== "aiming") {
    status.classList.add("hidden");
    return;
  }

  status.classList.remove("hidden");

  if (isHard()) {
    status.textContent = aimLocked
      ? charging ? "RELEASE TO SPIT" : "AIM LOCKED · HOLD TO CHARGE"
      : "CLICK TO LOCK AIM";

    $("aimHint").textContent = aimLocked
      ? "HOLD CLICK TO CHARGE · RELEASE TO SPIT"
      : "TIME THE SWIVEL · CLICK TO LOCK";

    $("crosshair").classList.toggle("aimLocked", aimLocked);
  } else {
    status.textContent = charging
      ? "RELEASE TO SPIT"
      : difficulty === "easy"
        ? "EASY · RED TRAJECTORY"
        : "NORMAL · FREE AIM";

    $("aimHint").textContent = charging
      ? "RELEASE AT YOUR DESIRED POWER"
      : "MOUSE TO AIM · HOLD CLICK TO CHARGE";

    $("crosshair").classList.remove("aimLocked");
  }
}

function suggestedPitch() {
  const dx = target.x - camera.position.x;
  const dz = target.z - camera.position.z;
  const distance = Math.hypot(dx, dz);

  const dy = target.y + 1.38 - (camera.position.y - 0.12);
  const speed = 5 + 65 * 0.24;
  const g = 9.81;

  const discriminant =
    speed ** 4 - g * (g * distance ** 2 + 2 * dy * speed ** 2);

  if (discriminant < 0) return aimAngles().pitch;

  return clamp(
    Math.atan((speed ** 2 - Math.sqrt(discriminant)) / (g * distance)),
    -1.52,
    0.25
  );
}

function prepareAim() {
  charging = false;
  power = MIN_POWER;
  chargeDirection = 1;
  aimLocked = !isHard();
  swivelTime = 0;

  const a = aimAngles();
  swivelCenter = a.yaw;

  swivelRange = floor <= 5 ? 0.48 :
    floor <= 8 ? 0.55 : 0.65;

  swivelSpeed = floor <= 5 ? 0.85 :
    floor <= 8 ? 1.25 :
      Math.min(2.1, 1.55 + (floor - 9) * 0.07);

  pitch = suggestedPitch();
  yaw = isHard() ? swivelCenter - swivelRange : a.yaw;

  angles();
  state = "aiming";

  $("crosshair").classList.remove("hidden");
  $("powerHud").classList.remove("hidden");

  updateAimStatus();
  hud();
}

function updateSwivel(dt) {
  if (state !== "aiming" || !isHard() || aimLocked) return;

  swivelTime += dt * swivelSpeed;
  yaw = swivelCenter +
    Math.sin(swivelTime - Math.PI / 2) * swivelRange;

  angles();
}

function startCharge() {
  if (state !== "aiming" || (isHard() && !aimLocked) || charging) {
    return;
  }

  charging = true;
  power = MIN_POWER;
  chargeDirection = 1;

  updateAimStatus();
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

// ============================================================
// FIRST-SHOT COMBO SYSTEM
// ============================================================

function resetStreak() {
  perfectStreak = 0;
  comboMultiplier = 1;
}

function hideCombo() {
  if (comboTimer !== null) {
    clearTimeout(comboTimer);
    comboTimer = null;
  }

  $("comboPopup").classList.add("hidden");
  $("comboPopup").classList.remove("comboAnimate");
}

function showCombo(points) {
  const el = $("comboPopup");

  $("comboLabel").textContent = perfectStreak === 1
    ? "PERFECT SHOT!"
    : "PERFECT COMBO!";

  $("comboMultiplier").textContent =
    comboMultiplier.toLocaleString() + "× COMBO";

  $("comboPoints").textContent =
    "+" + points.toLocaleString() + " POINTS";

  $("comboStreak").textContent = perfectStreak === 1
    ? "FIRST-SHOT BONUS!"
    : perfectStreak + " PERFECT ROUNDS IN A ROW";

  el.classList.remove("hidden", "comboAnimate");
  void el.offsetWidth;
  el.classList.add("comboAnimate");

  if (comboTimer !== null) clearTimeout(comboTimer);

  comboTimer = setTimeout(() => {
    el.classList.add("hidden");
    el.classList.remove("comboAnimate");
    comboTimer = null;
  }, 2800);
}

// ============================================================
// LEVEL RESET
// ============================================================

function removeGum() {
  if (projectile) {
    scene.remove(projectile);
    projectile.geometry.dispose();
    projectile = null;
  }
}

function resetLevel() {
  hideCombo();

  if (resultTimer !== null) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }

  height = 12 + (floor - 1) * 6;
  shots = 3;
  power = MIN_POWER;
  charging = false;

  wind = (Math.random() - 0.5) * Math.min(0.5 * floor, 3);

  let x, z;

  for (let i = 0; i < 30; i++) {
    x = -8 + Math.random() * 16;
    z = -13 - Math.random() * 7;

    if (
      !previousTarget ||
      Math.hypot(x - previousTarget.x, z - previousTarget.z) > 4
    ) break;
  }

  previousTarget = { x, z };
  target.set(x, 0.34, z);

  createCity(floor);
  makeBalcony();
  makeBin();
  makeHands();

  hands.visible = true;
  removeGum();

  camera.position.set(0, height, START);
  yaw = 0;
  pitch = -0.16;
  angles();

  intro = 0;
  state = "intro";

  guideLine.visible = false;
  landingRing.visible = false;

  $("crosshair").classList.add("hidden");
  $("powerHud").classList.add("hidden");
  $("aimStatus").classList.add("hidden");

  message("UNWRAPPING THE GUM...");
  hud();
}

// ============================================================
// INTRO ANIMATION
// ============================================================

function updateIntro(dt) {
  if (state !== "intro") return;

  intro += dt;
  const t = intro;

  if (t < 0.8) {
    message("UNWRAPPING THE GUM...");

    const p = ease(t / 0.8);
    flap.rotation.x = -2.2 * p;
    pack.rotation.z = Math.sin(t * 7) * 0.008;
    rightHand.g.rotation.z = -0.075 + 0.012 * p;

  } else if (t < 1.4) {
    message("ONE FRESH STICK...");

    const p = ease((t - 0.8) / 0.6);
    stick.position.set(
      0.16 + 0.1 * p,
      0.025 + 0.39 * p,
      -0.12 + 0.08 * p
    );

    rightHand.g.position.set(
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
    leftHand.g.position.y = -0.44 - 0.52 * p;
    rightHand.g.position.y = -0.395 - 0.52 * p;

    chew.visible = true;
    chew.scale.setScalar(0.75 + Math.sin(t * 24) * 0.12);

  } else if (t < 3.5) {
    message("TO THE BALCONY...");
    hands.visible = false;

    const p = ease((t - 2) / 1.5);

    camera.position.z = lerp(START, EDGE, p);
    camera.position.y =
      height + Math.sin((t - 2) * 17) * 0.03 * (1 - p);

    pitch = lerp(-0.16, -0.48, p);
    angles();

  } else if (t < 4) {
    message("THERE IT IS...");
    camera.position.set(0, height, EDGE);

    const a = aimAngles();
    const p = ease((t - 3.5) / 0.5);

    yaw = lerp(0, a.yaw, p);
    pitch = lerp(-0.48, a.pitch, p);
    angles();

  } else {
    camera.position.set(0, height, EDGE);
    prepareAim();

    message(isHard()
      ? "CLICK TO LOCK YOUR AIM"
      : "HOLD CLICK TO CHARGE");
  }
}

// ============================================================
// MOUSE AND KEYBOARD CONTROLS
// ============================================================

function lockMouse() {
  const p = renderer.domElement.requestPointerLock?.();
  p?.catch?.(() => {});
}

document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === renderer.domElement;

  if (!locked && charging) {
    charging = false;
    power = MIN_POWER;
    hud();
    updateAimStatus();
  }

  if (state === "aiming" && !locked) {
    message("CLICK THE GAME TO RESUME");
  }
});

document.addEventListener("mousemove", e => {
  if (!locked || state !== "aiming" || isHard()) return;

  yaw = clamp(yaw - e.movementX * 0.0022, -1.35, 1.35);
  pitch = clamp(pitch - e.movementY * 0.0022, -1.54, 0.35);
  angles();
});

document.addEventListener("keydown", e => {
  if (state !== "aiming") return;

  if ([
    "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"
  ].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === "Space" && !e.repeat) {
    if (isHard() && !aimLocked) {
      aimLocked = true;
      updateAimStatus();
      message("AIM LOCKED · HOLD TO CHARGE");
    } else {
      startCharge();
    }
  }

  if (!isHard()) {
    if (e.code === "ArrowLeft") yaw += 0.035;
    if (e.code === "ArrowRight") yaw -= 0.035;
    if (e.code === "ArrowUp") pitch += 0.035;
    if (e.code === "ArrowDown") pitch -= 0.035;

    pitch = clamp(pitch, -1.54, 0.35);
    angles();
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space" && charging) {
    releaseCharge();
  }
});

renderer.domElement.addEventListener("mousedown", e => {
  if (e.button !== 0 || state !== "aiming") return;

  if (!locked) {
    lockMouse();
    return;
  }

  if (isHard() && !aimLocked) {
    aimLocked = true;
    updateAimStatus();
    message("AIM LOCKED · HOLD TO CHARGE");
    return;
  }

  startCharge();
});

document.addEventListener("mouseup", e => {
  if (e.button === 0 && charging) {
    releaseCharge();
  }
});

// ============================================================
// SHOOTING
// ============================================================

function spit() {
  if (state !== "aiming" || shots <= 0) return;

  shots--;
  hud();

  state = "flying";
  flight = 0;

  updateAimStatus();
  guideLine.visible = false;
  landingRing.visible = false;

  const d = new THREE.Vector3();
  camera.getWorldDirection(d);

  velocity.copy(d).multiplyScalar(5 + power * 0.24);

  projectile = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10),
    M.gum
  );

  projectile.scale.set(1.2, 0.65, 0.95);
  projectile.position.copy(camera.position)
    .addScaledVector(d, 0.75);

  projectile.position.y -= 0.12;
  projectile.castShadow = true;
  scene.add(projectile);

  message("BON VOYAGE, GUM!");
}

function segmentHit(a, b, c, r) {
  const v = b.clone().sub(a);
  const len = v.lengthSq();

  const t = len < 1e-8 ? 0 :
    clamp(c.clone().sub(a).dot(v) / len, 0, 1);

  return a.clone().addScaledVector(v, t).distanceTo(c) < r;
}

// ============================================================
// SHOT SCORING
// ============================================================

function complete(hit) {
  if (state !== "flying") return;

  if (hit) {
    const perfect = shots === 2;
    let points = floor * 100;

    if (perfect) {
      perfectStreak++;
      comboMultiplier = 2 ** perfectStreak;
      points *= comboMultiplier;
      showCombo(points);
    } else {
      resetStreak();
      popup("+" + points.toLocaleString());
    }

    score += points;
    hud();
    result(true, points, perfect);
    return;
  }

  if (shots === 2) resetStreak();

  state = "between";
  wait = 0.7;

  message(shots
    ? "SHOT MISSED · " + shots + " LEFT"
    : "OUT OF GUM!");
}

// ============================================================
// PROJECTILE PHYSICS
// ============================================================

function updateFlight(dt) {
  if (state !== "flying" || !projectile) return;

  flight += dt;
  previous.copy(projectile.position);

  velocity.y -= 9.81 * dt;
  velocity.x += wind * dt;

  projectile.position.addScaledVector(velocity, dt);
  projectile.rotation.x += dt * 6;
  projectile.rotation.z += dt * 4;

  const opening = target.y + 1.38;

  if (
    previous.y > opening &&
    projectile.position.y <= opening &&
    velocity.y < 0
  ) {
    const t = (previous.y - opening) /
      (previous.y - projectile.position.y);

    const x = lerp(previous.x, projectile.position.x, t);
    const z = lerp(previous.z, projectile.position.z, t);

    if (Math.hypot(x - target.x, z - target.z) < 0.55) {
      complete(true);
      return;
    }
  }

  for (const p of pedestrians) {
    const center = p.g.localToWorld(
      new THREE.Vector3(0, 1.3, 0)
    );

    if (segmentHit(
      previous, projectile.position, center, 0.7 * p.scale
    )) {
      p.reaction = 0.8;
      score = Math.max(0, score - 50);
      hud();

      popup("-50 PEDESTRIAN!");
      complete(false);
      message("WATCH WHERE YOU SPIT!");
      return;
    }
  }

  if (projectile.position.y <= 0.34 || flight > 12) {
    complete(false);
  }
}

function updateBetween(dt) {
  if (state !== "between") return;

  wait -= dt;
  if (wait > 0) return;

  removeGum();

  if (shots <= 0) {
    result(false);
    return;
  }

  prepareAim();

  message(isHard()
    ? "NEW SHOT · CLICK TO LOCK AIM"
    : shots + " SHOTS LEFT · HOLD TO CHARGE");
}

// ============================================================
// RESULT SCREEN
// ============================================================

function result(hit, points = 0, perfect = false) {
  state = hit ? "success" : "out";
  charging = false;

  guideLine.visible = false;
  landingRing.visible = false;

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  const show = () => {
    resultTimer = null;

    $("resultEyebrow").textContent = hit
      ? perfect ? "PERFECT ROUND" : "NICE SHOT"
      : "ALL OUT OF GUM";

    $("resultTitle").textContent = hit
      ? "DIRECT HIT!"
      : "TRY AGAIN!";

    $("resultDescription").textContent = !hit
      ? "Three shots used. Try this floor again!"
      : perfect
        ? `${comboMultiplier.toLocaleString()}× MULTIPLIER! ` +
          `+${points.toLocaleString()} points. ` +
          `${perfectStreak} perfect round${perfectStreak === 1 ? "" : "s"} in a row!`
        : `+${points.toLocaleString()} points! ` +
          `You made it in ${3 - shots} shots.`;

    $("resultButton").textContent = hit
      ? "NEXT FLOOR"
      : "RETRY FLOOR";

    $("resultScreen").classList.remove("hidden");
  };

  if (perfect) {
    resultTimer = setTimeout(show, 2800);
  } else {
    show();
  }
}

// ============================================================
// START / NEXT FLOOR
// ============================================================

$("startButton").addEventListener("click", () => {
  if (state !== "idle") return;

  difficulty =
    document.querySelector('input[name="difficulty"]:checked')?.value ||
    "normal";

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

// ============================================================
// MAIN GAME LOOP
// ============================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);

  updateIntro(dt);
  updateSwivel(dt);
  updateCharge(dt);
  updateGuide();
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
      1.73 + Math.sin(clock.elapsedTime * 2) * 0.08;
  }

  renderer.render(scene, camera);
}

// ============================================================
// WINDOW RESIZE
// ============================================================

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ============================================================
// INITIALIZE
// ============================================================

target.set(0, 0.34, -13);
camera.position.set(0, 12, START);

createCity(1);
makeBalcony();
makeBin();
makeHands();

hands.visible = false;

angles();
hud();
animate();
