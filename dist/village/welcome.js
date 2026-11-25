import * as T from './vendor/three.module.min.js';

// Measured in village units. The facade faces local +Z and its roof ridge runs north–south.
const paper = {
  red: '#b53e35',
  berry: '#92342f',
  plum: '#71313a',
  dark: '#382e30',
  blush: '#d9684a',
  cream: '#ffedc4',
  snow: '#fff5df',
  shade: '#dbd8c4',
  pine: '#255647',
  spruce: '#346954',
  leaf: '#548267',
  gold: '#efbd62',
  butter: '#ffe09a',
  brown: '#7a4e40',
  teal: '#447c70',
  pink: '#df9d90',
};
const signs = {
  en: ['POST OFFICE', 'WELCOME', 'HELP', 'INSTALL', 'POST'],
  da: ['POSTHUS', 'VELKOMMEN', 'HJÆLP', 'INSTALLÉR', 'POST'],
  sv: ['POSTKONTOR', 'VÄLKOMMEN', 'HJÄLP', 'INSTALLERA', 'POST'],
};
const materials = new Map();
const cube = new T.BoxGeometry(1, 1, 1);
const TAU = 2 * Math.PI;

function stock(tint) {
  const color = paper[tint] || tint;
  if (!materials.has(color)) {
    materials.set(
      color,
      new T.MeshStandardMaterial({
        color,
        roughness: 1,
        metalness: 0,
        flatShading: true,
        ...(tint === 'butter' ? { emissive: '#f3a644', emissiveIntensity: 0.38 } : {}),
      }),
    );
  }
  return materials.get(color);
}
function group(parent, x = 0, y = 0, z = 0) {
  const item = new T.Group();
  item.position.set(x, y, z);
  parent.add(item);
  return item;
}
function mesh(parent, geometry, tint, x = 0, y = 0, z = 0) {
  const item = new T.Mesh(geometry, typeof tint === 'string' ? stock(tint) : tint);
  item.position.set(x, y, z);
  item.castShadow = item.receiveShadow = true;
  parent.add(item);
  return item;
}
function block(parent, x, y, z, w, h, d, tint) {
  const item = mesh(parent, cube, tint, x, y, z);
  item.scale.set(w, h, d);
  return item;
}
function rod(parent, start, end, width, depth, tint) {
  const a = new T.Vector3(...start),
    b = new T.Vector3(...end);
  const length = a.distanceTo(b);
  const mid = a.clone().lerp(b, 0.5);
  const item = block(parent, mid.x, mid.y, mid.z, width, length, depth, tint);
  item.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
  return item;
}
function cut(parent, shape, depth, tint, x, y, z) {
  const geometry = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 8,
  });
  return mesh(parent, geometry, tint, x, y, z);
}
function polygon(parent, points, depth, tint, x = 0, y = 0, z = 0) {
  return cut(parent, new T.Shape(points.map(([u, v]) => new T.Vector2(u, v))), depth, tint, x, y, z);
}
function disc(parent, x, y, z, radius, depth, tint, n = 24) {
  const o = mesh(parent, new T.CylinderGeometry(radius, radius, depth, n), tint, x, y, z);
  o.rotation.x = Math.PI / 2;
  return o;
}
function arch(parent, x, y, z, width, height, depth, tint) {
  const r = width * 0.5;
  const shape = new T.Shape();
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, height - r);
  shape.absarc(0, height - r, r, 0, Math.PI);
  shape.closePath();
  return cut(parent, shape, depth, tint, x, y, z);
}
function label(parent, words, x, y, z, w, h, ink = paper.cream) {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 96px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.fillText(words, c.width / 2, c.height * 0.53, c.width - 20);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  // Alpha test keeps the painted letters depth-correct when rotating past this plot.
  const m = new T.MeshBasicMaterial({
    map: texture,
    transparent: false,
    alphaTest: 0.18,
    toneMapped: false,
  });
  const text = mesh(parent, new T.PlaneGeometry(w, h), m, x, y, z);
  text.castShadow = false;
  return text;
}
function foldedStar(parent, x, y, z, r, tint = 'gold') {
  const verts = [],
    colors = [],
    shade = new T.Color();
  for (let i = 0; i < 10; i++) {
    const point = (k) => {
      const a = Math.PI / 2 + (k * Math.PI) / 5,
        d = k % 2 === 0 ? r : r * 0.45;
      return [Math.cos(a) * d, Math.sin(a) * d, 0];
    };
    verts.push(0, 0, r * 0.25, ...point(i), ...point(i + 1));
    shade.set(paper[tint]).multiplyScalar(i % 2 ? 0.82 : 1.13);
    for (let j = 0; j < 3; j++) colors.push(shade.r, shade.g, shade.b);
  }
  const geom = new T.BufferGeometry();
  geom.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geom.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: T.DoubleSide });
  return mesh(parent, geom, mat, x, y, z);
}

// Each pitched roof sheet has a turned-down cranberry fascia and overlapping cut snow.
// The outermost edge alternates between shallow arcs and little folded points.
function roofHalf(parent, side) {
  const pitch = Math.atan2(2.43, 3.22),
    run = 3.54 / Math.cos(pitch);
  const roof = group(parent, 0, 6.79, 0.04);
  roof.rotation.z = -side * pitch;
  block(roof, (side * run) / 2, 0, 0, run, 0.24, 4.62, 'plum');
  block(roof, (side * run) / 2, 0.105, 0, run, 0.08, 4.68, 'berry');
  for (let row = 0; row < 4; row++) {
    const low = run * (row / 4),
      high = run * ((row + 1) / 4);
    const sheet = new T.Shape();
    sheet.moveTo(side * low, -2.37);
    sheet.lineTo(side * high, -2.37);
    const teeth = 9;
    for (let i = 0; i < teeth; i++) {
      const t = -2.37 + (i * 4.74) / teeth,
        span = 4.74 / teeth;
      const bulge = (row === 3 ? 0.13 : 0.048) * (1 + (i % 3) * 0.22);
      sheet.quadraticCurveTo(side * (high + bulge), t + span * 0.4, side * high, t + span);
    }
    sheet.lineTo(side * low, 2.37);
    sheet.closePath();
    const layer = cut(
      roof,
      sheet,
      row === 3 ? 0.16 : 0.1,
      row % 2 ? 'snow' : '#f8ecd5',
      0,
      0.18 + (3 - row) * 0.055,
      0,
    );
    layer.rotation.x = -Math.PI / 2;
  }
  // Layered scalloped verge on both sides of the gable.
  for (let k = 0; k < 11; k++) {
    const u = ((k + 0.5) * run) / 11;
    disc(roof, side * u, 0.02, 2.32, 0.22, 0.12, 'cream', 18);
    if (k % 2 === 1) disc(roof, side * u, 0.04, 2.395, 0.055, 0.022, 'red', 12);
  }
  return roof;
}
function windowSet(parent, x, y, z, width = 0.95, height = 1.48) {
  const g = group(parent, x, y, z);
  arch(g, 0, -0.035, 0.0, width + 0.32, height + 0.22, 0.1, 'berry');
  arch(g, 0, 0, 0.09, width + 0.16, height + 0.12, 0.11, 'cream');
  arch(g, 0, 0.095, 0.205, width - 0.06, height - 0.1, 0.035, 'brown');
  arch(g, 0, 0.15, 0.245, width - 0.19, height - 0.22, 0.035, 'butter');
  block(g, 0, (height - 0.2) / 2 + 0.1, 0.29, 0.075, height - 0.23, 0.065, 'cream');
  block(g, 0, height * 0.49, 0.29, width - 0.13, 0.078, 0.062, 'cream');
  block(g, 0, height * 0.76, 0.29, width - 0.17, 0.065, 0.062, 'cream');
  block(g, 0, 0.0, 0.23, width + 0.33, 0.14, 0.35, 'pine');
  block(g, 0, 0.075, 0.245, width + 0.38, 0.07, 0.38, 'snow');
  return g;
}
function porchLamp(parent, x, y, z) {
  const g = group(parent, x, y, z);
  rod(g, [0, 0.46, 0], [0, 0.46, 0.33], 0.075, 0.075, 'dark');
  rod(g, [0, 0.46, 0.31], [0, 0.26, 0.31], 0.05, 0.05, 'dark');
  const light = block(g, 0, 0, 0.31, 0.28, 0.39, 0.24, 'butter');
  light.rotation.y = 0.18;
  for (let s of [-1, 1]) block(g, s * 0.142, 0, 0.445, 0.035, 0.4, 0.035, 'brown');
  block(g, 0, -0.22, 0.31, 0.35, 0.085, 0.31, 'pine');
  const cap = mesh(g, new T.ConeGeometry(0.29, 0.19, 4), 'pine', 0, 0.27, 0.31);
  cap.rotation.y = Math.PI / 4;
}
function chimney(parent) {
  const g = group(parent, -1.66, 5.54, -0.63);
  block(g, 0, 0.71, 0, 0.78, 1.5, 0.74, 'berry');
  for (let j = 0; j < 3; j++) {
    block(g, 0, 0.32 + j * 0.42, 0, 0.8, 0.065, 0.77, 'blush');
    block(g, j % 2 ? -0.16 : 0.17, 0.49 + j * 0.42, 0.373, 0.04, 0.28, 0.025, 'blush');
  }
  block(g, 0, 1.42, 0, 1, 0.24, 0.95, 'plum');
  block(g, 0, 1.58, 0, 1.09, 0.16, 1.02, 'snow');
  block(g, 0, 1.672, 0, 0.72, 0.03, 0.68, 'dark');
}
function wreath(parent, x, y, z, radius) {
  const tor = new T.TorusGeometry(radius, 0.068, 5, 14);
  mesh(parent, tor, 'pine', x, y, z);
  for (let j = 0; j < 12; j++) {
    const a = (j * TAU) / 12;
    const sprig = polygon(
      parent,
      [
        [-0.033, -0.09],
        [0.059, 0.026],
        [0, 0.12],
        [-0.065, 0.029],
      ],
      0.036,
      j % 3 ? 'spruce' : 'leaf',
      x + radius * Math.cos(a),
      y + radius * Math.sin(a),
      z + 0.026,
    );
    sprig.rotation.z = a - 0.6;
  }
  for (let k of [0, 1, 4, 6, 9]) {
    const a = (k * TAU) / 12;
    disc(parent, x + radius * Math.cos(a), y + radius * Math.sin(a), z + 0.07, 0.05, 0.035, 'red', 10);
  }
  for (let s of [-1, 1])
    polygon(
      parent,
      [
        [0, 0],
        [s * 0.19, 0.1],
        [s * 0.19, -0.1],
      ],
      0.05,
      'red',
      x,
      y - radius,
      z + 0.12,
    );
}
function awning(parent) {
  const g = group(parent, 0, 3.23, 2.12);
  const count = 7,
    width = 2.12;
  for (let j = 0; j < count; j++) {
    const x = ((j - (count - 1) / 2) * width) / count;
    const c = j % 2 === 0 ? 'red' : 'cream';
    const panel = block(g, x, -0.14, 0.43, width / count + 0.006, 0.13, 1.0, c);
    panel.rotation.x = 0.31;
    const s = new T.Shape(),
      a = width / count / 2;
    s.moveTo(-a, 0.07);
    s.lineTo(a, 0.07);
    s.lineTo(a, -0.07);
    s.quadraticCurveTo(a * 0.6, -0.23, 0, -0.23);
    s.quadraticCurveTo(-a * 0.62, -0.22, -a, -0.07);
    s.closePath();
    cut(g, s, 0.065, c, x, -0.28, 0.87);
  }
  for (let side of [-1, 1]) {
    rod(g, [side * 0.92, -0.71, 0.05], [side * 0.92, -0.3, 0.8], 0.09, 0.09, 'pine');
  }
}
function lodge(parent, lang) {
  const body = group(parent);
  body.rotation.y = -0.32;
  block(body, 0, 0.12, 0, 6.05, 0.24, 4.17, 'brown');
  block(body, 0, 0.3, 0, 5.98, 0.16, 4.12, 'cream');
  polygon(
    body,
    [
      [-2.81, 0.35],
      [2.81, 0.35],
      [2.81, 4.51],
      [0, 6.61],
      [-2.81, 4.51],
    ],
    3.85,
    'red',
    0,
    0,
    -1.94,
  );
  // Vertical fold lines, plinth skirting and front corner pilasters.
  for (let j = -7; j <= 7; j++) {
    const x = j * 0.38,
      h = 4.2 + (1 - Math.abs(x) / 2.81) * 2.05;
    block(body, x, 0.4 + h * 0.5, 1.93, 0.035, h, 0.04, '#c64b3e');
  }
  for (let side of [-1, 1]) {
    block(body, side * 2.76, 2.37, 0.02, 0.16, 4.05, 4, 'cream');
    block(body, side * 2.71, 2.38, 1.98, 0.23, 4.08, 0.17, 'cream');
    const wall = group(body, side * 2.83, 0, 0.02);
    wall.rotation.y = (side * Math.PI) / 2;
    for (const offset of [-0.98, 0.98]) windowSet(wall, offset, 1.45, 0, 0.91, 1.4);
  }
  block(body, 0, 0.53, 1.99, 5.64, 0.18, 0.16, 'berry');
  block(body, 0, 0.64, 2, 5.62, 0.045, 0.17, 'cream');
  // Carved belt course with small alternating diamond inlays.
  block(body, 0, 4.17, 1.98, 5.62, 0.23, 0.16, 'berry');
  block(body, 0, 4.34, 1.985, 5.68, 0.09, 0.19, 'cream');
  for (let j = -8; j <= 8; j++) {
    const d = block(body, j * 0.313, 4.17, 2.075, 0.082, 0.082, 0.044, j % 2 ? 'gold' : 'cream');
    d.rotation.z = Math.PI / 4;
  }
  for (const side of [-1, 1]) {
    roofHalf(body, side);
    rod(body, [side * 3.42, 4.12, 2.2], [0, 6.76, 2.2], 0.2, 0.17, 'cream');
    rod(body, [side * 2.68, 4.39, 2.083], [side * 0.73, 5.86, 2.083], 0.095, 0.085, 'cream');
  }
  chimney(body);
  // Gable rose window and the fold at the centre of its six-point rosette.
  disc(body, 0, 5.5, 2.02, 0.52, 0.17, 'cream', 32);
  disc(body, 0, 5.5, 2.14, 0.39, 0.13, 'pine', 32);
  disc(body, 0, 5.5, 2.23, 0.32, 0.07, 'butter', 32);
  for (let i = 0; i < 3; i++) {
    const cross = block(body, 0, 5.5, 2.3, 0.052, 0.67, 0.04, 'cream');
    cross.rotation.z = (i * Math.PI) / 3;
  }
  for (const side of [-1, 1]) {
    foldedStar(body, side * 0.81, 5.1, 2.1, 0.19);
    windowSet(body, side * 1.87, 1.48, 1.96, 1.04, 1.6);
  }
  // The sign is mounted proud of the wall on two small gilt pins.
  block(body, 0, 3.72, 2.07, 3.53, 0.68, 0.2, 'cream');
  block(body, 0, 3.72, 2.19, 3.38, 0.52, 0.06, 'pine');
  label(body, signs[lang][0], 0, 3.72, 2.24, 2.84, 0.48);
  for (let s of [-1, 1]) disc(body, s * 1.6, 3.72, 2.24, 0.052, 0.035, 'gold', 12);
  arch(body, 0, 0.37, 2.0, 1.59, 2.75, 0.14, 'cream');
  arch(body, 0, 0.41, 2.16, 1.38, 2.57, 0.12, 'pine');
  for (let j = -3; j <= 3; j++) block(body, j * 0.16, 1.35, 2.29, 0.018, 1.74, 0.017, 'spruce');
  block(body, 0, 0.88, 2.3, 1.03, 0.76, 0.06, 'spruce');
  block(body, 0, 0.88, 2.34, 0.84, 0.58, 0.04, 'pine');
  block(body, 0, 1.5, 2.32, 0.48, 0.1, 0.07, 'gold');
  wreath(body, 0, 2.23, 2.36, 0.26);
  disc(body, 0.48, 1.34, 2.34, 0.08, 0.07, 'gold', 12);
  awning(body);
  for (let side of [-1, 1]) porchLamp(body, side * 0.99, 2.13, 2.05);
  for (let k = 0; k < 3; k++) {
    const depth = 0.28 * (3 - k),
      z = 2.2 + depth * 0.5;
    block(body, 0, 0.055 + k * 0.115, z, 2.25 - k * 0.09, 0.11, depth, 'brown');
    block(body, 0, 0.121 + k * 0.115, z, 2.27 - k * 0.09, 0.03, depth + 0.035, 'shade');
  }
  // A suspended pleated ornament hangs below the projecting roof on its eastern verge.
  rod(body, [2.83, 4.65, 2.32], [2.83, 3.9, 2.32], 0.027, 0.027, 'gold');
  foldedStar(body, 2.83, 3.69, 2.34, 0.3);
  return body;
}

function parcel(parent, x, y, z, width, height, depth, tint, ribbon, angle) {
  const g = group(parent, x, y, z);
  g.rotation.y = angle;
  block(g, 0, height * 0.48, 0, width, height * 0.96, depth, tint);
  block(g, 0, height - 0.03, 0, width * 1.035, 0.105, depth * 1.035, tint);
  block(g, 0, height * 0.51, 0, width * 0.17, height * 1.02, depth * 1.048, ribbon);
  block(g, 0, height * 0.51, 0, width * 1.047, height * 1.026, depth * 0.16, ribbon);
  const bowWidth = width * 0.22,
    zTop = height + 0.05;
  for (let s of [-1, 1]) {
    const loop = new T.Shape();
    loop.moveTo(0, 0);
    loop.quadraticCurveTo(s * bowWidth * 0.7, bowWidth * 1.55, s * bowWidth * 1.28, bowWidth * 0.93);
    loop.quadraticCurveTo(s * bowWidth * 1.85, bowWidth * 0.17, 0, 0);
    const hole = new T.Path();
    hole.moveTo(s * 0.045, 0.033);
    hole.quadraticCurveTo(s * bowWidth * 0.7, bowWidth * 1.1, s * bowWidth * 1.08, bowWidth * 0.71);
    hole.quadraticCurveTo(s * bowWidth * 1.3, bowWidth * 0.27, s * 0.045, 0.033);
    loop.holes.push(hole);
    cut(g, loop, 0.055, ribbon, 0, zTop, 0);
  }
  return g;
}
function mailbox(parent, x, z, lang) {
  const g = group(parent, x, 0, z);
  g.rotation.y = 0.17;
  block(g, 0, 0.09, 0, 0.56, 0.18, 0.53, 'snow');
  for (let k = 0; k < 5; k++) block(g, 0, 0.2 + k * 0.2, 0, 0.21, 0.2, 0.22, k % 2 ? 'red' : 'cream');
  arch(g, 0, 0.97, -0.41, 0.87, 0.85, 0.91, 'red');
  arch(g, 0, 0.98, 0.49, 0.76, 0.72, 0.065, 'cream');
  arch(g, 0, 1.03, 0.56, 0.65, 0.59, 0.02, 'berry');
  block(g, 0, 1.37, 0.6, 0.44, 0.078, 0.03, 'dark');
  label(g, signs[lang][4], 0, 1.18, 0.615, 0.51, 0.18);
  rod(g, [0.5, 1.47, -0.13], [0.5, 2.11, -0.13], 0.055, 0.06, 'cream');
  block(g, 0.51, 2.04, 0.018, 0.075, 0.19, 0.34, 'gold');
  return g;
}
function wayfinding(parent, x, z, lang, props) {
  const g = group(parent, x, 0, z);
  g.rotation.y = -0.26;
  block(g, 0, 1.16, 0, 0.17, 2.34, 0.18, 'brown');
  block(g, 0, 0.07, 0, 0.48, 0.14, 0.5, 'shade');
  [
    [1.97, 1, signs[lang][2], 'help'],
    [1.53, -1, signs[lang][3], 'install'],
  ].forEach(([y, s, word, kind]) => {
    const board = group(g, 0, y, 0.16);
    const width = word.length > 6 ? 1.66 : 1.4;
    polygon(
      board,
      [
        [(-s * width) / 2, -0.18],
        [s * (width / 2 - 0.12), -0.18],
        [s * (width / 2 + 0.1), 0],
        [s * (width / 2 - 0.12), 0.18],
        [(-s * width) / 2, 0.18],
      ],
      0.095,
      'pine',
    );
    label(board, word, 0, 0, 0.104, width * 0.8, 0.32);
    props.push({ object: board, kind });
  });
}
function book(parent, x, z) {
  const g = group(parent, x, 0, z);
  g.rotation.y = -0.22;
  block(g, 0, 0.1, 0, 0.81, 0.2, 0.63, 'pine');
  block(g, 0, 0.58, 0, 0.2, 0.92, 0.21, 'brown');
  const pages = group(g, 0, 1.14, 0);
  pages.rotation.x = -0.91;
  for (const side of [-1, 1]) {
    const leaf = group(pages, 0, 0, 0);
    leaf.rotation.y = side * 0.17;
    block(leaf, side * 0.38, 0, 0, 0.77, 0.87, 0.085, 'red');
    block(leaf, side * 0.37, 0, 0.055, 0.7, 0.79, 0.055, 'shade');
    block(leaf, side * 0.37, 0.015, 0.09, 0.68, 0.74, 0.035, 'cream');
    for (let j = 0; j < 3; j++)
      block(leaf, side * 0.37, -0.015 - j * 0.095, 0.114, 0.4 - j * 0.06, 0.027, 0.017, 'brown');
    if (side < 0) foldedStar(leaf, side * 0.37, 0.19, 0.115, 0.105, 'gold');
    else block(leaf, side * 0.37, 0.175, 0.118, 0.28, 0.06, 0.012, 'red');
  }
  return g;
}
function welcomeGate(parent, x, z, lang) {
  const g = group(parent, x, 0, z);
  g.rotation.y = 0.3;
  for (let s of [-1, 1]) {
    block(g, s * 0.94, 0.075, 0, 0.44, 0.15, 0.46, 'snow');
    for (let i = 0; i < 9; i++)
      block(g, s * 0.94, 0.245 + i * 0.26, 0, 0.2, 0.26, 0.21, i % 2 ? 'red' : 'cream');
    block(g, s * 0.94, 2.41, 0, 0.37, 0.13, 0.37, 'pine');
    const cap = mesh(g, new T.ConeGeometry(0.235, 0.26, 4), 'snow', s * 0.94, 2.6, 0);
    cap.rotation.y = 0.7854;
  }
  const shape = new T.Shape();
  shape.moveTo(-1.13, 1.9);
  shape.quadraticCurveTo(0, 2.24, 1.13, 1.9);
  shape.lineTo(1.13, 2.36);
  shape.quadraticCurveTo(0, 2.73, -1.13, 2.36);
  shape.closePath();
  cut(g, shape, 0.19, 'pine', 0, 0, -0.065);
  label(g, signs[lang][1], 0, 2.31, 0.14, 1.83, 0.34);
  for (let i = -2; i <= 2; i++) {
    const top = 2.04 - i * i * 0.025,
      dx = i * 0.29;
    rod(g, [dx, top, 0.12], [dx, top - 0.12, 0.12], 0.02, 0.02, 'cream');
    foldedStar(g, dx, top - 0.18, 0.13, i === 0 ? 0.106 : 0.079);
  }
  return g;
}
export function buildWelcome(language = 'en') {
  const lang = Object.hasOwn(signs, language) ? language : 'en';
  const root = new T.Group();
  root.name = 'North Pole post office';
  const props = [];
  const house = lodge(root, lang);
  props.push({ object: house, kind: 'story' });
  const mail = mailbox(root, -3.62, 2.09, lang);
  props.push({ object: mail, kind: 'install' });
  const gate = welcomeGate(root, -4.77, -0.22, lang);
  props.push({ object: gate, kind: 'rules' });
  props.push({ object: book(root, 3.7, 2.34), kind: 'story' });
  wayfinding(root, 5.08, 0.62, lang, props);
  const gifts = group(root, 2.7, 0, 2.53);
  parcel(gifts, -0.19, 0, 0.08, 0.95, 0.58, 0.79, 'berry', 'cream', -0.21);
  parcel(gifts, -0.24, 0.6, 0.03, 0.64, 0.47, 0.55, 'pine', 'gold', 0.05);
  parcel(gifts, 0.48, 0, 0.32, 0.62, 0.52, 0.57, 'pink', 'berry', 0.24);
  props.push({ object: gifts, kind: 'present' });
  return { root, props };
}
