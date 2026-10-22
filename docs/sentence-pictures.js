import { illustratedScene } from './reading-illustrations.js?v=complete-companions';
import { SLEEPING_POSES } from './sleeping-poses.js?v=ground-sleep';
// Text-free SVG scenes with local Pokedex artwork for Pokemon and drawn props.
const COLORS={red:'#ed4953',blue:'#4289e6',yellow:'#f0cf40',green:'#4baa6e'};
const PALETTE={pikachu:'#f4d351',charmander:'#ed9457',squirtle:'#8ccbd2',bulbasaur:'#7dbab0',eevee:'#b88a62',kiki:'#e1ad69',huchu:'#9aa6ac',yeonwoo:'#759bdb',mom:'#e3939d',dad:'#80b293'};
export const PICTURE_POKEMON = ['pikachu','charmander','squirtle','bulbasaur','eevee'];
export const PICTURE_SLEEPERS = [...PICTURE_POKEMON, 'kiki', 'huchu'];
export const ILLUSTRATED_SPECIES = ['charmander','squirtle','bulbasaur','pikachu','eevee'];
export const ILLUSTRATED_ACTIONS = ['sleep','eat','drink','walk','jump'];
function illustratedPose(name, action, options) {
 return illustratedScene({kind:'action',actor:name,action},options);
}
const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const path=(d,fill='none',stroke='#43535b',width=3)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const rect=(x,y,w,h,fill,r=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
function prop(kind,x,y,size=28,color='#ec6668'){
 const s=size/28;let body='';
 if(kind==='ball')body=ellipse(0,0,25,25,color,'stroke="#465964" stroke-width="2"')+path('M-14 -17 Q5 0 -12 20 M-22 0 Q0 9 22 -3','none','#ffffff70',3);
 if(kind==='apple')body=path('M0 -17 C-30 -34 -36 6 -17 23 Q0 33 18 22 C37 -1 26 -34 0 -17',color)+path('M0 -17 L3 -28','none','#665b43',4)+ellipse(11,-27,10,5,'#6ca75c','transform="rotate(-25 11 -27)"');
 if(kind==='book')body=path('M0 -22 Q-15 -32 -36 -23 L-36 25 Q-15 17 0 27 Q18 17 36 25 L36 -23 Q17 -32 0 -22',color)+path('M0 -18 Q-15 -27 -30 -20 L-30 19 Q-12 14 0 23 Q14 14 30 19 L30 -20 Q15 -27 0 -18','#fffaf0','#87969b',1.5)+path('M0 -18 L0 23','none','#98a3a7',2);
 if(kind==='box')body=rect(-32,-27,64,54,'#d3aa73',2)+path('M-32 -27 L0 -40 L32 -27 L0 -12 Z','#e6c28d')+path('M0 -12 L0 27','none','#9c7d56',2);
 if(kind==='flower')body=path('M0 27 L0 -8 M0 12 Q-22 0 -17 17 M0 17 Q18 3 19 20','none','#5d9d64',4)+Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return ellipse(Math.cos(a)*14,Math.sin(a)*14-14,10,10,color);}).join('')+ellipse(0,-14,8,8,'#f4df84');
 if(kind==='cup')body=path('M-18 -23 L18 -23 L14 24 L-14 24 Z','#c8edf5')+path('M-15 0 Q0 6 15 0 L13 21 L-13 21 Z','#74bcde','#74bcde',1);
 return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
}
function actor(name,action='stand',hatColor){
 if (PICTURE_POKEMON.includes(name)) {
  // Reuse the exact Pokedex artwork so species remain instantly recognizable.
  // Action props and hands are layered over it by actionPicture.
  const gesture = action === 'wave'
   ? path('M38 -15 Q54 -30 45 -43 M48 -46 L55 -55 M55 -33 L65 -37','none','#7995a1',3)
   : '';
  return `<image data-pokemon="${name}" href="assets/${name}.png" x="-95" y="-105" width="200" height="185" preserveAspectRatio="xMidYMax meet"/>${gesture}`;
 }

 const color=PALETTE[name]??'#a5c6b2',human=['yeonwoo','mom','dad'].includes(name),cat=['kiki','huchu','eevee'].includes(name),sleep=action==='sleep';
 let s='';
 if(name==='pikachu')s+=path('M23 18 L49 8 L36 -3 L56 -21 L69 -7 L54 14 L65 28 L28 42',color,'#746545',3);
 if(name==='charmander')s+=path('M24 40 Q65 45 58 10','none',color,12)+path('M58 18 Q44 4 62 -16 Q65 -1 72 2 Q75 18 58 18','#f5c34c','#d9894c',2);
 if(name==='squirtle')s+=ellipse(0,23,38,43,'#b8a17b','stroke="#596a65" stroke-width="3"');
 if(name==='bulbasaur')s+=path('M-29 13 Q-46 -3 -22 -20 Q0 -60 23 -20 Q49 -3 30 13','#79a76a');
 if(cat||name==='pikachu'){
  const tall=name==='pikachu'||name==='eevee';
  for(const side of [-1,1])s+=path(`M${side*33} -58 Q${side*(tall?60:46)} ${tall?-123:-92} ${side*12} -68`,color)+path(`M${side*29} -68 L${side*36} ${tall?-94:-79}`,'none',name==='pikachu'?'#4b4c48':'#dba2a1',7);
 }
 s+=ellipse(0,22,human?25:31,41,human?color:color,'stroke="#465b5e" stroke-width="2.5"');
 if(cat||name==='squirtle')s+=ellipse(0,25,20,29,'#f4edd4');
 // Feet are raised for jumping, spread for walking/running, and straight for sitting.
 const stride=['walk','run'].includes(action)?17:0;
 s+=ellipse(-17-stride,67,14,9,human?'#5a6a91':color,'stroke="#53635f" stroke-width="2"')+ellipse(18+stride,62-stride*.3,14,9,human?'#5a6a91':color,'stroke="#53635f" stroke-width="2"');
 const armY=action==='wave'?-30:action==='ball'?29:8;
 s+=path(`M-22 10 Q-42 18 -39 33`,'none',human?'#edc8a8':color,13)+path(`M23 9 Q47 ${armY} 43 ${armY-12}`,'none',human?'#edc8a8':color,13);
 s+=ellipse(0,-40,human?32:42,human?33:35,human?'#f0ceb0':color,'stroke="#465b5e" stroke-width="2.5"');
 if(name==='mom')s+=path('M-33 -55 Q-49 -28 -36 2 L-23 -6 L-24 -48 M24 -48 L24 -5 L39 2 Q47 -27 31 -57','#76534f','#76534f',2);
 if(human){s+=path('M-31 -47 Q-32 -82 4 -78 Q34 -77 32 -44 Q21 -67 7 -64 Q-8 -48 -31 -47',name==='dad'?'#66605a':'#6e5149','#6e5149',1);if(name==='yeonwoo')s+=path('M-34 -60 Q-26 -92 18 -82 Q33 -80 34 -60 L45 -52 L-35 -52 Z',hatColor??'#6b91cb');}
 else if(name==='bulbasaur')s+=path('M-35 -63 L-39 -91 L-17 -69 M20 -69 L36 -88 L37 -61',color);
 else if(name==='charmander')s+=ellipse(6,-30,27,14,'#f6bb83');
 if(sleep)s+=path('M-23 -43 Q-16 -36 -8 -43 M9 -43 Q16 -36 24 -43','none','#3c5355',3.5);
 else s+=ellipse(-16,-44,3.2,5,'#344e51')+ellipse(16,-44,3.2,5,'#344e51');
 if(action==='eat')s+=ellipse(0,-22,11,9,'#783c42')+ellipse(0,-18,6,3,'#ed9c9a');
 else if(action==='drink')s+=ellipse(4,-22,5,5,'#783c42');
 else s+=path('M-7 -23 Q0 -18 8 -24','none','#46615e',2.5);
 if(name==='pikachu')s+=ellipse(-31,-29,7,5,'#df7c70')+ellipse(31,-29,7,5,'#df7c70');
 if(name==='kiki'||name==='huchu'){
  const stripe=name==='kiki'?'#b7814e':'#5d6b78';s+=path('M-15 -69 L-11 -59 M0 -73 L0 -61 M15 -69 L11 -59','none',stripe,4)+path('M-37 -33 L-48 -38 M-37 -27 L-49 -27 M37 -33 L48 -38 M37 -27 L49 -27','none','#56615e',2);
 }
 return s;
}
function actionPicture(name,action,{x=145,y=143,scale=.83,color,propName,size='medium'}={}){
 const drawing = !propName && illustratedPose(name,action,{x:-126,y:-154,width:252,height:234});
 if (drawing) return `<g transform="translate(${x} ${y}) scale(${scale})">${drawing}</g>`;
 if (action === 'sleep' && PICTURE_SLEEPERS.includes(name)) {
  const pose = SLEEPING_POSES[name];
  let sleeping;
  if (pose) {
   sleeping = `<svg x="-104" y="-58" width="208" height="128" viewBox="${pose.viewBox.join(' ')}" overflow="hidden" preserveAspectRatio="xMidYMax meet"><defs><clipPath id="sleep-frame-${name}" clipPathUnits="userSpaceOnUse"><rect x="${pose.viewBox[0]}" y="${pose.viewBox[1]}" width="${pose.viewBox[2]}" height="${pose.viewBox[3]}"/></clipPath></defs><image clip-path="url(#sleep-frame-${name})" data-sleep-art="${name}" href="assets/reading/sleep/${name}.png" x="0" y="0" width="${pose.width}" height="${pose.height}" style="image-rendering:pixelated"/></svg>`;
  } else {
   const coat = name === 'kiki' ? '#dea45f' : '#929da8', stripe = name === 'kiki' ? '#b9793c' : '#586879';
   sleeping = ellipse(13,25,71,43,coat,'stroke="#59626a" stroke-width="3"')
    + path('M66 6 Q104 54 51 58 Q17 59 16 34 Q19 15 37 27','none',stripe,18)
    + path('M-64 5 L-67 -24 L-40 -11 M-34 -9 L-17 -31 L-15 8',coat,'#59626a',3)
    + ellipse(-40,14,37,31,coat,'stroke="#59626a" stroke-width="3"')
    + path('M-61 11 Q-53 19 -45 11 M-35 11 Q-27 19 -19 11','none','#37434c',3)
    + path('M-44 25 L-38 25 L-41 29 Z','#cf8d91','#bd7a7d',1.5)
    + path('M-63 23 L-82 18 M-64 28 L-84 29 M-23 24 L-7 19 M-23 29 L-4 30','none','#56616a',2)
    + path('M-52 -10 L-48 -1 M-38 -14 L-37 -3 M-25 -10 L-28 -2 M7 -10 L14 2 M28 -9 L32 2','none',stripe,5)
    + ellipse(-30,43,24,10,coat,'stroke="#59626a" stroke-width="2"');
  }
  return `<g data-sleep-pose="${name}" transform="translate(${x} ${y}) scale(${scale})">${ellipse(0,72,94,9,'#647a7e22')}${sleeping}</g>`;
 }
 let before='',after='',a=action,dy=0,angle=0;
 if(a==='sleep'){
  angle=-90;
  before=rect(-94,12,190,29,'#b78d74',9)+rect(-94,5,190,18,'#f8f3e9',9)+rect(-91,-37,63,46,'#fffdf9',14)+path('M-81 -29 Q-65 -37 -40 -29','none','#d9d4e6',3)+rect(-92,38,12,29,'#9b735e')+rect(76,38,12,29,'#9b735e');
  after=rect(-8,-30,101,58,'#8db1e0',10)+path('M-5 -20 L88 -20 M9 -9 L9 24 M37 -9 L37 24 M66 -9 L66 24','none','#c8ddf6',3)+path('M91 -81 Q66 -70 82 -52 Q55 -49 61 -73 Q70 -91 91 -81','#f4d76b','#c4a94e',2);
 }
 if(a==='sit')before=rect(-37,-8,74,65,'#c6a17c')+rect(-41,53,82,12,'#a98865')+rect(-37,64,12,17,'#a98865')+rect(25,64,12,17,'#a98865');
 if(a==='walk')after+=path('M-57 66 L-75 66 M-60 53 L-84 53','none','#9bb5bf',3);
 if(a==='jump'){dy=-45;angle=PICTURE_POKEMON.includes(name)?-8:0;after+=path('M-53 23 L-53 3 M-62 10 L-53 0 L-44 10 M58 23 L58 3 M49 10 L58 0 L67 10','none','#a3c0ca',3);}
 if(a==='run'){angle=12;after+=path('M-62 -20 L-91 -20 M-63 0 L-106 0 M-68 20 L-94 20','none','#a0b7c1',4);}
 if(a==='eat')after+=ellipse(0,36,48,12,'#ffffff','stroke="#87a6b2" stroke-width="3"')+prop('apple',21,27,14,'#ec5e57')+prop('apple',-11,-19,23,'#ec5e57')+ellipse(1,-25,6,7,'#fff3d7')+path('M-26 9 Q-36 -8 -24 -13 M26 9 Q32 -3 12 -12','none',PALETTE[name]??'#edc8a8',12)+ellipse(-25,-13,8,7,PALETTE[name]??'#edc8a8')+path('M-45 -32 L-53 -39 M40 -36 L48 -43','none','#d1a66b',3);
 if(a==='drink')after+=prop('cup',23,-9,28)+path('M24 -27 L20 -39 L6 -23','none','#f2a06e',4)+path('M26 15 Q45 3 36 -10','none',PALETTE[name]??'#edc8a8',11);
 if(a==='read'){const y=PICTURE_POKEMON.includes(name)?33:6,w=PICTURE_POKEMON.includes(name)?29:34;after+=prop('book',0,y,w,color??'#7895bc')+ellipse(-w-3,y,7,9,PALETTE[name]??'#edc8a8')+ellipse(w+3,y,7,9,PALETTE[name]??'#edc8a8');}
 if(a==='ball')after+=prop('ball',67,43,size==='big'?43:size==='small'?15:29,color??'#db8f70');
 if(a==='draw')after+=rect(-39,10,83,46,'#fffaf2')+path('M-18 40 L-6 24 L9 40 L25 20','none','#dc9a6b',3)+path('M27 5 L4 34','none','#e37568',7);
 if(a==='wash')after+=rect(-55,20,110,29,'#cbdfe6',10)+path('M25 -29 L25 -42 Q-8 -50 -11 -24','none','#9dbac8',8)+path('M-11 -20 L-11 15 M-2 -18 L-2 16','none','#76b7d4',3)+ellipse(-5,13,27,10,'#e2f4f7');
 if(a==='water')after+=prop('flower',67,29,27,color??'#ed4953')+path('M37 -3 L60 13 M44 -8 L66 8 M51 -12 L72 4','none','#7cbdde',2)+rect(10,-6,27,24,'#a7c9db',4);
 if(a==='hold')after+=prop(propName??'apple',45,7,size==='big'?44:size==='small'?15:27,color??'#e56f63');
 if(propName==='hat'&&name!=='yeonwoo'&&!['read','ball'].includes(a))after+=path('M-45 -65 Q-38 -91 -12 -84 Q5 -79 7 -65 L20 -56 L-46 -56 Z',color??'#ed4953');
 if (PICTURE_POKEMON.includes(name) && ['eat','drink','read'].includes(a)) after = `<g transform="translate(-18 -5)">${after}</g>`;
 return `<g transform="translate(${x} ${y}) scale(${scale})">${a === 'sleep' ? `<g data-human-bed="true">${before}</g>` : before}${ellipse(0,77,54,8,'#647a7e22')}<g transform="translate(0 ${dy}) rotate(${angle})">${actor(name,a,propName==='hat'?color:undefined)}</g>${after}</g>`;
}
function reference(ref){
 if(ref==='tree')return rect(145,102,30,109,'#a58b64',6)+ellipse(160,110,58,37,'#86ad7e')+ellipse(139,104,32,28,'#9dc08b')+path('M149 211 L130 220 M171 211 L190 220','none','#a58b64',6);
 if(ref==='chair')return rect(111,90,98,58,'#c7a17c')+rect(108,143,105,15,'#ac865f')+rect(111,155,12,62,'#a58969')+rect(198,155,12,62,'#a58969');
 return rect(105,151,110,66,'#d0a778',3)+path('M105 151 L129 133 L232 133 L215 151 Z','#e9c69b')+path('M105 151 L215 151 L215 217','none','#9e805c',2);
}
export function sentencePicture(scene){
 const bg=rect(0,0,320,240,'#eaf3f4',16)+rect(0,198,320,42,'#dce8cd',0);let body='';
 const illustration = illustratedScene(scene);
 if(illustration) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" aria-hidden="true">${bg}${illustration}</svg>`;
 }
 if(['action','color'].includes(scene.kind))body=actionPicture(scene.actor,scene.action,{color:COLORS[scene.color],propName:scene.prop});
 if(scene.kind==='size'){
  if(scene.prop==='box'){const widths={big:86,medium:56,small:26};body=actionPicture(scene.actor,'stand',{x:92,y:146,scale:.78})+prop('box',232,177,widths[scene.size]/2.3);}
  else body=actionPicture(scene.actor,scene.action,{propName:scene.prop,size:scene.size});
 }
 if(scene.kind==='position'){
  const pos=scene.position,ref=scene.reference;
  const loc=pos==='beside'?{x:270,y:171,scale:.52}:pos==='on'?{x:160,y:ref==='tree'?45:ref==='chair'?107:111,scale:ref==='tree'?.38:.5}:pos==='under'?{x:160,y:ref==='chair'?186:178,scale:ref==='chair'?.39:.49}:{x:160,y:151,scale:.52};
  body=reference(ref)+actionPicture(scene.actor,'stand',loc);
  if(pos==='inside')body+=rect(105,167,110,50,'#d0a778',2)+path('M105 167 L215 167','none','#9e805c',2);
 }
 if(scene.kind==='give'){
  body=actionPicture(scene.giver,'wave',{x:73,y:147,scale:.63})+actionPicture(scene.receiver,'wave',{x:247,y:147,scale:.63})+prop(scene.prop,151,111,23,scene.prop==='book'?'#7197cb':'#e06e70')+path('M126 157 L191 157 M178 147 L191 157 L178 167','none','#779f95',6);
 }
 if(scene.kind==='pair')body=actionPicture(scene.left,scene.leftAction,{x:77,y:151,scale:.56})+actionPicture(scene.right,scene.rightAction,{x:238,y:151,scale:.56});
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" aria-hidden="true">${bg}${body}</svg>`;
}
