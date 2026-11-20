
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

// =======================================
// GUM SPIT 3D
// =======================================

const $ = id => document.getElementById(id);

// THREE.JS SETUP

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91cbe9);
scene.fog = new THREE.Fog(0x91cbe9, 75, 240);

const camera = new THREE.PerspectiveCamera(
  76,
  innerWidth / innerHeight,
  0.04,
  400
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

$("game").appendChild(renderer.domElement);

// LIGHTING

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x6c8475,
    2.2
  )
);

const sun = new THREE.DirectionalLight(0xfff1d6, 2.3);
sun.position.set(-28, 60, -32);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -65;
sun.shadow.camera.right = 65;
sun.shadow.camera.top = 65;
sun.shadow.camera.bottom = -65;
scene.add(sun);

// MATERIALS

const material = (color, roughness = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness });

const m = {
  brick: material(0xb46a5b),
  cement: material(0xbebbb3),
  sidewalk: material(0xd2cfc5),
  road: material(0x4c5964),
  rail: material(0x283b49, 0.4),
  glass: material(0x8ac6dd, 0.25),
  white: material(0xf5f3e8),
  yellow: material(0xffdb60),
  green: material(0x2e7a58),
  dark: material(0x163c30),
  metal: material(0x86969b, 0.3),
  skin: material(0xe5ad88),
  gum: material(0xf1a5b8),
  grass: material(0x87a77c),
  leaf: material(0x548e59),
  trunk: material(0x78553f)
};

// GEOMETRY HELPERS

function box(parent, w, h, d, mat, x, y, z) {
  const obj = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat
  );

  obj.position.set(x, y, z);
  obj.castShadow = true;
  obj.receiveShadow = true;
  parent.add(obj);

  return obj;
}

function cylinder(parent, top, bottom, h, mat, x, y, z) {
  const obj = new THREE.Mesh(
    new THREE.CylinderGeometry(top, bottom, h, 24),
    mat
  );

  obj.position.set(x, y, z);
  obj.castShadow = true;
  obj.receiveShadow = true;
  parent.add(obj);

  return obj;
}

// GROUPS

const city = new THREE.Group();
const balcony = new THREE.Group();
const trash = new THREE.Group();
const hands = new THREE.Group();

scene.add(city, balcony, trash, camera);
camera.add(hands);

// CITY

function createCity() {
  box(city, 400, 1, 400, m.grass, 0, -0.6, -70);
  box(city, 160, 0.14, 19, m.sidewalk, 0, 0, -14);
  box(city, 160, 0.1, 24, m.road, 0, -0.04, -36);
  box(city, 160, 0.14, 12, m.sidewalk, 0, 0, -55);

  for (let x = -80; x <= 80; x += 4) {
    box(
      city, 0.035, 0.015, 19,
      material(0xaaa69d), x, 0.09, -14
    );
  }

  for (let x = -75; x < 75; x += 12) {
    box(city, 5, 0.02, 0.2, m.yellow, x, 0.04, -36);
  }

  for (let i = -5; i <= 5; i++) {
    const h = 20 + Math.abs(i * 7) % 18;
    const x = i * 19;
    const z = -78;
    const w = 17;

    const group = new THREE.Group();
    group.position.set(x, 0, z);

    box(
      group, w, h, 15,
      material(i % 2 ? 0x8b9eaa : 0xb7a89c),
      0, h / 2, 0
    );

    for (let y = 3; y < h - 2; y += 4) {
      for (let wx = -w / 2 + 2; wx < w / 2 - 1; wx += 3.5) {
        box(group, 1.7, 2.2, 0.08, m.glass, wx, y, 7.56);
        box(group, 1.9, 0.12, 0.16, m.white, wx, y - 1.15, 7.65);
      }
    }

    city.add(group);
  }

  for (let i = -6; i <= 6; i++) {
    if (Math.abs(i) < 2) continue;

    const x = i * 11;
    const z = -7;

    cylinder(city, 0.25, 0.35, 3, m.trunk, x, 1.5, z);

    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1, 1),
      m.leaf
    );

    crown.position.set(x, 4.3, z);
    crown.castShadow = true;
    city.add(crown);
  }
}

// GAME STATE

let floor = 1;
let score = 0;
let wind = 0;
let power = 60;
let height = 12;
let state = "idle";
let sequenceTime = 0;

let yaw = 0;
let pitch = -0.12;
let locked = false;

let projectile = null;
let flightTime = 0;

const velocity = new THREE.Vector3();
const previous = new THREE.Vector3();
const trashPosition = new THREE.Vector3();

// CAMERA POSITION
// The front railing is at z = -4.02.
// EDGE_Z is beyond the railing, giving a
// clear downward view of the sidewalk.

const EYE_ABOVE_FLOOR = 1.65;
const START_Z = 1.45;
const EDGE_Z = -4.65;

// BALCONY

function createBalcony() {
  balcony.clear();

  const h = height;

  box(balcony, 30, 120, 10, m.brick, 0, h - 10, 9);

  box(
    balcony, 8, 0.3, 6, m.cement,
    0, h - EYE_ABOVE_FLOOR - 0.16, -1
  );

  box(balcony, 8, 0.12, 0.13, m.rail, 0, h - 0.73, -4.02);
  box(balcony, 8, 0.08, 0.1, m.rail, 0, h - 1.5, -4.02);

  for (let x = -3.9; x <= 3.9; x += 0.5) {
    box(
      balcony, 0.065, 0.82, 0.065,
      m.rail, x, h - 1.13, -4.02
    );
  }

  for (const side of [-1, 1]) {
    const x = side * 3.95;

    box(balcony, 0.12, 0.12, 6, m.rail, x, h - 0.73, -1);

    for (let z = -3.8; z < 2; z += 0.6) {
      box(
        balcony, 0.07, 0.82, 0.07,
        m.rail, x, h - 1.13, z
      );
    }
  }

  box(balcony, 2.7, 4.4, 0.25, m.white, 0, h + 0.2, 3.8);
  box(balcony, 2.2, 3.8, 0.08, m.glass, 0, h + 0.15, 3.61);
  box(balcony, 0.09, 3.8, 0.12, m.white, 0, h + 0.15, 3.54);
}

// TRASH CAN

function createTrash() {
  trash.clear();
  trash.position.copy(trashPosition);

  cylinder(trash, 0.64, 0.52, 1.28, m.green, 0, 0.64, 0);
  cylinder(trash, 0.56, 0.56, 0.025, m.dark, 0, 1.29, 0);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.07, 8, 36),
    m.metal
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.3;
  trash.add(rim);

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;

    box(
      trash, 0.035, 0.9, 0.035, m.dark,
      Math.cos(a) * 0.58,
      0.62,
      Math.sin(a) * 0.58
    );
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.035, 8, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffdc57,
      transparent: true,
      opacity: 0.8
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.62;
  ring.name = "targetRing";

  trash.add(ring);
}

// FIRST PERSON GUM AND HANDS

let pack;
let flap;
let stick;
let rightHand;

function createHands() {
  hands.clear();

  const capsule = new THREE.CapsuleGeometry(
    0.12, 0.36, 5, 10
  );

  const left = new THREE.Mesh(capsule, m.skin);
  left.position.set(-0.48, -0.55, -0.75);
  left.rotation.z = -0.45;
  hands.add(left);

  rightHand = new THREE.Mesh(capsule, m.skin);
  rightHand.position.set(0.48, -0.55, -0.75);
  rightHand.rotation.z = 0.45;
  hands.add(rightHand);

  pack = new THREE.Group();

  box(pack, 0.68, 0.3, 0.14, m.white, 0, 0, 0);
  box(pack, 0.68, 0.045, 0.15, m.green, 0, 0.11, 0);
  box(pack, 0.68, 0.045, 0.15, m.green, 0, -0.11, 0);

  flap = new THREE.Group();
  box(flap, 0.68, 0.17, 0.025, m.white, 0, 0.085, 0);
  flap.position.set(0, 0.15, 0.01);
  pack.add(flap);

  for (let i = 0; i < 5; i++) {
    box(
      pack, 0.1, 0.23, 0.025, m.white,
      -0.23 + i * 0.115, 0.01, -0.09
    );
  }

  stick = new THREE.Group();
  box(stick, 0.1, 0.24, 0.035, m.white, 0, 0, 0);
  stick.position.set(0.12, 0.02, -0.12);
  pack.add(stick);

  pack.position.set(0, -0.35, -0.7);
  hands.add(pack);
}

// HUD

function hud() {
  $("floor").textContent = floor;
  $("score").textContent = score;
  $("wind").textContent =
    (wind >= 0 ? "+" : "") + wind.toFixed(1);

  $("powerText").textContent = power + "%";
  $("powerFill").style.width = power + "%";
}

function msg(text) {
  $("message").textContent = text;
}

// CAMERA

function cameraAngles() {
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function lookAtTrash() {
  const direction = trashPosition.clone()
    .add(new THREE.Vector3(0, 1.3, 0))
    .sub(camera.position)
    .normalize();

  yaw = Math.atan2(-direction.x, -direction.z);
  pitch = Math.asin(direction.y);

  cameraAngles();
}

// LEVEL RESET

function resetLevel() {
  height = 12 + (floor - 1) * 6;
  power = 60;

  wind = (Math.random() - 0.5) *
    Math.min(floor * 0.5, 3);

  trashPosition.set(
    (Math.random() - 0.5) * 3,
    0,
    -11.5 - Math.random() * 2.5
  );

  camera.position.set(0, height, START_Z);

  yaw = 0;
  pitch = -0.12;
  cameraAngles();

  if (projectile) {
    scene.remove(projectile);
    projectile.geometry.dispose();
    projectile = null;
  }

  createBalcony();
  createTrash();
  createHands();

  hands.visible = true;
  pack.visible = true;
  flap.rotation.x = 0;
  stick.position.set(0.12, 0.02, -0.12);

  $("powerHud").style.opacity = "0";
  $("crosshair").style.opacity = "0";

  state = "intro";
  sequenceTime = 0;

  msg("OPENING THE GUM...");
  hud();
}

// START GAME

function startGame() {
  if (state !== "idle") return;

  $("startScreen").classList.add("hidden");
  resetLevel();
}

$("startButton").addEventListener("click", startGame);

// ANIMATION HELPER

function smooth(t) {
  t = THREE.MathUtils.clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// AUTOMATIC INTRO
// No clicking, no manual walking.

function updateIntro(dt) {
  if (state !== "intro") return;

  sequenceTime += dt;
  const t = sequenceTime;

  // OPEN PACK

  if (t < 1.4) {
    msg("OPENING THE GUM...");

    flap.rotation.x =
      -2.3 * smooth((t - 0.25) / 1.05);

    pack.rotation.z = Math.sin(t * 2) * 0.05;
  }

  // REMOVE STICK

  else if (t < 2.7) {
    msg("TAKING OUT A STICK...");

    const p = smooth((t - 1.4) / 1.3);

    stick.position.set(
      0.12 + p * 0.2,
      0.02 + p * 0.36,
      -0.12
    );

    rightHand.position.y = -0.55 + p * 0.23;
  }

  // AUTOMATIC CHEW

  else if (t < 4.3) {
    msg("CHEWING...");

    const p = (t - 2.7) / 1.6;

    rightHand.position.y =
      -0.55 + Math.sin(p * Math.PI * 5) * 0.09;

    pack.position.y = -0.35 - p * 0.3;
    pack.visible = p < 0.65;
  }

  // AUTOMATIC WALK TO EDGE

  else if (t < 7.8) {
    msg("WALKING TO THE EDGE...");

    hands.visible = false;

    const p = smooth((t - 4.3) / 3.5);

    camera.position.z = THREE.MathUtils.lerp(
      START_Z,
      EDGE_Z,
      p
    );

    camera.position.y =
      height +
      Math.sin(t * 12) * 0.025 * (1 - p);

    pitch = THREE.MathUtils.lerp(-0.12, -0.4, p);
    cameraAngles();
  }

  // LOOK DOWN AT TRASH CAN

  else if (t < 8.7) {
    msg("LOOKING FOR THE TRASH CAN...");

    camera.position.set(0, height, EDGE_Z);

    const direction = trashPosition.clone()
      .add(new THREE.Vector3(0, 1.3, 0))
      .sub(camera.position)
      .normalize();

    const targetPitch = Math.asin(direction.y);
    const targetYaw = Math.atan2(
      -direction.x,
      -direction.z
    );

    const p = smooth((t - 7.8) / 0.9);

    pitch = THREE.MathUtils.lerp(
      -0.4,
      targetPitch,
      p
    );

    yaw = THREE.MathUtils.lerp(
      0,
      targetYaw,
      p
    );

    cameraAngles();
  }

  // PLAYER TAKES CONTROL

  else {
    state = "aiming";

    camera.position.set(0, height, EDGE_Z);
    lookAtTrash();

    $("powerHud").style.opacity = "1";
    $("crosshair").style.opacity = "1";

    msg("AIM AT THE TRASH CAN · CLICK ONCE TO ENABLE MOUSE");
  }
}

// MOUSE AIMING

function lockMouse() {
  if (document.pointerLockElement === renderer.domElement) {
    return;
  }

  const promise = renderer.domElement.requestPointerLock?.();

  if (promise?.catch) {
    promise.catch(() => {});
  }
}

document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", event => {
  if (!locked || state !== "aiming") return;

  yaw = THREE.MathUtils.clamp(
    yaw - event.movementX * 0.0022,
    -1.3,
    1.3
  );

  pitch = THREE.MathUtils.clamp(
    pitch - event.movementY * 0.0022,
    -1.52,
    0.4
  );

  cameraAngles();
});

// SPIT POWER

document.addEventListener("wheel", event => {
  if (state !== "aiming") return;

  power = THREE.MathUtils.clamp(
    power + (event.deltaY > 0 ? -3 : 3),
    10,
    100
  );

  hud();
}, { passive: true });

// KEYBOARD AIMING

document.addEventListener("keydown", event => {
  if (state !== "aiming") return;

  if (event.code === "Space") {
    event.preventDefault();
    spit();
  }

  if (event.code === "KeyW") {
    power = Math.min(100, power + 3);
  }

  if (event.code === "KeyS") {
    power = Math.max(10, power - 3);
  }

  if (event.code === "ArrowLeft") yaw += 0.035;
  if (event.code === "ArrowRight") yaw -= 0.035;
  if (event.code === "ArrowUp") pitch += 0.035;
  if (event.code === "ArrowDown") pitch -= 0.035;

  pitch = THREE.MathUtils.clamp(pitch, -1.52, 0.4);

  cameraAngles();
  hud();
});

// CLICK TO AIM / SPIT

renderer.domElement.addEventListener("mousedown", event => {
  if (event.button !== 0 || state !== "aiming") return;

  if (!locked) {
    lockMouse();
    msg("AIM WITH MOUSE · CLICK TO SPIT");
  } else {
    spit();
  }
});

// LAUNCH GUM

function spit() {
  if (state !== "aiming") return;

  state = "flying";
  flightTime = 0;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const speed = 5 + (power / 100) * 24;

  velocity.copy(direction).multiplyScalar(speed);

  projectile = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    m.gum
  );

  projectile.scale.set(1.2, 0.7, 0.9);

  projectile.position
    .copy(camera.position)
    .addScaledVector(direction, 0.7);

  projectile.position.y -= 0.15;
  projectile.castShadow = true;

  scene.add(projectile);
  msg("WATCH IT FLY!");
}

// PROJECTILE PHYSICS

function updateProjectile(dt) {
  if (state !== "flying" || !projectile) return;

  flightTime += dt;
  previous.copy(projectile.position);

  velocity.y -= 9.81 * dt;
  velocity.x += wind * dt;

  projectile.position.addScaledVector(velocity, dt);

  projectile.rotation.x += dt * 7;
  projectile.rotation.z += dt * 5;

  const top = 1.29;

  if (
    previous.y > top &&
    projectile.position.y <= top &&
    velocity.y < 0
  ) {
    const fraction =
      (previous.y - top) /
      (previous.y - projectile.position.y);

    const x = THREE.MathUtils.lerp(
      previous.x,
      projectile.position.x,
      fraction
    );

    const z = THREE.MathUtils.lerp(
      previous.z,
      projectile.position.z,
      fraction
    );

    const distance = Math.hypot(
      x - trashPosition.x,
      z - trashPosition.z
    );

    if (distance < 0.55) {
      finish(true);
      return;
    }
  }

  if (projectile.position.y <= 0 || flightTime > 12) {
    finish(false);
  }
}

// RESULTS

function finish(hit) {
  state = hit ? "success" : "miss";

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  if (hit) score += floor * 100;

  hud();

  $("resultTitle").textContent =
    hit ? "DIRECT HIT!" : "YOU MISSED!";

  $("resultDescription").textContent = hit
    ? `You scored ${floor * 100} points! Ready for a higher balcony?`
    : "Adjust your aim or power and try again.";

  $("resultButton").textContent =
    hit ? "NEXT FLOOR" : "TRY AGAIN";

  $("resultScreen").classList.remove("hidden");
}

// CONTINUE

$("resultButton").addEventListener("click", () => {
  $("resultScreen").classList.add("hidden");

  if (state === "success") {
    floor++;
    resetLevel();
  } else if (state === "miss") {
    if (projectile) {
      scene.remove(projectile);
      projectile.geometry.dispose();
      projectile = null;
    }

    state = "aiming";
    msg("TRY AGAIN · CLICK TO AIM");
  }
});

// MAIN LOOP

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);

  updateIntro(dt);
  updateProjectile(dt);

  const ring = trash.getObjectByName("targetRing");

  if (ring) {
    ring.position.y =
      1.62 + Math.sin(clock.elapsedTime * 2) * 0.08;
  }

  renderer.render(scene, camera);
}

// RESIZE

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// INITIALIZE

createCity();
resetLevel();
state = "idle";
msg("PRESS START GAME");
animate();
