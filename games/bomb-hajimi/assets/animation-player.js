/* Game and gallery share this frame player. Textures use straight-alpha RGBA. */
class HajimiAnimation {
  constructor(base='assets/', data=window.HAJIMI_ANIMATIONS) {
    this.base=base;this.data=data;this.images=new Map();this.pending=new Map();this.lastDraw=null;
  }
  clip(id){return this.data?.clips[id]||null;}
  load(id){
    const clip=this.clip(id);if(!clip)return Promise.resolve(null);
    if(this.images.has(id))return Promise.resolve(this.images.get(id));
    if(this.pending.has(id))return this.pending.get(id);
    const promise=new Promise(resolve=>{const im=new Image();
      im.onload=()=>{this.images.set(id,im);resolve(im);};
      im.onerror=()=>resolve(null);im.src=this.base+clip.texture+'?v='+this.data.version;
    });this.pending.set(id,promise);return promise;
  }
  preload(ids){return Promise.all((ids||Object.keys(this.data.clips)).map(id=>this.load(id)));}
  frame(id,time=0,options={}){
    const c=this.clip(id);if(!c)return -1;
    const loop=options.loop??c.loop;const n=Math.floor(Math.max(0,time)*c.fps);
    return options.frame!==undefined?Math.max(0,Math.min(c.frameCount-1,options.frame)):
      loop?n%c.frameCount:Math.min(c.frameCount-1,n);
  }
  events(id,from,to){
    const c=this.clip(id);if(!c||to<from)return[];
    return c.events.filter(e=>e.frame/c.fps>from&&e.frame/c.fps<=to);
  }
  draw(ctx,id,x,y,height=92,options={}){
    const c=this.clip(id);if(!c)return false;
    const im=this.images.get(id);if(!im){this.load(id);return false;}
    const index=this.frame(id,options.time??0,options),scale=height/c.nominalHeight;
    const sx=(index%c.columns)*c.frameWidth,sy=Math.floor(index/c.columns)*c.frameHeight;
    ctx.save();ctx.translate(x,y);ctx.scale((options.face||1)*scale,scale);
    if(options.alpha!==undefined)ctx.globalAlpha*=options.alpha;
    ctx.drawImage(im,sx,sy,c.frameWidth,c.frameHeight,-c.anchor[0],-c.anchor[1],c.frameWidth,c.frameHeight);
    ctx.restore();this.lastDraw={id,frame:index};return true;
  }
  drawActor(ctx,actor,action,x,y,height,options={}){
    const group=this.data.groups.find(g=>g.id===actor);if(!group)return false;
    const id=group.clips[action]||group.clips.idle||Object.values(group.clips)[0];
    return this.draw(ctx,id,x,y,height,options);
  }
}
window.HajimiAnimation=HajimiAnimation;
