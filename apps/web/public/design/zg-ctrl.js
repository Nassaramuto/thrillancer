// Third-person controller + gameplay camera + bicycle. Independent of the cinematic tour camera.
(function(Z){
const T=Z.T,PI=Math.PI,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>((a+PI)%(2*PI)+2*PI)%(2*PI)-PI,ex=(dt,k)=>1-Math.exp(-dt*k);
const S={sensX:1,sensY:1,invertY:false,capture:false,recenter:true,pack:true,halo:false,rainbow:false};
try{const j=JSON.parse(localStorage.getItem('zg.settings')||'{}');['sensX','sensY','invertY','capture','recenter','pack'].forEach(k=>{if(k in j)S[k]=j[k]})}catch(e){}
const av=Z.makeAvatar({jacket:0x1fb8d8,visor:0xff4fd8,hair:0x2a1a14,style:'quiff',neon:0x3dffa0});
const tag=Z.label(['YOU'],1.1,.45,{w:256,border:'#3dffa0',fg:'#3dffa0'});tag.position.set(0,3,0);av.root.add(tag);
const ring=new T.Mesh(new T.TorusGeometry(.85,.05,4,28),new T.MeshBasicMaterial({color:0x3dffa0,transparent:true,opacity:.8}));ring.rotation.x=PI/2;ring.position.y=.06;av.root.add(ring);
const C=Z.ctrl={S,avatar:av,keys:{},pos:V(0,0,14),vel:V(),vy:0,y:0,yaw:PI,grounded:true,bike:null,hy:0,bsp:0,crank:0,roll:0,turn:0,follow:false,near:null,jumpBuf:0,coyote:0,t:0,fov:58,
 cam:{yaw:PI,pitch:.3,dist:7.2,tgt:V(0,1.9,14),lastIn:-9,snap:true,minP:-1.25,maxP:1.15}};
let camera,dom,occ=null,landed=0;const rc=new T.Raycaster();
C.save=()=>{try{localStorage.setItem('zg.settings',JSON.stringify(S))}catch(e){}};
C.applyAcc=()=>av.setAcc(S);
C.clearInput=()=>{for(const k in C.keys)C.keys[k]=false};
C.init=(cam,el,blocked,mode)=>{camera=cam;dom=el;C.blocked=blocked;C.mode=mode;Z.city.add(av.root);
 Z.bikes.forEach(b=>{Z.city.attach(b.g);const f=new T.Vector3(0,0,1).applyQuaternion(b.g.quaternion);b.y0=Math.atan2(f.x,f.z);b.g.rotation.set(0,b.y0,0);b.p0=b.g.position.clone();b.taken=false});
 let drag=false,lx=0,ly=0;
 dom.addEventListener('pointerdown',e=>{if(mode()!=='city'||blocked())return;if(S.capture){if(document.pointerLockElement!==dom)dom.requestPointerLock();return}drag=true;lx=e.clientX;ly=e.clientY;try{dom.setPointerCapture(e.pointerId)}catch(_){}});
 dom.addEventListener('pointermove',e=>{if(mode()!=='city'||blocked())return;if(document.pointerLockElement===dom)C.look(e.movementX,e.movementY);else if(drag){C.look(e.clientX-lx,e.clientY-ly);lx=e.clientX;ly=e.clientY}});
 const up=()=>{drag=false};dom.addEventListener('pointerup',up);dom.addEventListener('pointercancel',up);
 document.addEventListener('pointerlockchange',()=>C.onLock&&C.onLock(document.pointerLockElement===dom));
 C.applyAcc()};
C.look=(dx,dy)=>{const c=C.cam;c.yaw-=dx*.0055*S.sensX;c.pitch=cl(c.pitch+dy*.0065*S.sensY*(S.invertY?-1:1),c.minP,c.maxP);c.lastIn=C.t};
C.jump=()=>{C.jumpBuf=.14};
C.resetCamera=()=>{const c=C.cam;c.yaw=C.bike?C.hy:C.yaw;c.pitch=.3;c.lastIn=-9};
C.teleport=(x,z,fx,fz)=>{if(C.bike)C.dismount();C.pos.set(x,0,z);Z.resolve(C.pos,.6);C.y=Z.groundH(C.pos.x,C.pos.z);C.vel.set(0,0,0);C.vy=0;C.grounded=true;C.follow=false;
 if(fx!==undefined)C.yaw=Math.atan2(fx-x,fz-z);const c=C.cam;c.yaw=C.yaw;c.pitch=.3;c.snap=true;c.lastIn=-9;av.root.position.set(C.pos.x,C.y,C.pos.z);av.root.rotation.y=C.yaw};
C.resetBikes=()=>{if(C.bike)C.dismount();Z.bikes.forEach(b=>{b.g.position.copy(b.p0);b.g.rotation.set(0,b.y0,0);b.taken=false})};
C.respawn=()=>{C.resetBikes();C.teleport(0,8,0,-72)};
C.mount=b=>{C.bike=b;b.taken=true;C.hy=b.g.rotation.y;C.pos.set(b.g.position.x,0,b.g.position.z);C.y=b.g.position.y;C.bsp=0;C.vel.set(0,0,0);C.follow=false;
 b.g.add(av.root);av.root.position.set(0,.315,-.2);av.root.rotation.set(0,0,0);ring.visible=false;tag.position.y=3.3;
 if(S.rainbow)b.rb=[0,1].map(i=>{const m=b.g.userData.wheels[i].children[0];m.material=m.material.clone();return m.material})};
C.dismount=()=>{const b=C.bike;if(!b)return;const rx=-Math.cos(C.hy),rz=Math.sin(C.hy);Z.city.add(av.root);
 C.pos.set(b.g.position.x+rx*1.6,0,b.g.position.z+rz*1.6);Z.resolve(C.pos,.6);C.y=Z.groundH(C.pos.x,C.pos.z);b.g.rotation.z=0;b.taken=false;C.bike=null;C.bsp=0;C.vel.set(0,0,0);C.vy=0;C.grounded=true;
 C.yaw=C.hy;av.root.rotation.set(0,C.yaw,0);av.root.position.set(C.pos.x,C.y,C.pos.z);ring.visible=true;tag.position.y=3;av.root.visible=true};
C.interact=()=>{const n=C.near;if(!n)return;if(n.t==='dis')C.dismount();else if(n.t==='bike')C.mount(n.b);else n.o.act()};
C.tourPose=(dt)=>{av.root.visible=true;av.root.position.set(0,0,14);av.root.rotation.set(0,PI,0);av.update({speed:0,grounded:true},dt)};
function buildOcc(){occ=[];Z.city.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.visible)return;const m=Array.isArray(o.material)?o.material[0]:o.material;
 if(!m||m.transparent||m.fog===false||m.side===T.BackSide||m.blending!==T.NormalBlending)return;if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();o.updateWorldMatrix(true,false);
 const r=o.geometry.boundingSphere.radius*o.matrixWorld.getMaxScaleOnAxis();if(r<2.2||r>140)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const bs=new T.Vector3();o.geometry.boundingBox.getSize(bs);bs.multiply(new T.Vector3().setFromMatrixScale(o.matrixWorld));if(Math.min(bs.x,bs.y,bs.z)<.55)return;occ.push(o)})}
// returns |penetration| so callers know about collisions; blocks ledges taller than stepMax
function moveH(dx,dz,r,stepMax){const P=C.pos,ox=P.x,oz=P.z;P.x+=dx;P.z+=dz;Z.resolve(P,r);
 if(Z.groundH(P.x,P.z)-C.y>stepMax){P.x=ox+dx;P.z=oz;Z.resolve(P,r);
  if(Z.groundH(P.x,P.z)-C.y>stepMax){P.x=ox;P.z=oz+dz;Z.resolve(P,r);if(Z.groundH(P.x,P.z)-C.y>stepMax){P.x=ox;P.z=oz}}}
 return Math.hypot(P.x-ox-dx,P.z-oz-dz)}
function walk(dt,f,s,sprint,blocked){
 const c=C.cam,P=C.pos,v=C.vel;landed=0;
 const sn=Math.sin(c.yaw),cs=Math.cos(c.yaw);
 let wx=sn*f-cs*s,wz=cs*f+sn*s,wl=Math.hypot(wx,wz),spd=sprint?11.5:4.8;
 if(C.follow&&Z.penguinState){const pp=Z.penguinState.pos,dx=pp.x-P.x,dz=pp.z-P.z,d=Math.hypot(dx,dz);if(d>4.5){wx=dx/d;wz=dz/d;wl=1;spd=d>30?11.5:5}else wl=0}
 if(wl>0){wx/=wl;wz/=wl}else{wx=wz=0}
 const tvx=wx*spd,tvz=wz*spd,acc=C.grounded?(wl>0?30:40):8,dvx=tvx-v.x,dvz=tvz-v.z,dl=Math.hypot(dvx,dvz),m=acc*dt;
 if(dl<=m){v.x=tvx;v.z=tvz}else{v.x+=dvx/dl*m;v.z+=dvz/dl*m}
 const sp=Math.hypot(v.x,v.z);
 if(sp>.4||wl>0){const tg=wl>0?Math.atan2(wx,wz):Math.atan2(v.x,v.z),d=wrap(tg-C.yaw),st=d*Math.min(1,dt*(C.grounded?14:5));C.yaw+=st;C.turn+=(st/dt-C.turn)*Math.min(1,dt*10)}else C.turn*=Math.max(0,1-dt*10);
 const ox=P.x,oz=P.z;moveH(v.x*dt,v.z*dt,.55,C.grounded?.95:.25);
 if(Math.abs(P.x-ox-v.x*dt)+Math.abs(P.z-oz-v.z*dt)>1e-4){v.x=(P.x-ox)/dt;v.z=(P.z-oz)/dt}
 const gh=Z.groundH(P.x,P.z);
 if(C.grounded)C.coyote=.12;else C.coyote=Math.max(0,C.coyote-dt);
 if(C.jumpBuf>0&&(C.grounded||C.coyote>0)&&!blocked){C.vy=9.4+Math.min(2.4,Math.max(0,Math.hypot(v.x,v.z)-6)*.5);C.grounded=false;C.coyote=0;C.jumpBuf=0}
 if(C.grounded){if(gh-C.y>=-.4)C.y=gh;else C.grounded=false}
 if(!C.grounded){C.vy-=28*dt;C.y+=C.vy*dt;if(C.y<=gh&&C.vy<=0){const im=-C.vy;C.y=gh;C.vy=0;C.grounded=true;if(im>5)landed=im}}
 av.root.position.set(P.x,C.y,P.z);av.root.rotation.y=C.yaw;
 av.update({speed:Math.hypot(v.x,v.z),grounded:C.grounded,vy:C.vy,turn:C.turn,landed},dt)}
function ride(dt,f,s,sprint,k){
 const b=C.bike,P=C.pos;let sp=C.bsp;
 if(f>0)sp+=(sprint?11:8)*dt;else if(f<0)sp=sp>0?Math.max(0,sp-16*dt):Math.max(-2.8,sp-5*dt);else sp*=Math.exp(-dt*.7);
 if(k.Space)sp*=Math.exp(-dt*4);
 sp=cl(sp,-2.8,sprint?15:11.5);
 C.hy-=s*dt*2.4*cl(Math.abs(sp)/3.5,.2,1)*(sp<-.1?-1:1);
 const ox=P.x,oz=P.z;moveH(Math.sin(C.hy)*sp*dt,Math.cos(C.hy)*sp*dt,1,.6);
 if(Math.abs(sp)>1&&Math.hypot(P.x-ox,P.z-oz)/dt<Math.abs(sp)*.5)sp*=Math.exp(-dt*8);
 C.bsp=sp;C.y+=(Z.groundH(P.x,P.z)-C.y)*Math.min(1,dt*14);
 b.g.position.set(P.x,C.y,P.z);b.g.rotation.y=C.hy;C.roll+=(-s*cl(sp/10,0,1)*.32-C.roll)*Math.min(1,dt*6);b.g.rotation.z=C.roll;
 b.g.userData.wheels.forEach(w=>w.rotation.x+=sp*dt/.5);C.crank+=sp*dt*2.2;
 if(b.rb)b.rb.forEach((m,i)=>m.color.setHSL((C.t*.4+i*.3)%1,1,.6));
 C.vel.set(Math.sin(C.hy)*sp,0,Math.cos(C.hy)*sp);C.yaw=C.hy;
 av.update({riding:true,crank:C.crank,speed:Math.abs(sp),grounded:true},dt)}
function camStep(dt,f,s){
 const c=C.cam,P=C.pos,rd=!!C.bike;
 if(S.recenter&&C.t-c.lastIn>1.2){let rate=0,hd=rd?C.hy:C.yaw;
  if(rd&&Math.abs(C.bsp)>2)rate=2.4;else if(!rd&&Math.hypot(C.vel.x,C.vel.z)>1.5)rate=f>0?.7*Math.abs(s):(f===0&&s?.35:0);
  if(rate)c.yaw+=wrap(hd-c.yaw)*Math.min(1,dt*rate)}
 const lead=V(C.vel.x,0,C.vel.z).multiplyScalar(.12);if(lead.length()>1.1)lead.setLength(1.1);
 const want=V(P.x+lead.x,C.y+(rd?2.1:1.8),P.z+lead.z);
 if(c.snap)c.tgt.copy(want);else c.tgt.lerp(want,ex(dt,20));
 const cp=Math.cos(c.pitch),d=V(Math.sin(c.yaw)*cp,-Math.sin(c.pitch),Math.cos(c.yaw)*cp),full=rd?9.4+Math.abs(C.bsp)*.1:7.2;
 let allow=full;rc.set(c.tgt,d.clone().negate());rc.far=full+.4;
 const h=rc.intersectObjects(occ,false)[0];if(h)allow=Math.min(allow,h.distance-.45);
 for(let i=1;i<=8;i++){const dd=full*i/8;if(c.tgt.y-d.y*dd<Z.groundH(c.tgt.x-d.x*dd,c.tgt.z-d.z*dd)+.4){allow=Math.min(allow,dd-full/8);break}}
 allow=Math.max(1.3,allow);
 if(c.snap||allow<c.dist)c.dist=allow;else c.dist+=(allow-c.dist)*ex(dt,2.5);
 c.snap=false;
 const pos=c.tgt.clone().addScaledVector(d,-c.dist);pos.y=Math.max(pos.y,Z.groundH(pos.x,pos.z)+.55);
 camera.position.copy(pos);camera.lookAt(pos.clone().addScaledVector(d,30));
 const sp=Math.hypot(C.vel.x,C.vel.z);C.fov+=(58+Math.min(9,sp*.7)-C.fov)*ex(dt,4);if(Math.abs(camera.fov-C.fov)>.05){camera.fov=C.fov;camera.updateProjectionMatrix()}
 av.root.visible=rd||c.dist>1.9}
function nearStep(){let best=1e9,n=null;
 if(C.bike)n={t:'dis'};else{
  for(const b of Z.bikes){if(b.taken)continue;const p=b.g.position,d=Math.hypot(p.x-C.pos.x,p.z-C.pos.z);if(d<3&&d<best){best=d;n={t:'bike',b}}}
  for(const o of Z.interact){const d=Math.hypot(o.x-C.pos.x,o.z-C.pos.z);if(d<o.r&&d<best){best=d;n={t:'act',o}}}}
 C.near=n}
C.step=(dt,t)=>{
 dt=Math.min(dt,.05);C.t=t;const c=C.cam;if(!occ)buildOcc();
 const bl=C.blocked(),k=bl?{}:C.keys;
 const f=(k.KeyW?1:0)-(k.KeyS?1:0),s=(k.KeyD?1:0)-(k.KeyA?1:0),sprint=!!(k.ShiftLeft||k.ShiftRight);
 if(!bl){const yw=(k.ArrowLeft?1:0)-(k.ArrowRight?1:0),pt=(k.ArrowDown?1:0)-(k.ArrowUp?1:0);if(yw||pt){c.yaw+=yw*1.9*dt*S.sensX;c.pitch=cl(c.pitch+pt*1.3*dt*S.sensY,c.minP,c.maxP);c.lastIn=t}}
 if((f||s)&&C.follow){C.follow=false;C.onFollow&&C.onFollow(false)}
 C.jumpBuf=Math.max(0,C.jumpBuf-dt);
 if(C.bike)ride(dt,f,s,sprint,k);else walk(dt,f,s,sprint,bl);
 camStep(dt,f,s);nearStep()};
})(window.ZG);
