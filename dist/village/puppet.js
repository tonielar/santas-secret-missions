import * as T from './vendor/three.module.min.js';

// One two-sided mesh per moving piece of cardstock. Its edges and the
// differently coloured faces of each fold are actual triangles.
const stock = new T.MeshStandardMaterial({
  vertexColors: true,
  side: T.DoubleSide,
  flatShading: true,
  roughness: 1,
});
const palette = {
  female: {
    coat: '#32856a',
    fold: '#21644f',
    light: '#61a586',
    cap: '#bc413e',
    capFold: '#96353a',
    band: '#f4db9c',
    skin: '#c98768',
    shade: '#ac6d57',
    hair: '#57392f',
    lining: '#be5548',
  },
  male: {
    coat: '#b54c46',
    fold: '#903a40',
    light: '#d77257',
    cap: '#358471',
    capFold: '#245e58',
    band: '#f1c976',
    skin: '#e3ae83',
    shade: '#c48566',
    hair: '#744329',
    lining: '#498777',
  },
};
const cream = '#f9edce',
  gold = '#dda950',
  hole = '#886641',
  boot = '#633d35',
  sole = '#443334',
  ink = '#302b34';

function group(parent, name, x = 0, y = 0, z = 0) {
  const part = new T.Group();
  part.name = name;
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

class Sheet {
  constructor() {
    this.xyz = [];
    this.rgb = [];
  }

  triangle(a, b, c, tint) {
    this.xyz.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) this.rgb.push(tint.r, tint.g, tint.b);
  }

  cut(points, depth, hex, thickness = 0.022, tilt = 0) {
    const tint = new T.Color(hex);
    const raw = points.map(([x, y]) => new T.Vector2(x, y));
    const face = points.map(([x, y]) => [x, y, depth + x * tilt]);
    const back = face.map(([x, y, z]) => [x, y, z - thickness]);
    const edge = tint.clone().multiplyScalar(0.68);
    for (const [a, b, c] of T.ShapeUtils.triangulateShape(raw, [])) {
      this.triangle(face[a], face[b], face[c], tint);
      this.triangle(back[c], back[b], back[a], edge);
    }
    for (let i = 0; i < face.length; i++) {
      const j = (i + 1) % face.length;
      this.triangle(face[i], back[i], face[j], edge);
      this.triangle(face[j], back[i], back[j], edge);
    }
  }

  oval(x, y, rx, ry, z, hex, segments = 12, thickness = 0.012) {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (2 * Math.PI * i) / segments;
      points.push([x + rx * Math.cos(angle), y + ry * Math.sin(angle)]);
    }
    this.cut(points, z, hex, thickness);
  }

  brad(x, y, z, r = 0.03) {
    this.oval(x, y, r, r, z, gold, 10);
    this.oval(x, y, r * 0.29, r * 0.29, z + 0.004, hole, 8, 0.004);
  }

  attach(parent) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(this.xyz, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(this.rgb, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new T.Mesh(geometry, stock);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }
}

function leg(body, side, colours) {
  const thigh = group(body, 'hip pin', side * 0.097, 0.49, -0.017);
  const calf = group(thigh, 'knee pin', 0, -0.199, 0);
  const foot = group(calf, 'ankle pin', 0, -0.206, 0.009);
  const upper = new Sheet(),
    lower = new Sheet(),
    shoe = new Sheet();
  upper.cut(
    [
      [-0.044, 0.019],
      [0.041, 0.019],
      [0.034, -0.177],
      [0.019, -0.214],
      [-0.027, -0.215],
      [-0.043, -0.181],
    ],
    0,
    colours.fold,
    0.045,
  );
  lower.cut(
    [
      [-0.032, 0.017],
      [0.035, 0.018],
      [0.03, -0.195],
      [-0.027, -0.211],
      [-0.037, -0.102],
    ],
    0.038,
    cream,
    0.034,
  );
  for (const y of [-0.045, -0.122]) {
    lower.cut(
      [
        [-0.033, y],
        [0.034, y + 0.006],
        [0.032, y - 0.032],
        [-0.034, y - 0.04],
      ],
      0.041,
      colours.lining,
      0.005,
    );
  }
  lower.brad(0, 0, 0.045, 0.024);
  const silhouette = [
    [-0.056, 0.035],
    [0.04, 0.037],
    [0.052, -0.009],
    [0.126, -0.014],
    [0.15, 0.011],
    [0.158, -0.007],
    [0.139, -0.057],
    [0.082, -0.072],
    [-0.057, -0.069],
  ];
  const signed = (pts) => pts.map(([x, y]) => [side * x, y]);
  shoe.cut(signed(silhouette), 0.048, boot, 0.09);
  shoe.cut(
    signed([
      [-0.056, -0.053],
      [0.088, -0.054],
      [0.141, -0.043],
      [0.136, -0.059],
      [0.082, -0.075],
      [-0.057, -0.074],
    ]),
    0.051,
    sole,
    0.012,
  );
  shoe.cut(
    signed([
      [-0.052, 0.029],
      [0.04, 0.032],
      [0.051, 0.007],
      [-0.003, 0.013],
      [-0.042, -0.005],
    ]),
    0.054,
    colours.lining,
    0.01,
  );
  shoe.brad(0, 0, 0.058, 0.014);
  upper.attach(thigh);
  lower.attach(calf);
  shoe.attach(foot);
  return { thigh, calf, foot };
}

function arm(body, side, colours) {
  const shoulder = group(body, 'shoulder pin', side * 0.177, 0.932, -0.018);
  const elbow = group(shoulder, 'elbow pin', side * 0.012, -0.168, 0.014);
  const sleeve = new Sheet(),
    wrist = new Sheet();
  sleeve.cut(
    [
      [-0.062, 0.013],
      [0, 0.041],
      [0.057, 0.016],
      [0.042, -0.091],
      [0.023, -0.177],
      [-0.022, -0.178],
      [-0.051, -0.104],
    ],
    0.018,
    colours.coat,
    0.041,
  );
  sleeve.cut(
    [
      [0.008, 0.023],
      [0.056, 0.015],
      [0.041, -0.088],
      [0.023, -0.163],
      [-0.01, -0.123],
    ],
    0.021,
    colours.fold,
    0.006,
  );
  sleeve.brad(0, 0.003, 0.029, 0.026);
  wrist.cut(
    [
      [-0.028, 0.013],
      [0.03, 0.014],
      [0.027, -0.119],
      [0.017, -0.151],
      [-0.027, -0.148],
    ],
    0.026,
    colours.light,
    0.032,
  );
  wrist.brad(0, 0, 0.035, 0.022);
  wrist.cut(
    [
      [-0.035, -0.101],
      [0.031, -0.102],
      [0.027, -0.126],
      [-0.035, -0.127],
    ],
    0.039,
    cream,
    0.009,
  );
  wrist.cut(
    [
      [-0.028, -0.131],
      [0.025, -0.128],
      [0.042, -0.156],
      [0.049, -0.155],
      [0.055, -0.17],
      [0.046, -0.196],
      [0.015, -0.211],
      [-0.017, -0.2],
      [-0.035, -0.166],
    ],
    0.043,
    colours.skin,
    0.025,
  );
  sleeve.attach(shoulder);
  wrist.attach(elbow);
  return { shoulder, elbow };
}

function foldedCoat(body, colours, female) {
  const coat = new Sheet();
  const hem = female ? 0.249 : 0.208;
  const outline = [
    [-0.168, 0.954],
    [-0.076, 0.983],
    [0.079, 0.982],
    [0.169, 0.95],
    [0.144, 0.78],
    [hem, 0.536],
    [0.145, 0.502],
    [0.056, 0.525],
    [0, 0.493],
    [-0.064, 0.519],
    [-0.147, 0.5],
    [-hem, 0.536],
    [-0.146, 0.774],
  ];
  coat.cut(outline, 0.036, colours.coat, 0.117);
  coat.cut(
    [
      [-0.165, 0.949],
      [-0.115, 0.95],
      [-0.059, 0.752],
      [-0.145, 0.503],
      [-hem, 0.536],
      [-0.145, 0.78],
    ],
    0.04,
    colours.fold,
    0.005,
  );
  coat.cut(
    [
      [-0.058, 0.752],
      [0.027, 0.764],
      [0.056, 0.525],
      [0.001, 0.497],
      [-0.061, 0.522],
    ],
    0.051,
    colours.light,
    0.007,
    -0.039,
  );
  coat.cut(
    [
      [0.027, 0.764],
      [0.148, 0.779],
      [hem, 0.536],
      [0.146, 0.505],
      [0.057, 0.525],
    ],
    0.049,
    colours.coat,
    0.008,
  );
  coat.cut(
    [
      [0.116, 0.941],
      [0.167, 0.947],
      [0.144, 0.782],
      [0.096, 0.747],
    ],
    0.052,
    colours.light,
    0.007,
  );
  // The contrasting side gusset opens into three origami pleats.
  coat.cut(
    [
      [0.108, 0.727],
      [0.197, 0.549],
      [0.156, 0.522],
      [0.122, 0.6],
    ],
    0.058,
    colours.light,
    0.007,
  );
  coat.cut(
    [
      [0.108, 0.727],
      [0.151, 0.522],
      [0.121, 0.533],
    ],
    0.062,
    colours.fold,
    0.006,
  );
  coat.cut(
    [
      [-0.148, 0.794],
      [0.144, 0.794],
      [0.147, 0.75],
      [-0.147, 0.748],
    ],
    0.064,
    boot,
    0.009,
  );
  coat.cut(
    [
      [-0.03, 0.805],
      [0.029, 0.804],
      [0.03, 0.74],
      [-0.031, 0.741],
    ],
    0.07,
    gold,
    0.008,
  );
  coat.cut(
    [
      [-0.015, 0.789],
      [0.014, 0.789],
      [0.014, 0.754],
      [-0.015, 0.754],
    ],
    0.076,
    boot,
    0.004,
  );
  coat.cut(
    [
      [-0.112, 0.968],
      [0.114, 0.97],
      [0.146, 0.93],
      [0.065, 0.878],
      [0.004, 0.943],
      [-0.054, 0.872],
      [-0.138, 0.926],
    ],
    0.078,
    cream,
    0.018,
  );
  coat.brad(0.001, 0.846, 0.075, 0.014);
  coat.attach(body);
}

function face(head, c, female) {
  const sheet = new Sheet();
  const ear = [
    [0.153, 0.05],
    [0.205, 0.055],
    [0.304, 0.133],
    [0.285, 0.044],
    [0.244, -0.002],
    [0.164, -0.045],
  ];
  for (const k of [-1, 1]) {
    const mirror = (points) => points.map(([x, y]) => [k * x, y]);
    sheet.cut(mirror(ear), 0.009, c.skin, 0.055);
    sheet.cut(
      mirror([
        [0.184, 0.024],
        [0.275, 0.094],
        [0.252, 0.035],
        [0.208, -0.005],
      ]),
      0.014,
      c.shade,
      0.007,
    );
    if (female) {
      const braid = mirror([
        [0.12, 0.09],
        [0.2, 0.092],
        [0.223, 0.025],
        [0.2, -0.011],
        [0.228, -0.05],
        [0.204, -0.093],
        [0.226, -0.138],
        [0.195, -0.169],
        [0.162, -0.154],
        [0.142, -0.112],
        [0.153, -0.067],
        [0.135, -0.033],
      ]);
      sheet.cut(braid, -0.014, c.hair, 0.033);
      sheet.cut(
        mirror([
          [0.169, -0.126],
          [0.217, -0.13],
          [0.214, -0.149],
          [0.165, -0.142],
        ]),
        0.003,
        c.cap,
        0.014,
      );
      sheet.cut(
        mirror([
          [0.17, -0.139],
          [0.21, -0.143],
          [0.236, -0.183],
          [0.205, -0.176],
          [0.198, -0.199],
          [0.172, -0.178],
        ]),
        -0.003,
        c.hair,
        0.016,
      );
    }
  }
  sheet.cut(
    [
      [-0.17, 0.151],
      [-0.094, 0.201],
      [0.113, 0.19],
      [0.177, 0.113],
      [0.174, 0.002],
      [0.139, -0.071],
      [0.075, -0.119],
      [-0.001, -0.136],
      [-0.095, -0.114],
      [-0.158, -0.067],
      [-0.181, 0.006],
    ],
    0.056,
    c.skin,
    0.085,
  );
  sheet.cut(
    [
      [-0.179, 0.011],
      [-0.142, -0.045],
      [-0.086, -0.096],
      [-0.004, -0.128],
      [-0.096, -0.111],
      [-0.159, -0.065],
    ],
    0.06,
    c.shade,
    0.005,
  );
  sheet.oval(-0.108, -0.04, 0.042, 0.022, 0.065, '#d88270', 10);
  sheet.oval(0.109, -0.04, 0.042, 0.022, 0.065, '#d88270', 10);
  sheet.cut(
    [
      [-0.004, 0.021],
      [0.014, 0.012],
      [0.026, -0.011],
      [0.012, -0.02],
      [-0.012, -0.014],
    ],
    0.083,
    c.shade,
    0.024,
  );
  sheet.cut(
    [
      [-0.006, 0.019],
      [0.014, 0.012],
      [0.022, -0.008],
      [-0.01, -0.01],
    ],
    0.087,
    c.skin,
    0.005,
  );
  for (const k of [-1, 1])
    for (let i = 0; i < 3; i++) {
      sheet.oval(
        k * (0.084 + i * 0.018),
        -0.037 + (i % 2) * 0.009,
        0.0045,
        0.0045,
        0.075,
        '#a96954',
        6,
        0.003,
      );
    }
  const fringe = female
    ? [
        [-0.176, 0.137],
        [-0.122, 0.177],
        [0.143, 0.145],
        [0.177, 0.11],
        [0.166, 0.056],
        [0.105, 0.091],
        [0.071, 0.079],
        [0.052, 0.12],
        [0.015, 0.095],
        [-0.092, 0.063],
        [-0.068, 0.099],
        [-0.125, 0.064],
        [-0.148, 0.003],
        [-0.176, 0.024],
      ]
    : [
        [-0.181, 0.136],
        [-0.116, 0.17],
        [0.134, 0.15],
        [0.18, 0.109],
        [0.181, 0.032],
        [0.141, 0.051],
        [0.127, 0.084],
        [0.095, 0.072],
        [0.072, 0.102],
        [0.042, 0.069],
        [0.012, 0.098],
        [-0.024, 0.075],
        [-0.053, 0.098],
        [-0.093, 0.06],
        [-0.12, 0.083],
        [-0.161, 0.023],
        [-0.175, 0.038],
      ];
  sheet.cut(fringe, 0.068, c.hair, 0.045);
  sheet.attach(head);

  const gaze = group(head, 'blink', 0, 0.032, 0.064);
  const eyes = new Sheet();
  for (const k of [-1, 1]) {
    eyes.oval(k * 0.067, 0, 0.015, 0.024, 0.015, ink, 10);
    eyes.oval(k * 0.067 - 0.004, 0.008, 0.004, 0.004, 0.021, cream, 7, 0.003);
  }
  eyes.attach(gaze);
  const brow = group(head, 'curious brows', 0, 0.061, 0.063);
  const brows = new Sheet();
  for (const k of [-1, 1]) {
    brows.cut(
      [
        [0.045, 0.003],
        [0.058, 0.013],
        [0.093, 0.013],
        [0.094, 0.008],
        [0.062, 0.006],
        [0.048, -0.002],
      ].map(([x, y]) => [k * x, y]),
      0.011,
      c.hair,
      0.009,
    );
  }
  brows.attach(brow);
  const smile = group(head, 'smile', 0, -0.056, 0.065),
    oh = group(head, 'surprise', 0, -0.056, 0.066);
  const lips = new Sheet(),
    surprise = new Sheet();
  lips.cut(
    [
      [-0.04, 0.008],
      [-0.019, -0.003],
      [0.005, -0.007],
      [0.024, -0.001],
      [0.038, 0.009],
      [0.033, -0.005],
      [0.012, -0.018],
      [-0.012, -0.017],
      [-0.031, -0.009],
    ],
    0.011,
    ink,
    0.007,
  );
  surprise.oval(0, -0.005, 0.015, 0.02, 0.011, ink, 10);
  lips.attach(smile);
  surprise.attach(oh);
  oh.visible = false;
  return { gaze, brow, smile, oh };
}

function cap(head, c, female) {
  const hat = group(head, 'folded cap', 0, 0.103, -0.007);
  const crown = new Sheet();
  const direction = female ? 1 : -1;
  const flip = (points) => points.map(([x, y]) => [direction * x, y]);
  const peak = flip([
    [-0.186, 0.003],
    [-0.119, 0.171],
    [-0.049, 0.304],
    [0.054, 0.397],
    [0.175, 0.436],
    [0.222, 0.425],
    [0.17, 0.369],
    [0.118, 0.293],
    [0.106, 0.208],
    [0.17, 0.046],
    [0.183, 0.003],
  ]);
  crown.cut(peak, 0.043, c.cap, 0.09);
  crown.cut(
    flip([
      [-0.187, 0.004],
      [-0.118, 0.172],
      [-0.05, 0.305],
      [0.055, 0.396],
      [0.174, 0.435],
      [0.029, 0.301],
      [-0.02, 0.162],
      [-0.035, 0.031],
    ]),
    0.048,
    c.capFold,
    0.008,
  );
  crown.cut(
    flip([
      [0.016, 0.278],
      [0.054, 0.397],
      [0.173, 0.435],
      [0.118, 0.383],
    ]),
    0.052,
    c.cap,
    0.008,
  );
  crown.cut(
    flip([
      [0.107, 0.21],
      [0.117, 0.291],
      [0.173, 0.369],
      [0.155, 0.275],
      [0.168, 0.221],
      [0.135, 0.185],
    ]),
    0.037,
    c.capFold,
    0.014,
  );
  crown.cut(
    [
      [-0.197, 0.016],
      [-0.079, 0.039],
      [0.048, 0.051],
      [0.169, 0.048],
      [0.2, 0.008],
      [0.177, -0.009],
      [0.039, 0.004],
      [-0.088, -0.009],
      [-0.185, -0.04],
    ],
    0.08,
    c.band,
    0.085,
  );
  crown.cut(
    [
      [-0.182, -0.027],
      [-0.079, 0.0],
      [0.041, 0.013],
      [0.179, -0.001],
      [0.177, -0.009],
      [0.039, 0.004],
      [-0.088, -0.009],
      [-0.185, -0.04],
    ],
    0.083,
    gold,
    0.007,
  );
  crown.cut(
    flip([
      [0.215, 0.423],
      [0.228, 0.431],
      [0.251, 0.416],
      [0.235, 0.398],
      [0.215, 0.399],
      [0.204, 0.41],
    ]),
    0.049,
    gold,
    0.035,
  );
  crown.attach(hat);
  return hat;
}

function assemble(root, variant) {
  const female = variant === 'female',
    c = palette[variant];
  const body = group(root, 'paper marionette');
  const legs = [-1, 1].map((side) => leg(body, side, c));
  const arms = [-1, 1].map((side) => arm(body, side, c));
  foldedCoat(body, c, female);
  const neck = new Sheet();
  neck.cut(
    [
      [-0.042, 0.966],
      [0.03, 0.968],
      [0.056, 1.05],
      [-0.058, 1.053],
    ],
    0.014,
    c.skin,
    0.041,
  );
  neck.attach(body);
  const head = group(body, 'folded face', 0, 1.115, 0.013);
  return { body, legs, arms, head, ...face(head, c, female), hat: cap(head, c, female) };
}

export function buildPuppet(variant = 'female') {
  const root = new T.Group();
  root.name = 'Village elf';
  let type,
    rig,
    previous,
    phase = 0,
    turn = 0;

  function setVariant(value) {
    const next = value === 'male' ? 'male' : 'female';
    if (type === next) return;
    if (rig) {
      root.remove(rig.body);
      rig.body.traverse((part) => {
        if (part.isMesh) part.geometry.dispose();
      });
    }
    type = next;
    rig = assemble(root, type);
    animate(previous ?? 0, 0);
  }

  function animate(time, speed = 0, reaction = '', elapsed = Infinity, reducedMotion = false) {
    const dt = previous == null ? 0 : T.MathUtils.clamp(time - previous, 0, 0.1);
    previous = time;
    const motion = reducedMotion ? 0 : 1;
    const walk = motion * Math.min(1, Math.abs(speed) * 2.8);
    phase += dt * Math.min(15, 4 + Math.abs(speed) * 7.6) * walk;
    const targetTurn = Math.sign(speed) * walk * 0.74;
    turn += (targetTurn - turn) * (1 - Math.exp(-dt * 9));
    const age = Math.max(0, elapsed);
    const mood = Number.isFinite(age) ? Math.max(0, 1 - age / 1.75) : 0;
    const recoil = reaction === 'locked' ? mood : 0;
    const joy = reaction === 'celebrate' || reaction === 'enter' ? mood : 0;
    const inspect = reaction === 'curious' ? mood : 0;
    const wave = joy && motion ? Math.sin(age * 12) * joy : 0;
    const bob = Math.sin(time * 1.32 + 0.37) * (1 - walk) * motion;
    const swing = Math.sin(phase) * walk;
    const { body, legs, arms, head, gaze, brow, smile, oh, hat } = rig;
    body.position.y = 0.009 * bob + Math.abs(swing) * 0.035 + Math.abs(wave) * 0.105;
    body.rotation.set(
      0.07 * walk - 0.09 * recoil,
      (turn + 0.058 * bob) * motion,
      0.027 * swing + 0.006 * bob - 0.06 * recoil,
    );
    head.rotation.set(
      0.03 * bob - 0.12 * joy + 0.097 * inspect,
      -0.18 * inspect + Math.sin(time * 0.6) * 0.097 * motion,
      -0.23 * inspect + 0.047 * bob + 0.12 * recoil,
    );
    hat.rotation.z = 0.023 * swing + 0.026 * bob - 0.075 * joy;
    const blink = (time + 0.85) % 4.27;
    const lids = !motion || blink > 0.15 ? 1 : 0.09 + (0.91 * Math.abs(blink - 0.075)) / 0.075;
    gaze.scale.y = lids * (1 + 0.27 * recoil - 0.25 * joy);
    brow.position.y = 0.061 + 0.024 * recoil + 0.014 * inspect + 0.01 * joy;
    oh.visible = recoil > 0.35;
    smile.visible = !oh.visible;
    smile.scale.set(1 + 0.2 * joy, 1 + 0.22 * joy, 1);
    for (let i = 0; i < 2; i++) {
      const sign = i ? 1 : -1,
        step = swing * sign;
      legs[i].thigh.rotation.x = step * 0.54;
      legs[i].thigh.rotation.z = sign * (0.068 + 0.14 * joy + 0.08 * recoil) + step * 0.21;
      legs[i].calf.rotation.x = -Math.max(0, step) * 0.63;
      legs[i].calf.rotation.z = -step * 0.26;
      legs[i].foot.rotation.z = step * 0.12;
      arms[i].shoulder.rotation.z =
        sign * (0.19 + 1.57 * joy + 0.46 * recoil + (i === 0 ? 0.82 * inspect : 0)) - 0.29 * step;
      arms[i].shoulder.rotation.x = -0.29 * step - 0.17 * inspect - 0.15 * recoil;
      arms[i].elbow.rotation.z =
        sign * (0.11 + 0.17 * Math.max(0, step) + 0.46 * joy + 0.12 * wave + 0.49 * inspect);
    }
  }

  setVariant(variant);
  return { root, animate, setVariant };
}
