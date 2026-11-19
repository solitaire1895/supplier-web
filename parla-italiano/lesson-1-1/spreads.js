// Lesson 1.1 paper art: the book cover, four spreads (backdrop + ground page) and their pop-up props.
import { cv, paperFill, sh, crescent, blob, INK, rr } from './engine/paper.js';
import { cut } from './engine/art.js';
import { mulberry, TAU } from './engine/lib.js';

export const PW = 2048, PH = 1396;                 // page canvas (BW 0.44 m × BD 0.30 m)
const gx = x => (x / .44 + .5) * PW;               // metres → px (x)
const GREEN = '#1f8a4c', RED = '#d23a35', CREAM = '#fbf8f1';

// ---------- cover ----------
export function coverCanvas(drawOrsoIcon) {
  const w = 2048, h = 1396, c = cv(w, h), x = c.getContext('2d'), m = cv(w, h), y = m.getContext('2d');
  x.fillStyle = '#17643a'; x.fillRect(0, 0, w, h);
  const R = mulberry(3);
  for (let i = 0; i < h; i += 3) { x.fillStyle = `rgba(0,0,0,${.05 + R() * .07})`; x.fillRect(0, i, w, 1.2); }
  for (let i = 0; i < w; i += 3) { x.fillStyle = `rgba(255,255,255,${.02 + R() * .04})`; x.fillRect(i, 0, 1.2, h); }
  y.fillStyle = 'rgb(0,235,0)'; y.fillRect(0, 0, w, h);
  const GOLD = '#e0b456', both = fn => { x.save(); fn(x, GOLD); x.restore(); y.save(); fn(y, 'rgb(0,90,255)'); y.restore(); };
  both((k, col) => { k.strokeStyle = col; k.lineWidth = 10; k.strokeRect(90, 90, w - 180, h - 180); k.lineWidth = 4; k.strokeRect(120, 120, w - 240, h - 240); });
  both((k, col) => { k.fillStyle = col; k.textAlign = 'center';
    k.font = '230px "Lilita One"'; k.fillText('Parla', w * .63, h * .40); k.fillText('Italiano!', w * .63, h * .60);
    k.font = 'italic 76px "IM Fell English"'; k.fillText('~ lesson 1.1 · the alphabet ~', w * .63, h * .76); });
  const cx = w * .24, cy = h * .52, r = 330;
  both((k, col) => { k.beginPath(); k.arc(cx, cy, r + 26, 0, TAU); k.lineWidth = 14; k.strokeStyle = col; k.stroke(); });
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
  x.fillStyle = '#f4e9cf'; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  for (const [i, col] of [GREEN, CREAM, RED].entries()) { x.fillStyle = col; x.fillRect(cx - r + i * r * 2 / 3, cy + r * .55, r * 2 / 3, r); }
  drawOrsoIcon(x, cx - r * .62, cy - r * .9, r * 1.24, r * 1.6);
  x.restore();
  return { c, m };
}

// ---------- spreads ----------
function hotelBack() {
  const c = cv(PW, PH), x = c.getContext('2d');
  paperFill(x, PW, PH, '#f6dfc3', 11, .07);
  // wainscot
  x.fillStyle = '#5e8f6e'; x.fillRect(0, PH * .72, PW, PH * .28);
  x.strokeStyle = '#46705a'; x.lineWidth = 8; for (let i = 0; i < 9; i++) { rr(x, 40 + i * 225, PH * .76, 190, PH * .2, 14); x.stroke(); }
  // arched window with a dome on the skyline (a generic one)
  const wx = PW * .62, wy = PH * .12, ww = 520, wh = 640;
  x.save(); x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); x.lineTo(wx + ww, wy + wh); x.closePath(); x.clip();
  const g = x.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#9fd3f0'); g.addColorStop(1, '#ffe3b8'); x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
  x.fillStyle = '#c98a5a'; for (let i = 0; i < 7; i++) x.fillRect(wx + i * 80, wy + wh - 120 - (i % 3) * 30, 70, 200);
  x.beginPath(); x.ellipse(wx + ww * .55, wy + wh - 210, 120, 110, 0, Math.PI, 0); x.fillStyle = '#d5643f'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  x.fillRect(wx + ww * .55 - 14, wy + wh - 360, 28, 50);
  x.restore();
  x.lineWidth = 22; x.strokeStyle = '#f6efe2'; x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); x.lineTo(wx + ww, wy + wh); x.stroke();
  x.lineWidth = 12; x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.stroke();
  // key board with hooks
  rr(x, PW * .12, PH * .18, 420, 300, 18); sh(x, '#8d5a31', 8);
  for (let i = 0; i < 8; i++) { const kx = PW * .12 + 60 + (i % 4) * 100, ky = PH * .18 + 70 + Math.floor(i / 4) * 130; x.beginPath(); x.arc(kx, ky, 10, 0, TAU); x.fillStyle = '#e2b23a'; x.fill(); if (i !== 5) { rr(x, kx - 12, ky + 14, 24, 60, 6); sh(x, '#e2b23a', 4); } }
  return c;
}
function floor(col, seed, tiles = true) {
  const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, col, seed, .06);
  if (tiles) { x.strokeStyle = 'rgba(90,50,30,.18)'; x.lineWidth = 5; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(0, i * 130); x.lineTo(PW, i * 130 + 60); x.stroke(); } for (let i = 0; i < 18; i++) { x.beginPath(); x.moveTo(i * 130, 0); x.lineTo(i * 130 - 160, PH); x.stroke(); } }
  return c;
}
function alphaBack() {
  const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, '#bfe3f2', 21, .06);
  // tricolour bunting
  for (let row = 0; row < 2; row++) {
    const y0 = 120 + row * 210; x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.moveTo(0, y0); x.quadraticCurveTo(PW / 2, y0 + 120, PW, y0); x.stroke();
    for (let i = 0; i < 16; i++) { const u = (i + .5) / 16, px = u * PW, py = y0 + 120 * 4 * u * (1 - u) * .5 + 6; x.beginPath(); x.moveTo(px - 50, py); x.lineTo(px + 50, py); x.lineTo(px, py + 110); x.closePath(); sh(x, [GREEN, CREAM, RED][i % 3], 5); }
  }
  x.fillStyle = '#ffffff'; x.globalAlpha = .9; for (const [px, py, s] of [[300, 700, 1], [1500, 640, 1.3], [900, 860, .8]]) { blob(x, px, py, 150 * s, 70 * s, .1, px); x.fill(); } x.globalAlpha = 1;
  return c;
}
function streetBack() {
  const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, '#ffd9a6', 31, .05);
  const cols = ['#e7b35a', '#e69a8c', '#c9744d', '#f0c98a', '#d98a6a', '#e7b35a'], R = mulberry(5);
  for (let i = 0; i < 6; i++) {
    const bx = i * 350 - 20, top = 140 + R() * 160;
    rr(x, bx, top, 360, PH - top + 40, 6); sh(x, cols[i], 8);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const wx = bx + 60 + k * 150, wy = top + 80 + r * 230; rr(x, wx, wy, 90, 150, 8); sh(x, '#5b8c5a', 6); x.beginPath(); x.moveTo(wx + 45, wy); x.lineTo(wx + 45, wy + 150); x.lineWidth = 4; x.stroke(); }
  }
  return c;
}
function cobbles() {
  const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, '#cdbba0', 41, .06);
  const R = mulberry(9); x.lineWidth = 5; x.strokeStyle = 'rgba(80,60,40,.35)';
  for (let r = 0; r < 14; r++) for (let k = 0; k < 22; k++) { blob(x, k * 100 + (r % 2) * 50, r * 104 + 40, 44, 40, .12, r * 31 + k); x.stroke(); void R; }
  return c;
}
function mapBack() {
  const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, '#f3e7c9', 51, .06);
  x.font = '140px "Lilita One"'; x.textAlign = 'center'; x.fillStyle = GREEN; x.fillText("L'ALFABETO", PW / 2, 360);
  x.font = '96px "Lilita One"'; x.fillStyle = RED; x.fillText('TELEFONICO', PW / 2, 500);
  x.font = 'italic 70px "IM Fell English"'; x.fillStyle = INK; x.fillText('A come Ancona…', PW / 2, 640);
  return c;
}
// The peninsula, drawn by hand on the page (no borders). Coordinates in page px.
export const CITIES = { Ancona: [1180, 520], Bologna: [930, 380], Roma: [1010, 720], Savona: [600, 330], Otranto: [1500, 980] };
function mapGround() {
  const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, '#8fc9e6', 61, .05);
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 4; for (let i = 0; i < 9; i++) { x.beginPath(); for (let k = 0; k <= 40; k++) x.lineTo(k * 52, 120 + i * 150 + Math.sin(k * .7 + i) * 12); x.stroke(); }
  const land = [[560, 250], [760, 170], [1000, 200], [1180, 240], [1120, 340], [1210, 470], [1330, 640], [1460, 760], [1640, 900], [1560, 1000], [1470, 930], [1400, 900], [1370, 1010], [1300, 1090], [1250, 1010], [1180, 860], [1050, 760], [930, 640], [840, 520], [760, 420], [620, 360]];
  const path = () => { x.beginPath(); x.moveTo(...land[0]); for (const p of land.slice(1)) x.lineTo(...p); x.closePath(); };
  crescent(x, path, '#8fb35f', 20, 18, '#b9d77f'); path(); sh(x, null, 9);
  blob(x, 1180, 1220, 130, 70, .1, 7); sh(x, '#b9d77f', 8);      // Sicily
  blob(x, 640, 800, 70, 130, .12, 8); sh(x, '#b9d77f', 8);       // Sardinia
  return c;
}
export function spreadCanvases() {
  return [
    { back: hotelBack(), ground: floor('#e4ddd0', 13) },
    { back: alphaBack(), ground: floor('#f5ecd6', 23, false) },
    { back: streetBack(), ground: cobbles() },
    { back: mapBack(), ground: mapGround() },
  ];
}

// ---------- props (cut-out items: {c, w, h, ax, ay}) ----------
export function counter() {
  return cut(.2, .034, (x, W, H) => {
    const p = () => { x.beginPath(); x.roundRect(0, 0, W, H, 14); };
    crescent(x, p, '#5a3520', 0, 26, '#7a4a2c'); p(); sh(x, null, 9);
    x.fillStyle = '#4e2d1a'; for (let i = 1; i < 6; i++) x.fillRect(i * W / 6 - 3, H * .2, 6, H * .75);
    rr(x, W / 2 - 170, H * .14, 340, 70, 10); sh(x, '#e2b23a', 6);
    x.fillStyle = INK; x.font = '700 46px Fredoka'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RECEPTION', W / 2, H * .14 + 37);
  });
}
export function bell() {
  return cut(.016, .012, (x, W, H) => {
    x.beginPath(); x.ellipse(W / 2, H * .9, W * .5, H * .12, 0, 0, TAU); sh(x, '#7a7f86', 5);
    x.beginPath(); x.moveTo(W * .1, H * .88); x.quadraticCurveTo(W * .1, H * .15, W / 2, H * .15); x.quadraticCurveTo(W * .9, H * .15, W * .9, H * .88); x.closePath(); sh(x, '#e2b23a', 5);
    x.beginPath(); x.arc(W / 2, H * .1, W * .08, 0, TAU); sh(x, '#e2b23a', 4);
  });
}
export function suitcase() {
  return cut(.045, .035, (x, W, H) => {
    rr(x, W * .35, 0, W * .3, H * .25, 12); sh(x, null, 9);
    const p = () => { x.beginPath(); x.roundRect(0, H * .18, W, H * .82, 22); };
    crescent(x, p, '#a8322e', 18, 18, RED); p(); sh(x, null, 9);
    x.fillStyle = CREAM; x.fillRect(W * .2, H * .18, W * .1, H * .82); x.fillRect(W * .7, H * .18, W * .1, H * .82);
    rr(x, W * .38, H * .45, W * .24, H * .2, 8); sh(x, GREEN, 5);
  });
}
export function plant() {
  return cut(.04, .07, (x, W, H) => {
    for (let i = 0; i < 7; i++) { const a = -1.3 + i * .43; x.beginPath(); x.ellipse(W / 2 + Math.sin(a) * W * .28, H * .42 - Math.cos(a) * H * .2, W * .13, H * .2, a, 0, TAU); sh(x, i % 2 ? '#4fae4c' : '#3a8a3a', 6); }
    x.beginPath(); x.moveTo(W * .2, H * .62); x.lineTo(W * .8, H * .62); x.lineTo(W * .7, H); x.lineTo(W * .3, H); x.closePath(); sh(x, '#c9744d', 8);
  });
}
export function hangSign(text, w = .09, col = GREEN) {
  return cut(w, w * .42, (x, W, H) => {
    const p = () => { x.beginPath(); x.roundRect(0, 0, W, H, 18); };
    crescent(x, p, col === GREEN ? '#166b3a' : '#ad2b27', 0, 18, col); p(); sh(x, null, 9);
    x.strokeStyle = CREAM; x.lineWidth = 6; x.beginPath(); x.roundRect(14, 14, W - 28, H - 28, 12); x.stroke();
    x.fillStyle = CREAM; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 140; x.font = `${fs}px "Lilita One"`; while (x.measureText(text).width > W * .82) { fs -= 6; x.font = `${fs}px "Lilita One"`; }
    x.fillText(text, W / 2, H / 2 + 6);
  }, { ay: 0 });
}
export function letterTile(ch, size = .026, col = CREAM, ink = INK) {
  return cut(size, size * 1.1, (x, W, H) => {
    const p = () => { x.beginPath(); x.roundRect(0, 0, W, H, 18); };
    crescent(x, p, '#d9ccb2', 0, 14, col); p(); sh(x, null, 8);
    x.fillStyle = ink; x.font = `${H * .78}px "Lilita One"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, W / 2, H * .55);
  });
}
export function box(label) {
  return cut(.07, .045, (x, W, H) => {
    const p = () => { x.beginPath(); x.moveTo(0, H * .2); x.lineTo(W, H * .2); x.lineTo(W * .94, H); x.lineTo(W * .06, H); x.closePath(); };
    crescent(x, p, '#a8794a', 18, 0, '#c99a62'); p(); sh(x, null, 9);
    x.fillStyle = CREAM; rr(x, W * .12, H * .42, W * .76, H * .34, 10); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
    x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = 70; x.font = `700 ${fs}px Fredoka`;
    while (x.measureText(label).width > W * .7) { fs -= 4; x.font = `700 ${fs}px Fredoka`; } x.fillText(label, W / 2, H * .59);
  });
}
export function pin(name) {
  return cut(.05, .04, (x, W, H) => {
    x.beginPath(); x.moveTo(W / 2, H); x.lineTo(W / 2, H * .5); x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
    const p = () => { x.beginPath(); x.roundRect(W * .05, 0, W * .9, H * .5, 16); };
    crescent(x, p, '#ad2b27', 0, 12, RED); p(); sh(x, null, 8);
    x.fillStyle = CREAM; x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = 92; x.font = `${fs}px "Lilita One"`;
    while (x.measureText(name).width > W * .8) { fs -= 4; x.font = `${fs}px "Lilita One"`; } x.fillText(name, W / 2, H * .26);
  });
}
export function scooter() {
  return cut(.05, .032, (x, W, H) => {
    for (const wx of [W * .2, W * .8]) { x.beginPath(); x.arc(wx, H * .78, H * .2, 0, TAU); sh(x, '#3a3f46', 8); x.beginPath(); x.arc(wx, H * .78, H * .08, 0, TAU); sh(x, '#c9c2b0', 4); }
    const p = () => { x.beginPath(); x.moveTo(W * .12, H * .7); x.quadraticCurveTo(W * .1, H * .35, W * .45, H * .4); x.lineTo(W * .7, H * .4); x.lineTo(W * .78, H * .1); x.lineTo(W * .86, H * .12); x.lineTo(W * .9, H * .7); x.closePath(); };
    crescent(x, p, '#ad2b27', 0, 14, RED); p(); sh(x, null, 8);
  });
}
export function star() {
  return cut(.03, .03, (x, W, H) => {
    x.beginPath(); for (let i = 0; i < 10; i++) { const r = (i % 2 ? .42 : 1) * W / 2, a = i / 10 * TAU - Math.PI / 2; x.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); } x.closePath(); sh(x, '#f2c230', 8);
  }, { ay: .5 });
}
export function keyProp() {
  return cut(.022, .04, (x, W, H) => {
    x.beginPath(); x.arc(W / 2, H * .2, W * .32, 0, TAU); sh(x, '#e2b23a', 7); x.beginPath(); x.arc(W / 2, H * .2, W * .12, 0, TAU); sh(x, '#fbf8f1', 5);
    rr(x, W * .42, H * .35, W * .16, H * .6, 6); sh(x, '#e2b23a', 6); rr(x, W * .58, H * .75, W * .2, H * .08, 4); sh(x, '#e2b23a', 5);
  }, { ay: 0 });
}
export { gx };
