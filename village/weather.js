import * as T from './vendor/three.module.min.js';
import {STEP,RADIUS,position} from './landscape.js';
// Local snow fields remain attached to their own plot during a camera turn.
const densities=[32,16,46,36,10,13,14,9,80,41,21,9,31];
export function makeWeather(scene){
  const fields=[],snow=new T.PointsMaterial({size:.061,color:'#fff3df',transparent:true,opacity:.77,depthWrite:false});
  for(let i=0;i<13;i++){
    const group=new T.Group();group.position.copy(position(i*STEP,RADIUS));group.rotation.y=-i*STEP;scene.add(group);
    const slots=new Float32Array(densities[i]*3),seed=[];
    for(let n=0;n<densities[i];n++){const a=Math.sin((n+1)*157.3+i*4.79)*3563.28;seed.push(a-Math.floor(a));}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(slots,3));
    const dots=new T.Points(g,snow);dots.frustumCulled=false;group.add(dots);
    let ribbon=null;
    if(i===7){
      const pts=[],colors=[],indices=[];
      for(let k=0;k<=48;k++){const x=-14+k*.58,y=9+1.1*Math.sin(k*.14);pts.push(x,y,-12,x,y+1.5+.8*Math.cos(k*.19),-12);colors.push(.1,.85,.55,.12,.23,.44);if(k){const j=k*2;indices.push(j-2,j-1,j,j,j-1,j+1);}}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pts,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
      ribbon=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.48,depthWrite:false}));group.add(ribbon);
    }
    fields.push({group,slots,seed,dots,ribbon});
  }
  function frame(t,location){
    for(let i=0;i<13;i++){
      const {group,slots,seed,dots,ribbon}=fields[i],delta=Math.abs(((i-location+19.5)%13)-6.5);
      group.visible=delta<2.3;if(!group.visible)continue;
      if(ribbon)ribbon.rotation.z=.02*Math.sin(t*.18);
      for(let n=0;n<seed.length;n++){
        const k=n*3,s=seed[n],rate=.27+.5*s;
        slots[k]=(s-.5)*15+.33*Math.sin(t*.7+n);slots[k+1]=10-((s*63+t*rate)%10);slots[k+2]=(seed[(n+7)%seed.length]-.45)*11;
      }dots.geometry.attributes.position.needsUpdate=true;
    }
  }
  const bits=45,pos=new Float32Array(bits*3),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
  const shower=new T.Points(g,new T.PointsMaterial({size:.12,color:'#fff4d6',depthWrite:false}));shower.frustumCulled=false;shower.visible=false;scene.add(shower);
  let born=-10,source,spread;
  function burst(t,point,width=4){born=t;source=point.clone();spread=width;}
  function flakes(t){
    const dt=t-born;shower.visible=!!source&&dt>=0&&dt<1.3;if(!shower.visible)return;
    for(let i=0;i<bits;i++){const k=i*3;pos[k]=source.x+Math.sin(i*24.7)*spread*.55+dt*Math.sin(i)*.65;pos[k+1]=source.y-(dt*dt)*(2.2+i%5*.31)+Math.sin(i*37.6)*.27;pos[k+2]=source.z+Math.cos(i*24.71)*spread*.32+dt*Math.cos(i);}
    g.attributes.position.needsUpdate=true;
  }
  return {frame,flakes,burst};
}
