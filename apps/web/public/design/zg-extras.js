(function(Z){
const T=Z.T,{MC,B,EM,box,cyl,sph,cone,mesh,sign,label,glow,winBox,person,R,city}=Z,PI=Math.PI,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const add=g=>(city.add(g),g);const ltw=(o,v)=>{o.updateMatrixWorld(true);return o.localToWorld(v)};
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const t=new T.CanvasTexture(c);t.anisotropy=4;return{c,g:c.getContext('2d'),t}};
const MONO='"JetBrains Mono",ui-monospace,Menlo,monospace',SANS='"Plus Jakarta Sans",system-ui,sans-serif';
const LINKS=Z.LINKS={sol:{t:'Open solana.org',u:'https://solana.org/'},colo:{t:'Open Colosseum World\u2019s Fair',u:'https://colosseum.com/worldsfair'},stonk:{t:'Open stonkfun.xyz',u:'https://www.stonkfun.xyz/'},wif:{t:'dogwifcoin on X',u:'https://x.com/dogwifcoin'},jean:{t:'@JeanPhilMadame on X',u:'https://x.com/JeanPhilMadame'}};
const NOTE='Unofficial fan tribute \u2014 not affiliated with or endorsed by the project. Not financial advice.';
Z.crowd=Z.crowd||[];Z.mounds=[];
// ===== far mountain ring =====
for(let i=0;i<30;i++){const a=i/30*PI*2+R(.1),r=R(345,390),h=R(35,95),w=R(30,60);cone(w,h,MC(i%2?0x4a3a78:0x5a4688,{emissive:0x1a1240,emissiveIntensity:.6}),Math.cos(a)*r,h/2-2,Math.sin(a)*r,city,5).rotation.y=R(3)}
// ===== mounds / lookouts =====
function mound(x,z,r,h,name){Z.mounds.push({x,z,r,h});const pts=[];for(let i=0;i<=16;i++){const d=i/16*r;pts.push(new T.Vector2(Math.max(.01,d),h*(1-d*d/(r*r))))}
 const m=new T.Mesh(new T.LatheGeometry(pts,24),new T.MeshStandardMaterial({color:0x9d7a8e,flatShading:true,roughness:1,side:T.DoubleSide}));m.position.set(x,0,z);city.add(m);m.userData.mound=1;
 box(2.6,.5,.7,MC(0x8a5a9a),x+2,h+.25,z,city);box(2.6,.8,.15,MC(0x8a5a9a),x+2,h+.65,z-.3,city);cyl(.08,.08,3,MC(0x2b2740),x-2,h+1.5,z,city,5);glow(0xffd890,5,x-2,h+3.2,z,city,.9);
 const s=label([name,'hilltop view'],10,2.6,{border:'#ffc24a'});s.position.set(x,h+8,z);city.add(s)}
mound(50,-52,14,5.5,'EAST LOOKOUT');mound(-80,30,12,4.5,'WEST LOOKOUT');
// ===== camps =====
function camp(deg,r,name,col){const a=deg*PI/180,cx=Math.cos(a)*r,cz=Math.sin(a)*r,g=add(new T.Group());g.position.set(cx,0,cz);
 const tc=[0xff4fd8,0x4de8ff,0xffc24a,0x3dffa0];
 for(let i=0;i<4;i++){const q=i*PI/2+.5,x=Math.cos(q)*4.4,z=Math.sin(q)*4.4;const t=cone(2.3,3.6,MC(tc[(i+Math.round(deg))%4&3]),x,1.8,z,g,6);t.rotation.y=q;const d=box(.9,1.6,.1,MC(0x1a1236),Math.cos(q)*(4.4-1.9),.8,Math.sin(q)*(4.4-1.9),g);d.rotation.y=-q+PI/2;cyl(.05,.05,1.2,MC(0xf4eef8),x,4.1,z,g,4);Z.addC(cx+x,cz+z,2.3)}
 cyl(.9,1.1,.4,MC(0x2b2740),0,.2,0,g,8);const fl=cone(.6,1.5,B(0xff8a3a),0,1.1,0,g,6);glow(0xff8a3a,6,0,1.4,0,g,.7);Z.addC(cx,cz,1);
 Z.updaters.push(t=>{fl.scale.y=1+Math.sin(t*9+deg)*.2;fl.rotation.y=t});
 for(let i=0;i<3;i++){const q=i*2.1+1,l=box(1.8,.4,.5,MC(0x6a4a5a),Math.cos(q)*2.2,.2,Math.sin(q)*2.2,g);l.rotation.y=-q+PI/2}
 const pL=cyl(.07,.07,5,MC(0x2b2740),-6.5,2.5,0,g,5),pR=cyl(.07,.07,5,MC(0x2b2740),6.5,2.5,0,g,5);
 for(let i=0;i<9;i++){const k=i/8,f=cone(.3,.6,MC([0xff4fd8,0x4de8ff,0xffc24a,0x3dffa0][i%4]),-6.5+13*k,4.9-Math.sin(k*PI)*.9,0,g,3);f.rotation.x=PI}
 const s=label([name],9,1.8,{border:'#'+col.toString(16).padStart(6,'0')});s.position.set(0,6.8,0);g.add(s)}
camp(22,38,'CAMP DIAMOND HANDS',0x3dffa0);camp(-56,40,'CAMP GAS FEE',0xff4fd8);camp(210,40,'CAMP WAGMI',0x4de8ff);camp(73,38,'CAMP AIRDROP',0x3dffa0);
// ===== Bitcoin balloon =====
{const bl=add(new T.Group());bl.position.set(16,0,-24);cyl(.06,.06,34,MC(0x2b2740),0,17,0,bl,4);cyl(1,1.3,.6,MC(0x2b2740),0,.3,0,bl,8);Z.addC(16,-24,1.3);
 const env=new T.Group();env.position.y=40;bl.add(env);
 const tx=Z.tex(1024,512,(g,w,h)=>{for(let i=0;i<24;i++){g.fillStyle=i%2?'#f7931a':'#ffb54a';g.fillRect(i*w/24,0,w/24+1,h)}
  for(const cx of[256,768]){g.fillStyle='#f7931a';g.beginPath();g.arc(cx,256,120,0,PI*2);g.fill();g.lineWidth=12;g.strokeStyle='#fff';g.stroke();g.fillStyle='#fff';g.font='900 160px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('B',cx,262);g.fillRect(cx-22,128,12,34);g.fillRect(cx+8,128,12,34);g.fillRect(cx-22,350,12,34);g.fillRect(cx+8,350,12,34)}});
 const e=mesh(new T.SphereGeometry(7,20,14),new T.MeshStandardMaterial({map:tx,emissive:0xf7931a,emissiveIntensity:.3,flatShading:true}),0,0,0,env);e.scale.y=1.15;
 box(2.4,1.4,2.4,MC(0x7a4a2a),0,-9.6,0,env);for(const x of[-1,1])for(const z of[-1,1]){const r=cyl(.03,.03,4.4,MC(0x3a2a1a),x*1.9,-6.6,z*1.9,env,3);r.rotation.z=-x*.38;r.rotation.x=z*.38}
 const s=sign(['BITCOIN BALLOON','prices \u2192 sky board'],4,1.2,{border:'#f7931a'});s.position.set(0,-9.6,1.25);env.add(s);glow(0xf7931a,26,0,0,0,env,.25);
 Z.updaters.push(t=>{env.rotation.y=t*.15;env.position.y=40+Math.sin(t*.5)*1.2;env.position.x=Math.sin(t*.3)*1.2})}
// ===== Ring Run =====
{Z.rings=[];[90,162,234,306,18].forEach((deg,i)=>{const a=deg*PI/180,x=Math.cos(a)*26,z=Math.sin(a)*26,mat=new T.MeshBasicMaterial({color:0x4de8ff,transparent:true,opacity:.35});
 const m=mesh(new T.TorusGeometry(2.6,.18,6,28),mat,x,1.9,z,city);m.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a));Z.rings.push({x,z,m,mat});
 const n=sign([String(i+1)],1.2,1.2,{fg:'#fff',bg:null});n.position.set(x,5.2,z);city.add(n)});
 Z.ringNext=0;Z.setRings=()=>Z.rings.forEach((r,i)=>{r.mat.color.set(i<Z.ringNext?0x3dffa0:i===Z.ringNext?0xff4fd8:0x4de8ff);r.mat.opacity=i<Z.ringNext?.25:i===Z.ringNext?1:.35});Z.setRings();
 Z.updaters.push(t=>{const r=Z.rings[Z.ringNext];if(r)r.m.scale.setScalar(1+Math.sin(t*5)*.06)});
 Z.interact.push({x:Z.rings[0].x,z:Z.rings[0].z-2,r:4,label:'About the Ring Run',act:()=>Z.panel('Ring Run','Pass through the five glowing rings around the square, in order \u2014 on foot or by bicycle. Finish to unlock <b>Rainbow Wheels</b> and call a unicorn flyby.')})}
// ===== Solana Sky Hall =====
{const X=52,Z0=32,g=add(new T.Group());g.position.set(X,0,Z0);g.rotation.y=Math.atan2(-X,-Z0);
 const fl=mesh(new T.CircleGeometry(17,40),new T.MeshStandardMaterial({color:0x241640,roughness:.9}),0,.05,0,g);fl.rotation.x=-PI/2;
 for(const [r,c] of[[16.6,0x14f195],[13,0x9945ff],[9,0x14f195]]){const q=mesh(new T.TorusGeometry(r,.12,4,56),B(c),0,.12,0,g);q.rotation.x=PI/2}
 for(const s of[-1,1]){box(1.4,35,1.4,MC(0x2b2740),s*14.5,17.5,0,g);Z.addC(...(()=>{const p=V(s*14.5,0,0);ltw(g,p);return[p.x,p.z,1.1]})())}
 box(31,1,1.4,MC(0x2b2740),0,34.5,0,g);box(31,.2,.3,B(0x14f195),0,33.9,.7,g);
 // wordmark
 const wm=cv(1024,256),w=wm.g;w.fillStyle='rgba(0,0,0,0)';w.font='900 190px '+SANS;w.textAlign='center';w.textBaseline='middle';
 for(const [b,c] of[[40,'#9945ff'],[18,'#14f195'],[4,'#ffffff']]){w.shadowColor=c;w.shadowBlur=b;w.fillStyle=b===4?'#e9fff6':c;w.fillText('SOLANA',512,134)}
 const wp=new T.Mesh(new T.PlaneGeometry(26,6.5),new T.MeshBasicMaterial({map:wm.t,transparent:true,toneMapped:false,side:T.DoubleSide}));wp.position.set(0,29.5,.2);g.add(wp);glow(0x9945ff,40,0,29.5,-1,g,.35);
 // shimmering neon curtain
 const tubes=[];for(let row=0;row<2;row++)for(let i=0;i<64;i++){const x=-13+i*26/63+row*.2,len=6+9*Math.abs(Math.sin(i*.37+row))+2*row,m=new T.MeshBasicMaterial({color:0x14f195,transparent:true,opacity:.9});
  const t=mesh(new T.CylinderGeometry(.07,.07,len,5),m,x,33.2-len/2,-.6+row*1.2,g);tubes.push({m,i,row})}
 const G=new T.Color(0x14f195),Pp=new T.Color(0x9945ff),tmp=new T.Color();
 Z.updaters.push(t=>tubes.forEach(q=>{const k=.5+.5*Math.sin(t*1.3+q.i*.25+q.row*1.7);tmp.copy(G).lerp(Pp,k);q.m.color.copy(tmp);q.m.opacity=.45+.5*Math.pow(.5+.5*Math.sin(t*3.1+q.i*.9),2)}));
 // logo slot
 const lg=cv(512,512),lq=lg.g;lq.fillStyle='rgba(14,9,40,.82)';Z.rr(lq,0,0,512,512,36);lq.fill();lq.setLineDash([22,16]);lq.lineWidth=8;lq.strokeStyle='#14f195';Z.rr(lq,10,10,492,492,30);lq.stroke();lq.setLineDash([]);lq.fillStyle='#fff';lq.textAlign='center';lq.font='800 46px '+SANS;lq.fillText('OFFICIAL LOGO',256,220);lq.font='500 32px '+MONO;lq.fillStyle='#14f195';lq.fillText('placeholder',256,280);lq.fillStyle='#b9b2ff';lq.font='500 26px '+MONO;lq.fillText('drop in licensed asset',256,330);
 const lp=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshBasicMaterial({map:lg.t,transparent:true,toneMapped:false,side:T.DoubleSide}));lp.position.set(0,15,3);g.add(lp);
 Z.updaters.push(t=>{lp.position.y=15+Math.sin(t*.8)*.5;lp.rotation.y=Math.sin(t*.4)*.25});
 const ks=new T.Group();ks.position.set(0,0,9);g.add(ks);box(2.6,3,.5,MC(0x2b2740),0,1.5,0,ks);const kt=sign(['SOLANA.ORG \u2197','open link'],2.4,1,{border:'#14f195'});kt.position.set(0,2.2,.3);ks.add(kt);
 for(const s of[-1,1])box(3,.5,.8,MC(0x6a4a8a),s*6,.25,10,g);
 const wv=V(0,0,9);ltw(g,wv);Z.addC(wv.x,wv.z,1.3);
 Z.interact.push({x:wv.x,z:wv.z,r:4,label:'Visit the Solana Sky Hall',act:()=>Z.panel('Solana Sky Hall <span class="tag">Tribute</span>','A hanging neon hall for the Solana ecosystem. The big plate is a <b>labeled placeholder</b> \u2014 supply the licensed logo asset to replace it.<br><br>'+NOTE,[],[LINKS.sol])});
 const sl=label(['SOLANA SKY HALL','neon · solana.org'],20,5,{border:'#9945ff'});sl.position.set(X,44,Z0);city.add(sl);
 Z.dest.push({n:'Solana Sky Hall',x:X-12,z:Z0-8,c:'#9945ff',k:'L',r:24,tag:'Neon hall \u00b7 solana.org'})}
// ===== Stonk Exchange =====
{const X=-64,Z0=-54,g=add(new T.Group());g.position.set(X,0,Z0);const st=MC(0xdcd0ba),st2=MC(0xc9b998);
 box(28,.9,20,st2,0,.45,0,g);Z.addP(X-14,X+14,Z0-10,Z0+10,.9);box(24,.45,3,st2,0,.22,11.5,g);Z.addP(X-12,X+12,Z0+10,Z0+13,.45);
 const W=(x0,x1,z0,z1)=>Z.addB(X+x0,X+x1,Z0+z0,Z0+z1);
 box(28,12,1,st,0,6.9,-9.5,g);W(-14,14,-10,-9);box(1,12,20,st,-13.5,6.9,0,g);W(-14,-13,-10,10);box(1,12,20,st,13.5,6.9,0,g);W(13,14,-10,10);
 box(10.5,12,1,st,-8.75,6.9,6,g);W(-14,-3.5,5.5,6.5);box(10.5,12,1,st,8.75,6.9,6,g);W(3.5,14,5.5,6.5);box(7,4,1,st,0,10.9,6,g);
 for(let i=0;i<8;i++){const x=-11+i*22/7;cyl(.85,1,11.5,st,x,6.65,8.5,g,12);box(2.2,.5,2.2,st2,x,12.6,8.5,g);const p=V(x,0,8.5);ltw(g,p);Z.addC(p.x,p.z,1)}
 box(28,1.8,4,st,0,13.8,7.5,g);const sh=new T.Shape();sh.moveTo(-15,0);sh.lineTo(15,0);sh.lineTo(0,5);sh.closePath();mesh(new T.ExtrudeGeometry(sh,{depth:1.5,bevelEnabled:false}),st,0,14.7,8.3,g);
 const ps=sign(['STONK EXCHANGE'],17,2.2,{bg:null,fg:'#7a5a2a',weight:'800'});ps.position.set(0,15.7,9.9);g.add(ps);
 const tk=cv(2048,64),tg=tk.g;tg.fillStyle='#08100c';tg.fillRect(0,0,2048,64);tg.font='700 40px '+MONO;tg.textBaseline='middle';let xx=10;
 ['BUY','HODL','SELL','STONKS','DEMO TICKER','NOT LIVE'].forEach((s,i)=>{tg.fillStyle=i%2?'#3dffa0':'#ffc24a';tg.fillText(s+'  \u25B2  ',xx,34);xx+=tg.measureText(s+'  \u25B2  ').width});
 tk.t.wrapS=T.RepeatWrapping;tk.t.repeat.set(1,1);const tp=new T.Mesh(new T.PlaneGeometry(26,.9),new T.MeshBasicMaterial({map:tk.t,toneMapped:false}));tp.position.set(0,12.9,9.55);g.add(tp);Z.updaters.push(t=>{tk.t.offset.x=-t*.03});
 const fl=mesh(new T.PlaneGeometry(26,18),new T.MeshStandardMaterial({color:0x3a3350,roughness:.5}),0,.92,0,g);fl.rotation.x=-PI/2;
 for(let i=0;i<3;i++)for(const s of[-1,1]){box(3,1,1.4,MC(0x5a4a3a),s*6,.9+.5,-2+i*3.4,g);box(2.2,.9,.1,EM(0x3dffa0,.9),s*6,2.1,-2.5+i*3.4,g)}
 const cb=cv(1024,400),cc=cb.g;cc.fillStyle='#07120e';cc.fillRect(0,0,1024,400);cc.strokeStyle='rgba(61,255,160,.12)';for(let i=1;i<8;i++){cc.beginPath();cc.moveTo(0,i*50);cc.lineTo(1024,i*50);cc.stroke()}
 let v=300;for(let i=0;i<46;i++){const o=v,c=o+R(-18,34)-4;const hi=Math.max(o,c)+R(5,22),lo=Math.min(o,c)-R(5,22);v=c;const up=c>o,x=20+i*21.5,y=y2=>370-y2*.85+(i*-1.2);cc.strokeStyle=cc.fillStyle=up?'#3dffa0':'#ff4f6d';cc.beginPath();cc.moveTo(x,y(hi));cc.lineTo(x,y(lo));cc.stroke();cc.fillRect(x-6,Math.min(y(o),y(c)),12,Math.max(3,Math.abs(y(o)-y(c))))}
 cc.fillStyle='#fff';cc.font='800 40px '+SANS;cc.fillText('STONK EXCHANGE',26,50);cc.fillStyle='#ffc24a';cc.font='500 26px '+MONO;cc.fillText('ILLUSTRATIVE CHART \u00b7 NOT LIVE DATA',26,86);
 const bd=new T.Mesh(new T.PlaneGeometry(18,7),new T.MeshBasicMaterial({map:cb.t,toneMapped:false}));bd.position.set(0,6.6,-8.9);g.add(bd);
 const kk=new T.Group();kk.position.set(0,.9,-3);g.add(kk);box(2.4,2.6,.5,MC(0x2b2740),0,1.3,0,kk);const ks=sign(['STONKFUN.XYZ \u2197','open link'],2.2,.9,{border:'#3dffa0'});ks.position.set(0,2,.3);kk.add(ks);const kw=V(0,0,-3);ltw(g,kw);Z.addC(kw.x,kw.z,1.2);
 const tw=winBox(14,46,14,0x7e8ec0,-8,0,-15,g,0x2a2548);Z.addC(X-8,Z0-15,9);const ts=sign(['STONK'],10,3,{border:'#3dffa0',fg:'#3dffa0'});ts.position.set(-8,48,-7.9);g.add(ts);cyl(.2,.4,12,MC(0xe8e4ff),-8,52,-15,g,5);glow(0x3dffa0,14,-8,47,-15,g,.5);
 // bull
 const bu=new T.Group();bu.position.set(X+9,0,Z0+21);add(bu);const gm=MC(0x1fa860,{emissive:0x0a3a22,emissiveIntensity:.5}),dkg=MC(0x167a46);
 sph(1.9,gm,0,2.3,0,bu,8,6).scale.set(1.5,1,1);sph(1.2,gm,2.3,2.7,0,bu,7,5);box(.8,.7,.9,dkg,3.3,2.4,0,bu);for(const s of[-1,1]){const h=cone(.18,1.1,MC(0xf4eef8),2.5,3.7,s*.9,bu,5);h.rotation.x=s*-.7;h.rotation.z=.3}
 for(const x of[-1.4,1.3])for(const z of[-.6,.6])box(.45,1.7,.45,dkg,x,.85,z,bu);cyl(.08,.05,1.6,dkg,-2.8,2.5,0,bu,4).rotation.z=.6;box(3.4,.4,2.4,MC(0x3a3350),0,.2,0,bu);bu.rotation.y=Math.atan2(-9,-21)+PI/2*0;Z.addC(X+9,Z0+21,2.6);
 const bs=sign(['STONK','bull market (statue)'],4,1.2,{border:'#3dffa0'});bs.position.set(0,.9,2);bu.add(bs);
 Z.interact.push({x:kw.x,z:kw.z+1.8,r:4,label:'Visit the Stonk Exchange',act:()=>Z.panel('Stonk Exchange <span class="tag">Tribute</span>','A Wall Street-style hall for Stonk, a Solana launchpad where coins can be paired with tokenized stocks and other assets. The chart inside is <b>illustrative</b> \u2014 no live data.<br><br>'+NOTE,[],[LINKS.stonk])});
 const sl=label(['STONK EXCHANGE','solana launchpad hall'],20,5,{border:'#3dffa0'});sl.position.set(X,64,Z0-8);city.add(sl);
 Z.dest.push({n:'Stonk Exchange',x:X,z:Z0+14,c:'#3dffa0',k:'K',r:26,tag:'Wall Street-style launchpad hall'})}
// ===== Wif Hat Plaza: giant dog in a pink knit beanie =====
{const X=-48,Z0=22,g=add(new T.Group());g.position.set(X,0,Z0);g.rotation.y=Math.atan2(-X,-Z0);
 const pd=mesh(new T.CircleGeometry(15,32),new T.MeshStandardMaterial({color:0x6a4a78,roughness:1}),0,.05,0,g);pd.rotation.x=-PI/2;const rg=mesh(new T.TorusGeometry(14.6,.14,4,48),B(0xff8fc9),0,.12,0,g);rg.rotation.x=PI/2;
 cyl(7,7.6,1.4,MC(0x8a6a9a),0,.7,0,g,14);
 const tan=MC(0xd2a46a),cr=MC(0xf4e4c6),dk=MC(0x1d1626),pk=MC(0xff8fc9,{emissive:0x7a2a50,emissiveIntensity:.5}),pk2=MC(0xff5fae,{emissive:0x7a2a50,emissiveIntensity:.5});
 const body=new T.Group();body.position.y=1.4;g.add(body);
 sph(4.6,tan,0,4.4,-.5,body,10,8).scale.set(1,1.15,.95);sph(3.2,cr,0,3.6,2.2,body,8,6).scale.set(1,1.2,.5);
 for(const s of[-1,1]){box(1.7,3.6,1.9,tan,s*1.7,1.8,3.2,body);box(1.9,.7,2.6,cr,s*1.7,.35,3.9,body)}
 const tail=new T.Group();tail.position.set(0,2.4,-4.6);body.add(tail);const tc=cone(.9,4,tan,0,1.6,0,tail,5);tc.rotation.x=-.4;sph(.9,cr,0,3.6,-.8,tail,6,5);
 const hd=new T.Group();hd.position.set(0,9.6,.6);body.add(hd);
 sph(3.6,tan,0,0,0,hd,12,9).scale.set(1.12,1,1);sph(1.9,cr,0,-1.1,2.6,hd,8,6).scale.set(1.1,.85,1.15);sph(.62,dk,0,-.4,4.4,hd,7,5);box(1.2,.16,.1,dk,0,-1.8,4.2,hd);box(.1,.7,.1,dk,0,-1.4,4.3,hd);
 const eyes=[];for(const s of[-1,1]){const e=sph(.5,dk,s*1.5,.5,3.2,hd,7,5);eyes.push(e);sph(.15,B(0xffffff),s*1.5+.12,.7,3.65,hd,5,4);sph(.9,cr,s*1.5,1.6,2.8,hd,6,4).scale.set(1.4,.28,.6)}
 const ears=[];for(const s of[-1,1]){const e=cone(1.5,3.2,dk,s*3.2,1.6,-.4,hd,4);e.rotation.z=-s*.55;e.rotation.y=PI/4;ears.push(e)}
 // beanie
 const hat=new T.Group();hat.position.set(0,2.6,-.2);hd.add(hat);
 const dome=sph(3.7,pk,0,.4,0,hat,12,8);dome.scale.set(1.12,.82,1.02);for(let i=0;i<6;i++){const rb=mesh(new T.TorusGeometry(3.3-i*.34,.1,4,28),pk2,0,.35+i*.46,0,hat);rb.rotation.x=PI/2;rb.scale.set(1.12,1,1.02)}
 const cuff=mesh(new T.TorusGeometry(3.7,.55,6,28),pk2,0,-.55,0,hat);cuff.rotation.x=PI/2;cuff.scale.set(1.1,1,1.05);const pom=sph(.95,pk2,0,3.2,0,hat,8,6);
 Z.updaters.push(t=>{tail.rotation.z=Math.sin(t*6)*.5;hd.rotation.y=Math.sin(t*.6)*.18;hd.rotation.x=Math.sin(t*.9)*.04;pom.position.y=3.2+Math.sin(t*3)*.12;ears[0].rotation.z=-.55+Math.max(0,Math.sin(t*1.7))*.15;const b=Math.sin(t*.8)>.96?.1:1;eyes.forEach(e=>e.scale.y=b)});
 Z.addC(X,Z0,7.4);
 // hat stall
 const hs=new T.Group();hs.position.set(-9,0,9);g.add(hs);box(5,2.6,2,MC(0x7a4a5a),0,1.3,0,hs);for(let i=0;i<3;i++)cone(.7,1.3,MC([0xff8fc9,0x4de8ff,0xffc24a][i]),-1.5+i*1.5,3.2,.2,hs,6);const ss=sign(['HAT STAND','demo \u00b7 no real goods'],4.4,1.2,{border:'#ff8fc9'});ss.position.set(0,4.4,1.1);hs.add(ss);const hv=V(-9,0,9);ltw(g,hv);Z.addB(hv.x-2.7,hv.x+2.7,hv.z-1.7,hv.z+1.7);
 const pg=sign(['WIF HAT PLAZA','fan-made giant dog statue'],12,2.6,{border:'#ff8fc9'});pg.position.set(0,20.2,0);g.add(pg);
 const kk=new T.Group();kk.position.set(0,0,10);g.add(kk);box(2.4,2.6,.5,MC(0x2b2740),0,1.3,0,kk);const kt=sign(['@DOGWIFCOIN \u2197','fan tribute \u00b7 open link'],2.3,.95,{border:'#ff8fc9'});kt.position.set(0,2.1,.3);kk.add(kt);const kv=V(0,0,10);ltw(g,kv);Z.addC(kv.x,kv.z,1.3);
 Z.interact.push({x:kv.x,z:kv.z,r:4.5,label:'Pet the giant dog',act:()=>Z.pet?Z.pet():0});
 Z.petPanel=()=>Z.panel('Wif Hat Plaza <span class="tag">Tribute</span>','A giant dog in a pink knit beanie, built as a fan tribute to the dogwifhat meme. Tail wag: on.<br><br>'+NOTE,[],[LINKS.wif]);
 Z.dest.push({n:'Wif Hat Plaza',x:X+8,z:Z0-2,c:'#ff8fc9',k:'W',r:20,tag:'Giant dog in a pink beanie'})}
// ===== Jean Phil Ring: silent shadowboxing caricature =====
{const X=-20,Z0=54,g=add(new T.Group());g.position.set(X,0,Z0);g.rotation.y=PI;
 box(16,1.2,16,MC(0x3a2a50),0,.6,0,g);Z.addP(X-8,X+8,Z0-8,Z0+8,1.2);box(5,.6,2,MC(0x3a2a50),0,.3,-9,g);Z.addP(X-2.5,X+2.5,Z0-10,Z0-8,.6);
 box(15.4,.1,15.4,MC(0x6a1830),0,1.25,0,g);
 const cols=[0xff4fd8,0x4de8ff];for(const x of[-7.6,7.6])for(const z of[-7.6,7.6]){cyl(.25,.25,5,MC(0x2b2740),x,3.7,z,g,6)}
 for(let k=0;k<3;k++){const y=2.2+k*1.1,c=[0xff4fd8,0xf4eef8,0x4de8ff][k];box(15.4,.1,.1,B(c),0,y+1.2,-7.6,g);box(15.4,.1,.1,B(c),0,y+1.2,7.6,g);box(.1,.1,15.4,B(c),-7.6,y+1.2,0,g);box(.1,.1,15.4,B(c),7.6,y+1.2,0,g)}
 // legs of the structure colliders
 for(const [x,z] of[[-7.6,-7.6],[7.6,-7.6],[-7.6,7.6],[7.6,7.6]]){const p=V(x,0,z);ltw(g,p);Z.addC(p.x,p.z,.5)}
 // giant
 const hnd=Z.tex(128,128,(c,w,h)=>{c.fillStyle='#6b4a2e';c.fillRect(0,0,w,h);c.fillStyle='#e8d8bc';for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2===0){c.fillRect(x*16,y*16,8,8);c.fillRect(x*16+8,y*16+8,8,8)}else{c.fillStyle='#3a281a';c.fillRect(x*16+4,y*16+4,8,8);c.fillStyle='#e8d8bc'}});
 const hm=new T.MeshStandardMaterial({map:hnd,flatShading:true,roughness:.95});
 const G=person({skin:0xf0cfae,shirt:0x6b4a2e,pants:0x6b4a2e,hair:null,scale:7,shoe:0x1a1210});const P=G.userData.P;
 P.torso.material=hm;[P.armL,P.armR].forEach(a=>a.children[0].material=hm);[P.legL,P.legR].forEach(l=>l.children[0].material=hm);
 box(.5,.5,.04,B(0xf4eef8),0,1.4,.18,G);box(.1,.34,.04,MC(0x3a1a14),0,1.3,.205,G);box(.5,.08,.05,B(0xf4eef8),0,1.5,.19,G);
 const hd=P.head,bl=MC(0xf0cf7a),gm=MC(0xc98f3a),sk=MC(0xf0cfae);hd.scale.set(1.45,1.75,1.4);hd.position.y+=.3;
 sph(.33,bl,0,.1,-.03,hd,12,8).scale.set(1.12,.78,1.1);
 for(const s of[-1,1]){box(.13,.46,.5,bl,s*.28,-.08,-.03,hd);const fl=box(.16,.1,.54,bl,s*.33,-.3,0,hd);fl.rotation.z=s*-.35}
 box(.58,.5,.13,bl,0,-.06,-.24,hd);box(.62,.1,.2,bl,0,-.3,-.2,hd);
 box(.5,.12,.1,bl,0,.2,.2,hd);
 box(.07,.12,.09,sk,0,-.04,.235,hd);
 box(.3,.05,.07,gm,0,-.105,.23,hd);
 for(const s of[-1,1]){box(.13,.045,.06,gm,s*.2,-.115,.225,hd);const t=box(.04,.12,.05,gm,s*.285,-.07,.225,hd);t.rotation.z=s*-.3;box(.1,.025,.02,gm,s*.1,.1,.2,hd)}
 G.position.set(0,1.3,0);g.add(G);
 const gl=glow(0xffc24a,16,0,6,0,g,.15);
 Z.updaters.push(t=>{const k=t*3.2,ph=Math.sin(k),ph2=Math.sin(k+PI);P.armR.rotation.x=-.8-Math.max(0,ph)*.9;P.armL.rotation.x=-.8-Math.max(0,ph2)*.9;P.armR.rotation.z=-.6;P.armL.rotation.z=.6;P.torso.parent.rotation.y=Math.sin(k*.5)*.4;P.head.rotation.y=-Math.sin(k*.5)*.25;P.legL.rotation.x=Math.sin(k*.5)*.15;P.legR.rotation.x=-Math.sin(k*.5)*.15;G.position.y=1.3+Math.abs(Math.sin(k))*.35;G.rotation.y=Math.sin(k*.25)*.15});
 for(let i=0;i<7;i++){const a=PI*(.1+i*.14)+PI,x=Math.cos(a)*11,z=Math.sin(a)*11+0,p=person({shirt:[0xff7a5a,0x3dffa0,0xb04aff,0x4de8ff,0xffc24a,0xff4fd8,0x6a8aff][i],hat:[null,'cap',null,null,'beanie',null,null][i],skin:[0xe3ad86,0xc68863,0x8d5a3b,0xf1c9a5][i%4],glow:i%2?0x4de8ff:0});p.position.set(x,0,z);p.rotation.y=Math.atan2(-x,-z);g.add(p);Z.crowd.push({g:p,ph:i,by:0,arms:true});const w=V(x,0,z);ltw(g,w);Z.addC(w.x,w.z,.6)}
 const pg=sign(['JEAN PHIL RING','silent shadowboxing \u00b7 fan caricature'],12,2.8,{border:'#ffc24a'});pg.position.set(0,17.8,0);g.add(pg);
 const ns=sign(['Caricature of an AI-generated internet character.','Not an endorsement of any token. Silent \u2014 no quotes.'],10,2,{fg:'#ffc24a',bg:'rgba(14,9,40,.85)',border:'#ffc24a'});ns.position.set(0,1.5,10);ns.rotation.y=PI;g.add(ns);
 const kk=new T.Group();kk.position.set(9,0,-9);g.add(kk);box(2.4,2.6,.5,MC(0x2b2740),0,1.3,0,kk);const kt=sign(['@JEANPHILMADAME \u2197','open link'],2.3,.95,{border:'#ffc24a'});kt.position.set(0,2.1,.3);kk.add(kt);kk.rotation.y=-.6;const kv=V(9,0,-9);ltw(g,kv);Z.addC(kv.x,kv.z,1.3);
 Z.interact.push({x:kv.x,z:kv.z,r:4.5,label:'About the Jean Phil statue',act:()=>Z.panel('Jean Phil Ring <span class="tag">Satire</span>','An oversized, silent caricature of Jean Phil, an AI-generated internet character known for shadowboxing in a houndstooth suit. Gestures only; no quotes, no voice.<br><br>This is <b>not an endorsement</b> of any token or claim. '+NOTE,[],[LINKS.jean])});
 Z.dest.push({n:'Jean Phil Ring',x:X,z:Z0-10,c:'#ffc24a',k:'J',r:20,tag:'Silent shadowboxing statue'})}
// ===== Sky market board (bowl-shaped, floating) =====
{const g=add(new T.Group());g.position.set(0,64,-16);g.scale.setScalar(1.25);const rot=new T.Group();g.add(rot);
 const dark=MC(0x10121c),trim=B(0x14f195);
 // underside
 cyl(13,12,3,dark,0,-8.2,0,rot,40);cyl(13.4,13.4,.5,B(0x14f195),0,-6.4,0,rot,40);
 for(let i=0;i<36;i++){const a=i/36*PI*2;box(.9,.35,.9,B(0xeaffff),Math.cos(a)*9,-9.8,Math.sin(a)*9,rot).rotation.y=-a}
 const fan=new T.Group();fan.position.y=-9.7;rot.add(fan);for(let i=0;i<24;i++){const a=i/24*PI*2;box(.12,.1,5,MC(0x2a2f40),Math.cos(a)*2.6,0,Math.sin(a)*2.6,fan).rotation.y=-a+PI/2}
 const core=sph(1.4,B(0xeaffff),0,-10,0,rot,8,6);glow(0xbfffff,24,0,-10.4,0,rot,.9);
 // ticker band
 const tk=cv(3584,100),tg=tk.g;tk.t.wrapS=T.RepeatWrapping;
 const band=mesh(new T.CylinderGeometry(13.6,13.2,2.6,48,1,true),new T.MeshBasicMaterial({map:tk.t,side:T.DoubleSide,toneMapped:false}),0,-4.8,0,rot);
 // panels
 const pn=cv(1024,576),pg=pn.g;
 const mk={BTC:{n:'Bitcoin',c:'#f7931a'},ETH:{n:'Ethereum',c:'#8a9cff'},SOL:{n:'Solana',c:'#14f195'}},ids={BTC:'bitcoin',ETH:'ethereum',SOL:'solana'};
 Z.market={status:'connecting',ts:0,d:{}};
 const fp=v=>v==null?'\u2014':'$'+(v>=1000?v.toLocaleString('en-US',{maximumFractionDigits:0}):v.toLocaleString('en-US',{maximumFractionDigits:2}));
 const fm=v=>v==null?'\u2014':v>=1e12?'$'+(v/1e12).toFixed(2)+'T':'$'+(v/1e9).toFixed(1)+'B';
 const fc=v=>v==null?'\u2014':(v>=0?'\u25B2 ':'\u25BC ')+Math.abs(v).toFixed(2)+'%';
 function draw(){const M=Z.market;pg.fillStyle='#05070f';pg.fillRect(0,0,1024,576);pg.fillStyle='#0c1426';pg.fillRect(0,0,1024,84);
  pg.fillStyle='#fff';pg.font='800 40px '+SANS;pg.textBaseline='middle';pg.textAlign='left';pg.fillText('ZEITGEIST MARKETS',32,44);
  const live=M.status==='live';pg.textAlign='right';pg.font='700 24px '+MONO;pg.fillStyle=live?'#14f195':'#ffc24a';pg.fillText(live?'\u25CF LIVE \u00b7 COINGECKO':M.status==='connecting'?'\u25CB CONNECTING\u2026':'\u25CB FEED OFFLINE',992,44);
  pg.fillStyle='#7f8bb5';pg.font='600 24px '+MONO;pg.textAlign='left';[['ASSET',40],['PRICE',330],['24H',590],['MARKET CAP',770]].forEach(c=>pg.fillText(c[0],c[1],118));
  pg.strokeStyle='#1d2742';pg.lineWidth=2;pg.beginPath();pg.moveTo(24,142);pg.lineTo(1000,142);pg.stroke();
  Object.keys(mk).forEach((k,i)=>{const y=215+i*128,d=M.d[k]||{};pg.fillStyle=mk[k].c;pg.beginPath();pg.arc(68,y,30,0,PI*2);pg.fill();pg.fillStyle='#05070f';pg.font='900 24px '+SANS;pg.textAlign='center';pg.fillText(k,68,y+1);
   pg.textAlign='left';pg.fillStyle='#fff';pg.font='800 40px '+SANS;pg.fillText(mk[k].n,116,y-12);pg.fillStyle='#7f8bb5';pg.font='600 22px '+MONO;pg.fillText(k+'/USD',116,y+24);
   pg.fillStyle='#fff';pg.font='800 46px '+MONO;pg.fillText(fp(d.p),330,y);pg.fillStyle=d.c==null?'#7f8bb5':d.c>=0?'#14f195':'#ff4f6d';pg.font='800 36px '+MONO;pg.fillText(fc(d.c),590,y);pg.fillStyle='#e8ecff';pg.font='700 38px '+MONO;pg.fillText(fm(d.m),770,y);
   pg.strokeStyle='#121a2e';pg.beginPath();pg.moveTo(24,y+64);pg.lineTo(1000,y+64);pg.stroke()});
  pg.fillStyle='#7f8bb5';pg.font='500 22px '+MONO;pg.textAlign='left';pg.fillText(live?'Data: CoinGecko public API \u00b7 updated '+new Date(M.ts).toLocaleTimeString():'No data \u2014 live feed unreachable from this page; retrying every 60 s.',32,548);
  pg.fillStyle='rgba(0,0,0,.28)';for(let y=0;y<576;y+=4)pg.fillRect(0,y,1024,1);pn.t.needsUpdate=true;
  // ticker
  tg.fillStyle='#050805';tg.fillRect(0,0,3584,100);tg.font='700 62px '+MONO;tg.textBaseline='middle';tg.textAlign='left';let x=20;
  const parts=[];Object.keys(mk).forEach(k=>{const d=M.d[k]||{};parts.push([mk[k].n.toUpperCase()+' '+fp(d.p)+' '+fc(d.c).replace(' ',''),d.c==null?'#7f8bb5':d.c>=0?'#14f195':'#ff6a85'])});
  parts.push(['HACKATHON @ COLOSSEUM (DEMO)','#ffc24a'],['ROCKET LIFTOFF @ MOONPORT','#4de8ff'],['ZEITGEIST MARKETS \u00b7 NOT FINANCIAL ADVICE','#ff4fd8']);
  parts.forEach(p=>{tg.fillStyle=p[1];tg.fillText(p[0]+'    \u25C6    ',x,52);x+=tg.measureText(p[0]+'    \u25C6    ').width});tk.t.needsUpdate=true}
 draw();
 for(let k=0;k<4;k++){const s=new T.Group();s.rotation.y=k*PI/2;rot.add(s);const m=new T.Mesh(new T.PlaneGeometry(22,12.4),new T.MeshBasicMaterial({map:pn.t,toneMapped:false}));m.position.set(0,1.6,12.2);m.rotation.x=.26;s.add(m);
  const fr=new T.Group();fr.position.copy(m.position);fr.rotation.x=.26;s.add(fr);for(const [w,h,x,y] of[[22.6,.4,0,6.4],[22.6,.4,0,-6.4],[.4,12.8,-11.3,0],[.4,12.8,11.3,0]])box(w,h,.5,dark,x,y,-.1,fr);
  box(22.6,.2,.2,trim,0,-6.5,.25,fr);const bk=box(22,12.4,.4,dark,0,1.6,11.7,s);bk.rotation.x=.26;
  for(let i=0;i<5;i++){const t=box(.25,13,.25,MC(0x1c2030),-10+i*5,1,10.5,s);t.rotation.x=.26}}
 for(const [r,y,c] of[[15.6,8.4,0x14f195],[14.6,10.2,0x9945ff]]){const t=mesh(new T.TorusGeometry(r,.3,5,56),MC(0x1c2030),0,y,0,rot);t.rotation.x=PI/2;const q=mesh(new T.TorusGeometry(r,.1,4,56),B(c),0,y+.35,0,rot);q.rotation.x=PI/2}
 for(let i=0;i<12;i++){const a=i/12*PI*2;box(.2,1.8,.2,MC(0x1c2030),Math.cos(a)*15.1,9.3,Math.sin(a)*15.1,rot)}
 for(let i=0;i<4;i++){const a=i*PI/2+PI/4;glow(0xffffff,9,Math.cos(a)*15.4,8.5,Math.sin(a)*15.4,rot,.85)}
 const sl=label(['SKY MARKET BOARD','BTC \u00b7 ETH \u00b7 SOL'],24,5.5,{border:'#14f195'});sl.position.set(0,96,-16);city.add(sl);
 Z.updaters.push(t=>{rot.rotation.y=t*.06;g.position.y=64+Math.sin(t*.4)*1.4;fan.rotation.y=-t*1.5;tk.t.offset.x=t*.012;tk.t.repeat.x=1});
 async function pull(){try{const r=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=24h');if(!r.ok)throw new Error(r.status);const j=await r.json();const d={};Object.keys(ids).forEach(k=>{const o=j.find(x=>x.id===ids[k]);if(o)d[k]={p:o.current_price,c:o.price_change_percentage_24h,m:o.market_cap}});if(!Object.keys(d).length)throw new Error('empty');Z.market={status:'live',ts:Date.now(),d}}catch(e){if(Z.market.status!=='live')Z.market.status='offline'}draw()}
 pull();setInterval(pull,60000);Z.drawBoard=draw}
})(window.ZG);
