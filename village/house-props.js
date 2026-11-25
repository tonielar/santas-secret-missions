/* Cardboard stock and construction details shared by the mission buildings.
   Local +z is the street-facing side. Each sheet has physical edge thickness. */
import * as T from './vendor/three.module.min.js';

export const ivory = '#fff0cb', snow = '#fff7e9', gold = '#e3a953';
const materials = new Map();
const cube = new T.BoxGeometry(1, 1, 1);
const sphere = new T.SphereGeometry(1, 10, 7);
const profiles = new Map();

function stock(color) {
  if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({
    color, roughness: 1, metalness: 0, flatShading: true
  }));
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
export function sheet(p, x, y, z, points, color, depth = .08) {
  const outline = new T.Shape();
  points.forEach(([a,b], i) => i ? outline.lineTo(a,b) : outline.moveTo(a,b));
  outline.closePath();
  const geo = new T.ExtrudeGeometry(outline, {depth, bevelEnabled:false, curveSegments:6});
  return cut(p, geo, color, x, y, z - depth);
}

export function rod(p, ax, ay, az, bx, by, bz, width, color, thickness = width) {
  const delta = new T.Vector3(bx - ax, by - ay, bz - az);
  const m = box(p, (ax+bx)/2, (ay+by)/2, (az+bz)/2, width, delta.length(), thickness, color);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), delta.normalize());
  return m;
}

export function disk(p, x, y, z, radius, color, sides = 16, depth = .09) {
  const c = tube(p, x,y,z, radius,radius,depth,color,sides);
  c.rotation.x = Math.PI/2;
  return c;
}

export function star(p, x, y, z, r, color = gold, inner = .46) {
  const points = Array.from({length:10}, (_,i) => {
    const a = Math.PI/2 + i*Math.PI/5, b = i%2 ? r*inner : r;
    return [Math.cos(a)*b, Math.sin(a)*b];
  });
  return sheet(p, x,y,z, points, color, .1);
}

function archOutline(w, h) {
  const radius = w / 2, shoulder = h-radius;
  const points = [[-radius,0],[radius,0]];
  for(let i=0;i<=10;i++) {
    const a = i*Math.PI/10;
    points.push([radius*Math.cos(a), shoulder+radius*Math.sin(a)]);
  }
  return points;
}
export function arch(p,x,y,z,w,h,color,depth=.1) {
  return sheet(p,x,y,z,archOutline(w,h),color,depth);
}

export function windowPane(p,x,y,z,w,h,trim,rounded=false) {
  const outer = rounded ? arch : (o,px,py,pz,ww,hh,c) => box(o,px,py+hh/2,pz-.05,ww,hh,.1,c);
  outer(p,x,y,z,w,h,trim);
  outer(p,x,y+.08,z+.035,w-.16,h-.16,'#6e483d');
  outer(p,x,y+.15,z+.07,w-.3,h-.3,'#ffd889');
  box(p,x,y+h*.53,z+.095,.06,h-.3,.06,trim);
  box(p,x,y+h*.48,z+.105,w-.25,.07,.06,trim);
  box(p,x,y+.04,z+.08,w+.15,.12,.24,trim);
}

export function roundWindow(p,x,y,z,r,trim) {
  disk(p,x,y,z,r,trim);
  disk(p,x,y,z+.06,r*.79,'#875f49');
  disk(p,x,y,z+.11,r*.69,'#ffe1a0');
  box(p,x,y,z+.18,r*1.45,.06,.055,trim);
  box(p,x,y,z+.18,.06,r*1.45,.055,trim);
}

// Fold a gabled roof from two sheets. The snow sits above the colored eave.
export function gable(p,{x=0,z=0,y=0,w,d,wall,rise,body,roof,cap=snow,trim=ivory,over=.24}) {
  const front=z+d/2, eave=y+wall;
  sheet(p,x,y,front,[[-w/2,0],[w/2,0],[w/2,wall],[0,wall+rise],[-w/2,wall]],body,d);
  const half=w/2+over, length=Math.hypot(half,rise+over*rise/(w/2));
  const angle=Math.atan2(rise,w/2), bottom=eave-over*rise/(w/2);
  for (const side of [-1,1]) {
    const fold=group(p,x+side*half/2,(bottom+eave+rise)/2,z);
    fold.rotation.z=-side*angle;
    box(fold,0,0,0,length+.08,.18,d+over*2,roof);
    box(fold,side*.025,.111,0,length+.04,.09,d+over*2+.065,cap);
    // A row of irregular snow tabs folds over the hem.
    const count=Math.ceil(d/.62);
    for(let j=0;j<count;j++) {
      const t=(j+.5)/count;
      box(fold,side*(length/2-.025),.045,(t-.5)*(d+over*2),.14,.13+(j%3)*.045,.28,cap);
    }
  }
  for(const side of [-1,1]) {
    rod(p,x+side*half,bottom,front+over+.04,x,eave+rise,front+over+.04,.15,trim,.13);
  }
  return {front,eave,peak:eave+rise};
}

export function chimney(p,x,base,z,height,color) {
  box(p,x,base+height/2,z,.64,height,.7,color);
  box(p,x,base+height,z,.79,.24,.86,color);
  box(p,x,base+height+.15,z,.85,.11,.92,snow);
  box(p,x,base+height+.22,z,.47,.04,.52,'#4d4245');
  for(let i=0;i<3;i++) box(p,x+(i%2?.14:-.16),base+.2+i*.42,z+.36,.26,.08,.035,'#e3b6a3');
}

export function stripedPole(p,x,y,z,h,color,r=.14) {
  const bands = Math.max(3, Math.floor(h/(r*1.85)));
  tube(p,x,y+h/2,z,r,r,h,ivory,10);
  for(let i=1;i<bands;i+=2) tube(p,x,y+(i+.5)*h/bands,z,r*1.035,r*1.035,h/bands,color,10);
}

export function present(p,x,z,size,paper='#ac343b',ribbon=gold) {
  const g=group(p,x,0,z);
  box(g,0,size/2,0,size,size,size*.87,paper);
  box(g,0,size/2,0,size*.17,size+.035,size*.89,ribbon);
  box(g,0,size+.025,0,size+.025,.06,size*.16,ribbon);
  for(const side of [-1,1]) {
    const loop=sheet(g,side*.13*size,size+.06,0,[[0,0],[side*.14*size,.23*size],[side*.25*size,.16*size],[side*.21*size,.02*size]],ribbon);
    loop.rotation.y=.12*side;
  }
  return g;
}

export function pennants(p,x1,x2,y,z,colors) {
  const n=7, points=Array.from({length:n+1},(_,i)=>[x1+(x2-x1)*i/n,y-.36*Math.sin(Math.PI*i/n)]);
  for(let i=0;i<n;i++) {
    const [ax,ay]=points[i],[bx,by]=points[i+1],middle=(ax+bx)/2;
    rod(p,ax,ay,z,bx,by,z,.04,'#b88456');
    sheet(p,middle,(ay+by)/2,z+.035,[[-.15,0],[.15,0],[.015,-.3]],colors[i%colors.length],.035);
  }
}

export function awning(p,x,y,z,w,depth,stripes) {
  const n=Math.max(5,Math.round(w/.41)), g=group(p,x,y,z), step=w/n;
  g.rotation.x=.19;
  for(let i=0;i<n;i++) {
    const xx=-w/2+(i+.5)*step;
    box(g,xx,0,depth/2,step+.008,.09,depth,stripes[i%stripes.length]);
    sheet(g,xx,-.025,depth+.045,[[-step/2,0],[step/2,0],[step/2,-.16],[0,-.24],[-step/2,-.16]],stripes[i%stripes.length],.07);
  }
  for(const side of [-1,1]) rod(p,x+w*.44*side,y-.65,z,x+w*.44*side,y-.23,z+depth*.92,.07,'#684334');
}

export function lantern(p,x,y,z) {
  const g=group(p,x,y,z);
  rod(g,0,0,0,0,.38,0,.055,'#715748');
  tube(g,0,-.04,0,.06,.28,.19,'#725b50',4).rotation.y=Math.PI/4;
  tube(g,0,-.37,0,.22,.17,.48,'#ffd989',4).rotation.y=Math.PI/4;
  tube(g,0,-.66,0,.21,.07,.14,'#896848',4).rotation.y=Math.PI/4;
  return g;
}

export function reindeer(p,x,z,scale=1) {
  const g=group(p,x,0,z);
  g.scale.setScalar(scale);
  // Folded card profile with separate near and far legs.
  const body=[[-.9,1.05],[-.62,1.55],[.18,1.44],[.53,1.98],[.83,2.02],[1.06,1.85],[.83,1.68],[.58,1.67],[.42,.96],[-.48,.9]];
  sheet(g,0,0,.18,body,'#ad7044',.38);
  for(const side of [-1,1]) for(const leg of [-1,1]) {
    const xx=side*.5, zz=leg*.19, forward=side*.13*leg;
    rod(g,xx,1.14,zz,xx+forward,.1,zz,.13,leg===1?'#97603c':'#7a503b');
    box(g,xx+forward+.03,.08,zz,.2,.13,.15,'#5a4037');
  }
  ball(g,.69,1.91,.2,.048,.055,.035,'#3b3335');
  ball(g,1.025,1.84,.12,.084,.07,.1,'#ae3a36');
  for(const zz of [-.1,.13]) {
    rod(g,.57,2,zz,.34,2.54,zz,.075,'#75533d');
    rod(g,.43,2.35,zz,.18,2.4,zz,.07,'#75533d');
    rod(g,.36,2.48,zz,.46,2.71,zz,.06,'#75533d');
  }
  sheet(g,.56,1.96,.15,[[0,0],[-.23,.23],[-.25,.02]],'#bd8757');
  return g;
}

export function snowman(p,x,z,scale=1) {
  const g=group(p,x,0,z);
  g.scale.setScalar(scale);
  ball(g,0,.62,0,.76,.69,.69,snow);
  ball(g,0,1.38,.03,.56,.53,.52,'#fff9ee');
  ball(g,0,2.02,.08,.43,.43,.42,snow);
  for(const side of [-1,1]) {
    ball(g,side*.155,2.1,.46,.045,.052,.038,'#353d42');
    const arm=group(g,side*.41,1.46,0);
    rod(arm,0,0,0,side*.5,.26,.04,.07,'#695648');
    rod(arm,side*.37,.17,.04,side*.41,.44,.06,.06,'#695648');
    if(side>0) arm.name='waving-arm';
  }
  const nose=tube(g,0,1.99,.55,0,.095,.35,'#dc8947');
  nose.rotation.x=Math.PI/2;
  tube(g,0,1.73,.04,.42,.45,.15,'#a4393f',12);
  box(g,.23,1.46,.45,.18,.54,.075,'#b1464b').rotation.z=.22;
  for(const y of [1.25,1.45]) ball(g,0,y,.54,.048,.05,.035,'#3b4144');
  tube(g,0,2.4,.08,.53,.53,.09,'#40565a',12);
  tube(g,0,2.61,.08,.3,.34,.39,'#3d555b',10);
  tube(g,0,2.49,.08,.336,.346,.105,'#bd5858',10);
  return g;
}

export function ice(p,x,z,h,r,color) {
  const g=group(p,x,0,z);
  tube(g,0,h*.34,0,r,r*.85,h*.68,color,5);
  tube(g,0,h*.84,0,.015,r,h*.34,color,5);
  return g;
}
