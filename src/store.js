import * as THREE from 'three';

// ── Store Dimensions ──────────────────────────────────────────────────────────
const HALF_W = 10;   // half-width  (x: -10 to +10, 20m wide)
const HALF_D = 12;   // half-depth  (z: -12 to +12, 24m deep)
const CH     = 5.5;  // ceiling height

// ── Colors ────────────────────────────────────────────────────────────────────
const C_WALL    = 0xF2F2EE;
const C_CEIL    = 0xFAFAF8;
const C_SHELF   = 0x8C8C8C;
const C_SHELF_D = 0x6A6A6A;
const C_RAIL    = 0x1A1A1A;
const C_WM_BLUE = 0x0071CE;
const C_FLOOR_A = '#E8E8DC';
const C_FLOOR_B = '#DDDDD0';

// ── OTC Product Definitions ───────────────────────────────────────────────────
const PRODUCTS = [
  // { name, sub, bg, stripe, textColor }
  { name: 'AllerClear\n24HR', sub: '45ct  Cetirizine HCl 10mg',      bg: '#1255A0', stripe: '#FFFFFF', textColor: '#FFFFFF' },
  { name: 'AllerClear-D',     sub: '24ct  Non-Drowsy + Decongestant', bg: '#B71C1C', stripe: '#1255A0', textColor: '#FFFFFF' },
  { name: 'PollenBlock',      sub: '30ct  Loratadine 10mg',           bg: '#1B5E20', stripe: '#A5D6A7', textColor: '#FFFFFF' },
  { name: 'HistaStop PM',     sub: '48ct  Diphenhydramine HCl',       bg: '#4A148C', stripe: '#CE93D8', textColor: '#FFFFFF' },
  { name: 'NasaClear\nSpray', sub: '120 sprays  Fluticasone',         bg: '#006064', stripe: '#80DEEA', textColor: '#FFFFFF' },
  { name: 'ClearAir\nGeneric',sub: '365ct VALUE  Cetirizine',         bg: '#E65100', stripe: '#FFCCBC', textColor: '#FFFFFF' },
];

// Planogram: which product sits on each shelf level (bottom = 0)
const PLANOGRAM = [
  PRODUCTS[5], // Level 0 bottom  — ClearAir Generic (bulk value)
  PRODUCTS[3], // Level 1         — HistaStop PM
  PRODUCTS[2], // Level 2         — PollenBlock
  PRODUCTS[0], // Level 3 eye lvl — AllerClear 24HR  ← #1 placement
  PRODUCTS[1], // Level 4 top     — AllerClear-D
];

// ── Texture Cache ─────────────────────────────────────────────────────────────
const _texCache = new Map();

function makeFloorTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');

  ctx.fillStyle = C_FLOOR_A;
  ctx.fillRect(0, 0, s, s);

  // alternating tile tint
  ctx.fillStyle = C_FLOOR_B;
  ctx.fillRect(0, 0, s / 2, s / 2);
  ctx.fillRect(s / 2, s / 2, s / 2, s / 2);

  // grout lines
  ctx.strokeStyle = '#C8C8BC';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * s / 2, 0); ctx.lineTo(i * s / 2, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * s / 2); ctx.lineTo(s, i * s / 2); ctx.stroke();
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 12);
  return t;
}

function makeProductTexture(product) {
  if (_texCache.has(product.name)) return _texCache.get(product.name);

  const W = 128, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Background
  ctx.fillStyle = product.bg;
  ctx.fillRect(0, 0, W, H);

  // Stripe across top
  ctx.fillStyle = product.stripe;
  ctx.fillRect(0, 0, W, 56);

  // Brand name (may have \n)
  ctx.fillStyle = product.textColor;
  const lines = product.name.split('\n');
  if (lines.length === 1) {
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(lines[0], W / 2, 36);
  } else {
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(lines[0], W / 2, 28);
    ctx.fillText(lines[1], W / 2, 50);
  }

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, 62); ctx.lineTo(W - 8, 62); ctx.stroke();

  // Sub-text
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'center';
  const subs = product.sub.split('  ');
  ctx.fillText(subs[0] || '', W / 2, 80);
  if (subs[1]) ctx.fillText(subs[1], W / 2, 96);

  // Pill icon (decorative)
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2 + 20, 28, 18, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Bottom barcode strip (aesthetic)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('UPC 0 12345 67890 5', W / 2, H - 12);

  // Thin barcode lines
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 30; i++) {
    const x = 12 + i * 3.5;
    const barH = Math.random() > 0.4 ? 18 : 12;
    ctx.fillRect(x, H - 38, 1.5, barH);
  }

  const t = new THREE.CanvasTexture(c);
  _texCache.set(product.name, t);
  return t;
}

function makeAisleSignTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0071CE';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 118, 512, 10); // bottom white stripe

  ctx.font = 'bold 44px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 76);

  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('AISLE 7', 256, 104);

  return new THREE.CanvasTexture(c);
}

// ── Building Blocks ───────────────────────────────────────────────────────────

function makeMat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

// Creates one gondola shelf unit facing +x direction (face at local x=+0.27)
// Place on LEFT side: rotate.y=0  (face points toward aisle center at x=0)
// Place on RIGHT side: rotate.y=Math.PI (face points left toward x=0)
function buildGondola(length) {
  const group = new THREE.Group();
  const mSteel  = makeMat(C_SHELF);
  const mDark   = makeMat(C_SHELF_D);
  const mRail   = makeMat(C_RAIL);

  const DEPTH = 0.54;
  const HEIGHT = 1.85;

  // Back panel
  const back = box(0.025, HEIGHT, length, mDark);
  back.position.set(-DEPTH / 2, HEIGHT / 2, 0);
  group.add(back);

  // End uprights
  for (const zPos of [-length / 2 + 0.02, length / 2 - 0.02]) {
    const up = box(DEPTH, HEIGHT, 0.025, mSteel);
    up.position.set(0, HEIGHT / 2, zPos);
    group.add(up);
  }

  // Kickplate
  const kick = box(DEPTH, 0.1, length, mDark);
  kick.position.set(0, 0.05, 0);
  group.add(kick);

  // Shelf levels
  const heights = [0.28, 0.60, 0.92, 1.24, 1.56];
  heights.forEach(h => {
    const shelf = box(DEPTH - 0.02, 0.022, length, mSteel);
    shelf.position.set(0.01, h, 0);
    group.add(shelf);

    // Price rail at front edge
    const rail = box(0.006, 0.055, length, mRail);
    rail.position.set(DEPTH / 2 - 0.003, h + 0.029, 0);
    group.add(rail);
  });

  return group;
}

// Place products along a gondola. gondolaX = world x center, gondolaZ = world z center
// productFaceDir: +1 = products face +x (left gondola), -1 = products face -x (right gondola)
function addProductsToGondola(scene, gondolaX, gondolaZ, gondolaLength, productFaceDir) {
  const shelfHeights = [0.28, 0.60, 0.92, 1.24, 1.56];
  const DEPTH = 0.54;
  const PROD_W = 0.075;  // product box width along z
  const PROD_H = 0.13;   // product box height
  const PROD_D = 0.055;  // product box depth along x

  const gap = 0.005;
  const step = PROD_W + gap;
  const count = Math.floor(gondolaLength / step);
  const startZ = gondolaZ - (count * step) / 2 + step / 2;

  shelfHeights.forEach((sh, lvl) => {
    const product = PLANOGRAM[lvl];
    const tex = makeProductTexture(product);
    const mat = new THREE.MeshLambertMaterial({ map: tex });

    // Front face gets the label; other faces get the bg color
    const bgMat = makeMat(parseInt(product.bg.replace('#', '0x')));
    const materials = [bgMat, bgMat, bgMat, bgMat, bgMat, bgMat];
    // Face index 0 = +x face, index 1 = -x face
    const frontIdx = productFaceDir === 1 ? 0 : 1;
    materials[frontIdx] = mat;

    for (let i = 0; i < count; i++) {
      const pz = startZ + i * step;
      const prodMesh = new THREE.Mesh(
        new THREE.BoxGeometry(PROD_D, PROD_H, PROD_W),
        materials
      );

      // x: sit products on shelf face (front edge = gondolaX ± DEPTH/2)
      const faceX = gondolaX + productFaceDir * (DEPTH / 2 - 0.003);
      const offsetX = productFaceDir * (-PROD_D / 2 - 0.004);
      prodMesh.position.set(faceX + offsetX, sh + PROD_H / 2 + 0.023, pz);
      scene.add(prodMesh);
    }
  });
}

// ── Main Sections ─────────────────────────────────────────────────────────────

function createLighting(scene) {
  // Bright overall ambient (Walmart stores are very bright)
  scene.add(new THREE.AmbientLight(0xFFFFFF, 2.0));

  // Fluorescent ceiling strips — rows along x at several z positions
  const xs = [-6, 0, 6];
  const zs = [-9, -4.5, 0, 4.5, 9];
  xs.forEach(x => zs.forEach(z => {
    const pl = new THREE.PointLight(0xFFFFF2, 0.55, 13);
    pl.position.set(x, CH - 0.25, z);
    scene.add(pl);
  }));
}

function createFloor(scene) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_W * 2, HALF_D * 2),
    new THREE.MeshLambertMaterial({ map: makeFloorTexture() })
  );
  m.rotation.x = -Math.PI / 2;
  scene.add(m);
}

function createCeiling(scene) {
  // Ceiling panel
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_W * 2, HALF_D * 2),
    new THREE.MeshLambertMaterial({ color: C_CEIL, side: THREE.BackSide })
  );
  ceil.rotation.x = -Math.PI / 2;
  ceil.position.y = CH;
  scene.add(ceil);

  // Fluorescent light fixtures (emissive white rectangles on ceiling)
  const fixtureMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 1.2 });
  const xs = [-6, 0, 6];
  const zs = [-9, -4.5, 0, 4.5, 9];
  xs.forEach(x => zs.forEach(z => {
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 1.6), fixtureMat);
    fixture.position.set(x, CH - 0.03, z);
    scene.add(fixture);
  }));
}

function createWalls(scene) {
  const wallMat = makeMat(C_WALL);
  const blueMat = makeMat(C_WM_BLUE);

  const walls = [
    { size: [HALF_W * 2, CH], pos: [0, CH / 2, -HALF_D],  ry: 0           },
    { size: [HALF_W * 2, CH], pos: [0, CH / 2,  HALF_D],  ry: Math.PI     },
    { size: [HALF_D * 2, CH], pos: [-HALF_W, CH / 2, 0],  ry: Math.PI / 2 },
    { size: [HALF_D * 2, CH], pos: [ HALF_W, CH / 2, 0],  ry: -Math.PI / 2},
  ];

  walls.forEach(({ size, pos, ry }) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(...size), wallMat);
    m.position.set(...pos);
    m.rotation.y = ry;
    scene.add(m);

    // Walmart-blue base band (0–0.4m)
    const band = new THREE.Mesh(new THREE.PlaneGeometry(size[0], 0.4), blueMat);
    band.position.set(...pos);
    band.position.y = 0.2;
    band.rotation.y = ry;
    scene.add(band);
  });
}

function createOTCAisle(scene) {
  const GONDOLA_LENGTH = 8;          // aisle runs z = -4 to +4
  const HALF_L  = GONDOLA_LENGTH / 2;
  const INNER_X = 1.0;               // inner gondola center (faces aisle)
  const OUTER_X = 1.54;              // outer gondola center (back-to-back, INNER_X + 0.54)

  // Left inner — faces +x (toward aisle center)
  const leftInner = buildGondola(GONDOLA_LENGTH);
  leftInner.position.set(-INNER_X, 0, 0);
  scene.add(leftInner);
  addProductsToGondola(scene, -INNER_X, 0, GONDOLA_LENGTH, +1);

  // Left outer — faces -x (back-to-back with inner)
  const leftOuter = buildGondola(GONDOLA_LENGTH);
  leftOuter.position.set(-OUTER_X, 0, 0);
  leftOuter.rotation.y = Math.PI;
  scene.add(leftOuter);
  addProductsToGondola(scene, -OUTER_X, 0, GONDOLA_LENGTH, -1);

  // Right inner — faces -x (toward aisle center)
  const rightInner = buildGondola(GONDOLA_LENGTH);
  rightInner.position.set(INNER_X, 0, 0);
  rightInner.rotation.y = Math.PI;
  scene.add(rightInner);
  addProductsToGondola(scene, INNER_X, 0, GONDOLA_LENGTH, -1);

  // Right outer — faces +x (back-to-back with inner)
  const rightOuter = buildGondola(GONDOLA_LENGTH);
  rightOuter.position.set(OUTER_X, 0, 0);
  scene.add(rightOuter);
  addProductsToGondola(scene, OUTER_X, 0, GONDOLA_LENGTH, +1);

  // ── Endcap frames at aisle ends (no products yet) ──
  // One cap per gondola-run side (left and right), at both the front and back end.
  // Each cap spans the 1.1m width of one run and is rotated 90° to face the cross-aisle.
  const CAP_SPAN   = 1.12;                // matches left/right run width (~INNER+OUTER depth)
  const CAP_OFFSET = HALF_L + 0.27;      // z center = aisle end + half gondola depth
  const CAP_CX     = (INNER_X + OUTER_X) / 2; // x center of each run = 1.27

  for (const cx of [-CAP_CX, CAP_CX]) {
    // Front end (faces +z toward approaching player)
    const frontCap = buildGondola(CAP_SPAN);
    frontCap.rotation.y = -Math.PI / 2;
    frontCap.position.set(cx, 0, CAP_OFFSET);
    scene.add(frontCap);

    // Back end (faces -z toward back wall)
    const backCap = buildGondola(CAP_SPAN);
    backCap.rotation.y = Math.PI / 2;
    backCap.position.set(cx, 0, -CAP_OFFSET);
    scene.add(backCap);
  }
}

function createEndcap(scene) {
  // Freestanding endcap display at back of OTC aisle
  const group = new THREE.Group();
  const mSteel = makeMat(C_SHELF);
  const mDark  = makeMat(C_SHELF_D);
  const mRail  = makeMat(C_RAIL);
  const mSign  = new THREE.MeshLambertMaterial({
    map: makeAisleSignTexture('COUGH, COLD & ALLERGY'),
    side: THREE.FrontSide,
  });

  const W = 1.2, D = 0.45, H = 1.85;

  // Back panel
  const back = box(W, H, 0.025, mDark);
  back.position.set(0, H / 2, D / 2);
  group.add(back);

  // Side panels
  for (const x of [-W / 2, W / 2]) {
    const side = box(0.025, H, D, mSteel);
    side.position.set(x, H / 2, 0);
    group.add(side);
  }

  // Kickplate
  const kick = box(W, 0.1, D, mDark);
  kick.position.set(0, 0.05, 0);
  group.add(kick);

  // 4 shelf levels
  [0.42, 0.84, 1.26, 1.62].forEach(h => {
    const s = box(W, 0.022, D, mSteel);
    s.position.set(0, h, 0);
    group.add(s);

    const r = box(0.006, 0.055, W, mRail);
    r.rotation.y = Math.PI / 2;
    r.position.set(0, h + 0.029, -D / 2 + 0.003);
    group.add(r);
  });

  // Header sign
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.4, 0.04), [
    makeMat(C_WM_BLUE), makeMat(C_WM_BLUE),
    makeMat(C_WM_BLUE), makeMat(C_WM_BLUE),
    makeMat(C_WM_BLUE), mSign,
  ]);
  signMesh.position.set(0, H + 0.22, -0.02);
  group.add(signMesh);

  // Fill endcap shelves with AllerClear 24HR
  const featuredProduct = PRODUCTS[0];
  const tex = makeProductTexture(featuredProduct);
  const fMat = new THREE.MeshLambertMaterial({ map: tex });
  const bgMat = makeMat(parseInt(featuredProduct.bg.replace('#', '0x')));

  const mats = [bgMat, bgMat, bgMat, bgMat, bgMat, bgMat];
  mats[1] = fMat; // front face of endcap faces -z

  const PW = 0.075, PH = 0.13, PD = 0.055;
  [0.42, 0.84, 1.26, 1.62].forEach(h => {
    const count = Math.floor((W - 0.05) / (PW + 0.005));
    for (let i = 0; i < count; i++) {
      const px = -W / 2 + 0.025 + i * (PW + 0.005) + PW / 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(PD, PH, PW), mats);
      m.position.set(px, h + PH / 2 + 0.022, -D / 2 + PD / 2 + 0.007);
      group.add(m);
    }
  });

  group.position.set(0, 0, -10);
  scene.add(group);
}

function createAisleSign(scene) {
  const tex = makeAisleSignTexture('COUGH, COLD & ALLERGY');
  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), mat);
  sign.position.set(0, CH - 0.7, 0);
  scene.add(sign);

  // Hanging wire
  const wireMat = makeMat(0x888888);
  for (const x of [-0.9, 0.9]) {
    const wire = box(0.01, 0.65, 0.01, wireMat);
    wire.position.set(x, CH - 0.38, 0);
    scene.add(wire);
  }
}

function createSurroundingShelves(scene) {
  // Generic tall shelving on left and right walls (background context)
  const mSteel = makeMat(C_SHELF);
  const mDark  = makeMat(C_SHELF_D);
  const HEIGHT = 2.2;
  const DEPTH  = 0.5;

  const addWallShelves = (x, facing) => {
    const gLen = 16;
    const g = buildGondola(gLen);
    g.position.set(x, 0, -0.5);
    g.rotation.y = facing === -1 ? Math.PI : 0;
    scene.add(g);

    // Fill with generic colored boxes
    const shelfHeights = [0.28, 0.60, 0.92, 1.24, 1.56];
    const colors = [0xB3C6D0, 0xD0B3B3, 0xB3D0BB, 0xD0CCB3, 0xCCB3D0];
    shelfHeights.forEach((sh, i) => {
      const mat = makeMat(colors[i]);
      const count = Math.floor(gLen / 0.1);
      for (let j = 0; j < count; j++) {
        const pz = -gLen / 2 + 0.05 + j * 0.1;
        const m = box(0.04, 0.12, 0.07, mat);
        const fx = x + facing * (DEPTH / 2 - 0.03);
        m.position.set(fx - facing * 0.02, sh + 0.06 + 0.022, pz);
        scene.add(m);
      }
    });
  };

  addWallShelves(-7.2,  1); // left side of store, faces right
  addWallShelves( 7.2, -1); // right side of store, faces left
}

// ── Entry Point ───────────────────────────────────────────────────────────────

export function createStore(scene) {
  createLighting(scene);
  createFloor(scene);
  createCeiling(scene);
  createWalls(scene);
  createOTCAisle(scene);
  createAisleSign(scene);
  createSurroundingShelves(scene);
}
