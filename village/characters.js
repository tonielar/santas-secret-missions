import * as T from './vendor/three.module.min.js';

// Each articulated paper assembly has one vertex-coloured mesh. This keeps the
// little cuffs, cut-paper cheeks and other details from adding draw calls.
const paper = new T.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
  side: T.DoubleSide,
});
const pigment = new Map();
const tau = Math.PI * 2;

function colour(hex) {
  if (!pigment.has(hex)) pigment.set(hex, new T.Color(hex));
  return pigment.get(hex);
}

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new T.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

class PaperAssembly {
  constructor() {
    this.points = [];
    this.colours = [];
  }

  tri(a, b, c, hex, shade = 1) {
    this.points.push(...a, ...b, ...c);
    const rgb = colour(hex);
    for (let i = 0; i < 3; i++) this.colours.push(rgb.r * shade, rgb.g * shade, rgb.b * shade);
  }

  // A stack of cut ellipses. Off-centre rings give the hat its bent tip and
  // the boots their upturned toes. Rows are [height, x-radius, z-radius, x, z].
  rings(x, y, z, rows, hex, sides = 12) {
    const vertices = rows.map(([h, rx, rz, cx = 0, cz = 0]) =>
      Array.from({ length: sides }, (_, i) => {
        const angle = ((i + 0.5) * tau) / sides;
        return [x + cx + Math.sin(angle) * rx, y + h, z + cz + Math.cos(angle) * rz];
      }),
    );
    vertices.forEach((ring, row) => {
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        const centre = [x + (rows[row][3] || 0), y + rows[row][0], z + (rows[row][4] || 0)];
        if (row === 0) this.tri(centre, ring[j], ring[i], hex);
        if (row === rows.length - 1) this.tri(centre, ring[i], ring[j], hex);
        if (row === 0) continue;
        const lower = vertices[row - 1];
        const shade = 1 - ((i + 1) % 3) * 0.016;
        this.tri(lower[i], lower[j], ring[i], hex, shade);
        this.tri(lower[j], ring[j], ring[i], hex, shade);
      }
    });
  }

  pebble(x, y, z, rx, ry, rz, hex, sides = 12) {
    this.rings(
      x,
      y,
      z,
      [
        [-ry, rx * 0.12, rz * 0.12],
        [-ry * 0.64, rx * 0.77, rz * 0.77],
        [0, rx, rz],
        [ry * 0.7, rx * 0.74, rz * 0.74],
        [ry, rx * 0.11, rz * 0.11],
      ],
      hex,
      sides,
    );
  }

  // A creased polygon card with exposed darkened paper edges. Its silhouette
  // can be concave, so build the face with Three's polygon triangulator.
  cut(outline, z, thickness, hex, crease = 0) {
    const face = outline.map(([x, y]) => [x, y, z + crease * x]);
    const back = face.map(([x, y, depth]) => [x, y, depth - thickness]);
    const contour = outline.map(([x, y]) => new T.Vector2(x, y));
    for (const [a, b, c] of T.ShapeUtils.triangulateShape(contour, [])) {
      this.tri(face[a], face[b], face[c], hex);
      this.tri(back[c], back[b], back[a], hex, 0.75);
    }
    face.forEach((p, i) => {
      const j = (i + 1) % face.length;
      this.tri(p, back[i], face[j], hex, 0.76);
      this.tri(face[j], back[i], back[j], hex, 0.76);
    });
  }

  rect(x, y, z, w, h, thick, hex) {
    this.cut(
      [
        [x - w / 2, y - h / 2],
        [x + w / 2, y - h / 2],
        [x + w / 2, y + h / 2],
        [x - w / 2, y + h / 2],
      ],
      z,
      thick,
      hex,
    );
  }

  attach(parent) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(this.points, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(this.colours, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new T.Mesh(geometry, paper);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }
}

const red = '#b93937',
  scarlet = '#db4c3b',
  ivory = '#fff1d6';
const pine = '#276b57',
  darkPine = '#214c45',
  brass = '#eeb459';
const boot = '#493932',
  ink = '#392d36',
  rose = '#ed8675';

function addCoat(body, santa) {
  const sheet = new PaperAssembly();
  const width = santa ? 0.47 : 0.33;
  const hem = santa ? 0.42 : 0.48;
  sheet.rings(
    0,
    0,
    0,
    [
      [hem, width * 0.9, width * 0.73],
      [hem + 0.09, width, width * 0.8],
      [0.78, width * 1.01, width * 0.8],
      [1.04, width * 0.84, width * 0.66],
      [1.23, width * 0.54, width * 0.5],
    ],
    santa ? red : pine,
  );
  sheet.rings(
    0,
    hem,
    0,
    [
      [-0.012, width * 0.91, width * 0.75],
      [0.07, width * 1.01, width * 0.81],
    ],
    santa ? ivory : darkPine,
  );
  sheet.rings(
    0,
    0.68,
    0,
    [
      [0, width * 1.025, width * 0.824],
      [0.097, width * 1.027, width * 0.825],
    ],
    santa ? boot : '#833c30',
  );
  const beltDepth = width * 0.825;
  sheet.rect(0, 0.73, beltDepth + 0.008, 0.151, 0.115, 0.035, brass);
  sheet.rect(0, 0.73, beltDepth + 0.012, 0.084, 0.061, 0.009, boot);
  sheet.rect(0.028, 0.732, beltDepth + 0.017, 0.068, 0.016, 0.008, brass);
  if (!santa) {
    sheet.rings(
      0,
      1.13,
      0,
      [
        [0, 0.239, 0.182],
        [0.12, 0.248, 0.201],
      ],
      scarlet,
    );
    sheet.cut(
      [
        [-0.16, 1.19],
        [-0.04, 1.19],
        [-0.12, 0.88],
        [-0.165, 0.91],
        [-0.185, 0.86],
        [-0.209, 0.91],
      ],
      0.232,
      0.024,
      red,
    );
    sheet.cut(
      [
        [-0.164, 1.03],
        [-0.088, 1.036],
        [-0.095, 1.009],
        [-0.171, 1.002],
      ],
      0.235,
      0.008,
      ivory,
    );
    sheet.pebble(0.022, 0.984, 0.219, 0.035, 0.035, 0.012, brass, 8);
    sheet.pebble(0.022, 0.861, 0.257, 0.03, 0.03, 0.012, brass, 8);
  }
  sheet.attach(body);
}

function addLeg(body, side, santa) {
  const leg = joint(body, 'folded boot and stocking', side * (santa ? 0.23 : 0.153), 0.51, 0.02);
  const sheet = new PaperAssembly();
  const width = santa ? 0.126 : 0.081;
  sheet.rings(
    0,
    0,
    0,
    [
      [-0.36, width, width],
      [0.005, width * 1.1, width * 1.1],
    ],
    santa ? '#6a514b' : '#c95746',
    8,
  );
  if (!santa)
    for (const y of [-0.33, -0.22, -0.11]) {
      sheet.rings(
        0,
        y,
        0,
        [
          [0, width * 1.095, width * 1.095],
          [0.049, width * 1.11, width * 1.11],
        ],
        ivory,
        8,
      );
    }
  const w = santa ? 0.158 : 0.12;
  sheet.rings(
    0,
    -0.51,
    0.006,
    [
      [0.015, w * 0.98, 0.179, 0, 0.066],
      [0.07, w * 1.02, 0.194, 0, 0.078],
      [0.138, w * 0.88, 0.17, 0, 0.073],
      [0.192, w * 0.71, 0.115],
    ],
    santa ? boot : darkPine,
    10,
  );
  sheet.rings(
    0,
    -0.51,
    0.012,
    [
      [0.019, w * 1.01, 0.186, 0, 0.065],
      [0.05, w * 1.045, 0.197, 0, 0.073],
    ],
    '#594036',
    10,
  );
  if (!santa) {
    // An upturned pointed toe, cut from a folded strip.
    sheet.rings(
      0,
      -0.51,
      0.197,
      [
        [0.04, 0.088, 0.067],
        [0.09, 0.082, 0.079, 0, 0.018],
        [0.148, 0.033, 0.04, 0, 0.071],
        [0.199, 0.008, 0.01, 0, 0.088],
      ],
      darkPine,
      8,
    );
  }
  sheet.attach(leg);
  return leg;
}

function addArm(body, side, santa) {
  const arm = joint(body, 'paper sleeve and mitten', side * (santa ? 0.343 : 0.244), 1.065, 0);
  const sheet = new PaperAssembly();
  const w = santa ? 0.137 : 0.097;
  sheet.rings(
    0,
    0,
    0,
    [
      [-0.34, w * 0.84, w * 0.9],
      [-0.115, w * 1.08, w],
      [0.045, w * 0.82, w * 0.81],
    ],
    santa ? scarlet : pine,
    10,
  );
  sheet.rings(
    0,
    -0.37,
    0,
    [
      [-0.01, w * 0.93, w * 0.94],
      [0.064, w * 0.99, w * 0.97],
    ],
    ivory,
    10,
  );
  sheet.pebble(0, -0.424, 0.002, w * 0.85, 0.099, w * 0.77, santa ? darkPine : red, 10);
  sheet.pebble(-side * w * 0.53, -0.398, 0.046, 0.042, 0.055, 0.038, santa ? darkPine : red, 8);
  sheet.attach(arm);
  return arm;
}

function addFace(head, santa) {
  const sheet = new PaperAssembly();
  const skin = santa ? '#f2b892' : '#c98a65';
  const hair = santa ? '#f6e7cb' : '#57382e';
  sheet.rings(
    0,
    0,
    0,
    [
      [-0.238, 0.107, 0.13],
      [-0.19, 0.235, 0.217],
      [-0.06, 0.315, 0.266],
      [0.071, 0.333, 0.282],
      [0.18, 0.301, 0.25],
      [0.243, 0.205, 0.16],
    ],
    skin,
    14,
  );
  for (const side of [-1, 1]) {
    if (santa) {
      sheet.pebble(side * 0.313, -0.005, -0.015, 0.073, 0.106, 0.075, skin, 10);
    } else {
      const ear = [
        [0.249, -0.095],
        [0.344, -0.05],
        [0.474, 0.135],
        [0.327, 0.095],
        [0.263, 0.056],
      ];
      sheet.cut(
        ear.map(([x, y]) => [x * side, y]),
        0.037,
        0.105,
        skin,
        side * 0.085,
      );
      sheet.cut(
        [
          [0.33, -0.025],
          [0.423, 0.094],
          [0.331, 0.062],
        ].map(([x, y]) => [x * side, y]),
        0.103,
        0.01,
        rose,
      );
    }
    sheet.pebble(side * 0.211, -0.049, 0.204, 0.068, 0.031, 0.018, rose, 12);
  }
  sheet.pebble(
    0,
    0.014,
    0.286,
    santa ? 0.091 : 0.065,
    santa ? 0.076 : 0.049,
    0.069,
    santa ? '#eaa086' : '#d99a77',
    10,
  );
  if (santa) {
    // A zig-zag bottom edge and a raised central leaf suggest a folded beard.
    sheet.cut(
      [
        [-0.295, 0.021],
        [-0.312, -0.165],
        [-0.242, -0.15],
        [-0.203, -0.3],
        [-0.15, -0.272],
        [-0.085, -0.371],
        [0, -0.405],
        [0.088, -0.36],
        [0.149, -0.292],
        [0.197, -0.309],
        [0.23, -0.173],
        [0.285, -0.191],
        [0.31, 0.026],
        [0.216, -0.025],
        [0.165, -0.074],
        [-0.164, -0.074],
        [-0.218, -0.021],
      ],
      0.243,
      0.156,
      hair,
    );
    sheet.cut(
      [
        [-0.191, -0.168],
        [-0.124, -0.278],
        [-0.08, -0.255],
        [0.008, -0.369],
        [0.079, -0.265],
        [0.122, -0.258],
        [0.201, -0.153],
        [0.09, -0.186],
        [-0.052, -0.177],
      ],
      0.261,
      0.019,
      '#fff3dc',
    );
    for (const side of [-1, 1]) {
      sheet.cut(
        [
          [0.008, -0.031],
          [0.075, -0.019],
          [0.142, -0.035],
          [0.212, -0.068],
          [0.23, -0.047],
          [0.219, -0.105],
          [0.164, -0.128],
          [0.093, -0.116],
          [0.012, -0.074],
        ].map(([x, y]) => [side * x, y]),
        0.326,
        0.031,
        ivory,
        -side * 0.22,
      );
    }
  } else {
    for (const side of [-1, 1]) {
      const lock = [
        [0.201, 0.153],
        [0.296, 0.2],
        [0.328, 0.129],
        [0.319, 0.013],
        [0.273, -0.02],
        [0.25, 0.088],
      ];
      sheet.cut(
        lock.map(([x, y]) => [side * x, y]),
        0.15,
        0.12,
        hair,
        -side * 0.1,
      );
    }
    sheet.cut(
      [
        [-0.264, 0.168],
        [-0.211, 0.102],
        [-0.184, 0.129],
        [-0.131, 0.072],
        [-0.065, 0.126],
        [0.016, 0.088],
        [0.062, 0.143],
        [0.113, 0.121],
        [0.19, 0.166],
        [0.231, 0.224],
        [-0.22, 0.208],
      ],
      0.245,
      0.065,
      hair,
    );
    // A constellation of small snipped freckles on each cheek.
    for (const side of [-1, 1])
      for (let n = 0; n < 3; n++) {
        sheet.pebble(
          side * (0.155 + 0.025 * n),
          -0.043 + Math.sin(n * 2) * 0.011,
          0.246 - 0.012 * n,
          0.008,
          0.008,
          0.006,
          '#a25f4e',
          6,
        );
      }
  }
  sheet.attach(head);

  const eyes = joint(head, 'blinking eyes', 0, 0.076, 0.249);
  const brow = joint(head, 'eyebrows', 0, 0.124, 0.245);
  const eyeSheet = new PaperAssembly(),
    browSheet = new PaperAssembly();
  for (const side of [-1, 1]) {
    eyeSheet.pebble(side * 0.123, 0, 0, 0.03, 0.046, 0.018, ink, 12);
    eyeSheet.pebble(side * 0.123 - 0.006, 0.015, 0.016, 0.009, 0.01, 0.006, '#fff8dc', 8);
    browSheet.cut(
      [
        [0.078, 0.007],
        [0.098, 0.017],
        [0.151, 0.024],
        [0.18, 0.013],
        [0.168, 0.002],
        [0.111, 0.003],
      ].map(([x, y]) => [x * side, y]),
      0.019,
      0.015,
      hair,
      -side * 0.05,
    );
  }
  eyeSheet.attach(eyes);
  browSheet.attach(brow);
  const mouth = joint(head, 'smile', 0, santa ? -0.11 : -0.093, santa ? 0.297 : 0.248);
  const smile = new PaperAssembly();
  smile.cut(
    [
      [-0.068, 0.017],
      [-0.054, -0.008],
      [-0.02, -0.025],
      [0.027, -0.026],
      [0.056, -0.01],
      [0.072, 0.017],
      [0.041, 0.003],
      [0.013, -0.002],
      [-0.025, -0.003],
    ],
    0.009,
    0.012,
    ink,
  );
  smile.attach(mouth);
  const gasp = joint(head, 'surprised mouth', 0, santa ? -0.105 : -0.105, santa ? 0.301 : 0.248);
  const oh = new PaperAssembly();
  oh.pebble(0, 0, 0.004, 0.026, 0.036, 0.013, '#85483e', 10);
  oh.attach(gasp);
  gasp.visible = false;
  return { eyes, brow, mouth, gasp };
}

function addHat(head, santa) {
  const hat = joint(head, 'folded cap', 0, 0.19, -0.012);
  const sheet = new PaperAssembly();
  if (santa) {
    sheet.rings(
      0,
      0,
      0,
      [
        [0, 0.334, 0.288],
        [0.105, 0.318, 0.262, 0.015],
        [0.237, 0.266, 0.212, 0.067],
        [0.333, 0.166, 0.146, 0.159],
        [0.34, 0.1, 0.103, 0.254],
        [0.247, 0.036, 0.042, 0.331],
      ],
      scarlet,
      12,
    );
    sheet.rings(
      0,
      -0.024,
      0,
      [
        [0, 0.34, 0.283],
        [0.058, 0.357, 0.301],
        [0.125, 0.317, 0.273, 0.013],
      ],
      ivory,
      12,
    );
    sheet.pebble(0.34, 0.212, 0.01, 0.081, 0.09, 0.081, ivory, 10);
  } else {
    sheet.rings(
      0,
      0,
      0,
      [
        [0, 0.34, 0.28],
        [0.081, 0.314, 0.264],
        [0.211, 0.242, 0.202, -0.029],
        [0.337, 0.148, 0.138, -0.081],
        [0.417, 0.095, 0.084, -0.18],
        [0.437, 0.052, 0.051, -0.264],
        [0.393, 0.013, 0.015, -0.322],
      ],
      pine,
      10,
    );
    sheet.rings(
      0,
      -0.025,
      0,
      [
        [0, 0.34, 0.29],
        [0.085, 0.341, 0.288],
        [0.106, 0.32, 0.271],
      ],
      red,
      12,
    );
    sheet.rings(
      0,
      0.043,
      0,
      [
        [0, 0.345, 0.29],
        [0.027, 0.344, 0.291],
      ],
      brass,
      12,
    );
    sheet.pebble(-0.325, 0.389, 0.003, 0.05, 0.052, 0.05, brass, 8);
    sheet.cut(
      [
        [-0.182, 0.103],
        [-0.227, 0.215],
        [-0.182, 0.19],
        [-0.172, 0.238],
        [-0.114, 0.13],
      ],
      0.212,
      0.024,
      darkPine,
    );
    sheet.pebble(-0.156, 0.118, 0.223, 0.032, 0.031, 0.017, scarlet, 8);
  }
  sheet.attach(hat);
  return hat;
}

export function buildCharacter(type) {
  const santa = type === 'santa';
  const root = new T.Group();
  root.name = santa ? 'Santa' : 'Village elf';
  const scale = santa ? 1.065 : 0.804;
  const figure = joint(root, 'paper figure');
  figure.scale.setScalar(scale);
  const body = joint(figure, 'body');
  addCoat(body, santa);
  const legs = [-1, 1].map((side) => addLeg(body, side, santa));
  const arms = [-1, 1].map((side) => addArm(body, side, santa));
  const head = joint(body, 'head', 0, 1.41, 0);
  const face = addFace(head, santa);
  const hat = addHat(head, santa);
  let previousTime,
    stride = 0,
    turn = 0;

  function animate(time, speed = 0, reaction = '', elapsed = Infinity, reducedMotion = false) {
    const dt = previousTime === undefined ? 0 : T.MathUtils.clamp(time - previousTime, 0, 0.09);
    previousTime = time;
    const walking = santa || reducedMotion ? 0 : Math.min(1, Math.abs(speed) * 2.8);
    const side = Math.sign(speed);
    stride += dt * (3.9 + Math.min(2, Math.abs(speed)) * 4.9) * walking;
    const step = Math.sin(stride);
    const targetTurn = side * walking * 1.04;
    turn += (targetTurn - turn) * (1 - Math.exp(-dt * 8));
    const age = Math.max(0, elapsed);
    const mood = Number.isFinite(age) ? Math.max(0, 1 - age / 1.8) ** 0.63 : 0;
    const locked = reaction === 'locked' ? mood : 0;
    const happy = reaction === 'enter' || reaction === 'celebrate' ? mood : 0;
    const curious = reaction === 'curious' ? mood : 0;
    const live = reducedMotion ? 0 : 1;
    const idle = Math.sin(time * 1.4 + (santa ? 0.5 : 2)) * (1 - walking) * live;
    const jump = happy && live ? Math.abs(Math.sin(age * 8)) * happy * 0.17 : 0;
    figure.rotation.y = reducedMotion ? 0 : turn;
    body.position.y = (Math.abs(step) * walking * 0.052 + jump) * live;
    body.rotation.z = idle * 0.012 + step * walking * 0.055 + curious * 0.115 + locked * 0.08;
    body.rotation.x = walking * 0.065 - happy * 0.11 - locked * 0.105;
    head.rotation.y =
      Math.sin(time * 0.65 + (santa ? 1 : 0)) * 0.13 * (1 - walking) * live +
      (locked ? Math.sin(age * 15) * locked * 0.14 * live : 0) -
      curious * 0.19;
    head.rotation.z = idle * 0.037 - curious * 0.28 + locked * 0.09;
    head.rotation.x = idle * 0.023 + curious * 0.035 - happy * 0.15 - locked * 0.11;
    const blink = (((time + (santa ? 1.18 : 2.62)) % 4.74) + 4.74) % 4.74;
    const lid = reducedMotion || blink > 0.16 ? 1 : 0.11 + (0.89 * Math.abs(blink - 0.08)) / 0.08;
    face.eyes.scale.y = lid * (1 + locked * 0.27 - happy * 0.28);
    face.brow.position.y = 0.124 + locked * 0.046 + curious * 0.029 + happy * 0.021;
    face.gasp.visible = locked > 0.36;
    face.mouth.visible = !face.gasp.visible;
    face.mouth.scale.set(1 + happy * 0.21, 1 + happy * 0.29, 1);
    hat.rotation.z = idle * 0.012 + step * walking * 0.025 - happy * 0.062;
    for (let i = 0; i < 2; i++) {
      const sign = i === 0 ? -1 : 1;
      legs[i].rotation.x = sign * step * walking * 0.56;
      legs[i].rotation.z = sign * (happy * 0.14 + locked * 0.04);
      const welcomeWave = santa && i === 1 ? 0.5 + idle * 0.29 : 0;
      arms[i].rotation.z =
        sign * (0.2 + welcomeWave + happy * 1.83 + locked * 0.49 + (i === 0 ? curious * 1.13 : 0));
      arms[i].rotation.x =
        -sign * step * walking * 0.54 - 0.18 - curious * 0.18 - locked * 0.34 - happy * 0.1;
    }
  }
  animate(0);
  return { root, animate };
}
