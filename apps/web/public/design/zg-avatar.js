(function(Z){
const T=Z.T,{MC,EM,mesh,sph,cyl,box,cone}=Z,PI=Math.PI;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ss=(a,b,x)=>{x=cl((x-a)/(b-a),0,1);return x*x*(3-2*x)},lp=(a,b,t)=>a+(b-a)*t;
const L=.5,ANK=.13;
// two-bone IK in the sagittal plane: hip at origin, target (tz forward, ty up-negative)
function ik(g,tz,ty){const d=Math.min(Math.hypot(tz,ty),L*1.99),a=Math.acos(cl(1-d*d/(2*L*L),-1,1)),be=Math.acos(cl(d/(2*L),-1,1)),th=Math.atan2(tz,-ty)+be;g.hip.rotation.x=-th;g.shin.rotation.x=PI-a;g.foot.rotation.x=th-(PI-a)}
Z.makeAvatar=(o={})=>{
 const skin=MC(o.skin??0xdda27c),jk=MC(o.jacket??0x1fb8d8),pants=MC(o.pants??0x2b2a55),boot=MC(0xf1eefb),hair=MC(o.hair??0x5a2e8a),dark=MC(0x1b1530),neon=EM(o.neon??0x3dffa0,1.3),cy=EM(0x4de8ff,1.2),mg=EM(0xff4fd8,1.2);
 const vis=new T.MeshStandardMaterial({color:o.visor??0xff4fd8,emissive:o.visor??0xff4fd8,emissiveIntensity:.9,side:T.DoubleSide,flatShading:true});
 const A={root:new T.Group(),body:new T.Group(),ph:Math.random(),air:0,land:0,ride:0,roll:0,lean:0,t:Math.random()*9,crank:0,legs:[],arms:[]};
 A.root.add(A.body);A.body.scale.setScalar(.86);
 const pel=new T.Group();pel.position.y=.9;A.body.add(pel);A.pel=pel;
 sph(.2,pants,0,0,0,pel,10,8).scale.set(1.2,.85,1);
 const tor=new T.Group();pel.add(tor);A.tor=tor;
 cyl(.25,.2,.56,jk,0,.3,0,tor,10).scale.z=.78;cyl(.205,.205,.06,mg,0,.03,0,tor,10).scale.z=.8;
 box(.04,.44,.02,cy,-.09,.32,.19,tor);box(.04,.44,.02,cy,.09,.32,.19,tor);
 cyl(.2,.23,.14,jk,0,.62,0,tor,10).scale.z=.85;cyl(.19,.19,.02,neon,0,.7,0,tor,10);cyl(.07,.07,.1,skin,0,.72,0,tor,6);
 for(const s of[-1,1])sph(.13,jk,s*.27,.52,0,tor,8,6);
 const pk=new T.Group();pk.position.set(0,.34,-.23);tor.add(pk);A.pack=pk;
 box(.32,.4,.14,MC(0x3a2f6a),0,0,0,pk);box(.3,.03,.02,neon,0,.12,-.075,pk);box(.3,.03,.02,neon,0,-.12,-.075,pk);cyl(.012,.012,.38,dark,.11,.3,0,pk,4);sph(.035,mg,.11,.5,0,pk,6,5);
 const hd=new T.Group();hd.position.y=.78;tor.add(hd);A.head=hd;
 sph(.26,skin,0,.2,0,hd,14,10).scale.set(1,1.05,.97);
 mesh(new T.SphereGeometry(.27,16,4,PI/2-1.05,2.1,1.25,.55),vis,0,.2,0,hd);
 sph(.04,skin,0,.14,.255,hd,6,5);box(.09,.018,.02,dark,0,.04,.235,hd);
 for(const s of[-1,1]){const e=cyl(.085,.085,.07,cy,s*.265,.2,0,hd,10);e.rotation.z=PI/2}
 const st=o.style||'short',hm=hair;
 const hc=sph(.28,hm,0,.31,-.035,hd,12,8);hc.scale.set(1.0,.66,1.06);
 for(const s of[-1,1]){box(.05,.13,.14,hm,s*.255,.17,-.02,hd)}
 box(.5,.2,.12,hm,0,.3,-.2,hd);
 if(st==='quiff'){const q=box(.36,.13,.3,hm,0,.5,.06,hd);q.rotation.x=-.28;sph(.13,hm,0,.5,.2,hd,8,6).scale.set(1.3,.8,1);box(.12,.1,.2,hm,.2,.42,.1,hd).rotation.z=-.5}
 else if(st==='long'){box(.5,.46,.12,hm,0,.05,-.22,hd);for(const s of[-1,1])box(.07,.4,.16,hm,s*.27,.02,-.08,hd)}
 else if(st==='bun'){sph(.11,hm,0,.55,-.12,hd,8,6);box(.5,.3,.14,hm,0,.15,-.22,hd)}
 else if(st==='curly'){for(let k=0;k<9;k++){const an=k/9*PI*2;sph(.11,hm,Math.cos(an)*.2,.45+Math.sin(k*2)*.04,Math.sin(an)*.2-.03,hd,6,5)}sph(.17,hm,0,.55,-.02,hd,7,5)}
 else if(st==='pony'){box(.5,.2,.12,hm,0,.3,-.2,hd);const pt=new T.Group();pt.position.set(0,.34,-.27);hd.add(pt);A.tail=pt;cyl(.06,.025,.36,hm,0,-.17,0,pt,6);sph(.05,neon,0,-.38,0,pt,6,5)}
 else box(.34,.07,.3,hm,0,.49,.04,hd);
 if(!A.tail)A.tail=new T.Group();
 const hl=mesh(new T.TorusGeometry(.22,.022,6,20),Z.B(0xfff3a0),0,.82,0,hd);hl.rotation.x=PI/2;hl.visible=false;A.halo=hl;
 if(o.hat==='cap'){sph(.285,MC(0x2b2740),0,.36,0,hd,10,6).scale.set(1,.6,1.04);box(.34,.03,.2,MC(0x2b2740),0,.35,.3,hd)}
 if(o.hat==='beanie'){const b=sph(.29,MC(0xe8654a),0,.34,-.01,hd,10,7);b.scale.set(1,.8,1.04);const r=mesh(new T.TorusGeometry(.27,.045,5,16),MC(0xc84a32),0,.24,0,hd);r.rotation.x=PI/2}
 for(const s of[-1,1]){const sh=new T.Group();sh.position.set(s*.3,.52,0);tor.add(sh);cyl(.075,.065,.3,jk,0,-.15,0,sh,8);const el=new T.Group();el.position.y=-.3;sh.add(el);cyl(.062,.052,.26,skin,0,-.13,0,el,8);cyl(.07,.07,.05,neon,0,-.03,0,el,8);sph(.08,boot,0,-.28,0,el,7,6);A.arms.push({sh,el,s})}
 for(const s of[-1,1]){const hip=new T.Group();hip.position.set(s*.12,-.02,0);pel.add(hip);cyl(.105,.085,.5,pants,0,-.25,0,hip,8);sph(.09,pants,0,-.5,0,hip,7,6);const shin=new T.Group();shin.position.y=-.5;hip.add(shin);cyl(.085,.07,.5,pants,0,-.25,0,shin,8);const foot=new T.Group();foot.position.y=-.5;shin.add(foot);box(.17,.14,.32,boot,0,-.04,.07,foot);const toe=sph(.09,boot,0,-.05,.2,foot,6,5);toe.scale.set(1,.8,1);box(.18,.03,.34,neon,0,-.115,.07,foot);A.legs.push({hip,shin,foot,s})}
 A.setAcc=a=>{pk.visible=a.pack!==false;hl.visible=!!a.halo};
 // s: {speed,grounded,vy,turn,landed,riding,crank}
 A.update=(s,dt)=>{
  A.t+=dt;const sp=s.speed||0,gr=s.grounded!==false,rd=!!s.riding;
  A.air+=((gr?0:1)-A.air)*Math.min(1,dt*(gr?16:10));A.ride+=((rd?1:0)-A.ride)*Math.min(1,dt*8);
  if(s.landed)A.land=Math.min(1,.3+s.landed*.05);A.land=Math.max(0,A.land-dt*3);
  const run=cl((sp-5.5)/4.5,0,1),w=ss(.25,1.3,sp)*(1-A.ride),Lh=Math.max(.5,.42+.06*sp+.45*run),sf=lp(.62,.36,run);
  if(gr&&sp>.2&&!rd)A.ph=(A.ph+dt*sp*sf/Lh)%1;
  if(rd)A.crank=s.crank||0;
  const FT=[0,1].map(i=>{const u=(A.ph+(i?.5:0))%1;let fz,fy;if(u<sf){fz=Lh/2-Lh*(u/sf);fy=0}else{const v=(u-sf)/(1-sf);fz=-Lh/2+Lh*(.5-.5*Math.cos(PI*v));fy=(.17+.36*run)*Math.sin(PI*v)}return{fz,fy}});
  let reach=9;for(const f of FT)if(f.fy<.01)reach=Math.min(reach,Math.max(.84,ANK+Math.sqrt(Math.max(.2,.955*.955-f.fz*f.fz))));
  let hy=lp(1.1-.008*Math.sin(A.t*2),Math.min(1.1,reach+.02),w);
  hy=lp(hy,1.1,A.air)-.1*A.land;hy=lp(hy,.9,A.ride);A.pel.position.y=hy;
  const hipY=hy-.02,zn=[0,0],m=ss(-4,3,s.vy||0);
  A.legs.forEach((lg,i)=>{
   const fz=FT[i].fz,fy=FT[i].fy;
   zn[i]=fz/(Lh/2);
   let tz=lp(i?-.04:.04,fz,w),ty=lp(0,fy,w);
   tz=lp(tz,i?lp(-.1,-.15,m):lp(.15,.28,m),A.air);ty=lp(ty,i?lp(.05,.12,m):lp(.12,.32,m),A.air);
   const a=A.crank+(i?PI:0);
   tz=lp(tz,.3+.2*Math.cos(a),A.ride);ty=lp(ty,.2+.22*Math.sin(a)-ANK,A.ride);
   ik(lg,tz,ANK+ty-hipY)});
  const amp=lp(.6,1.5,run)*w,tl=lp(lp(.05+.42*run*w,.15,A.air),.5,A.ride);
  A.lean+=(tl-A.lean)*Math.min(1,dt*8);A.tor.rotation.x=A.lean;A.tor.scale.y=1+.012*Math.sin(A.t*2)*(1-w);
  A.arms.forEach((ar,i)=>{
   let F=zn[1-i]*amp+Math.sin(A.t*1.4+i*2)*.04*(1-w),E=.15+1.45*run*w+.1*(1-w);
   const up=ss(-1,3,s.vy||0);F=lp(F,lp(1.3,2.3,up),A.air);E=lp(E,.3,A.air);F=lp(F,.85,A.ride);E=lp(E,.2,A.ride);
   ar.sh.rotation.x=-F+A.lean;ar.sh.rotation.z=ar.s*(.1+.25*A.air);ar.el.rotation.x=-E});
  A.head.rotation.x=-A.lean*.7+Math.sin(A.t*.6)*.03;A.head.rotation.y=Math.sin(A.t*.5)*.25*(1-w)*(1-A.ride);
  A.tail.rotation.x=.4+sp*.07+Math.sin(A.t*3)*.08;
  A.pel.rotation.y=Math.sin(2*PI*A.ph)*(.2-.08*run)*w;A.pel.position.x=Math.sin(2*PI*A.ph)*.025*w;A.tor.rotation.y=-A.pel.rotation.y*1.3;
  A.roll+=(cl(-(s.turn||0)*.04,-.3,.3)-A.roll)*Math.min(1,dt*8);A.body.rotation.z=A.roll};
 return A};
})(window.ZG);
