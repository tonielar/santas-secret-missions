import * as T from './vendor/three.module.min.js';

export const COUNT = 13,
  STEP = (2 * Math.PI) / COUNT,
  RADIUS = 29;
export const wrap = (n) => ((n % COUNT) + COUNT) % COUNT;
export const position = (a, radius, y = 0) => new T.Vector3(Math.sin(a) * radius, y, -Math.cos(a) * radius);

// Paint, mountboard, landscape cutouts and foliage are mixed for each little set.
const palettes = [
  //                sky       board      hills      trees      crown     relief
  ['#335f68', '#89ad96', '#779d8f', '#527b61', 'pine', 'banks'], // Welcome
  ['#a26643', '#dba772', '#c28864', '#8f7954', 'round', 'hills'], // Gingerbread
  ['#386751', '#83aa70', '#66906a', '#3d755c', 'pine', 'peaks'], // Forest
  ['#4d87a0', '#a2d2d4', '#81acbf', '#87abbb', 'bare', 'peaks'], // Frostglass
  ['#835257', '#dfc3b6', '#a67972', '#8f715b', 'round', 'hills'],
  ['#396664', '#b4c9b4', '#73978a', '#597b5c', 'pine', 'banks'],
  ['#725054', '#d4bdae', '#a88578', '#767658', 'round', 'hills'],
  ['#263e60', '#abbdd1', '#68818e', '#4f8081', 'pine', 'peaks'],
  ['#598398', '#c1d9db', '#92b3b8', '#95ac9a', 'bare', 'hills'],
  ['#3a6157', '#acc2af', '#789581', '#426652', 'pine', 'peaks'],
  ['#a46877', '#ead0ce', '#c09a9f', '#ba8c93', 'round', 'hills'],
  ['#4c426c', '#c9c2d3', '#8c84a3', '#67738a', 'bare', 'banks'],
  ['#724353', '#d6bfb0', '#a88086', '#798263', 'pine', 'peaks'],
];
export const skies = palettes.map((p) => p[0]);
const stock = new Map();
function ink(hex) {
  if (!stock.has(hex)) stock.set(hex, new T.Color(hex));
  return stock.get(hex);
}
const blend = (a, b, t) => ink(a).clone().lerp(ink(b), t);
function random(seed) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// A single draw produces many disconnected pieces of card. Duplicated boundary
// vertices give neighbouring triangles a crisp, separately painted edge.
class Sheets {
  constructor() {
    this.pts = [];
    this.inks = [];
  }
  triangle(a, b, c, paint, pb = paint, pc = paint) {
    for (const [point, tone] of [
      [a, paint],
      [b, pb],
      [c, pc],
    ]) {
      this.pts.push(...point);
      this.inks.push(tone.r, tone.g, tone.b);
    }
  }
  quad(a, b, c, d, paint, pb = paint, pc = paint, pd = paint) {
    this.triangle(a, b, c, paint, pb, pc);
    this.triangle(a, c, d, paint, pc, pd);
  }
  geometry() {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(this.pts, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(this.inks, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }
  place(parent, material, label) {
    const mesh = new T.Mesh(this.geometry(), material);
    mesh.name = label;
    parent.add(mesh);
    return mesh;
  }
}

const polar = (a, r, y) => [Math.sin(a) * r, y, -Math.cos(a) * r];
const polarPath = (a) => 22.78 + 0.14 * Math.sin(a * 8) + 0.18 * Math.sin(a * 12);
const reliefs = {
  banks: [0.2, 0.3, 0.46, 0.47, 0.32, 0.29, 0.42, 0.55, 0.56, 0.44, 0.35, 0.31, 0.38],
  hills: [0.31, 0.46, 0.69, 0.82, 0.77, 0.53, 0.39, 0.37, 0.46, 0.67, 0.73, 0.65, 0.42],
  peaks: [0.24, 0.36, 0.63, 1, 0.65, 0.48, 0.55, 0.85, 0.62, 0.36, 0.4, 0.53, 0.27],
};
function addDiorama(terrain, sky, index) {
  const [paint, card, hills, , , silhouette] = palettes[index];
  const start = (index - 0.5) * STEP,
    end = start + STEP;
  const face = ink(card),
    faceLight = blend(card, '#fbf1ce', 0.14),
    back = blend(card, hills, 0.43);
  const kraft = ink('#b78861'),
    fibre = ink('#f2d9ac'),
    umber = ink('#865e45');
  const darkSky = blend(paint, '#14292e', 0.45),
    lowSky = blend(paint, '#d8d5b6', 0.16);
  const top = -0.074,
    bottom = -0.46,
    gap = 0.0016;
  const edgeRadius = (a) => 17.6 + 0.79 * Math.sin(a * 12 + 0.5) + 0.48 * Math.cos(a * 19);
  const layers = reliefs[silhouette],
    segments = layers.length - 1;
  // The tapered foreground and the stepped main plot share exactly the same
  // sector seam. A fine cross-section shows coloured liners and kraft stock.
  for (let i = 0; i < segments; i++) {
    const u = i / segments,
      v = (i + 1) / segments;
    const a = start + gap + (STEP - 2 * gap) * u,
      b = start + gap + (STEP - 2 * gap) * v;
    const ra = edgeRadius(a),
      rb = edgeRadius(b);
    const inner = blend(card, '#c8aa82', 0.29);
    terrain.quad(
      polar(a, 0.025, bottom),
      polar(a, ra, bottom),
      polar(b, rb, bottom),
      polar(b, 0.025, bottom),
      inner,
    );
    // Three visible narrow laminations follow the uneven hand-cut front edge.
    for (const [hi, lo, dye] of [
      [top, top - 0.065, faceLight],
      [top - 0.065, top - 0.15, kraft],
      [top - 0.15, top - 0.21, fibre],
      [top - 0.21, bottom, umber],
    ]) {
      terrain.quad(polar(a, ra, lo), polar(b, rb, lo), polar(b, rb, hi), polar(a, ra, hi), dye);
    }
    terrain.quad(polar(a, ra, top), polar(a, 35, top), polar(b, 35, top), polar(b, rb, top), face);
    terrain.quad(
      polar(a, 35, top),
      polar(a, 55, 0.22),
      polar(b, 55, 0.22),
      polar(b, 35, top),
      back,
      back,
      faceLight,
      face,
    );
    // The walking ribbon crosses the joins on top, like one length of cut paper.
    const pa = polarPath(a),
      pb = polarPath(b),
      pathPaint = blend(card, '#f5deaf', 0.74);
    for (const [innerWidth, outerWidth, y, color] of [
      [-1.47, 1.47, -0.022, kraft],
      [-1.39, 1.39, 0.012, pathPaint],
    ]) {
      // The walking path uses the full angle here, bridging the cardstock gap.
      const aa = start + STEP * u,
        bb = start + STEP * v;
      terrain.quad(
        polar(aa, pa + innerWidth, y),
        polar(aa, pa + outerWidth, y),
        polar(bb, pb + outerWidth, y),
        polar(bb, pb + innerWidth, y),
        color,
      );
    }
    // Background sheets are individually dyed all the way up to the ceiling.
    const aa = start + STEP * u,
      bb = start + STEP * v;
    sky.quad(
      polar(aa, 58, -0.5),
      polar(bb, 58, -0.5),
      polar(bb, 58, 28),
      polar(aa, 58, 28),
      lowSky,
      lowSky,
      darkSky,
      darkSky,
    );
    for (let row = 0; row < 2; row++) {
      const dist = 51 - row * 5;
      const sample = (j) => {
        const h = layers[row ? segments - j : j];
        return (row ? 2.1 : 3.8) + (row ? 2.65 : 4.15) * h;
      };
      const ya = sample(i),
        yb = sample(i + 1);
      const hInk = blend(hills, row ? '#52705e' : '#e5ddc2', row ? 0.15 : 0.25);
      sky.quad(polar(a, dist, -0.6), polar(b, dist, -0.6), polar(b, dist, yb), polar(a, dist, ya), hInk);
      const rim = blend(hills, '#f9e9c2', 0.45);
      sky.quad(
        polar(a, dist, ya),
        polar(b, dist, yb),
        polar(b, dist + 0.08, yb + 0.075),
        polar(a, dist + 0.08, ya + 0.075),
        rim,
      );
    }
  }
  // The vertical cuts are below the plot. The only bridge across is the path.
  for (const a of [start + gap, end - gap]) {
    for (const [hi, lo, dye] of [
      [top, top - 0.09, faceLight],
      [top - 0.09, top - 0.18, kraft],
      [top - 0.18, top - 0.26, fibre],
      [top - 0.26, bottom, umber],
    ]) {
      terrain.quad(
        polar(a, edgeRadius(a), lo),
        polar(a, 53, lo),
        polar(a, 53, hi),
        polar(a, edgeRadius(a), hi),
        dye,
      );
    }
    // A tiny bevel along the radial knife cut catches light at grazing angles.
    const innerA = a + (a < start + STEP / 2 ? 0.0018 : -0.0018);
    terrain.quad(
      polar(a, 0.16, bottom + 0.002),
      polar(a, edgeRadius(a), bottom + 0.002),
      polar(innerA, edgeRadius(innerA), bottom + 0.003),
      polar(innerA, 0.16, bottom + 0.003),
      kraft,
    );
    terrain.quad(
      polar(a, edgeRadius(a), top + 0.002),
      polar(a, 52, top + 0.002),
      polar(innerA, 52, top + 0.003),
      polar(innerA, edgeRadius(innerA), top + 0.003),
      faceLight,
    );
  }
}

function foliage(style) {
  const cut = new Sheets();
  const dark = ink('#83a796'),
    pale = ink('#c7d2ae'),
    light = ink('#e0dec2'),
    snow = ink('#f5ebd0');
  const bark = ink('#ac9878');
  // The scored center stands proud of the two cut sides. A second, narrower
  // leaf slots in at an angle, so a tree can be circled without disappearing.
  const outline =
    style === 'round'
      ? [
          [0, 0.27],
          [0.16, 0.27],
          [0.31, 0.42],
          [0.35, 0.63],
          [0.26, 0.81],
          [0.13, 0.94],
          [0, 1],
        ]
      : [
          [0, 0.095],
          [0.32, 0.105],
          [0.19, 0.36],
          [0.26, 0.34],
          [0.12, 0.59],
          [0.18, 0.57],
          [0, 1],
        ];
  for (const [angle, size] of [
    [0, 1],
    [1.23, 0.64],
  ]) {
    const pt = (x, y, z) => [
      size * x * Math.cos(angle) + z * Math.sin(angle),
      y,
      -size * x * Math.sin(angle) + z * Math.cos(angle),
    ];
    cut.quad(pt(-0.029, 0, 0), pt(0.029, 0, 0), pt(0.022, 0.37, 0), pt(-0.023, 0.37, 0), bark);
    if (style === 'bare') {
      const twig = (x, y, u, v, w) =>
        cut.quad(pt(x - w, y, 0), pt(x + w, y, 0), pt(u + w * 0.37, v, 0), pt(u - w * 0.37, v, 0), light);
      twig(0, 0.15, 0.035, 1, 0.029);
      for (const sign of [-1, 1]) {
        twig(0.012, 0.32, sign * 0.27, 0.58, 0.028);
        twig(sign * 0.17, 0.5, sign * 0.14, 0.72, 0.016);
        twig(0.025, 0.55, sign * 0.18, 0.79, 0.023);
        twig(sign * 0.12, 0.73, sign * 0.12, 0.89, 0.012);
      }
      continue;
    }
    for (const sign of [-1, 1]) {
      for (let i = 1; i < outline.length; i++) {
        const [x0, y0] = outline[i - 1],
          [x1, y1] = outline[i];
        if (y0 === y1) continue;
        const p0 = pt(x0 * sign, y0, 0),
          p1 = pt(x1 * sign, y1, 0),
          v0 = pt(0, y0, 0.035),
          v1 = pt(0, y1, 0.035 * (1 - y1));
        cut.quad(p0, p1, v1, v0, sign < 0 ? dark : pale);
      }
      if (style === 'pine') cut.triangle(pt(0, 1, 0), pt(sign * 0.047, 0.884, 0), pt(0, 0.896, 0.005), snow);
      else
        cut.triangle(
          pt(0, 0.96, 0.005),
          pt(sign * 0.26, 0.81, 0.004),
          pt(0, 0.53, 0.037),
          sign < 0 ? pale : light,
        );
    }
  }
  return cut.geometry();
}

function growTrees(root) {
  const material = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, flatShading: true });
  const geometries = new Map(),
    hits = [],
    rng = random(884),
    dummy = new T.Object3D();
  palettes.forEach(([, , , crown, shape], index) => {
    if (!geometries.has(shape)) geometries.set(shape, foliage(shape));
    // Clusters leave open sight lines onto the paper joins and layered skyline.
    const placements = [
      [-5.7, -2.6, 4.9],
      [-4.9, -3.9, 3.1],
      [5.75, -2.2, 4.4],
      [6.3, 0.55, 2.65],
    ];
    const n = index === 2 || index === 9 ? 10 : shape === 'bare' ? 4 : 6;
    for (let i = 0; i < n; i++) placements.push([(rng() - 0.5) * 14, -7 - rng() * 4, 1.4 + rng() * 3.4]);
    const trees = new T.InstancedMesh(geometries.get(shape), material, placements.length);
    trees.userData.kind = 'tree';
    trees.userData.stop = index;
    placements.forEach(([x, z, h], i) => {
      const a = index * STEP + Math.atan2(x, RADIUS - z),
        r = Math.hypot(x, RADIUS - z);
      dummy.position.copy(position(a, r, 0));
      dummy.rotation.set(0, -a + (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.075);
      dummy.scale.set(h * (0.91 + rng() * 0.19), h, h * 0.93);
      dummy.updateMatrix();
      trees.setMatrixAt(i, dummy.matrix);
      trees.setColorAt(i, blend(crown, i % 3 ? '#bcbea2' : '#f1ddb7', rng() * 0.18));
    });
    trees.computeBoundingSphere();
    root.add(trees);
    hits.push(trees);
  });
  return hits;
}

function addMobiles(root) {
  // Fixed stars, their threads and tiny punched pinpricks are each drawn as a
  // batch. They are printed or hung behind the individual cardboard sets.
  const mobiles = new Sheets(),
    cords = [],
    dots = [],
    rng = random(891);
  let ownerMoon;
  for (let n = 0; n < COUNT; n++) {
    const angle = n * STEP,
      local = (x, y, z = 0) => [
        Math.sin(angle) * (46 - z) + x * Math.cos(angle),
        y,
        -Math.cos(angle) * (46 - z) + x * Math.sin(angle),
      ];
    for (const [x, y, r] of [
      [-7.2, 10.4, 0.5],
      [4.4, 10.1, 0.39],
    ]) {
      const tip = (k) => {
        const a = Math.PI / 2 + (k * Math.PI) / 5,
          length = k % 2 ? r * 0.36 : r;
        return local(x + length * Math.cos(a), y + length * Math.sin(a));
      };
      for (let k = 0; k < 10; k++)
        mobiles.triangle(local(x, y, 0.09), tip(k), tip(k + 1), ink(k % 2 ? '#dfb268' : '#ffe5a3'));
      cords.push(...local(x, y + r), ...local(x, 25));
    }
    for (let k = 0; k < 32; k++) dots.push(...local((rng() - 0.5) * 19, 5.3 + rng() * 16));
    if ([0, 7, 11].includes(n)) {
      const moon = new T.Shape();
      moon.moveTo(0.48, 1.12);
      moon.bezierCurveTo(-1.36, 1.53, -1.57, -0.91, -0.03, -1.1);
      moon.bezierCurveTo(0.65, -1.24, 1.09, -0.83, 1.29, -0.39);
      moon.bezierCurveTo(-0.02, -0.91, -0.54, 0.57, 0.48, 1.12);
      const obj = new T.Mesh(
        new T.ExtrudeGeometry(moon, { depth: 0.08, bevelEnabled: false, curveSegments: 8 }),
        new T.MeshBasicMaterial({ color: '#ffe3a2' }),
      );
      obj.position.set(...local(-2.9, 10.42, 0.1));
      obj.rotation.order = 'YXZ';
      obj.rotation.y = -angle;
      obj.rotation.z = -0.24;
      root.add(obj);
      if (n === 0) ownerMoon = obj;
      cords.push(...local(-2.9, 11.51), ...local(-2.9, 25));
    }
  }
  const basic = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide });
  mobiles.place(root, basic, 'Folded hanging stars');
  const attr = (pts) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    return g;
  };
  root.add(
    new T.LineSegments(
      attr(cords),
      new T.LineBasicMaterial({ color: '#bda783', transparent: true, opacity: 0.55 }),
    ),
  );
  root.add(
    new T.Points(
      attr(dots),
      new T.PointsMaterial({ color: '#f1dfac', size: 0.073, transparent: true, opacity: 0.85 }),
    ),
  );
  return ownerMoon;
}

export function createLandscape(scene) {
  const root = new T.Group(),
    terrain = new Sheets(),
    sky = new Sheets();
  scene.add(root);
  for (let i = 0; i < COUNT; i++) addDiorama(terrain, sky, i);
  // Both faces of the radial seams and all static reliefs share a draw apiece.
  const ground = terrain.place(
    root,
    new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }),
    'Thirteen cut-card sectors',
  );
  ground.receiveShadow = true;
  sky.place(
    root,
    new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide }),
    'Thirteen painted backdrops',
  );
  const ownerMoon = addMobiles(root);
  return { treeHits: growTrees(root), lights: [], ownerMoon };
}
