/* Pure action rules and collision math. No rendering, game loop, audio or DOM. */
(function(root){
  'use strict';
  const profiles=Object.freeze({
    mimi:Object.freeze({type:'plunge',name:'巨盾下砸',radius:115,damage:26,speed:1500,stun:0}),
    bobo:Object.freeze({type:'bomb',name:'向下投弹'}),
    aken:Object.freeze({type:'melee',name:'空中下斩'}),
    lala:Object.freeze({type:'flame',name:'喷火缓降'}),
    tiefu:Object.freeze({type:'plunge',name:'坠刃重斩',radius:95,damage:32,speed:1250,stun:.8})
  });
  const fallback=Object.freeze({type:'melee',name:'空中下斩'});
  const profile=id=>profiles[id]||fallback;
  const attackMode=(id,dir,onGround)=>dir==='down'&&!onGround?profile(id).type:'normal';
  const intermediate=s=>!!(s.oneway||s.furniture||s.worldStep||s.worldBridge);
  const canImpact=b=>!!(b.onGround&&b.groundSurface&&!b.groundSurface.off&&!intermediate(b.groundSurface));
  function bombThrow(dir,face,vx){
    if(dir==='down')return {vx:vx*.35,vy:220,fromFeet:true};
    if(dir==='up')return {vx:face*110,vy:-820,fromFeet:false};
    return {vx:face*430+vx*.3,vy:-430,fromFeet:false};
  }
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function moveBody(b,dt,solids,plunging=false){
    // The attack mode is checked here, rather than relying on a drop flag set
    // before input. This also works on the exact frame the attack starts.
    const ignored=s=>s.off||(plunging&&intermediate(s));
    b.hitWall=false;b.x+=b.vx*dt;
    for(const s of solids){if(ignored(s)||s.oneway||!overlap(b,s))continue;
      if(b.vx>0)b.x=s.x-b.w;else if(b.vx<0)b.x=s.x+s.w;else continue;
      b.hitWall=true;b.vx=0;}
    const feet=b.y+b.h;b.y+=b.vy*dt;b.onGround=false;b.groundSurface=null;
    for(const s of solids){if(ignored(s)||!overlap(b,s))continue;
      if(s.oneway){if(b.vy>=0&&feet<=s.y+.5&&!b.drop){b.y=s.y-b.h;b.vy=0;b.onGround=true;b.groundSurface=s;}continue;}
      if(b.vy>0){b.y=s.y-b.h;b.onGround=true;b.groundSurface=s;b.vy=0;}
      else if(b.vy<0){b.y=s.y+s.h;b.vy=0;}}
  }
  const api=Object.freeze({profiles,profile,attackMode,intermediate,canImpact,bombThrow,moveBody});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.HajimiAirCombat=api;
})(globalThis);
