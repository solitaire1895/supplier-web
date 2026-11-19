// Parla Italiano! cast: Orso (the bear, our learner) and Giulia (the guide), as cut-paper characters.
// Each draw function paints one pose into a canvas: pose = { arms, mouth, eyes, brows, walk, stride, prop, look }.
// Orso is an original design: honey fur, small bead eyes with brows, a pointed snout with a heart nose,
// rounded ears with a notch, and his own outfit (green varsity jacket with the "I", tricolour sneakers,
// arch-badge headphones, the "Italiano" book).
import { cv, finishCut, sh, crescent, blob, INK } from './paper.js';
import { TAU } from './lib.js';

const LW = 9, LW2 = 5;
export const CHAR_W = 900, CHAR_H = 1150;

// ---------- shared pieces ----------
function limb(a, x, y, ang, len, w, col, endFn) {
  a.save(); a.translate(x, y); a.rotate(ang);
  a.beginPath(); a.roundRect(-w / 2, -w / 2, w, len + w / 2, w / 2); sh(a, col, LW2 + 1);
  a.translate(0, len); endFn?.(a); a.restore();
}
function eyes(a, cx, cy, gap, p, r = 17) {
  const { eyes: e = 'open', look = [0, 0], blink = 0 } = p;
  for (const s of [-1, 1]) {
    const x = cx + s * gap + look[0] * 6, y = cy + look[1] * 5;
    a.lineCap = 'round'; a.strokeStyle = INK; a.fillStyle = INK;
    if (e === 'happy') { a.beginPath(); a.arc(x, y + 8, r, Math.PI * 1.1, Math.PI * 1.9); a.lineWidth = 9; a.stroke(); continue; }
    if (e === 'closed' || blink) { a.beginPath(); a.moveTo(x - r, y); a.lineTo(x + r, y); a.lineWidth = 8; a.stroke(); continue; }
    const k = e === 'wide' ? 1.35 : 1;
    a.beginPath(); a.ellipse(x, y, r * .82 * k, r * 1.05 * k, 0, 0, TAU); a.fill();
    a.beginPath(); a.arc(x - r * .25, y - r * .38, r * .3, 0, TAU); a.fillStyle = '#fffdf7'; a.fill();
  }
}
function brows(a, cx, cy, gap, kind = 'neutral', col = INK) {
  const lift = kind === 'up' ? -16 : 0, inner = { frown: 12, worried: -12 }[kind] ?? 0;
  a.lineCap = 'round'; a.strokeStyle = col; a.lineWidth = 9;
  for (const s of [-1, 1]) {
    const x = cx + s * gap, y = cy + lift;
    a.beginPath(); a.moveTo(x + s * 22, y); a.lineTo(x - s * 22, y + inner); a.stroke();
  }
}
function mouthShape(a, mx, my, kind, w = 30) {
  a.lineCap = 'round'; a.strokeStyle = INK;
  if (kind === 'smile') { a.beginPath(); a.moveTo(mx - w, my - 4); a.quadraticCurveTo(mx, my + 26, mx + w, my - 4); a.lineWidth = 8; a.stroke(); }
  else if (kind === 'open' || kind === 'grin') {
    const h = kind === 'grin' ? 34 : 46;
    a.beginPath(); a.moveTo(mx - w - 6, my - 8); a.quadraticCurveTo(mx, my + h * 1.5, mx + w + 6, my - 8); a.closePath(); sh(a, '#8a2a2a', 7);
    a.save(); a.clip(); a.beginPath(); a.ellipse(mx, my + h * .85, w * .7, 16, 0, 0, TAU); a.fillStyle = '#ef6f6f'; a.fill(); a.restore();
  }
  else if (kind === 'o') { a.beginPath(); a.ellipse(mx, my + 6, 14, 19, 0, 0, TAU); sh(a, '#8a2a2a', 7); }
  else if (kind === 'worried') { a.beginPath(); a.moveTo(mx - w, my + 10); a.bezierCurveTo(mx - 14, my - 6, mx - 2, my + 16, mx + 10, my + 2); a.quadraticCurveTo(mx + 22, my - 8, mx + w, my + 8); a.lineWidth = 7; a.stroke(); }
  else if (kind === 'flat') { a.beginPath(); a.moveTo(mx - w * .8, my + 2); a.lineTo(mx + w * .8, my + 2); a.lineWidth = 8; a.stroke(); }
}

// ---------- ORSO ----------
const FUR = '#c8894a', FUR_S = '#a96d34', MUZ = '#f3d7ad', MUZ_S = '#e2bb88';
const JACKET = '#1f8a4c', JACKET_S = '#166b3a', SLEEVE = '#f4ead6', SLEEVE_S = '#dccfb4';
const HOOD = '#fbf8f1', JEANS = '#2c3550', JEANS_S = '#1f2740', RED = '#d23a35';

function sneaker(a, lift, flip = 1) {
  a.save(); a.scale(flip, 1);
  blob(a, 14, 40 - lift, 58, 30, .02, 5); sh(a, '#fbf8f1', LW2 + 2);
  a.beginPath(); a.moveTo(-36, 50 - lift); a.lineTo(66, 50 - lift); a.lineWidth = 9; a.strokeStyle = JACKET; a.stroke();
  a.beginPath(); a.moveTo(-30, 30 - lift); a.quadraticCurveTo(10, 14 - lift, 50, 32 - lift); a.lineWidth = 7; a.strokeStyle = RED; a.stroke();
  a.restore();
}
function orsoArm(a, x, side, ang, prop) {
  limb(a, x, 640, ang, 175, 74, SLEEVE, (b) => {
    b.beginPath(); b.rect(-38, -26, 76, 18); b.fillStyle = JACKET; b.fill();
    b.beginPath(); b.rect(-38, -16, 76, 6); b.fillStyle = RED; b.fill();
    b.beginPath(); b.arc(0, 18, 34, 0, TAU); sh(b, FUR, LW2 + 1);
    if (prop === 'thumb') { b.beginPath(); b.ellipse(side * 6, -22, 13, 26, side * .2, 0, TAU); sh(b, FUR, LW2); }
    if (prop === 'book') {
      b.save(); b.rotate(-ang + side * .08); b.translate(side * 6, -10);
      b.beginPath(); b.roundRect(-70, -95, 140, 180, 10); sh(b, JACKET, LW2 + 1);
      b.beginPath(); b.rect(-70, 30, 140, 24); b.fillStyle = '#fbf8f1'; b.fill(); b.beginPath(); b.rect(-24, 30, 48, 24); b.fillStyle = RED; b.fill();
      b.fillStyle = '#fbf8f1'; b.font = '700 26px Fredoka'; b.textAlign = 'center'; b.fillText('Italiano', 0, -30);
      b.restore();
      b.beginPath(); b.arc(0, 18, 34, 0, TAU); sh(b, FUR, LW2 + 1);
    }
  });
}
export function drawOrso(x, p = {}) {
  const { armL = .25, armR = -.25, walk = 0, stride = 0, mouth = 'smile', brows: br = 'neutral', prop = null, lean = 0 } = p;
  x.clearRect(0, 0, CHAR_W, CHAR_H);
  const W = cv(CHAR_W, CHAR_H), a = W.getContext('2d');
  a.save(); a.translate(450, 1100); a.rotate(lean); a.translate(-450, -1100);
  // legs + sneakers
  const s = Math.sin(walk) * stride;
  for (const [lx, ph] of [[392, 1], [508, -1]]) {
    const lift = Math.max(0, ph * Math.sin(walk)) * stride * 18;
    a.save(); a.translate(lx, 850); a.rotate(ph * s * .35);
    a.beginPath(); a.roundRect(-40, -10, 80, 170 - lift, 30); sh(a, JEANS, LW2 + 1);
    a.translate(0, 160 - lift); sneaker(a, 0, ph); a.restore();
  }
  // backpack peeking out behind the left shoulder
  a.beginPath(); a.roundRect(250, 560, 110, 230, 34); sh(a, '#5a5f66', LW2 + 1);
  // torso: hoodie under an open varsity jacket
  const torso = () => { a.beginPath(); a.moveTo(330, 600); a.bezierCurveTo(300, 700, 300, 800, 318, 880); a.quadraticCurveTo(450, 910, 582, 880); a.bezierCurveTo(600, 800, 600, 700, 570, 600); a.quadraticCurveTo(450, 560, 330, 600); a.closePath(); };
  crescent(a, torso, JACKET_S, 24, 0, JACKET); torso(); sh(a, null, LW);
  a.beginPath(); a.moveTo(420, 590); a.lineTo(410, 890); a.lineTo(490, 890); a.lineTo(480, 590); a.closePath(); sh(a, HOOD, LW2);
  a.beginPath(); a.moveTo(318, 862); a.quadraticCurveTo(450, 892, 582, 862); a.lineWidth = 14; a.strokeStyle = RED; a.stroke();
  // varsity "I" patch
  a.save(); a.translate(538, 720); a.rotate(.05);
  a.font = '900 80px "Lilita One"'; a.textAlign = 'center'; a.lineWidth = 12; a.strokeStyle = '#fbf8f1'; a.strokeText('I', 0, 0); a.fillStyle = RED; a.fillText('I', 0, 0);
  a.restore();
  // arms
  orsoArm(a, 322, -1, .55 + armL, p.propL);
  orsoArm(a, 578, 1, -.55 + armR, prop);
  // headphones around the neck, with an arch badge (original emblem)
  a.beginPath(); a.ellipse(450, 572, 92, 34, 0, Math.PI * .05, Math.PI * .95); a.lineWidth = 14; a.strokeStyle = '#3a3f46'; a.stroke();
  for (const sx of [362, 538]) {
    a.beginPath(); a.ellipse(sx, 578, 32, 36, 0, 0, TAU); sh(a, RED, LW2 + 1);
    a.beginPath(); a.ellipse(sx, 578, 20, 23, 0, 0, TAU); sh(a, '#fbf8f1', LW2 - 2);
    a.beginPath(); a.moveTo(sx - 11, 588); a.lineTo(sx - 11, 576); a.arc(sx, 576, 11, Math.PI, 0); a.lineTo(sx + 11, 588); a.lineWidth = 5; a.strokeStyle = JACKET; a.stroke();
  }
  // ears: rounded with a little notch at the top (not plain circles)
  for (const s2 of [-1, 1]) {
    const ex = 450 + s2 * 175, ey = 215;
    const ear = () => { a.beginPath(); a.moveTo(ex - 62, ey + 40); a.bezierCurveTo(ex - 78, ey - 40, ex - 20, ey - 78, ex - 4, ey - 52); a.quadraticCurveTo(ex + 8, ey - 70, ex + 22, ey - 70); a.bezierCurveTo(ex + 76, ey - 62, ex + 82, ey + 10, ex + 60, ey + 44); a.closePath(); };
    crescent(a, ear, FUR_S, s2 * 14, 10, FUR); ear(); sh(a, null, LW);
    a.beginPath(); a.ellipse(ex + 2, ey - 6, 30, 34, 0, 0, TAU); sh(a, MUZ, LW2);
  }
  // head: wider at the cheeks than at the top (a soft pear), not a ball
  const head = () => { a.beginPath(); a.moveTo(450, 165); a.bezierCurveTo(600, 165, 660, 260, 668, 360); a.bezierCurveTo(676, 470, 590, 545, 450, 548); a.bezierCurveTo(310, 545, 224, 470, 232, 360); a.bezierCurveTo(240, 260, 300, 165, 450, 165); a.closePath(); };
  crescent(a, head, FUR_S, 30, 24, FUR); head(); sh(a, null, LW + 1);
  // tuft of fur on top
  a.beginPath(); a.moveTo(418, 172); a.quadraticCurveTo(428, 128, 452, 150); a.quadraticCurveTo(470, 118, 486, 170); sh(a, FUR, LW2);
  // snout: a narrow pointed oval low on the face, with a heart nose
  const muzzle = () => { a.beginPath(); a.ellipse(450, 438, 92, 66, 0, 0, TAU); };
  crescent(a, muzzle, MUZ_S, 10, 12, MUZ); muzzle(); sh(a, null, LW2 + 1);
  a.beginPath(); a.moveTo(450, 418); a.bezierCurveTo(430, 392, 402, 404, 412, 424); a.quadraticCurveTo(424, 444, 450, 456); a.quadraticCurveTo(476, 444, 488, 424); a.bezierCurveTo(498, 404, 470, 392, 450, 418); a.closePath(); sh(a, '#5a3324', LW2 - 1);
  // cheeks
  a.fillStyle = 'rgba(240,110,100,.35)';
  for (const s2 of [-1, 1]) { a.beginPath(); a.ellipse(450 + s2 * 140, 440, 34, 22, 0, 0, TAU); a.fill(); }
  // eyes (small beads) and brows
  eyes(a, 450, 345, 82, p, 18);
  brows(a, 450, 290, 82, br);
  mouthShape(a, 450, 486, mouth, 26);
  a.restore();
  x.drawImage(finishCut(W, 16, { grainA: .7 }), 0, 0);
}

// ---------- GIULIA ----------
const SKIN = '#e9b98f', SKIN_S = '#d39a6c', HAIR = '#3b2418', HAIR_S = '#28170f';
const TOP = '#d23a35', TOP_S = '#ad2b27', SKIRT = '#f1e6cc', SKIRT_S = '#dccda9', SHOE = '#6a3b22';

function giuliaArm(a, x, side, ang, prop) {
  limb(a, x, 560, ang, 160, 58, TOP, (b) => {
    b.beginPath(); b.arc(0, 14, 26, 0, TAU); sh(b, SKIN, LW2 + 1);
    if (prop === 'flag') {
      b.save(); b.rotate(-ang);
      b.beginPath(); b.moveTo(0, 60); b.lineTo(0, -330); b.lineWidth = 12; b.strokeStyle = '#6a4a30'; b.stroke();
      const cols = ['#1f8a4c', '#fbf8f1', '#d23a35'];
      for (let i = 0; i < 3; i++) { b.beginPath(); b.moveTo(4, -330 + i * 0); b.rect(4 + i * 46, -330, 46, 96); b.fillStyle = cols[i]; b.fill(); }
      b.beginPath(); b.rect(4, -330, 138, 96); b.lineWidth = LW2; b.strokeStyle = INK; b.stroke();
      b.restore();
      b.beginPath(); b.arc(0, 14, 26, 0, TAU); sh(b, SKIN, LW2 + 1);
    }
    if (prop === 'point') { b.beginPath(); b.ellipse(side * 4, 46, 9, 26, 0, 0, TAU); sh(b, SKIN, LW2); }
  });
}
export function drawGiulia(x, p = {}) {
  const { armL = .2, armR = -.2, walk = 0, stride = 0, mouth = 'smile', brows: br = 'neutral', prop = null, lean = 0 } = p;
  x.clearRect(0, 0, CHAR_W, CHAR_H);
  const W = cv(CHAR_W, CHAR_H), a = W.getContext('2d');
  a.save(); a.translate(450, 1100); a.rotate(lean); a.translate(-450, -1100);
  // legs + shoes
  const s = Math.sin(walk) * stride;
  for (const [lx, ph] of [[410, 1], [490, -1]]) {
    const lift = Math.max(0, ph * Math.sin(walk)) * stride * 18;
    a.save(); a.translate(lx, 880); a.rotate(ph * s * .35);
    a.beginPath(); a.roundRect(-20, -10, 40, 180 - lift, 18); sh(a, SKIN, LW2 + 1);
    a.translate(0, 172 - lift); blob(a, ph * 10, 10, 40, 22, .02, 7); sh(a, SHOE, LW2 + 1); a.restore();
  }
  // skirt
  const skirt = () => { a.beginPath(); a.moveTo(360, 720); a.bezierCurveTo(330, 790, 300, 860, 292, 900); a.quadraticCurveTo(450, 935, 608, 900); a.bezierCurveTo(600, 860, 570, 790, 540, 720); a.closePath(); };
  crescent(a, skirt, SKIRT_S, 22, 0, SKIRT); skirt(); sh(a, null, LW);
  // top
  const top = () => { a.beginPath(); a.moveTo(372, 540); a.bezierCurveTo(350, 610, 350, 680, 360, 735); a.quadraticCurveTo(450, 755, 540, 735); a.bezierCurveTo(550, 680, 550, 610, 528, 540); a.quadraticCurveTo(450, 515, 372, 540); a.closePath(); };
  crescent(a, top, TOP_S, 20, 0, TOP); top(); sh(a, null, LW);
  // guide's lanyard and badge
  a.beginPath(); a.moveTo(410, 540); a.lineTo(440, 650); a.lineTo(470, 540); a.lineWidth = 6; a.strokeStyle = '#1f8a4c'; a.stroke();
  a.beginPath(); a.roundRect(408, 640, 64, 50, 6); sh(a, '#fbf8f1', LW2 - 1);
  a.fillStyle = INK; a.font = '700 17px Fredoka'; a.textAlign = 'center'; a.fillText('GUIDA', 440, 671);
  // arms
  giuliaArm(a, 378, -1, .35 + armL, p.propL);
  giuliaArm(a, 522, 1, -.35 + armR, prop);
  // neck + hair behind the head
  a.beginPath(); a.roundRect(425, 470, 50, 80, 18); sh(a, SKIN, LW2);
  const hairBack = () => { a.beginPath(); a.moveTo(450, 165); a.bezierCurveTo(600, 165, 650, 280, 650, 400); a.bezierCurveTo(650, 470, 640, 520, 610, 540); a.quadraticCurveTo(450, 560, 290, 540); a.bezierCurveTo(260, 520, 250, 470, 250, 400); a.bezierCurveTo(250, 280, 300, 165, 450, 165); a.closePath(); };
  crescent(a, hairBack, HAIR_S, 22, 18, HAIR); hairBack(); sh(a, null, LW);
  // bun with a red scrunchie
  a.beginPath(); a.ellipse(450, 150, 96, 78, 0, 0, TAU); sh(a, HAIR, LW);
  a.beginPath(); a.ellipse(450, 215, 70, 22, 0, 0, TAU); sh(a, TOP, LW2 + 1);
  // face
  const face = () => { a.beginPath(); a.ellipse(450, 375, 160, 172, 0, 0, TAU); };
  crescent(a, face, SKIN_S, 26, 18, SKIN); face(); sh(a, null, LW + 1);
  // fringe
  a.beginPath(); a.moveTo(292, 330); a.bezierCurveTo(310, 220, 420, 190, 520, 215); a.bezierCurveTo(580, 232, 612, 280, 608, 330);
  a.bezierCurveTo(560, 270, 500, 262, 470, 300); a.bezierCurveTo(430, 258, 350, 262, 292, 330); a.closePath(); sh(a, HAIR, LW2 + 1);
  // round glasses
  a.lineWidth = 6; a.strokeStyle = '#6a3b22';
  for (const s2 of [-1, 1]) { a.beginPath(); a.arc(450 + s2 * 64, 378, 44, 0, TAU); a.stroke(); }
  a.beginPath(); a.moveTo(430, 372); a.quadraticCurveTo(450, 360, 470, 372); a.stroke();
  // cheeks, eyes, brows, nose, mouth
  a.fillStyle = 'rgba(230,100,90,.35)';
  for (const s2 of [-1, 1]) { a.beginPath(); a.ellipse(450 + s2 * 100, 445, 28, 17, 0, 0, TAU); a.fill(); }
  eyes(a, 450, 380, 64, p, 15);
  brows(a, 450, 318, 64, br, HAIR);
  a.beginPath(); a.moveTo(452, 400); a.quadraticCurveTo(440, 440, 458, 444); a.lineWidth = 5; a.strokeStyle = SKIN_S; a.stroke();
  mouthShape(a, 450, 480, mouth, 30);
  // little gold earrings
  for (const s2 of [-1, 1]) { a.beginPath(); a.arc(450 + s2 * 160, 430, 12, 0, TAU); sh(a, '#e2b23a', 4); }
  a.restore();
  x.drawImage(finishCut(W, 16, { grainA: .7 }), 0, 0);
}
