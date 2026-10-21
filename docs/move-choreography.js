// Named move choreography. All drawings are local; no external game recordings.
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const TAU=Math.PI*2;
export const SPECIAL_MOVES = new Set(`water-gun hydro-pump surf string-shot electroweb vine-whip sleep-powder poison-powder stun-spore spore ember solar-beam fire-blast fly body-slam quick-attack extreme-speed drill-peck poison-sting pin-missile twineedle poison-jab horn-attack double-horn fury-attack peck acid iron-tail thunder-shock thunderbolt million-volt thunder earthquake earth-power dig sand-attack sand-tomb spikes venoshock draining-kiss drain-punch leech-life absorb mega-drain giga-drain dream-eater fairy-wind gust air-cutter razor-wind play-rough headbutt sing double-slap fury-swipes mud-slap mud-shot pay-day hyper-beam low-kick low-sweep karate-chop submission teleport psychic psystrike barrier hypnosis psybeam brick-break seismic-toss ice-beam blizzard sludge smog lick rock-slide rock-throw self-destruct explosion egg-bomb bone-club bone-rush bonemerang double-kick dynamic-punch mega-punch mega-kick fire-punch gunk-shot dragon-rage outrage dragon-breath twister rest sleep-talk destiny-bond transform fury-cutter wing-attack`.split(/\s+/));
export function choreographMove(id,t,quiet=false) {
 const hit=clamp((t-1.3)/.75),go=ease((t-.55)/.65),back=ease((t-1.65)/.7);
 const a={x:0,y:0,rotation:0,scaleX:1,scaleY:1,opacity:1,targetX:0,targetY:0,targetRotation:0,targetScaleY:1,targetOpacity:1};
 if(quiet)return a;
 const forward=go*(1-back);
 if(id==='surf'){a.x=290*forward;a.y=-40*Math.sin(go*Math.PI/2)*(1-back);}
 if(id==='fly'){a.y=t<1.1?-390*ease((t-.45)/.5):t<1.65?-390*(1-ease((t-1.1)/.35)):0;a.x=t<1.65?295*ease((t-.95)/.2):295*(1-back);}
 if(id==='body-slam'){a.x=292*forward;a.y=-150*Math.sin(go*Math.PI)*(1-back)-47*go*(1-back);a.targetScaleY=1-.5*Math.sin(hit*Math.PI);a.targetY=78*(1-a.targetScaleY);}
 if(['quick-attack','extreme-speed','headbutt','outrage','play-rough','seismic-toss','submission'].includes(id))a.x=285*forward;
 if(id==='headbutt'){a.rotation=24*forward;a.targetRotation=hit>0?Math.sin(hit*Math.PI)*12:0;}
 if(id==='quick-attack'||id==='extreme-speed')a.opacity=t>.65&&t<1.04?.5:1;
 if(id==='play-rough'){a.x+=t>.9&&t<1.7?Math.sin(t*24)*37:0;a.targetX=t>1&&t<1.7?Math.sin(t*24)*5:0;}
 if(id==='outrage')a.rotation=Math.sin(t*28)*12*forward;
 if(id==='submission'&&t>.85&&t<1.75){const p=clamp((t-.85)/.9);a.rotation=p*1080;a.targetRotation=p*1080;a.y=-60*Math.sin(p*Math.PI);a.targetY=a.y;}
 if(id==='seismic-toss'&&t>.8&&t<1.8){const p=clamp((t-.8));a.y=-100*Math.sin(p*Math.PI);a.targetY=-200*Math.sin(p*Math.PI);a.targetRotation=p*720;}
 if(id==='dig'){a.y=t<1.05?190*ease((t-.4)/.35):t<1.5?190*(1-ease((t-1.08)/.32)):190*back;a.opacity=t>.78&&t<1.08?0:1;a.x=300*ease((t-.95)/.15)*(1-back);}
 if(['mega-punch','mega-kick','dynamic-punch'].includes(id)&&t>1.3)a.targetX=Math.sin(hit*Math.PI)*23;
 if(['low-kick','low-sweep'].includes(id)&&t>1.3)a.targetRotation=Math.sin(hit*Math.PI)*-24;
 if(id==='teleport'){const p=ease((t-.45)/.6);a.scaleX=Math.max(.025,1-p);a.scaleY=1+p*.2;a.y=-420*ease((t-.95)/.55);a.opacity=1-ease((t-1.3)/.25);}
 if(id==='earthquake'){a.targetX=t>.6&&t<2.2?Math.sin(t*66)*9:0;a.x=t>.6&&t<2.2?Math.sin(t*66)*3:0;}
 if(['psychic','psystrike'].includes(id)){a.targetY=-38*Math.sin(go*Math.PI/2)*(1-back);if(hit>0)a.targetX=Math.sin(t*70)*(id==='psystrike'?10:5)*(1-hit);}
 if(['self-destruct','explosion'].includes(id)&&t>1.35){a.opacity=1-ease((t-1.35)/.25);a.targetOpacity=a.opacity;}
 if(id==='destiny-bond'&&t>1.4){a.opacity=.3;a.targetOpacity=.3;}
 return a;
}
export function drawSpecialMove(env) {
 const {c,move,t,quiet,sx,sy,tx,ty,disc,stroke,ellipse,glow,star,flame,debris,sludge,fist,substitute}=env;
 const id=move.id;if(!SPECIAL_MOVES.has(id))return false;
 const p=ease((t-.55)/.75),hit=clamp((t-1.3)/.8),fade=1-clamp((t-2.15)/.4),active=t>.45&&t<2.55;
 if(!active)return true;
 c.save();c.globalAlpha=fade;
 const text=(value,x,y,color='#fff',size=25)=>{c.save();c.fillStyle=color;c.font=`bold ${size}px sans-serif`;c.textAlign='center';c.fillText(value,x,y);c.restore();};
 const heart=(x,y,r,color='#ff99bc')=>{c.save();c.translate(x,y);c.scale(r/20,r/20);c.fillStyle=color;c.beginPath();c.moveTo(0,16);c.bezierCurveTo(-35,-8,-10,-30,0,-13);c.bezierCurveTo(10,-30,35,-8,0,16);c.fill();c.restore();};
 const burst=(color='#fff6da',size=65)=>{if(hit>0){star(tx,ty,size*(1-hit),color,1-hit,.3);debris(tx,ty,hit,color);}};
 const bone=(x,y,angle)=>{c.save();c.translate(x,y);c.rotate(angle);stroke([[-23,0],[23,0]],'#eee4bf',14);for(const side of [-1,1]){disc(side*25,-5,8,'#fff6d9');disc(side*25,5,8,'#fff6d9');}c.restore();};
 const rock=(x,y,r)=>{c.fillStyle='#9f8870';c.strokeStyle='#d8c4a1';c.lineWidth=2;c.beginPath();for(let i=0;i<7;i++){const a=i*TAU/7,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.85;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();c.stroke();stroke([[x-r*.5,y-r*.4],[x+r*.1,y-r*.6],[x+r*.5,y]],'#c9b08b',2);};
 const wind=(pink=false)=>{for(let i=0;i<12;i++){const q=(t*1.6+i/12)%1,x=sx+(tx-sx)*q,y=sy+(i%5-2)*15;stroke([[x-75,y+5],[x-30,y],[x+20,y+Math.sin(t*8+i)*6]],pink?'#ffc2ef':'#c9efff',i%3?3:7,.7);if(pink)star(x,y,4,'#ffe4ff',.7);}};
 if(id==='water-gun'||id==='hydro-pump'||id==='solar-beam'||id==='hyper-beam'||id==='dragon-breath') {
  const big=id==='hydro-pump',white=id==='solar-beam',hyper=id==='hyper-beam',dragon=id==='dragon-breath';
  const width=hyper?54:white?44:big?40:dragon?23:13,color=white?'#fff':hyper?'#ffbf56':dragon?'#73c9ff':'#59c6f4',x=sx+(tx-sx)*p;
  if(dragon){for(let i=0;i<18;i++){const q=(t+i/18)%1;c.save();c.filter='hue-rotate(165deg)';flame(sx+(x-sx)*q,sy+Math.sin(i*7+t*9)*10,12+q*10,.6);c.restore();}}
  else {glow(sx,sy,33,color,.5);stroke([[sx,sy],[x,sy]],color,width+14,.2);stroke([[sx,sy],[x,sy]],color,width);stroke([[sx,sy-2],[x,sy-2]],'#f8ffff',width*.38);}
  if(!white&&!hyper&&!dragon){for(let i=0;i<(big?22:10);i++){const a=i*2.4+t*5,r=(big?23:11)+Math.sin(t*10+i)*4;disc(x+Math.cos(a)*r,sy+Math.sin(a)*r,2+i%4,'#e7fbff',.8);}if(hit>0)debris(tx,ty,hit,'#e4faff',big?36:15);}
  if(hyper&&hit>0){glow(tx,ty,125*(1-hit)+20,'#ffc554',1-hit);star(tx,ty,120*(1-hit),'#fff8cc',1-hit);ellipse(tx,ty,20+hit*130,20+hit*100,'#ff9e39',7,1-hit);}
 } else if(id==='surf') {
  const x=sx+300*p;const gradient=c.createLinearGradient(x,210,x,320);gradient.addColorStop(0,'#bff9ff');gradient.addColorStop(.2,'#4ec8ef');gradient.addColorStop(1,'#2357a5');
  c.fillStyle=gradient;c.beginPath();c.moveTo(x-175,318);c.bezierCurveTo(x-110,293,x-75,255,x-48,223);c.bezierCurveTo(x+18,145,x+103,203,x+65,235);c.bezierCurveTo(x+40,202,x+9,239,x+30,262);c.quadraticCurveTo(x+70,292,x+85,318);c.closePath();c.fill();
  stroke([[x-160,310],[x-92,281],[x-48,225],[x-4,204],[x+43,208],[x+65,232]],'#e0fcff',7);if(hit>0)debris(tx,ty+30,hit,'#d4f9ff',35);
 } else if(id==='string-shot'||id==='electroweb') {
  const x=sx+(tx-sx)*p;for(let i=0;i<3;i++)stroke([[sx,sy],[sx+110,sy+Math.sin(t*10+i)*12],[x,sy+i*3]],id==='electroweb'?'#ffe77a':'#fff7df',2.5);
  if(p>.7)for(let i=0;i<5;i++)ellipse(tx,ty-45+i*20,46+Math.sin(i)*4,12,id==='electroweb'?'#ffe77a':'#fff7df',3,p);
 } else if(id==='vine-whip') {
  for(let side of [-1,1]){c.strokeStyle='#58a855';c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(sx-18,sy+45);c.bezierCurveTo(sx+80,sy+side*115,tx-80,ty-side*100*p,tx,ty+side*25*Math.sin(t*10));c.stroke();}burst('#d9ff9e',40);
 } else if(/powder|spore/.test(id)) {
  const color=id==='poison-powder'?'#bd83d6':id==='stun-spore'?'#f5df65':'#bad8ff';
  for(let i=0;i<38;i++){const q=clamp((t-.5-i*.012)/.7);disc(sx+(tx-sx)*q+Math.sin(i*4)*17,sy+Math.sin(i*8)*41+q*7,2+i%3,color,.75);}
 } else if(id==='ember') {
  for(let i=0;i<10;i++)flame(tx-48+i*11,ty+68-((t*.8+i/10)%1)*70,12+i%3*4,-.6);
 } else if(id==='fire-blast') {
  const x=sx+(tx-sx)*p,scale=.4+p*.6;c.save();c.translate(x,sy);c.scale(scale,scale);
  const points=[[0,-70],[0,-18],[-65,-18],[0,-18],[65,-18],[0,-18],[-48,69],[0,0],[49,69]];
  stroke(points,'#f14b23',25);stroke(points,'#ffc84e',15);stroke(points,'#fff3b0',5);c.restore();burst('#ffd77c',90);
 } else if(['gust','fairy-wind','air-cutter','razor-wind'].includes(id)) {wind(id==='fairy-wind');if(id==='air-cutter'||id==='razor-wind')for(let i=0;i<3;i++){c.strokeStyle='#e6fdff';c.lineWidth=5;c.beginPath();const x=sx+(tx-sx)*((t+i*.12)%1);c.arc(x,sy,32+i*10,-1.2,1.2);c.stroke();}
 } else if(id==='wing-attack') {
  c.save();c.translate(tx-45+40*p,ty);c.rotate(-.8+p*1.5);c.fillStyle='#e6f3fa';c.strokeStyle='#9eb6c7';c.lineWidth=3;c.beginPath();c.moveTo(-63,7);c.quadraticCurveTo(-35,-54,49,-58);c.lineTo(26,-29);c.lineTo(52,-37);c.lineTo(25,-5);c.lineTo(43,-9);c.quadraticCurveTo(9,38,-63,7);c.fill();c.stroke();c.restore();burst();
 } else if(['poison-sting','pin-missile','twineedle','poison-jab','horn-attack','double-horn','fury-attack','peck','drill-peck'].includes(id)) {
  const double=id==='double-horn'||id==='twineedle',count=double?2:id==='fury-attack'?5:1;
  for(let i=0;i<count;i++){const q=clamp((t-.6-i*(double?.35:.12))/.45);if(q===0)continue;const x=sx+(tx-sx)*q,y=sy+(count>2?(i-2)*8:0),strong=id==='poison-jab',drill=id==='drill-peck',color=/poison/.test(id)?'#bd79db':drill?'#d1e2ed':'#e7d8bd';
   c.fillStyle=color;c.beginPath();c.moveTo(x+15,y);c.lineTo(x-(strong?77:48),y-(strong?18:10));c.lineTo(x-(strong?77:48),y+(strong?18:10));c.closePath();c.fill();
   if(drill)for(let j=0;j<5;j++)stroke([[x-45+j*10,y-10],[x-38+j*10,y+Math.sin(t*30+j)*12]],'#758fa3',3);
   if(q>.9)star(tx,ty,strong?64:28,'#f4d8ff',.65);}
  if(id==='poison-jab'&&hit>0)debris(tx,ty,hit,'#ae64c7',28);
 } else if(['acid','sludge','mud-slap','mud-shot','gunk-shot'].includes(id)) {
  const mud=/mud/.test(id),heavy=id==='gunk-shot',color=mud?'#95704b':'#9b52b0',x=sx+(tx-sx)*p,y=sy-Math.sin(p*Math.PI)*(heavy?72:32);
  if(t<1.3){if(mud){disc(x,y,20,color);disc(x-8,y-5,11,'#b99463');}else sludge(x,y,heavy?43:id==='sludge'?24:19,t*2);if(heavy)for(let i=0;i<4;i++)sludge(x-35-i*17,y+Math.sin(i)*14,9+i,t);}
  else {for(let i=0;i<8;i++){const x=tx+Math.sin(i*7)*36,y=ty+Math.cos(i*5)*31;disc(x,y,9+i%4,color,.8);stroke([[x,y],[x,y+hit*(20+i%3*13)]],color,6,.8);}if(!mud)for(let i=0;i<4;i++)disc(tx-30+i*20,ty-35-hit*42,13+hit*12,'#b68bbe',.14);if(heavy)debris(tx,ty,hit,color,30);}
 } else if(id==='iron-tail') {
  c.save();c.translate(sx+(tx-sx-60)*p,sy+38);c.rotate(-1+p*2);const g=c.createLinearGradient(0,-30,0,30);g.addColorStop(0,'#6b8b9c');g.addColorStop(.45,'#fff');g.addColorStop(1,'#8ba6b4');c.fillStyle=g;c.beginPath();c.moveTo(-75,5);c.bezierCurveTo(-20,6,22,-27,100,-15);c.quadraticCurveTo(55,24,-64,27);c.closePath();c.fill();c.restore();burst('#e4f7ff',65);
 } else if(['thunder-shock','thunderbolt','million-volt','thunder'].includes(id)) {
  const huge=id==='million-volt',small=id==='thunder-shock',fall=id==='thunder',width=small?3:huge?11:6;
  for(let b=0;b<(small?2:huge?8:fall?1:4);b++){const points=[];for(let i=0;i<=8;i++){const a=i*TAU/8+b*.5;points.push(fall?[tx+Math.sin(i*7+Math.floor(t*12))*21,20+i*22]:[tx+Math.cos(a)*(small?32:huge?88:60)+Math.sin(i*9+t*20)*11,ty+Math.sin(a)*(small?39:huge?90:64)]);}stroke(points,'#eaa72a',width+6,.35);stroke(points,'#ffe34a',width);stroke(points,'#fffed4',2);}
  if(huge)glow(tx,ty,110,'#ffe953',.35);burst('#fff2aa',huge?105:small?30:70);
 } else if(['earthquake','earth-power','dig','sand-attack','sand-tomb','spikes'].includes(id)) {
  if(id==='spikes'){for(let i=0;i<10;i++){const x=tx-63+(i%5)*30,y=ty+70+Math.floor(i/5)*15;c.fillStyle='#a9b4c2';c.beginPath();c.moveTo(x,y-15*p);c.lineTo(x-9,y+5);c.lineTo(x+9,y+5);c.closePath();c.fill();}}
  else if(id==='sand-attack'||id==='sand-tomb'){for(let i=0;i<65;i++){const q=(t+i/65)%1,x=id==='sand-tomb'?tx+Math.cos(i+t*8)*65:sx+(tx-sx)*q,y=id==='sand-tomb'?ty+Math.sin(i+t*5)*70:sy+Math.sin(i*9)*q*62;disc(x,y,1+i%3,'#d8bb7e',.7);}}
  else {for(let i=0;i<6;i++){const x=tx-85+i*31;stroke([[x-25,ty+100],[x,ty+85],[x-8,ty+63],[x+9,ty+46]],'#ba9971',4,p);}for(let i=0;i<25;i++)disc(tx+Math.sin(i*7)*95,ty+85-Math.abs(Math.sin(t*7+i))*26,2+i%4,'#b9a079',.55);}
 } else if(id==='venoshock') {
  for(let i=0;i<17;i++){const a=i*TAU/17,r=30+hit*105;stroke([[tx,ty],[tx+Math.cos(a)*r,ty+Math.sin(a)*r]],i%2?'#9d26dd':'#db70f4',6+ i%3,1-hit*.6);}
  for(let i=0;i<20;i++)disc(tx+Math.sin(i*7+t)*hit*85,ty+Math.cos(i*9+t)*hit*80,3+i%5,'#ba55df',.8);
 } else if(['draining-kiss','drain-punch','leech-life','absorb','mega-drain','giga-drain','dream-eater'].includes(id)) {
  if(id==='draining-kiss'){c.save();c.translate(tx,ty);c.fillStyle='#ef6a9c';c.beginPath();c.moveTo(-26,0);c.quadraticCurveTo(-12,-21,0,-8);c.quadraticCurveTo(12,-21,26,0);c.quadraticCurveTo(0,28,-26,0);c.fill();stroke([[-20,1],[20,1]],'#aa3f73',2);c.restore();}
  if(id==='leech-life'){for(let y of [-20,20])for(let i=0;i<2;i++){c.fillStyle='#fff0dc';c.beginPath();c.moveTo(tx-22+i*26,ty+y);c.lineTo(tx-6+i*26,ty+y);c.lineTo(tx-14+i*26,ty);c.closePath();c.fill();}}
  if(id==='dream-eater')glow(tx,ty,75,'#a777de',.5);
  for(let i=0;i<16;i++){const q=(t*.8+i/16)%1,x=tx-(tx-sx)*q,y=ty+Math.sin(i*7+q*7)*15;disc(x,y,3+i%4,id==='leech-life'?'#d96067':id==='draining-kiss'?'#ffa3d4':'#b2e3a1',.8);}
  glow(sx,sy,47,'#d6f5c7',.2);
 } else if(['headbutt','body-slam','quick-attack','extreme-speed','fly','play-rough','outrage','submission','seismic-toss'].includes(id)) {
  if(id==='quick-attack'||id==='extreme-speed'){for(let i=0;i<14;i++)stroke([[35,45+i*20],[200+(i%3)*65,45+i*20]],'#cee6ff',2,.3);for(let i=0;i<3;i++)stroke([[sx+50+i*35,sy-18],[sx+10+i*35,sy+40]],'#e1efff',9,.4);}
  if(id==='play-rough')for(let i=0;i<7;i++)heart(tx+Math.sin(i*7)*58,ty-40-((t+i*.1)%1)*42,9+i%3*3);
  if(id==='outrage')glow(sx+280*p,sy,90,'#ef7057',.2);
  if(id==='submission'||id==='seismic-toss'){ellipse(tx,ty,60,90,'#dce9ff',4,.7);if(id==='seismic-toss'){disc(tx,60,38,'#448bc3',.6);disc(tx-12,50,16,'#a4d796',.6);}}
  if(hit>0){star(tx, id==='headbutt'?ty-50:ty,60*(1-hit),'#fff3cb',1-hit);debris(tx,ty+50,hit,'#dbc4a0');}
 } else if(id==='sing'||id==='sleep-talk') {
  for(let i=0;i<5;i++){const q=(t*.65+i/5)%1,x=sx+(tx-sx)*q,y=sy+Math.sin(q*8+i)*22;stroke([[x,y-20],[x,y+5]],'#c6adff',3);ellipse(x-5,y+7,7,5,'#e0c6ff',5);stroke([[x,y-20],[x+11,y-16]],'#c6adff',3);}
 } else if(id==='double-slap'||id==='fury-swipes') {
  const pulse=Math.floor((t-.5)*5);const side=pulse%2?1:-1;c.save();c.translate(tx+side*18,ty-10);c.rotate(side*.35);c.fillStyle='#f4d4aa';c.beginPath();c.roundRect(-24,-20,45,54,14);c.fill();for(let i=0;i<4;i++)stroke([[-18+i*11,-16],[-18+i*11,-44+i%2*4]],'#f4d4aa',9);stroke([[-21,2],[-36,-15]],'#f4d4aa',10);c.restore();star(tx,ty,26,'#ffefce',.6);
 } else if(id==='pay-day') {
  for(let i=0;i<9;i++){const q=(t*1.1+i/9)%1,x=sx+(tx-sx)*q,y=sy+Math.sin(q*Math.PI)*-30+(i%3-1)*17;disc(x,y,10,'#e8aa21');ellipse(x,y,7,9,'#fff0a0',2);stroke([[x,y-5],[x,y+5]],'#b68019',2);}
 } else if(['low-kick','low-sweep','karate-chop','brick-break','double-kick','dynamic-punch','mega-punch','mega-kick','fire-punch'].includes(id)) {
  const kick=/kick|sweep/.test(id),low=id==='low-kick'||id==='low-sweep',chop=id==='karate-chop'||id==='brick-break',double=id==='double-kick';
  const kickTime=t<1.08?t-.58:t-1.12;
  const q=double?clamp(kickTime/.28):ease((t-(id.startsWith('mega')?.85:.55))/.5),y=low?ty+60:chop?ty-65+(id==='brick-break'?45*q:0):ty;
  if(double && (kickTime<0 || kickTime>.36)) { c.restore(); return true; }
  if(chop){c.save();c.translate(tx, y);c.rotate(.7);c.fillStyle='#f1d2a8';c.beginPath();c.roundRect(-15,-43,28,78,12);c.fill();c.restore();}
  else {c.save();if(id==='fire-punch'){c.translate(sx+(tx-sx)*q,y);c.scale(1,-1);fist(0,0,'#ffad68',false);c.restore();}else{fist(sx+(tx-sx)*q,y,id.startsWith('mega')?'#f0c172':'#edc8a2',kick);c.restore();}}
  if(hit>0){burst('#fff2d2',id==='dynamic-punch'?112:id.startsWith('mega')?85:45);if(id==='dynamic-punch')glow(tx,ty,115*(1-hit)+10,'#ffad44',1-hit);if(id==='fire-punch')for(let i=0;i<6;i++)flame(tx+Math.sin(i*7)*30,ty+Math.cos(i*7)*30,18,-.6,1-hit);}
 } else if(id==='teleport') {for(let i=0;i<7;i++)stroke([[sx-15+i*5,sy+35],[sx-15+i*5,sy-150*p]],'#dbc7ff',2,.6);
 } else if(id==='psychic'||id==='psystrike') {
  for(let i=0;i<4;i++){const q=(t*.6+i/4)%1;ellipse(tx,ty-15,30+q*65,45+q*50,id==='psystrike'?'#db8cfa':'#b782e9',3,1-q);}
  if(hit>0){const r=id==='psystrike'?130:85;glow(tx,ty,r,'#cb8cf4',1-hit);star(tx,ty,r*(1-hit),'#f9dfff',1-hit);ellipse(tx,ty,25+hit*r,25+hit*r,'#c28cf4',5,1-hit);}
 } else if(id==='barrier'||id==='transform') {
  ellipse(sx,sy,86,105,'#bfddff',4,.8);glow(sx,sy,110,'#9cc6ff',.17);ellipse(sx,sy,75,99,'#ebf7ff',2,.35);
 } else if(id==='hypnosis') {
  const x=sx+70+Math.sin(t*5)*35;stroke([[sx+70,sy-85],[x,sy+5]],'#ddd7c7',2);disc(x,sy+18,15,'#e8bc56');ellipse(x,sy+18,11,13,'#fff0aa',2);if(t>1.3)text('Z z z',tx,ty-86,'#d8dbfb',25);
 } else if(id==='psybeam') {
  const x=sx+(tx-sx)*p,y=sy+Math.sin(p*18)*26;if(t<1.3){glow(x,y,27,'#e4a7f2',.8);disc(x,y,13,'#d6adff');}
  else for(let i=0;i<3;i++){const a=t*3+i*TAU/3,x=tx+Math.cos(a)*40,y=ty-85+Math.sin(a)*9;disc(x,y,9,'#f4d45a');disc(x+6,y-6,6,'#ffe878');stroke([[x+10,y-5],[x+15,y-3]],'#e69436',3);disc(x+8,y-8,1,'#45364a');}
 } else if(id==='ice-beam'||id==='blizzard') {
  if(id==='ice-beam'){stroke([[sx,sy],[sx+(tx-sx)*p,sy]],'#9ce7ff',22,.6);stroke([[sx,sy],[sx+(tx-sx)*p,sy]],'#efffff',7);}
  else for(let i=0;i<25;i++){const q=(t*.9+i/25)%1,x=tx-85+(i*37)%170,y=25+q*230;star(x,y,6+i%3,'#d0f6ff',.8,t);}
  if(t>1.3){c.fillStyle='#a8eaff88';c.strokeStyle='#e2ffff';c.lineWidth=3;c.beginPath();c.moveTo(tx-58,ty+75);c.lineTo(tx-66,ty-38);c.lineTo(tx-23,ty-77);c.lineTo(tx+48,ty-63);c.lineTo(tx+65,ty+60);c.closePath();c.fill();c.stroke();stroke([[tx-46,ty-34],[tx+20,ty+48]],'#efffff',3,.7);}
 } else if(id==='smog') {
  for(let i=0;i<18;i++){const q=(t*.5+i/18)%1,x=sx+(tx-sx)*q,y=sy+Math.sin(i*5)*45;disc(x,y,20+i%4*5,i%2?'#876f91':'#a485ae',.24);}
 } else if(id==='lick') {
  const x=sx+(tx-sx)*p;stroke([[sx,sy],[sx+100,sy+22],[x,ty+35-p*65]],'#b64e72',19);stroke([[sx,sy],[sx+100,sy+22],[x,ty+35-p*65]],'#f29aab',13);stroke([[x-12,ty+24-p*65],[x,ty+30-p*65]],'#b86a85',2);
 } else if(id==='rock-slide'||id==='rock-throw') {
  for(let i=0;i<(id==='rock-throw'?1:6);i++){const q=clamp((t-.55-i*.09)/.65),x=tx+(id==='rock-throw'?0:(i%3-1)*38),y=-30+q*230;rock(x,y,id==='rock-throw'?35:21+i%3*4);}if(hit>0)debris(tx,ty,hit,'#b49c79',25);
 } else if(id==='self-destruct'||id==='explosion') {
  if(t>1.1){const q=clamp((t-1.1)/.55),r=q*(id==='explosion'?390:235);glow(sx+140,sy,r+1,'#ffb446',1-clamp((t-1.6)/.5));star(sx+140,sy,r,'#fff2ab',.9*(1-hit));}
  if(id==='explosion'&&t>1.35)for(let i=0;i<10;i++){const a=i*TAU/10;stroke([[350,180],[350+Math.cos(a)*90,180+Math.sin(a)*85],[350+Math.cos(a+.1)*210,180+Math.sin(a+.1)*180],[350+Math.cos(a)*440,180+Math.sin(a)*300]],'#e4ecff',2,.8);}
 } else if(id==='egg-bomb') {
  const x=sx+(tx-sx)*p,y=sy-Math.sin(p*Math.PI)*64;c.fillStyle='#fff1cc';c.beginPath();c.ellipse(x,y,16,22,t*4,0,TAU);c.fill();if(hit>0){star(tx,ty,75*(1-hit),'#fff0aa',1-hit);debris(tx,ty,hit,'#fff0d5');}
 } else if(['bone-club','bone-rush','bonemerang'].includes(id)) {
  const q=id==='bonemerang'?Math.sin(clamp((t-.5)/1.65)*Math.PI):p;bone(sx+(tx-sx)*q,sy,id==='bone-club'?-1+p*2:t*15);if(hit>0)burst();
 } else if(id==='dragon-rage') {
  for(let i=0;i<6;i++)ellipse(sx,sy+68,40+i*7,8+i*3,'#7ed4ff',3,.65);for(let i=0;i<15;i++)disc(sx+Math.sin(i*7+t)*62,sy+40-Math.abs(Math.sin(t*4+i))*42,3,'#9ce9ff',.7);
 } else if(id==='twister') {
  for(let i=0;i<16;i++){const y=ty+75-i*9,r=12+i*3;ellipse(tx+Math.sin(t*10+i*.4)*5,y,r,5,'#c2e3f0',3,.6);}
 } else if(id==='rest') {glow(sx,sy,95,'#a4c5f1',.25);text('Z z z',sx+15,sy-90,'#d8e7ff',28);
 } else if(id==='destiny-bond') {stroke([[sx,sy],[sx+100,sy-35],[tx,ty]],'#a68bc8',7,.6);for(let i=0;i<8;i++)ellipse(sx+(tx-sx)*i/7,sy+Math.sin(i)*12,12,7,'#d3b4eb',3,.7);
 } else if(id==='fury-cutter') {
  for(let i=0;i<2;i++){const q=clamp((t-.6-i*.4)/.22);if(q>0)stroke([[tx-57+i*75,ty-65],[tx-57+i*75+(i?-85:85)*q,ty-65+130*q]],'#d4ffb5',7,1-clamp((t-1.65)/.4));}
 }
 c.restore();return true;
}
