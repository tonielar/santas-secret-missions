import * as T from './vendor/three.module.min.js';
const card = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, flatShading: true });
// Bake fixed folds into vertex-coloured sheets. Doors, handles and hit targets
// each keep their own local origin for independent animation and ray picking.
export function batchPaper(root, dynamic = []) {
  root.updateMatrixWorld(true);
  const anchors = new Set([root, ...dynamic.filter(Boolean)]);
  const collected = new Map();
  root.traverse((obj) => {
    if (
      !obj.isMesh ||
      Array.isArray(obj.material) ||
      obj.material.map ||
      obj.material.transparent ||
      obj.material.emissive?.getHex() ||
      !obj.material.color
    )
      return;
    let anchor = obj.parent;
    while (anchor && !anchors.has(anchor)) anchor = anchor.parent;
    if (!anchor) return;
    if (!collected.has(anchor)) collected.set(anchor, []);
    collected.get(anchor).push(obj);
  });
  for (const [anchor, parts] of collected) {
    const positions = [],
      colors = [],
      inverse = anchor.matrixWorld.clone().invert(),
      matrix = new T.Matrix4(),
      v = new T.Vector3();
    for (const m of parts) {
      matrix.multiplyMatrices(inverse, m.matrixWorld);
      const { position, color } = m.geometry.attributes,
        index = m.geometry.index,
        mc = m.material.color;
      for (let i = 0; i < (index?.count ?? position.count); i++) {
        const j = index ? index.getX(i) : i;
        v.fromBufferAttribute(position, j).applyMatrix4(matrix);
        positions.push(v.x, v.y, v.z);
        colors.push(
          mc.r * (color ? color.getX(j) : 1),
          mc.g * (color ? color.getY(j) : 1),
          mc.b * (color ? color.getZ(j) : 1),
        );
      }
      m.removeFromParent();
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const mesh = new T.Mesh(g, card);
    mesh.castShadow = mesh.receiveShadow = true;
    anchor.add(mesh);
  }
}
