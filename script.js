

let THREE;

try {
  THREE = await import(
    "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js"
  );
} catch (error) {
  console.warn("Primary Three.js source failed. Trying backup.");

  THREE = await import(
    "https://esm.sh/three@0.160.1"
  );
}


// ==========================================
// GUM SPIT 3D
// FIRST-PERSON BALCONY GAME
// ==========================================

// ------------------------------------------
// DOM ELEMENTS
// ------------------------------------------

const container = document.getElementById("game");

const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");

const resultScreen = document.getElementById("resultScreen");
const resultTitle = document.getElementById("resultTitle");
const resultDescription = document.getElementById("resultDescription");
const resultButton = document.getElementById("resultButton");

const floorText = document.getElementById("floor");
const scoreText = document.getElementById("score");
const windText = document.getElementById("wind");

const message = document.getElementById("message");
const controls = document.getElementById("controls");
const crosshair = document.getElementById("crosshair");

const powerHud = document.getElementById("powerHud");
const powerFill = document.getElementById("powerFill");
const powerText = document.getElementById("powerText");

const errorScreen = document.getElementById("errorScreen");
const errorText = document.getElementById("errorText");

function showError(error) {
  errorText.textContent = String(error);
  errorScreen.classList.remove("hidden");
  console.error(error);
}

// ------------------------------------------
// THREE.JS SETUP
// ------------------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x8dc9eb);
scene.fog = new THREE.Fog(0x8dc9eb, 65, 230);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.05,
  400
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// ------------------------------------------
// LIGHTS
// ------------------------------------------

const ambient = new THREE.HemisphereLight(
  0xffffff,
  0x718678,
  2.2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xffefd1,
  2.5
);

sun.position.set(-35, 65, -30);
sun.castShadow = true;

sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -90;
sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;

scene.add(sun);

// ------------------------------------------
// MATERIALS
// ------------------------------------------

function mat(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness
  });
}

const M = {
  brick: mat(0xb76d5f),
  brickDark: mat(0x99554a),
  concrete: mat(0xbdbab2),
  sidewalk: mat(0xd4d0c6),
  road: mat(0x4e5863),
  railing: mat(0x293b48, 0.4),
  metal: mat(0x77868d, 0.35),
  trash: mat(0x337e69),
  trashDark: mat(0x173e34),
  glass: mat(0x90c5dc, 0.25),
  white: mat(0xffffff),
  yellow: mat(0xffd95c),
  skin: mat(0xe6ad88),
  gum: mat(0xf1a0b4, 0.6),
  green: mat(0x276b48),
  grass: mat(0x8eaa85),
  leaves: mat(0x558d58),
  trunk: mat(0x78543d)
};

// ------------------------------------------
// GEOMETRY HELPERS
// ------------------------------------------

function addBox(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  parent.add(mesh);

  return mesh;
}

function addCylinder(
  parent,
  top,
  bottom,
  height,
  material,
  x,
  y,
  z
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      top,
      bottom,
      height,
      20
    ),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  parent.add(mesh);

  return mesh;
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

// ------------------------------------------
// GAME STATE
// ------------------------------------------

let floor = 1;
let score = 0;
let power = 60;
let wind = 0;

let state = "intro";

let chewCount = 0;
let balconyHeight = 12;

let yaw = 0;
let pitch = -0.12;

let walkZ = 1.2;
let walkX = 0;

let locked = false;

let gumProjectile = null;
let gumVelocity = new THREE.Vector3();
let gumPrevious = new THREE.Vector3();

let flightTime = 0;

const GRAVITY = 9.81;

const keys = {};

let trashPosition = new THREE.Vector3(0, 0, -11);

// Groups

const city = new THREE.Group();
const balcony = new THREE.Group();
const trash = new THREE.Group();

scene.add(city);
scene.add(balcony);
scene.add(trash);

// Camera hands

const hands = new THREE.Group();

camera.add(hands);
scene.add(camera);

let gumPack;
let packFlap;
let gumStick;
let rightHand;

let animationProgress = 0;
let animationType = null;

// ------------------------------------------
// CREATE CITY
// ------------------------------------------

function createCity() {

  // Ground
  addBox(
    city,
    400, 1, 400,
    M.grass,
    0, -0.6, -70
  );

  // Sidewalk beneath balcony
  addBox(
    city,
    160, 0.15, 17,
    M.sidewalk,
    0, 0, -13
  );

  // Road
  addBox(
    city,
    160, 0.1, 24,
    M.road,
    0, -0.04, -36
  );

  // Opposite sidewalk
  addBox(
    city,
    160, 0.15, 12,
    M.sidewalk,
    0, 0, -55
  );

  // Sidewalk seams
  for (let x = -80; x <= 80; x += 4) {
    addBox(
      city,
      0.04, 0.01, 17,
      mat(0xaaa79e),
      x, 0.09, -13
    );
  }

  // Road lines
  for (let x = -75; x < 75; x += 12) {
    addBox(
      city,
      5, 0.02, 0.2,
      M.yellow,
      x, 0.03, -36
    );
  }

  // Buildings across road
  for (let i = -5; i <= 5; i++) {
    const height = 18 + (Math.abs(i * 7) % 20);

    createBuilding(
      i * 19,
      -78,
      17,
      height,
      i % 2 === 0 ? 0xb5a59b : 0x879ba8
    );
  }

  // Trees
  for (let i = -6; i <= 6; i++) {
    if (Math.abs(i) <= 1) continue;

    createTree(i * 11, -7);
  }

}

function createBuilding(x, z, width, height, color) {

  const group = new THREE.Group();

  group.position.set(x, 0, z);

  addBox(
    group,
    width, height, 15,
    mat(color),
    0, height / 2, 0
  );

  // Windows facing the balcony
  for (let y = 3; y < height - 2; y += 4) {

    for (
      let wx = -width / 2 + 2;
      wx < width / 2 - 1;
      wx += 3.5
    ) {

      addBox(
        group,
        1.7, 2.2, 0.08,
        M.glass,
        wx, y, 7.56
      );

      addBox(
        group,
        1.9, 0.12, 0.16,
        M.white,
        wx, y - 1.15, 7.65
      );

    }

  }

  city.add(group);
}

function createTree(x, z) {

  addCylinder(
    city,
    0.25, 0.35, 3,
    M.trunk,
    x, 1.5, z
  );

  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.1, 1),
    M.leaves
  );

  crown.position.set(x, 4.3, z);
  crown.castShadow = true;

  city.add(crown);
}

// ------------------------------------------
// CREATE BALCONY
// ------------------------------------------

function createBalcony() {

  balcony.clear();

  const h = balconyHeight;

  // Main building wall behind player.
  // The player faces NEGATIVE Z.
  addBox(
    balcony,
    30, 120, 10,
    M.brick,
    0, h - 10, 9
  );

  // Balcony floor
  addBox(
    balcony,
    8, 0.35, 6,
    M.concrete,
    0, h - 1.8, -1
  );

  // Front railing at Z = -3.9
  addBox(
    balcony,
    8, 0.14, 0.14,
    M.railing,
    0, h - 0.65, -3.9
  );

  addBox(
    balcony,
    8, 0.1, 0.1,
    M.railing,
    0, h - 1.5, -3.9
  );

  for (let x = -3.9; x <= 3.9; x += 0.5) {

    addBox(
      balcony,
      0.07, 1.05, 0.07,
      M.railing,
      x, h - 1.15, -3.9
    );

  }

  // Side railings
  for (const side of [-1, 1]) {

    const x = side * 3.95;

    addBox(
      balcony,
      0.12, 0.14, 6,
      M.railing,
      x, h - 0.65, -1
    );

    for (let z = -3.8; z <= 1.8; z += 0.6) {

      addBox(
        balcony,
        0.07, 1.05, 0.07,
        M.railing,
        x, h - 1.15, z
      );

    }

  }

  // Sliding door behind player
  addBox(
    balcony,
    2.7, 4.4, 0.25,
    M.white,
    0, h + 0.2, 3.8
  );

  addBox(
    balcony,
    2.2, 3.8, 0.08,
    M.glass,
    0, h + 0.15, 3.61
  );

  // Door center divider
  addBox(
    balcony,
    0.09, 3.8, 0.12,
    M.white,
    0, h + 0.15, 3.54
  );

}

// ------------------------------------------
// TRASH CAN
// ------------------------------------------

function createTrashCan() {

  trash.clear();

  trash.position.copy(trashPosition);

  // Main body
  addCylinder(
    trash,
    0.62, 0.5, 1.25,
    M.trash,
    0, 0.625, 0
  );

  // Dark opening
  addCylinder(
    trash,
    0.55, 0.55, 0.025,
    M.trashDark,
    0, 1.25, 0
  );

  // Rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.62, 0.075, 8, 32
    ),
    M.metal
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.26;

  trash.add(rim);

  // Trash can ribs
  for (let i = 0; i < 12; i++) {

    const angle = (i / 12) * Math.PI * 2;

    const x = Math.cos(angle) * 0.57;
    const z = Math.sin(angle) * 0.57;

    addBox(
      trash,
      0.035, 0.9, 0.035,
      M.trashDark,
      x, 0.62, z
    );

  }

  // Floating target ring
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.9, 0.035, 8, 40
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffdc57,
      transparent: true,
      opacity: 0.8
    })
  );

  marker.rotation.x = Math.PI / 2;
  marker.position.y = 1.65;
  marker.name = "marker";

  trash.add(marker);

}

// ------------------------------------------
// FIRST PERSON HANDS AND GUM
// ------------------------------------------

function createHands() {

  hands.clear();

  const handGeometry = new THREE.CapsuleGeometry(
    0.12, 0.36, 5, 10
  );

  // Left hand
  const leftHand = new THREE.Mesh(
    handGeometry,
    M.skin
  );

  leftHand.position.set(
    -0.48, -0.55, -0.75
  );

  leftHand.rotation.z = -0.45;

  hands.add(leftHand);

  // Right hand
  rightHand = new THREE.Mesh(
    handGeometry,
    M.skin
  );

  rightHand.position.set(
    0.48, -0.55, -0.75
  );

  rightHand.rotation.z = 0.45;

  hands.add(rightHand);

  // Gum pack group
  gumPack = new THREE.Group();

  // Package body
  addBox(
    gumPack,
    0.68, 0.3, 0.14,
    mat(0xe9f1df),
    0, 0, 0
  );

  // Green wrapper stripes
  addBox(
    gumPack,
    0.68, 0.045, 0.15,
    M.green,
    0, 0.11, 0
  );

  addBox(
    gumPack,
    0.68, 0.045, 0.15,
    M.green,
    0, -0.11, 0
  );

  // Pack flap
  packFlap = new THREE.Group();

  addBox(
    packFlap,
    0.68, 0.17, 0.025,
    mat(0xe9f1df),
    0, 0.085, 0
  );

  packFlap.position.set(0, 0.15, 0.01);

  gumPack.add(packFlap);

  // Individual gum sticks
  for (let i = 0; i < 5; i++) {

    addBox(
      gumPack,
      0.1, 0.23, 0.025,
      mat(0xfaf6e9),
      -0.23 + i * 0.115,
      0.01,
      -0.09
    );

  }

  // Gum stick that gets pulled out
  gumStick = new THREE.Group();

  addBox(
    gumStick,
    0.1, 0.24, 0.035,
    mat(0xf8f5e9),
    0, 0, 0
  );

  gumStick.position.set(0.12, 0.02, -0.12);

  gumPack.add(gumStick);

  gumPack.position.set(
    0,
    -0.35,
    -0.7
  );

  hands.add(gumPack);

}

// ------------------------------------------
// HUD
// ------------------------------------------

function updateHUD() {

  floorText.textContent = floor;
  scoreText.textContent = score;

  windText.textContent =
    (wind > 0 ? "+" : "") + wind.toFixed(1);

  powerText.textContent = power + "%";
  powerFill.style.width = power + "%";

}

function setMessage(text) {
  message.textContent = text;
}

function setControls(text) {
  controls.textContent = text;
}

// ------------------------------------------
// LEVEL SETUP
// ------------------------------------------

function setupLevel() {

  balconyHeight = 12 + (floor - 1) * 6;

  // Keep trash can in front of balcony,
  // on the sidewalk rather than behind us.
  trashPosition.set(
    random(-2.5, 2.5),
    0,
    random(-13, -9)
  );

  wind = random(
    -Math.min(floor * 0.25, 2),
    Math.min(floor * 0.25, 2)
  );

  power = 60;
  chewCount = 0;

  state = "pack";

  // Player starts near the apartment door.
  walkX = 0;
  walkZ = 1.2;

  yaw = 0;
  pitch = -0.12;

  camera.position.set(
    walkX,
    balconyHeight,
    walkZ
  );

  updateCamera();

  if (gumProjectile) {
    scene.remove(gumProjectile);
    gumProjectile.geometry.dispose();
    gumProjectile = null;
  }

  createBalcony();
  createTrashCan();
  createHands();

  hands.visible = true;

  packFlap.rotation.x = 0;
  gumStick.position.set(0.12, 0.02, -0.12);

  animationType = null;
  animationProgress = 0;

  powerHud.classList.add("hidden");
  crosshair.classList.remove("visible");

  setMessage("CLICK TO OPEN YOUR GUM");
  setControls("CLICK TO OPEN PACK");

  updateHUD();

}

// ------------------------------------------
// GUM ANIMATIONS
// ------------------------------------------

function startOpeningPack() {

  if (state !== "pack") return;

  state = "opening";

  animationType = "open";
  animationProgress = 0;

  setMessage("OPENING GUM PACK...");
  setControls("");

}

function startTakingGum() {

  if (state !== "take") return;

  state = "taking";

  animationType = "take";
  animationProgress = 0;

  setMessage("TAKING OUT A STICK...");
  setControls("");

}

function startChewing() {

  if (state !== "chew") return;

  chewCount++;

  animationType = "chew";
  animationProgress = 0;

  setMessage(
    "CHEWING... " + chewCount + "/5"
  );

  if (chewCount >= 5) {

    state = "readyWalk";

    setMessage("WALK TO THE EDGE OF THE BALCONY");
    setControls("WASD TO WALK · MOUSE TO LOOK");

    gumPack.visible = false;

  }

}

function updateGumAnimations(dt) {

  if (!animationType) return;

  animationProgress += dt;

  if (animationType === "open") {

    const t = Math.min(
      animationProgress / 0.7,
      1
    );

    packFlap.rotation.x = -t * 2.3;

    gumPack.rotation.z =
      Math.sin(t * Math.PI) * 0.15;

    if (t >= 1) {

      animationType = null;
      state = "take";

      setMessage("CLICK TO TAKE OUT A STICK");
      setControls("CLICK TO TAKE GUM");

    }

  }

  else if (animationType === "take") {

    const t = Math.min(
      animationProgress / 0.8,
      1
    );

    gumStick.position.y =
      0.02 + t * 0.35;

    gumStick.position.x =
      0.12 + t * 0.2;

    if (t >= 1) {

      animationType = null;
      state = "chew";

      setMessage("CLICK TO CHEW YOUR GUM");
      setControls("CLICK FIVE TIMES TO CHEW");

    }

  }

  else if (animationType === "chew") {

    if (rightHand) {

      rightHand.position.y =
        -0.55 +
        Math.sin(animationProgress * 15) * 0.08;

    }

    if (animationProgress >= 0.35) {

      animationType = null;

      if (rightHand) {
        rightHand.position.y = -0.55;
      }

    }

  }

}

// ------------------------------------------
// CAMERA
// ------------------------------------------

function updateCamera() {

  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

}

function lockMouse() {

  if (
    renderer.domElement.requestPointerLock &&
    document.pointerLockElement !== renderer.domElement
  ) {

    const request =
      renderer.domElement.requestPointerLock();

    if (request && request.catch) {
      request.catch(() => {
        setControls("CLICK GAME TO ENABLE MOUSE LOOK");
      });
    }

  }

}

document.addEventListener(
  "pointerlockchange",
  () => {

    locked =
      document.pointerLockElement ===
      renderer.domElement;

  }
);

document.addEventListener(
  "mousemove",
  event => {

    if (!locked) return;

    if (
      state !== "readyWalk" &&
      state !== "aiming"
    ) return;

    yaw -= event.movementX * 0.0022;
    pitch -= event.movementY * 0.0022;

    yaw = THREE.MathUtils.clamp(
      yaw, -1.3, 1.3
    );

    pitch = THREE.MathUtils.clamp(
      pitch, -1.5, 0.6
    );

    updateCamera();

  }
);

// ------------------------------------------
// WALKING
// ------------------------------------------

function updateWalking(dt) {

  if (state !== "readyWalk") return;

  const speed = 2.5;

  let moveX = 0;
  let moveZ = 0;

  if (keys["KeyW"]) moveZ -= 1;
  if (keys["KeyS"]) moveZ += 1;
  if (keys["KeyA"]) moveX -= 1;
  if (keys["KeyD"]) moveX += 1;

  const movement = new THREE.Vector3(
    moveX, 0, moveZ
  );

  if (movement.lengthSq() > 0) {

    movement.normalize();

    // Movement relative to where the player looks.
    movement.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      yaw
    );

    walkX += movement.x * speed * dt;
    walkZ += movement.z * speed * dt;

  }

  // Keep player on balcony.
  walkX = THREE.MathUtils.clamp(
    walkX, -3.4, 3.4
  );

  walkZ = THREE.MathUtils.clamp(
    walkZ, -3.05, 1.6
  );

  camera.position.x = walkX;
  camera.position.z = walkZ;

  // Automatically start aiming at the edge.
  if (walkZ <= -3.0) {

    startAiming();

  }

}

function startAiming() {

  state = "aiming";

  // Look down toward trash can.
  const target = new THREE.Vector3(
    trashPosition.x,
    1.25,
    trashPosition.z
  );

  const direction = target
    .clone()
    .sub(camera.position)
    .normalize();

  yaw = Math.atan2(
    -direction.x,
    -direction.z
  );

  pitch = Math.asin(direction.y);

  updateCamera();

  hands.visible = false;

  crosshair.classList.add("visible");
  powerHud.classList.remove("hidden");

  setMessage("AIM FOR THE TRASH CAN!");
  setControls(
    "MOUSE TO AIM · SCROLL FOR POWER · CLICK TO SPIT"
  );

}

// ------------------------------------------
// SPIT POWER
// ------------------------------------------

document.addEventListener(
  "wheel",
  event => {

    if (state !== "aiming") return;

    power += event.deltaY > 0 ? -3 : 3;

    power = THREE.MathUtils.clamp(
      power, 10, 100
    );

    updateHUD();

  },
  { passive: true }
);

// ------------------------------------------
// KEYBOARD
// ------------------------------------------

document.addEventListener(
  "keydown",
  event => {

    keys[event.code] = true;

    if (state === "aiming") {

      if (event.code === "ArrowUp") {
        pitch += 0.035;
      }

      if (event.code === "ArrowDown") {
        pitch -= 0.035;
      }

      if (event.code === "ArrowLeft") {
        yaw += 0.035;
      }

      if (event.code === "ArrowRight") {
        yaw -= 0.035;
      }

      pitch = THREE.MathUtils.clamp(
        pitch, -1.5, 0.6
      );

      yaw = THREE.MathUtils.clamp(
        yaw, -1.3, 1.3
      );

      updateCamera();

      if (event.code === "Space") {
        event.preventDefault();
        spit();
      }

    }

  }
);

document.addEventListener(
  "keyup",
  event => {
    keys[event.code] = false;
  }
);

window.addEventListener("blur", () => {
  for (const key in keys) {
    keys[key] = false;
  }
});

// ------------------------------------------
// MOUSE INTERACTION
// ------------------------------------------

renderer.domElement.addEventListener(
  "mousedown",
  event => {

    if (event.button !== 0) return;

    if (state === "pack") {
      startOpeningPack();
    }

    else if (state === "take") {
      startTakingGum();
    }

    else if (state === "chew") {
      startChewing();
    }

    else if (state === "readyWalk") {
      lockMouse();
    }

    else if (state === "aiming") {

      if (!locked) {
        lockMouse();
      } else {
        spit();
      }

    }

  }
);

// ------------------------------------------
// SPITTING
// ------------------------------------------

function spit() {

  if (state !== "aiming") return;

  state = "flying";
  flightTime = 0;

  const direction = new THREE.Vector3();

  camera.getWorldDirection(direction);

  const speed =
    5 + (power / 100) * 24;

  gumVelocity.copy(direction).multiplyScalar(speed);

  gumProjectile = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.12, 16, 12
    ),
    M.gum
  );

  gumProjectile.scale.set(
    1.2, 0.7, 0.9
  );

  gumProjectile.position.copy(camera.position);

  gumProjectile.position.addScaledVector(
    direction, 0.7
  );

  gumProjectile.position.y -= 0.15;

  gumProjectile.castShadow = true;

  scene.add(gumProjectile);

  setMessage("WATCH IT FLY!");
  setControls("");

}

// ------------------------------------------
// PROJECTILE PHYSICS
// ------------------------------------------

function updateProjectile(dt) {

  if (
    state !== "flying" ||
    !gumProjectile
  ) return;

  flightTime += dt;

  gumPrevious.copy(gumProjectile.position);

  // Gravity
  gumVelocity.y -= GRAVITY * dt;

  // Wind
  gumVelocity.x += wind * dt;

  gumProjectile.position.addScaledVector(
    gumVelocity,
    dt
  );

  gumProjectile.rotation.x += dt * 7;
  gumProjectile.rotation.z += dt * 5;

  // Trash can opening
  const topY = 1.25;

  if (
    gumPrevious.y > topY &&
    gumProjectile.position.y <= topY &&
    gumVelocity.y < 0
  ) {

    const fraction =
      (gumPrevious.y - topY) /
      (gumPrevious.y - gumProjectile.position.y);

    const hitX = THREE.MathUtils.lerp(
      gumPrevious.x,
      gumProjectile.position.x,
      fraction
    );

    const hitZ = THREE.MathUtils.lerp(
      gumPrevious.z,
      gumProjectile.position.z,
      fraction
    );

    const dx = hitX - trashPosition.x;
    const dz = hitZ - trashPosition.z;

    const distance = Math.sqrt(
      dx * dx + dz * dz
    );

    if (distance < 0.53) {

      shotSuccess();
      return;

    }

  }

  if (
    gumProjectile.position.y <= 0 ||
    flightTime > 12
  ) {

    shotMiss();

  }

}

// ------------------------------------------
// SHOT RESULTS
// ------------------------------------------

function releaseMouse() {

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

}

function shotSuccess() {

  state = "success";

  const points = floor * 100;
  score += points;

  updateHUD();
  releaseMouse();

  resultTitle.textContent = "DIRECT HIT!";

  resultDescription.textContent =
    "You scored " + points +
    " points! Ready to try a higher balcony?";

  resultButton.textContent = "NEXT FLOOR";

  resultScreen.classList.remove("hidden");

}

function shotMiss() {

  state = "miss";

  releaseMouse();

  resultTitle.textContent = "YOU MISSED!";

  resultDescription.textContent =
    "Try changing your aim or spit power.";

  resultButton.textContent = "TRY AGAIN";

  resultScreen.classList.remove("hidden");

}

resultButton.addEventListener("click", () => {

  resultScreen.classList.add("hidden");

  if (state === "success") {

    floor++;
    setupLevel();

  }

  else if (state === "miss") {

    if (gumProjectile) {
      scene.remove(gumProjectile);
      gumProjectile.geometry.dispose();
      gumProjectile = null;
    }

    state = "aiming";

    crosshair.classList.add("visible");
    powerHud.classList.remove("hidden");

    setMessage("TRY AGAIN!");
    setControls(
      "MOUSE TO AIM · SCROLL FOR POWER · CLICK TO SPIT"
    );

  }

});

// ------------------------------------------
// START BUTTON
// ------------------------------------------

startButton.addEventListener("click", () => {

  startScreen.classList.add("hidden");

  setupLevel();

});

// ------------------------------------------
// ANIMATION LOOP
// ------------------------------------------

const clock = new THREE.Clock();

function animate() {

  requestAnimationFrame(animate);

  const dt = Math.min(
    clock.getDelta(),
    0.033
  );

  const time = clock.elapsedTime;

  updateGumAnimations(dt);
  updateWalking(dt);
  updateProjectile(dt);

  // Subtle idle movement
  if (
    state === "pack" ||
    state === "take" ||
    state === "chew"
  ) {

    if (gumPack) {

      gumPack.position.y =
        -0.35 +
        Math.sin(time * 2) * 0.012;

    }

  }

  // Trash target ring animation
  const marker = trash.getObjectByName("marker");

  if (marker) {

    marker.position.y =
      1.65 +
      Math.sin(time * 2) * 0.1;

    marker.rotation.z += dt * 0.3;

  }

  renderer.render(scene, camera);

}

// ------------------------------------------
// RESIZE
// ------------------------------------------

window.addEventListener("resize", () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

});

// ------------------------------------------
// INITIALIZE
// ------------------------------------------

try {

  createCity();
  setupLevel();
  animate();

} catch (error) {

  showError(error.message);

}
