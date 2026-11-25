import * as T from './vendor/three.module.min.js';
import {arch, awning, ball, box, chimney, disk, gable, gold, group, ice, ivory,
  lantern, pennants, present, reindeer, rod, roundWindow, sheet, snow, snowman,
  star, stripedPole, tube, windowPane} from './house-props.js';

// Each builder constructs a different architectural silhouette. The common door
// fitting is attached last so the calendar can animate it independently.
const wood='#885a43', red='#ad3845', darkGreen='#39584b';

function entry(p, x, z, color, trim, width=1.48, height=2.32, base=.12) {
  const inn='#503a3b';
  arch(p,x,base,z+.16,width+.56,height+.43,trim,.22);
  arch(p,x,base+.03,z+.23,width+.3,height+.22,inn,.11);
  const hinge=group(p,x-width/2,base+.065,z+.28);
  arch(hinge,width/2,0,.045,width,height,color,.11);
  for(const side of [-1,1]) box(hinge,width/2+side*width*.27,height*.3,.075,.044,height*.48,.035,trim);
  disk(hinge,width/2,height*.72,.09,width*.185,trim,12);
  disk(hinge,width/2,height*.72,.15,width*.132,'#ffd78b',12);
  box(hinge,width/2,height*.72,.2,width*.27,.045,.035,trim);
  const handle=group(hinge,width*.84,height*.45,.125);
  disk(handle,0,0,.025,.11,'#6c493b');
  box(handle,-.055,0,.1,.23,.085,.12,gold);
  const lock=group(hinge,width*.51,height*.45,.17);
  // The cut-out center of the shackle stays open, including when it rattles.
  const shackle=Array.from({length:9},(_,i)=>[.198*Math.cos(i*Math.PI/8),.13+.198*Math.sin(i*Math.PI/8)]);
  for(let i=0;i<shackle.length-1;i++) {
    const [a,b]=shackle[i], [c,d]=shackle[i+1];
    rod(lock,a,b,.035,c,d,.035,.075,ivory);
  }
  for(const side of [-1,1]) box(lock,side*.198,.08,.035,.075,.14,.075,ivory);
  box(lock,0,-.1,.04,.56,.44,.17,'#bd873f');
  box(lock,0,-.08,.14,.48,.34,.10,'#f4bd53');
  disk(lock,0,-.045,.203,.06,'#714c38',8,.02);
  sheet(lock,0,-.08,.21,[[-.02,.02],[.02,.02],[.048,-.092],[-.048,-.092]],'#714c38',.01);
  box(p,x,base/2,z+.47,width+.75,Math.max(base,.1),.91,'#ba977a');
  box(p,x,base+.015,z+.58,width+.72,.055,.69,snow);
  return {door:hinge,handle,lock,doorPoint:new T.Vector3(x,base+height*.55,z+.46)};
}

function cookie(p,x,z,scale) {
  const g=group(p,x,0,z);g.scale.setScalar(scale);
  const c='#a95d38';
  sheet(g,0,.7,.07,[[-.22,.34],[-.53,.5],[-.65,.4],[-.59,.22],[-.29,.08],[-.22,-.1],[-.47,-.5],[-.44,-.66],[-.29,-.69],[0,-.39],[.29,-.69],[.46,-.63],[.44,-.48],[.22,-.1],[.28,.08],[.58,.22],[.65,.4],[.54,.5],[.21,.34]],c,.18);
  disk(g,0,1.38,0,.35,c,14,.22);
  for(const side of [-1,1]) disk(g,.115*side,1.43,.13,.036,ivory,8,.04);
  rod(g,-.09,1.29,.13,0,1.25,.13,.035,ivory);
  rod(g,0,1.25,.13,.09,1.29,.13,.035,ivory);
  for(const y of [.75,.93]) disk(g,0,y,.12,.062,ivory,8,.04);
  return g;
}

function candyCane(p,x,z,h) {
  const g=group(p,x,0,z);
  stripedPole(g,0,0,0,h,red,.135);
  for(let i=0;i<9;i++) {
    const a=Math.PI-i*Math.PI/9, b=a-Math.PI/9;
    rod(g,.38+.38*Math.cos(a),h+.39*Math.sin(a),0,.38+.38*Math.cos(b),h+.39*Math.sin(b),0,.25,i%2?red:ivory,.25);
  }
  box(g,.76,h-.08,0,.25,.19,.25,red);
  return g;
}

function gingerbread(p,props) {
  const biscuit='#b8734d', frosting='#fff0cb', jam='#ad4643';
  const r=gable(p,{x:-.24,w:4.66,d:3.4,wall:2.94,rise:2.15,body:biscuit,roof:'#aa5452',cap:'#ffe8c3',trim:frosting});
  gable(p,{x:2.1,z:-.34,w:1.9,d:2.35,wall:2.01,rise:1.02,body:'#b87957',roof:'#ad5552',cap:'#fff1d1',trim:frosting});
  chimney(p,1.15,3.57,-.38,1.61,'#a35c45');
  roundWindow(p,-.24,3.68,r.front+.09,.51,frosting);
  for (const x of [-1.85,1.41]) windowPane(p,x,.89,r.front+.1,.86,1.37,frosting,true);
  windowPane(p,2.3,.68,.94,.84,.95,frosting);
  for(const side of [-1,1]) {
    const x=-.24+side*2.26;
    for(let j=0;j<8;j++) disk(p,x,.23+j*.38,r.front+.07,.112,j%2?frosting:'#eab09a',9);
    // Gumdrops sit on the piped gable, slightly proud of the snowy edge.
    for(let j=1;j<=5;j++) {
      const t=j/6;
      ball(p,-.24+side*2.53*t,5.17-2.33*t,r.front+.22,.13,.14,.125,[jam,'#82a388','#e4ab59'][j%3]);
    }
  }
  for(const [x,z,h] of [[-2.88,1.85,1.93],[2.88,1.79,1.55]]) candyCane(p,x,z,h).rotation.z=x>0?-.075:.08;
  props.push({object:cookie(p,-2.8,2.86,.88),kind:'present'});
  props.push({object:present(p,2.72,2.42,.66,'#90a18a',jam),kind:'present'});
  return {x:-.24,z:r.front,roofY:5.1,doorColor:'#944040',trim:frosting,starY:4.63};
}

function alpine(p,props) {
  const beam='#674939', evergreen='#386353', pine='#6c8b72', rye='#daa96c';
  // The roof descends nearly to the plinth, leaving one long triangular facade.
  const front=1.76;
  sheet(p,0,.13,front,[[-3,0],[3,0],[.13,6.2]],'#8b6850',3.6);
  for(const side of [-1,1]) {
    const x=side*3.07;
    rod(p,x,.19,-.06,.13,6.45,-.06,.28,evergreen,4.28);
    rod(p,x+.055*side,.23,-.06,.13+.05*side,6.49,-.06,.13,snow,4.36);
    rod(p,x,.19,front+.45,.13,6.45,front+.45,.15,rye,.14);
    // Alternating courses show the folds of the shingled paper roof.
    for(let j=0;j<7;j++) {
      const t=(j+.5)/7,xx=x+(0.13-x)*t,yy=.25+6.19*t;
      for(let k=0;k<4;k++) {
        const zz=-1.6+k*.94;
        const shingle=box(p,xx+.12*side,yy,zz,.12,.67,.87,(j+k)%3===0?'#e4ebdb':(j%2?pine:'#698671'));
        shingle.rotation.z=side*.44;
      }
    }
  }
  for(let j=0;j<7;j++) {
    const y=.4+j*.56,w=5.8*(1-y/6.3);
    box(p,0,y,front+.018,w,.06,.06,'#a57a58');
  }
  rod(p,-2.45,1.06,front+.11,0,2.8,front+.11,.15,beam);
  rod(p,2.45,1.06,front+.11,0,2.8,front+.11,.15,beam);
  disk(p,.07,4.15,front+.12,.59,rye,8);
  roundWindow(p,.07,4.15,front+.17,.47,beam);
  for(const x of [-1.75,1.76]) windowPane(p,x,.7,front+.12,.57,.92,rye);
  gable(p,{x:-2.56,z:-.41,w:1.86,d:2.4,wall:1.61,rise:.78,body:'#6d795a',roof:evergreen,cap:snow,trim:rye});
  chimney(p,-1.38,3.9,-.84,1.49,'#8a735f');
  props.push({object:reindeer(p,3.2,1.77,.73),kind:'reindeer'});
  return {x:.04,z:front+.12,roofY:6.49,doorColor:evergreen,trim:rye,starY:5.31};
}

function frost(p,props) {
  const wall='#90c2cb', edge='#e2f4ee', slate='#567c94', iceBlue='#8bb9cb';
  box(p,0,1.87,-.08,3.26,3.74,3.16,wall);
  sheet(p,0,3.74,1.5,[[-1.62,0],[-1.23,.44],[-.92,.31],[0,1.64],[.92,.31],[1.23,.44],[1.62,0]],'#b1d7da',3.16);
  for(const side of [-1,1]) {
    const x=2.08*side, y=side===1?3.95:3.21;
    tube(p,x,y/2,-.31,1.12,1.23,y,side===1?'#92b7c8':iceBlue,6);
    tube(p,x,y-.12,-.31,1.25,1.19,.34,edge,6);
    tube(p,x,y+1.04,-.31,.04,1.29,2.12,side===1?'#6b98ad':'#85b2BD',6);
    tube(p,x,y+2.2,-.31,0,.095,.24,edge,6);
    windowPane(p,x,1.13,.79,.69,1.58,edge,true);
    for(let j=0;j<3;j++) tube(p,x-.44+j*.42,y-.34,.75, .087,.012,.47+(j%2)*.3,edge,5);
    rod(p,side*1.38,.3,1.55,side*1.38,3.55,1.55,.11,edge);
  }
  star(p,0,3.85,1.6,.47,edge,.27);
  for(const side of [-1,1]) {
    rod(p,side*.21,3.8,1.62,side*.58,3.8,1.62,.065,snow);
    rod(p,0,3.6,1.62,0,4.28,1.62,.065,snow);
    for(let j=0;j<3;j++){
      const h=.75+.49*((j+1)%3);
      const shard=ice(p,side*(2.52+.48*j),1.59-.18*j,h,.25,['#b1e0dd','#85b9c8','#bedcde'][j]);
      shard.rotation.z=side*(j-1)*.24;
    }
  }
  const pond=tube(p,-2.83,.045,2.33,1.08,1.1,.08,'#99cbd1',10);pond.scale.z=.61;
  rod(p,-3.34,.1,2.45,-2.85,.1,2.38,.045,edge);
  props.push({object:lantern(p,.96,2.42,1.89),kind:'lantern'});
  return {x:0,z:1.5,roofY:5.38,doorColor:slate,trim:edge,starY:4.76};
}

function bakery(p,props) {
  const brick='#b26053', raspberry='#a74950', clapboard='#ecc495', cocoa='#784d42';
  // A two-storey patisserie under a folded mansard roof. The projecting display
  // window and bread counter make the ground floor read as a shop.
  box(p,0,1.92,-.1,4.72,3.84,3.18,brick);
  box(p,0,3.78,-.1,4.98,.23,3.48,clapboard);
  const mansard=tube(p,0,4.48,-.1,1.63,2.16,1.28,raspberry,4);
  mansard.rotation.y=Math.PI/4;mansard.scale.set(1.56,1,1.07);
  box(p,0,5.17,-.1,3.78,.13,2.54,snow);
  for(const x of [-1.46,0,1.46]) {
    gable(p,{x,z:1.07,y:4.02,w:.89,d:.63,wall:.66,rise:.41,body:clapboard,roof:cocoa,trim:ivory,over:.09});
    windowPane(p,x,4.08,1.43,.56,.58,raspberry,true);
  }
  for(const x of [-1.35,.25,1.59]) {
    windowPane(p,x,2.47,1.56,.86,1.05,clapboard,true);
  }
  for(const side of [-1,1]) {
    for(let j=0;j<5;j++) box(p,side*2.27,.32+j*.65,1.54,.28,.18,.16,clapboard);
  }
  box(p,.84,1.27,1.62,2.43,1.96,.24,clapboard);
  box(p,.84,1.36,1.79,2.19,1.42,.14,'#78504a');
  box(p,.84,1.39,1.88,2.03,1.25,.09,'#ffd992');
  box(p,.84,1.36,1.96,.08,1.42,.12,clapboard);
  awning(p,.86,2.35,1.72,2.74,1,[raspberry,ivory]);
  // Baked loaves have diagonal paper scoring on their crowns.
  box(p,.84,.76,2.14,2.53,.15,.81,cocoa);
  for(let k=0;k<4;k++) {
    const xx=-.02+k*.55;
    ball(p,xx,.98,2.18,.22,.18,.34,'#d79b54');
    for(let j=0;j<2;j++) {
      const score=box(p,xx,1.14,2.13+j*.13,.18,.02,.026,'#f6d194');score.rotation.y=-.5;
    }
  }
  chimney(p,-1.78,4.74,-.78,1.47,brick);
  // A loose ribbon of vellum suggests steam drifting from the ovens.
  const steam=group(p,-1.78,6.52,-.78);
  sheet(steam,0,0,0,[[-.07,0],[-.2,.25],[-.08,.43],[.29,.65],[.37,.79],[.24,.93],[-.03,1.02],[.26,.99],[.51,.85],[.5,.66],[.34,.51],[.06,.37],[-.06,.24],[.02,.03]],'#dfcbb9',.035);
  const sign=group(p,-2.6,2.87,1.38);rod(sign,.36,.42,0,-.51,.42,0,.07,cocoa);
  rod(sign,-.46,.42,0,-.46,.12,0,.04,cocoa);
  disk(sign,-.46,-.19,0,.35,clapboard);
  ball(sign,-.46,-.18,.08,.24,.12,.07,'#b87946');
  for(let i=0;i<2;i++) box(sign,-.52+i*.1,-.15,.15,.036,.103,.017,ivory).rotation.z=-.5;
  props.push({object:lantern(p,-1.98,2.48,1.84),kind:'lantern'});
  return {x:-1.47,z:1.52,roofY:5.55,width:1.25,height:2.17,doorColor:raspberry,trim:clapboard,starY:3.47};
}

function cog(p,x,y,z,r,main) {
  const g=group(p,x,y,z);
  disk(g,0,0,0,r*.82,main,12);
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    box(g,r*.82*Math.sin(a),r*.82*Math.cos(a),0,r*.29,r*.35,.16,main).rotation.z=-a;
  }
  disk(g,0,0,.11,r*.43,ivory,10);
  disk(g,0,0,.18,r*.19,'#93633c',8);
  return g;
}

function locomotive(p,x,z,scale) {
  const g=group(p,x,0,z);g.scale.setScalar(scale);
  box(g,0,.43,0,1.65,.18,.75,'#904144');
  const barrel=tube(g,.25,.77,0,.3,.3,.92,'#387461',10);barrel.rotation.z=Math.PI/2;
  box(g,-.56,.96,0,.61,.98,.73,'#ce8748');
  box(g,-.57,1.51,0,.85,.14,.93,'#4a6660');
  box(g,-.56,1.16,.38,.39,.36,.05,'#ffe2a0');
  tube(g,.46,1.27,0,.18,.13,.62,'#7a4d46',8);
  tube(g,.46,1.59,0,.23,.19,.13,'#b8874c',8);
  for(const side of [-1,1]) {
    for(const xx of [-.54,.08,.59]) {
      disk(g,xx,.29,side*.43,.25,'#6b4b46',10);
      disk(g,xx,.29,side*.46,.135,'#deae64',8);
    }
    box(g,.03,.29,side*.475,1.16,.06,.04,'#b98f59');
  }
  return g;
}

function workshop(p,props) {
  const green='#538273', deep='#315f55', brass='#ddab64', cedar='#8c6450';
  // Two north-light workshop roofs meet an asymmetric square clock tower.
  const front=1.46;
  box(p,-.72,1.49,-.03,4.45,2.98,2.98,green);
  for(let j=0;j<2;j++) {
    const x=-2.97+j*2.23;
    sheet(p,x,2.97,front,[[0,0],[2.24,0],[2.24,1.18]],j?'#729080':'#70887a',2.98);
    rod(p,x-.11,3.02,-.03,x+2.29,4.26,-.03,.24,deep,3.31);
    rod(p,x-.12,3.14,-.03,x+2.29,4.38,-.03,.103,snow,3.38);
    sheet(p,x+.08,3.04,front+.05,[[.51,0],[1.88,0],[1.88,.78]],'#efd18b');
  }
  for(const x of [-2.75,-1.26,.36,1.16]) box(p,x,1.5,front+.075,.14,3,.15,brass);
  box(p,-.72,2.79,front+.1,4.46,.18,.17,brass);
  windowPane(p,-2.04,1,front+.1,.91,1.2,brass);
  windowPane(p,.48,1,front+.1,.94,1.2,brass);
  const tx=2.04;
  box(p,tx,2.46,-.24,1.87,4.92,2.33,deep);
  box(p,tx,4.79,-.24,2.03,.21,2.49,brass);
  const roof=tube(p,tx,5.57,-.24,.07,1.79,1.44,'#a44d4b',4);roof.rotation.y=Math.PI/4;
  tube(p,tx,6.37,-.24,.04,.12,.3,brass);
  disk(p,tx,3.94,.986,.66,brass);
  disk(p,tx,3.94,1.047,.51,ivory);
  for(let j=0;j<4;j++) {
    const a=j*Math.PI/2;
    disk(p,tx+.39*Math.sin(a),3.94+.39*Math.cos(a),1.106,.042,deep,8,.03);
  }
  rod(p,tx,3.94,1.13,tx-.22,4.15,1.13,.056,deep);
  rod(p,tx,3.94,1.14,tx+.23,4.03,1.14,.06,deep);
  cog(p,tx,2.19,1.01,.51,brass);
  cog(p,tx+.51,1.59,1.04,.37,'#b97948');
  props.push({object:locomotive(p,2.27,2.02,1.04),kind:'present'});
  props.push({object:present(p,-2.94,2.04,.56,'#ac454d',brass),kind:'present'});
  return {x:-.82,z:front+.07,roofY:4.36,width:1.2,height:2.1,doorColor:'#a24b40',trim:brass,starY:3.33};
}

function marketStall(p,x,z,h,w,body,accents) {
  const g=group(p,x,0,z);
  box(g,0,.66,0,w,1.31,1.38,body);
  for(let col=0;col<5;col++) box(g,-w*.4+col*w*.2,.62,.707,.045,1.11,.04,'#d6aa7b');
  box(g,0,1.31,.1,w+.23,.17,1.65,'#d3a176');
  for(const xx of [-w*.46,w*.46]) for(const zz of [-.63,.63]) {
    box(g,xx,h/2,zz,.13,h,.14,'#855940');
  }
  gable(g,{w:w+.13,d:1.62,y:h-.15,wall:.22,rise:.66,body,roof:body,cap:accents[1],trim:accents[0],over:.12});
  pennants(g,-w*.53,w*.53,h+.03,.94,accents);
  for(let j=0;j<3;j++) {
    const bowl=tube(g,(j-1)*w*.29,1.5,.35,.29,.22,.22,accents[1],8);
    for(let k=0;k<3;k++) ball(g,bowl.position.x+(k-1)*.13,1.65+.05*(k%2),.35,.12,.12,.12,j%2?red:gold);
  }
  return g;
}

function market(p,props) {
  const claret='#924653', wine='#6f404c', linen='#ffe4b6', plank='#aa7753';
  // A hip-roofed lantern pavilion flanked by two independent street booths.
  tube(p,0,1.55,-.45,2.17,2.26,3.1,claret,4).rotation.y=Math.PI/4;
  box(p,0,2.94,-.45,3.52,.24,3.52,linen);
  const roof=tube(p,0,4.14,-.45,.56,2.57,2.34,wine,4);roof.rotation.y=Math.PI/4;
  tube(p,0,5.35,-.45,.61,.67,.23,linen,4).rotation.y=Math.PI/4;
  tube(p,0,5.76,-.45,.39,.4,.65,'#ffe4a1',4).rotation.y=Math.PI/4;
  tube(p,0,6.18,-.45,.055,.66,.47,claret,4).rotation.y=Math.PI/4;
  for(const side of [-1,1]) {
    box(p,side*1.42,1.49,1.12,.16,2.93,.17,linen);
    rod(p,side*1.62,3.15,1.19,side*.39,5.26,.01,.085,linen);
  }
  marketStall(p,-2.62,.65,2.24,1.84,wine,[claret,linen]).rotation.y=-.12;
  marketStall(p,2.66,.36,2.48,1.94,plank,[linen,'#bd7661']).rotation.y=.12;
  for(const side of [-1,1]) {
    const g=group(p,side*1.58,0,2.02);
    box(g,0,1.54,0,.09,3.06,.09,plank);
    box(g,-side*.13,3.04,0,.34,.08,.095,plank);
    props.push({object:lantern(g,-side*.2,2.86,.04),kind:'lantern'});
  }
  pennants(p,-2.74,2.66,3.16,2.05,[claret,linen,gold]);
  return {x:0,z:1.1,roofY:5.35,width:1.28,height:2.23,doorColor:'#627166',trim:linen,starY:3.44};
}

function upturnedRoof(p,x,y,z,w,d,rise,body) {
  // The compound paper fold leaves the tips curled up at the eaves.
  const front=z+d/2;
  sheet(p,x,y,front,[[-w/2,.12],[-w*.42,0],[0,rise],[w*.42,0],[w/2,.12],
    [w*.48,.33],[w*.39,.22],[0,rise+.28],[-w*.39,.22],[-w*.48,.33]],body,d);
  for(const side of [-1,1]) {
    rod(p,x+side*w*.42,y+.2,front+.025,x,y+rise+.25,front+.025,.092,'#d3ddc9');
    rod(p,x+side*w*.42,y+.2,front+.025,x+side*w*.5,y+.34,front+.025,.083,'#d3ddc9');
  }
}

function aurora(p,props) {
  const spruce='#385861', sea='#7da9a0', bronze='#c1a46f', plum='#4c4f66';
  // Translucent-looking bands are opaque folded tissue, tucked behind the roof.
  for(let band=0;band<2;band++) {
    const crest=[[-3.57,4.2],[-2.82,4.9],[-1.89,5.13],[-1.03,5.09],[-.31,5.39],[.61,5.94],[1.36,6.13],[2.3,5.98],[3.23,5.62],[3.8,5.52]];
    for(let i=0;i<crest.length-1;i++) {
      const [ax,ay]=crest[i],[bx,by]=crest[i+1],z=-2.81-band*.31;
      const h0=.14+.24*Math.sin(Math.PI*i/(crest.length-1)),h1=.14+.24*Math.sin(Math.PI*(i+1)/(crest.length-1));
      sheet(p,0,band*.38,z,[[ax,ay],[bx,by],[bx,by+h1],[ax,ay+h0]],band?['#86aa9c','#94b4a2'][i%2]:['#92bdac','#aacaba'][i%2],.045);
    }
  }
  box(p,0,1.45,-.12,4,2.88,3.05,spruce);
  gable(p,{w:3.12,d:2.6,z:.12,y:2.68,wall:.62,rise:1.27,body:'#64847f',roof:spruce,cap:'#c9dacf',trim:bronze,over:.16});
  upturnedRoof(p,0,2.68,-.12,5.26,3.76,1.44,plum);
  box(p,0,4.12,-.12,1.65,.89,1.64,'#587a78');
  upturnedRoof(p,0,4.39,-.12,2.83,2.28,1.12,spruce);
  // Crossed, notched roof finials are cut from a single sheet each.
  for(const side of [-1,1]) {
    sheet(p,0,5.56,1.11,[[0,-.18],[side*.83,.36],[side*.9,.65],[side*.62,.51],[side*.46,.51],[side*.42,.38],[0,.04]],bronze);
    const x=side*1.81;
    box(p,x,1.49,1.45,.19,2.94,.2,bronze);
    for(let j=0;j<3;j++) {
      const diamond=box(p,x,.81+j*.56,1.57,.15,.15,.08,plum);
      diamond.rotation.z=Math.PI/4;
    }
    windowPane(p,side*1.31,.99,1.46,.63,1.17,sea,true);
    box(p,side*2.02,.41,1.47,.34,.79,.29,sea);
  }
  for(const x of [-.36,.36]) windowPane(p,x,3.03,1.48,.49,.71,bronze,true);
  disk(p,0,4.17,1.34,.26,bronze,12);
  // A little papermobile hangs from the porch brackets.
  rod(p,-1.88,2.64,1.68,-2.5,2.86,1.68,.084,bronze);
  for(let j=0;j<3;j++) {
    const xx=-2.46+j*.2,y=2.2+j*.12;
    rod(p,xx,2.8,1.68,xx,y,1.68,.024,bronze);
    star(p,xx,y,1.7,.112,'#e4c485',.36);
  }
  props.push({object:lantern(p,1.92,2.54,1.82),kind:'lantern'});
  return {x:0,z:1.42,roofY:5.73,width:1.27,height:2.12,doorColor:plum,trim:bronze,starY:3.97};
}

function snowCottage(p,props) {
  const frost='#c2dce0', blue='#779ba7', trim='#f0e9d7';
  // Each lifted course is a separate folded strip. Narrow trapezoidal joints
  // alternate like the running bond on a real snow-brick dome.
  const rows=[
    [0,.78,2.6,2.55],[.78,1.5,2.55,2.42],[1.5,2.17,2.42,2.18],
    [2.17,2.78,2.18,1.87],[2.78,3.33,1.87,1.49],[3.33,3.79,1.49,.96],[3.79,4.1,.96,.22]
  ];
  rows.forEach(([lo,hi,base,top],i)=>{
    const n=14,angle=i%2*Math.PI/n,g=group(p,.31,(lo+hi)/2,-.56);
    const course=tube(g,0,0,0,top,base,hi-lo-.028,[frost,'#d9e7e6','#d1e2e4'][i%3],n);
    course.rotation.y=angle;
    for(let j=0;j<n;j++) {
      const a=angle+j*Math.PI*2/n;
      rod(g,Math.sin(a)*(base+.013),-(hi-lo)/2,-Math.cos(a)*(base+.013),
        Math.sin(a)*(top+.012),(hi-lo)/2,-Math.cos(a)*(top+.012),.026,'#a3c1cb');
    }
  });
  // The open snow tunnel protrudes beyond the dome.
  arch(p,0,.05,2.28,2.55,2.92,blue,2.2);
  arch(p,0,.08,2.34,2.45,2.88,frost,.23);
  for(const side of [-1,1]) {
    for(let j=0;j<3;j++) box(p,side*1.07,.45+j*.53,2.37,.36,.39,.15,trim);
    for(let j=0;j<3;j++){
      const a=(j+.65)*Math.PI/7,xx=side*1.07*Math.cos(a);
      box(p,xx,1.8+.94*Math.sin(a),2.4,.35,.23,.19,snow).rotation.z=side*a;
    }
  }
  const dormer=group(p,1.62,1.67,.96);dormer.rotation.y=.44;
  roundWindow(dormer,0,0,.12,.57,blue);
  props.push({object:snowman(p,-2.24,1.63,1.04),kind:'snowman'});
  props.push({object:lantern(p,1.23,2.17,2.57),kind:'lantern'});
  return {x:0,z:2.37,roofY:4.15,width:1.45,height:2.13,doorColor:'#759ca5',trim,starY:2.98};
}

function sleigh(p,x,z) {
  const g=group(p,x,0,z);
  sheet(g,0,.22,.44,[[-.92,.12],[-.86,.48],[-.6,.63],[-.48,.37],[.48,.37],[.77,.69],[.91,.74],[.91,.45],[.67,.09]],red,.19);
  sheet(g,0,.22,-.32,[[-.92,.12],[-.86,.48],[-.6,.63],[-.48,.37],[.48,.37],[.77,.69],[.91,.74],[.91,.45],[.67,.09]],red,.14);
  box(g,-.08,.56,0,1.54,.15,.79,'#d59f6d');
  for(const side of [-1,1]) {
    const zz=side*.4;
    rod(g,-1.03,.11,zz,.82,.11,zz,.075,gold);
    rod(g,.82,.11,zz,1.07,.34,zz,.075,gold);
    for(const xx of [-.54,.49]) rod(g,xx,.14,zz,xx+.14,.45,zz,.072,gold);
  }
  return g;
}

function lodge(p,props) {
  const cedar='#a0714f', bark='#705440', pine='#496558', green='#6e826a';
  const r=gable(p,{w:5.56,d:3.33,wall:2.64,rise:1.98,body:cedar,roof:pine,cap:'#e6e5cf',trim:'#d6b387',over:.4});
  // Scored log siding and protruding cut ends frame the porch.
  for(let j=0;j<8;j++) {
    box(p,0,.2+j*.315,r.front+.02,5.4,.035,.06,bark);
    for(const side of [-1,1]) disk(p,side*2.7,.21+j*.32,r.front+.11,.18,j%2?'#c89b67':'#bb8861',8);
  }
  for(const side of [-1,1]) {
    const x=side*1.71;
    windowPane(p,x,.83,r.front+.12,1.15,1.27,'#d4b383');
    for(const s of [-1,1]) {
      box(p,x+s*.75,1.46,r.front+.13,.29,1.22,.08,green);
      for(let j=0;j<4;j++) box(p,x+s*.75,1.04+j*.25,r.front+.195,.22,.04,.05,pine);
    }
  }
  // A second gable projects over the deep covered front porch.
  gable(p,{z:1.89,y:2.34,w:3.48,d:1.83,wall:.22,rise:1.1,body:bark,roof:pine,cap:snow,trim:'#dbb480',over:.19});
  for(const side of [-1,1]) {
    box(p,side*1.56,1.24,2.66,.21,2.48,.23,bark);
    rod(p,side*1.56,1.89,2.66,side*1.19,2.5,2.66,.13,'#be9361');
    for(let j=0;j<2;j++) box(p,side*(1.12+j*.21),.56,2.55,.09,.61,.13,bark);
    box(p,side*1.25,.9,2.55,.72,.13,.17,'#c29663');
  }
  for(const side of [-1,1]) {
    rod(p,0,3.02,2.86,side*.54,3.37,2.86,.1,ivory,.075);
    rod(p,side*.33,3.23,2.86,side*.37,3.48,2.86,.07,ivory);
  }
  chimney(p,-1.72,3.42,-.56,1.68,'#85776a');
  props.push({object:reindeer(p,3.05,2.12,.85),kind:'reindeer'});
  props.push({object:sleigh(p,-2.57,2.6),kind:'present'});
  return {x:0,z:r.front+.13,roofY:r.peak,width:1.29,height:2.07,doorColor:pine,trim:'#dcb886',starY:3.94};
}

function peppermint(p,x,y,z,r) {
  const g=group(p,x,y,z);
  disk(g,0,0,0,r,ivory,20,.15);
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;
    const wedge=sheet(g,0,0,.082,[[0,0],[r*.53,.08*r],[r*.94,.33*r],[r*.82,.52*r],[r*.46,.16*r]],'#cb656a',.02);
    wedge.rotation.z=a;
  }
  return g;
}

function sweets(p,props) {
  const rose='#cc8081', coral='#bd535f', pink='#efb7ac', sugar='#ffedcc';
  // A folded confectioner's gift box, tied with giant ribbon and a candy turret.
  box(p,-.37,1.48,-.2,4.38,2.96,2.87,rose);
  box(p,-.37,2.96,-.2,4.77,.38,3.22,coral);
  box(p,-.37,3.17,-.2,4.83,.11,3.29,sugar);
  for(const x of [-2.36,-.21,1.67]) {
    box(p,x,1.5,1.27,.24,2.89,.12,pink);
    box(p,x,3.25,-.2,.27,.11,3.22,pink);
  }
  box(p,-.38,3.27,-.18,4.79,.11,.35,pink);
  const leftBow=sheet(p,-.36,3.31,.15,[[0,0],[-.49,.58],[-.89,.81],[-1.19,.64],[-1.13,.31],[-.77,.19]],coral,.35);
  leftBow.rotation.y=.15;
  sheet(p,-.36,3.31,.18,[[0,0],[.44,.56],[.85,.81],[1.23,.65],[1.18,.33],[.78,.2]],coral,.32);
  for(const side of [-1,1]) sheet(p,-.36,3.36,.21,[[side*.17,0],[side*.7,.46],[side*.93,.52],[side*.85,.35],[side*.61,.21]],pink,.05);
  ball(p,-.36,3.49,.09,.27,.23,.27,rose);
  windowPane(p,-1.75,.72,1.3,.96,1.32,sugar,true);
  peppermint(p,-1.74,2.51,1.4,.33);
  const towerX=1.83,towerZ=-.22,r=1.38;
  tube(p,towerX,1.72,towerZ,r,r,3.44,pink,8);
  for(const [y,height,color] of [[.14,.28,coral],[2.65,.11,sugar],[3.32,.28,coral]]) {
    tube(p,towerX,y,towerZ,r+.07,r+.07,height,color,8);
  }
  tube(p,towerX,4.57,towerZ,.055,r+.24,2.31,coral,8);
  for(let j=0;j<4;j++){
    const lo=j*.49,hi=lo+.21,baseR=r+.24;
    tube(p,towerX,3.42+(lo+hi)/2,towerZ,baseR*(1-hi/2.34),baseR*(1-lo/2.34),hi-lo,pink,8);
  }
  ball(p,towerX,5.86,towerZ,.2,.21,.2,gold);
  windowPane(p,towerX,1.04,1.1,.86,1.56,sugar,true);
  const lolly=(x,z,h,radius)=>{
    const g=group(p,x,0,z);
    rod(g,0,.04,0,0,h,0,.11,sugar);
    peppermint(g,0,h,0,radius);
    return g;
  };
  props.push({object:lolly(-2.95,1.45,1.61,.55),kind:'present'});
  props.push({object:lolly(3.22,1.63,1.72,.49),kind:'present'});
  for(const sign of [-1,1]) stripedPole(p,-.37+sign*.78,0,1.53,2.33,coral,.1);
  return {x:-.37,z:1.32,roofY:4.08,width:1.21,height:2.15,doorColor:coral,trim:sugar,starY:2.92};
}

function observatory(p,props) {
  const plum='#67536e', night='#494860', lilac='#9a8197', brass='#d7a558';
  // A twelve-facet copper dome with embossed ribs and a hinged viewing slit.
  const tx=.7,tz=-.34,r=2.14;
  tube(p,tx,1.64,tz,r,r+.12,3.28,plum,12);
  tube(p,tx,3.17,tz,r+.17,r+.17,.28,lilac,12);
  tube(p,tx,3.41,tz,r+.21,r+.17,.17,brass,12);
  const profile=[[0,2.26],[.45,2.19],[.93,1.97],[1.38,1.58],[1.77,1.02],[2.02,.35]];
  for(let i=1;i<profile.length;i++){
    const [a,ra]=profile[i-1],[b,rb]=profile[i];
    tube(p,tx,3.45+(a+b)/2,tz,rb,ra,b-a,i%2?'#d5a85e':'#cf9c57',12);
    for(let j=0;j<12;j+=2){
      const angle=j*Math.PI/6;
      rod(p,tx+Math.sin(angle)*ra,3.45+a,tz+Math.cos(angle)*ra,tx+Math.sin(angle)*rb,3.45+b,tz+Math.cos(angle)*rb,.062,'#f2c778');
    }
  }
  tube(p,tx,5.51,tz,.27,.43,.22,brass,12);
  star(p,tx,5.99,tz,.49,brass,.35);
  // A telescope gazes upward from the dome toward the street.
  const telescope=group(p,tx+.68,4.54,tz+1.28);
  telescope.rotation.x=1.11;telescope.rotation.z=-.13;
  tube(telescope,0,.45,0,.27,.2,1.15,night,12);
  tube(telescope,0,1.02,0,.36,.35,.23,brass,12);
  tube(telescope,0,1.155,0,.24,.24,.045,'#b1cecf',12);
  for(const [xx,aa] of [[-.58,-.36],[2.1,.52]]) {
    const g=group(p,xx,1.27,tz+1.91);g.rotation.y=aa;
    roundWindow(g,0,0,.08,.47,brass);
  }
  gable(p,{x:-1.91,z:.05,w:2.37,d:2.81,wall:2.24,rise:1.15,body:lilac,roof:night,trim:brass,cap:'#dfd9cf'});
  star(p,-1.91,2.86,1.55,.26,brass,.36);
  const positions=[[-2.5,2.11],[-2.19,2.24],[-1.72,2.09],[-1.41,2.3]];
  for(let i=0;i<positions.length;i++) {
    const [x,y]=positions[i];disk(p,x,y,1.48,.055,ivory,8);
    if(i) rod(p,...positions[i-1],1.47,x,y,1.47,.024,brass);
  }
  props.push({object:lantern(p,-2.78,2.02,1.8),kind:'lantern'});
  return {x:-1.87,z:1.47,roofY:5.63,width:1.24,height:1.86,doorColor:night,trim:brass,starY:2.79};
}

function palaceTower(p,x,z,r,wall,spire) {
  const ruby='#a84d55', goldTrim='#deb16a', parchment='#f4d7b5';
  const g=group(p,x,0,z);
  const orientation=Math.PI/8;
  const drum=(y,top,bottom,h,c)=>{const m=tube(g,0,y,0,top,bottom,h,c,8);m.rotation.y=orientation;return m;};
  drum(wall/2,r,r+.06,wall,parchment);
  drum(.25,r+.15,r+.15,.42,'#bb7771');
  drum(wall-.35,r+.12,r+.1,.16,goldTrim);
  drum(wall-.09,r+.15,r+.15,.29,'#c97a70');
  drum(wall+.13,r+.23,r+.18,.16,snow);
  drum(wall+.45*spire,r*.11,r+.32,spire*.89,ruby);
  drum(wall+spire*.92,.04,r*.15,spire*.18,goldTrim);
  ball(g,0,wall+spire*1.05,0,.14,.145,.14,goldTrim);
  box(g,0,wall+spire*1.29,0,.039,spire*.44,.049,goldTrim);
  sheet(g,0,wall+spire*1.49,.04,[[0,0],[.64,-.095],[.45,-.21],[.61,-.32],[0,-.27]],ruby,.04);
  windowPane(g,0,wall*.5,r*.95,r*.75,wall*.29,'#bf8974',true);
  for(const side of [-1,1]) {
    rod(g,side*r*.66,wall*.09,r*.71,side*r*.66,wall-.44,r*.71,.08,goldTrim);
  }
  return g;
}

function palace(p,props) {
  const ruby='#ac5058', cream='#ebcba4', rose='#c5877a', gilt='#d9aa5d';
  box(p,0,1.78,-.32,4.93,3.56,3.48,cream);
  box(p,0,3.45,-.32,5.04,.31,3.58,rose);
  box(p,0,3.67,-.32,5.15,.14,3.7,snow);
  for(const x of [-2.28,-1.53,-.77,0,.77,1.53,2.28]) {
    box(p,x,3.89,1.41,.46,.42,.31,cream);
    box(p,x,4.13,1.41,.52,.09,.36,snow);
  }
  palaceTower(p,-2.51,-.26,.91,4.1,1.75);
  palaceTower(p,2.48,-.32,1.04,4.56,1.99);
  palaceTower(p,-.36,-1.03,1.04,5.39,1.96);
  // Raised champagne-card portal and a ruby canopy resembling a paper crown.
  arch(p,0,.05,1.97,2.77,3.72,rose,.99);
  arch(p,0,.09,2.06,2.48,3.42,cream,.14);
  sheet(p,0,3.62,2.05,[[-1.42,.06],[-1.47,.82],[-.84,.41],[-.54,.95],[0,.52],[.54,.95],[.84,.41],[1.47,.82],[1.42,.06]],gilt,.18);
  for(const x of [-1.43,-.53,.53,1.43]) ball(p,x,4.47+(Math.abs(x)<.6?.12:0),1.99,.105,.12,.1,'#f7d389');
  for(const side of [-1,1]){
    const x=side*1.66;
    windowPane(p,x,1.58,1.5,.73,1.27,rose,true);
    rod(p,x-.29,1.29,1.64,x+.29,1.29,1.64,.07,gilt);
    sheet(p,x,1.26,1.64,[[-.25,0],[.25,0],[.25,-.58],[0,-.81],[-.25,-.58]],ruby,.045);
    star(p,x,.88,1.69,.14,gilt,.34);
  }
  for(let i=0;i<3;i++){
    const w=3.58-i*.21,z=2.41-i*.18;
    box(p,0,.07+i*.105,z,w,.13,.91,'#ca9b78');
    box(p,0,.144+i*.105,z,w,.035,.91,'#e9d6b6');
  }
  for(const side of [-1,1]){
    const g=group(p,side*1.98,0,2.24);
    tube(g,0,.56,0,.11,.2,1.12,gilt,6);
    props.push({object:lantern(g,0,1.77,.04),kind:'lantern'});
  }
  return {x:0,z:2.08,roofY:6.67,width:1.54,height:2.47,base:.35,doorColor:ruby,trim:gilt,starY:3.75};
}

const designs=[gingerbread,alpine,frost,bakery,workshop,market,aurora,snowCottage,lodge,sweets,observatory,palace];

export function buildHouse(index, language='en') {
  if (!Number.isInteger(index) || index<1 || index>designs.length) throw new RangeError('Invalid mission house');
  const root=new T.Group(), props=[];
  root.name='Mission '+index;
  const s=designs[index-1](root,props,language);
  const fittings=entry(root,s.x,s.z,s.doorColor,s.trim,s.width,s.height,s.base);
  const prize=group(root,s.x,s.starY,s.z+.33);
  star(prize,0,0,0,.52,'#bd813c');
  star(prize,-.02,.025,.1,.45,'#ffd678');
  const festive=group(root);
  pennants(festive,s.x-1.48,s.x+1.48,s.starY-.2,s.z+.43,[red,gold,'#668a68',ivory]);
  for(const side of [-1,1]) present(festive,s.x+side*1.56,s.z+.47,.48,side<0?red:'#578570',gold);
  prize.visible=festive.visible=false;
  return {root,...fittings,star:prize,festive,roofY:s.roofY,props};
}
