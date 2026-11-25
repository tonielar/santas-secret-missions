/* Cardboard stock and construction details shared by the mission buildings.
   Local +z is the street-facing side. Each sheet has physical edge thickness. */
import * as T from './vendor/three.module.min.js';

export const ivory = '#fff0cb',
  snow = '#fff7e9',
  gold = '#e3a953';
const materials = new Map();
const cube = new T.BoxGeometry(1, 1, 1);
const sphere = new T.SphereGeometry(1, 10, 7);
const profiles = new Map();

function stock(color) {
  if (!materials.has(color))
    materials.set(
      color,
      new T.MeshStandardMaterial({
        color,
        roughness: 1,
        metalness: 0,
        flatShading: true,
      }),
    );
  return materials.get(color);
}

export function group(parent, x = 0, y = 0, z = 0) {
  const result = new T.Group();
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}

function cut(parent, geometry, color, x, y, z) {
  const mesh = new T.Mesh(geometry, stock(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function box(p, x, y, z, w, h, d, color) {
  const m = cut(p, cube, color, x, y, z);
  m.scale.set(w, h, d);
  return m;
}

export function ball(p, x, y, z, w, h, d, color) {
  const m = cut(p, sphere, color, x, y, z);
  m.scale.set(w, h, d);
  return m;
}

export function tube(p, x, y, z, top, bottom, h, color, sides = 8) {
  const id = [top, bottom, h, sides].join('/');
  if (!profiles.has(id)) profiles.set(id, new T.CylinderGeometry(top, bottom, h, sides));
  return cut(p, profiles.get(id), color, x, y, z);
}

// A die-cut sheet with its front face at z, mirrored correctly from the inside.
export function sheet(p, x, y, z, points, color, depth = 0.08) {
  const outline = new T.Shape();
  points.forEach(([a, b], i) => (i ? outline.lineTo(a, b) : outline.moveTo(a, b)));
  outline.closePath();
  const geo = new T.ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 6 });
  return cut(p, geo, color, x, y, z - depth);
}

export function rod(p, ax, ay, az, bx, by, bz, width, color, thickness = width) {
  const delta = new T.Vector3(bx - ax, by - ay, bz - az);
  const m = box(p, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, width, delta.length(), thickness, color);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return m;
}

export function disk(p, x, y, z, radius, color, sides = 16, depth = 0.09) {
  const c = tube(p, x, y, z, radius, radius, depth, color, sides);
  c.rotation.x = Math.PI / 2;
  return c;
}

export function star(p, x, y, z, r, color = gold, inner = 0.46) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      b = i % 2 ? r * inner : r;
    return [Math.cos(a) * b, Math.sin(a) * b];
  });
  return sheet(p, x, y, z, points, color, 0.1);
}

function archOutline(w, h) {
  const radius = w / 2,
    shoulder = h - radius;
  const points = [
    [-radius, 0],
    [radius, 0],
  ];
  for (let i = 0; i <= 10; i++) {
    const a = (i * Math.PI) / 10;
    points.push([radius * Math.cos(a), shoulder + radius * Math.sin(a)]);
  }
  return points;
}
export function arch(p, x, y, z, w, h, color, depth = 0.1) {
  return sheet(p, x, y, z, archOutline(w, h), color, depth);
}

export function windowPane(p, x, y, z, w, h, trim, rounded = false) {
  const outer = rounded
    ? arch
    : (o, px, py, pz, ww, hh, c) => box(o, px, py + hh / 2, pz - 0.05, ww, hh, 0.1, c);
  outer(p, x, y, z, w, h, trim);
  outer(p, x, y + 0.08, z + 0.035, w - 0.16, h - 0.16, '#6e483d');
  outer(p, x, y + 0.15, z + 0.07, w - 0.3, h - 0.3, '#ffd889');
  box(p, x, y + h * 0.53, z + 0.095, 0.06, h - 0.3, 0.06, trim);
  box(p, x, y + h * 0.48, z + 0.105, w - 0.25, 0.07, 0.06, trim);
  box(p, x, y + 0.04, z + 0.08, w + 0.15, 0.12, 0.24, trim);
}

export function roundWindow(p, x, y, z, r, trim) {
  disk(p, x, y, z, r, trim);
  disk(p, x, y, z + 0.06, r * 0.79, '#875f49');
  disk(p, x, y, z + 0.11, r * 0.69, '#ffe1a0');
  box(p, x, y, z + 0.18, r * 1.45, 0.06, 0.055, trim);
  box(p, x, y, z + 0.18, 0.06, r * 1.45, 0.055, trim);
}

// Fold a gabled roof from two sheets. The snow sits above the colored eave.
export function gable(
  p,
  { x = 0, z = 0, y = 0, w, d, wall, rise, body, roof, cap = snow, trim = ivory, over = 0.24 },
) {
  const front = z + d / 2,
    eave = y + wall;
  sheet(
    p,
    x,
    y,
    front,
    [
      [-w / 2, 0],
      [w / 2, 0],
      [w / 2, wall],
      [0, wall + rise],
      [-w / 2, wall],
    ],
    body,
    d,
  );
  const half = w / 2 + over,
    length = Math.hypot(half, rise + (over * rise) / (w / 2));
  const angle = Math.atan2(rise, w / 2),
    bottom = eave - (over * rise) / (w / 2);
  for (const side of [-1, 1]) {
    const fold = group(p, x + (side * half) / 2, (bottom + eave + rise) / 2, z);
    fold.rotation.z = -side * angle;
    box(fold, 0, 0, 0, length + 0.08, 0.18, d + over * 2, roof);
    box(fold, side * 0.025, 0.111, 0, length + 0.04, 0.09, d + over * 2 + 0.065, cap);
    // A row of irregular snow tabs folds over the hem.
    const count = Math.ceil(d / 0.62);
    for (let j = 0; j < count; j++) {
      const t = (j + 0.5) / count;
      box(
        fold,
        side * (length / 2 - 0.025),
        0.045,
        (t - 0.5) * (d + over * 2),
        0.14,
        0.13 + (j % 3) * 0.045,
        0.28,
        cap,
      );
    }
  }
  for (const side of [-1, 1]) {
    rod(
      p,
      x + side * half,
      bottom,
      front + over + 0.04,
      x,
      eave + rise,
      front + over + 0.04,
      0.15,
      trim,
      0.13,
    );
  }
  return { front, eave, peak: eave + rise };
}

export function chimney(p, x, base, z, height, color) {
  box(p, x, base + height / 2, z, 0.64, height, 0.7, color);
  box(p, x, base + height, z, 0.79, 0.24, 0.86, color);
  box(p, x, base + height + 0.15, z, 0.85, 0.11, 0.92, snow);
  box(p, x, base + height + 0.22, z, 0.47, 0.04, 0.52, '#4d4245');
  for (let i = 0; i < 3; i++)
    box(p, x + (i % 2 ? 0.14 : -0.16), base + 0.2 + i * 0.42, z + 0.36, 0.26, 0.08, 0.035, '#e3b6a3');
}

export function stripedPole(p, x, y, z, h, color, r = 0.14) {
  const bands = Math.max(3, Math.floor(h / (r * 1.85)));
  tube(p, x, y + h / 2, z, r, r, h, ivory, 10);
  for (let i = 1; i < bands; i += 2)
    tube(p, x, y + ((i + 0.5) * h) / bands, z, r * 1.035, r * 1.035, h / bands, color, 10);
}

export function present(p, x, z, size, paper = '#ac343b', ribbon = gold) {
  const g = group(p, x, 0, z);
  box(g, 0, size / 2, 0, size, size, size * 0.87, paper);
  box(g, 0, size / 2, 0, size * 0.17, size + 0.035, size * 0.89, ribbon);
  box(g, 0, size + 0.025, 0, size + 0.025, 0.06, size * 0.16, ribbon);
  for (const side of [-1, 1]) {
    const loop = sheet(
      g,
      side * 0.13 * size,
      size + 0.06,
      0,
      [
        [0, 0],
        [side * 0.14 * size, 0.23 * size],
        [side * 0.25 * size, 0.16 * size],
        [side * 0.21 * size, 0.02 * size],
      ],
      ribbon,
    );
    loop.rotation.y = 0.12 * side;
  }
  return g;
}

export function pennants(p, x1, x2, y, z, colors) {
  const n = 7,
    points = Array.from({ length: n + 1 }, (_, i) => [
      x1 + ((x2 - x1) * i) / n,
      y - 0.36 * Math.sin((Math.PI * i) / n),
    ]);
  for (let i = 0; i < n; i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[i + 1],
      middle = (ax + bx) / 2;
    rod(p, ax, ay, z, bx, by, z, 0.04, '#b88456');
    sheet(
      p,
      middle,
      (ay + by) / 2,
      z + 0.035,
      [
        [-0.15, 0],
        [0.15, 0],
        [0.015, -0.3],
      ],
      colors[i % colors.length],
      0.035,
    );
  }
}

export function awning(p, x, y, z, w, depth, stripes) {
  const n = Math.max(5, Math.round(w / 0.41)),
    g = group(p, x, y, z),
    step = w / n;
  g.rotation.x = 0.19;
  for (let i = 0; i < n; i++) {
    const xx = -w / 2 + (i + 0.5) * step;
    box(g, xx, 0, depth / 2, step + 0.008, 0.09, depth, stripes[i % stripes.length]);
    sheet(
      g,
      xx,
      -0.025,
      depth + 0.045,
      [
        [-step / 2, 0],
        [step / 2, 0],
        [step / 2, -0.16],
        [0, -0.24],
        [-step / 2, -0.16],
      ],
      stripes[i % stripes.length],
      0.07,
    );
  }
  for (const side of [-1, 1])
    rod(
      p,
      x + w * 0.44 * side,
      y - 0.65,
      z,
      x + w * 0.44 * side,
      y - 0.23,
      z + depth * 0.92,
      0.07,
      '#684334',
    );
}

export function lantern(p, x, y, z) {
  const g = group(p, x, y, z);
  rod(g, 0, 0, 0, 0, 0.38, 0, 0.055, '#715748');
  tube(g, 0, -0.04, 0, 0.06, 0.28, 0.19, '#725b50', 4).rotation.y = Math.PI / 4;
  tube(g, 0, -0.37, 0, 0.22, 0.17, 0.48, '#ffd989', 4).rotation.y = Math.PI / 4;
  tube(g, 0, -0.66, 0, 0.21, 0.07, 0.14, '#896848', 4).rotation.y = Math.PI / 4;
  return g;
}

export function reindeer(p, x, z, scale = 1) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(scale);
  // Folded card profile with separate near and far legs.
  const body = [
    [-0.9, 1.05],
    [-0.62, 1.55],
    [0.18, 1.44],
    [0.53, 1.98],
    [0.83, 2.02],
    [1.06, 1.85],
    [0.83, 1.68],
    [0.58, 1.67],
    [0.42, 0.96],
    [-0.48, 0.9],
  ];
  sheet(g, 0, 0, 0.18, body, '#ad7044', 0.38);
  for (const side of [-1, 1])
    for (const leg of [-1, 1]) {
      const xx = side * 0.5,
        zz = leg * 0.19,
        forward = side * 0.13 * leg;
      rod(g, xx, 1.14, zz, xx + forward, 0.1, zz, 0.13, leg === 1 ? '#97603c' : '#7a503b');
      box(g, xx + forward + 0.03, 0.08, zz, 0.2, 0.13, 0.15, '#5a4037');
    }
  ball(g, 0.69, 1.91, 0.2, 0.048, 0.055, 0.035, '#3b3335');
  ball(g, 1.025, 1.84, 0.12, 0.084, 0.07, 0.1, '#ae3a36');
  for (const zz of [-0.1, 0.13]) {
    rod(g, 0.57, 2, zz, 0.34, 2.54, zz, 0.075, '#75533d');
    rod(g, 0.43, 2.35, zz, 0.18, 2.4, zz, 0.07, '#75533d');
    rod(g, 0.36, 2.48, zz, 0.46, 2.71, zz, 0.06, '#75533d');
  }
  sheet(
    g,
    0.56,
    1.96,
    0.15,
    [
      [0, 0],
      [-0.23, 0.23],
      [-0.25, 0.02],
    ],
    '#bd8757',
  );
  return g;
}

export function snowman(p, x, z, scale = 1) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(scale);
  ball(g, 0, 0.62, 0, 0.76, 0.69, 0.69, snow);
  ball(g, 0, 1.38, 0.03, 0.56, 0.53, 0.52, '#fff9ee');
  ball(g, 0, 2.02, 0.08, 0.43, 0.43, 0.42, snow);
  for (const side of [-1, 1]) {
    ball(g, side * 0.155, 2.1, 0.46, 0.045, 0.052, 0.038, '#353d42');
    const arm = group(g, side * 0.41, 1.46, 0);
    rod(arm, 0, 0, 0, side * 0.5, 0.26, 0.04, 0.07, '#695648');
    rod(arm, side * 0.37, 0.17, 0.04, side * 0.41, 0.44, 0.06, 0.06, '#695648');
    if (side > 0) arm.name = 'waving-arm';
  }
  const nose = tube(g, 0, 1.99, 0.55, 0, 0.095, 0.35, '#dc8947');
  nose.rotation.x = Math.PI / 2;
  tube(g, 0, 1.73, 0.04, 0.42, 0.45, 0.15, '#a4393f', 12);
  box(g, 0.23, 1.46, 0.45, 0.18, 0.54, 0.075, '#b1464b').rotation.z = 0.22;
  for (const y of [1.25, 1.45]) ball(g, 0, y, 0.54, 0.048, 0.05, 0.035, '#3b4144');
  tube(g, 0, 2.4, 0.08, 0.53, 0.53, 0.09, '#40565a', 12);
  tube(g, 0, 2.61, 0.08, 0.3, 0.34, 0.39, '#3d555b', 10);
  tube(g, 0, 2.49, 0.08, 0.336, 0.346, 0.105, '#bd5858', 10);
  return g;
}

export function ice(p, x, z, h, r, color) {
  const g = group(p, x, 0, z);
  tube(g, 0, h * 0.34, 0, r, r * 0.85, h * 0.68, color, 5);
  tube(g, 0, h * 0.84, 0, 0.015, r, h * 0.34, color, 5);
  return g;
}
