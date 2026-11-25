import * as T from './vendor/three.module.min.js';
let texture;
function ink() {
  if (texture) return texture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d'),
    g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(51,61,60,.40)');
  g.addColorStop(0.58, 'rgba(60,70,66,.24)');
  g.addColorStop(1, 'rgba(70,70,65,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
const unit = new T.PlaneGeometry(1, 1);
export function contactShadow(parent, x, z, w, d, y = 0.026) {
  const shadow = new T.Mesh(
    unit,
    new T.MeshBasicMaterial({
      map: ink(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, y, z);
  shadow.scale.set(w, d, 1);
  shadow.renderOrder = 1;
  parent.add(shadow);
  return shadow;
}
