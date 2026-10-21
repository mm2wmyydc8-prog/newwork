// Original 2D move drawings. Animation families follow the action, not just the type.
import { classifyMove } from './move-effects.js?v=sludge-bomb';
const TAU = Math.PI * 2;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => 1 - (1 - clamp(n)) ** 3;
const SUPPORT = new Set(['shield', 'heal', 'transform', 'status']);

export function createMoveScene(canvas, { reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const c = canvas.getContext('2d');
  const W = 700, H = 380, sx = 205, sy = 177, tx = 523, ty = 184;
  let frame = 0, generation = 0;
  canvas.width = W; canvas.height = H;

  function disc(x, y, r, color, alpha = 1) {
    c.save(); c.globalAlpha = alpha; c.fillStyle = color;
    c.beginPath(); c.arc(x, y, Math.max(.1, r), 0, TAU); c.fill(); c.restore();
  }
  function stroke(points, color, width = 3, alpha = 1) {
    c.save(); c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = width;
    c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore();
  }
  function ellipse(x, y, rx, ry, color, width = 3, alpha = 1) {
    c.save(); c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = width;
    c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); c.stroke(); c.restore();
  }
  function glow(x, y, r, color, alpha = 1) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, '#fff8e8'); g.addColorStop(.2, color); g.addColorStop(1, 'transparent');
    disc(x, y, r, g, alpha);
  }
  function star(x, y, r, color, alpha = 1, angle = 0) {
    c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = alpha; c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i * TAU / 16, size = i % 2 ? r * .17 : r * (i % 4 ? .55 : 1);
      const px = Math.cos(a) * size, py = Math.sin(a) * size;
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath(); c.fill(); c.restore();
  }
  function flame(x, y, size, angle, alpha = 1) {
    c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = alpha;
    for (const [scale, color] of [[1, '#ee4922'], [.76, '#ffad29'], [.38, '#fff5ae']]) {
      c.save(); c.scale(size * scale, size * scale); c.fillStyle = color; c.beginPath();
      c.moveTo(-.7, .25); c.bezierCurveTo(-1, -.65, .2, -.65, 1.6, -1.8);
      c.quadraticCurveTo(.8, -.2, 1.35, .05); c.quadraticCurveTo(.5, 1.25, -.7, .25);
      c.fill(); c.restore();
    }
    c.restore();
  }
  function debris(x, y, p, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const a = i * 2.399, r = (24 + i % 5 * 17) * p;
      disc(x + Math.cos(a) * r, y + Math.sin(a) * r + p * p * 22, 2 + i % 3, color, 1 - p);
    }
  }
  // One continuous gum-and-teeth silhouette per jaw, with curved attached fangs.
  function jaw(x, y, color, lower) {
    c.save(); c.translate(x, y); if (lower) c.scale(1, -1);
    const g = c.createLinearGradient(0, -36, 0, 48);
    g.addColorStop(0, '#fff0ff'); g.addColorStop(.22, color); g.addColorStop(.6, color); g.addColorStop(1, '#fff4db');
    c.fillStyle = g; c.strokeStyle = color; c.lineWidth = 6; c.lineJoin = 'round';
    c.shadowColor = color; c.shadowBlur = 15;
    c.beginPath(); c.moveTo(-108, 25);
    c.bezierCurveTo(-125, -28, -85, -40, -42, -34);
    c.quadraticCurveTo(0, -43, 42, -34); c.bezierCurveTo(85, -40, 125, -28, 108, 25);
    for (let i = 0; i < 7; i++) {
      const x = 105 - i * 30, depth = i === 0 || i === 6 ? 49 : 33 + (i % 2) * 7;
      c.quadraticCurveTo(x - 1, depth - 5, x - 11, depth);
      c.quadraticCurveTo(x - 23, 14, x - 25, -3);
      c.quadraticCurveTo(x - 27, -9, x - 30, 1);
    }
    c.closePath(); c.stroke(); c.fill();
    c.shadowBlur = 0;
    c.beginPath(); c.moveTo(-89, -19); c.quadraticCurveTo(0, -33, 89, -19);
    c.strokeStyle = '#fff0ff'; c.lineWidth = 4; c.globalAlpha = .7; c.stroke(); c.restore();
  }
  function sludge(x, y, radius, angle = 0, alpha = 1) {
    c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = alpha;
    const g = c.createRadialGradient(-radius*.28, -radius*.32, 1, 0, 0, radius*1.2);
    g.addColorStop(0, '#cf8be6'); g.addColorStop(.38, '#9552b3'); g.addColorStop(1, '#492050');
    c.fillStyle = g; c.strokeStyle = '#57265e'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(radius, 0);
    for (let i=1; i<=12; i++) {
      const a=i*TAU/12, prev=(i-.5)*TAU/12;
      const r=radius*(.85+Math.sin(i*7)*.13);
      c.quadraticCurveTo(Math.cos(prev)*radius*1.3, Math.sin(prev)*radius*1.3, Math.cos(a)*r, Math.sin(a)*r);
    }
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle='#dda3ea';c.globalAlpha=alpha*.65;c.beginPath();c.ellipse(-radius*.28,-radius*.35,radius*.3,radius*.13,-.4,0,TAU);c.fill();
    disc(radius*.23,radius*.2,radius*.11,'#55265f',.65);c.restore();
  }
  function crystal(x, y, alpha, color = '#93afc6') {
    c.save(); c.globalAlpha = alpha; c.translate(x, y);
    c.fillStyle = color; c.strokeStyle = '#d8edff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -39); c.lineTo(25, -12); c.lineTo(19, 24); c.lineTo(0, 40); c.lineTo(-23, 14); c.lineTo(-25, -14); c.closePath(); c.fill(); c.stroke();
    stroke([[0, -39], [-6, -6], [0, 40]], '#eaf7ff', 2, .6);
    stroke([[-25, -14], [-6, -6], [25, -12]], '#eaf7ff', 2, .6); c.restore();
  }
  function substitute(x, y, alpha, tilt = 0) {
    c.save(); c.translate(x, y); c.rotate(tilt); c.globalAlpha=alpha;
    c.lineJoin='round'; c.lineCap='round';
    // Soft green body, ears and tail, drawn as one reusable training doll.
    c.fillStyle='#6b9467';c.strokeStyle='#45694b';c.lineWidth=2.5;
    c.beginPath();c.moveTo(24,34);c.bezierCurveTo(60,52,67,34,60,11);c.bezierCurveTo(83,42,69,73,30,67);c.closePath();c.fill();c.stroke();
    const body=c.createLinearGradient(-45,-60,50,72);body.addColorStop(0,'#bed29d');body.addColorStop(.5,'#9bb87e');body.addColorStop(1,'#6e985f');
    c.fillStyle=body;c.beginPath();c.moveTo(-45,24);c.bezierCurveTo(-54,-1,-52,-23,-38,-42);c.lineTo(-34,-71);c.quadraticCurveTo(-29,-82,-12,-60);c.quadraticCurveTo(10,-67,29,-57);c.quadraticCurveTo(45,-82,49,-63);c.lineTo(50,-31);c.bezierCurveTo(67,-6,65,43,46,66);c.quadraticCurveTo(4,89,-39,64);c.quadraticCurveTo(-56,48,-45,24);c.closePath();c.fill();c.stroke();
    // White belly and short plush feet.
    c.fillStyle='#edeedb';c.beginPath();c.ellipse(0,32,33,44,-.1,0,TAU);c.fill();
    for(const side of [-1,1]){c.fillStyle=body;c.beginPath();c.ellipse(side*34,66,21,17,side*.25,0,TAU);c.fill();c.stroke();}
    // A broad snout with the characteristic smiling closed eye.
    c.fillStyle='#a9c38b';c.beginPath();c.moveTo(-41,-39);c.bezierCurveTo(-66,-30,-69,-8,-47,-3);c.quadraticCurveTo(-13,3,27,-11);c.quadraticCurveTo(38,-34,18,-45);c.closePath();c.fill();
    c.strokeStyle='#304f39';c.lineWidth=4;
    c.beginPath();c.moveTo(3,-35);c.quadraticCurveTo(14,-48,26,-38);c.stroke();
    c.beginPath();c.moveTo(-59,-15);c.quadraticCurveTo(-51,-23,-43,-14);c.quadraticCurveTo(-15,-2,22,-14);c.stroke();
    disc(29,-13,8,'#e9e9cf');disc(-51,-27,2,'#486847');
    // Little arms sit in front of the belly.
    for(const side of [-1,1]){c.fillStyle=body;c.strokeStyle='#648454';c.lineWidth=2;c.beginPath();c.ellipse(side*36,16,13,21,side*.55,0,TAU);c.fill();c.stroke();}
    c.strokeStyle='#cdddaf';c.lineWidth=2;c.globalAlpha=alpha*.5;c.beginPath();c.moveTo(44,-35);c.quadraticCurveTo(60,7,45,42);c.stroke();
    c.restore();
  }
  function fist(x, y, color, kick) {
    c.save(); c.translate(x, y); c.rotate(kick ? -.55 : -.15);
    c.fillStyle = color; c.strokeStyle = '#fff4d6'; c.lineWidth = 3; c.lineJoin = 'round';
    c.beginPath();
    if (kick) {
      c.moveTo(-65, -19); c.lineTo(3, -19); c.quadraticCurveTo(11, -18, 13, -4);
      c.lineTo(40, 3); c.quadraticCurveTo(57, 8, 49, 22); c.lineTo(-3, 22); c.lineTo(-21, 6); c.lineTo(-65, 6);
    } else {
      c.moveTo(-55, 17); c.lineTo(-28, 17); c.quadraticCurveTo(-19, 32, 1, 28);
      c.lineTo(28, 22); c.quadraticCurveTo(39, 18, 37, 5); c.lineTo(32, -23);
      c.quadraticCurveTo(29, -33, 18, -30); c.lineTo(-16, -27); c.quadraticCurveTo(-29, -25, -29, -8); c.lineTo(-55, -8);
    }
    c.closePath(); c.fill(); c.stroke();
    if (!kick) for (let i = 0; i < 3; i++) stroke([[-11 + i * 13, -25], [-8 + i * 13, -7]], '#fff4d6', 2);
    c.restore();
  }

  function render(move, t, quiet) {
    const { motion, color } = classifyMove(move), supportive = SUPPORT.has(motion);
    const travel = ease((t - .58) / .68), hit = clamp((t - 1.36) / .78);
    const alive = t > .5 && t < 2.35, fade = 1 - clamp((t - 1.95) / .4);
    c.clearRect(0, 0, W, H);
    ellipse(sx, 310, 100, 15, '#a6b9e0', 2, .2);
    if (!supportive) ellipse(tx, ty + 87, 68, 10, '#a6b9e0', 2, .2);
    const shake = !quiet && t > 1.36 && t < 1.62 ? Math.sin(t * 75) * 4 : 0;
    const targetY = motion === 'psychic' && alive ? ty - Math.sin(clamp((t - .6) / 1.6) * Math.PI) * 26 : ty;
    if (!supportive) substitute(tx + shake, targetY, t > 1.36 && t < 1.5 ? .65 : 1, quiet ? 0 : shake * .006);
    // Brief anticipation; no generic rings or floating balls over every attack.
    if (t < .58 && t > .14) glow(sx, sy, 25 + t * 22, color, Math.sin((t - .14) / .44 * Math.PI) * .55);
    c.save(); c.globalAlpha = fade;
    if (alive) {
      if (motion === 'fang') {
        const close = ease((t - 1.05) / .31), gap = 75 - close * 57;
        const appear = ease((t - .5) / .22);
        c.save(); c.translate(tx, ty); c.scale(appear, appear); c.translate(-tx, -ty);
        jaw(tx, ty - gap, color, false); jaw(tx + 5, ty + gap, color, true);
        if (hit > 0) {
          glow(tx, ty, 82 * (1 - hit) + 10, color, .8 * (1 - hit));
          star(tx, ty, 69 * (1 - hit), '#fff9ed', 1 - hit, .3);
          if (move.effect === 'fire') for (let i = 0; i < 9; i++) flame(tx - 80 + i * 20, ty + 40 - hit * 30, 13 + i % 3 * 4, -.4, 1 - hit);
          else if (move.effect === 'ice') for (let i = 0; i < 10; i++) star(tx + Math.cos(i * 2.4) * hit * 95, ty + Math.sin(i * 2.4) * hit * 65, 8, '#d7fbff', 1 - hit);
          else debris(tx, ty, hit, color, 25);
        }
        if (move.effect === 'fire') for (let i = 0; i < 8; i++) flame(tx - 95 + i * 27, ty - gap - 20, 9 + Math.sin(t * 14 + i) * 3, -.5);
        c.restore();
      } else if (motion === 'flame') {
        if (move.id === 'ember' || move.id === 'fire-spin') {
          for (let i=0;i<9;i++) {const p=(t*.8+i/9)%1;const spin=move.id==='fire-spin';const x=spin?tx+Math.cos(p*TAU*2)*43:sx+(tx-sx)*p;const y=spin?ty+65-p*130:sy+Math.sin(i*7)*17;flame(x,y,spin?15:10+i%3*3,-.4);}
        } else {
        const end = sx + (tx - sx) * travel;
        const beam = c.createLinearGradient(sx, sy, end + 30, sy);
        beam.addColorStop(0, '#fff9c9'); beam.addColorStop(.4, '#ffd04c'); beam.addColorStop(1, '#ef4c22');
        c.fillStyle = beam; c.beginPath(); c.moveTo(sx, sy - 5);
        c.bezierCurveTo(sx + 80, sy - 9, end - 55, sy - 40, end + 25, sy - 21);
        c.lineTo(end + 5, sy + 22); c.bezierCurveTo(end - 55, sy + 34, sx + 80, sy + 9, sx, sy + 5); c.closePath(); c.fill();
        for (let i = 0; i < 15; i++) {
          const p = (i / 15 + t * 1.5) % 1;
          flame(sx + (end - sx) * p, sy + Math.sin(i * 9 + t * 12) * (5 + p * 15), 9 + p * 12, .75);
        }
        if (hit > 0) for (let i = 0; i < 9; i++) flame(tx + Math.sin(i * 7) * 42, ty + 35 - hit * 66, 15 + i % 3 * 5, -.6, 1 - hit * .6);
        if (move.id === 'fire-blast' && t > 1.1) {
          const p = [[0,-65],[0,-22],[-63,-22],[0,-22],[62,-22],[0,-22],[-43,65],[0,-5],[45,65]];
          stroke(p.map(([x,y])=>[tx+x,ty+y]), '#ee431b', 21);
          stroke(p.map(([x,y])=>[tx+x,ty+y]), '#fff1a2', 8);
        }
        }
      } else if (motion === 'bolt') {
        // Thunder strikes downward and wraps the target; it is not a beam from the mouth.
        for (let b = 0; b < 3; b++) {
          const jitter = Math.floor(t * 14) % 3;
          const x = tx + (b - 1) * 34;
          const points = [[x - 8, 32], [x + 12, 80], [x - 15 - jitter * 4, 103], [x + 17, 144], [x - 8, ty + 23]];
          stroke(points, '#d99120', 13, .5); stroke(points, '#ffdc3d', 7); stroke(points, '#fffbd1', 2);
        }
        for (let i = 0; i < 6; i++) {
          const a = i * TAU / 6 + Math.floor(t * 12) * .4;
          stroke([[tx + Math.cos(a) * 23, ty + Math.sin(a) * 28], [tx + Math.cos(a + .3) * 57, ty + Math.sin(a + .3) * 58], [tx + Math.cos(a) * 73, ty + Math.sin(a) * 76]], '#ffe66a', 3);
        }
        glow(tx, ty, 67, color, .4);
      } else if (motion === 'psychic') {
        glow(tx, targetY, 98, color, .48);
        for (let i = 0; i < 3; i++) {
          const p = (t * .8 + i / 3) % 1;
          ellipse(tx, targetY, 32 + p * 53, 52 + p * 35, color, 3, 1 - p);
        }
        for (let i = 0; i < 5; i++) star(tx + Math.cos(i * 2.4 + t) * 62, targetY + Math.sin(i * 2.4 + t) * 60, 7, '#f6d4ff', .8);
      } else if (move.id === 'sludge-bomb') {
        // One heavy, lumpy projectile follows an arc, then bursts into sticky splatter.
        const p = clamp((t - .58) / .78);
        if (t < 1.36) {
          const x=sx+(tx-sx)*p, y=sy-Math.sin(p*Math.PI)*68;
          for (let i=0;i<5;i++) {
            const q=clamp(p-i*.025),bx=sx+(tx-sx)*q,by=sy-Math.sin(q*Math.PI)*68;
            if(p>i*.025)disc(bx-10,by+8+i*4,2+i%2,'#87509e',.45);
          }
          sludge(x,y,25+Math.sin(p*Math.PI)*3,t*3);
        } else {
          const expand=ease(hit/.28), vanish=1-clamp((hit-.55)/.45);
          c.save();c.translate(tx,ty);c.scale(1+expand*.5, .7+expand*.25);
          sludge(0,0,31+expand*15,0,vanish*.9);c.restore();
          for(let i=0;i<15;i++) {
            const a=i*2.399,r=(55+i%4*20)*ease(hit),x=tx+Math.cos(a)*r,y=ty+Math.sin(a)*r*.68+hit*hit*75;
            c.save();c.translate(x,y);c.rotate(a+Math.PI/2);c.scale(1,1+hit*.8);
            disc(0,0,3+i%4,'#a768be',vanish);disc(-1,-2,1+i%2,'#d79ce4',vanish*.7);c.restore();
          }
          // Brief poison mist and sticky drips remain after the impact.
          for(let i=0;i<4;i++)disc(tx-35+i*24,ty-30-hit*46,12+hit*17,'#ae74c2',.12*vanish);
          for(let i=0;i<5;i++){const x=tx-38+i*18;stroke([[x,ty+12],[x,ty+17+hit*(15+i%3*12)]],'#9758ad',5,vanish*.8);}
        }
      } else if (motion === 'ball') {
        const arrive = ease((t - .66) / .7), x = sx + (tx - sx) * arrive;
        const radius = t < 1.36 ? 24 : 24 + hit * 72;
        if (t < 1.36) for (let i = 1; i <= 5; i++) disc(x - i * 11, sy, 24 - i * 3, color, .12);
        glow(x, sy, radius * 1.6, color, t < 1.36 ? .75 : 1 - hit);
        const g = c.createRadialGradient(x - radius * .3, sy - radius * .3, 1, x, sy, radius);
        g.addColorStop(0, move.effect === 'shadowball' ? '#d4a0ff' : '#fff');
        g.addColorStop(.35, color); g.addColorStop(1, move.effect === 'shadowball' ? '#28103e' : '#3174bd');
        disc(x, sy, radius, g, t < 1.36 ? 1 : 1 - hit);
        ellipse(x, sy, radius * .85, radius * .43, '#e9d3ff', 2, .7 * (1 - hit));
      } else if (motion === 'liquid' || motion === 'beam') {
        const end = sx + (tx - sx) * travel;
        if (/bubble/.test(move.id)) {
          for (let i = 0; i < 13; i++) { const p = (i / 13 + t) % 1, x = sx + (end - sx) * p, y = sy + Math.sin(i * 4) * 24; disc(x,y,7+i%4*2,color,.5); ellipse(x,y,7+i%4*2,7+i%4*2,'#e1faff',2,.9); }
        } else {
          stroke([[sx,sy],[end,sy]], color, motion === 'beam' ? 28 : 22, .35);
          stroke([[sx,sy],[end,sy]], color, motion === 'beam' ? 18 : 14);
          stroke([[sx,sy-2],[end,sy-2]], '#e9ffff', 5, .85);
          if (motion === 'liquid') for (let i = 0; i < 8; i++) { const p=(t*1.3+i/8)%1; ellipse(sx+(end-sx)*p,sy,4,10,color,2,.8); }
        }
        if (hit > 0) debris(tx, ty, hit, color, 28);
      } else if (motion === 'slash') {
        const p = clamp((t - .68) / .55);
        for (let i = 0; i < 3; i++) {
          c.save(); c.globalAlpha = 1 - hit; c.strokeStyle = color; c.lineWidth = 11; c.lineCap = 'round';
          c.beginPath(); c.moveTo(tx - 58 + i * 32, ty - 75); c.quadraticCurveTo(tx - 42 + i * 32, ty - 40 + p * 80, tx - 22 + i * 32 + p * 30, ty - 75 + p * 155); c.stroke();
          c.strokeStyle = '#fff6e9'; c.lineWidth = 3; c.stroke(); c.restore();
        }
      } else if (motion === 'needle') {
        for (let i=0;i<5;i++) { const p=clamp((t-.58-i*.08)/.65),x=sx+(tx-sx)*p,y=sy+(i-2)*12; stroke([[x-36,y],[x,y]],color,4); c.fillStyle='#f2d9ff'; c.beginPath();c.moveTo(x+8,y);c.lineTo(x-9,y-5);c.lineTo(x-9,y+5);c.closePath();c.fill(); }
      } else if (motion === 'wind') {
        for(let i=0;i<4;i++){const p=(t*.9+i/4)%1;const x=sx+(tx-sx)*p;ellipse(x,sy,12+i*3,24+i*9,color,3,1-p*.6);}
      } else if (motion === 'leaf') {
        if (move.id === 'vine-whip') {
          for (let i=0;i<2;i++) {c.save();c.strokeStyle=i?'#b0dc77':'#4a9a51';c.lineWidth=i?4:12;c.lineCap='round';c.beginPath();c.moveTo(sx,sy+18);c.bezierCurveTo(sx+80,sy-100*travel,tx-55,ty+90*travel,tx-8,ty-25+Math.sin(t*10)*14);c.stroke();c.restore();}
        } else for(let i=0;i<12;i++){const p=(t*.9+i/12)%1,x=sx+(tx-sx)*p,y=sy+Math.sin(i*3+p*4)*34;c.save();c.translate(x,y);c.rotate(t*4+i);c.fillStyle=color;c.beginPath();c.moveTo(-17,0);c.quadraticCurveTo(0,-18,18,0);c.quadraticCurveTo(0,17,-17,0);c.fill();stroke([[-15,0],[16,0]],'#e5f8ad',1);c.restore();}
      } else if (motion === 'ice') {
        for(let i=0;i<7;i++){const a=i*TAU/7,x=tx+Math.cos(a)*43,y=ty+Math.sin(a)*40;star(x,y,18,'#b7f0ff',.9,t);}
        if(hit>0)debris(tx,ty,hit,'#d9ffff');
      } else if (motion === 'rock') {
        if (/earthquake|earth-power|dig/.test(move.id)) {
          for(let i=0;i<5;i++){const x=tx-70+i*34;stroke([[x,275],[x+14,255],[x+4,241],[x+20,221]],'#d3ac76',4,travel);crystal(x,264-travel*(28+i%3*13),.9,color);}
        } else for(let i=0;i<5;i++){const p=clamp((t-.6-i*.08)/.6),x=sx+(tx-sx)*p,y=sy-Math.sin(p*Math.PI)*74+(i-2)*19;crystal(x,y,1,color);}
      } else if (motion === 'shield') {
        c.save();c.translate(sx,sy);c.fillStyle=color;c.globalAlpha=.2;c.beginPath();c.moveTo(-59,-62);c.quadraticCurveTo(0,-82,59,-62);c.lineTo(52,15);c.quadraticCurveTo(30,61,0,80);c.quadraticCurveTo(-30,61,-52,15);c.closePath();c.fill();c.globalAlpha=.9;c.strokeStyle=color;c.lineWidth=4;c.stroke();stroke([[-32,-39],[0,-48],[31,-39]],'#effaff',3,.7);c.restore();
      } else if (motion === 'heal') {
        glow(sx,sy,100,'#91e9b1',.35);
        for(let i=0;i<7;i++){const p=(t*.55+i/7)%1,x=sx+Math.sin(i*5)*53,y=sy+65-p*135;stroke([[x-7,y],[x+7,y]],'#b5ffd1',4,1-p);stroke([[x,y-7],[x,y+7]],'#b5ffd1',4,1-p);}
      } else if (motion === 'transform') {
        for(let i=0;i<5;i++)ellipse(sx,sy,30+i*13,70-i*7,color,3,.65);
        glow(sx,sy,90,color,.5);
      } else if (motion === 'status') {
        if (/powder|spore|smoke/.test(move.id)) {
          for(let i=0;i<22;i++){const p=(t*.4+i/22)%1,x=sx+(tx-sx)*p,y=sy+Math.sin(i*3+t)*43;disc(x,y,3+i%3,color,.5);}
        } else for(let i=0;i<4;i++){const p=(t*.8+i/4)%1;ellipse(sx+40+p*170,sy,8+p*12,16+p*25,color,3,1-p);}
      } else if (motion === 'punch' || motion === 'kick') {
        const x=sx+(tx-sx)*travel;for(let i=0;i<4;i++)stroke([[x-86,sy+(i-2)*14],[x-45,sy+(i-2)*14]],color,3,.6);
        fist(x,sy,color,motion==='kick');
        if(hit>0 && move.effect==='fire')for(let i=0;i<6;i++)flame(tx+Math.sin(i*4)*35,ty+Math.cos(i*4)*30,16,-.7,1-hit);
      } else {
        // Body/contact moves have impact streaks, never an unrelated fist or jaw.
        for(let i=0;i<6;i++)stroke([[tx-115,ty+(i-3)*16],[tx-35,ty+(i-3)*10]],color,3,travel*.75);
        if(t>1.16)star(tx,ty,64,'#fff1d1',1-hit,.3);
      }
    }
    c.restore();
    if (hit > 0 && hit < 1 && !supportive && move.id !== 'sludge-bomb') {
      // One sharp contact flash followed by a short outward burst.
      star(tx, ty, 58 * (1-hit), '#fff7de', .85 * (1-hit), .25);
      if (motion !== 'fang') debris(tx, ty, hit, color, 12);
    }
  }
  function stop() { generation++; cancelAnimationFrame(frame); c.clearRect(0,0,W,H); }
  function play(move) {
    stop(); const token=generation, quiet=reduced();
    if(quiet){render(move,1.5,true);return;}
    const start=performance.now();
    function tick(now){if(token!==generation)return;const t=(now-start)/1000;render(move,t,false);if(t<2.85)frame=requestAnimationFrame(tick);}
    frame=requestAnimationFrame(tick);
  }
  return {play,stop};
}
