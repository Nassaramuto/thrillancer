(function(Z){
const T=Z.T,{MC,B,EM,box,cyl,sph,cone,mesh,sign,label,glow,winBox,inst,person,R,sector,city}=Z;
const PI=Math.PI,add=g=>(city.add(g),g);
const bone=(x,y,z,p,wx,wz)=>{const g=new T.Group(),m=EM(0xfff6e0,1.1);box(1.1,.28,.28,m,0,0,0,g);for(const s of[-1,1])for(const t of[-1,1])sph(.2,m,s*.55,t*.14,0,g,6,5);g.position.set(x,y,z);if(p)p.add(g);glow(0xfff0c0,3,0,0,0,g,.7);const o={g,x:wx,z:wz,got:false,y0:y};Z.bones.push(o);return o};
Z.mkBone=bone;
// ================= PILL PANTHEON =================
{const P=add(new T.Group());P.position.set(0,0,-72);
 const stone=MC(0xe6cfaa),warm=MC(0xd9b98a);
 sector(16,14.4,13,PI/2,.42,stone,0,0,0,P);
 const fl=mesh(new T.CircleGeometry(14.4,36),new T.MeshStandardMaterial({map:Z.tex(256,256,(g,w,h)=>{g.fillStyle='#efe2c8';g.fillRect(0,0,w,h);g.strokeStyle='#caa87a';g.lineWidth=4;for(let r=20;r<128;r+=24){g.beginPath();g.arc(128,128,r,0,PI*2);g.stroke()}g.strokeStyle='#3dffa0';g.lineWidth=5;g.beginPath();g.arc(128,128,100,0,PI*2);g.stroke()}),roughness:.8}),0,.05,0,P);fl.rotation.x=-PI/2;
 const dm=mesh(new T.SphereGeometry(16.2,32,12,0,PI*2,.18,PI/2-.18),new T.MeshStandardMaterial({color:0xe4c698,flatShading:true,side:T.DoubleSide,emissive:0x3a2a18,emissiveIntensity:.6}),0,13,0,P);
 for(let i=0;i<12;i++){const rib=mesh(new T.TorusGeometry(16.3,.18,4,24,PI/2-.18),MC(0xc79a62),0,13,0,P);rib.rotation.y=i/12*PI;rib.rotation.z=0;rib.rotation.x=0;rib.rotation.order='YXZ';rib.rotation.x=0;rib.rotation.z=PI/2*0}
 const oc=mesh(new T.TorusGeometry(2.9,.22,5,24),B(0x3dffa0),0,29,0,P);oc.rotation.x=PI/2;
 const beam=mesh(new T.CylinderGeometry(2.6,3.4,16,16,1,true),new T.MeshBasicMaterial({color:0x3dffa0,transparent:true,opacity:.14,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),0,37,0,P);
 // portico
 box(30,1.5,9,stone,0,13,20,P);box(32,.8,10,warm,0,13.9,20,P);
 const sh=new T.Shape();sh.moveTo(-16,0);sh.lineTo(16,0);sh.lineTo(0,5.5);sh.closePath();const pg=new T.ExtrudeGeometry(sh,{depth:1.2,bevelEnabled:false});mesh(pg,stone,0,14.3,24.4,P);
 const pm=sign(['THE PILL PANTHEON'],20,2.4,{bg:'rgba(14,9,40,.0)',fg:'#7a5a2a',weight:'800'});pm.position.set(0,14,25.7);P.add(pm);
 for(let i=0;i<8;i++){const x=-12+i*24/7;cyl(.85,1,12.2,stone,x,6.1,20,P,10);box(2.4,.5,2.4,warm,x,12.4,20,P);box(2.2,.5,2.2,warm,x,.25,20,P);Z.addC(x,-72+20,1.1)}
 box(32,.9,10,warm,0,.45,20,P);Z.addP(-16,16,-56,-46,.9);
 Z.ringC(0,-72,15.2,PI/2,.48,1.4,40);
 // inside: shops
 const cols=[0x3dffa0,0xff4fd8,0x4de8ff,0xffc24a,0x3dffa0,0xff4fd8];
 for(let i=0;i<6;i++){const a=PI/2+.85+i*(PI*2-1.7)/5,x=Math.cos(a)*12.2,z=Math.sin(a)*12.2,g=new T.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(-x,-z);P.add(g);
  box(4.6,2.6,2,MC(0x7a4a5a),0,1.3,0,g);box(5,.2,2.8,MC(cols[i]),0,3,.5,g).rotation.x=.3;box(4,.6,.2,EM(cols[i],1.2),0,2.2,1.05,g);
  const s=sign(['DEMO SHOP 0'+(i+1),'community storefront'],4.4,1.3,{border:'#'+cols[i].toString(16).padStart(6,'0')});s.position.set(0,4.1,.4);g.add(s);
  for(let k=0;k<3;k++)sph(.25,EM([0xffe48a,0xff7ab0,0x7affc8][k],.9),-1.2+k*1.2,2.8,.2,g,6,5)}
 // launch table
 cyl(2.4,2.8,1.1,MC(0xf4ecd8),0,.55,0,P,16);cyl(1.8,1.8,.12,EM(0x3dffa0,1),0,1.15,0,P,16);
 const cards=[];for(let i=0;i<3;i++){const c=sign(['LAUNCH · DEMO','Project 0'+(i+1)],2.6,1.5,{border:'#4de8ff'});P.add(c);cards.push(c)}
 Z.updaters.push(t=>cards.forEach((c,i)=>{const a=t*.5+i*PI*2/3;c.position.set(Math.cos(a)*3,2.8+Math.sin(t+i)*.2,Math.sin(a)*3);c.rotation.y=-a+PI/2}));
 Z.addC(0,-72,3.2);
 Z.interact.push({x:0,z:-72,r:5,label:'Browse the Launch Table',act:()=>Z.panel('Launch Table <span class="tag">Demo</span>','Project discovery &amp; launch opportunities would appear here: curated drops, community storefronts, launch schedules.<br><br><b>Illustrative only</b> — no real projects, listings or external integrations.',['Demo storefront · Project 01','Demo storefront · Project 02','Demo launch · Project 03'])});
 // outside stalls + screens
 for(const s of[-1,1])for(let k=0;k<3;k++){const x=s*(22+k*0),z=-62+k*7,g=new T.Group();g.position.set(x,0,z);g.rotation.y=-s*PI/2;add(g);
  box(5,2.6,2.2,MC(0x7a4a5a),0,1.3,0,g);box(5.4,.2,3,MC(cols[(k+(s>0?3:0))%6]),0,3,.6,g).rotation.x=.3;const q=sign(['STOREFRONT','Demo'],4,1.1,{border:'#ff4fd8'});q.position.set(0,4.1,.5);g.add(q);Z.addB(x-1.5,x+1.5,z-2.6,z+2.6)}
 for(const s of[-1,1]){const sc=sign(['PROJECT DISCOVERY','Demo listings · not live'],7,3.6,{border:'#3dffa0',fg:'#3dffa0'});sc.position.set(s*19,5,-47);sc.rotation.y=-s*.35;city.add(sc);box(.4,5,.4,MC(0x2b2740),s*19,2.5,-47.2,city)}
 const dc=sign(['Cultural reference · not affiliated with any project'],14,1,{fg:'#c9bfff',mono:true,bg:'rgba(14,9,40,.7)'});dc.position.set(0,2.4,-46);city.add(dc);
 // capsule
 const cap=new T.Group();cap.position.set(0,56,-72);city.add(cap);const inn=new T.Group();cap.add(inn);
 const gr=MC(0x1fcf6e,{emissive:0x0c6a34,emissiveIntensity:.9}),wh=MC(0xf6f6ef,{emissive:0x66667a,emissiveIntensity:.5});
 cyl(4,4,8,gr,0,4,0,inn,20);sph(4,gr,0,8,0,inn,20,10);cyl(4,4,8,wh,0,-4,0,inn,20);sph(4,wh,0,-8,0,inn,20,10);
 const sm=mesh(new T.TorusGeometry(4.05,.22,6,24),MC(0x2a2a3a),0,0,0,inn);sm.rotation.x=PI/2;box(.5,13,.1,B(0xffffff,{transparent:true,opacity:.35}),3.7,0,1,inn).position.y=-1;
 inn.rotation.z=.7;glow(0x3dffa0,34,0,0,0,cap,.55);glow(0xffffff,18,0,0,0,cap,.3);
 Z.updaters.push(t=>{cap.rotation.y=t*.35;cap.position.y=56+Math.sin(t*.8)*1.6;inn.rotation.z=.7+Math.sin(t*.5)*.12});
 const pl=label(['THE PILL PANTHEON','shops · launches'],22,5.4,{border:'#3dffa0'});pl.position.set(0,76,-72);city.add(pl);
 Z.dest.push({n:'The Pill Pantheon',x:0,z:-66,c:'#3dffa0',k:'P',r:34,tag:'Shopping & launch district'});
}
// ================= COLOSSEUM =================
{const CX=75,CZ=-10,C=add(new T.Group());C.position.set(CX,4,CZ);
 const st=MC(0xe3c49c),st2=MC(0xd2ae86);
 cyl(25,25.6,4,MC(0xcaa27c),0,-2,0,C,40);const tr=mesh(new T.TorusGeometry(25.2,.14,4,64),B(0x4de8ff),0,.1,0,C);tr.rotation.x=PI/2;
 const tf=mesh(new T.CircleGeometry(25,40),new T.MeshStandardMaterial({color:0xe0c4a2,roughness:1}),0,.03,0,C);tf.rotation.x=-PI/2;
 const rp=box(10.8,.5,12,MC(0xe0c4a2),45,2,-10,city);rp.rotation.z=Math.atan(.4);
 for(const s of[-1,1]){box(10.6,.3,.5,B(0x4de8ff),45,2.1,-10+s*5.95,city).rotation.z=Math.atan(.4);Z.addB(40,50,-10+s*6.4-.4,-10+s*6.4+.4)}
 Z.ringC(CX,CZ,25.4,PI,.3,1.4,80);
 // wall
 sector(15.8,14.4,9,PI,.42,st,0,0,0,C);const wl=[],lit=[];
 for(let i=0;i<30;i++){const a=i/30*PI*2;if(Math.abs(Math.atan2(Math.sin(a-PI),Math.cos(a-PI)))<.5)continue;for(const y of[2.2,5.6]){const e=[Math.cos(a)*15.85,y,Math.sin(a)*15.85,PI/2-a,1.5,2.6,.4];((i+(y>3?1:0))%3===0?lit:wl).push(e)}}
 inst(new T.BoxGeometry(1,1,1),B(0x2a1a3a),wl,C);inst(new T.BoxGeometry(1,1,1),B(0xffb870),lit,C);
 for(const y of[4,8.6]){const r=mesh(new T.TorusGeometry(15.9,.2,4,48),MC(0xf0d8b0),0,y,0,C);r.rotation.x=PI/2}
 for(let i=0;i<3;i++){sector(14.3-i*1.4,12.9-i*1.4,1.3+i*1.2,PI,.42,i%2?st:st2,0,0,0,C)}
 const af=mesh(new T.CircleGeometry(10,32),new T.MeshStandardMaterial({color:0xd9bb8a,roughness:1}),0,.06,0,C);af.rotation.x=-PI/2;
 const ar=mesh(new T.TorusGeometry(6,.1,4,40),B(0xff4fd8),0,.1,0,C);ar.rotation.x=PI/2;
 Z.ringC(CX,CZ,15.1,PI,.42,1.1,48);Z.ringC(CX,CZ,12.6,PI,.45,2.4,36);
 // viber stage
 const vs=new T.Group();vs.position.set(7,0,0);C.add(vs);box(5,1,11,MC(0x2b2740),0,.5,0,vs);box(5.2,.1,11.2,B(0x3dffa0),0,1.02,0,vs);
 box(.4,7,12,MC(0x1a1630),2.4,4.5,0,vs);const vsg=sign(['COLOSSEUM STAGE','Solana hackathon arm · demo schedule'],10.6,5,{border:'#ff4fd8',fg:'#3dffa0'});vsg.position.set(2.15,5,0);vsg.rotation.y=-PI/2;vs.add(vsg);
 for(const z of[-5.6,5.6]){box(.3,8,.3,MC(0x3a3050),2.2,4,z,vs)}box(.3,.3,11.6,MC(0x3a3050),2.2,8,0,vs);
 for(const [z,c] of[[-4,0xff4fd8],[4,0x4de8ff]]){const b=mesh(new T.ConeGeometry(3,10,12,1,true),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.16,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),-1,3.5,z,vs);b.rotation.z=.5;glow(c,5,2.2,8,z,vs,.8)}
 for(let i=-1;i<=1;i++){const g=new T.Group();g.position.set(0,1,i*3);g.rotation.y=-PI/2;vs.add(g);box(2,.9,.9,MC(0x5a4a6a),0,.45,.9,g);box(.8,.05,.55,B(0x4de8ff),0,1,.9,g);const p=person({shirt:[0x3dffa0,0xff7a5a,0xb04aff][i+1],hat:['visor','beanie','cap'][i+1]});p.userData.P.armL.rotation.x=-1.1;p.userData.P.armR.rotation.x=-1.1;p.scale.setScalar(.9);g.add(p);Z.updaters.push(t=>{p.userData.P.armL.rotation.x=-1.1+Math.sin(t*6+i)*.12;p.userData.P.armR.rotation.x=-1.1+Math.cos(t*6+i)*.12})}
 Z.addC(CX+7,CZ,3);
 Z.interact.push({x:CX+3,z:CZ,r:5,label:'Visit the Colosseum stage',act:()=>Z.panel('Colosseum \u2014 Solana hackathon arm <span class="tag">Demo schedule</span>','Builders compete, ship and pitch on this stage. The event listings around the arena are <b>illustrative (Demo)</b> \u2014 no live feed is connected. Official events live on the Colosseum site.<br><br>Unofficial tribute \u2014 not affiliated or endorsed. The logo plate nearby is a placeholder.',[],[Z.LINKS.colo])});
 // crowd on tiers
 Z.crowd=Z.crowd||[];
 for(let i=0;i<16;i++){const a=PI+.8+i*(PI*2-1.6)/15,r=11.8+(i%3)*.9,tier=i%3,y=1.3+tier*0+(2-tier)*0;const rr=[13.6,12.2,10.8][i%3],hh=[1.3,2.5,3.7][i%3];const g=person({shirt:R(0xffffff)|0,hat:[null,'cap','bunny','horns','crown','halo'][i%6],hatc:[0xff4fd8,0x3dffa0,0x4de8ff][i%3],glow:i%2?0x4de8ff:0}).clone?person({shirt:[0xff7a5a,0x3dffa0,0xb04aff,0x4de8ff,0xffc24a][i%5],pants:0x2a2a44,hat:[null,'cap','bunny','horns','crown','halo'][i%6],hatc:[0xff4fd8,0x3dffa0,0x4de8ff][i%3],skin:[0xe3ad86,0xc68863,0x8d5a3b,0xf1c9a5][i%4]}):0;
  g.position.set(Math.cos(a)*(rr-.6),hh,Math.sin(a)*(rr-.6));g.rotation.y=Math.atan2(-Math.cos(a),-Math.sin(a));g.scale.setScalar(.85);C.add(g);Z.crowd.push({g,ph:R(6),by:hh})}
 // banners
 const ev=[['DEMO','48h Hackathon'],['DEMO','Build-off · Funded Challenge'],['DEMO','Scheduled Race · Sat'],['DEMO','Bounty Sprint']];
 [-.9,-.3,.35,1.0,2.4,-2.4].forEach((a,i)=>{const e=ev[i%4],s=sign(e,3.2,6,{border:'#ff4fd8',bg:'rgba(30,10,60,.92)',fg:'#ffffff'});const aa=a*1.0;s.position.set(Math.cos(aa)*16.4,6,Math.sin(aa)*16.4);s.rotation.y=PI/2-aa;C.add(s)});
 // avenue
 const av=new T.Group();city.add(av);
 for(const s of[-1,1])for(let i=0;i<4;i++){const x=26+i*4.5,z=-10+s*7.2;cyl(.75,.9,9,st,x,4.5,z,av,12);box(2.2,.5,2.2,st2,x,9.2,z,av);Z.addC(x,z,1)}
 for(const s of[-1,1]){box(19,1,2.2,st2,35,9.7,-10+s*7.2,av);box(19,.18,.4,B(0x4de8ff),35,9.1,-10+s*6.1,av)}
 [[27.5,0],[32,1],[36.5,2],[27.5,3]].forEach((q,i)=>{const e=ev[q[1]%4];for(const s of[-1,1]){const b=sign(e,2.6,5.2,{border:s>0?'#3dffa0':'#4de8ff',bg:'rgba(30,10,60,.92)'});b.position.set(q[0]+(i%2)*4.5,5.6,-10+s*6.4);b.rotation.y=s>0?PI:0;av.add(b)}});
 // propylaea gate
 for(const z of[-18,-14,-6,-2]){cyl(.8,.95,9,st,21,4.5,z,av,12);Z.addC(21,z,1)}box(2.8,1.2,18,st2,21,9.6,-10,av);
 const gs=new T.Shape();gs.moveTo(-10,0);gs.lineTo(10,0);gs.lineTo(0,3.4);gs.closePath();const gg=mesh(new T.ExtrudeGeometry(gs,{depth:2.6,bevelEnabled:false}),st,19.7,10.2,-10,av);gg.rotation.y=PI/2;gg.position.set(19.7,10.2,-10);
 const as=sign(['THE ACROPOLIS WAY','→ Colosseum'],8,1.6,{border:'#4de8ff'});as.position.set(19.4,7.2,-10);as.rotation.y=-PI/2;av.add(as);
 // plaza dressing: kiosk, board, benches
 const kg=new T.Group();kg.position.set(57,4,-1);kg.rotation.y=-PI/2*1.0-0.4;add(kg);box(2.6,3.2,.5,MC(0x2b2740),0,1.6,0,kg);const kl=sign(['LOGO','PLACEHOLDER'],1.8,1.8,{mono:true,border:'#ffc24a',fg:'#ffc24a',bg:'rgba(20,12,40,.9)'});kl.position.set(0,2.2,.3);kg.add(kl);const kt=sign(['COLOSSEUM ↗','World\u2019s Fair · open link'],2.5,.9,{border:'#4de8ff'});kt.position.set(0,.9,.3);kg.add(kt);Z.addC(57,-1,1.2);
 Z.interact.push({x:57,z:-1,r:4,label:'Open Colosseum World\u2019s Fair',act:()=>Z.panel('Colosseum \u2014 World\u2019s Fair','External link to the Solana hackathon arm. The LOGO plate is a labeled placeholder until a licensed asset is supplied.',[],[Z.LINKS.colo])});
 const bd=new T.Group();bd.position.set(58,4,-20);bd.rotation.y=-.4;add(bd);box(6.4,4.4,.4,MC(0x1a1630),0,3.4,0,bd);for(const x of[-2.8,2.8])box(.3,3,.3,MC(0x2b2740),x,1.5,0,bd);
 const bs=sign(['EVENT BOARD · Demo','Hackathon · Build-off · Race · Challenge'],6,4,{border:'#ff4fd8'});bs.position.set(0,3.4,.25);bd.add(bs);Z.addC(58,-20,3);
 Z.interact.push({x:58,z:-18,r:4,label:'Read the event board',act:()=>Z.panel('Event Board <span class="tag">Demo</span>','Illustrative listings — not live data:',['Hackathon · 48 hours · Demo','Build-off · funded challenge · Demo','Scheduled race · Saturday · Demo','Bounty sprint · Demo'])});
 for(const [x,z,r] of[[54,-14,0],[62,-24,.5],[54,8,PI]]){box(2.6,.5,.7,MC(0x8a5a9a),x,4.3,z,city);box(2.6,.8,.15,MC(0x8a5a9a),x,4.7,z-.3,city)}
 Z.dest.push({n:'The Colosseum',x:62,z:-10,c:'#4de8ff',k:'C',r:32,tag:'Builders & competitions'});
 const cl=label(['THE COLOSSEUM','hackathons · builds · races'],22,5.4,{border:'#4de8ff'});cl.position.set(CX,36,CZ);city.add(cl);
}
// ================= SHIBA HOUSE =================
{const SX=-72,SZ=-10,S=add(new T.Group());S.position.set(SX,0,SZ);S.rotation.y=PI/2;
 const fur=MC(0xe8923c),cr=MC(0xf8e8c8),dk=MC(0x1d1626),pk=MC(0xf4a0a0);
 const W=(x0,x1,z0,z1)=>Z.addB(SX+z0,SX+z1,SZ-x1,SZ-x0);
 box(1,11,18,fur,9.5,5.5,0,S);box(1,11,18,fur,-9.5,5.5,0,S);box(20,11,1,fur,0,5.5,-8.5,S);
 for(const s of[-1,1]){box(7,11,1,fur,s*6.5,5.5,8.5,S);box(6.4,10,.3,cr,s*6.5,5,9.1,S)}box(6,4.5,1,fur,0,8.75,8.5,S);box(6.4,4.4,.3,cr,0,8.7,9.1,S);
 box(.3,6.6,.3,EM(0xffb870,1.2),-3.1,3.3,9.2,S);box(.3,6.6,.3,EM(0xffb870,1.2),3.1,3.3,9.2,S);box(6.5,.3,.3,EM(0xffb870,1.2),0,6.6,9.2,S);
 box(20.6,.8,18.6,fur,0,11.2,0,S);box(19,.2,17,MC(0xb8825a),0,.1,0,S);
 W(9,10,-9,9);W(-10,-9,-9,9);W(-10,10,-9,-8);W(3,10,8,9);W(-10,-3,8,9);
 // head
 const h=new T.Group();h.position.set(0,11.6,0);S.add(h);
 box(18,11,15,fur,0,5.5,1.5,h);for(const s of[-1,1]){box(5.5,5,5.5,cr,s*6.2,2.4,6.2,h);box(2.2,2.6,.6,dk,s*4.4,6.6,9.05,h).rotation.z=s*.18;box(.7,.7,.2,B(0xffffff),s*4.1,7.1,9.4,h);box(1.5,1,.5,cr,s*4.4,8.7,9.05,h);
  const e=cone(3.2,6.5,fur,s*6.8,14.2,-.5,h,4);e.rotation.y=PI/4;const ei=cone(2.2,5,pk,s*6.8,13.4,.5,h,4);ei.rotation.y=PI/4}
 box(8,4.5,6,cr,0,2.4,12,h);sph(1.2,dk,0,4.6,15,h,8,6);box(.4,2.6,.3,dk,0,1.6,15,h);box(2.6,.35,.3,dk,0,.6,15,h);box(2,.9,.5,B(0xff7a9a),0,-.4,13,h);
 box(2.4,3,.4,cr,0,9,9.05,h);
 // paws
 for(const s of[-1,1]){box(4,1.2,7.5,cr,s*6.8,.6,13,S);for(const k of[-1,0,1])box(.12,.14,2,dk,s*6.8+k*1.1,1.25,15.6,S);Z.mkPawPlaceholder=0}
 function pf(x0,x1,z0,z1,hh){Z.addP(SX+z0,SX+z1,SZ-x1,SZ-x0,hh)}
 for(const s of[-1,1])pf(s>0?4.8:-8.8,s>0?8.8:-4.8,9.5,16.5,1.2);for(const s of[-1,1]){const xa=s>0?10.8:-17,xb=s>0?17:-10.8;
  box(6.2,2.4,12,fur,s*13.9,1.2,-2,S);box(6.2,.12,12,MC(0xf0d8b0),s*13.9,2.45,-2,S);
  box(6.2,.8,2,cr,s*13.9,.4,4.5,S);box(6.2,1.6,2,cr,s*13.9,.8,2.5,S);
  pf(xa,xb,3,8,.8);pf(xa,xb,1,3,1.6);pf(xa,xb,-8,1,2.4);
  box(.12,1,12,MC(0x8a5a9a),s*16.9,2.9,-2,S);for(let i=0;i<7;i++)sph(.14,B(0xffd890),s*16.9,3.5,-7.5+i*2,S,5,4);
  for(let i=0;i<3;i++)box(1.2,.5,1.2,MC([0xff4fd8,0x4de8ff,0x3dffa0][i]),s*13.6,2.7,-5+i*3,S)}
 const tl=mesh(new T.TorusGeometry(5.5,1.7,6,12,PI*1.4),fur,0,7,-12,S);tl.rotation.y=PI/2;tl.rotation.z=-.4;sph(1.9,cr,0,12.4,-11.8,S,6,5);
 const ds=sign(['SHIBA HOUSE','community lounge'],6.4,2,{border:'#ff4fd8'});ds.position.set(0,9.1,9.5);S.add(ds);
 // interior
 cyl(5,5,.12,MC(0xf4e4c4),0,.22,0,S,24);cyl(3.4,3.4,.13,MC(0xe8923c),0,.24,0,S,24);box(3.2,.9,3.2,MC(0x8a4a3a),0,.65,0,S);box(3.6,.15,3.6,MC(0xff7a9a),0,1.12,0,S);
 for(let i=0;i<4;i++){const a=i*PI/2+.6;box(1.4,.5,1.4,MC([0xff4fd8,0x4de8ff,0x3dffa0,0xffc24a][i]),Math.cos(a)*3.8,.45,Math.sin(a)*3.8,S).rotation.y=-a}
 box(9,6.4,1,MC(0x4a3050),0,3.2,-7.8,S);for(let r=0;r<3;r++)for(let c=0;c<9;c++)box(.6,1.4,.5,MC([0xff4fd8,0x3dffa0,0x4de8ff,0xffc24a,0xf4eef8][(r+c)%5]),-3.8+c*.95,1.2+r*2,-7.1,S);
 const ls=sign(['COMMUNITY LOUNGE','good boys welcome'],8,2,{border:'#3dffa0',fg:'#3dffa0'});ls.position.set(0,8.2,-7.9);S.add(ls);
 for(let i=0;i<5;i++){sph(.45,EM(0xffb870,1.1),-6+i*3,9.8,-3+(i%2)*6,S,8,6)}
 const lt=new T.PointLight(0xffb070,1.3,30);lt.position.set(0,7,0);S.add(lt);glow(0xffb870,12,0,5,0,S,.4);
 const el=person({shirt:0xf8e8c8,pants:0x6a3a3a,hat:'cap',hatc:0xe8923c});for(const s of[-1,1])cone(.1,.22,fur,s*.15,2.05,0,el.userData.P.head,4);el.position.set(-6,0,-5);el.rotation.y=PI*.8;S.add(el);Z.addC(...(()=>{const v=new T.Vector3(-6,0,-5);S.localToWorld(v);return[v.x,v.z,.7]})());
 Z.updaters.push(t=>{el.userData.P.armR.rotation.x=-.5+Math.sin(t*2)*.3});
 const wv=new T.Vector3(3,0,-5);S.localToWorld(wv);const b1=bone(3,1.3,-5,S,wv.x,wv.z);
 const ev=new T.Vector3(-6,0,-3);S.localToWorld(ev);
 Z.interact.push({x:ev.x,z:ev.z,r:3.6,label:'Talk to the Shiba Elder',act:()=>Z.elder()});
 Z.dest.push({n:'Shiba House',x:SX+12,z:SZ,c:'#ff4fd8',k:'S',r:30,tag:'Community lounge'});
 const sl=label(['SHIBA HOUSE','enter · explore · quest'],20,5,{border:'#ff4fd8'});sl.position.set(SX,34,SZ);city.add(sl);
}
Z.addP2=()=>{};
})(window.ZG=window.ZG||{});
