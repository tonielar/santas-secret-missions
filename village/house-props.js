/* Cardboard stock and construction details shared by the mission buildings.
   Local +z is the street-facing side. Each sheet has physical edge thickness. */
import * as T from './vendor/three.module.min.js';

export const ivory = '#fff0cb',
  snow = '#fff7e9',
  gold = '#e3a953';
const materials = new Map();
const cube = new T.BoxGeometry(1, 1, 1);
const sphere = new T.SphereGeometry(1, 7, 4);
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

export function disk(p, x, y, z, radius, color, sides = 12, depth = 0.055) {
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
  // Two die-cut gables join slim side walls. Their edge remains visible at
  // the corners and a tiny scored tab peeks out beneath each eave.
  const outline = [
    [-w / 2, 0],
    [w / 2, 0],
    [w / 2, wall],
    [0.035, wall + rise],
    [-w / 2, wall],
  ];
  sheet(p, x, y, front, outline, body, 0.065);
  sheet(p, x, y, z - d / 2 + 0.065, outline, body, 0.065);
  for (const side of [-1, 1]) {
    box(p, x + side * (w / 2 - 0.04), y + wall / 2, z, 0.064, wall, d - 0.08, body);
    const tab = group(p, x + side * (w / 2 - 0.06), eave - 0.19, front + 0.02);
    sheet(
      tab,
      0,
      0,
      0,
      [
        [0, -0.21],
        [side * -0.21, -0.09],
        [side * -0.22, 0.16],
        [0, 0.23],
      ],
      trim,
      0.025,
    );
  }
  const half = w / 2 + over,
    length = Math.hypot(half, rise + (over * rise) / (w / 2));
  const angle = Math.atan2(rise, w / 2),
    bottom = eave - (over * rise) / (w / 2);
  for (const side of [-1, 1]) {
    const fold = group(p, x + (side * half) / 2, (bottom + eave + rise) / 2, z);
    fold.rotation.z = -side * angle;
    box(fold, 0, 0, 0, length + 0.065, 0.074, d + over * 2, roof);
    // A single snow sheet with a cut scalloped hem leaves the eave peeking out.
    const D = d + over * 2 + 0.025,
      n = Math.max(4, Math.round(D / 0.61));
    const paper = group(fold, 0, 0.066, 0);
    paper.rotation.x = -Math.PI / 2;
    const hem = [
      [-side * (length / 2 + 0.02), -D / 2],
      [-side * (length / 2 + 0.02), D / 2],
    ];
    for (let i = 0; i <= n; i++) {
      const zz = D / 2 - (i * D) / n;
      const reach = side * (length / 2 - 0.14 - 0.045 * Math.cos(i * 2.3));
      hem.push([reach, zz]);
      if (i < n) hem.push([reach + side * 0.11, zz - D / (2 * n)]);
    }
    sheet(paper, 0, 0, 0, hem, cap, 0.05);
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
      0.092,
      trim,
      0.08,
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
  box(g, 0, size / 2, 0, size, size, size * 0.53, paper);
  box(g, 0, size / 2, 0, size * 0.17, size + 0.035, size * 0.55, ribbon);
  box(g, 0, size + 0.025, 0, size + 0.025, 0.06, size * 0.16, ribbon);
  sheet(
    g,
    0,
    0,
    size * 0.279,
    [
      [-size * 0.48, size * 0.97],
      [-size * 0.24, size * 0.79],
      [0, size * 0.96],
    ],
    '#d9ad79',
    0.025,
  );
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
  sheet(g, 0, 0, 0.074, body, '#ad7044', 0.085);
  sheet(
    g,
    0,
    0,
    0.084,
    [
      [-0.62, 1.55],
      [0.17, 1.42],
      [-0.47, 0.96],
    ],
    '#c48c5a',
    0.018,
  );
  for (const side of [-1, 1])
    for (const leg of [-1, 1]) {
      const xx = side * 0.5,
        zz = leg * 0.077,
        forward = side * 0.13 * leg;
      rod(g, xx, 1.14, zz, xx + forward, 0.1, zz, 0.13, leg === 1 ? '#97603c' : '#7a503b');
      box(g, xx + forward + 0.03, 0.08, zz, 0.2, 0.13, 0.15, '#5a4037');
    }
  ball(g, 0.69, 1.91, 0.106, 0.048, 0.055, 0.035, '#3b3335');
  ball(g, 1.025, 1.84, 0.08, 0.084, 0.07, 0.1, '#ae3a36');
  for (const zz of [-0.04, 0.07]) {
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
  // Three folded paper rosettes overlap like the circles of a greeting card.
  const circle = (y, z, r, dye) => {
    const half = new T.Shape();
    half.moveTo(0, -r);
    for (let j = 0; j <= 8; j++) {
      const a = -Math.PI / 2 + (j * Math.PI) / 8;
      half.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    half.lineTo(0, -r);
    const halfSheet = new T.ExtrudeGeometry(half, { depth: 0.035, bevelEnabled: false });
    const left = cut(g, halfSheet, dye, 0, y, z);
    left.rotation.y = 0.16;
    const right = cut(g, halfSheet, '#d8e3da', 0, y, z);
    right.rotation.y = Math.PI - 0.16;
  };
  circle(0.64, 0.015, 0.67, snow);
  circle(1.38, 0.11, 0.51, '#f7f2e1');
  circle(2.03, 0.19, 0.414, snow);
  for (const side of [-1, 1]) {
    disk(g, side * 0.14, 2.09, 0.23, 0.038, '#35413d', 8, 0.02);
    const arm = group(g, side * 0.39, 1.46, 0.05);
    rod(arm, 0, 0, 0, side * 0.5, 0.26, 0.025, 0.065, '#695648', 0.025);
    rod(arm, side * 0.37, 0.17, 0.025, side * 0.41, 0.44, 0.035, 0.055, '#695648', 0.025);
    if (side > 0) arm.name = 'waving-arm';
  }
  sheet(
    g,
    0,
    1.98,
    0.245,
    [
      [-0.046, -0.058],
      [0.24, 0.01],
      [-0.046, 0.07],
    ],
    '#db8b4b',
    0.055,
  );
  sheet(
    g,
    0,
    1.72,
    0.192,
    [
      [-0.41, 0.075],
      [0.39, 0.075],
      [0.34, -0.07],
      [-0.37, -0.09],
    ],
    '#a94745',
    0.033,
  );
  sheet(
    g,
    0,
    1.7,
    0.21,
    [
      [0.14, 0],
      [0.31, 0.02],
      [0.43, -0.42],
      [0.29, -0.48],
    ],
    '#b14e48',
    0.036,
  );
  for (const y of [1.25, 1.45]) disk(g, 0, y, 0.176, 0.047, '#3b4144', 8, 0.025);
  const hat = group(g, 0, 2.38, 0.22);
  hat.rotation.z = -0.095;
  sheet(
    hat,
    0,
    0,
    0,
    [
      [-0.48, -0.05],
      [0.48, -0.05],
      [0.48, 0.04],
      [0.28, 0.06],
      [0.245, 0.43],
      [-0.26, 0.43],
      [-0.29, 0.06],
      [-0.48, 0.05],
    ],
    '#40565a',
    0.08,
  );
  box(hat, 0, 0.12, 0.017, 0.56, 0.088, 0.04, '#ba585a');
  return g;
}

export function ice(p, x, z, h, r, color) {
  const g = group(p, x, 0, z);
  tube(g, 0, h * 0.34, 0, r, r * 0.85, h * 0.68, color, 5);
  tube(g, 0, h * 0.84, 0, 0.015, r, h * 0.34, color, 5);
  return g;
}
