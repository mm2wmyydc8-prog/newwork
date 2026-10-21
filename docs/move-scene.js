// Original procedural effects, drawn locally without game footage or external assets.
import { classifyMove } from './move-effects.js?v=move-motions';
const TAU = Math.PI * 2;
const clamp = n => Math.max(0, Math.min(1, n));
export function createMoveScene(canvas, { reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const c = canvas.getContext('2d');
  let frame = 0, generation = 0;
  const W = 700, H = 380, sx = 200, sy = 185, tx = 535, ty = 185;
  canvas.width = W; canvas.height = H;
  function disc(x,y,r,color,alpha=1) { c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.fill();c.globalAlpha=1; }
  function line(points,color,width=3,alpha=1) {c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.globalAlpha=1;}
  function ring(x,y,r,color,alpha=1,width=3){c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,r,r*.65,0,0,TAU);c.stroke();c.globalAlpha=1;}
  function shard(x,y,size,color,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(0,-size);c.lineTo(size*.48,0);c.lineTo(0,size);c.lineTo(-size*.48,0);c.closePath();c.fill();c.restore();}
  function render(move, seconds, quiet) {
    const {motion,color}=classifyMove(move), t=seconds, launch=clamp((t-.65)/.85), hit=clamp((t-1.5)/1.15);
    c.clearRect(0,0,W,H);
    // Arena marks and a neutral energy target make the point of impact visible.
    ring(sx,310,100,'#a6b9e0',.22,2);ring(tx,310,78,'#a6b9e0',.22,2);
    for(let i=0;i<12;i++)disc((i*79)%W,38+(i*43)%270,1,'#c1d4ff',.28);
    const shake=!quiet && t>1.5 && t<1.85 ? Math.sin(t*95)*7*(1-hit):0;
    c.save();c.translate(shake,0);
    const supportive=['shield','heal','transform','status'].includes(motion);
    const targetAlpha=t>1.5? .5+Math.sin(t*22)*.2:.5;
    if (!supportive) {shard(tx,ty,37,'#96aec5',0);shard(tx-8,ty-8,21,'#cce4ef',0);ring(tx,ty,52,color,targetAlpha,2);}
    // Gathering motes converge toward the partner before the release.
    if(t<.8)for(let i=0;i<20;i++) {const a=i*2.4+t*2,r=(1-clamp(t/.8))*90+12;disc(sx+Math.cos(a)*r,sy+Math.sin(a)*r,2+i%3,color,.75);}
    if(t>.4&&t<1.2)ring(sx,sy,18+Math.sin(t*5)*6,color,.8,4);
    const active=t>=.65&&t<=2.6;
    if(active){
      if(motion==='flame') {
        // A connected hot core with many curling tongues, rather than a triangle.
        for(let i=0;i<36;i++){const p=((i/36+t*1.5)%1)*launch,x=sx+(tx-sx)*p,y=sy+Math.sin(i*2.4+t*18)*(5+p*21);const r=5+p*15;
          c.save();c.translate(x,y);c.rotate(Math.sin(i+t*8)*.35);
          for(const [scale,fill] of [[1.25,'#d93627'],[1,'#ff8c21'],[.55,'#fff3a1']]){c.save();c.scale(scale,scale);c.fillStyle=fill;c.beginPath();c.moveTo(-r,0);c.bezierCurveTo(-r,-r,r*.3,-r*1.4,r*2.7,-r*.6);c.quadraticCurveTo(r*.9,-r*.1,r*2,0);c.quadraticCurveTo(r*.3,r*1.3,-r,0);c.fill();c.restore();}c.restore();}
        for(let i=0;i<12;i++)disc(sx+(tx-sx)*launch+(i*17)%40,sy+Math.sin(i*7+t*8)*38,1+i%2,'#ffd775',.8);
        if(move.id==='fire-blast'&&t>1.45){const r=68;for(let a=0;a<5;a++){const angle=-Math.PI/2+a*TAU/5;line([[tx,ty],[tx+Math.cos(angle)*r,ty+Math.sin(angle)*r]],'#ff722d',16);line([[tx,ty],[tx+Math.cos(angle)*r,ty+Math.sin(angle)*r]],'#fff1a0',5);}}
      } else if(motion==='bolt') {
        for(let b=0;b<4;b++){const points=[[sx,sy]];for(let i=1;i<=11;i++)points.push([sx+(tx-sx)*launch*i/11,sy+Math.sin(i*17+b*9+Math.floor(t*18))* (12+b*9)]);
          line(points,'#e7a320',11,.45);line(points,'#ffe44f',5);line(points,'#fffbd0',2);}
        for(let i=0;i<6;i++){const a=i*TAU/6+t;line([[tx,ty],[tx+Math.cos(a)*48,ty+Math.sin(a)*48],[tx+Math.cos(a+.2)*75,ty+Math.sin(a+.2)*75]],'#ffe96b',3,launch);}
      } else if(motion==='fang') {
        const spread=13+Math.abs(Math.sin((t-.65)*8))*55;
        line([[tx-82,ty-spread-12],[tx-48,ty-spread-22],[tx+48,ty-spread-22],[tx+82,ty-spread-12]],color,8,.85);
        line([[tx-82,ty+spread+12],[tx-48,ty+spread+22],[tx+48,ty+spread+22],[tx+82,ty+spread+12]],color,8,.85);
        for(let row=0;row<2;row++)for(let i=0;i<4;i++){const x=tx-63+i*40,y=ty+(row?spread:-spread);c.save();c.translate(x,y);if(row)c.rotate(Math.PI);c.fillStyle='#573a72';c.beginPath();c.moveTo(-18,-16);c.quadraticCurveTo(0,18,5,42);c.quadraticCurveTo(22,0,18,-16);c.fill();c.fillStyle='#fff5e3';c.beginPath();c.moveTo(-13,-14);c.quadraticCurveTo(-4,15,5,32);c.quadraticCurveTo(17,-1,13,-14);c.fill();disc(5,27,6,color,.9);c.restore();}
        for(let i=0;i<16;i++){const a=i*2.4;disc(tx+Math.cos(a)*hit*95,ty+Math.sin(a)*hit*65+hit*35,3+i%4,color,1-hit);}
      } else if(motion==='psychic') {
        for(let i=0;i<5;i++){const p=(t*.7+i/5)%1;ring(tx,ty,18+p*100,color,1-p,3);}
        for(let i=0;i<7;i++){const a=i*TAU/7+t*.8;shard(tx+Math.cos(a)*83,ty+Math.sin(a)*54,9,color,a);}
        const points=[];for(let i=0;i<45;i++)points.push([sx+(tx-sx)*i/44,sy+Math.sin(i*.5-t*12)*14]);line(points,color,5,.7);
        disc(tx,ty,24,'#eed6ff',.25+Math.sin(t*14)*.1);
      } else if(motion==='liquid'||motion==='beam') {
        for(let i=0;i<4;i++){const points=[];for(let j=0;j<28;j++)points.push([sx+(tx-sx)*launch*j/27,sy+Math.sin(j*.55-t*17+i)*8+i*4]);line(points,color,10,.7);line(points,'#effbff',2,.75);}
        for(let i=0;i<23;i++){const a=i*2.4;disc(tx+Math.cos(a)*hit*100,ty+Math.sin(a)*hit*80,3+i%5,color,launch*(1-hit));}
      } else if(motion==='ball') {
        const x=sx+(tx-sx)*launch;disc(x,sy,28,color,.25);disc(x,sy,21,color);disc(x-6,sy-7,10,'#fff4ff',.85);
        for(let i=0;i<15;i++)disc(x-i*5,sy+Math.sin(i+t*14)*9,5-i*.2,color,.6);
      } else if(motion==='slash'||motion==='needle'||motion==='wind') {
        for(let i=0;i<5;i++){const p=(t*1.5+i*.15)%1,x=sx+(tx-sx)*p;
          if(motion==='slash'){line([[tx-50+i*22,ty-70],[tx-20+i*22,ty],[tx+20+i*22,ty+65]],color,7,1-p);line([[tx-48+i*22,ty-70],[tx-18+i*22,ty],[tx+22+i*22,ty+65]],'#fff',2,1-p);}
          else if(motion==='needle')shard(x,sy+(i-2)*17,24,color,Math.PI/2);
          else {const points=[];for(let j=0;j<28;j++)points.push([x+Math.cos(j*.16)*45,sy+Math.sin(j*.16)*23+(i-2)*15]);line(points,color,4,.75);}}
      } else if(['leaf','ice','rock'].includes(motion)) {
        for(let i=0;i<14;i++){const p=(t*.8+i/14)%1,x=sx+(tx-sx)*p,y=sy+Math.sin(i*3+p*5)*43;
          if(motion==='leaf'){c.save();c.translate(x,y);c.rotate(t*5+i);c.fillStyle=color;c.beginPath();c.ellipse(0,0,16,6,0,0,TAU);c.fill();line([[-14,0],[14,0]],'#e5f8ad',1);c.restore();}
          else shard(x,y,motion==='ice'?18:11+(i%3)*5,color,t*2+i);}
      } else if(['shield','heal','transform','status'].includes(motion)) {
        const x=sx+10;for(let i=0;i<4;i++)ring(x,sy,35+i*16+Math.sin(t*4)*5,color,.7-i*.12,3);
        for(let i=0;i<18;i++){const a=i*2.4+t;shard(x+Math.cos(a)*65,sy+70-((t*60+i*13)%150),6,color,a);}
      } else {
        const x=sx+(tx-sx)*launch;for(let i=0;i<7;i++)line([[x-70,sy+(i-3)*9],[x-20,sy+(i-3)*7]],color,3,.8);
        if(t>1.35){c.save();c.translate(tx,ty);c.rotate(motion==='kick'?-.6:.2);c.fillStyle=color;c.strokeStyle='#fff3d7';c.lineWidth=3;c.beginPath();c.roundRect(-32,-24,motion==='kick'?82:58,48,12);c.fill();c.stroke();for(let i=0;i<3;i++)line([[-22+i*13,-19],[-22+i*13,-2]],'#fff3d7',2);c.restore();}
      }
    }
    // Shared impact: expanding ring, sharp starburst and outward debris.
    if(hit>0&&hit<1&&!['shield','heal','transform','status'].includes(motion)){
      ring(tx,ty,15+hit*105,color,1-hit,6*(1-hit)+1);
      for(let i=0;i<18;i++){const a=i*2.399,r=18+hit*(65+i%4*14);line([[tx+Math.cos(a)*r*.7,ty+Math.sin(a)*r*.7],[tx+Math.cos(a)*r,ty+Math.sin(a)*r]],i%3?'#fff4ce':color,3,1-hit);}
    }
    c.restore();
  }
  function stop(){generation++;cancelAnimationFrame(frame);c.clearRect(0,0,W,H);}
  function play(move){stop();const token=generation,quiet=reduced();if(quiet){render(move,1.65,true);return;}const start=performance.now();function tick(now){if(token!==generation)return;const t=(now-start)/1000;render(move,t,false);if(t<3.15)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);}
  return {play,stop};
}
