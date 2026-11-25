import * as T from './vendor/three.module.min.js';

export const COUNT = 13,
  STEP = (2 * Math.PI) / COUNT,
  RADIUS = 29;
export const wrap = (n) => ((n % COUNT) + COUNT) % COUNT;
export const position = (a, r, y = 0) => new T.Vector3(Math.sin(a) * r, y, -Math.cos(a) * r);
export const skies = [
  '#294b59',
  '#875a5b',
  '#335f50',
  '#598397',
  '#835257',
  '#396664',
  '#725054',
  '#263e60',
  '#598398',
  '#3a6157',
  '#a46877',
  '#4c426c',
  '#724353',
];
const forestStock = [
  '#35665c',
  '#927558',
  '#2f6653',
  '#9fbfc2',
  '#8f715b',
  '#597b5c',
  '#767658',
  '#4f8081',
  '#95ac9a',
  '#426652',
  '#ba8c93',
  '#67738a',
  '#798263',
];
const grounds = [
  '#c3d4c7',
  '#e7c6a6',
  '#a1bcaa',
  '#c6dce0',
  '#dfc3b6',
  '#b4c9b4',
  '#d4bdae',
  '#abbdd1',
  '#c1d9db',
  '#acc2af',
  '#ead0ce',
  '#c9c2d3',
  '#d6bfb0',
];
function tint(a, palette) {
  const n = wrap(a / STEP),
    lower = Math.floor(n),
    v = T.MathUtils.smoothstep(n - lower, 0.28, 0.72);
  return new T.Color(palette[lower]).lerp(new T.Color(palette[(lower + 1) % COUNT]), v);
}
function random(seed) {
  let x = seed;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
function strip(root, layers, colorAt, lit = true, segments = 312) {
  const pts = [],
    cols = [],
    indices = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    layers.forEach((fn, j) => {
      const [r, y] = fn(a, i);
      pts.push(...position(a, r, y).toArray());
      cols.push(...colorAt(a, j, i).toArray());
    });
    if (i > 0)
      for (let j = 0; j < layers.length - 1; j++) {
        const k = i * layers.length + j,
          l = k - layers.length;
        indices.push(l, k, k + 1, l, k + 1, l + 1);
      }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = lit
    ? new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: T.DoubleSide })
    : new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide });
  const mesh = new T.Mesh(g, m);
  mesh.receiveShadow = lit;
  root.add(mesh);
  return mesh;
}
function makePine() {
  // Each bough has a central fold, two coloured faces and a narrow cut edge.
  const xyz = [],
    colors = [],
    inds = [];
  const face = (a, b, c, ink) => {
    const k = xyz.length / 3;
    xyz.push(...a, ...b, ...c);
    const col = new T.Color(ink);
    for (let n = 0; n < 3; n++) colors.push(col.r, col.g, col.b);
    inds.push(k, k + 1, k + 2);
  };
  for (let side = 0; side < 3; side++) {
    const a = (side * Math.PI) / 3;
    for (const sign of [-1, 1]) {
      const profile = [
        [0, 0.08],
        [0.32, 0.1],
        [0.22, 0.25],
        [0.3, 0.23],
        [0.17, 0.44],
        [0.245, 0.4],
        [0.11, 0.61],
        [0.18, 0.57],
        [0.07, 0.79],
        [0.11, 0.75],
        [0, 1],
      ];
      const at = (x, y, d) => [Math.cos(a) * x + Math.sin(a) * d, y, -Math.sin(a) * x + Math.cos(a) * d];
      for (let j = 1; j < profile.length; j++) {
        const u = profile[j - 1],
          v = profile[j],
          shade =
            sign < 0 ? ['#80ada1', '#70a495', '#74aa98'][side] : ['#b0c7a9', '#aac6ad', '#abd1b7'][side];
        const tip = at(0, Math.min(0.88, (u[1] + v[1]) / 2 + 0.024), 0.035);
        face(at(u[0] * sign, u[1], 0), at(v[0] * sign, v[1], 0), tip, j >= 9 ? '#f4f1d7' : shade);
        if (j > 1)
          face(
            at(u[0] * sign, u[1], 0),
            tip,
            at(0, Math.min(0.88, (profile[j - 2][1] + u[1]) / 2 + 0.024), 0.035),
            shade,
          );
        if ([2, 4, 6, 8, 10].includes(j)) {
          const lerp = 0.8;
          face(
            at(v[0] * sign, v[1], 0.002),
            at((u[0] * (1 - lerp) + v[0] * lerp) * sign, u[1] * (1 - lerp) + v[1] * lerp, 0.003),
            at(0, v[1] - 0.018, 0.039),
            '#e0e1c5',
          );
        }
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(xyz, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(inds);
  g.computeVertexNormals();
  return g;
}
function starGeometry(points = 5) {
  const positions = [],
    colors = [];
  for (let n = 0; n < points * 2; n++) {
    const v = (k) => {
      const a = Math.PI / 2 + (k * Math.PI) / points,
        r = k % 2 ? 0.34 : 1;
      return [Math.cos(a) * r, Math.sin(a) * r, 0];
    };
    positions.push(0, 0, 0.26, ...v(n), ...v(n + 1));
    const c = new T.Color(n % 2 ? '#ddab56' : '#ffe5a2');
    for (let j = 0; j < 3; j++) colors.push(c.r, c.g, c.b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}
export function createLandscape(scene) {
  const root = new T.Group();
  scene.add(root);
  const hill = (a) => 0.2 * Math.sin(a * 13) + 0.11 * Math.sin(a * 21),
    path = (a) => 0.28 * Math.sin(a * 12) + 0.16 * Math.sin(a * 8);
  strip(
    root,
    [
      () => [0.1, -0.12],
      (a) => [22.4 + path(a), -0.1],
      () => [35, -0.1],
      (a) => [44, 1 + hill(a)],
      () => [63, 1.6],
    ],
    (a, j) => tint(a, grounds).multiplyScalar(j < 2 ? 0.93 : 1),
  );
  strip(
    root,
    [
      (a) => [21.5 + path(a), -0.045],
      (a) => [21.65 + path(a), 0.018],
      (a) => [24.3 + path(a), 0.018],
      (a) => [24.46 + path(a), -0.045],
    ],
    (a, j) => tint(a, grounds).lerp(new T.Color(j === 0 || j === 3 ? '#a49986' : '#d8bea3'), 0.7),
  );
  strip(
    root,
    [
      (a) => [18.2 + 0.87 * Math.sin(a * 13 + 0.63), -0.065],
      (a) => [18.36 + 0.87 * Math.sin(a * 13 + 0.63), 0.003],
      (a) => [20.2 + 0.7 * Math.sin(a * 13 + 0.95), 0.005],
    ],
    (a, j) => tint(a, grounds).lerp(new T.Color(j === 0 ? '#a6bcae' : '#f6f0df'), j === 0 ? 0.26 : 0.59),
  );
  strip(
    root,
    [
      (a) => [31.3 + 0.47 * Math.sin(a * 21), -0.063],
      (a) => [32 + 0.4 * Math.sin(a * 21), 0.04],
      (a) => [34.25 + 0.8 * Math.cos(a * 13), 0.08],
    ],
    (a, j) => tint(a, grounds).lerp(new T.Color('#f5f2df'), j === 0 ? 0.28 : 0.8),
  );
  // Staggered bands read as layers cut from different sheets of mountboard.
  for (let row = 0; row < 3; row++) {
    const dist = 57 - row * 5,
      base = 7.8 - row * 1.58;
    const crest = (a) =>
      base +
      1.04 * Math.sin(11 * a + row) +
      0.86 * Math.cos(19 * a + row) +
      0.68 * Math.cos(28 * a - row * 0.7);
    strip(
      root,
      [() => [dist, -1], (a) => [dist, crest(a) - 0.16], (a) => [dist + 0.14, crest(a)]],
      (a, j) =>
        tint(a, skies)
          .lerp(new T.Color(['#779d9e', '#678f91', '#53817f'][row]), 0.55)
          .multiplyScalar(j === 2 ? 1.11 : 1),
      false,
      260,
    );
  }
  const fir = makePine(),
    rng = random(884),
    treeHits = [];
  const forest = new T.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
    side: T.DoubleSide,
  });
  for (let sector = 0; sector < COUNT; sector++) {
    const instances = [];
    for (let n = 0; n < 22; n++) {
      const dist = 36 + rng() * 11,
        a = (sector + (rng() - 0.5) * 1.12) * STEP;
      instances.push([a, dist, 1.7 + rng() * 4.7, '#799b93', 0.6]);
    }
    for (const [dx, dz, h] of [
      [-6, -1, 5.4],
      [-7.2, 2, 4.1],
      [6.05, -1.6, 5.2],
      [7.4, 0.2, 6.0],
      [-5.2, -4.2, 5],
      [5.4, -4.2, 4.4],
      [-6.7, 4.4, 2.6],
      [6.6, 4.1, 2.2],
    ]) {
      const a = sector * STEP + Math.atan2(dx, RADIUS - dz),
        r = Math.hypot(dx, RADIUS - dz);
      instances.push([
        a,
        r,
        h * (0.84 + rng() * 0.22),
        ['#4c7d75', '#5d8c7b', '#39685d', '#739789'][Math.floor(rng() * 4)],
        0,
      ]);
    }
    const trees = new T.InstancedMesh(fir, forest, instances.length),
      dummy = new T.Object3D();
    trees.castShadow = true;
    trees.receiveShadow = true;
    trees.userData.kind = 'tree';
    trees.userData.stop = sector;
    instances.forEach(([a, r, h, color, y], i) => {
      dummy.position.copy(position(a, r, y));
      dummy.rotation.y = rng() * Math.PI;
      dummy.scale.set(h * (0.8 + rng() * 0.27), h, h);
      dummy.updateMatrix();
      trees.setMatrixAt(i, dummy.matrix);
      trees.setColorAt(i, new T.Color(color).lerp(new T.Color(forestStock[sector]), 0.52));
    });
    trees.computeBoundingSphere();
    root.add(trees);
    treeHits.push(trees);
  }
  const skyRoot = new T.Group();
  root.add(skyRoot);
  const points = [],
    lights = [];
  const sg = starGeometry(),
    starMat = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide });
  const cordMat = new T.LineBasicMaterial({ color: '#baa47c', transparent: true, opacity: 0.5 });
  for (let i = 0; i < COUNT; i++) {
    const cradle = new T.Group();
    cradle.position.copy(position(i * STEP, 46));
    cradle.rotation.y = -i * STEP;
    skyRoot.add(cradle);
    for (const [x, y, s] of [
      [-8.1, 10, 0.52],
      [4.6, 9.8, 0.48],
      [10.6, 11.3, 0.39],
    ]) {
      const star = new T.Mesh(sg, starMat);
      star.position.set(x, y, 0);
      star.scale.setScalar(s);
      cradle.add(star);
      lights.push(star);
      const line = new T.BufferGeometry().setFromPoints([
        new T.Vector3(x, y + s, 0),
        new T.Vector3(x, 25, 0),
      ]);
      cradle.add(new T.Line(line, cordMat));
    }
    for (let n = 0; n < 65; n++) {
      points.push(...position((i + rng() - 0.5) * STEP, 48, 5 + rng() * 17).toArray());
    }
    if ([0, 7, 11].includes(i)) {
      const moon = new T.Shape();
      moon.moveTo(0.48, 1.12);
      moon.bezierCurveTo(-1.36, 1.53, -1.57, -0.91, -0.03, -1.1);
      moon.bezierCurveTo(0.65, -1.24, 1.09, -0.83, 1.29, -0.39);
      moon.bezierCurveTo(-0.02, -0.91, -0.54, 0.57, 0.48, 1.12);
      const obj = new T.Mesh(
        new T.ExtrudeGeometry(moon, { depth: 0.17, bevelEnabled: false, curveSegments: 18 }),
        new T.MeshBasicMaterial({ color: '#ffe3a2' }),
      );
      obj.position.set(-2.9, 10.42, 0.1);
      obj.scale.setScalar(1.13);
      obj.rotation.z = -0.24;
      cradle.add(obj);
      cradle.add(
        new T.Line(
          new T.BufferGeometry().setFromPoints([
            new T.Vector3(-2.9, 11.51, 0),
            new T.Vector3(-2.9, 26, 0),
          ]),
          cordMat,
        ),
      );
    }
  }
  const stars = new T.BufferGeometry();
  stars.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  skyRoot.add(
    new T.Points(
      stars,
      new T.PointsMaterial({
        color: '#f2dfb3',
        size: 0.071,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
      }),
    ),
  );
  return { treeHits, lights };
}
