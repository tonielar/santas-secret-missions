import * as T from './vendor/three.module.min.js';
const pine = new T.MeshStandardMaterial({ color: '#3c6258', roughness: 1 }),
  brass = new T.MeshStandardMaterial({ color: '#d5a959', roughness: 1 });
const lit = new T.MeshStandardMaterial({
  color: '#ffe3a0',
  emissive: '#ffc476',
  emissiveIntensity: 0.65,
  roughness: 1,
});
const surface = new T.MeshStandardMaterial({ color: '#f7eee0', roughness: 1 });
function piece(root, g, m, x, y, z) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  root.add(o);
  return o;
}
function pole(root, x, z, height) {
  piece(root, new T.CylinderGeometry(0.05, 0.075, height, 7), pine, x, height * 0.5, z);
  piece(root, new T.CylinderGeometry(0.17, 0.23, 0.29, 8), pine, x, 0.145, z);
  piece(root, new T.CylinderGeometry(0.12, 0.12, 0.09, 8), brass, x, height - 0.19, z);
}
export function streetDetails(index, lang) {
  const root = new T.Group(),
    props = [];
  if (index === 0 || index === 6 || index === 12) {
    for (const side of [-1, 1]) {
      const x = side * 6.35,
        z = 2.3;
      pole(root, x, z, 4.9);
      const ends = [
        new T.Vector3(x, 4.88, z),
        new T.Vector3(side * 4.55, 3.98, 1.91),
        new T.Vector3(side * 2.65, 4.5, 1.55),
      ];
      const curve = new T.QuadraticBezierCurve3(...ends);
      piece(root, new T.TubeGeometry(curve, 14, 0.019, 4, false), pine, 0, 0, 0);
      for (let n = 0; n < 7; n++) {
        const p = curve.getPoint((n + 0.3) / 7);
        piece(root, new T.CylinderGeometry(0.032, 0.038, 0.09, 5), brass, p.x, p.y - 0.04, p.z);
        piece(root, new T.SphereGeometry(0.082, 6, 5), lit, p.x, p.y - 0.13, p.z).scale.y = 1.36;
      }
    }
  }
  for (const side of index === 0 ? [-1, 1] : [index % 2 ? 1 : -1]) {
    const lantern = new T.Group();
    lantern.position.set(side * (index === 0 ? 5.18 : 4.4), 0, 3.85);
    root.add(lantern);
    pole(lantern, 0, 0, 2.12);
    piece(lantern, new T.CylinderGeometry(0.22, 0.14, 0.12, 4), pine, 0, 2.13, 0).rotation.y =
      Math.PI / 4;
    const glow = piece(lantern, new T.CylinderGeometry(0.22, 0.16, 0.42, 4), lit.clone(), 0, 2.37, 0);
    glow.rotation.y = Math.PI / 4;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI * 0.5;
      piece(
        lantern,
        new T.CylinderGeometry(0.018, 0.018, 0.42, 5),
        pine,
        Math.cos(a) * 0.19,
        2.37,
        Math.sin(a) * 0.19,
      );
    }
    piece(lantern, new T.ConeGeometry(0.36, 0.25, 4), pine, 0, 2.7, 0).rotation.y = Math.PI / 4;
    piece(lantern, new T.ConeGeometry(0.26, 0.16, 4), surface, 0, 2.77, 0).rotation.y = Math.PI / 4;
    lantern.userData.bulb = glow.material;
    props.push({ object: lantern, kind: 'lantern' });
  }
  // Slotted holly leaves and paper berries break up the edges of the snowy street.
  const leafStock = ['#46765f', '#678d73', '#8fa78b'].map(
    (color) => new T.MeshStandardMaterial({ color, side: T.DoubleSide, roughness: 1 }),
  );
  const berries = new T.MeshStandardMaterial({ color: '#a74338', roughness: 1 });
  const drift = new T.MeshStandardMaterial({ color: index === 3 ? '#dfedf1' : '#eeeedd', roughness: 1 });
  const folded = new T.BufferGeometry();
  folded.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        0, 0, 0, -0.14, 0.21, 0, 0, 0.25, 0.055, -0.14, 0.21, 0, 0, 0.5, 0, 0, 0.25, 0.055, 0, 0.5, 0,
        0.15, 0.24, 0, 0, 0.25, 0.055, 0.15, 0.24, 0, 0, 0, 0, 0, 0.25, 0.055,
      ],
      3,
    ),
  );
  folded.computeVertexNormals();
  for (const [x, z, size] of [
    [-4.15, 3.9, 1.1],
    [4.7, 4.3, 1.5],
    [-5.9, 4.5, 1.4],
    [4.2, -1.6, 1.3],
  ]) {
    const tuft = new T.Group();
    tuft.position.set(x, 0.02, z);
    tuft.scale.setScalar(size);
    root.add(tuft);
    piece(tuft, new T.IcosahedronGeometry(1, 0), drift, 0, 0.07, 0).scale.set(0.43, 0.15, 0.31);
    for (let i = 0; i < 7; i++) {
      const t = i * 2.4,
        leaf = piece(tuft, folded, leafStock[i % 3], Math.sin(t) * 0.13, 0.06, Math.cos(t) * 0.11);
      leaf.rotation.set(Math.cos(t) * 0.62, t, Math.sin(t) * 0.92);
    }
    if (![3, 7, 11].includes(index))
      for (let i = 0; i < 3; i++)
        piece(
          tuft,
          new T.IcosahedronGeometry(0.071, 0),
          berries,
          (i - 1) * 0.09,
          0.22 + (i % 2) * 0.06,
          0.15,
        );
  }
  if (index === 0) {
    const ornamentStock = ['#b83b37', '#ecc368', '#efdac7'].map(
      (color) => new T.MeshStandardMaterial({ color, roughness: 1 }),
    );
    // A decorated cut-card spruce stands just beyond the right-hand lantern.
    const tree = new T.Group();
    tree.position.set(5.66, -0.04, 1.36);
    root.add(tree);
    props.push({ object: tree, kind: 'tree' });
    const green = new T.MeshStandardMaterial({ color: '#416e5b', roughness: 1, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const y = 0.28 + i * 0.69,
        r = 1.06 - i * 0.21;
      const layer = piece(tree, new T.ConeGeometry(r, 1.58, 7), green, 0, y + 0.75, 0);
      layer.rotation.y = 0.21 + i * 0.31;
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3 + i * 0.39;
        piece(
          tree,
          new T.IcosahedronGeometry(0.081, 0),
          ornamentStock[(j + i) % 3],
          Math.sin(a) * r * 0.83,
          y + 0.22,
          Math.cos(a) * r * 0.83,
        );
      }
    }
    const topper = piece(tree, new T.OctahedronGeometry(0.24), brass, 0, 4.02, 0);
    topper.scale.set(0.86, 1.4, 0.47);
  }
  return { root, props };
}
