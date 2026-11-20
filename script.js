
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// GUM SPIT V9 — LOW-POLY HANDS & SPEARMINT WRAPPER

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

const ease = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('#91c3bf');
scene.fog = new THREE.Fog('#91c3bf', 115, 245);

const camera = new THREE.PerspectiveCamera(
  74,
  innerWidth / innerHeight,
  .04,
  420
);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

$('game').prepend(renderer.domElement);

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

sun.shadow.bias = -.0002;
sun.shadow.normalBias = .04;
sun.shadow.radius = 3;
scene.add(sun);

const mat = (color, roughness = .9) =>
  new THREE.MeshStandardMaterial({ color, roughness });

const M = {
  grass: mat('#95c977'),
  grass2: mat('#a8d67f'),
  road: mat('#777b80'),
  walk: mat('#dedbca'),
  curb: mat('#b7b9a9'),
  line: mat('#eee6d5'),
  cream: mat('#f4dfb9'),
  white: mat('#fff0d5'),
  sand: mat('#dcb18b'),
  peach: mat('#e9a77f'),
  coral: mat('#dc826b'),
  orange: mat('#d98c50'),
  red: mat('#c95f5b'),
  mint: mat('#a9cdb7'),
  teal: mat('#4d9c9a'),
  blue: mat('#6c99ae'),
  navy: mat('#405f73'),
  lavender: mat('#afa2bd'),
  brown: mat('#98725d'),
  dark: mat('#30454b'),
  glass: mat('#6ca8b2', .35),
  lit: mat('#f5d99e'),
  leaf: mat('#5c9b63'),
  leaf2: mat('#85b96d'),
  leaf3: mat('#397b60'),
  wood: mat('#8d7657'),
  metal: mat('#788c89'),
  skin: mat('#e9b18c'),
  gum: mat('#f3a0af'),
  black: mat('#344147')
};

const walls = [
  M.cream, M.sand, M.peach, M.mint,
  M.blue, M.lavender, M.coral
];

const roofs = [M.orange, M.navy, M.brown, M.red, M.teal];

const shirts = [
  M.coral, M.blue, M.orange,
  M.leaf, M.lavender, M.cream
];

const world = new THREE.Group();
const city = new THREE.Group();
const balcony = new THREE.Group();
const bin = new THREE.Group();
const peopleGroup = new THREE.Group();
const hands = new THREE.Group();

scene.add(world, city, balcony, bin, peopleGroup, camera);
camera.add(hands);

// --------------------------------------------------
// GEOMETRY HELPERS
// --------------------------------------------------

const geoCache = new Map();

function shape(w, h, d, r = .08) {
  r = Math.min(r, w * .45, h * .45, d * .45);

  const k = [w, h, d, r].join(',');

  if (!geoCache.has(k)) {
    geoCache.set(k, new RoundedBoxGeometry(w, h, d, 2, r));
  }

  return geoCache.get(k);
}

function box(parent, w, h, d, m, x = 0, y = 0, z = 0, r = .08) {
  const o = new THREE.Mesh(shape(w, h, d, r), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function cyl(parent, top, bottom, h, m, x = 0, y = 0, z = 0, n = 10) {
  const o = new THREE.Mesh(
    new THREE.CylinderGeometry(top, bottom, h, n),
    m
  );

  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function ball(parent, r, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, 1),
    m
  );

  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
}

function textTexture(t, bg = '#f6e9cf', fg = '#30454b') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;

  const a = c.getContext('2d');
  a.fillStyle = bg;
  a.fillRect(0, 0, 512, 128);
  a.fillStyle = fg;
  a.textAlign = 'center';
  a.textBaseline = 'middle';
  a.font = '900 65px Arial';
  a.fillText(t, 256, 65, 485);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const signCache = new Map();

function sign(parent, t, w, x, y, z) {
  if (!signCache.has(t)) {
    signCache.set(t, new THREE.MeshBasicMaterial({
      map: textTexture(t),
      side: THREE.DoubleSide
    }));
  }

  const s = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w / 4),
    signCache.get(t)
  );

  s.position.set(x, y, z);
  parent.add(s);
}

function rng(seed) {
  let n = seed >>> 0;

  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

let rand = Math.random;
const pick = a => a[Math.floor(rand() * a.length)];

// --------------------------------------------------
// CITY DECORATIONS
// --------------------------------------------------

function tree(x, z, size = 1) {
  const g = new THREE.Group();
  g.position.set(x, .37, z);
  g.scale.setScalar(size);
  city.add(g);

  cyl(g, .18, .24, 2.1, M.wood, 0, 1.1);

  for (let i = 0; i < 3; i++) {
    const crown = ball(
      g,
      1.25 - i * .16,
      [M.leaf3, M.leaf, M.leaf2][i],
      (i - 1) * .18,
      2.65 + i * .65,
      0
    );

    crown.scale.set(1.1, 1.1, .95);
  }
}

function shrub(x, z) {
  for (let i = 0; i < 3; i++) {
    ball(
      city,
      .48,
      i % 2 ? M.leaf : M.leaf2,
      x + (i - 1) * .48,
      .65,
      z + (i % 2) * .15
    );
  }
}

function planter(x, z) {
  box(city, 2.3, .65, 1.15, M.cream, x, .65, z);

  for (let i = -1; i <= 1; i++) {
    ball(city, .43, M.leaf2, x + i * .6, 1.15, z);
  }
}

function bench(x, z, rot = 0) {
  const g = new THREE.Group();
  g.position.set(x, .36, z);
  g.rotation.y = rot;
  city.add(g);

  box(g, 2.3, .16, .68, M.wood, 0, .65);
  box(g, 2.3, .7, .13, M.wood, 0, 1.08, .31);

  for (const a of [-.8, .8]) {
    box(g, .12, .68, .12, M.metal, a, .3);
  }
}

function lamp(x, z) {
  cyl(city, .09, .11, 5.5, M.metal, x, 3.1, z);
  box(city, 1.35, .15, .35, M.metal, x + .55, 5.85, z);
  box(city, .95, .05, .27, M.lit, x + .67, 5.72, z);
}

// --------------------------------------------------
// BUILDINGS WITH WINDOWS
// --------------------------------------------------

function building(x, z, w, d, h, kind) {
  const g = new THREE.Group();
  g.position.set(x, .38, z);
  city.add(g);

  const wall = pick(walls);
  const trim = pick(roofs);

  box(g, w, h, d, wall, 0, h / 2, 0, .17);
  box(g, w + .5, .42, d + .5, trim, 0, h + .17, 0, .1);
  box(g, w + .15, .14, d + .15, M.cream, 0, h - .4, 0);

  const floors = Math.max(1, Math.floor((h - 2.5) / 3.2));
  const cols = Math.max(2, Math.floor((w - 2) / 2.55));
  const sideCols = Math.max(2, Math.floor((d - 2) / 2.8));

  for (let f = 0; f < floors; f++) {
    const yy = 3.3 + f * 3.2;

    if (yy > h - 1.1) break;

    for (let j = 0; j < cols; j++) {
      const xx = -w / 2 + (j + .5) * w / cols;

      box(g, 1.15, 1.55, .13,
        rand() < .15 ? M.lit : M.glass,
        xx, yy, -d / 2 - .09, .035);

      box(g, 1.4, .13, .31,
        M.cream, xx, yy - .83, -d / 2 - .16);

      box(g, .07, 1.53, .15,
        M.navy, xx, yy, -d / 2 - .17, .015);
    }

    for (let j = 0; j < sideCols; j++) {
      const zz = -d / 2 + (j + .5) * d / sideCols;

      for (const side of [-1, 1]) {
        box(g, .13, 1.55, 1.15,
          rand() < .12 ? M.lit : M.glass,
          side * (w / 2 + .09), yy, zz, .035);

        box(g, .3, .12, 1.38,
          M.cream,
          side * (w / 2 + .18), yy - .83, zz);
      }
    }
  }

  if (kind === 'shop' || kind === 'cafe') {
    box(g, w - .8, 2.35, .18,
      M.glass, 0, 1.35, -d / 2 - .13);

    box(g, 1.45, 2.3, .22,
      M.navy, 0, 1.25, -d / 2 - .25);

    box(g, w + .4, .18, 2.2,
      M.cream, 0, 3.05, -d / 2 - 1.1);

    const n = Math.max(5, Math.round(w / 1.1));

    for (let i = 0; i < n; i += 2) {
      box(g, w / n, .2, 2.23, trim,
        -w / 2 + (i + .5) * w / n,
        3.08, -d / 2 - 1.1);
    }

    box(g, w - .8, .75, .17,
      trim, 0, 4.1, -d / 2 - .17);

    sign(
      g,
      kind === 'cafe'
        ? 'CAFE'
        : pick(['MARKET', 'BAKERY', 'SHOP', 'DINER']),
      Math.min(w - 1, 7),
      0, 4.1, -d / 2 - .28
    );

    if (kind === 'cafe') {
      for (const a of [-w * .27, w * .27]) {
        cyl(g, .62, .62, .09,
          M.cream, a, .9, -d / 2 - 2.3);

        cyl(g, .06, .07, .82,
          M.metal, a, .5, -d / 2 - 2.3);
      }
    }
  } else {
    box(g, 1.7, 2.5, .16,
      M.navy, 0, 1.25, -d / 2 - .16);

    box(g, 2.3, .17, .5,
      M.cream, 0, 2.55, -d / 2 - .3);

    if (kind === 'apartment') {
      for (let f = 1; f < floors; f += 2) {
        const yy = 3.3 + f * 3.2;

        box(g, 3, .13, 1,
          M.cream, -w * .22, yy - .95, -d / 2 - .65);

        box(g, 3, .08, .08,
          M.metal, -w * .22, yy + .05, -d / 2 - 1.08);

        for (const a of [-1.2, 0, 1.2]) {
          cyl(g, .035, .035, .95,
            M.metal,
            -w * .22 + a,
            yy - .45,
            -d / 2 - 1.08);
        }
      }
    }
  }

  if (h > 10) {
    box(g, 2.5, .8, 2.2,
      M.cream, w * .18, h + .72, d * .15);

    cyl(g, .55, .55, .7,
      M.metal, -w * .2, h + .75, d * .12);
  }

  return g;
}

// --------------------------------------------------
// PARKS, CARS, AND CITY GENERATION
// --------------------------------------------------

function park(x, z, w, d, type) {
  box(city, w, .35, d, M.grass2, x, .34, z);

  for (let i = 0; i < 5; i++) {
    const xx = x - w / 2 + 2 + rand() * (w - 4);
    const zz = z - d / 2 + 2 + rand() * (d - 4);

    if (type === 'plaza' && i < 2) continue;

    tree(xx, zz, .7 + rand() * .4);
  }

  if (type === 'plaza') {
    box(city, 6, 1, 6, M.cream, x, .85, z);
    box(city, 4.7, .08, 4.7, M.teal, x, 1.4, z);
    cyl(city, .4, .65, 1.5, M.white, x, 2.1, z);
    ball(city, .5, M.blue, x, 3, z);
  } else {
    bench(x, z);
    planter(x + 3, z + 2);
  }
}

const cars = [];

function car(x, z, m, dir = 1) {
  const g = new THREE.Group();
  g.position.set(x, .2, z);
  city.add(g);

  box(g, 3.6, .85, 1.9, m, 0, .8, 0, .36);
  box(g, 2.05, .9, 1.7, m, -.2, 1.45, 0, .28);
  box(g, 1.3, .42, .08, M.glass, -.2, 1.52, -.88);

  for (const xx of [-1.1, 1.1]) {
    for (const zz of [-.93, .93]) {
      const wheel = cyl(
        g, .38, .38, .2, M.black, xx, .42, zz, 14
      );
      wheel.rotation.x = Math.PI / 2;
    }
  }

  g.rotation.y = dir < 0 ? Math.PI : 0;

  cars.push({
    g,
    dir,
    speed: 1.4 + rand() * 2
  });
}

const pedestrians = [];

function createCity(level) {
  city.clear();
  cars.length = 0;
  peopleGroup.clear();
  pedestrians.length = 0;

  rand = rng(2026 + level * 9173);

  box(city, 320, .4, 300, M.grass, 0, -.3, -86);

  for (const z of [-34, -82, -130]) {
    box(city, 300, .12, 14, M.road, 0, .02, z);
  }

  for (const x of [-96, -48, 0, 48, 96]) {
    box(city, 13, .12, 245, M.road, x, .025, -100);
  }

  box(city, 300, .28, 14, M.walk, 0, .15, -17);

  for (let x = -140; x <= 140; x += 9) {
    box(city, 3, .02, .16, M.line, x, .1, -34);
    box(city, 3, .02, .16, M.line, x, .1, -82);
  }

  for (const x of [-96, -48, 0, 48, 96]) {
    for (const z of [-34, -82, -130]) {
      for (let i = -3; i <= 3; i++) {
        box(city, .8, .025, 3,
          M.line, x + i * 1.4, .11, z - 4);
      }
    }
  }

  const xs = [-120, -72, -24, 24, 72, 120];
  const zs = [-58, -106, -154, -194];

  for (let row = 0; row < zs.length; row++) {
    for (let col = 0; col < xs.length; col++) {
      const x = xs[col];
      const z = zs[row];

      box(city, 32, .34, 27, M.walk, x, .18, z);

      const parkChance =
        row === 0 && col === 2 ? 0 : .13;

      if (rand() < parkChance) {
        park(
          x, z, 28, 23,
          rand() < .5 ? 'plaza' : 'garden'
        );
        continue;
      }

      const count = rand() < .5 ? 2 : 3;

      for (let k = 0; k < count; k++) {
        const w = count === 2 ? 12.5 : 8.3;

        const px =
          x + (k - (count - 1) / 2) *
          (count === 2 ? 14 : 9.4);

        const h =
          7 +
          Math.floor(rand() * 4) * 3.2 +
          (level > 3 ? Math.min(level - 3, 9) * .8 : 0);

        const kind =
          rand() < .27 ? 'shop' :
          rand() < .22 ? 'cafe' :
          rand() < .45 ? 'apartment' : 'office';

        building(
          px,
          z + (rand() - .5) * 2,
          w,
          16 + rand() * 2,
          h,
          kind
        );
      }

      if (rand() < .8) {
        tree(x - 14, z + 10, .8);
        tree(x + 14, z - 10, .8);
      }

      if (rand() < .5) {
        planter(x + rand() * 12 - 6, z + 12);
      }
    }
  }

  for (let x = -138; x <= 138; x += 10) {
    if (Math.abs(x) < 9) continue;

    if (rand() < .74) {
      tree(x, -11, .65 + rand() * .25);
    } else {
      planter(x, -11);
    }
  }

  for (const x of [-35, -20, 20, 35]) {
    bench(x, -19);

    if (rand() < .6) {
      lamp(x + 4, -24);
    }
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
      rand() < .5 ? -1 : 1,
      .7 + rand() * 1.1,
      i
    );
  }

  rand = Math.random;
}

// --------------------------------------------------
// PEDESTRIANS
// --------------------------------------------------

function pedestrian(x, z, dir, speed, i) {
  const g = new THREE.Group();
  g.position.set(x, .4, z);
  peopleGroup.add(g);

  const shirt = shirts[i % shirts.length];
  const skin = i % 4 === 0 ? M.sand : M.skin;

  const torso = ball(g, .48, shirt, 0, 1.28);
  torso.scale.set(.95, 1.12, .75);

  ball(g, .36, skin, 0, 2.03);

  const hair = ball(
    g, .36,
    i % 3 ? M.brown : M.dark,
    0, 2.27
  );
  hair.scale.y = .43;

  const arms = [];
  const legs = [];

  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    a.position.set(s * .47, 1.55, 0);
    g.add(a);

    box(a, .24, .65, .25, shirt, 0, -.33, 0, .12);
    ball(a, .13, skin, 0, -.7);
    arms.push(a);

    const l = new THREE.Group();
    l.position.set(s * .2, .88, 0);
    g.add(l);

    box(l, .27, .7, .3, M.navy, 0, -.35);
    box(l, .35, .17, .47, M.black, 0, -.72, -.08);
    legs.push(l);
  }

  g.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;

  const scale = .85 + rand() * .25;
  g.scale.setScalar(scale);

  pedestrians.push({
    g,
    dir,
    speed,
    arms,
    legs,
    phase: rand() * 6.28,
    reaction: 0,
    scale
  });
}

function updatePeople(dt) {
  for (const p of pedestrians) {
    p.phase += dt * p.speed * 5;

    if (p.reaction > 0) {
      p.reaction = Math.max(0, p.reaction - dt);

      const k = Math.sin(
        (1 - p.reaction / .8) * Math.PI
      );

      p.arms[0].rotation.z = -k * 2;
      p.arms[1].rotation.z = k * 2;
      p.g.position.y = .4 + k * .2;
      continue;
    }

    p.arms.forEach(a => a.rotation.z = 0);

    p.g.position.x += p.dir * p.speed * dt;

    if (p.g.position.x > 140) p.g.position.x = -140;
    if (p.g.position.x < -140) p.g.position.x = 140;

    const s = Math.sin(p.phase);

    p.legs[0].rotation.x = s * .5;
    p.legs[1].rotation.x = -s * .5;
    p.arms[0].rotation.x = -s * .4;
    p.arms[1].rotation.x = s * .4;
    p.g.position.y = .4 + Math.abs(s) * .04;
  }
}

function updateCars(dt) {
  for (const c of cars) {
    c.g.position.x += c.dir * c.speed * dt;

    if (c.g.position.x > 140) c.g.position.x = -140;
    if (c.g.position.x < -140) c.g.position.x = 140;
  }
}

// --------------------------------------------------
// PLAYER, BALCONY, TRASH CAN
// --------------------------------------------------

let floor = 1;
let score = 0;
let shots = 3;
let power = 60;
let wind = 0;
let height = 12;
let state = 'idle';
let intro = 0;
let yaw = 0;
let pitch = -.16;
let locked = false;
let projectile = null;
let flight = 0;
let wait = 0;
let popupTime = 0;

const target = new THREE.Vector3();
const velocity = new THREE.Vector3();
const previous = new THREE.Vector3();

const START = 1.35;
const EDGE = -4.66;

let pack, flap, stick, rightHand, chew;

function makeBalcony() {
  balcony.clear();

  const ground = height - 1.65;

  box(balcony, 28, 100, 10,
    M.peach, 0, ground - 14, 9.4);

  box(balcony, 8.6, .32, 6.3,
    M.walk, 0, ground - .2, -1.05);

  box(balcony, 8.8, .15, .3,
    M.cream, 0, ground - .08, -4.12);

  for (const y of [.42, 1.08]) {
    box(balcony, 8.5, .12, .13,
      M.metal, 0, ground + y, -4.02);
  }

  for (let x = -4.1; x <= 4.1; x += .65) {
    cyl(balcony, .055, .055, 1.1,
      M.metal, x, ground + .56, -4.02);
  }

  for (const s of [-1, 1]) {
    box(balcony, .13, .13, 6.3,
      M.metal, s * 4.25, ground + 1.08, -1.05);

    for (let z = -3.9; z < 2; z += .7) {
      cyl(balcony, .05, .05, 1.1,
        M.metal, s * 4.25, ground + .56, z);
    }
  }

  box(balcony, 3.5, 4.5, .25,
    M.cream, 0, ground + 2.15, 3.6);

  box(balcony, 2.7, 3.9, .08,
    M.glass, 0, ground + 2.1, 3.4);

  cyl(balcony, .43, .35, .6,
    M.coral, 3.1, ground + .3, .5);

  ball(balcony, .6, M.leaf2,
    3.1, ground + 1, .5);
}

function makeBin() {
  bin.clear();
  bin.position.copy(target);

  cyl(bin, .73, .56, 1.35, M.teal, 0, .675, 0, 24);
  cyl(bin, .6, .6, .035, M.dark, 0, 1.37, 0, 24);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.68, .07, 10, 32),
    M.cream
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.4;
  bin.add(ring);

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(.87, .035, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd886 })
  );

  glow.rotation.x = Math.PI / 2;
  glow.position.y = 1.73;
  glow.name = 'glow';
  bin.add(glow);

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;

    box(bin, .045, .94, .045,
      M.leaf3,
      Math.cos(a) * .6,
      .7,
      Math.sin(a) * .6);
  }
}

// --------------------------------------------------
// V9 LOW-POLY HANDS
// Custom tapered meshes replace the old round palms
// and capsule-shaped sausage fingers.
// --------------------------------------------------

let leftHand, gumWrapper, foilStick;

const handSkin = new THREE.MeshStandardMaterial({
  color: '#dda57d',
  roughness: 1,
  flatShading: true
});

const nailMat = new THREE.MeshStandardMaterial({
  color: '#eac0a1',
  roughness: 1,
  flatShading: true
});

const wrapperWhite = new THREE.MeshStandardMaterial({
  color: '#fffdf5',
  roughness: .64
});

const wrapperRed = new THREE.MeshStandardMaterial({
  color: '#ae2339',
  roughness: .7
});

const wrapperGreen = new THREE.MeshStandardMaterial({
  color: '#075844',
  roughness: .68
});

const foilMat = new THREE.MeshStandardMaterial({
  color: '#e3e6d9',
  metalness: .24,
  roughness: .42
});

// Closed, faceted tapered prism.
function taperedPart(parent, points, material, sides = 8) {
  const vertices = [];
  const indices = [];

  for (const ring of points) {
    for (let j = 0; j < sides; j++) {
      const a = 2 * Math.PI * j / sides;

      vertices.push(
        ring.x + Math.cos(a) * ring.rx,
        ring.y,
        ring.z + Math.sin(a) * ring.rz
      );
    }
  }

  for (let i = 0; i < points.length - 1; i++) {
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

    const last = (points.length - 1) * sides;

    indices.push(last, last + j, last + j + 1);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  parent.add(mesh);

  return mesh;
}

function makeFinger(parent, x, z, length, spread = 0) {
  const root = new THREE.Group();
  root.position.set(x, .245, z);
  root.rotation.z = spread;
  parent.add(root);

  const first = length * .57;
  const second = length * .43;

  taperedPart(root, [
    { x: 0, y: 0, z: 0, rx: .031, rz: .026 },
    { x: 0, y: first * .52, z: -.006, rx: .029, rz: .025 },
    { x: 0, y: first, z: -.015, rx: .025, rz: .023 }
  ], handSkin, 7);

  const tip = new THREE.Group();
  tip.position.set(0, first, -.015);
  root.add(tip);

  taperedPart(tip, [
    { x: 0, y: 0, z: 0, rx: .025, rz: .023 },
    { x: 0, y: second * .7, z: -.012, rx: .022, rz: .019 },
    { x: 0, y: second, z: -.015, rx: .013, rz: .014 }
  ], handSkin, 7);

  box(
    tip, .034, .042, .006,
    nailMat, 0, second * .79, .019, .002
  );

  return { root, tip };
}

function createHand(side) {
  const g = new THREE.Group();
  hands.add(g);

  // The wrists stay outside the wrapper.
  // The fingers approach from behind the package.
  g.position.set(side * .70, -.44, -1.16);
  g.rotation.z = -side * .12;

  // Sleeve and tapered wrist.
  taperedPart(g, [
    { x: side * .055, y: -.55, z: -.06, rx: .085, rz: .072 },
    { x: side * .035, y: -.24, z: -.025, rx: .094, rz: .070 },
    { x: 0, y: -.13, z: 0, rx: .09, rz: .062 }
  ], M.blue, 9);

  // Shaped palm instead of a large sphere.
  taperedPart(g, [
    { x: 0, y: -.17, z: 0, rx: .092, rz: .055 },
    { x: 0, y: -.11, z: 0, rx: .093, rz: .058 },
    { x: 0, y: .10, z: 0, rx: .142, rz: .058 },
    { x: 0, y: .235, z: -.01, rx: .127, rz: .05 },
    { x: 0, y: .255, z: -.012, rx: .105, rz: .042 }
  ], handSkin, 10);

  const fingers = [];
  const lengths = [.175, .215, .205, .157];

  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * .069;

    fingers.push(
      makeFinger(
        g,
        x,
        -.013,
        lengths[i],
        (i - 1.5) * -.045
      )
    );
  }

  // Angled thumb with two separate tapered segments.
  const thumbBase = new THREE.Group();

  thumbBase.position.set(
    -side * .145,
    .045,
    .005
  );

  thumbBase.rotation.z = side * .46;
  g.add(thumbBase);

  taperedPart(thumbBase, [
    { x: 0, y: 0, z: 0, rx: .055, rz: .046 },
    { x: 0, y: .11, z: .01, rx: .047, rz: .04 },
    { x: 0, y: .16, z: .008, rx: .038, rz: .032 }
  ], handSkin, 8);

  const thumbTip = new THREE.Group();

  thumbTip.position.set(0, .15, .008);
  thumbTip.rotation.z = -side * .25;
  thumbBase.add(thumbTip);

  taperedPart(thumbTip, [
    { x: 0, y: 0, z: 0, rx: .037, rz: .032 },
    { x: 0, y: .085, z: 0, rx: .03, rz: .025 },
    { x: 0, y: .12, z: -.005, rx: .02, rz: .019 }
  ], handSkin, 8);

  return {
    g,
    fingers,
    thumbBase,
    thumbTip
  };
}

// --------------------------------------------------
// WRIGLEY'S SPEARMINT WRAPPER
// --------------------------------------------------

function gumPackTexture() {
  const c = document.createElement('canvas');
  c.width = 1536;
  c.height = 640;

  const a = c.getContext('2d');

  a.fillStyle = '#fffdf8';
  a.fillRect(0, 0, c.width, c.height);

  a.fillStyle = '#ae2035';
  a.fillRect(0, 0, 175, 640);
  a.fillRect(1375, 0, 161, 640);

  a.fillStyle = '#fffdf8';
  a.beginPath();
  a.moveTo(105, 0);
  a.lineTo(1425, 0);
  a.lineTo(1320, 640);
  a.lineTo(180, 640);
  a.closePath();
  a.fill();

  a.fillStyle = '#ad2637';
  a.font = '900 104px Arial';
  a.textAlign = 'center';
  a.fillText("WRIGLEY'S", 790, 175);

  a.fillStyle = '#065740';
  a.beginPath();
  a.moveTo(275, 235);
  a.lineTo(1160, 235);
  a.lineTo(1300, 332);
  a.lineTo(1160, 430);
  a.lineTo(275, 430);
  a.lineTo(195, 332);
  a.closePath();
  a.fill();

  a.strokeStyle = '#ffffff';
  a.lineWidth = 15;
  a.stroke();

  a.fillStyle = '#fff';
  a.font = '900 105px Arial';
  a.fillText('SPEARMINT', 770, 363);

  a.fillStyle = '#ad2637';
  a.font = '800 54px Arial';
  a.fillText('CHEWING GUM', 780, 512);

  a.font = '800 36px Arial';
  a.fillText('7 STICKS', 1320, 570);

  a.fillStyle = '#176b4e';
  a.beginPath();
  a.ellipse(1350, 140, 38, 25, -.3, 0, Math.PI * 2);
  a.fill();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;

  t.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy()
  );

  return t;
}

function makeHands() {
  hands.clear();

  leftHand = createHand(-1);
  rightHand = createHand(1);

  for (const h of [leftHand, rightHand]) {
    h.fingers.forEach(f => {
      f.root.rotation.x = -.12;
      f.tip.rotation.x = -.28;
    });

    h.thumbBase.rotation.x = -.08;
  }

  pack = new THREE.Group();
  hands.add(pack);

  pack.position.set(0, -.23, -1.03);
  pack.rotation.set(-.045, 0, 0);

  box(
    pack, 1.02, .405, .18,
    wrapperWhite, 0, 0, 0, .025
  );

  box(
    pack, .12, .407, .184,
    wrapperRed, -.46, 0, 0, .018
  );

  box(
    pack, .12, .407, .184,
    wrapperRed, .46, 0, 0, .018
  );

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.965, .37),
    new THREE.MeshBasicMaterial({
      map: gumPackTexture()
    })
  );

  label.position.z = .093;
  pack.add(label);

  box(
    pack, .96, .022, .185,
    wrapperWhite, 0, .204, 0, .009
  );

  box(
    pack, .96, .022, .185,
    wrapperRed, 0, -.204, 0, .009
  );

  box(
    pack, .74, .009, .014,
    wrapperGreen, 0, .212, .03, .003
  );

  flap = new THREE.Group();
  flap.position.set(0, .204, -.01);
  pack.add(flap);

  box(
    flap, 1.0, .145, .024,
    wrapperWhite, 0, .072, 0, .008
  );

  box(
    flap, .13, .145, .026,
    wrapperRed, -.435, .072, 0, .006
  );

  box(
    flap, .13, .145, .026,
    wrapperRed, .435, .072, 0, .006
  );

  stick = new THREE.Group();
  pack.add(stick);
  stick.position.set(.16, .025, -.12);

  foilStick = box(
    stick, .145, .315, .055,
    foilMat, 0, 0, 0, .012
  );

  for (let i = 0; i < 3; i++) {
    box(
      stick, .13, .009, .058,
      wrapperWhite,
      0,
      -.095 + i * .095,
      .004,
      .002
    );
  }

  chew = ball(
    hands, .052, M.gum,
    0, -.05, -.68
  );
  chew.visible = false;

  // Hands grip the outside edges, not the printed front.
  leftHand.g.position.set(-.70, -.44, -1.16);
  rightHand.g.position.set(.70, -.44, -1.16);
}

// --------------------------------------------------
// HUD AND LEVEL MANAGEMENT
// --------------------------------------------------

function hud() {
  $('floor').textContent = floor;
  $('score').textContent = score;

  $('wind').textContent =
    (wind >= 0 ? '+' : '') + wind.toFixed(1);

  $('powerText').textContent = power + '%';
  $('powerFill').style.width = power + '%';

  $('shots').innerHTML =
    '<div>GUM LEFT</div><div class="pieces">' +
    Array.from(
      { length: 3 },
      (_, i) =>
        `<div class="piece ${i >= shots ? 'used' : ''}"></div>`
    ).join('') +
    '</div>';
}

function message(s) {
  $('message').textContent = s;
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

function removeGum() {
  if (projectile) {
    scene.remove(projectile);
    projectile.geometry.dispose();
    projectile = null;
  }
}

function resetLevel() {
  height = 12 + (floor - 1) * 6;
  shots = 3;
  power = 60;

  wind =
    (Math.random() - .5) *
    Math.min(.5 * floor, 3);

  target.set(
    (Math.random() - .5) * 3,
    .34,
    -12 - Math.random() * 1.8
  );

  createCity(floor);
  makeBalcony();
  makeBin();
  makeHands();

  hands.visible = true;
  removeGum();

  camera.position.set(0, height, START);

  yaw = 0;
  pitch = -.16;
  angles();

  intro = 0;
  state = 'intro';

  $('crosshair').classList.add('hidden');
  $('powerHud').classList.add('hidden');

  message('UNWRAPPING THE GUM...');
  hud();
}

$('startButton').addEventListener('click', () => {
  if (state !== 'idle') return;

  $('startScreen').classList.add('hidden');
  $('hud').classList.remove('hidden');

  resetLevel();
});

// --------------------------------------------------
// AUTOMATIC OPENING ANIMATION
// --------------------------------------------------

function updateIntro(dt) {
  if (state !== 'intro') return;

  intro += dt;
  const t = intro;

  if (t < .8) {
    message('UNWRAPPING THE GUM...');

    const p = ease(t / .8);

    flap.rotation.x = -2.2 * p;
    pack.rotation.z = Math.sin(t * 7) * .008;

    // Minimal grip movement keeps the fingers
    // from sweeping through the wrapper.
    rightHand.g.rotation.z = -.12 + .035 * p;

    rightHand.fingers.forEach(f => {
      f.tip.rotation.x = -.28 - .12 * p;
    });

  } else if (t < 1.4) {
    message('ONE FRESH STICK...');

    const p = ease((t - .8) / .6);

    stick.position.set(
      .16 + .10 * p,
      .025 + .39 * p,
      -.12 + .08 * p
    );

    rightHand.g.position.set(
      .70,
      -.44 + .045 * p,
      -1.16
    );

    rightHand.fingers.forEach(f => {
      f.tip.rotation.x = -.40 + .12 * p;
    });

  } else if (t < 2) {
    message('CHOMP CHOMP...');

    const p = ease((t - 1.4) / .6);

    stick.position.y = .415 + p * .26;
    stick.position.z = -.04 + p * .15;

    // Lower the package and both hands together.
    pack.position.y = -.23 - .52 * p;
    leftHand.g.position.y = -.44 - .52 * p;
    rightHand.g.position.y = -.395 - .52 * p;

    chew.visible = true;

    chew.scale.setScalar(
      .75 + Math.sin(t * 24) * .12
    );

  } else if (t < 3.5) {
    message('TO THE BALCONY...');

    hands.visible = false;

    const p = ease((t - 2) / 1.5);

    camera.position.z = lerp(START, EDGE, p);

    camera.position.y =
      height +
      Math.sin((t - 2) * 17) * .03 * (1 - p);

    pitch = lerp(-.16, -.48, p);
    angles();

  } else if (t < 4) {
    message('THERE IT IS...');

    camera.position.set(0, height, EDGE);

    const a = aimAngles();
    const p = ease((t - 3.5) / .5);

    yaw = lerp(0, a.yaw, p);
    pitch = lerp(-.48, a.pitch, p);

    angles();

  } else {
    camera.position.set(0, height, EDGE);

    const a = aimAngles();

    yaw = a.yaw;
    pitch = a.pitch;
    angles();

    state = 'aiming';

    $('crosshair').classList.remove('hidden');
    $('powerHud').classList.remove('hidden');

    message('MOUSE TO AIM · CLICK TO SPIT');
  }
}

// --------------------------------------------------
// MOUSE AND KEYBOARD CONTROLS
// --------------------------------------------------

function lockMouse() {
  const p = renderer.domElement.requestPointerLock?.();
  p?.catch?.(() => {});
}

document.addEventListener('pointerlockchange', () => {
  locked =
    document.pointerLockElement === renderer.domElement;

  if (state === 'aiming' && !locked) {
    message('CLICK TO AIM · THEN CLICK TO SPIT');
  }
});

document.addEventListener('mousemove', e => {
  if (!locked || state !== 'aiming') return;

  yaw = clamp(
    yaw - e.movementX * .0022,
    -1.35,
    1.35
  );

  pitch = clamp(
    pitch - e.movementY * .0022,
    -1.54,
    .35
  );

  angles();
});

document.addEventListener('wheel', e => {
  if (state !== 'aiming') return;

  power = clamp(
    power + (e.deltaY > 0 ? -3 : 3),
    10,
    100
  );

  hud();
}, { passive: true });

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

  if (e.code === 'Space') spit();

  if (e.code === 'KeyW') {
    power = Math.min(100, power + 3);
  }

  if (e.code === 'KeyS') {
    power = Math.max(10, power - 3);
  }

  if (e.code === 'ArrowLeft') yaw += .035;
  if (e.code === 'ArrowRight') yaw -= .035;
  if (e.code === 'ArrowUp') pitch += .035;
  if (e.code === 'ArrowDown') pitch -= .035;

  pitch = clamp(pitch, -1.54, .35);

  angles();
  hud();
});

renderer.domElement.addEventListener('mousedown', e => {
  if (e.button !== 0 || state !== 'aiming') return;

  if (!locked) {
    lockMouse();
    message('MOUSE TO AIM · CLICK TO SPIT');
  } else {
    spit();
  }
});

// --------------------------------------------------
// GUM PROJECTILE AND PHYSICS
// --------------------------------------------------

function spit() {
  if (state !== 'aiming' || shots <= 0) return;

  shots--;
  hud();

  state = 'flying';
  flight = 0;

  const d = new THREE.Vector3();
  camera.getWorldDirection(d);

  velocity.copy(d).multiplyScalar(
    5 + power * .24
  );

  projectile = new THREE.Mesh(
    new THREE.SphereGeometry(.14, 12, 10),
    M.gum
  );

  projectile.scale.set(1.2, .65, .95);

  projectile.position.copy(camera.position)
    .addScaledVector(d, .75);

  projectile.position.y -= .12;
  projectile.castShadow = true;

  scene.add(projectile);

  message('BON VOYAGE, GUM!');
}

function segmentHit(a, b, c, r) {
  const v = b.clone().sub(a);
  const len = v.lengthSq();

  const t = len < 1e-8
    ? 0
    : clamp(
        c.clone().sub(a).dot(v) / len,
        0,
        1
      );

  return a.clone()
    .addScaledVector(v, t)
    .distanceTo(c) < r;
}

function popup(s) {
  $('popup').textContent = s;
  $('popup').classList.add('show');
  popupTime = 1.2;
}

function complete(hit) {
  if (state !== 'flying') return;

  if (hit) {
    score += floor * 100;
    hud();

    popup('+' + floor * 100);
    result(true);
    return;
  }

  state = 'between';
  wait = .6;

  message(
    shots
      ? 'SHOT MISSED · ' + shots + ' LEFT'
      : 'OUT OF GUM!'
  );
}

function updateFlight(dt) {
  if (state !== 'flying' || !projectile) return;

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
      ) < .55
    ) {
      complete(true);
      return;
    }
  }

  for (const p of pedestrians) {
    const center = p.g.localToWorld(
      new THREE.Vector3(0, 1.3, 0)
    );

    if (
      segmentHit(
        previous,
        projectile.position,
        center,
        .7 * p.scale
      )
    ) {
      p.reaction = .8;

      score = Math.max(0, score - 50);
      hud();

      popup('-50 PEDESTRIAN!');
      complete(false);

      message('WATCH WHERE YOU SPIT!');
      return;
    }
  }

  if (
    projectile.position.y <= .34 ||
    flight > 12
  ) {
    complete(false);
  }
}

// --------------------------------------------------
// THREE-SHOT SYSTEM AND RESULTS
// --------------------------------------------------

function updateBetween(dt) {
  if (state !== 'between') return;

  wait -= dt;

  if (wait > 0) return;

  removeGum();

  if (shots <= 0) {
    result(false);
    return;
  }

  state = 'aiming';

  message(
    shots + ' SHOT' +
    (shots === 1 ? '' : 'S') +
    ' LEFT · KEEP GOING!'
  );
}

function result(hit) {
  state = hit ? 'success' : 'out';

  if (
    document.pointerLockElement === renderer.domElement
  ) {
    document.exitPointerLock();
  }

  $('resultEyebrow').textContent = hit
    ? 'ABSOLUTE LEGEND'
    : 'ALL OUT OF GUM';

  $('resultTitle').textContent = hit
    ? 'DIRECT HIT!'
    : 'TRY AGAIN!';

  $('resultDescription').textContent = hit
    ? `+${floor * 100} points! You made it in ${3 - shots} shot${3 - shots === 1 ? '' : 's'}.`
    : 'Three shots used. Try this floor again!';

  $('resultButton').textContent = hit
    ? 'NEXT FLOOR'
    : 'RETRY FLOOR';

  $('resultScreen').classList.remove('hidden');
}

$('resultButton').addEventListener('click', () => {
  $('resultScreen').classList.add('hidden');

  if (state === 'success') {
    floor++;
  }

  resetLevel();
});

// --------------------------------------------------
// MAIN GAME LOOP
// --------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(
    clock.getDelta(),
    .033
  );

  updateIntro(dt);
  updateFlight(dt);
  updateBetween(dt);
  updatePeople(dt);
  updateCars(dt);

  if (popupTime > 0) {
    popupTime -= dt;

    if (popupTime <= 0) {
      $('popup').classList.remove('show');
    }
  }

  const glow = bin.getObjectByName('glow');

  if (glow) {
    glow.position.y =
      1.73 +
      Math.sin(clock.elapsedTime * 2) * .08;
  }

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --------------------------------------------------
// INITIALIZE
// --------------------------------------------------

createCity(1);

target.set(0, .34, -13);
camera.position.set(0, 12, START);

makeBalcony();
makeBin();
makeHands();

hands.visible = false;

angles();
hud();
animate();
