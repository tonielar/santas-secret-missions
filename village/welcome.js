import * as T from './vendor/three.module.min.js';

// Measured in village units. The facade faces local +Z and its roof ridge runs north–south.
const paper = {
  red: '#b53e35', berry: '#92342f', plum: '#71313a', dark: '#382e30',
  blush: '#d9684a', cream: '#ffedc4', snow: '#fff5df', shade: '#dbd8c4',
  pine: '#255647', spruce: '#346954', leaf: '#548267', gold: '#efbd62',
  butter: '#ffe09a', brown: '#7a4e40', teal: '#447c70', pink: '#df9d90',
};
const signs = {
  en: ['POST OFFICE', 'WELCOME', 'HELP', 'INSTALL', 'POST'],
  da: ['POSTHUS', 'VELKOMMEN', 'HJÆLP', 'INSTALLÉR', 'POST'],
  sv: ['POSTKONTOR', 'VÄLKOMMEN', 'HJÄLP', 'INSTALLERA', 'POST'],
};
const materials = new Map();
const cube = new T.BoxGeometry(1, 1, 1);
const TAU = 2 * Math.PI;

function stock(tint) {
  const color = paper[tint] || tint;
  if (!materials.has(color)) {
    materials.set(color, new T.MeshStandardMaterial({
      color, roughness: 1, metalness: 0, flatShading: true,
      ...(tint === 'butter' ? { emissive: '#f3a644', emissiveIntensity: .38 } : {}),
    }));
  }
  return materials.get(color);
}
function group(parent, x = 0, y = 0, z = 0) {
  const item = new T.Group();
  item.position.set(x, y, z);
  parent.add(item);
  return item;
}
function mesh(parent, geometry, tint, x = 0, y = 0, z = 0) {
  const item = new T.Mesh(geometry, typeof tint === 'string' ? stock(tint) : tint);
  item.position.set(x, y, z);
  item.castShadow = item.receiveShadow = true;
  parent.add(item);
  return item;
}
function block(parent, x, y, z, w, h, d, tint) {
  const item = mesh(parent, cube, tint, x, y, z);
  item.scale.set(w, h, d);
  return item;
}
function rod(parent, start, end, width, depth, tint) {
  const a = new T.Vector3(...start), b = new T.Vector3(...end);
  const length = a.distanceTo(b);
  const mid = a.clone().lerp(b, .5);
  const item = block(parent, mid.x, mid.y, mid.z, width, length, depth, tint);
  item.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
  return item;
}
function cut(parent, shape, depth, tint, x, y, z) {
  const geometry = new T.ExtrudeGeometry(shape, {
    depth, bevelEnabled: false, steps: 1, curveSegments: 8,
  });
  return mesh(parent, geometry, tint, x, y, z);
}
function polygon(parent, points, depth, tint, x = 0, y = 0, z = 0) {
  return cut(parent, new T.Shape(points.map(([u,v]) => new T.Vector2(u,v))), depth, tint, x,y,z);
}
function disc(parent, x, y, z, radius, depth, tint, n = 24) {
  const o = mesh(parent, new T.CylinderGeometry(radius, radius, depth, n), tint,x,y,z);
  o.rotation.x = Math.PI / 2;
  return o;
}
function arch(parent, x, y, z, width, height, depth, tint) {
  const r = width * .5;
  const shape = new T.Shape();
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, height-r);
  shape.absarc(0, height-r,r,0,Math.PI);
  shape.closePath();
  return cut(parent, shape, depth, tint, x,y,z);
}
function label(parent, words, x, y, z, w, h, ink = paper.cream) {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 96px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.fillText(words, c.width/2, c.height*.53, c.width-20);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  // Alpha test keeps the painted letters depth-correct when rotating past this plot.
  const m = new T.MeshBasicMaterial({map:texture, transparent:false, alphaTest:.18, toneMapped:false});
  const text = mesh(parent, new T.PlaneGeometry(w,h), m, x,y,z);
  text.castShadow = false;
  return text;
}
function foldedStar(parent, x, y, z, r, tint = 'gold') {
  const verts = [], colors = [], shade = new T.Color();
  for (let i=0;i<10;i++) {
    const point = k => {
      const a = Math.PI/2 + k*Math.PI/5, d = k%2===0 ? r : r*.45;
      return [Math.cos(a)*d, Math.sin(a)*d, 0];
    };
    verts.push(0,0,r*.25,...point(i),...point(i+1));
    shade.set(paper[tint]).multiplyScalar(i%2 ? .82 : 1.13);
    for(let j=0;j<3;j++) colors.push(shade.r,shade.g,shade.b);
  }
  const geom = new T.BufferGeometry();
  geom.setAttribute('position',new T.Float32BufferAttribute(verts,3));
  geom.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geom.computeVertexNormals();
  const mat = new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});
  return mesh(parent,geom,mat,x,y,z);
}

// Each pitched roof sheet has a turned-down cranberry fascia and overlapping cut snow.
// The outermost edge alternates between shallow arcs and little folded points.
function roofHalf(parent, side) {
  const pitch = Math.atan2(2.43,3.22), run = 3.54 / Math.cos(pitch);
  const roof = group(parent,0,6.79,.04);
  roof.rotation.z = -side*pitch;
  block(roof,side*run/2,0,0,run,.24,4.62,'plum');
  block(roof,side*run/2,.105,0,run,.08,4.68,'berry');
  for(let row = 0;row<4;row++) {
    const low = run*(row/4), high = run*((row+1)/4);
    const sheet = new T.Shape();
    sheet.moveTo(side*low,-2.37);
    sheet.lineTo(side*high,-2.37);
    const teeth=9;
    for(let i=0;i<teeth;i++) {
      const t=-2.37+i*4.74/teeth, span=4.74/teeth;
      const bulge=(row===3?.13:.048)*(1+(i%3)*.22);
      sheet.quadraticCurveTo(side*(high+bulge),t+span*.4,side*high,t+span);
    }
    sheet.lineTo(side*low,2.37); sheet.closePath();
    const layer = cut(roof,sheet,row===3?.16:.1,row%2?'snow':'#f8ecd5',0,.18+(3-row)*.055,0);
    layer.rotation.x = -Math.PI/2;
  }
  // Layered scalloped verge on both sides of the gable.
  for(let k=0;k<11;k++) {
    const u=(k+.5)*run/11;
    disc(roof,side*u,.02,2.32,.22,.12,'cream',18);
    if(k%2===1) disc(roof,side*u,.04,2.395,.055,.022,'red',12);
  }
  return roof;
}
function windowSet(parent, x, y, z, width = .95, height = 1.48) {
  const g = group(parent,x,y,z);
  arch(g,0,-.035,.00,width+.32,height+.22,.10,'berry');
  arch(g,0,0,.09,width+.16,height+.12,.11,'cream');
  arch(g,0,.095,.205,width-.06,height-.1,.035,'brown');
  arch(g,0,.15,.245,width-.19,height-.22,.035,'butter');
  block(g,0,(height-.2)/2+.1,.29,.075,height-.23,.065,'cream');
  block(g,0,height*.49,.29,width-.13,.078,.062,'cream');
  block(g,0,height*.76,.29,width-.17,.065,.062,'cream');
  block(g,0,.0,.23,width+.33,.14,.35,'pine');
  block(g,0,.075,.245,width+.38,.07,.38,'snow');
  return g;
}
function porchLamp(parent, x, y, z) {
  const g = group(parent,x,y,z);
  rod(g,[0,.46,0],[0,.46,.33],.075,.075,'dark');
  rod(g,[0,.46,.31],[0,.26,.31],.05,.05,'dark');
  const light=block(g,0,0,.31,.28,.39,.24,'butter');
  light.rotation.y=.18;
  for(let s of [-1,1]) block(g,s*.142,0,.445,.035,.40,.035,'brown');
  block(g,0,-.22,.31,.35,.085,.31,'pine');
  const cap=mesh(g,new T.ConeGeometry(.29,.19,4),'pine',0,.27,.31);
  cap.rotation.y=Math.PI/4;
}
function chimney(parent) {
  const g=group(parent,-1.66,5.54,-.63);
  block(g,0,.71,0,.78,1.5,.74,'berry');
  for(let j=0;j<3;j++) {
    block(g,0,.32+j*.42,0,.8,.065,.77,'blush');
    block(g,(j%2?-.16:.17),.49+j*.42,.373,.04,.28,.025,'blush');
  }
  block(g,0,1.42,0,1,.24,.95,'plum');
  block(g,0,1.58,0,1.09,.16,1.02,'snow');
  block(g,0,1.672,0,.72,.03,.68,'dark');
}
function wreath(parent, x, y, z, radius) {
  const tor = new T.TorusGeometry(radius,.068,5,14);
  mesh(parent,tor,'pine',x,y,z);
  for(let j=0;j<12;j++) {
    const a=j*TAU/12;
    const sprig=polygon(parent,[[-.033,-.09],[.059,.026],[0,.12],[-.065,.029]],.036,
      j%3?'spruce':'leaf',x+radius*Math.cos(a),y+radius*Math.sin(a),z+.026);
    sprig.rotation.z=a-.6;
  }
  for(let k of [0,1,4,6,9]) {
    const a=k*TAU/12;
    disc(parent,x+radius*Math.cos(a),y+radius*Math.sin(a),z+.07,.05,.035,'red',10);
  }
  for(let s of [-1,1]) polygon(parent,[[0,0],[s*.19,.10],[s*.19,-.10]],.05,'red',x,y-radius,z+.12);
}
function awning(parent) {
  const g=group(parent,0,3.23,2.12);
  const count=7, width=2.12;
  for(let j=0;j<count;j++) {
    const x=(j-(count-1)/2)*width/count;
    const c=j%2===0?'red':'cream';
    const panel=block(g,x,-.14,.43,width/count+.006,.13,1.0,c);
    panel.rotation.x=.31;
    const s=new T.Shape(), a=width/count/2;
    s.moveTo(-a,.07);s.lineTo(a,.07);s.lineTo(a,-.07);
    s.quadraticCurveTo(a*.6,-.23,0,-.23);
    s.quadraticCurveTo(-a*.62,-.22,-a,-.07);s.closePath();
    cut(g,s,.065,c,x,-.28,.87);
  }
  for(let side of [-1,1]){
    rod(g,[side*.92,-.71,.05],[side*.92,-.30,.8],.09,.09,'pine');
  }
}
function lodge(parent, lang) {
  const body=group(parent);
  body.rotation.y=-.32;
  block(body,0,.12,0,6.05,.24,4.17,'brown');
  block(body,0,.30,0,5.98,.16,4.12,'cream');
  polygon(body,[[-2.81,.35],[2.81,.35],[2.81,4.51],[0,6.61],[-2.81,4.51]],3.85,'red',0,0,-1.94);
  // Vertical fold lines, plinth skirting and front corner pilasters.
  for(let j=-7;j<=7;j++) {
    const x=j*.38,h=4.2+(1-Math.abs(x)/2.81)*2.05;
    block(body,x,.40+h*.5,1.93,.035,h,.04,'#c64b3e');
  }
  for(let side of [-1,1]){
    block(body,side*2.76,2.37,.02,.16,4.05,4,'cream');
    block(body,side*2.71,2.38,1.98,.23,4.08,.17,'cream');
    const wall=group(body,side*2.83,0,.02);
    wall.rotation.y=side*Math.PI/2;
    for(const offset of [-.98,.98]) windowSet(wall,offset,1.45,0,.91,1.4);
  }
  block(body,0,.53,1.99,5.64,.18,.16,'berry');
  block(body,0,.64,2,5.62,.045,.17,'cream');
  // Carved belt course with small alternating diamond inlays.
  block(body,0,4.17,1.98,5.62,.23,.16,'berry');
  block(body,0,4.34,1.985,5.68,.09,.19,'cream');
  for(let j=-8;j<=8;j++) {
    const d=block(body,j*.313,4.17,2.075,.082,.082,.044,j%2?'gold':'cream');
    d.rotation.z=Math.PI/4;
  }
  for(const side of [-1,1]) {
    roofHalf(body,side);
    rod(body,[side*3.42,4.12,2.20],[0,6.76,2.20],.20,.17,'cream');
    rod(body,[side*2.68,4.39,2.083],[side*.73,5.86,2.083],.095,.085,'cream');
  }
  chimney(body);
  // Gable rose window and the fold at the centre of its six-point rosette.
  disc(body,0,5.50,2.02,.52,.17,'cream',32);
  disc(body,0,5.50,2.14,.39,.13,'pine',32);
  disc(body,0,5.50,2.23,.32,.07,'butter',32);
  for(let i=0;i<3;i++) {
    const cross=block(body,0,5.50,2.30,.052,.67,.04,'cream');
    cross.rotation.z=i*Math.PI/3;
  }
  for (const side of [-1,1]) {
    foldedStar(body,side*.81,5.10,2.10,.19);
    windowSet(body,side*1.87,1.48,1.96,1.04,1.60);
  }
  // The sign is mounted proud of the wall on two small gilt pins.
  block(body,0,3.72,2.07,3.53,.68,.20,'cream');
  block(body,0,3.72,2.19,3.38,.52,.06,'pine');
  label(body,signs[lang][0],0,3.72,2.24,2.84,.48);
  for(let s of [-1,1]) disc(body,s*1.6,3.72,2.24,.052,.035,'gold',12);
  arch(body,0,.37,2.00,1.59,2.75,.14,'cream');
  arch(body,0,.41,2.16,1.38,2.57,.12,'pine');
  for(let j=-3;j<=3;j++) block(body,j*.16,1.35,2.29,.018,1.74,.017,'spruce');
  block(body,0,.88,2.30,1.03,.76,.06,'spruce');
  block(body,0,.88,2.34,.84,.58,.04,'pine');
  block(body,0,1.50,2.32,.48,.10,.07,'gold');
  wreath(body,0,2.23,2.36,.26);
  disc(body,.48,1.34,2.34,.08,.07,'gold',12);
  awning(body);
  for(let side of [-1,1]) porchLamp(body,side*.99,2.13,2.05);
  for(let k=0;k<3;k++) {
    const depth=.28*(3-k),z=2.20+depth*.5;
    block(body,0,.055+k*.115,z,2.25-k*.09,.11,depth,'brown');
    block(body,0,.121+k*.115,z,2.27-k*.09,.03,depth+.035,'shade');
  }
  // A suspended pleated ornament hangs below the projecting roof on its eastern verge.
  rod(body,[2.83,4.65,2.32],[2.83,3.90,2.32],.027,.027,'gold');
  foldedStar(body,2.83,3.69,2.34,.30);
  return body;
}

function parcel(parent,x,y,z,width,height,depth,tint,ribbon,angle) {
  const g=group(parent,x,y,z);g.rotation.y=angle;
  block(g,0,height*.48,0,width,height*.96,depth,tint);
  block(g,0,height-.03,0,width*1.035,.105,depth*1.035,tint);
  block(g,0,height*.51,0,width*.17,height*1.02,depth*1.048,ribbon);
  block(g,0,height*.51,0,width*1.047,height*1.026,depth*.16,ribbon);
  const bowWidth=width*.22, zTop=height+.05;
  for(let s of [-1,1]){
    const loop=new T.Shape();
    loop.moveTo(0,0);
    loop.quadraticCurveTo(s*bowWidth*.7,bowWidth*1.55,s*bowWidth*1.28,bowWidth*.93);
    loop.quadraticCurveTo(s*bowWidth*1.85,bowWidth*.17,0,0);
    const hole=new T.Path();
    hole.moveTo(s*.045,.033);
    hole.quadraticCurveTo(s*bowWidth*.7,bowWidth*1.1,s*bowWidth*1.08,bowWidth*.71);
    hole.quadraticCurveTo(s*bowWidth*1.3,bowWidth*.27,s*.045,.033);
    loop.holes.push(hole);
    cut(g,loop,.055,ribbon,0,zTop,0);
  }
  return g;
}
function mailbox(parent, x,z,lang) {
  const g=group(parent,x,0,z);g.rotation.y=.17;
  block(g,0,.09,0,.56,.18,.53,'snow');
  for(let k=0;k<5;k++) block(g,0,.20+k*.20,0,.21,.20,.22,k%2?'red':'cream');
  arch(g,0,.97,-.41,.87,.85,.91,'red');
  arch(g,0,.98,.49,.76,.72,.065,'cream');
  arch(g,0,1.03,.56,.65,.59,.02,'berry');
  block(g,0,1.37,.60,.44,.078,.03,'dark');
  label(g,signs[lang][4],0,1.18,.615,.51,.18);
  rod(g,[.5,1.47,-.13],[.5,2.11,-.13],.055,.06,'cream');
  block(g,.51,2.04,.018,.075,.19,.34,'gold');
  return g;
}
function wayfinding(parent, x,z,lang,props) {
  const g=group(parent,x,0,z); g.rotation.y=-.26;
  block(g,0,1.16,0,.17,2.34,.18,'brown');
  block(g,0,.07,0,.48,.14,.50,'shade');
  [[1.97,1,signs[lang][2],'help'],[1.53,-1,signs[lang][3],'install']].forEach(([y,s,word,kind])=>{
    const board=group(g,0,y,.16);
    const width=word.length>6?1.66:1.4;
    polygon(board,[[-s*width/2,-.18],[s*(width/2-.12),-.18],[s*(width/2+.10),0],[s*(width/2-.12),.18],[-s*width/2,.18]],.095,'pine');
    label(board,word,0,0,.104,width*.80,.32);
    props.push({object:board,kind});
  });
}
function book(parent,x,z) {
  const g=group(parent,x,0,z);g.rotation.y=-.22;
  block(g,0,.10,0,.81,.20,.63,'pine');
  block(g,0,.58,0,.20,.92,.21,'brown');
  const pages=group(g,0,1.14,0);
  pages.rotation.x=-.91;
  for(const side of [-1,1]) {
    const leaf=group(pages,0,0,0);
    leaf.rotation.y=side*.17;
    block(leaf,side*.38,0,0,.77,.87,.085,'red');
    block(leaf,side*.37,0,.055,.70,.79,.055,'shade');
    block(leaf,side*.37,.015,.09,.68,.74,.035,'cream');
    for(let j=0;j<3;j++) block(leaf,side*.37,-.015-j*.095,.114,.40-j*.06,.027,.017,'brown');
    if(side<0) foldedStar(leaf,side*.37,.19,.115,.105,'gold');
    else block(leaf,side*.37,.175,.118,.28,.06,.012,'red');
  }
  return g;
}
function welcomeGate(parent,x,z,lang) {
  const g=group(parent,x,0,z);g.rotation.y=.30;
  for(let s of [-1,1]){
    block(g,s*.94,.075,0,.44,.15,.46,'snow');
    for(let i=0;i<9;i++) block(g,s*.94,.245+i*.26,0,.20,.26,.21,i%2?'red':'cream');
    block(g,s*.94,2.41,0,.37,.13,.37,'pine');
    const cap=mesh(g,new T.ConeGeometry(.235,.26,4),'snow',s*.94,2.6,0);
    cap.rotation.y=.7854;
  }
  const shape=new T.Shape();
  shape.moveTo(-1.13,1.9);shape.quadraticCurveTo(0,2.24,1.13,1.9);
  shape.lineTo(1.13,2.36);shape.quadraticCurveTo(0,2.73,-1.13,2.36);shape.closePath();
  cut(g,shape,.19,'pine',0,0,-.065);
  label(g,signs[lang][1],0,2.31,.14,1.83,.34);
  for(let i=-2;i<=2;i++) {
    const top=2.04-(i*i*.025),dx=i*.29;
    rod(g,[dx,top,.12],[dx,top-.12,.12],.02,.02,'cream');
    foldedStar(g,dx,top-.18,.13,i===0?.106:.079);
  }
  return g;
}
export function buildWelcome(language = 'en') {
  const lang=Object.hasOwn(signs,language)?language:'en';
  const root=new T.Group();
  root.name='North Pole post office';
  const props=[];
  const house=lodge(root,lang);
  props.push({object:house,kind:'story'});
  const mail=mailbox(root,-3.62,2.09,lang);
  props.push({object:mail,kind:'install'});
  const gate=welcomeGate(root,-4.77,-.22,lang);
  props.push({object:gate,kind:'rules'});
  props.push({object:book(root,3.70,2.34),kind:'story'});
  wayfinding(root,5.08,.62,lang,props);
  const gifts=group(root,2.70,0,2.53);
  parcel(gifts,-.19,0,.08,.95,.58,.79,'berry','cream',-.21);
  parcel(gifts,-.24,.60,.03,.64,.47,.55,'pine','gold',.05);
  parcel(gifts,.48,0,.32,.62,.52,.57,'pink','berry',.24);
  props.push({object:gifts,kind:'present'});
  return {root,props};
}
