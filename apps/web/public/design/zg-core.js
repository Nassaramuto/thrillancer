(function(Z){
const T=THREE;Z.T=T;
let seed=11;
Z.R=(a=1,b)=>{seed=(seed*16807)%2147483647;const r=(seed-1)/2147483646;return b===undefined?r*a:a+r*(b-a)};
Z.rnd=(a=1,b)=>{const r=Math.random();return b===undefined?r*a:a+r*(b-a)};
const R=Z.R;
const mc={},bc={};
const MC=Z.MC=(c,o)=>{const k=c+(o?JSON.stringify(o):'');return mc[k]||(mc[k]=new T.MeshStandardMaterial(Object.assign({color:c,flatShading:true,roughness:.9,metalness:0},o||{})))};
const B=Z.B=(c,o)=>{const k=c+(o?JSON.stringify(o):'');return bc[k]||(bc[k]=new T.MeshBasicMaterial(Object.assign({color:c},o||{})))};
Z.EM=(c,i=1.3)=>MC(c,{emissive:c,emissiveIntensity:i});
const mesh=Z.mesh=(g,m,x=0,y=0,z=0,p)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);if(p)p.add(o);return o};
Z.box=(w,h,d,m,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
Z.cyl=(rt,rb,h,m,x,y,z,p,s=14)=>mesh(new T.CylinderGeometry(rt,rb,h,s),m,x,y,z,p);
Z.sph=(r,m,x,y,z,p,ws=10,hs=8)=>mesh(new T.SphereGeometry(r,ws,hs),m,x,y,z,p);
Z.cone=(r,h,m,x,y,z,p,s=8)=>mesh(new T.ConeGeometry(r,h,s),m,x,y,z,p);
const {box,cyl,sph,cone}=Z;
Z.tex=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.anisotropy=4;return t};
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
Z.rr=rr;
function textCanvas(lines,o){
  o=Object.assign({w:512,h:128,bg:'rgba(14,9,40,.85)',fg:'#fff',fg2:'#b9b2ff',border:null,mono:false,r:18,pad:24,weight:'700'},o);
  const c=document.createElement('canvas');c.width=o.w;c.height=o.h;const g=c.getContext('2d');
  if(o.bg){g.fillStyle=o.bg;rr(g,0,0,o.w,o.h,o.r);g.fill()}
  if(o.border){g.strokeStyle=o.border;g.lineWidth=6;rr(g,3,3,o.w-6,o.h-6,o.r);g.stroke()}
  lines=[].concat(lines);const fam=o.mono?'"JetBrains Mono",ui-monospace,Menlo,monospace':'"Plus Jakarta Sans",system-ui,sans-serif';
  const sizes=lines.map((_,i)=>i?.55:1);const tot=sizes.reduce((a,b)=>a+b*1.25,0);
  let fs=Math.min(o.h*.8/tot,110);
  let fit=1;lines.forEach((l,i)=>{g.font=`${i?500:o.weight} ${fs*sizes[i]}px ${fam}`;const w=g.measureText(l).width;fit=Math.min(fit,(o.w-o.pad*2)/w)});
  fs*=fit;let y=(o.h-tot*fs)/2;g.textAlign='center';g.textBaseline='middle';
  lines.forEach((l,i)=>{const s=fs*sizes[i];g.font=`${i?500:o.weight} ${s}px ${fam}`;g.fillStyle=i?o.fg2:o.fg;y+=s*.625;g.fillText(l,o.w/2,y);y+=s*.625});
  return c}
Z.sign=(lines,w,h,o={})=>{o=Object.assign({w:512},o);o.h=Math.max(64,Math.round(o.w*h/w));const t=new T.CanvasTexture(textCanvas(lines,o));t.anisotropy=4;
  const gm=new T.PlaneGeometry(w,h),mt=new T.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}),g=new T.Group(),a=new T.Mesh(gm,mt),b=new T.Mesh(gm,mt);b.rotation.y=Math.PI;g.add(a,b);return g};
Z.label=(lines,w,h,o={})=>{o=Object.assign({w:512},o);o.h=Math.max(64,Math.round(o.w*h/w));const t=new T.CanvasTexture(textCanvas(lines,o));
  const s=new T.Sprite(new T.SpriteMaterial({map:t,depthWrite:false,transparent:true,fog:false}));s.scale.set(w,h,1);return s};
const gt=Z.tex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
Z.glow=(c,s,x,y,z,p,op=.9)=>{const sp=new T.Sprite(new T.SpriteMaterial({map:gt,color:c,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:op}));sp.scale.set(s,s,1);sp.position.set(x,y,z);if(p)p.add(sp);return sp};
// windows
const wm=Z.tex(128,192,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++){g.fillStyle='#5b5380';g.fillRect(c*32+7,r*48+9,18,28);g.fillStyle='#e8dcc8';g.fillRect(c*32+7,r*48+9,18,3)}});
const we=Z.tex(128,192,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++){if(((r*7+c*13+(r*c))%5)<3){g.fillStyle=((r+c)%4==1)?'#ffb36b':'#ffd58a';g.fillRect(c*32+8,r*48+10,16,26)}}});
[wm,we].forEach(t=>{t.wrapS=t.wrapT=T.RepeatWrapping});
const wmat={};
Z.wallMat=c=>wmat[c]||(wmat[c]=new T.MeshStandardMaterial({color:c,map:wm,emissive:0xffffff,emissiveMap:we,emissiveIntensity:1.15,flatShading:true,roughness:.9}));
Z.winGeo=(w,h,d)=>{const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv;for(let f=0;f<6;f++){const ext=f<2?d:w;for(let i=0;i<4;i++){const k=f*4+i;if(f===2||f===3)uv.setXY(k,uv.getX(k)*w/8,uv.getY(k)*d/12);else uv.setXY(k,uv.getX(k)*ext/8,uv.getY(k)*h/12)}}return g};
Z.winBox=(w,h,d,c,x,y,z,p,roof)=>{const wl=Z.wallMat(c),rf=MC(roof??0x3a3556);return mesh(Z.winGeo(w,h,d),[wl,wl,rf,rf,wl,wl],x,y+h/2,z,p)};
// instancing
Z.inst=(geo,mat,list,p)=>{const m=new T.InstancedMesh(geo,mat,list.length),o=new T.Object3D();list.forEach((a,i)=>{o.position.set(a[0],a[1],a[2]);o.rotation.set(0,a[3]||0,0);o.scale.set(a[4]??1,a[5]??a[4]??1,a[6]??a[4]??1);o.updateMatrix();m.setMatrixAt(i,o.matrix)});m.instanceMatrix.needsUpdate=true;if(p)p.add(m);return m};
// collisions
Z.circles=[];Z.boxes=[];Z.platforms=[];
Z.addC=(x,z,r)=>Z.circles.push({x,z,r});
Z.addB=(x0,x1,z0,z1)=>Z.boxes.push({x0,x1,z0,z1});
Z.addP=(x0,x1,z0,z1,h)=>Z.platforms.push({x0,x1,z0,z1,h});
Z.ringC=(cx,cz,r,aGap,gh,cr,n)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;let d=Math.abs(((a-aGap+Math.PI*3)%(Math.PI*2))-Math.PI);d=Math.abs(d);const dd=Math.min(Math.abs(a-aGap),Math.PI*2-Math.abs(a-aGap));if(aGap!==null&&dd<gh)continue;Z.addC(cx+Math.cos(a)*r,cz+Math.sin(a)*r,cr)}};
Z.groundH=(x,z)=>{let h=0;if(Math.hypot(x-75,z+10)<25)h=4;else if(Math.abs(z+10)<6&&x>=40&&x<52)h=4*Math.min(1,(x-40)/10);for(const p of Z.platforms)if(x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1&&p.h>h)h=p.h;for(const m of Z.mounds||[]){const d=Math.hypot(x-m.x,z-m.z);if(d<m.r){const v=m.h*(1-d*d/(m.r*m.r));if(v>h)h=v}}return h};
Z.resolve=(p,r)=>{for(const c of Z.circles){const dx=p.x-c.x,dz=p.z-c.z,m=c.r+r,d2=dx*dx+dz*dz;if(d2<m*m&&d2>1e-8){const d=Math.sqrt(d2);p.x=c.x+dx/d*m;p.z=c.z+dz/d*m}}
 for(const b of Z.boxes){const cx=Math.max(b.x0,Math.min(p.x,b.x1)),cz=Math.max(b.z0,Math.min(p.z,b.z1)),dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
  if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r}else{const l=p.x-b.x0,rr2=b.x1-p.x,t=p.z-b.z0,bt=b.z1-p.z,m=Math.min(l,rr2,t,bt);if(m===l)p.x=b.x0-r;else if(m===rr2)p.x=b.x1+r;else if(m===t)p.z=b.z0-r;else p.z=b.z1+r}}}
 const d=Math.hypot(p.x,p.z);if(d>188){p.x*=188/d;p.z*=188/d}};
// solid sector / ring wall (angle a_w: x=cos a, z=sin a). gap centered aGap (world angle)
Z.sector=(rOut,rIn,h,aGap,gh,mat,x,y,z,p)=>{const s=new T.Shape();let a0,a1;if(aGap===null){a0=0;a1=Math.PI*2}else{a0=-aGap+gh;a1=-aGap+Math.PI*2-gh}
  s.absarc(0,0,rOut,a0,a1,false);if(aGap===null){const hole=new T.Path();hole.absarc(0,0,rIn,0,Math.PI*2,true);s.holes.push(hole)}else s.absarc(0,0,rIn,a1,a0,true);
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:28});g.rotateX(-Math.PI/2);return mesh(g,mat,x,y,z,p)};
// people
Z.person=(o={})=>{
  const g=new T.Group(),P={};const skin=MC(o.skin??0xe3ad86),shirt=MC(o.shirt??0x4466aa),pants=MC(o.pants??0x2a2a44),dk=B(0x14101c),shoe=MC(o.shoe??0x22223a);
  for(const s of[-1,1]){const l=new T.Group();l.position.set(s*.15,.85,0);box(.24,.8,.26,pants,0,-.42,0,l);box(.26,.1,.36,shoe,0,-.82,.05,l);g.add(l);P[s<0?'legL':'legR']=l;
    const a=new T.Group();a.position.set(s*.38,1.52,0);box(.17,.62,.2,shirt,0,-.3,0,a);box(.15,.15,.16,skin,0,-.69,0,a);g.add(a);P[s<0?'armL':'armR']=a}
  P.torso=box(.6,.72,.34,shirt,0,1.22,0,g);
  if(o.glow){box(.5,.06,.02,Z.EM(o.glow,1.6),0,1.36,.18,g);box(.5,.06,.02,Z.EM(o.glow,1.6),0,1.12,.18,g);box(.5,.06,.02,Z.EM(o.glow,1.6),0,1.24,-.18,g)}
  const h=new T.Group();h.position.y=1.78;g.add(h);P.head=h;box(.4,.4,.4,skin,0,0,0,h);box(.06,.07,.02,dk,-.1,.03,.201,h);box(.06,.07,.02,dk,.1,.03,.201,h);box(.1,.025,.02,dk,0,-.1,.201,h);box(.05,.07,.06,skin,0,-.02,.22,h);
  if(o.hair!==null){const hm=MC(o.hair??0x3a2a22);box(.44,.13,.44,hm,0,.24,0,h);box(.44,.3,.1,hm,0,.08,-.17,h)}
  const hc=MC(o.hatc??0xff4fd8);
  switch(o.hat){
   case'cap':box(.46,.1,.46,hc,0,.27,0,h);box(.4,.03,.22,hc,0,.22,.3,h);break;
   case'beanie':box(.46,.2,.46,hc,0,.3,0,h);sph(.07,hc,0,.43,0,h);break;
   case'bunny':for(const s of[-1,1])box(.08,.42,.06,MC(0xf4eef8),s*.1,.5,0,h);break;
   case'horns':for(const s of[-1,1]){const c=cone(.07,.26,MC(0xf5d36a),s*.15,.38,0,h,5);c.rotation.z=-s*.3}break;
   case'visor':box(.44,.13,.05,B(o.vis??0x4de8ff,{transparent:true,opacity:.85}),0,.06,.215,h);box(.43,.05,.43,MC(0x1a1630),0,.2,0,h);break;
   case'crown':box(.4,.08,.4,MC(0xf5c542,{emissive:0x5a4000}),0,.27,0,h);for(let i=-1;i<=1;i++)cone(.05,.14,MC(0xf5c542),i*.14,.38,0,h,4);break;
   case'halo':{const t=mesh(new T.TorusGeometry(.2,.025,5,16),B(0xfff3a0),0,.5,0,h);t.rotation.x=Math.PI/2}break;
   case'antlers':for(const s of[-1,1]){const a=box(.04,.36,.04,MC(0xc9a06a),s*.14,.42,0,h);a.rotation.z=-s*.35;const b=box(.04,.2,.04,MC(0xc9a06a),s*.22,.5,0,h);b.rotation.z=-s*.9}break;
   case'tophat':cyl(.2,.2,.3,hc,0,.42,0,h,10);cyl(.3,.3,.04,hc,0,.27,0,h,10);break;
  }
  g.scale.setScalar(o.scale||1);g.userData.P=P;return g};
Z.walk=(g,sp,t)=>{const P=g.userData.P,s=Math.sin(t*(4+sp*1.2))*Math.min(1,sp/2.5)*.8;P.legL.rotation.x=s;P.legR.rotation.x=-s;P.armL.rotation.x=-s*.8;P.armR.rotation.x=s*.8};
Z.rideP=(g,t,sp)=>{const P=g.userData.P,s=Math.sin(t*sp*.9)*.35;P.legL.rotation.x=-.95+s;P.legR.rotation.x=-.95-s;P.armL.rotation.x=-1.15;P.armR.rotation.x=-1.15};
// bicycle with neon wheels
Z.bike=(c,c2)=>{const g=new T.Group(),W=[],fm=MC(0x2b2740);
  for(const z of[.62,-.62]){const w=new T.Group();w.position.set(0,.5,z);const r=mesh(new T.TorusGeometry(.5,.055,6,20),B(c),0,0,0,w);r.rotation.y=Math.PI/2;const r2=mesh(new T.TorusGeometry(.3,.025,4,14),B(c2||c),0,0,0,w);r2.rotation.y=Math.PI/2;for(let i=0;i<3;i++){const s=box(.03,1,.03,B(c),0,0,0,w);s.rotation.x=i*Math.PI/3}g.add(w);W.push(w)}
  box(.07,.07,1.1,fm,0,.76,0,g);const d=box(.06,.06,.7,fm,0,.8,.25,g);d.rotation.x=.9;box(.06,.55,.06,fm,0,.8,-.2,g);box(.16,.06,.34,MC(c2||c),0,1.07,-.2,g);
  const f=box(.06,.7,.06,fm,0,.82,.55,g);f.rotation.x=-.25;box(.56,.05,.05,fm,0,1.17,.5,g);glow(c,3,0,.15,0,g,.5);
  function glow(...a){return Z.glow(...a)}
  g.userData.wheels=W;return g};
// penguin
Z.penguin=()=>{const g=new T.Group(),bl=MC(0x16162a),wh=MC(0xf4f1ff),or=MC(0xffa63d);
  const b=Z.sph(.5,bl,0,.75,0,g,10,8);b.scale.set(.9,1.25,.8);const bel=Z.sph(.45,wh,0,.72,.12,g,10,8);bel.scale.set(.82,1.15,.7);
  Z.sph(.32,bl,0,1.5,0,g,10,8);Z.sph(.05,wh,-.13,1.56,.27,g,6,5);Z.sph(.05,wh,.13,1.56,.27,g,6,5);Z.sph(.025,bl,-.13,1.56,.31,g,5,4);Z.sph(.025,bl,.13,1.56,.31,g,5,4);
  const bk=cone(.09,.22,or,0,1.47,.34,g,4);bk.rotation.x=Math.PI/2;
  const sc=mesh(new T.TorusGeometry(.3,.07,5,12),MC(0xff4fd8),0,1.25,0,g);sc.rotation.x=Math.PI/2;box(.1,.34,.06,MC(0xff4fd8),.2,1.05,.25,g);
  const fl=[];for(const s of[-1,1]){const f=new T.Group();f.position.set(s*.46,1.0,0);box(.08,.5,.3,bl,0,-.2,0,f);g.add(f);fl.push(f)}
  const ft=[];for(const s of[-1,1]){const f=box(.2,.07,.34,or,s*.2,.04,.1,g);ft.push(f)}
  g.userData={fl,ft};return g};
// unicorn
Z.unicorn=()=>{const g=new T.Group(),wh=MC(0xfdf8ff,{emissive:0x3a2a50}),rb=[0xff4a6a,0xff9a3a,0xffe14a,0x4aff8a,0x4ad0ff,0xb04aff];
  const b=Z.sph(1,wh,0,0,0,g,8,6);b.scale.set(.7,.7,1.5);const n=box(.5,1.4,.6,wh,0,.8,1.2,g);n.rotation.x=.5;
  const hd=box(.5,.5,.9,wh,0,1.55,1.9,g);hd.rotation.x=-.35;cone(.1,.9,Z.EM(0xffe48a,1.4),0,2.2,2.2,g,5).rotation.x=.55;
  rb.forEach((c,i)=>{box(.12,.5,.35,Z.EM(c,.9),0,1.15+i*.0-0,.7+i*.0+(i*.14)-.1,g);});
  rb.forEach((c,i)=>{const t=box(.1,.14,1.2,Z.EM(c,.9),0,.2-i*.1,-1.6,g);t.rotation.x=.3});
  for(const x of[-.35,.35])for(const z of[-.8,.8])box(.2,1.1,.2,wh,x,-.8,z,g);
  const w=[];for(const s of[-1,1]){const p=new T.Group();p.position.set(s*.5,.4,.2);const m=box(2.2,.06,1.1,MC(0xf8f0ff,{emissive:0x8a6aff,emissiveIntensity:.6}),s*1.1,0,0,p);g.add(p);w.push(p)}
  g.userData.wings=w;return g};
})(window.ZG=window.ZG||{});
