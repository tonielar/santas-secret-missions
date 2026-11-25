import * as T from './vendor/three.module.min.js';
import {
  arch,
  awning,
  ball,
  box,
  chimney,
  disk,
  gable,
  gold,
  group,
  ice,
  ivory,
  lantern,
  pennants,
  present,
  reindeer,
  rod,
  roundWindow,
  sheet,
  snow,
  snowman,
  star,
  stripedPole,
  tube,
  windowPane,
} from './house-props.js';

// Each builder constructs a different architectural silhouette. The common door
// fitting is attached last so the calendar can animate it independently.
const wood = '#885a43',
  red = '#ad3845',
  darkGreen = '#39584b';

function entry(p, x, z, color, trim, width = 1.48, height = 2.32, base = 0.12) {
  const inn = '#503a3b';
  arch(p, x, base, z + 0.16, width + 0.56, height + 0.43, trim, 0.22);
  arch(p, x, base + 0.03, z + 0.23, width + 0.3, height + 0.22, inn, 0.11);
  const hinge = group(p, x - width / 2, base + 0.065, z + 0.28);
  arch(hinge, width / 2, 0, 0.045, width, height, color, 0.11);
  for (const side of [-1, 1])
    box(hinge, width / 2 + side * width * 0.27, height * 0.3, 0.075, 0.044, height * 0.48, 0.035, trim);
  disk(hinge, width / 2, height * 0.72, 0.09, width * 0.185, trim, 12);
  disk(hinge, width / 2, height * 0.72, 0.15, width * 0.132, '#ffd78b', 12);
  box(hinge, width / 2, height * 0.72, 0.2, width * 0.27, 0.045, 0.035, trim);
  const handle = group(hinge, width * 0.84, height * 0.45, 0.125);
  disk(handle, 0, 0, 0.025, 0.11, '#6c493b');
  box(handle, -0.055, 0, 0.1, 0.23, 0.085, 0.12, gold);
  const lock = group(hinge, width * 0.51, height * 0.45, 0.17);
  // The cut-out center of the shackle stays open, including when it rattles.
  const shackle = Array.from({ length: 9 }, (_, i) => [
    0.198 * Math.cos((i * Math.PI) / 8),
    0.13 + 0.198 * Math.sin((i * Math.PI) / 8),
  ]);
  for (let i = 0; i < shackle.length - 1; i++) {
    const [a, b] = shackle[i],
      [c, d] = shackle[i + 1];
    rod(lock, a, b, 0.035, c, d, 0.035, 0.075, ivory);
  }
  for (const side of [-1, 1]) box(lock, side * 0.198, 0.08, 0.035, 0.075, 0.14, 0.075, ivory);
  box(lock, 0, -0.1, 0.04, 0.56, 0.44, 0.17, '#bd873f');
  box(lock, 0, -0.08, 0.14, 0.48, 0.34, 0.1, '#f4bd53');
  disk(lock, 0, -0.045, 0.203, 0.06, '#714c38', 8, 0.02);
  sheet(
    lock,
    0,
    -0.08,
    0.21,
    [
      [-0.02, 0.02],
      [0.02, 0.02],
      [0.048, -0.092],
      [-0.048, -0.092],
    ],
    '#714c38',
    0.01,
  );
  box(p, x, base / 2, z + 0.47, width + 0.75, Math.max(base, 0.1), 0.91, '#ba977a');
  box(p, x, base + 0.015, z + 0.58, width + 0.72, 0.055, 0.69, snow);
  return { door: hinge, handle, lock, doorPoint: new T.Vector3(x, base + height * 0.55, z + 0.46) };
}

function cookie(p, x, z, scale) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(scale);
  const c = '#a95d38';
  sheet(
    g,
    0,
    0.7,
    0.07,
    [
      [-0.22, 0.34],
      [-0.53, 0.5],
      [-0.65, 0.4],
      [-0.59, 0.22],
      [-0.29, 0.08],
      [-0.22, -0.1],
      [-0.47, -0.5],
      [-0.44, -0.66],
      [-0.29, -0.69],
      [0, -0.39],
      [0.29, -0.69],
      [0.46, -0.63],
      [0.44, -0.48],
      [0.22, -0.1],
      [0.28, 0.08],
      [0.58, 0.22],
      [0.65, 0.4],
      [0.54, 0.5],
      [0.21, 0.34],
    ],
    c,
    0.18,
  );
  disk(g, 0, 1.38, 0, 0.35, c, 14, 0.22);
  for (const side of [-1, 1]) disk(g, 0.115 * side, 1.43, 0.13, 0.036, ivory, 8, 0.04);
  rod(g, -0.09, 1.29, 0.13, 0, 1.25, 0.13, 0.035, ivory);
  rod(g, 0, 1.25, 0.13, 0.09, 1.29, 0.13, 0.035, ivory);
  for (const y of [0.75, 0.93]) disk(g, 0, y, 0.12, 0.062, ivory, 8, 0.04);
  return g;
}

function candyCane(p, x, z, h) {
  const g = group(p, x, 0, z);
  stripedPole(g, 0, 0, 0, h, red, 0.135);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI - (i * Math.PI) / 9,
      b = a - Math.PI / 9;
    rod(
      g,
      0.38 + 0.38 * Math.cos(a),
      h + 0.39 * Math.sin(a),
      0,
      0.38 + 0.38 * Math.cos(b),
      h + 0.39 * Math.sin(b),
      0,
      0.25,
      i % 2 ? red : ivory,
      0.25,
    );
  }
  box(g, 0.76, h - 0.08, 0, 0.25, 0.19, 0.25, red);
  return g;
}

function gingerbread(p, props) {
  const biscuit = '#b8734d',
    frosting = '#fff0cb',
    jam = '#ad4643';
  const r = gable(p, {
    x: -0.24,
    w: 4.66,
    d: 3.4,
    wall: 2.94,
    rise: 2.15,
    body: biscuit,
    roof: '#aa5452',
    cap: '#ffe8c3',
    trim: frosting,
  });
  gable(p, {
    x: 2.1,
    z: -0.34,
    w: 1.9,
    d: 2.35,
    wall: 2.01,
    rise: 1.02,
    body: '#b87957',
    roof: '#ad5552',
    cap: '#fff1d1',
    trim: frosting,
  });
  chimney(p, 1.15, 3.57, -0.38, 1.61, '#a35c45');
  roundWindow(p, -0.24, 3.68, r.front + 0.09, 0.51, frosting);
  for (const x of [-1.85, 1.41]) windowPane(p, x, 0.89, r.front + 0.1, 0.86, 1.37, frosting, true);
  windowPane(p, 2.3, 0.68, 0.94, 0.84, 0.95, frosting);
  for (const side of [-1, 1]) {
    const x = -0.24 + side * 2.26;
    for (let j = 0; j < 8; j++)
      disk(p, x, 0.23 + j * 0.38, r.front + 0.07, 0.112, j % 2 ? frosting : '#eab09a', 9);
    // Gumdrops sit on the piped gable, slightly proud of the snowy edge.
    for (let j = 1; j <= 5; j++) {
      const t = j / 6;
      ball(
        p,
        -0.24 + side * 2.53 * t,
        5.17 - 2.33 * t,
        r.front + 0.22,
        0.13,
        0.14,
        0.125,
        [jam, '#82a388', '#e4ab59'][j % 3],
      );
    }
  }
  for (const [x, z, h] of [
    [-2.88, 1.85, 1.93],
    [2.88, 1.79, 1.55],
  ])
    candyCane(p, x, z, h).rotation.z = x > 0 ? -0.075 : 0.08;
  props.push({ object: cookie(p, -2.8, 2.86, 0.88), kind: 'present' });
  props.push({ object: present(p, 2.72, 2.42, 0.66, '#90a18a', jam), kind: 'present' });
  return { x: -0.24, z: r.front, roofY: 5.1, doorColor: '#944040', trim: frosting, starY: 4.63 };
}

function alpine(p, props) {
  const beam = '#674939',
    evergreen = '#386353',
    pine = '#6c8b72',
    rye = '#daa96c';
  // The roof descends nearly to the plinth, leaving one long triangular facade.
  const front = 1.76;
  sheet(
    p,
    0,
    0.13,
    front,
    [
      [-3, 0],
      [3, 0],
      [0.13, 6.2],
    ],
    '#8b6850',
    3.6,
  );
  for (const side of [-1, 1]) {
    const x = side * 3.07;
    rod(p, x, 0.19, -0.06, 0.13, 6.45, -0.06, 0.28, evergreen, 4.28);
    rod(p, x + 0.055 * side, 0.23, -0.06, 0.13 + 0.05 * side, 6.49, -0.06, 0.13, snow, 4.36);
    rod(p, x, 0.19, front + 0.45, 0.13, 6.45, front + 0.45, 0.15, rye, 0.14);
    // Alternating courses show the folds of the shingled paper roof.
    for (let j = 0; j < 7; j++) {
      const t = (j + 0.5) / 7,
        xx = x + (0.13 - x) * t,
        yy = 0.25 + 6.19 * t;
      for (let k = 0; k < 4; k++) {
        const zz = -1.6 + k * 0.94;
        const shingle = box(
          p,
          xx + 0.12 * side,
          yy,
          zz,
          0.12,
          0.67,
          0.87,
          (j + k) % 3 === 0 ? '#e4ebdb' : j % 2 ? pine : '#698671',
        );
        shingle.rotation.z = side * 0.44;
      }
    }
  }
  for (let j = 0; j < 7; j++) {
    const y = 0.4 + j * 0.56,
      w = 5.8 * (1 - y / 6.3);
    box(p, 0, y, front + 0.018, w, 0.06, 0.06, '#a57a58');
  }
  rod(p, -2.45, 1.06, front + 0.11, 0, 2.8, front + 0.11, 0.15, beam);
  rod(p, 2.45, 1.06, front + 0.11, 0, 2.8, front + 0.11, 0.15, beam);
  disk(p, 0.07, 4.15, front + 0.12, 0.59, rye, 8);
  roundWindow(p, 0.07, 4.15, front + 0.17, 0.47, beam);
  for (const x of [-1.75, 1.76]) windowPane(p, x, 0.7, front + 0.12, 0.57, 0.92, rye);
  gable(p, {
    x: -2.56,
    z: -0.41,
    w: 1.86,
    d: 2.4,
    wall: 1.61,
    rise: 0.78,
    body: '#6d795a',
    roof: evergreen,
    cap: snow,
    trim: rye,
  });
  chimney(p, -1.38, 3.9, -0.84, 1.49, '#8a735f');
  props.push({ object: reindeer(p, 3.2, 1.77, 0.73), kind: 'reindeer' });
  return { x: 0.04, z: front + 0.12, roofY: 6.49, doorColor: evergreen, trim: rye, starY: 5.31 };
}

function frost(p, props) {
  const wall = '#90c2cb',
    edge = '#e2f4ee',
    slate = '#567c94',
    iceBlue = '#8bb9cb';
  box(p, 0, 1.87, -0.08, 3.26, 3.74, 3.16, wall);
  sheet(
    p,
    0,
    3.74,
    1.5,
    [
      [-1.62, 0],
      [-1.23, 0.44],
      [-0.92, 0.31],
      [0, 1.64],
      [0.92, 0.31],
      [1.23, 0.44],
      [1.62, 0],
    ],
    '#b1d7da',
    3.16,
  );
  for (const side of [-1, 1]) {
    const x = 2.08 * side,
      y = side === 1 ? 3.95 : 3.21;
    tube(p, x, y / 2, -0.31, 1.12, 1.23, y, side === 1 ? '#92b7c8' : iceBlue, 6);
    tube(p, x, y - 0.12, -0.31, 1.25, 1.19, 0.34, edge, 6);
    tube(p, x, y + 1.04, -0.31, 0.04, 1.29, 2.12, side === 1 ? '#6b98ad' : '#85b2BD', 6);
    tube(p, x, y + 2.2, -0.31, 0, 0.095, 0.24, edge, 6);
    windowPane(p, x, 1.13, 0.79, 0.69, 1.58, edge, true);
    for (let j = 0; j < 3; j++)
      tube(p, x - 0.44 + j * 0.42, y - 0.34, 0.75, 0.087, 0.012, 0.47 + (j % 2) * 0.3, edge, 5);
    rod(p, side * 1.38, 0.3, 1.55, side * 1.38, 3.55, 1.55, 0.11, edge);
  }
  star(p, 0, 3.85, 1.6, 0.47, edge, 0.27);
  for (const side of [-1, 1]) {
    rod(p, side * 0.21, 3.8, 1.62, side * 0.58, 3.8, 1.62, 0.065, snow);
    rod(p, 0, 3.6, 1.62, 0, 4.28, 1.62, 0.065, snow);
    for (let j = 0; j < 3; j++) {
      const h = 0.75 + 0.49 * ((j + 1) % 3);
      const shard = ice(
        p,
        side * (2.52 + 0.48 * j),
        1.59 - 0.18 * j,
        h,
        0.25,
        ['#b1e0dd', '#85b9c8', '#bedcde'][j],
      );
      shard.rotation.z = side * (j - 1) * 0.24;
    }
  }
  const pond = tube(p, -2.83, 0.045, 2.33, 1.08, 1.1, 0.08, '#99cbd1', 10);
  pond.scale.z = 0.61;
  rod(p, -3.34, 0.1, 2.45, -2.85, 0.1, 2.38, 0.045, edge);
  props.push({ object: lantern(p, 0.96, 2.42, 1.89), kind: 'lantern' });
  return { x: 0, z: 1.5, roofY: 5.38, doorColor: slate, trim: edge, starY: 4.76 };
}

function bakery(p, props) {
  const brick = '#b26053',
    raspberry = '#a74950',
    clapboard = '#ecc495',
    cocoa = '#784d42';
  // A two-storey patisserie under a folded mansard roof. The projecting display
  // window and bread counter make the ground floor read as a shop.
  box(p, 0, 1.92, -0.1, 4.72, 3.84, 3.18, brick);
  box(p, 0, 3.78, -0.1, 4.98, 0.23, 3.48, clapboard);
  const mansard = tube(p, 0, 4.48, -0.1, 1.63, 2.16, 1.28, raspberry, 4);
  mansard.rotation.y = Math.PI / 4;
  mansard.scale.set(1.56, 1, 1.07);
  box(p, 0, 5.17, -0.1, 3.78, 0.13, 2.54, snow);
  for (const x of [-1.46, 0, 1.46]) {
    gable(p, {
      x,
      z: 1.07,
      y: 4.02,
      w: 0.89,
      d: 0.63,
      wall: 0.66,
      rise: 0.41,
      body: clapboard,
      roof: cocoa,
      trim: ivory,
      over: 0.09,
    });
    windowPane(p, x, 4.08, 1.43, 0.56, 0.58, raspberry, true);
  }
  for (const x of [-1.35, 0.25, 1.59]) {
    windowPane(p, x, 2.47, 1.56, 0.86, 1.05, clapboard, true);
  }
  for (const side of [-1, 1]) {
    for (let j = 0; j < 5; j++) box(p, side * 2.27, 0.32 + j * 0.65, 1.54, 0.28, 0.18, 0.16, clapboard);
  }
  box(p, 0.84, 1.27, 1.62, 2.43, 1.96, 0.24, clapboard);
  box(p, 0.84, 1.36, 1.79, 2.19, 1.42, 0.14, '#78504a');
  box(p, 0.84, 1.39, 1.88, 2.03, 1.25, 0.09, '#ffd992');
  box(p, 0.84, 1.36, 1.96, 0.08, 1.42, 0.12, clapboard);
  awning(p, 0.86, 2.35, 1.72, 2.74, 1, [raspberry, ivory]);
  // Baked loaves have diagonal paper scoring on their crowns.
  box(p, 0.84, 0.76, 2.14, 2.53, 0.15, 0.81, cocoa);
  for (let k = 0; k < 4; k++) {
    const xx = -0.02 + k * 0.55;
    ball(p, xx, 0.98, 2.18, 0.22, 0.18, 0.34, '#d79b54');
    for (let j = 0; j < 2; j++) {
      const score = box(p, xx, 1.14, 2.13 + j * 0.13, 0.18, 0.02, 0.026, '#f6d194');
      score.rotation.y = -0.5;
    }
  }
  chimney(p, -1.78, 4.74, -0.78, 1.47, brick);
  // A loose ribbon of vellum suggests steam drifting from the ovens.
  const steam = group(p, -1.78, 6.52, -0.78);
  sheet(
    steam,
    0,
    0,
    0,
    [
      [-0.07, 0],
      [-0.2, 0.25],
      [-0.08, 0.43],
      [0.29, 0.65],
      [0.37, 0.79],
      [0.24, 0.93],
      [-0.03, 1.02],
      [0.26, 0.99],
      [0.51, 0.85],
      [0.5, 0.66],
      [0.34, 0.51],
      [0.06, 0.37],
      [-0.06, 0.24],
      [0.02, 0.03],
    ],
    '#dfcbb9',
    0.035,
  );
  const sign = group(p, -2.6, 2.87, 1.38);
  rod(sign, 0.36, 0.42, 0, -0.51, 0.42, 0, 0.07, cocoa);
  rod(sign, -0.46, 0.42, 0, -0.46, 0.12, 0, 0.04, cocoa);
  disk(sign, -0.46, -0.19, 0, 0.35, clapboard);
  ball(sign, -0.46, -0.18, 0.08, 0.24, 0.12, 0.07, '#b87946');
  for (let i = 0; i < 2; i++)
    box(sign, -0.52 + i * 0.1, -0.15, 0.15, 0.036, 0.103, 0.017, ivory).rotation.z = -0.5;
  props.push({ object: lantern(p, -1.98, 2.48, 1.84), kind: 'lantern' });
  return {
    x: -1.47,
    z: 1.52,
    roofY: 5.55,
    width: 1.25,
    height: 2.17,
    doorColor: raspberry,
    trim: clapboard,
    starY: 3.47,
  };
}

function cog(p, x, y, z, r, main) {
  const g = group(p, x, y, z);
  disk(g, 0, 0, 0, r * 0.82, main, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    box(
      g,
      r * 0.82 * Math.sin(a),
      r * 0.82 * Math.cos(a),
      0,
      r * 0.29,
      r * 0.35,
      0.16,
      main,
    ).rotation.z = -a;
  }
  disk(g, 0, 0, 0.11, r * 0.43, ivory, 10);
  disk(g, 0, 0, 0.18, r * 0.19, '#93633c', 8);
  return g;
}

function locomotive(p, x, z, scale) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(scale);
  box(g, 0, 0.43, 0, 1.65, 0.18, 0.75, '#904144');
  const barrel = tube(g, 0.25, 0.77, 0, 0.3, 0.3, 0.92, '#387461', 10);
  barrel.rotation.z = Math.PI / 2;
  box(g, -0.56, 0.96, 0, 0.61, 0.98, 0.73, '#ce8748');
  box(g, -0.57, 1.51, 0, 0.85, 0.14, 0.93, '#4a6660');
  box(g, -0.56, 1.16, 0.38, 0.39, 0.36, 0.05, '#ffe2a0');
  tube(g, 0.46, 1.27, 0, 0.18, 0.13, 0.62, '#7a4d46', 8);
  tube(g, 0.46, 1.59, 0, 0.23, 0.19, 0.13, '#b8874c', 8);
  for (const side of [-1, 1]) {
    for (const xx of [-0.54, 0.08, 0.59]) {
      disk(g, xx, 0.29, side * 0.43, 0.25, '#6b4b46', 10);
      disk(g, xx, 0.29, side * 0.46, 0.135, '#deae64', 8);
    }
    box(g, 0.03, 0.29, side * 0.475, 1.16, 0.06, 0.04, '#b98f59');
  }
  return g;
}

function workshop(p, props) {
  const green = '#538273',
    deep = '#315f55',
    brass = '#ddab64',
    cedar = '#8c6450';
  // Two north-light workshop roofs meet an asymmetric square clock tower.
  const front = 1.46;
  box(p, -0.72, 1.49, -0.03, 4.45, 2.98, 2.98, green);
  for (let j = 0; j < 2; j++) {
    const x = -2.97 + j * 2.23;
    sheet(
      p,
      x,
      2.97,
      front,
      [
        [0, 0],
        [2.24, 0],
        [2.24, 1.18],
      ],
      j ? '#729080' : '#70887a',
      2.98,
    );
    rod(p, x - 0.11, 3.02, -0.03, x + 2.29, 4.26, -0.03, 0.24, deep, 3.31);
    rod(p, x - 0.12, 3.14, -0.03, x + 2.29, 4.38, -0.03, 0.103, snow, 3.38);
    sheet(
      p,
      x + 0.08,
      3.04,
      front + 0.05,
      [
        [0.51, 0],
        [1.88, 0],
        [1.88, 0.78],
      ],
      '#efd18b',
    );
  }
  for (const x of [-2.75, -1.26, 0.36, 1.16]) box(p, x, 1.5, front + 0.075, 0.14, 3, 0.15, brass);
  box(p, -0.72, 2.79, front + 0.1, 4.46, 0.18, 0.17, brass);
  windowPane(p, -2.04, 1, front + 0.1, 0.91, 1.2, brass);
  windowPane(p, 0.48, 1, front + 0.1, 0.94, 1.2, brass);
  const tx = 2.04;
  box(p, tx, 2.46, -0.24, 1.87, 4.92, 2.33, deep);
  box(p, tx, 4.79, -0.24, 2.03, 0.21, 2.49, brass);
  const roof = tube(p, tx, 5.57, -0.24, 0.07, 1.79, 1.44, '#a44d4b', 4);
  roof.rotation.y = Math.PI / 4;
  tube(p, tx, 6.37, -0.24, 0.04, 0.12, 0.3, brass);
  disk(p, tx, 3.94, 0.986, 0.66, brass);
  disk(p, tx, 3.94, 1.047, 0.51, ivory);
  for (let j = 0; j < 4; j++) {
    const a = (j * Math.PI) / 2;
    disk(p, tx + 0.39 * Math.sin(a), 3.94 + 0.39 * Math.cos(a), 1.106, 0.042, deep, 8, 0.03);
  }
  rod(p, tx, 3.94, 1.13, tx - 0.22, 4.15, 1.13, 0.056, deep);
  rod(p, tx, 3.94, 1.14, tx + 0.23, 4.03, 1.14, 0.06, deep);
  cog(p, tx, 2.19, 1.01, 0.51, brass);
  cog(p, tx + 0.51, 1.59, 1.04, 0.37, '#b97948');
  props.push({ object: locomotive(p, 2.27, 2.02, 1.04), kind: 'present' });
  props.push({ object: present(p, -2.94, 2.04, 0.56, '#ac454d', brass), kind: 'present' });
  return {
    x: -0.82,
    z: front + 0.07,
    roofY: 4.36,
    width: 1.2,
    height: 2.1,
    doorColor: '#a24b40',
    trim: brass,
    starY: 3.33,
  };
}

function marketStall(p, x, z, h, w, body, accents) {
  const g = group(p, x, 0, z);
  box(g, 0, 0.66, 0, w, 1.31, 1.38, body);
  for (let col = 0; col < 5; col++)
    box(g, -w * 0.4 + col * w * 0.2, 0.62, 0.707, 0.045, 1.11, 0.04, '#d6aa7b');
  box(g, 0, 1.31, 0.1, w + 0.23, 0.17, 1.65, '#d3a176');
  for (const xx of [-w * 0.46, w * 0.46])
    for (const zz of [-0.63, 0.63]) {
      box(g, xx, h / 2, zz, 0.13, h, 0.14, '#855940');
    }
  gable(g, {
    w: w + 0.13,
    d: 1.62,
    y: h - 0.15,
    wall: 0.22,
    rise: 0.66,
    body,
    roof: body,
    cap: accents[1],
    trim: accents[0],
    over: 0.12,
  });
  pennants(g, -w * 0.53, w * 0.53, h + 0.03, 0.94, accents);
  for (let j = 0; j < 3; j++) {
    const bowl = tube(g, (j - 1) * w * 0.29, 1.5, 0.35, 0.29, 0.22, 0.22, accents[1], 8);
    for (let k = 0; k < 3; k++)
      ball(
        g,
        bowl.position.x + (k - 1) * 0.13,
        1.65 + 0.05 * (k % 2),
        0.35,
        0.12,
        0.12,
        0.12,
        j % 2 ? red : gold,
      );
  }
  return g;
}

function market(p, props) {
  const claret = '#924653',
    wine = '#6f404c',
    linen = '#ffe4b6',
    plank = '#aa7753';
  // A hip-roofed lantern pavilion flanked by two independent street booths.
  tube(p, 0, 1.55, -0.45, 2.17, 2.26, 3.1, claret, 4).rotation.y = Math.PI / 4;
  box(p, 0, 2.94, -0.45, 3.52, 0.24, 3.52, linen);
  const roof = tube(p, 0, 4.14, -0.45, 0.56, 2.57, 2.34, wine, 4);
  roof.rotation.y = Math.PI / 4;
  tube(p, 0, 5.35, -0.45, 0.61, 0.67, 0.23, linen, 4).rotation.y = Math.PI / 4;
  tube(p, 0, 5.76, -0.45, 0.39, 0.4, 0.65, '#ffe4a1', 4).rotation.y = Math.PI / 4;
  tube(p, 0, 6.18, -0.45, 0.055, 0.66, 0.47, claret, 4).rotation.y = Math.PI / 4;
  for (const side of [-1, 1]) {
    box(p, side * 1.42, 1.49, 1.12, 0.16, 2.93, 0.17, linen);
    rod(p, side * 1.62, 3.15, 1.19, side * 0.39, 5.26, 0.01, 0.085, linen);
  }
  marketStall(p, -2.62, 0.65, 2.24, 1.84, wine, [claret, linen]).rotation.y = -0.12;
  marketStall(p, 2.66, 0.36, 2.48, 1.94, plank, [linen, '#bd7661']).rotation.y = 0.12;
  for (const side of [-1, 1]) {
    const g = group(p, side * 1.58, 0, 2.02);
    box(g, 0, 1.54, 0, 0.09, 3.06, 0.09, plank);
    box(g, -side * 0.13, 3.04, 0, 0.34, 0.08, 0.095, plank);
    props.push({ object: lantern(g, -side * 0.2, 2.86, 0.04), kind: 'lantern' });
  }
  pennants(p, -2.74, 2.66, 3.16, 2.05, [claret, linen, gold]);
  return {
    x: 0,
    z: 1.1,
    roofY: 5.35,
    width: 1.28,
    height: 2.23,
    doorColor: '#627166',
    trim: linen,
    starY: 3.44,
  };
}

function upturnedRoof(p, x, y, z, w, d, rise, body) {
  // The compound paper fold leaves the tips curled up at the eaves.
  const front = z + d / 2;
  sheet(
    p,
    x,
    y,
    front,
    [
      [-w / 2, 0.12],
      [-w * 0.42, 0],
      [0, rise],
      [w * 0.42, 0],
      [w / 2, 0.12],
      [w * 0.48, 0.33],
      [w * 0.39, 0.22],
      [0, rise + 0.28],
      [-w * 0.39, 0.22],
      [-w * 0.48, 0.33],
    ],
    body,
    d,
  );
  for (const side of [-1, 1]) {
    rod(
      p,
      x + side * w * 0.42,
      y + 0.2,
      front + 0.025,
      x,
      y + rise + 0.25,
      front + 0.025,
      0.092,
      '#d3ddc9',
    );
    rod(
      p,
      x + side * w * 0.42,
      y + 0.2,
      front + 0.025,
      x + side * w * 0.5,
      y + 0.34,
      front + 0.025,
      0.083,
      '#d3ddc9',
    );
  }
}

function aurora(p, props) {
  const spruce = '#385861',
    sea = '#7da9a0',
    bronze = '#c1a46f',
    plum = '#4c4f66';
  // Translucent-looking bands are opaque folded tissue, tucked behind the roof.
  for (let band = 0; band < 2; band++) {
    const crest = [
      [-3.57, 4.2],
      [-2.82, 4.9],
      [-1.89, 5.13],
      [-1.03, 5.09],
      [-0.31, 5.39],
      [0.61, 5.94],
      [1.36, 6.13],
      [2.3, 5.98],
      [3.23, 5.62],
      [3.8, 5.52],
    ];
    for (let i = 0; i < crest.length - 1; i++) {
      const [ax, ay] = crest[i],
        [bx, by] = crest[i + 1],
        z = -2.81 - band * 0.31;
      const h0 = 0.14 + 0.24 * Math.sin((Math.PI * i) / (crest.length - 1)),
        h1 = 0.14 + 0.24 * Math.sin((Math.PI * (i + 1)) / (crest.length - 1));
      sheet(
        p,
        0,
        band * 0.38,
        z,
        [
          [ax, ay],
          [bx, by],
          [bx, by + h1],
          [ax, ay + h0],
        ],
        band ? ['#86aa9c', '#94b4a2'][i % 2] : ['#92bdac', '#aacaba'][i % 2],
        0.045,
      );
    }
  }
  box(p, 0, 1.45, -0.12, 4, 2.88, 3.05, spruce);
  gable(p, {
    w: 3.12,
    d: 2.6,
    z: 0.12,
    y: 2.68,
    wall: 0.62,
    rise: 1.27,
    body: '#64847f',
    roof: spruce,
    cap: '#c9dacf',
    trim: bronze,
    over: 0.16,
  });
  upturnedRoof(p, 0, 2.68, -0.12, 5.26, 3.76, 1.44, plum);
  box(p, 0, 4.12, -0.12, 1.65, 0.89, 1.64, '#587a78');
  upturnedRoof(p, 0, 4.39, -0.12, 2.83, 2.28, 1.12, spruce);
  // Crossed, notched roof finials are cut from a single sheet each.
  for (const side of [-1, 1]) {
    sheet(
      p,
      0,
      5.56,
      1.11,
      [
        [0, -0.18],
        [side * 0.83, 0.36],
        [side * 0.9, 0.65],
        [side * 0.62, 0.51],
        [side * 0.46, 0.51],
        [side * 0.42, 0.38],
        [0, 0.04],
      ],
      bronze,
    );
    const x = side * 1.81;
    box(p, x, 1.49, 1.45, 0.19, 2.94, 0.2, bronze);
    for (let j = 0; j < 3; j++) {
      const diamond = box(p, x, 0.81 + j * 0.56, 1.57, 0.15, 0.15, 0.08, plum);
      diamond.rotation.z = Math.PI / 4;
    }
    windowPane(p, side * 1.31, 0.99, 1.46, 0.63, 1.17, sea, true);
    box(p, side * 2.02, 0.41, 1.47, 0.34, 0.79, 0.29, sea);
  }
  for (const x of [-0.36, 0.36]) windowPane(p, x, 3.03, 1.48, 0.49, 0.71, bronze, true);
  disk(p, 0, 4.17, 1.34, 0.26, bronze, 12);
  // A little papermobile hangs from the porch brackets.
  rod(p, -1.88, 2.64, 1.68, -2.5, 2.86, 1.68, 0.084, bronze);
  for (let j = 0; j < 3; j++) {
    const xx = -2.46 + j * 0.2,
      y = 2.2 + j * 0.12;
    rod(p, xx, 2.8, 1.68, xx, y, 1.68, 0.024, bronze);
    star(p, xx, y, 1.7, 0.112, '#e4c485', 0.36);
  }
  props.push({ object: lantern(p, 1.92, 2.54, 1.82), kind: 'lantern' });
  return {
    x: 0,
    z: 1.42,
    roofY: 5.73,
    width: 1.27,
    height: 2.12,
    doorColor: plum,
    trim: bronze,
    starY: 3.97,
  };
}

function snowCottage(p, props) {
  const frost = '#c2dce0',
    blue = '#779ba7',
    trim = '#f0e9d7';
  // Each lifted course is a separate folded strip. Narrow trapezoidal joints
  // alternate like the running bond on a real snow-brick dome.
  const rows = [
    [0, 0.78, 2.6, 2.55],
    [0.78, 1.5, 2.55, 2.42],
    [1.5, 2.17, 2.42, 2.18],
    [2.17, 2.78, 2.18, 1.87],
    [2.78, 3.33, 1.87, 1.49],
    [3.33, 3.79, 1.49, 0.96],
    [3.79, 4.1, 0.96, 0.22],
  ];
  rows.forEach(([lo, hi, base, top], i) => {
    const n = 14,
      angle = ((i % 2) * Math.PI) / n,
      g = group(p, 0.31, (lo + hi) / 2, -0.56);
    const course = tube(g, 0, 0, 0, top, base, hi - lo - 0.028, [frost, '#d9e7e6', '#d1e2e4'][i % 3], n);
    course.rotation.y = angle;
    for (let j = 0; j < n; j++) {
      const a = angle + (j * Math.PI * 2) / n;
      rod(
        g,
        Math.sin(a) * (base + 0.013),
        -(hi - lo) / 2,
        -Math.cos(a) * (base + 0.013),
        Math.sin(a) * (top + 0.012),
        (hi - lo) / 2,
        -Math.cos(a) * (top + 0.012),
        0.026,
        '#a3c1cb',
      );
    }
  });
  // The open snow tunnel protrudes beyond the dome.
  arch(p, 0, 0.05, 2.28, 2.55, 2.92, blue, 2.2);
  arch(p, 0, 0.08, 2.34, 2.45, 2.88, frost, 0.23);
  for (const side of [-1, 1]) {
    for (let j = 0; j < 3; j++) box(p, side * 1.07, 0.45 + j * 0.53, 2.37, 0.36, 0.39, 0.15, trim);
    for (let j = 0; j < 3; j++) {
      const a = ((j + 0.65) * Math.PI) / 7,
        xx = side * 1.07 * Math.cos(a);
      box(p, xx, 1.8 + 0.94 * Math.sin(a), 2.4, 0.35, 0.23, 0.19, snow).rotation.z = side * a;
    }
  }
  const dormer = group(p, 1.62, 1.67, 0.96);
  dormer.rotation.y = 0.44;
  roundWindow(dormer, 0, 0, 0.12, 0.57, blue);
  props.push({ object: snowman(p, -2.24, 1.63, 1.04), kind: 'snowman' });
  props.push({ object: lantern(p, 1.23, 2.17, 2.57), kind: 'lantern' });
  return {
    x: 0,
    z: 2.37,
    roofY: 4.15,
    width: 1.45,
    height: 2.13,
    doorColor: '#759ca5',
    trim,
    starY: 2.98,
  };
}

function sleigh(p, x, z) {
  const g = group(p, x, 0, z);
  sheet(
    g,
    0,
    0.22,
    0.44,
    [
      [-0.92, 0.12],
      [-0.86, 0.48],
      [-0.6, 0.63],
      [-0.48, 0.37],
      [0.48, 0.37],
      [0.77, 0.69],
      [0.91, 0.74],
      [0.91, 0.45],
      [0.67, 0.09],
    ],
    red,
    0.19,
  );
  sheet(
    g,
    0,
    0.22,
    -0.32,
    [
      [-0.92, 0.12],
      [-0.86, 0.48],
      [-0.6, 0.63],
      [-0.48, 0.37],
      [0.48, 0.37],
      [0.77, 0.69],
      [0.91, 0.74],
      [0.91, 0.45],
      [0.67, 0.09],
    ],
    red,
    0.14,
  );
  box(g, -0.08, 0.56, 0, 1.54, 0.15, 0.79, '#d59f6d');
  for (const side of [-1, 1]) {
    const zz = side * 0.4;
    rod(g, -1.03, 0.11, zz, 0.82, 0.11, zz, 0.075, gold);
    rod(g, 0.82, 0.11, zz, 1.07, 0.34, zz, 0.075, gold);
    for (const xx of [-0.54, 0.49]) rod(g, xx, 0.14, zz, xx + 0.14, 0.45, zz, 0.072, gold);
  }
  return g;
}

function lodge(p, props) {
  const cedar = '#a0714f',
    bark = '#705440',
    pine = '#496558',
    green = '#6e826a';
  const r = gable(p, {
    w: 5.56,
    d: 3.33,
    wall: 2.64,
    rise: 1.98,
    body: cedar,
    roof: pine,
    cap: '#e6e5cf',
    trim: '#d6b387',
    over: 0.4,
  });
  // Scored log siding and protruding cut ends frame the porch.
  for (let j = 0; j < 8; j++) {
    box(p, 0, 0.2 + j * 0.315, r.front + 0.02, 5.4, 0.035, 0.06, bark);
    for (const side of [-1, 1])
      disk(p, side * 2.7, 0.21 + j * 0.32, r.front + 0.11, 0.18, j % 2 ? '#c89b67' : '#bb8861', 8);
  }
  for (const side of [-1, 1]) {
    const x = side * 1.71;
    windowPane(p, x, 0.83, r.front + 0.12, 1.15, 1.27, '#d4b383');
    for (const s of [-1, 1]) {
      box(p, x + s * 0.75, 1.46, r.front + 0.13, 0.29, 1.22, 0.08, green);
      for (let j = 0; j < 4; j++)
        box(p, x + s * 0.75, 1.04 + j * 0.25, r.front + 0.195, 0.22, 0.04, 0.05, pine);
    }
  }
  // A second gable projects over the deep covered front porch.
  gable(p, {
    z: 1.89,
    y: 2.34,
    w: 3.48,
    d: 1.83,
    wall: 0.22,
    rise: 1.1,
    body: bark,
    roof: pine,
    cap: snow,
    trim: '#dbb480',
    over: 0.19,
  });
  for (const side of [-1, 1]) {
    box(p, side * 1.56, 1.24, 2.66, 0.21, 2.48, 0.23, bark);
    rod(p, side * 1.56, 1.89, 2.66, side * 1.19, 2.5, 2.66, 0.13, '#be9361');
    for (let j = 0; j < 2; j++) box(p, side * (1.12 + j * 0.21), 0.56, 2.55, 0.09, 0.61, 0.13, bark);
    box(p, side * 1.25, 0.9, 2.55, 0.72, 0.13, 0.17, '#c29663');
  }
  for (const side of [-1, 1]) {
    rod(p, 0, 3.02, 2.86, side * 0.54, 3.37, 2.86, 0.1, ivory, 0.075);
    rod(p, side * 0.33, 3.23, 2.86, side * 0.37, 3.48, 2.86, 0.07, ivory);
  }
  chimney(p, -1.72, 3.42, -0.56, 1.68, '#85776a');
  props.push({ object: reindeer(p, 3.05, 2.12, 0.85), kind: 'reindeer' });
  props.push({ object: sleigh(p, -2.57, 2.6), kind: 'present' });
  return {
    x: 0,
    z: r.front + 0.13,
    roofY: r.peak,
    width: 1.29,
    height: 2.07,
    doorColor: pine,
    trim: '#dcb886',
    starY: 3.94,
  };
}

function peppermint(p, x, y, z, r) {
  const g = group(p, x, y, z);
  disk(g, 0, 0, 0, r, ivory, 20, 0.15);
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7;
    const wedge = sheet(
      g,
      0,
      0,
      0.082,
      [
        [0, 0],
        [r * 0.53, 0.08 * r],
        [r * 0.94, 0.33 * r],
        [r * 0.82, 0.52 * r],
        [r * 0.46, 0.16 * r],
      ],
      '#cb656a',
      0.02,
    );
    wedge.rotation.z = a;
  }
  return g;
}

function sweets(p, props) {
  const rose = '#cc8081',
    coral = '#bd535f',
    pink = '#efb7ac',
    sugar = '#ffedcc';
  // A folded confectioner's gift box, tied with giant ribbon and a candy turret.
  box(p, -0.37, 1.48, -0.2, 4.38, 2.96, 2.87, rose);
  box(p, -0.37, 2.96, -0.2, 4.77, 0.38, 3.22, coral);
  box(p, -0.37, 3.17, -0.2, 4.83, 0.11, 3.29, sugar);
  for (const x of [-2.36, -0.21, 1.67]) {
    box(p, x, 1.5, 1.27, 0.24, 2.89, 0.12, pink);
    box(p, x, 3.25, -0.2, 0.27, 0.11, 3.22, pink);
  }
  box(p, -0.38, 3.27, -0.18, 4.79, 0.11, 0.35, pink);
  const leftBow = sheet(
    p,
    -0.36,
    3.31,
    0.15,
    [
      [0, 0],
      [-0.49, 0.58],
      [-0.89, 0.81],
      [-1.19, 0.64],
      [-1.13, 0.31],
      [-0.77, 0.19],
    ],
    coral,
    0.35,
  );
  leftBow.rotation.y = 0.15;
  sheet(
    p,
    -0.36,
    3.31,
    0.18,
    [
      [0, 0],
      [0.44, 0.56],
      [0.85, 0.81],
      [1.23, 0.65],
      [1.18, 0.33],
      [0.78, 0.2],
    ],
    coral,
    0.32,
  );
  for (const side of [-1, 1])
    sheet(
      p,
      -0.36,
      3.36,
      0.21,
      [
        [side * 0.17, 0],
        [side * 0.7, 0.46],
        [side * 0.93, 0.52],
        [side * 0.85, 0.35],
        [side * 0.61, 0.21],
      ],
      pink,
      0.05,
    );
  ball(p, -0.36, 3.49, 0.09, 0.27, 0.23, 0.27, rose);
  windowPane(p, -1.75, 0.72, 1.3, 0.96, 1.32, sugar, true);
  peppermint(p, -1.74, 2.51, 1.4, 0.33);
  const towerX = 1.83,
    towerZ = -0.22,
    r = 1.38;
  tube(p, towerX, 1.72, towerZ, r, r, 3.44, pink, 8);
  for (const [y, height, color] of [
    [0.14, 0.28, coral],
    [2.65, 0.11, sugar],
    [3.32, 0.28, coral],
  ]) {
    tube(p, towerX, y, towerZ, r + 0.07, r + 0.07, height, color, 8);
  }
  tube(p, towerX, 4.57, towerZ, 0.055, r + 0.24, 2.31, coral, 8);
  for (let j = 0; j < 4; j++) {
    const lo = j * 0.49,
      hi = lo + 0.21,
      baseR = r + 0.24;
    tube(
      p,
      towerX,
      3.42 + (lo + hi) / 2,
      towerZ,
      baseR * (1 - hi / 2.34),
      baseR * (1 - lo / 2.34),
      hi - lo,
      pink,
      8,
    );
  }
  ball(p, towerX, 5.86, towerZ, 0.2, 0.21, 0.2, gold);
  windowPane(p, towerX, 1.04, 1.1, 0.86, 1.56, sugar, true);
  const lolly = (x, z, h, radius) => {
    const g = group(p, x, 0, z);
    rod(g, 0, 0.04, 0, 0, h, 0, 0.11, sugar);
    peppermint(g, 0, h, 0, radius);
    return g;
  };
  props.push({ object: lolly(-2.95, 1.45, 1.61, 0.55), kind: 'present' });
  props.push({ object: lolly(3.22, 1.63, 1.72, 0.49), kind: 'present' });
  for (const sign of [-1, 1]) stripedPole(p, -0.37 + sign * 0.78, 0, 1.53, 2.33, coral, 0.1);
  return {
    x: -0.37,
    z: 1.32,
    roofY: 4.08,
    width: 1.21,
    height: 2.15,
    doorColor: coral,
    trim: sugar,
    starY: 2.92,
  };
}

function observatory(p, props) {
  const plum = '#67536e',
    night = '#494860',
    lilac = '#9a8197',
    brass = '#d7a558';
  // A twelve-facet copper dome with embossed ribs and a hinged viewing slit.
  const tx = 0.7,
    tz = -0.34,
    r = 2.14;
  tube(p, tx, 1.64, tz, r, r + 0.12, 3.28, plum, 12);
  tube(p, tx, 3.17, tz, r + 0.17, r + 0.17, 0.28, lilac, 12);
  tube(p, tx, 3.41, tz, r + 0.21, r + 0.17, 0.17, brass, 12);
  const profile = [
    [0, 2.26],
    [0.45, 2.19],
    [0.93, 1.97],
    [1.38, 1.58],
    [1.77, 1.02],
    [2.02, 0.35],
  ];
  for (let i = 1; i < profile.length; i++) {
    const [a, ra] = profile[i - 1],
      [b, rb] = profile[i];
    tube(p, tx, 3.45 + (a + b) / 2, tz, rb, ra, b - a, i % 2 ? '#d5a85e' : '#cf9c57', 12);
    for (let j = 0; j < 12; j += 2) {
      const angle = (j * Math.PI) / 6;
      rod(
        p,
        tx + Math.sin(angle) * ra,
        3.45 + a,
        tz + Math.cos(angle) * ra,
        tx + Math.sin(angle) * rb,
        3.45 + b,
        tz + Math.cos(angle) * rb,
        0.062,
        '#f2c778',
      );
    }
  }
  tube(p, tx, 5.51, tz, 0.27, 0.43, 0.22, brass, 12);
  star(p, tx, 5.99, tz, 0.49, brass, 0.35);
  // A telescope gazes upward from the dome toward the street.
  const telescope = group(p, tx + 0.68, 4.54, tz + 1.28);
  telescope.rotation.x = 1.11;
  telescope.rotation.z = -0.13;
  tube(telescope, 0, 0.45, 0, 0.27, 0.2, 1.15, night, 12);
  tube(telescope, 0, 1.02, 0, 0.36, 0.35, 0.23, brass, 12);
  tube(telescope, 0, 1.155, 0, 0.24, 0.24, 0.045, '#b1cecf', 12);
  for (const [xx, aa] of [
    [-0.58, -0.36],
    [2.1, 0.52],
  ]) {
    const g = group(p, xx, 1.27, tz + 1.91);
    g.rotation.y = aa;
    roundWindow(g, 0, 0, 0.08, 0.47, brass);
  }
  gable(p, {
    x: -1.91,
    z: 0.05,
    w: 2.37,
    d: 2.81,
    wall: 2.24,
    rise: 1.15,
    body: lilac,
    roof: night,
    trim: brass,
    cap: '#dfd9cf',
  });
  star(p, -1.91, 2.86, 1.55, 0.26, brass, 0.36);
  const positions = [
    [-2.5, 2.11],
    [-2.19, 2.24],
    [-1.72, 2.09],
    [-1.41, 2.3],
  ];
  for (let i = 0; i < positions.length; i++) {
    const [x, y] = positions[i];
    disk(p, x, y, 1.48, 0.055, ivory, 8);
    if (i) rod(p, ...positions[i - 1], 1.47, x, y, 1.47, 0.024, brass);
  }
  props.push({ object: lantern(p, -2.78, 2.02, 1.8), kind: 'lantern' });
  return {
    x: -1.87,
    z: 1.47,
    roofY: 5.63,
    width: 1.24,
    height: 1.86,
    doorColor: night,
    trim: brass,
    starY: 2.79,
  };
}

function palaceTower(p, x, z, r, wall, spire) {
  const ruby = '#a84d55',
    goldTrim = '#deb16a',
    parchment = '#f4d7b5';
  const g = group(p, x, 0, z);
  const orientation = Math.PI / 8;
  const drum = (y, top, bottom, h, c) => {
    const m = tube(g, 0, y, 0, top, bottom, h, c, 8);
    m.rotation.y = orientation;
    return m;
  };
  drum(wall / 2, r, r + 0.06, wall, parchment);
  drum(0.25, r + 0.15, r + 0.15, 0.42, '#bb7771');
  drum(wall - 0.35, r + 0.12, r + 0.1, 0.16, goldTrim);
  drum(wall - 0.09, r + 0.15, r + 0.15, 0.29, '#c97a70');
  drum(wall + 0.13, r + 0.23, r + 0.18, 0.16, snow);
  drum(wall + 0.45 * spire, r * 0.11, r + 0.32, spire * 0.89, ruby);
  drum(wall + spire * 0.92, 0.04, r * 0.15, spire * 0.18, goldTrim);
  ball(g, 0, wall + spire * 1.05, 0, 0.14, 0.145, 0.14, goldTrim);
  box(g, 0, wall + spire * 1.29, 0, 0.039, spire * 0.44, 0.049, goldTrim);
  sheet(
    g,
    0,
    wall + spire * 1.49,
    0.04,
    [
      [0, 0],
      [0.64, -0.095],
      [0.45, -0.21],
      [0.61, -0.32],
      [0, -0.27],
    ],
    ruby,
    0.04,
  );
  windowPane(g, 0, wall * 0.5, r * 0.95, r * 0.75, wall * 0.29, '#bf8974', true);
  for (const side of [-1, 1]) {
    rod(
      g,
      side * r * 0.66,
      wall * 0.09,
      r * 0.71,
      side * r * 0.66,
      wall - 0.44,
      r * 0.71,
      0.08,
      goldTrim,
    );
  }
  return g;
}

function palace(p, props) {
  const ruby = '#ac5058',
    cream = '#ebcba4',
    rose = '#c5877a',
    gilt = '#d9aa5d';
  box(p, 0, 1.78, -0.32, 4.93, 3.56, 3.48, cream);
  box(p, 0, 3.45, -0.32, 5.04, 0.31, 3.58, rose);
  box(p, 0, 3.67, -0.32, 5.15, 0.14, 3.7, snow);
  for (const x of [-2.28, -1.53, -0.77, 0, 0.77, 1.53, 2.28]) {
    box(p, x, 3.89, 1.41, 0.46, 0.42, 0.31, cream);
    box(p, x, 4.13, 1.41, 0.52, 0.09, 0.36, snow);
  }
  palaceTower(p, -2.51, -0.26, 0.91, 4.1, 1.75);
  palaceTower(p, 2.48, -0.32, 1.04, 4.56, 1.99);
  palaceTower(p, -0.36, -1.03, 1.04, 5.39, 1.96);
  // Raised champagne-card portal and a ruby canopy resembling a paper crown.
  arch(p, 0, 0.05, 1.97, 2.77, 3.72, rose, 0.99);
  arch(p, 0, 0.09, 2.06, 2.48, 3.42, cream, 0.14);
  sheet(
    p,
    0,
    3.62,
    2.05,
    [
      [-1.42, 0.06],
      [-1.47, 0.82],
      [-0.84, 0.41],
      [-0.54, 0.95],
      [0, 0.52],
      [0.54, 0.95],
      [0.84, 0.41],
      [1.47, 0.82],
      [1.42, 0.06],
    ],
    gilt,
    0.18,
  );
  for (const x of [-1.43, -0.53, 0.53, 1.43])
    ball(p, x, 4.47 + (Math.abs(x) < 0.6 ? 0.12 : 0), 1.99, 0.105, 0.12, 0.1, '#f7d389');
  for (const side of [-1, 1]) {
    const x = side * 1.66;
    windowPane(p, x, 1.58, 1.5, 0.73, 1.27, rose, true);
    rod(p, x - 0.29, 1.29, 1.64, x + 0.29, 1.29, 1.64, 0.07, gilt);
    sheet(
      p,
      x,
      1.26,
      1.64,
      [
        [-0.25, 0],
        [0.25, 0],
        [0.25, -0.58],
        [0, -0.81],
        [-0.25, -0.58],
      ],
      ruby,
      0.045,
    );
    star(p, x, 0.88, 1.69, 0.14, gilt, 0.34);
  }
  for (let i = 0; i < 3; i++) {
    const w = 3.58 - i * 0.21,
      z = 2.41 - i * 0.18;
    box(p, 0, 0.07 + i * 0.105, z, w, 0.13, 0.91, '#ca9b78');
    box(p, 0, 0.144 + i * 0.105, z, w, 0.035, 0.91, '#e9d6b6');
  }
  for (const side of [-1, 1]) {
    const g = group(p, side * 1.98, 0, 2.24);
    tube(g, 0, 0.56, 0, 0.11, 0.2, 1.12, gilt, 6);
    props.push({ object: lantern(g, 0, 1.77, 0.04), kind: 'lantern' });
  }
  return {
    x: 0,
    z: 2.08,
    roofY: 6.67,
    width: 1.54,
    height: 2.47,
    base: 0.35,
    doorColor: ruby,
    trim: gilt,
    starY: 3.75,
  };
}

const designs = [
  gingerbread,
  alpine,
  frost,
  bakery,
  workshop,
  market,
  aurora,
  snowCottage,
  lodge,
  sweets,
  observatory,
  palace,
];

export function buildHouse(index, language = 'en') {
  if (!Number.isInteger(index) || index < 1 || index > designs.length)
    throw new RangeError('Invalid mission house');
  const root = new T.Group(),
    props = [];
  root.name = 'Mission ' + index;
  const s = designs[index - 1](root, props, language);
  const fittings = entry(root, s.x, s.z, s.doorColor, s.trim, s.width, s.height, s.base);
  const prize = group(root, s.x, s.starY, s.z + 0.33);
  star(prize, 0, 0, 0, 0.52, '#bd813c');
  star(prize, -0.02, 0.025, 0.1, 0.45, '#ffd678');
  const festive = group(root);
  pennants(festive, s.x - 1.48, s.x + 1.48, s.starY - 0.2, s.z + 0.43, [red, gold, '#668a68', ivory]);
  for (const side of [-1, 1])
    present(festive, s.x + side * 1.56, s.z + 0.47, 0.48, side < 0 ? red : '#578570', gold);
  prize.visible = festive.visible = false;
  return { root, ...fittings, star: prize, festive, roofY: s.roofY, props };
}
