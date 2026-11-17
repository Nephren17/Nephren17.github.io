/* Painted layered rooms, traversable furnishing, readable hazards and signature combat. */
class HajimiWorld {
  constructor(base='assets/world/') {
    this.base=base;this.images={};this.assets=window.HAJIMI_WORLD_ASSETS;this.effects=[];this.puddles=[];this.mapOpen=false;
    this.palette={mimi:['#69eaff','#dafaff'],ww:['#ff3456','#ffbd63'],niannian:['#ef873e','#ffe18a'],keke:['#ffe141','#ff5b66'],xiaohuo:['#ff872e','#fff0a1'],du:['#ca874d','#ffe6a0'],shushu:['#a7de6a','#ffe8a3'],chenchen:['#ff3458','#ffe7de'],tata:['#ff622a','#ffc363'],kaikai:['#afff42','#f1ffcf'],huanghuang:['#ffad3a','#fff3b4']};
    const entries=[...Object.entries(this.assets.backgrounds),...Object.entries(this.assets.props)];
    this.ready=Promise.all(entries.map(([key,item])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{this.images[key]=im;resolve(true)};im.onerror=()=>resolve(false);im.src=base+item.file+'?v=4'})));
  }
  init() {
    this.effects=[];this.puddles=[];this.mapOpen=false;this.seen=new Set();this.room=null;this.lastEmission={};
    this.sectors=[
      {id:'berth',name:'灯火休息舱',theme:'dorm_depth',color:'#ddac68',x:0,y:2240,w:1040,h:560,poly:[[0,100],[80,100],[80,0],[900,0],[900,80],[1040,80],[1040,560],[0,560]]},
      {id:'tea',name:'茶雾公共厅',theme:'dorm_depth',color:'#d28a62',x:1240,y:2240,w:1200,h:560,poly:[[0,0],[720,0],[720,60],[1200,60],[1200,560],[0,560]]},
      {id:'du',name:'教官值班室',theme:'archive_depth',color:'#ca8b74',x:2480,y:2300,w:1120,h:500,poly:[[0,0],[760,0],[760,80],[1120,80],[1120,500],[0,500]]},
      {id:'archive',name:'悬空藏书夹层',theme:'archive_depth',color:'#8e99d7',x:1260,y:1570,w:1340,h:600,poly:[[0,100],[140,100],[140,0],[1080,0],[1080,100],[1340,100],[1340,600],[670,600],[670,550],[470,550],[470,600],[0,600]]},
      {id:'garden',name:'青苔温室前庭',theme:'lab_depth',color:'#8dc996',x:500,y:920,w:850,h:580,poly:[[0,0],[650,0],[650,80],[850,80],[850,580],[0,580]]},
      {id:'shushu',name:'稻穗玻璃庭',theme:'lab_depth',color:'#cbdc8b',x:1400,y:840,w:900,h:660,poly:[[80,0],[820,0],[820,80],[900,80],[900,660],[0,660],[0,80],[80,80]]},
      {id:'lab',name:'蓝绿实验舱',theme:'lab_depth',color:'#69c3c2',x:2360,y:900,w:920,h:600,poly:[[0,100],[120,100],[120,0],[920,0],[920,600],[0,600]]},
      {id:'cache',name:'旧物储藏间',theme:'archive_depth',color:'#b6a1d8',x:0,y:1050,w:300,h:450,poly:[[0,0],[300,0],[300,450],[0,450]]},
      {id:'west',name:'通风检修井',theme:'archive_depth',color:'#4b829c',x:300,y:1500,w:200,h:1300,shaft:true},
      {id:'stack',name:'书架螺旋井',theme:'archive_depth',color:'#9d947e',x:1000,y:1460,w:260,h:1340,shaft:true},
      {id:'east',name:'悬台回廊',theme:'archive_depth',color:'#659a9d',x:2600,y:1470,w:230,h:1330,shaft:true},
      {id:'lift',name:'货梯井',theme:'archive_depth',color:'#6a98af',x:3300,y:1500,w:200,h:1300,shaft:true}
    ];
    this.connections=[['berth','west'],['berth','stack'],['stack','tea'],['stack','archive'],['stack','garden'],['west','cache'],['west','garden'],['garden','shushu'],['shushu','lab'],['archive','east'],['east','tea'],['tea','du'],['du','lift'],['lift','lab']];
    const crack=solids.find(s=>s.crack);
    solids=[{x:-200,y:2800,w:4000,h:400},{x:-200,y:0,w:200,h:3000},{x:3600,y:0,w:200,h:3000},{x:0,y:580,w:3600,h:55},
      {x:0,y:1500,w:300,h:42},{x:500,y:1500,w:500,h:42},{x:1260,y:1500,w:1340,h:42},{x:2830,y:1500,w:770,h:42},
      {x:1260,y:2170,w:470,h:28},{x:1930,y:2170,w:670,h:28},doors.b1,doors.b2l,doors.b2r,elev];
    if(crack)solids.push(crack);
    this.bridge={x:1730,y:2170,w:200,h:16,oneway:1,off:true,worldBridge:true};solids.push(this.bridge);
    for(let i=0;i<11;i++){solids.push({x:i%2?1145:1030,y:2680-i*120,w:115,h:15,oneway:1,worldStep:true});
      solids.push({x:i%2?2730:2620,y:2680-i*120,w:110,h:15,oneway:1,worldStep:true});}
    for(const [x,y] of [[300,2220],[420,2010],[300,1800],[420,1590]])solids.push({x,y,w:80,h:15,oneway:1,worldStep:true});
    this.furniture=[];
    const f=(type,x,y,w,h,walk=true)=>{const o={id:'f'+this.furniture.length,type,x,y,w,h};this.furniture.push(o);if(walk)solids.push({x:x+w*.04,y,w:w*.92,h:12,oneway:1,furniture:o.id});return o};
    f('sofa',125,2734,210,74);f('supply_crate',365,2720,105,85);f('desk',515,2670,280,140);f('cabinet',830,2540,150,270);f('hanging_platform',980,2420,180,160);
    f('tea_table',1300,2700,280,110);f('cabinet',1690,2570,165,240);f('hanging_platform',1880,2445,205,200);f('console',2090,2665,235,145);f('supply_crate',2330,2720,95,85);
    f('desk',2540,2675,220,130);f('cabinet',3450,2590,120,220);
    f('desk',1310,2060,245,118);f('bookshelf',1570,1930,150,250);f('console',2090,2045,250,140);f('cabinet',2450,1930,140,250);
    f('planter',645,1380,235,128);f('cabinet',1010,1260,155,250);f('hanging_platform',1200,1140,160,160);f('planter',1445,1390,145,120);
    f('console',1790,1370,165,138);f('planter',2410,1380,180,130);f('console',2760,1370,200,140);f('cabinet',3040,1260,155,252);
    f('bookshelf',20,1210,110,300);f('supply_crate',170,1410,95,95);
    this.hazards=[
      {id:'tea-berth',kind:'tea',x:735,y:2670,t:2.0,phase:'idle',hp:20},
      {id:'tea-common',kind:'tea',x:1500,y:2700,t:1.2,phase:'idle',hp:20},
      {id:'tea-archive',kind:'tea',x:1465,y:2060,t:1.8,phase:'idle',hp:20},
      {id:'steam-lab',kind:'steam',x:2510,y:1500,t:2.6,phase:'idle',hp:999},
      {id:'lamp-common',kind:'lamp',x:2200,y:2310,t:0,phase:'idle',hp:999}
    ];
    this.lever={x:2010,y:2170,on:false};this.caches=[{x:2490,y:1930,opened:false,openAt:0}];
    enemies.push(mkEnemy('bug',1460,2170),mkEnemy('vend',2375,2170));
    const npc=npcs.find(n=>n.id==='bobo');if(npc){npc.x=930;npc.y=2800}
    const flame=npcs.find(n=>n.id==='lala');if(flame){flame.x=900;flame.y=1380}
    const coco=npcs.find(n=>n.id==='aken');if(coco){coco.x=3090;coco.y=1260}
    signs=[];G.tip={t:6,text:'桌面和柜顶可落脚 · 别停在探照灯里 · M 查看地图'};
    ART.preload(Object.keys(this.assets.effects).map(k=>'operator_'+k+'_impact'));
    const preview=new URLSearchParams(location.search).get('room');
    const presets={berth:[620,2670,0,2160],archive:[1350,2170,1180,1500],garden:[1620,1500,1300,820],tea:[1390,2700,1100,2160]};
    if(presets[preview]){const [x,y,cx,cy]=presets[preview];P.x=x;P.y=y-P.h;cam.x=cx;cam.y=cy;G.cp={x:P.x,y:P.y};G.banner.t=0;}
    this.visit();
  }
  contains(r,x,y){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
  visit(){const x=P.x+P.w/2,y=P.y+P.h-2;const r=this.sectors.filter(r=>this.contains(r,x,y)).sort((a,b)=>(a.shaft?-1:0)-(b.shaft?-1:0)||a.w*a.h-b.w*b.h)[0];
    if(r){this.room=r;this.seen.add(r.id)}return r;}
  update(dt){
    this.visit();
    for(const h of this.hazards){if(h.hp<=0)continue;
      if(h.kind==='lamp'){const x=h.x+Math.sin(G.t*1.4)*64,y=h.y+Math.cos(G.t*1.4)*14+95;
        if(Math.abs(P.x+17-x)<30&&Math.abs(P.y+28-y)<36)hurtPlayer(5,x);continue}
      const near=Math.abs(P.x+17-h.x)<340&&Math.abs(P.y+P.h-h.y)<270;
      if(h.phase==='idle'&&!near)continue;h.t-=dt;
      if(h.phase==='idle'&&h.t<=0){h.phase='warn';h.t=.85;h.aim=P.x+17;h.warnAt=G.t;tone(740,.08,'triangle',.025,950)}
      else if(h.phase==='warn'&&h.t<=0){h.phase='active';h.t=h.kind==='steam'?1.0:.28;
        if(h.kind==='tea'){const dir=sgn(h.aim-h.x);for(let i=-1;i<=1;i++)projs.push({k:'tea',x:h.x+dir*14,y:h.y-33,vx:dir*(190+i*55),vy:-260-i*55,r:7,dmg:7,life:1.5,grav:900});
          spark(h.x,h.y-25,6,'#ffe3b6',70)}
      }else if(h.phase==='active'){
        if(h.kind==='steam'&&Math.abs(P.x+17-h.x)<32&&P.y+P.h>h.y-175&&P.y<h.y)hurtPlayer(6,h.x);
        if(h.t<=0){h.phase='idle';h.t=h.kind==='tea'?3.6:3.1}
      }
    }
    for(const p of this.puddles){p.life-=dt;if(Math.abs(P.x+17-p.x)<p.w/2&&Math.abs(P.y+P.h-p.y)<18)hurtPlayer(4,p.x)}
    this.puddles=this.puddles.filter(p=>p.life>0);
    for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
    if(this.effects.length>70)this.effects.splice(0,this.effects.length-70);
    if(!this.lever.on&&Math.abs(P.x+17-this.lever.x)<65&&Math.abs(P.y+P.h-this.lever.y)<90&&K.pUse()){
      this.lever.on=true;this.bridge.off=false;tip('藏书夹层的折叠桥已展开：回环捷径连通',3);sfx('up');this.emit('keke',this.lever.x,this.lever.y-45,.7,true)}
    for(const c of this.caches)if(!c.opened&&Math.abs(P.x+17-c.x)<60&&Math.abs(P.y+P.h-c.y)<80&&K.pUse()){
      c.opened=true;c.openAt=G.t;G.coins+=12;heal(10);tip('夹层藏品：12 鲸币与 10 点恢复',3);sfx('up')}
    for(const e of enemies)if(e.boss&&e.active&&!e.dead){if(e.worldState!==e.st&&['strike','cast','fan','dash','burst'].includes(e.st))this.emit(e.boss===1?'du':'shushu',e.x+e.w/2,e.y+e.h*.5,1.1,true,e.face);e.worldState=e.st}
  }
  impactProjectile(p){if(p.k==='tea'){this.puddles.push({x:p.x,y:p.y+5,w:76,life:1.7});spark(p.x,p.y,6,'#ffc47b',110)}}
  hitFurniture(box,dmg){let hits=0;for(const h of this.hazards){if(h.kind!=='tea'||h.hp<=0)continue;const b={x:h.x-20,y:h.y-46,w:40,h:46};if(ov(box,b)){h.hp-=dmg;hits++;this.emit(CH[cur().id].anim||'mimi',h.x,h.y-25,.48,true);
      if(h.hp<=0){h.phase='broken';G.coins+=2;tip('热茶已打翻，喷溅机关解除',1.5)}}}return hits;}
  emit(actor,x,y,scale=1,heavy=false,face=1){if(!this.palette[actor])actor='mimi';const key=actor+(heavy?'h':'s');
    if(G.t-(this.lastEmission[key]??-999)<.055)return;this.lastEmission[key]=G.t;
    this.effects.push({actor,x,y,scale,heavy,face,life:heavy?.48:.34,max:heavy?.48:.34,seed:this.effects.length*1.71+G.t*7});}
  attack(actor,x,y,dir){this.emit(actor,x+(dir==='fwd'?P.face*48:0),y+(dir==='down'?36:dir==='up'?-36:0),.7,false,P.face)}
  hit(actor,e,heavy){this.emit(actor,e.x+e.w/2,e.y+e.h*.5,heavy?1.05:.6,heavy,P.face)}
  polygon(ctx,r){ctx.beginPath();if(r.poly){r.poly.forEach(([x,y],i)=>i?ctx.lineTo(r.x+x,r.y+y):ctx.moveTo(r.x+x,r.y+y));ctx.closePath()}else ctx.rect(r.x,r.y,r.w,r.h)}
  drawBackground(ctx){
    ctx.fillStyle='#0c1422';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-Math.round(cam.x),-Math.round(cam.y));
    for(const r of this.sectors){if(r.x>cam.x+W||r.x+r.w<cam.x||r.y>cam.y+H||r.y+r.h<cam.y)continue;
      ctx.save();this.polygon(ctx,r);ctx.clip();ctx.fillStyle=r.shaft?'#152639':'#1d2b3c';ctx.fillRect(r.x,r.y,r.w,r.h);
      const im=this.images[r.shaft?'shaft_depth':r.theme];if(im&&!r.shaft){const sc=Math.max(r.w/im.width,r.h/im.height)*1.12,dw=im.width*sc,dh=im.height*sc;
        const px=(cam.x-(r.x+r.w/2-W/2))*.075,py=(cam.y-(r.y+r.h/2-H/2))*.025;
        ctx.drawImage(im,r.x+(r.w-dw)/2-px,r.y+(r.h-dh)/2-py,dw,dh);ctx.fillStyle='#07132628';ctx.fillRect(r.x,r.y,r.w,r.h)}
      if(r.shaft){if(im){ctx.globalAlpha=.74;ctx.drawImage(im,r.x,r.y,r.w,r.h);ctx.globalAlpha=1}for(let y=r.y+50;y<r.y+r.h;y+=160){ctx.fillStyle='#365168';ctx.fillRect(r.x+18,y,r.w-36,8);ctx.fillStyle='#92a9ab';ctx.fillRect(r.x+20,y,4,5);ctx.fillRect(r.x+r.w-24,y,4,5)}
        ctx.strokeStyle='#9f8d6555';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(r.x+42,r.y);ctx.lineTo(r.x+42,r.y+r.h);ctx.stroke();}
      const light=ctx.createRadialGradient(r.x+r.w*.43,r.y+r.h*.33,15,r.x+r.w*.43,r.y+r.h*.33,r.w*.65);light.addColorStop(0,r.theme==='lab_depth'?'#9cffe018':'#ffc57622');light.addColorStop(1,'#00102400');ctx.fillStyle=light;ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.fillStyle='#06111d35';ctx.fillRect(r.x,r.y,18,r.h);ctx.fillRect(r.x+r.w-18,r.y,18,r.h);
      if(!r.shaft){for(let i=0;i<13;i++){const x=r.x+((i*173.7+T*(4+i%3))%r.w),y=r.y+((i*91.1+Math.sin(T*.4+i)*28+r.h)%r.h);ctx.fillStyle=i%3?'#ffe4ae32':'#97dcef35';ctx.fillRect(x,y,1.4,1.4)}}
      ctx.restore();this.polygon(ctx,r);ctx.strokeStyle='#475261';ctx.lineWidth=5;ctx.stroke();
    }
    ctx.restore();
    const shade=ctx.createRadialGradient(W/2,H*.51,H*.25,W/2,H*.51,W*.72);shade.addColorStop(0,'#01091600');shade.addColorStop(1,'#010713a0');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
  }
  drawSolid(ctx,s){
    if(s.furniture)return true;
    if(s.worldStep||s.worldBridge){ctx.fillStyle=s.worldBridge?'#376071':'#4d4b45';ctx.fillRect(s.x,s.y,s.w,s.h);ctx.fillStyle='#111d29';ctx.fillRect(s.x,s.y+s.h-4,s.w,4);
      ctx.strokeStyle='#8e9eac88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x+9,s.y);ctx.lineTo(s.x+9,s.y-76);ctx.moveTo(s.x+s.w-9,s.y);ctx.lineTo(s.x+s.w-9,s.y-76);ctx.stroke();return true;}
    if(s.door||s.crack||s.elev||s.oneway)return false;
    ctx.fillStyle='#111b29';ctx.fillRect(s.x,s.y,s.w,s.h);ctx.fillStyle='#59616b';ctx.fillRect(s.x,s.y,s.w,10);ctx.fillStyle='#283b49';ctx.fillRect(s.x,s.y+12,s.w,20);
    for(let x=Math.max(s.x,Math.floor(cam.x/90)*90);x<Math.min(s.x+s.w,cam.x+W);x+=90){ctx.fillStyle='#516775';ctx.fillRect(x+10,s.y+18,4,4);ctx.fillRect(x+70,s.y+18,4,4)}return true;
  }
  drawProp(ctx,type,x,surface,w,h){const im=this.images[type];if(!im)return;ctx.save();ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x+w/2,type==='hanging_platform'?surface+9:surface+h*.91,w*.44,8,0,0,Math.PI*2);ctx.fill();
    const top=type==='hanging_platform'?surface-h*.84:surface-h*.065;ctx.drawImage(im,x,top,w,h);ctx.restore();}
  drawFurniture(ctx){
    for(const f of this.furniture){if(f.x>cam.x+W+80||f.x+f.w<cam.x-80||f.y>cam.y+H+100||f.y+f.h<cam.y-100)continue;this.drawProp(ctx,f.type,f.x,f.y,f.w,f.h);}
    for(const h of this.hazards){if(h.x<cam.x-80||h.x>cam.x+W+80||h.y<cam.y-160||h.y>cam.y+H+100)continue;
      if(h.kind==='lamp'){const x=h.x+Math.sin(G.t*1.4)*64,y=h.y+Math.cos(G.t*1.4)*14+95;ctx.strokeStyle='#9d8c69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(h.x,h.y-35);ctx.lineTo(x,y-25);ctx.stroke();this.drawProp(ctx,'lamp',x-36,y-25,72,70);continue}
      if(h.kind==='steam'){this.drawProp(ctx,'pipe',h.x-35,h.y-98,70,105);if(h.phase==='warn'||h.phase==='active'){ctx.save();ctx.globalAlpha=h.phase==='warn'?.18+.12*Math.sin(G.t*30):.5;const v=ctx.createLinearGradient(0,h.y-180,0,h.y);v.addColorStop(0,'#c8ffee00');v.addColorStop(1,'#c8ffeded');ctx.fillStyle=v;ctx.fillRect(h.x-27,h.y-180,54,180);ctx.restore()}continue}
      if(h.hp<=0){ctx.fillStyle='#c8b193';ctx.fillRect(h.x-17,h.y-5,13,5);ctx.fillRect(h.x+6,h.y-8,10,7);continue}
      this.drawProp(ctx,'tea',h.x-28,h.y-47,56,52);
      ctx.save();ctx.strokeStyle=h.phase==='warn'?'#ffd383':'#ffe8c366';ctx.lineWidth=h.phase==='warn'?3:1.6;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(h.x-9+i*9,h.y-45);ctx.bezierCurveTo(h.x-20+i*9,h.y-62,h.x+10+i*9,h.y-65,h.x-5+i*9,h.y-83-5*Math.sin(G.t*3+i));ctx.stroke()}
      if(h.phase==='warn'){ctx.fillStyle='#ffc75c';ctx.font='bold 19px sans-serif';ctx.textAlign='center';ctx.fillText('!',h.x,h.y-96);ctx.setLineDash([5,6]);ctx.strokeStyle='#ffb66ca0';ctx.beginPath();ctx.moveTo(h.x,h.y-40);ctx.quadraticCurveTo((h.x+h.aim)/2,h.y-155,h.aim,h.y+105);ctx.stroke()}
      ctx.restore();
    }
    for(const p of this.puddles){ctx.save();ctx.globalAlpha=Math.min(.6,p.life);ctx.fillStyle='#edb36c';ctx.beginPath();ctx.ellipse(p.x,p.y,p.w/2,5,0,0,Math.PI*2);ctx.fill();ctx.restore()}
    if(this.lever){ctx.save();ctx.translate(this.lever.x,this.lever.y-22);ctx.fillStyle='#293847';ctx.fillRect(-18,-18,36,40);ctx.strokeStyle=this.lever.on?'#7be7b9':'#ffcf76';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(this.lever.on?12:-12,-18);ctx.stroke();ctx.restore();if(!this.lever.on&&Math.abs(P.x-this.lever.x)<110)txt('E 展开回桥',this.lever.x,this.lever.y-72,14,'#ffe2a1',INK,3)}
    for(const c of this.caches)ART.draw(ctx,c.opened?'chest_open':'chest_idle',c.x,c.y,58,{time:c.opened?G.t-c.openAt:G.t});
  }
  drawEffects(ctx){
    for(const e of this.effects){const t=1-e.life/e.max,a=Math.min(1,(1-t)*2),[color,bright]=this.palette[e.actor],r=(24+t*72)*e.scale;
      ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face,1);ctx.globalAlpha=a;
      const glow=ctx.createRadialGradient(0,0,0,0,0,r*1.6);glow.addColorStop(0,color+'50');glow.addColorStop(1,color+'00');ctx.globalCompositeOperation='lighter';ctx.fillStyle=glow;ctx.fillRect(-r*1.6,-r*1.6,r*3.2,r*3.2);
      ctx.restore();ART.draw(ctx,'operator_'+e.actor+'_impact',e.x,e.y+e.scale*60,e.scale*145,{time:t*.333,face:e.face,alpha:a});
      ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face,1);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=bright;ctx.fillStyle=color;ctx.lineCap='round';
      const count=e.actor==='huanghuang'?20:e.actor==='ww'?14:8;
      for(let i=0;i<count;i++){const angle=e.seed+i*2.399,travel=(12+t*(e.heavy?130:80))*e.scale,x=Math.cos(angle)*travel,y=Math.sin(angle)*travel*.62+t*t*28;
        if(['mimi','niannian','keke','kaikai'].includes(e.actor)){ctx.save();ctx.translate(x,y);ctx.rotate(angle+t*3);ctx.fillRect(-3,-1.5,6+3*(1-t),3);ctx.restore()}
        else if(e.actor==='shushu'){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.ellipse(0,0,5,1.6,0,0,Math.PI*2);ctx.fill();ctx.restore()}
        else{ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(angle)*(5+9*(1-t)),y-Math.sin(angle)*6);ctx.stroke()}}
      if(e.actor==='mimi'||e.actor==='niannian'){ctx.strokeStyle=color;ctx.lineWidth=2*(1-t)+.3;ctx.beginPath();for(let i=0;i<=6;i++){const ang=i/6*Math.PI*2;const x=Math.cos(ang)*r,y=Math.sin(ang)*r*.4;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
      if(e.actor==='keke'){ctx.strokeStyle=color;ctx.lineWidth=2;for(let j=0;j<3;j++){ctx.beginPath();for(let i=0;i<5;i++){const x=i*19-r*.5,y=(i%2?9:-9)*(1-t)+j*10-10;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}}
      if(e.actor==='kaikai'){ctx.lineWidth=3*(1-t)+.5;for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(-r*.7+j*9,r*.45);ctx.quadraticCurveTo(j*9,-r*.2,r*.8+j*9,-r*.7);ctx.stroke()}}
      if(e.actor==='du'){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<20;i++){const x=(i/19-.5)*r*2,y=Math.sin(i*.36+t*8)*r*.3;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
      ctx.restore();
    }
  }
  drawTitle(ctx){
    const im=this.images.dorm_depth;if(!im)return false;
    const scale=Math.max(W/im.width,H/im.height);ctx.drawImage(im,(W-im.width*scale)/2,(H-im.height*scale)/2,im.width*scale,im.height*scale);
    const shade=ctx.createLinearGradient(0,0,W,0);shade.addColorStop(0,'#07111c28');shade.addColorStop(.46,'#07111c70');shade.addColorStop(1,'#07111cee');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    ART.draw(ctx,'mimi_idle',300,640,220,{time:T});
    ctx.save();ctx.textAlign='left';ctx.fillStyle='#7ae3ed';ctx.font='bold 14px "Microsoft YaHei",sans-serif';ctx.fillText('云 鲸 号  /  夜 航 偷 吃 计 划',620,170);
    ctx.font=F(60);ctx.fillStyle='#fff0ca';ctx.fillText('炸弹哈基迷',615,250);ctx.font=F(22);ctx.fillStyle='#ebd3b1';ctx.fillText('家具之上，还有另一条路。',620,299);
    ctx.font='16px "Microsoft YaHei",sans-serif';ctx.fillStyle='#b1c1ce';ctx.fillText('翻过书桌，穿行竖井，找出藏书夹层的捷径。',620,352);ctx.fillText('避开安保探照灯，带上伙伴穿过守关者的房间。',620,384);
    rr(620,434,390,60,12,'#e2b575','#f7d79b',2);ctx.font=F(23);ctx.fillStyle='#172332';ctx.fillText('开始夜航   J / Enter / 点击',642,472);
    ctx.font='14px "Microsoft YaHei",sans-serif';ctx.fillStyle='#c0ceda';ctx.fillText('A/D 移动  ·  空格跳跃  ·  J 攻击  ·  K 闪避',620,537);ctx.fillText('E 交互  ·  M 探索地图  ·  数字键切换干员',620,566);ctx.fillText('迷迭香：空中 J 下砸 · 其他干员：空中 S+J',620,595);ctx.restore();return true;
  }
  drawMap(ctx,full=false){
    const bx=full?125:W-205,by=full?86:18,bw=full?1030:188,bh=full?560:145;
    ctx.save();if(full){ctx.fillStyle='#050b13e8';ctx.fillRect(0,0,W,H)}
    rr(bx-10,by-10,bw+20,bh+20,12,'#0b1423ed','#51637b',full?2:1.3);
    const scale=Math.min((bw-24)/3600,(bh-35)/2200),ox=bx+12,oy=by+30;
    const mx=x=>ox+x*scale,my=y=>oy+(y-660)*scale;
    for(const [a,b] of this.connections){
      const ra=this.sectors.find(r=>r.id===a),rb=this.sectors.find(r=>r.id===b);
      const ix=Math.max(ra.x,rb.x),ex=Math.min(ra.x+ra.w,rb.x+rb.w),iy=Math.max(ra.y,rb.y),ey=Math.min(ra.y+ra.h,rb.y+rb.h);
      ctx.strokeStyle=this.seen.has(a)&&this.seen.has(b)?'#91c8c8':'#304b62';ctx.lineWidth=full?3:1;
      if(ex>=ix&&ey>=iy){const x=(ix+ex)/2,y=(iy+ey)/2;ctx.fillStyle='#81bab977';ctx.fillRect(mx(x)-2,my(y)-2,4,4);continue;}
      const left=ra.x<rb.x?ra:rb,right=left===ra?rb:ra;
      const y=Math.min(left.y+left.h,right.y+right.h)-55;
      ctx.beginPath();ctx.moveTo(mx(left.x+left.w),my(y));ctx.lineTo(mx(right.x),my(y));ctx.stroke();
    }
    for(const r of this.sectors){ctx.save();ctx.translate(mx(r.x),my(r.y));ctx.scale(scale,scale);const local={...r,x:0,y:0};this.polygon(ctx,local);ctx.fillStyle=r.id===this.room?.id?r.color+'c0':this.seen.has(r.id)?r.color+'55':'#172a3c';ctx.fill();ctx.strokeStyle=this.seen.has(r.id)?r.color:'#395064';ctx.lineWidth=(full?2:1)/scale;ctx.stroke();if(full&&this.seen.has(r.id)){ctx.save();this.polygon(ctx,local);ctx.clip();ctx.strokeStyle='#bdd9d14d';ctx.lineWidth=1.1/scale;for(const s of solids){if(s.off||s.y<r.y||s.y>r.y+r.h||s.x+s.w<r.x||s.x>r.x+r.w)continue;ctx.beginPath();ctx.moveTo(s.x-r.x,s.y-r.y);ctx.lineTo(s.x+s.w-r.x,s.y-r.y);ctx.stroke()}ctx.restore()}ctx.restore();if(full&&!r.shaft){ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillStyle=this.seen.has(r.id)?'#e7edf6':'#68839a';ctx.textAlign='center';ctx.fillText(r.name,mx(r.x+r.w/2),my(r.y+r.h/2)+4)}}
    const x=mx(P.x+17),y=my(P.y+P.h);ctx.fillStyle='#fff5ba';ctx.beginPath();ctx.arc(x,y,full?5:3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff7';ctx.beginPath();ctx.arc(x,y,(full?10:5)+Math.sin(T*5)*1.5,0,Math.PI*2);ctx.stroke();
    ctx.textAlign='left';ctx.font='bold '+(full?20:12)+'px "Microsoft YaHei",sans-serif';ctx.fillStyle='#e9f2fb';ctx.fillText(full?'云鲸号 · 探索地图':this.room?.name||'云鲸号',bx+6,by+8);
    if(full){ctx.font='13px "Microsoft YaHei",sans-serif';ctx.fillStyle='#9cb5ca';ctx.fillText('暖色：休憩与茶厅  ·  青绿：生态实验区  ·  紫蓝：藏书夹层  ·  细长区域：竖井',bx+8,by+bh-6);ctx.textAlign='right';ctx.fillStyle='#ffe1a3';ctx.fillText('已发现 '+this.seen.size+' / '+this.sectors.length+' 区域  ·  M 返回',bx+bw-6,by+8)}
    ctx.restore();
  }
}
window.HajimiWorld=HajimiWorld;
