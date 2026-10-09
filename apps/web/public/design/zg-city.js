(function(Z){
const T=Z.T,{MC,B,EM,box,cyl,sph,cone,mesh,sign,label,glow,winBox,inst,person,bike,R,sector}=Z;
const PI=Math.PI,city=Z.city=new T.Group();
Z.updaters=[];Z.interact=[];Z.dest=[];Z.bikes=[];Z.npcs=[];Z.bones=[];
const add=(g,p)=>(p||city).add(g);
const face=(g,x,z,tx,tz)=>{g.rotation.y=Math.atan2(tx-x,tz-z)};
const wpos=(g,lx,lz)=>{g.updateMatrixWorld(true);const v=new T.Vector3(lx,0,lz);g.localToWorld(v);return v};
const NEON=[0x3dffa0,0x4de8ff,0xff4fd8];
// ---------- ground ----------
const gcv=Z.tex(512,512,(g,w,h)=>{g.fillStyle='#8a6a78';g.fillRect(0,0,w,h);for(let i=0;i<1400;i++){g.fillStyle=`rgba(${R(120,190)|0},${R(90,140)|0},${R(110,150)|0},.18)`;g.fillRect(R(w),R(h),R(2,9),R(2,6))}});
gcv.wrapS=gcv.wrapT=T.RepeatWrapping;gcv.repeat.set(40,40);
const ground=mesh(new T.CircleGeometry(330,48),new T.MeshStandardMaterial({color:0xb08a8e,map:gcv,roughness:1}),0,0,0,city);ground.rotation.x=-PI/2;
// ---------- sky ----------
const sky=Z.tex(1024,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);[[0,'#0d0832'],[.2,'#241a6a'],[.36,'#4b3a9c'],[.45,'#9a62b0'],[.49,'#f09a82'],[.5,'#ffbf8a'],[.53,'#a05a86'],[.65,'#3a2658'],[1,'#1c1236']].forEach(s=>gr.addColorStop(s[0],s[1]));g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<260;i++){g.fillStyle=`rgba(255,255,255,${R(.2,.9)})`;const y=R(0,h*.38);g.fillRect(R(w),y,R(1,2.4),R(1,2.4))}});
const skyM=mesh(new T.SphereGeometry(900,32,16),new T.MeshBasicMaterial({map:sky,side:T.BackSide,fog:false,depthWrite:false}),0,0,0,city);skyM.renderOrder=-10;Z.skyM=skyM;
glow(0xffa070,520,-60,60,-780,city,.9);glow(0xffe0a8,150,-60,70,-780,city,.9);
// clouds
const clouds=new T.Group();add(clouds);
for(let i=0;i<16;i++){const c=new T.Group(),a=R(PI*2),d=R(260,520);const cm=MC(i%3?0xd9a0c8:0x9a86e0,{emissive:0x402a60,emissiveIntensity:.5,fog:false});for(let k=0;k<4;k++){const s=T.IcosahedronGeometry?mesh(new T.IcosahedronGeometry(R(14,26),0),cm,k*R(14,22)-30,R(-4,4),R(-6,6),c):0;s.scale.y=.45}c.position.set(Math.cos(a)*d,R(90,170),Math.sin(a)*d);c.userData.sp=R(.4,1.2);clouds.add(c)}
Z.updaters.push((t,dt)=>clouds.children.forEach(c=>{c.position.x+=c.userData.sp*dt;if(c.position.x>600)c.position.x=-600}));
// lights
city.add(new T.HemisphereLight(0x9a8cff,0x8a5a56,.95));
const sun=new T.DirectionalLight(0xffa878,1.25);sun.position.set(-120,50,-300);city.add(sun);
const fill=new T.DirectionalLight(0x6a5cff,.45);fill.position.set(200,100,200);city.add(fill);
// ---------- helpers: paths, lamps ----------
const lamps=[];
function path(x0,z0,x1,z1,w,col=0xe3c3a0,lampEvery=11,neon=0){
  const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(x1-x0,z1-z0);const g=new T.Group();g.position.set((x0+x1)/2,.04,(z0+z1)/2);g.rotation.y=a;
  box(w,.08,L,MC(col),0,0,0,g);for(const s of[-1,1])box(.18,.1,L,B(NEON[neon]),s*(w/2-.1),.02,0,g);city.add(g);
  for(let d=lampEvery;d<L-4;d+=lampEvery)for(const s of[-1,1])lamps.push([x0+(x1-x0)*d/L+Math.cos(a)*s*(w/2+.9),0,z0+(z1-z0)*d/L-Math.sin(a)*s*(w/2+.9)])}
Z.path=path;
const SP=[ [0,-52,'Pantheon',0],[40,-10,'Colosseum',1],[-57,-10,'Shiba',2],[40,62,'Moonport',0],[0,66,'Gallery',1],[-38,48,'Speech',2],[-96,-96,'Penguin',1] ];
SP.forEach(s=>{const a=Math.atan2(s[1],s[0]),r0=20;path(Math.cos(a)*r0,Math.sin(a)*r0,s[0],s[1],s[2]==='Penguin'?5:9,0xe3c3a0,11,s[3])});
// trail onward to cave
path(-96,-96,-112,-116,4,0xb6c8d8,9,1);
// ---------- central square ----------
const sq=new T.Group();add(sq);
const pav=Z.tex(512,512,(g,w,h)=>{g.fillStyle='#e0c4a4';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,80,100,.35)';g.lineWidth=3;for(let r=40;r<260;r+=44){g.beginPath();g.arc(256,256,r,0,PI*2);g.stroke()}for(let i=0;i<24;i++){g.beginPath();g.moveTo(256,256);g.lineTo(256+Math.cos(i*PI/12)*250,256+Math.sin(i*PI/12)*250);g.stroke()}});
const sqm=mesh(new T.CircleGeometry(22,48),new T.MeshStandardMaterial({map:pav,roughness:1}),0,.06,0,sq);sqm.rotation.x=-PI/2;
const ring=mesh(new T.TorusGeometry(21.6,.16,4,64),B(0x4de8ff),0,.15,0,sq);ring.rotation.x=PI/2;
// obelisk
cyl(4.5,5,.7,MC(0xd6b890),0,.35,0,sq,8);cyl(3.4,3.8,.7,MC(0xe6caa0),0,1,0,sq,8);
const ob=cyl(.9,1.6,16,MC(0xf0d8b8),0,9.4,0,sq,4);ob.rotation.y=PI/4;cyl(.95,.95,1.1,EM(0x3dffa0,1.6),0,5,0,sq,4).rotation.y=PI/4;cyl(.97,.97,.5,EM(0xff4fd8,1.6),0,9,0,sq,4).rotation.y=PI/4;
const dia=mesh(new T.OctahedronGeometry(1.8,0),EM(0x4de8ff,1.2),0,21,0,sq);glow(0x4de8ff,16,0,21,0,sq,.55);
const orb=mesh(new T.TorusGeometry(3,.12,5,32),B(0x3dffa0),0,18,0,sq);const orb2=mesh(new T.TorusGeometry(3.8,.1,5,32),B(0xff4fd8),0,18,0,sq);
Z.updaters.push((t)=>{dia.rotation.y=t*.8;dia.position.y=21+Math.sin(t*1.4)*.4;orb.rotation.x=t*.6;orb.rotation.y=t*.4;orb2.rotation.z=t*.5;orb2.rotation.x=1+t*.3});
const sl=label(['ZEITGEIST','Genesis Square'],9,3.4,{border:'#3dffa0'});sl.position.set(0,27,0);sq.add(sl);
Z.addC(0,0,5.4);
// neon art: ring sculpture + fire pits
for(const [x,z,c] of[[-15,-8,0xff7a3a],[15,-9,0xff7a3a],[-14,16,0xff7a3a]]){cyl(1,1.2,.5,MC(0x2b2740),x,.25,z,sq,8);const f=cone(.7,1.6,B(c),x,1.2,z,sq,6);glow(c,5,x,1.4,z,sq,.7);Z.updaters.push(t=>{f.scale.y=1+Math.sin(t*9+x)*.2;f.rotation.y=t})}
for(const [x,z] of[[-15,-8],[15,-9],[-14,16]]){for(let i=0;i<4;i++){const a=i*PI/2+.4;box(2.2,.5,.7,MC(0x8a5a9a),x+Math.cos(a)*2.6,.25,z+Math.sin(a)*2.6,sq).rotation.y=-a+PI/2}}
// signposts
const sigs=[['The Pill Pantheon','shops · launches',0,-18,0x3dffa0],['The Colosseum','build · compete',18,-3,0x4de8ff],['Shiba House','community lounge',-18,-3,0xff4fd8],['Moonport','rockets',14,14,0x3dffa0],['Art Gallery','digital art',-2,18,0x4de8ff],['Speech Square','satire',-15,10,0xff4fd8],['Penguin Mountain','quiet trail',-14,-14,0x4de8ff]];
sigs.forEach(s=>{const g=new T.Group();g.position.set(s[2],0,s[3]);box(.2,3.4,.2,MC(0x2b2740),0,1.7,0,g);const sg=sign([s[0],s[1]],4,1.3,{border:'#'+s[4].toString(16).padStart(6,'0')});sg.position.set(0,3.5,.2);g.add(sg);face(g,s[2],s[3],0,0);sq.add(g);Z.addC(s[2],s[3],.4)});
// cafe
const cf=new T.Group();cf.position.set(-13,0,13);sq.add(cf);
box(5,2.2,2,MC(0x7a4a5a),0,1.1,0,cf);box(5.4,.2,2.6,MC(0x3dffa0),0,2.3,.2,cf).rotation.x=.25;const cs=sign(['CAFÉ GM','fresh bytes'],4.4,1.1,{border:'#ff4fd8'});cs.position.set(0,3.4,1.1);cf.add(cs);Z.addB(-15.6,-10.4,11.8,14.2);
for(let i=0;i<4;i++){const x=-3+i*2.2,z=3.5+(i%2)*1.6;cyl(.05,.05,1.5,MC(0x3a3040),x,.75,z,cf,5);cone(1.4,.7,MC([0xff4fd8,0x4de8ff,0xffc24a,0x3dffa0][i]),x,1.9,z,cf,8);cyl(.7,.7,.06,MC(0xf0e0d0),x,.8,z,cf,8);for(const s of[-1,1])box(.4,.45,.4,MC(0x2b2740),x+s*.95,.25,z,cf)}
for(let i=0;i<10;i++){const x=-2.6+i*.58;Z.sph(.09,B(0xffe3a0),x,3.1-Math.sin(i/9*PI)*.35,2.4,cf,5,4)}
glow(0xffc880,7,0,2.5,2,cf,.6);
Z.interact.push({x:-13,z:15.6,r:3.2,label:'Order a coffee at Café GM',act:()=>Z.panel('Café GM','A gathering place: sit, people-watch, wait for a friend. <i>Prototype — no real orders.</i>')});
// bike racks
function rack(x,z,ry,n,cols){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;box(n*1.3+.6,.12,.12,MC(0x2b2740),0,.9,-1,g);box(n*1.3+.6,.12,.12,MC(0x2b2740),0,.2,-1,g);for(let i=0;i<=n;i++)box(.1,.9,.1,MC(0x2b2740),(i-n/2)*1.3,.5,-1,g);
 for(let i=0;i<n;i++){const b=bike(cols[i%cols.length],cols[(i+1)%cols.length]);b.position.set((i-n/2+.5)*1.3,0,0);b.rotation.y=PI/2*.08;g.add(b);Z.bikes.push({g:b,home:b.position.clone(),taken:false,rack:g})}
 city.add(g);g.updateMatrixWorld(true);Z.bikes.slice(-n).forEach(o=>{const w=new T.Vector3();o.g.getWorldPosition(w);o.x=w.x;o.z=w.z;o.rot=ry;});Z.addB(x-n*.65-.4,x+n*.65+.4,z-1.3,z-.7);}
Z.rack=rack;rack(8,12.5,0,4,[0x3dffa0,0x4de8ff,0xff4fd8,0xffc24a]);rack(-4,-14,PI,3,[0xff4fd8,0x3dffa0,0x4de8ff]);
// diamond-hands + gm neon
// instanced lamps
const post=inst(new T.CylinderGeometry(.08,.1,3.4,5),MC(0x2b2740),lamps.map(l=>[l[0],1.7,l[2]]),city),bulb=inst(new T.SphereGeometry(.28,6,5),B(0xffd890),lamps.map(l=>[l[0],3.5,l[2]]),city);
// ---------- extras: people on bikes circling ----------
Z.circlers=[];
[[19,0x3dffa0,1],[26,0xff4fd8,-1],[16,0x4de8ff,1]].forEach(([r,c,dir],i)=>{const g=new T.Group(),b=bike(c,0xffffff),p=person({shirt:[0xff7a5a,0xb04aff,0xffc24a][i],hat:['horns','bunny','crown'][i],glow:c});p.position.set(0,.3,-.2);b.add(p);Z.rideP(p,0,1);g.add(b);city.add(g);Z.circlers.push({g,b,p,r,dir,a:R(PI*2),sp:.22+i*.03})});
Z.updaters.push((t,dt)=>Z.circlers.forEach(o=>{o.a+=o.dir*o.sp*dt;const x=Math.cos(o.a)*o.r,z=Math.sin(o.a)*o.r;o.g.position.set(x,0,z);o.g.rotation.y=Math.atan2(-Math.sin(o.a)*o.dir,Math.cos(o.a)*o.dir);o.b.userData.wheels.forEach(w=>w.rotation.x+=dt*6);Z.rideP(o.p,t,6)}));
Z.build=Z.build||[];
})(window.ZG=window.ZG||{});
