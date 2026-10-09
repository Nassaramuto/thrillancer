(function(Z){
const T=Z.T,{MC,B,EM,box,cyl,sph,cone,mesh,sign,label,glow,winBox,inst,person,R,sector,city}=Z;
const PI=Math.PI,add=g=>(city.add(g),g);
const V=(x,y,z)=>new T.Vector3(x,y,z);
function aim(g,arm,wt){g.updateMatrixWorld(true);const l=g.worldToLocal(wt.clone()).sub(arm.position).normalize();arm.quaternion.setFromUnitVectors(V(0,-1,0),l)}
const wc=(g,x,z,r)=>{g.updateMatrixWorld(true);const v=V(x,0,z);g.localToWorld(v);Z.addC(v.x,v.z,r);return v};
// ================= MOONPORT =================
{const RX=60,RZ=72,GX=67,GZ=79;
 const pad=mesh(new T.CylinderGeometry(9,9.4,.4,32),new T.MeshStandardMaterial({map:Z.tex(256,256,(g,w,h)=>{g.fillStyle='#4a4660';g.fillRect(0,0,w,h);g.strokeStyle='#ffc24a';g.lineWidth=14;for(let i=-4;i<10;i++){g.beginPath();g.moveTo(i*40,0);g.lineTo(i*40+120,h);g.stroke()}g.fillStyle='#34304a';g.beginPath();g.arc(128,128,86,0,PI*2);g.fill()}),roughness:1}),RX,.2,RZ,city);
 const rt=mesh(new T.TorusGeometry(9.2,.14,4,40),B(0xff4fd8),RX,.45,RZ,city);rt.rotation.x=PI/2;
 const rk=add(new T.Group());rk.position.set(RX,.4,RZ);
 const white=MC(0xf4f1ff,{emissive:0x44445a,emissiveIntensity:.5}),grn=MC(0x1fcf6e,{emissive:0x0c6a34,emissiveIntensity:.8}),dark=MC(0x2b2740);
 const segs=[];for(let i=0;i<5;i++){const g=new T.Group();if(i<4){cyl(2.6,2.6,7,i===3?dark:white,0,3.5,0,g,16);if(i===1||i===3){const b=cyl(2.65,2.65,1.2,i===3?grn:grn,0,3.5,0,g,16)}if(i===0)for(let k=0;k<4;k++){const a=k*PI/2+PI/4;box(.3,4,2.4,grn,Math.cos(a)*3.2,2,Math.sin(a)*3.2,g).rotation.y=-a+PI/2}}else{cone(2.6,7,grn,0,3.5,0,g,16)}rk.add(g);segs.push(g)}
 const flame=cone(1.8,6,B(0xffa23a),0,-3,0,rk,10);flame.rotation.x=PI;const fg=glow(0xffa23a,16,0,-1,0,rk,0);
 // scaffold
 const sc=add(new T.Group());sc.position.set(RX-7,0,RZ);for(const x of[-1.5,1.5])for(const z of[-1.5,1.5])box(.35,34,.35,MC(0xe8e4f4),x,17,z,sc);for(let y=4;y<34;y+=5){box(3.4,.3,.3,MC(0xe8e4f4),0,y,1.5,sc);box(3.4,.3,.3,MC(0xe8e4f4),0,y,-1.5,sc);box(.3,.3,3.4,MC(0xe8e4f4),1.5,y,0,sc);box(.3,.3,3.4,MC(0xe8e4f4),-1.5,y,0,sc);box(.2,.2,4.5,MC(0xff7a3a),0,y,0,sc).rotation.y=.8}
 box(8,.3,.4,MC(0xff7a3a),RX-3.2,26,RZ,city);Z.addB(RX-8.8,RX-5.2,RZ-1.8,RZ+1.8);Z.addC(RX,RZ,3.4);
 for(const [x,z,c] of[[RX-8,RZ-8,0xff4fd8],[RX+8,RZ-8,0x4de8ff],[RX+8,RZ+8,0x3dffa0],[RX-8,RZ+8,0xffc24a]]){cyl(.1,.1,4,MC(0x2b2740),x,2,z,city,5);glow(c,3,x,4,z,city,.9)}
 // giant
 const G=person({skin:0xeac3a6,shirt:0x1b1b28,pants:0x1b1b28,hair:null,scale:15,shoe:0x0e0e14});const P=G.userData.P,sk=MC(0xeac3a6),hm=MC(0x3a2a22);
 P.head.scale.set(.96,1.15,1.02);const hd=P.head;box(.34,.15,.22,sk,0,-.22,.13,hd);box(.38,.05,.05,hm,0,.1,.2,hd);box(.42,.1,.4,hm,0,.25,-.02,hd);box(.1,.3,.4,hm,.21,.1,-.02,hd);box(.1,.3,.4,hm,-.21,.1,-.02,hd);box(.1,.03,.03,B(0x14101c),.05,-.1,.215,hd).rotation.z=.2;
 box(.22,.34,.02,B(0xf4f1ff),0,1.3,.18,P.torso.parent);box(.12,.7,.02,MC(0x0e0e16),.2,1.25,.19,G);box(.12,.7,.02,MC(0x0e0e16),-.2,1.25,.19,G);
 G.position.set(GX,0,GZ);G.rotation.y=Math.atan2(40-GX,55-GZ);city.add(G);Z.addC(GX,GZ,5.5);
 const L=glow(0x4de8ff,40,0,12,0,G,.0);
 const hand0=V(.45,.85,.55);
 Z.updaters.push(t=>{const T0=t%24;Z.rocketT=T0;let top=0,carry=null;
  segs.forEach((s,i)=>{const t0=i*3.1,p=Math.max(0,Math.min(1,(T0-t0)/2.6));const slot=V(0,i*7,0),slotY=i*7;s.visible=T0>=t0;
   if(T0<t0){return}const st=G.localToWorld(hand0.clone());rk.worldToLocal(st);const e=1-Math.pow(1-p,3);s.position.set(st.x*(1-e),st.y*(1-e)+slotY*e+Math.sin(p*PI)*5,st.z*(1-e));if(p<1)carry=s;});
  const launch=Math.max(0,T0-17),sh=T0>14.5&&T0<17?Math.sin(t*60)*.08:0;rk.position.set(RX+sh,.4+launch*launch*4.5,RZ);rk.visible=T0<22.5;
  flame.visible=T0>14.5;fg.material.opacity=T0>14.5?.8:0;flame.scale.y=1+Math.sin(t*40)*.2;
  const hp=carry?carry.getWorldPosition(V()).add(V(1.5,3,1.5)):G.localToWorld(hand0.clone());
  aim(G,P.armR,carry?carry.getWorldPosition(V()):V(RX+3,11,RZ+1));aim(G,P.armL,V(RX+2.5,8+Math.min(T0,15)*.5,RZ+2.2));
  P.head.rotation.x=-.2-Math.min(T0,15)/15*.1;P.head.rotation.y=Math.sin(t*.7)*.08});
 // viewing deck
 const dk=add(new T.Group());dk.position.set(42,0,67);box(14,1.2,12,MC(0x6a5a80),0,.6,0,dk);box(14.2,.12,12.2,B(0x3dffa0),0,1.2,0,dk);Z.addP(35,49,61,73,1.2);
 for(let i=0;i<3;i++){box(2.6,.5,.8,MC(0xc9a06a),-3+i*3,1.7,-3,dk);box(2.6,.8,.2,MC(0xc9a06a),-3+i*3,2.1,-3.35,dk)}
 for(const x of[-7,7])box(.12,1.1,12,MC(0x2b2740),x,1.8,0,dk);
 const tele=new T.Group();tele.position.set(4,1.2,3);dk.add(tele);cyl(.08,.08,1.2,MC(0x2b2740),0,.6,0,tele,5);const tb=cyl(.2,.28,1.4,MC(0xe8e4f4),0,1.4,0,tele,8);tb.rotation.x=-.9;tb.rotation.y=.4;
 const mp=sign(['MOONPORT','public viewing deck'],6,1.8,{border:'#3dffa0'});mp.position.set(0,5,5.8);dk.add(mp);box(.2,3,.2,MC(0x2b2740),-2.6,2.7,5.8,dk);box(.2,3,.2,MC(0x2b2740),2.6,2.7,5.8,dk);
 for(let i=0;i<6;i++){const p=person({shirt:[0xff7a5a,0x4de8ff,0xb04aff,0xffc24a,0x3dffa0,0xff4fd8][i],hat:[null,'cap','beanie','visor',null,'bunny'][i],skin:[0xe3ad86,0xc68863,0x8d5a3b,0xf1c9a5][i%4]});p.position.set(-5+i*1.8,1.2,-1.2+(i%2)*1.4);dk.add(p);p.rotation.y=Math.atan2(RX-42,RZ-67);Z.crowd.push({g:p,ph:i,by:1.2})}
 Z.interact.push({x:46,z:68,r:3.5,label:'Look through the telescope',act:()=>Z.telescope()});
 const ml=label(['MOONPORT','rockets & ambition'],20,5,{border:'#3dffa0'});ml.position.set(GX,64,GZ);city.add(ml);
 Z.dest.push({n:'Moonport',x:48,z:68,c:'#3dffa0',k:'M',r:32,tag:'Rocket assembly & the Atlas'});
}
// ================= SPEECH SQUARE =================
{const sp=add(new T.Group());sp.position.set(-52,0,60);sp.rotation.y=Math.atan2(52,-60);
 const pz=mesh(new T.CircleGeometry(19,36),new T.MeshStandardMaterial({color:0x6a4a78,roughness:1}),0,.05,0,sp);pz.rotation.x=-PI/2;
 const gm=MC(0xf0c060,{emissive:0x5a3a00,emissiveIntensity:.5}),red=MC(0x9a1830);
 box(18,1.4,9,MC(0x3a2a50),0,.7,-11,sp);box(18.2,.12,9.2,B(0xff4fd8),0,1.42,-11,sp);
 for(const s of[-1,1]){box(2.4,11,1.4,red,s*8.4,6.9,-14.4,sp);box(1,12.2,1,gm,s*7,6.6,-14.4,sp)}box(18.6,2,1.4,red,0,12,-14.4,sp);box(18.6,.4,1.6,gm,0,10.9,-14.4,sp);box(15,10,.4,MC(0x1a1236),0,6.4,-15,sp);
 const bg=sign(['SPEECH SQUARE','satire · fiction · silent'],12,3,{border:'#ff4fd8',fg:'#ffc24a'});bg.position.set(0,8.4,-14.7);sp.add(bg);
 const pd=new T.Group();pd.position.set(0,1.4,-8.8);sp.add(pd);box(3.4,3.4,1.8,MC(0x5a2a4a),0,1.7,0,pd);box(3.8,.3,2.2,gm,0,3.5,0,pd);box(.9,.9,.1,B(0xffc24a),0,2.1,.95,pd).rotation.z=PI/4;
 const tr=person({skin:0xe9964e,shirt:0x1c2b5a,pants:0x1c2b5a,hair:null,scale:4.7,shoe:0x111118});const Pt=tr.userData.P,hh=MC(0xf5c04a),hd=Pt.head;
 box(.5,.17,.52,hh,0,.27,0,hd);const lk=box(.46,.12,.3,hh,0,.3,.28,hd);lk.rotation.x=.3;box(.1,.3,.44,hh,.23,.1,0,hd);box(.1,.3,.44,hh,-.23,.1,0,hd);box(.5,.35,.16,hh,0,.08,-.22,hd);box(.14,.03,.03,MC(0xf5e0a0),.1,.1,.205,hd);box(.14,.03,.03,MC(0xf5e0a0),-.1,.1,.205,hd);box(.12,.06,.03,B(0x7a2a20),0,-.1,.205,hd);
 box(.24,.7,.03,B(0xd01e2e),0,1.15,.18,tr);box(.12,.12,.04,B(0xd01e2e),0,1.5,.185,tr);box(.2,.3,.02,B(0xf4f1ff),0,1.45,.175,tr);
 tr.position.set(0,1.4,-10.6);sp.add(tr);
 const bub=label(['· · ·'],4,1.6,{border:'#ffc24a'});bub.position.set(0,12.5,-10.6);sp.add(bub);
 Z.updaters.push(t=>{const c=t%12<8;Pt.armR.rotation.x=-1.3+Math.sin(t*3.2)*.5;Pt.armR.rotation.z=-.5;Pt.armL.rotation.x=c?-.9+Math.sin(t*2.3+1)*.5:-2.6+Math.sin(t*5)*.2;Pt.armL.rotation.z=.4;hd.rotation.y=Math.sin(t*.9)*.35;hd.rotation.x=Math.sin(t*2.4)*.08;tr.rotation.z=Math.sin(t*1.1)*.03;bub.scale.set(4+Math.sin(t*4)*.4,1.6+Math.sin(t*4)*.15,1)});
 for(const [x,c] of[[-4,0xff4fd8],[4,0x4de8ff]]){const b=mesh(new T.ConeGeometry(2.6,13,12,1,true),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.14,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),x*1.6,8,-5,sp);b.rotation.z=x>0?.5:-.5;b.rotation.x=-.3;glow(c,5,x*2.2,13,-5.5,sp,.8)}
 for(let i=0;i<5;i++)wc(sp,-8+i*4,-11,3);wc(sp,8.4,-14.4,1.5);wc(sp,-8.4,-14.4,1.5);
 const sg=sign(['SATIRE · an oversized caricature','silent gestures — no quotes, no voice'],9,2.2,{border:'#ffc24a',fg:'#ffc24a'});sg.position.set(0,2.4,3);sp.add(sg);box(.2,2.4,.2,MC(0x2b2740),-4.4,1.2,3,sp);box(.2,2.4,.2,MC(0x2b2740),4.4,1.2,3,sp);
 for(let r=0;r<4;r++)for(let c=0;c<7;c++){if(r===0&&c===3)continue;const x=-9+c*3+(r%2)*1.2+R(-.4,.4),z=-1+r*2.6+R(-.4,.4);const p=person({shirt:[0xff7a5a,0x3dffa0,0xb04aff,0x4de8ff,0xffc24a,0xff4fd8][(r*7+c)%6],hat:[null,'cap','beanie','bunny','horns',null,'antlers','halo'][(r*3+c)%8],hatc:[0xff4fd8,0x3dffa0,0x4de8ff,0xffc24a][c%4],skin:[0xe3ad86,0xc68863,0x8d5a3b,0xf1c9a5][(r+c)%4],pants:0x2a2a44});p.position.set(x,0,z);p.rotation.y=PI;sp.add(p);Z.crowd.push({g:p,ph:R(6),by:0,arms:true});
  if((r+c)%5===0){const pl=sign(['···'],1.4,1.1,{border:'#ffc24a'});pl.position.set(x+.3,2.5,z-.1);pl.rotation.y=PI;sp.add(pl)}}
 Z.dest.push({n:'Speech Square',x:-38,z:48,c:'#ff4fd8',k:'T',r:26,tag:'Satire · silent caricature'});
 const tl=label(['SPEECH SQUARE','satire'],16,4,{border:'#ff4fd8'});const wv=V(0,20,-11);sp.localToWorld(wv);tl.position.copy(wv);city.add(tl);
}
// ================= GALLERY =================
{const GX=0,GZ=84,gp=add(new T.Group());gp.position.set(GX,0,GZ);
 const gd=mesh(new T.CircleGeometry(20,40),new T.MeshStandardMaterial({color:0x4a3a68,roughness:1}),0,.05,0,gp);gd.rotation.x=-PI/2;
 const mk=(k)=>Z.tex(256,176,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);const pal=[['#ff4fd8','#4de8ff'],['#3dffa0','#6a4aff'],['#ffc24a','#ff4fd8']][k%3];gr.addColorStop(0,pal[0]);gr.addColorStop(1,pal[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(10,6,30,.28)';if(k%3===0)for(let i=0;i<9;i++)g.fillRect(i*30,0,12,h);else if(k%3===1)for(let i=0;i<5;i++){g.beginPath();g.arc(128,88,20+i*16,0,PI*2);g.lineWidth=7;g.strokeStyle='rgba(10,6,30,.3)';g.stroke()}else for(let i=0;i<8;i++)for(let j=0;j<6;j++)if((i+j)%2)g.fillRect(i*32,j*30,32,30);g.fillStyle='rgba(255,255,255,.8)';g.font='700 15px monospace';g.fillText('PLACEHOLDER',10,24)});
 for(let i=0;i<7;i++){const a=PI*(.12+i*.128),x=Math.cos(a)*15,z=Math.sin(a)*15,g=new T.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(-x,-z);gp.add(g);
  box(.2,3.6,.2,MC(0x2b2740),-2.6,1.8,0,g);box(.2,3.6,.2,MC(0x2b2740),2.6,1.8,0,g);box(5.6,.3,.5,MC(0x2b2740),0,.15,0,g);
  box(5.4,3.6,.3,MC(0x14102c),0,3,0,g);const art=mesh(new T.PlaneGeometry(5,3.2),new T.MeshBasicMaterial({map:mk(i),toneMapped:false}),0,3,.18,g);
  const tg=sign(['ARTIST SLOT 0'+(i+1),'placeholder · open for collab'],4.6,.8,{mono:true,border:'#4de8ff'});tg.position.set(0,.9,.3);g.add(tg);glow(0xff4fd8,10,0,3,1.5,g,.35);
  wc(gp,x,z,1.8);const wv=V(0,0,.5);g.localToWorld(wv);
  Z.interact.push({x:wv.x,z:wv.z,r:3.4,label:'View Artist Slot 0'+(i+1),act:()=>Z.panel('Artist Slot 0'+(i+1)+' <span class="tag">Placeholder</span>','Reserved for a future artist collaboration.<br><br>No existing artwork is reproduced and no artist is implied or endorsing this space.')});
  if(i===6){const bv=V(0,1.4,-1.8);g.localToWorld(bv);Z.mkBone(bv.x,1.4,bv.z,city,bv.x,bv.z)}}
 const cb=new T.Group();cb.position.set(0,5,0);gp.add(cb);const cw=mesh(new T.EdgesGeometry(new T.BoxGeometry(4,4,4)),new T.LineBasicMaterial({color:0x3dffa0}),0,0,0,cb);const ci=mesh(new T.OctahedronGeometry(1,0),EM(0xff4fd8,1.2),0,0,0,cb);cyl(1.2,1.6,1.2,MC(0xe0c4a2),0,.6,0,gp,8);
 Z.updaters.push(t=>{cb.rotation.y=t*.6;cb.rotation.x=t*.3;ci.rotation.y=-t});Z.addC(GX,GZ,1.8);
 const cs=sign(['FUTURE ARTIST COLLABS','space reserved'],5,1.4,{border:'#3dffa0'});cs.position.set(0,1.6,2);cs.rotation.y=PI;gp.add(cs);
 const gl=label(['DIGITAL ART GALLERY','placeholders · open for artists'],20,5,{border:'#4de8ff'});gl.position.set(GX,24,GZ);city.add(gl);
 Z.dest.push({n:'Digital Art Gallery',x:0,z:68,c:'#4de8ff',k:'A',r:28,tag:'Outdoor gallery · placeholders'});
}
// ================= PENGUIN MOUNTAIN =================
{const MX=-135,MZ=-150,rock=MC(0x5a4a82),snow=MC(0xf0ecff,{emissive:0x4a4a7a,emissiveIntensity:.4});
 const m1=cone(40,96,rock,MX,48,MZ,city,7);const m2=cone(26,64,MC(0x6a5a92),MX+26,32,MZ+8,city,6);const m3=cone(22,52,MC(0x4e4078),MX-20,26,MZ+14,city,6);
 cone(10.6,25,snow,MX,83.5,MZ,city,7);cone(10.5,18,snow,MX+26,55,MZ+8,city,6);
 Z.addC(MX,MZ,34);Z.addC(MX+26,MZ+8,20);Z.addC(MX-20,MZ+14,16);
 glow(0x6a5cff,70,MX,50,MZ+20,city,.25);
 const ar=[];[[0x3dffa0,0],[0x4de8ff,25],[0xff4fd8,-25]].forEach(([c,o],i)=>{const g=new T.PlaneGeometry(70,34,24,1);const m=new T.Mesh(g,new T.MeshBasicMaterial({map:Z.tex(8,64,(x,w,h)=>{const gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.7,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,w,h)}),color:c,transparent:true,opacity:.28,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));m.position.set(MX+o,95+i*6,MZ+25+i*8);m.rotation.y=.6;city.add(m);ar.push(m)});
 Z.updaters.push(t=>ar.forEach((m,k)=>{const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*.12+t*.8+k)*5);if(p.getY(i)>0)p.setY(i,17+Math.sin(x*.1+t+k)*3)}p.needsUpdate=true}));
 // trees
 const tl=[];for(let i=0;i<60;i++){const a=R(PI*2),r=R(42,70),x=MX+Math.cos(a)*r,z=MZ+Math.sin(a)*r;if(Math.hypot(x+105,z+105)<14||Math.hypot(x,z)<100)continue;tl.push([x,3,z,0,R(.8,1.6),R(.9,1.9),R(.8,1.6)])}
 inst(new T.ConeGeometry(2.4,7,6),MC(0x2c5a6a),tl,city);inst(new T.ConeGeometry(1.6,3.6,6),MC(0xe8e4ff),tl.map(l=>[l[0],l[1]+1.8*l[5],l[2],0,l[4],l[5],l[6]]),city);
 // door
 const dx=-113,dz=-118,dg=add(new T.Group());dg.position.set(dx,0,dz);dg.rotation.y=Math.atan2(-96-dx,-96-dz);
 for(const s of[-1,1])box(1,8,1.2,MC(0x4a3a72),s*3,4,0,dg);box(7,1,1.2,MC(0x4a3a72),0,8.3,0,dg);box(5,7.2,.2,B(0x4de8ff,{transparent:true,opacity:.65}),0,3.8,.1,dg);glow(0x4de8ff,16,0,4,.8,dg,.7);box(.3,7.4,.3,EM(0x4de8ff,1.4),-2.5,3.7,.5,dg);box(.3,7.4,.3,EM(0x4de8ff,1.4),2.5,3.7,.5,dg);
 const dl=sign(['THE AURORA DOOR','quiet. humming.'],5.6,1.4,{border:'#4de8ff'});dl.position.set(0,10,.5);dg.add(dl);
 Z.addC(dx-2.5,dz-2.5,1.2);
 Z.interact.push({x:dx+2,z:dz+2,r:4.5,label:'Listen at the Aurora Door',act:()=>Z.panel('The Aurora Door','A quiet door, humming softly. Nothing opens yet — this is a reserved discovery point for a future quest or secret room.')});
 const wv=V(dx+2,0,dz+3);Z.mkBone(wv.x,1.2,wv.z,city,wv.x,wv.z);
 // penguin
 const pg=Z.penguin();pg.scale.setScalar(1.3);city.add(pg);const ring=mesh(new T.TorusGeometry(1.2,.07,4,24),B(0x4de8ff),0,.15,0,city);ring.rotation.x=PI/2;
 const bm=mesh(new T.CylinderGeometry(.18,.18,9,8,1,true),new T.MeshBasicMaterial({color:0x4de8ff,transparent:true,opacity:.25,blending:T.AdditiveBlending,depthWrite:false}),0,4.5,0,city);
 const pts=[[-82,-78],[-90,-88],[-97,-93],[-95,-101],[-103,-107],[-109,-112],[-112,-117]].map(p=>V(p[0],0,p[1]));let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const l=pts[i].distanceTo(pts[i-1]);seg.push(l);tot+=l}
 const pen=Z.penguinState={pos:V(0,0,0),cycle:0};const SPD=1.5,wait=5,dur=tot/SPD;
 Z.updaters.push(t=>{const c=t%(dur+wait+4);let d=Math.min(c*SPD,tot),i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++}const a=pts[i],b=pts[i+1],f=Math.min(1,d/seg[i]);pen.pos.lerpVectors(a,b,f);pg.position.copy(pen.pos);pg.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
  const moving=c<dur;pg.rotation.z=moving?Math.sin(t*8)*.12:0;pg.position.y=moving?Math.abs(Math.sin(t*8))*.08:0;pg.userData.fl.forEach((f,k)=>f.rotation.z=(k?1:-1)*(.2+Math.sin(t*8)*.15));
  const vis=c<dur+1.2?1:Math.max(0,1-(c-dur-1.2)/1.2);pg.scale.setScalar(1.3*(c>dur+wait?Math.min(1,(c-dur-wait)/3):vis));ring.position.set(pen.pos.x,.15,pen.pos.z);ring.scale.setScalar(1+Math.sin(t*3)*.15);bm.position.set(pen.pos.x,4.5,pen.pos.z);bm.visible=pg.scale.x>.5});
 Z.dest.push({n:'Penguin Mountain',x:-105,z:-105,c:'#9ad8ff',k:'▲',r:30,tag:'A quiet trail · follow the penguin'});
 const pl=label(['PENGUIN MOUNTAIN','follow the small one'],34,8,{border:'#9ad8ff'});pl.position.set(MX,112,MZ);city.add(pl);
}
// ================= SKYLINE =================
{const sk=add(new T.Group()),pos=(g,x,z)=>{g.position.set(x,0,z);sk.add(g);return g};
 // Burj Khalifa
 {const g=pos(new T.Group(),110,-245),gl=MC(0xa8c0f0,{emissive:0x4a60a0,emissiveIntensity:.7});let y=0;const hs=[40,34,30,26,22,18,14,10];hs.forEach((h,i)=>{const r=11-i*1.2;cyl(r*.8,r,h,gl,0,y+h/2,0,g,6);cyl(r*.82,r*.82,.8,B(0xbfe4ff),0,y+h,0,g,6);y+=h});cyl(.2,.9,36,MC(0xe8f0ff),0,y+18,0,g,6);glow(0xbfe4ff,40,0,y+34,0,g,.8);
  const l=label(['BURJ KHALIFA','stylized'],40,9,{border:'#bfe4ff'});l.position.set(0,y+60,0);g.add(l);g.scale.setScalar(.95)}
 // Eiffel
 {const g=pos(new T.Group(),-95,-255),m=MC(0xc07a4a,{emissive:0x3a1a08,emissiveIntensity:.6});for(const x of[-1,1])for(const z of[-1,1]){const l=box(2.4,70,2.4,m,x*10,32,z*10,g);l.rotation.z=-x*.2;l.rotation.x=z*.2}
  for(const y of[40,80]){box(30-y*.2,2.4,30-y*.2,m,0,y,0,g)}cyl(1.2,6,60,m,0,110,0,g,4);cyl(.3,1.2,24,m,0,152,0,g,4);glow(0xffb070,24,0,170,0,g,.8);
  const l=label(['TOUR D\'EIFFEL','stylized'],34,8,{border:'#ffb070'});l.position.set(0,195,0);g.add(l);g.scale.setScalar(.8)}
 // Pisa
 {const g=pos(new T.Group(),235,-70);const t=new T.Group();t.rotation.z=.12;g.add(t);for(let i=0;i<6;i++){cyl(9,9.4,10,MC(0xf0e6d6),0,5+i*10.5,0,t,14);for(let k=0;k<12;k++){const a=k/12*PI*2;box(1,7,1,MC(0xd8ccb8),Math.cos(a)*9.3,5+i*10.5,Math.sin(a)*9.3,t)}cyl(9.6,9.6,.7,MC(0xcaa27c),0,10.2+i*10.5,0,t,14)}cyl(6,6,10,MC(0xf0e6d6),0,69,0,t,12);glow(0xffd890,22,0,50,0,g,.4);
  const l=label(['PISA','leaning, stylized'],28,7,{border:'#ffd890'});l.position.set(-6,95,0);g.add(l)}
 // Pyramids
 {const g=pos(new T.Group(),-190,150);[[0,0,60,50],[-50,30,40,34],[40,35,30,26]].forEach(([x,z,w,h])=>{const p=cone(w,h*1.4,MC(0xe0b878,{emissive:0x4a2a10,emissiveIntensity:.5}),x,h*.7,z,g,4);p.rotation.y=PI/4});glow(0xffc880,40,0,12,0,g,.4)
  const l=label(['PYRAMIDS','stylized'],28,7,{border:'#ffc880'});l.position.set(0,90,0);g.add(l)}
 // Liberty
 {const g=pos(new T.Group(),175,175);box(16,18,16,MC(0xc9b7a0),0,9,0,g);box(11,10,11,MC(0xb8a690),0,23,0,g);const gn=MC(0x6ad0b0,{emissive:0x1a5a48,emissiveIntensity:.6});cyl(3.4,5,28,gn,0,42,0,g,8);sph(3,gn,0,59,0,g,8,6);for(let i=0;i<7;i++){const a=i/7*PI*2,s=cone(.6,5,gn,Math.cos(a)*2.4,63,Math.sin(a)*2.4,g,4);s.rotation.z=-Math.cos(a)*.6;s.rotation.x=Math.sin(a)*.6}box(1.4,16,1.4,gn,5,64,0,g);Z.glow(0xffd070,18,5,74,0,g,.9);
  const l=label(['LIBERTY','stylized'],26,7,{border:'#6ad0b0'});l.position.set(0,92,0);g.add(l)}
 // Big Ben-ish
 {const g=pos(new T.Group(),-235,-30);box(14,60,14,MC(0xd2b080,{emissive:0x3a2a10,emissiveIntensity:.5}),0,30,0,g);box(17,17,17,MC(0xe0c090),0,68,0,g);cone(12,26,MC(0x3a4a68),0,89,0,g,4).rotation.y=PI/4;for(const [x,z,r] of[[0,8.8,0],[0,-8.8,PI],[8.8,0,PI/2],[-8.8,0,-PI/2]]){const c=cyl(6,6,.6,B(0xfff0c0),x,68,z,g,16);c.rotation.x=PI/2;c.rotation.z=r;if(x)c.rotation.set(0,0,PI/2)}glow(0xffe8a0,30,0,68,0,g,.5);
  const l=label(['CLOCK TOWER','stylized'],26,7,{border:'#ffe8a0'});l.position.set(0,112,0);g.add(l)}
 
}
// ================= NPCs, fireflies =================
{const N=[],jk=[0xff7a5a,0x3dffa0,0xb04aff,0x4de8ff,0xffc24a,0xff4fd8,0x6a8aff,0xf4eef8],vz=[0xff4fd8,0x4de8ff,0x3dffa0,0xffc24a],hats=[null,null,'cap',null,null,null,'beanie',null],sty=['short','quiff','long','curly','bun','pony','short','quiff'],sk=[0xe3ad86,0xc68863,0x8d5a3b,0xf1c9a5,0xa8734f],hr=[0x3a2a22,0x1a1420,0xc88a3a,0x7a3a22,0x20161a];
 for(let i=0;i<14;i++){const a=Z.makeAvatar({jacket:jk[i%8],visor:vz[i%4],skin:sk[i%5],hair:hr[i%5],hat:hats[i%8],style:sty[i%8],neon:vz[(i+1)%4],pants:[0x2b2a55,0x3a2a3a,0x2a3a44][i%3]});const an=R(PI*2),r=R(6,20);a.root.position.set(Math.cos(an)*r,0,Math.sin(an)*r);city.add(a.root);N.push({a,g:a.root,tx:a.root.position.x,tz:a.root.position.z,sp:R(.9,1.5),w:R(1,5),cur:0})}
 Z.npcs=N;
 Z.updaters.push((t,dt)=>{for(const n of N){const q=n.g.position,dx=n.tx-q.x,dz=n.tz-q.z,d=Math.hypot(dx,dz);let spd=0;if(d<.6){n.w-=dt;if(n.w<0){n.w=R(1,6);if(R()<.45){const s=[[0,-1],[1,0],[-1,0],[.6,.8],[0,1],[-.7,.7],[-.6,-.7]][Math.floor(R(7))],rr=R(12,48);n.tx=s[0]*rr;n.tz=s[1]*rr}else{const a=R(PI*2),r=R(4,21);n.tx=Math.cos(a)*r;n.tz=Math.sin(a)*r}}}else{spd=n.sp*1.6;q.x+=dx/d*spd*dt;q.z+=dz/d*spd*dt;Z.resolve(q,.4);const df=((Math.atan2(dx,dz)-n.g.rotation.y+PI)%(PI*2)+PI*2)%(PI*2)-PI;n.g.rotation.y+=df*Math.min(1,dt*6)}
  n.cur+=(spd-n.cur)*Math.min(1,dt*6);n.a.update({speed:n.cur,grounded:true},dt)}
  (Z.crowd||[]).forEach(c=>{c.g.position.y=c.by+Math.max(0,Math.sin(t*3+c.ph))*.06;if(c.arms){const up=Math.sin(t*.5+c.ph)>.75;c.g.userData.P.armR.rotation.x=up?-2.8:0;c.g.userData.P.armL.rotation.x=up?-2.8:0}})});
 // fireflies
 const n=500,pa=new Float32Array(n*3),pc=new Float32Array(n*3);for(let i=0;i<n;i++){const a=R(PI*2),r=R(5,150);pa[i*3]=Math.cos(a)*r;pa[i*3+1]=R(1,9);pa[i*3+2]=Math.sin(a)*r;const c=new T.Color([0xffe9a0,0x3dffa0,0x4de8ff,0xff4fd8][i%4]);pc.set([c.r,c.g,c.b],i*3)}
 const gg=new T.BufferGeometry();gg.setAttribute('position',new T.BufferAttribute(pa,3));gg.setAttribute('color',new T.BufferAttribute(pc,3));
 const ff=new T.Points(gg,new T.PointsMaterial({size:.35,map:Z.tex(32,32,(g)=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'#fff');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)}),alphaTest:.02,vertexColors:true,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}));city.add(ff);Z.updaters.push(t=>{ff.rotation.y=t*.01;ff.position.y=Math.sin(t*.7)*.5});
}
})(window.ZG=window.ZG||{});
