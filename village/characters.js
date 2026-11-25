import * as T from './vendor/three.module.min.js';

// Each articulated paper assembly has one vertex-coloured mesh. This keeps the
// little cuffs, cut-paper cheeks and other details from adding draw calls.
const paper = new T.MeshLambertMaterial({
  vertexColors: true, flatShading: true,
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
        const angle = (i + .5) * tau / sides;
        return [x + cx + Math.sin(angle) * rx, y + h, z + cz + Math.cos(angle) * rz];
      })
    );
    vertices.forEach((ring, row) => {
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        const centre = [x + (rows[row][3] || 0), y + rows[row][0], z + (rows[row][4] || 0)];
        if (row === 0) this.tri(centre, ring[j], ring[i], hex);
        if (row === rows.length - 1) this.tri(centre, ring[i], ring[j], hex);
        if (row === 0) continue;
        const lower = vertices[row - 1];
        const shade = 1 - ((i + 1) % 3) * .016;
        this.tri(lower[i], lower[j], ring[i], hex, shade);
        this.tri(lower[j], ring[j], ring[i], hex, shade);
      }
    });
  }

  pebble(x, y, z, rx, ry, rz, hex, sides = 12) {
    this.rings(x, y, z, [
      [-ry, rx * .12, rz * .12],
      [-ry * .64, rx * .77, rz * .77],
      [0, rx, rz],
      [ry * .70, rx * .74, rz * .74],
      [ry, rx * .11, rz * .11],
    ], hex, sides);
  }

  // A creased polygon card with exposed darkened paper edges. Its silhouette
  // can be concave, so build the face with Three's polygon triangulator.
  cut(outline, z, thickness, hex, crease = 0) {
    const face = outline.map(([x, y]) => [x, y, z + crease * x]);
    const back = face.map(([x, y, depth]) => [x, y, depth - thickness]);
    const contour = outline.map(([x, y]) => new T.Vector2(x, y));
    for (const [a, b, c] of T.ShapeUtils.triangulateShape(contour, [])) {
      this.tri(face[a], face[b], face[c], hex);
      this.tri(back[c], back[b], back[a], hex, .75);
    }
    face.forEach((p, i) => {
      const j = (i + 1) % face.length;
      this.tri(p, back[i], face[j], hex, .76);
      this.tri(face[j], back[i], back[j], hex, .76);
    });
  }

  rect(x, y, z, w, h, thick, hex) {
    this.cut([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2],
      [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], z, thick, hex);
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

const red = '#b93937', scarlet = '#db4c3b', ivory = '#fff1d6';
const pine = '#276b57', darkPine = '#214c45', brass = '#eeb459';
const boot = '#493932', ink = '#392d36', rose = '#ed8675';

function addCoat(body, santa) {
  const sheet = new PaperAssembly();
  const width = santa ? .47 : .33;
  const hem = santa ? .42 : .48;
  sheet.rings(0, 0, 0, [
    [hem, width * .9, width * .73], [hem + .09, width, width * .8],
    [.78, width * 1.01, width * .8], [1.04, width * .84, width * .66],
    [1.23, width * .54, width * .50],
  ], santa ? red : pine);
  sheet.rings(0, hem, 0, [[-.012, width * .91, width * .75],
    [.07, width * 1.01, width * .81]], santa ? ivory : darkPine);
  sheet.rings(0, .68, 0, [[0, width * 1.025, width * .824],
    [.097, width * 1.027, width * .825]], santa ? boot : '#833c30');
  const beltDepth = width * .825;
  sheet.rect(0, .73, beltDepth + .008, .151, .115, .035, brass);
  sheet.rect(0, .73, beltDepth + .012, .084, .061, .009, boot);
  sheet.rect(.028, .732, beltDepth + .017, .068, .016, .008, brass);
  if (!santa) {
    sheet.rings(0, 1.13, 0, [[0, .239, .182], [.120, .248, .201]], scarlet);
    sheet.cut([[-.16,1.19],[-.04,1.19],[-.12,.88],[-.165,.91],[-.185,.86],[-.209,.91]], .232,.024,red);
    sheet.cut([[-.164,1.03],[-.088,1.036],[-.095,1.009],[-.171,1.002]], .235,.008,ivory);
    sheet.pebble(.022, .984, .219, .035, .035, .012, brass, 8);
    sheet.pebble(.022, .861, .257, .030, .030, .012, brass, 8);
  }
  sheet.attach(body);
}

function addLeg(body, side, santa) {
  const leg = joint(body, 'folded boot and stocking', side * (santa ? .23 : .153), .51, .02);
  const sheet = new PaperAssembly();
  const width = santa ? .126 : .081;
  sheet.rings(0, 0, 0, [[-.36, width, width], [.005, width * 1.1, width * 1.1]],
    santa ? '#6a514b' : '#c95746', 8);
  if (!santa) for (const y of [-.33, -.22, -.11]) {
    sheet.rings(0, y, 0, [[0, width * 1.095, width * 1.095],
      [.049, width * 1.11, width * 1.11]], ivory, 8);
  }
  const w = santa ? .158 : .12;
  sheet.rings(0, -.51, .006, [[.015, w * .98, .179, 0, .066],
    [.07, w * 1.02, .194, 0, .078], [.138, w * .88, .17, 0, .073],
    [.192, w * .71, .115]], santa ? boot : darkPine, 10);
  sheet.rings(0,-.51,.012,[[.019, w * 1.01, .186,0,.065],[.050,w * 1.045,.197,0,.073]], '#594036',10);
  if (!santa) {
    // An upturned pointed toe, cut from a folded strip.
    sheet.rings(0, -.51, .197, [[.040,.088,.067],[.09,.082,.079,0,.018],
      [.148,.033,.040,0,.071],[.199,.008,.010,0,.088]], darkPine, 8);
  }
  sheet.attach(leg);
  return leg;
}

function addArm(body, side, santa) {
  const arm = joint(body, 'paper sleeve and mitten', side * (santa ? .343 : .244), 1.065, 0);
  const sheet = new PaperAssembly();
  const w = santa ? .137 : .097;
  sheet.rings(0, 0, 0, [[-.34, w * .84,w * .90],[-.115,w * 1.08,w],[.045,w * .82,w * .81]],
    santa ? scarlet : pine, 10);
  sheet.rings(0, -.37, 0, [[-.01, w * .93,w * .94],[.064,w * .99,w * .97]], ivory, 10);
  sheet.pebble(0,-.424,.002,w * .85,.099,w * .77,santa ? darkPine : red,10);
  sheet.pebble(-side * w * .53,-.398,.046,.042,.055,.038,santa ? darkPine : red,8);
  sheet.attach(arm);
  return arm;
}

function addFace(head, santa) {
  const sheet = new PaperAssembly();
  const skin = santa ? '#f2b892' : '#c98a65';
  const hair = santa ? '#f6e7cb' : '#57382e';
  sheet.rings(0, 0, 0,[[-.238,.107,.13],[-.19,.235,.217],[-.060,.315,.266],
    [.071,.333,.282],[.18,.301,.25],[.243,.205,.16]],skin,14);
  for (const side of [-1,1]) {
    if (santa) {
      sheet.pebble(side * .313, -.005, -.015, .073, .106,.075,skin,10);
    } else {
      const ear = [[.249,-.095],[.344,-.05],[.474,.135],[.327,.095],[.263,.056]];
      sheet.cut(ear.map(([x,y])=>[x*side,y]), .037,.105,skin,side*.085);
      sheet.cut([[.33,-.025],[.423,.094],[.331,.062]].map(([x,y])=>[x*side,y]), .103,.01,rose);
    }
    sheet.pebble(side * .211,-.049,.204,.068,.031,.018,rose,12);
  }
  sheet.pebble(0,.014,.286,santa ? .091 : .065,santa ? .076 : .049,.069,santa ? '#eaa086' : '#d99a77',10);
  if (santa) {
    // A zig-zag bottom edge and a raised central leaf suggest a folded beard.
    sheet.cut([[-.295,.021],[-.312,-.165],[-.242,-.15],[-.203,-.30],[-.15,-.272],
      [-.085,-.371],[0,-.405],[.088,-.36],[.149,-.292],[.197,-.309],[.23,-.173],
      [.285,-.191],[.31,.026],[.216,-.025],[.165,-.074],[-.164,-.074],[-.218,-.021]], .243,.156,hair);
    sheet.cut([[-.191,-.168],[-.124,-.278],[-.08,-.255],[.008,-.369],[.079,-.265],
      [.122,-.258],[.201,-.153],[.09,-.186],[-.052,-.177]], .261,.019,'#fff3dc');
    for (const side of [-1,1]) {
      sheet.cut([[.008,-.031],[.075,-.019],[.142,-.035],[.212,-.068],[.23,-.047],
        [.219,-.105],[.164,-.128],[.093,-.116],[.012,-.074]].map(([x,y])=>[side*x,y]),
        .326,.031,ivory,-side*.22);
    }
  } else {
    for (const side of [-1,1]) {
      const lock = [[.201,.153],[.296,.2],[.328,.129],[.319,.013],[.273,-.02],[.25,.088]];
      sheet.cut(lock.map(([x,y])=>[side*x,y]),.15,.12,hair,-side*.10);
    }
    sheet.cut([[-.264,.168],[-.211,.102],[-.184,.129],[-.131,.072],[-.065,.126],
      [.016,.088],[.062,.143],[.113,.121],[.190,.166],[.231,.224],[-.22,.208]],.245,.065,hair);
    // A constellation of small snipped freckles on each cheek.
    for (const side of [-1,1]) for (let n=0;n<3;n++) {
      sheet.pebble(side*(.155+.025*n),-.043+Math.sin(n*2)*.011,.246-.012*n,.008,.008,.006,'#a25f4e',6);
    }
  }
  sheet.attach(head);

  const eyes = joint(head,'blinking eyes',0,.076,.249);
  const brow = joint(head,'eyebrows',0,.124,.245);
  const eyeSheet = new PaperAssembly(), browSheet = new PaperAssembly();
  for (const side of [-1,1]) {
    eyeSheet.pebble(side * .123,0,0,.03,.046,.018,ink,12);
    eyeSheet.pebble(side * .123-.006,.015,.016,.009,.010,.006,'#fff8dc',8);
    browSheet.cut([[.078,.007],[.098,.017],[.151,.024],[.18,.013],[.168,.002],[.111,.003]]
      .map(([x,y])=>[x*side,y]),.019,.015,hair,-side*.05);
  }
  eyeSheet.attach(eyes);
  browSheet.attach(brow);
  const mouth = joint(head,'smile',0,santa ? -.110 : -.093,santa ? .297 : .248);
  const smile = new PaperAssembly();
  smile.cut([[-.068,.017],[-.054,-.008],[-.02,-.025],[.027,-.026],[.056,-.010],[.072,.017],
    [.041,.003],[.013,-.002],[-.025,-.003]],.009,.012,ink);
  smile.attach(mouth);
  const gasp = joint(head,'surprised mouth',0,santa ? -.105 : -.105,santa ? .301 : .248);
  const oh = new PaperAssembly();
  oh.pebble(0,0,.004,.026,.036,.013,'#85483e',10);
  oh.attach(gasp);
  gasp.visible = false;
  return { eyes, brow, mouth, gasp };
}

function addHat(head, santa) {
  const hat = joint(head,'folded cap',0,.19,-.012);
  const sheet = new PaperAssembly();
  if (santa) {
    sheet.rings(0,0,0,[[0,.334,.288],[.105,.318,.262,.015],[.237,.266,.212,.067],
      [.333,.166,.146,.159],[.34,.100,.103,.254],[.247,.036,.042,.331]],
      scarlet,12);
    sheet.rings(0,-.024,0,[[0,.34,.283],[.058,.357,.301],[.125,.317,.273,.013]],ivory,12);
    sheet.pebble(.34,.212,.01,.081,.09,.081,ivory,10);
  } else {
    sheet.rings(0,0,0,[[0,.34,.28],[.081,.314,.264],[.211,.242,.202,-.029],
      [.337,.148,.138,-.081],[.417,.095,.084,-.18],[.437,.052,.051,-.264],
      [.393,.013,.015,-.322]],pine,10);
    sheet.rings(0,-.025,0,[[0,.34,.29],[.085,.341,.288],[.106,.32,.271]],red,12);
    sheet.rings(0,.043,0,[[0,.345,.29],[.027,.344,.291]],brass,12);
    sheet.pebble(-.325,.389,.003,.05,.052,.05,brass,8);
    sheet.cut([[-.182,.103],[-.227,.215],[-.182,.19],[-.172,.238],[-.114,.13]],
      .212,.024,darkPine);
    sheet.pebble(-.156,.118,.223,.032,.031,.017,scarlet,8);
  }
  sheet.attach(hat);
  return hat;
}

export function buildCharacter(type) {
  const santa = type === 'santa';
  const root = new T.Group();
  root.name = santa ? 'Santa' : 'Village elf';
  const scale = santa ? 1.065 : .804;
  const figure = joint(root,'paper figure');
  figure.scale.setScalar(scale);
  const body = joint(figure,'body');
  addCoat(body,santa);
  const legs = [-1,1].map(side=>addLeg(body,side,santa));
  const arms = [-1,1].map(side=>addArm(body,side,santa));
  const head = joint(body,'head',0,1.41,0);
  const face = addFace(head,santa);
  const hat = addHat(head,santa);
  let previousTime, stride = 0, turn = 0;

  function animate(time, speed = 0, reaction = '', elapsed = Infinity, reducedMotion = false) {
    const dt = previousTime === undefined ? 0 : T.MathUtils.clamp(time - previousTime, 0, .09);
    previousTime = time;
    const walking = santa || reducedMotion ? 0 : Math.min(1,Math.abs(speed) * 2.8);
    const side = Math.sign(speed);
    stride += dt * (3.9 + Math.min(2, Math.abs(speed)) * 4.9) * walking;
    const step = Math.sin(stride);
    const targetTurn = side * walking * 1.04;
    turn += (targetTurn-turn) * (1-Math.exp(-dt*8));
    const age = Math.max(0,elapsed);
    const mood = Number.isFinite(age) ? Math.max(0,1-age/1.8) ** .63 : 0;
    const locked = reaction === 'locked' ? mood : 0;
    const happy = reaction === 'enter' || reaction === 'celebrate' ? mood : 0;
    const curious = reaction === 'curious' ? mood : 0;
    const live = reducedMotion ? 0 : 1;
    const idle = Math.sin(time*1.4 + (santa ? .5 : 2)) * (1-walking) * live;
    const jump = happy && live ? Math.abs(Math.sin(age*8))*happy*.17 : 0;
    figure.rotation.y = reducedMotion ? 0 : turn;
    body.position.y = (Math.abs(step)*walking*.052 + jump) * live;
    body.rotation.z = idle*.012 + step*walking*.055 + curious*.115 + locked*.08;
    body.rotation.x = walking*.065 - happy*.11 - locked*.105;
    head.rotation.y = Math.sin(time*.65 + (santa ? 1 : 0))*.13*(1-walking)*live
      + (locked ? Math.sin(age*15)*locked*.14*live : 0) - curious*.19;
    head.rotation.z = idle*.037 - curious*.28 + locked*.09;
    head.rotation.x = idle*.023 + curious*.035 - happy*.15 - locked*.11;
    const blink = ((time + (santa ? 1.18 : 2.62)) % 4.74 + 4.74) % 4.74;
    const lid = reducedMotion || blink>.16 ? 1 : .11+.89*Math.abs(blink-.08)/.08;
    face.eyes.scale.y = lid * (1 + locked*.27 - happy*.28);
    face.brow.position.y = .124 + locked*.046 + curious*.029 + happy*.021;
    face.gasp.visible = locked > .36;
    face.mouth.visible = !face.gasp.visible;
    face.mouth.scale.set(1+happy*.21,1+happy*.29,1);
    hat.rotation.z = idle*.012 + step*walking*.025 - happy*.062;
    for (let i=0;i<2;i++) {
      const sign = i===0 ? -1 : 1;
      legs[i].rotation.x = sign * step * walking*.56;
      legs[i].rotation.z = sign * (happy*.14 + locked*.04);
      const welcomeWave = santa && i===1 ? .5 + idle*.29 : 0;
      arms[i].rotation.z = sign * (.20 + welcomeWave + happy*1.83 + locked*.49 + (i===0 ? curious*1.13 : 0));
      arms[i].rotation.x = -sign*step*walking*.54 - .18 - curious*.18 - locked*.34 - happy*.10;
    }
  }
  animate(0);
  return {root, animate};
}
