// Lesson 1.1 overlay (1080 × 1920): captions, speech bubbles, letter cards, objectives, quiz, recap, end card.
// Everything readable stays between y = 230 and 1500 and 70 px from the edges (Shorts / Reels UI).
import { INK, GRAIN } from './engine/paper.js';
import { seg, ss, back, clamp, TAU } from './engine/lib.js';

const W = 1080, H = 1920, CREAM = '#fbf8f1', GREEN = '#1f8a4c', RED = '#d23a35';
const ease = (t, a, d = .35) => back(seg(t, a, a + d), 1.6);

export function paperCard(x, cx, cy, w, h, k = 1, col = CREAM, tilt = 0) {
  if (k <= .001) return false;
  x.save(); x.translate(cx, cy); x.rotate(tilt); x.scale(k, k);
  x.shadowColor = 'rgba(40,25,15,.35)'; x.shadowBlur = 24; x.shadowOffsetY = 10;
  x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 28); x.fillStyle = col; x.fill();
  x.shadowColor = 'transparent';
  x.save(); x.clip(); x.globalAlpha = .6; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(-w / 2, -h / 2, w, h); x.restore();
  x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
  return true;   // caller draws contents in card space, then x.restore()
}
function text(x, s, px, py, font, col = INK, align = 'center', outline = 0, oc = INK) {
  x.font = font; x.textAlign = align; x.textBaseline = 'middle';
  if (outline) { x.lineJoin = 'round'; x.lineWidth = outline; x.strokeStyle = oc; x.strokeText(s, px, py); }
  x.fillStyle = col; x.fillText(s, px, py);
}
function fit(x, s, font, maxW) { let fs = parseInt(font.match(/(\d+)px/)[1]); x.font = font; while (x.measureText(s).width > maxW && fs > 18) { fs -= 2; x.font = font.replace(/\d+px/, fs + 'px'); } return x.font; }
function wrap(x, s, maxW) { const out = []; let line = ''; for (const w of s.split(' ')) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }

// ---- captions from word timings: chunks of up to 5 words, cut at punctuation ----
// The text comes from the script; the speech recogniser only gives the timing (its spelling of Italian words is wrong).
export function captionChunks(cues, words, script) {
  const out = [];
  for (const c of cues) if (c.n && words[c.n] && script[c.n]) {
    const aw = words[c.n], sw = script[c.n].replace(/[*]/g, '').split(/\s+/), na = aw.length, ns = sw.length;
    const tAt = (i, end) => { const w = aw[Math.min(na - 1, Math.floor(i * na / ns))]; return Math.max(0, end ? w[2] : w[1]); };
    let i0 = 0;
    for (let i = 0; i < ns; i++) {
      if (i - i0 + 1 >= 5 || /[.,!?:…]$/.test(sw[i]) || i === ns - 1) { out.push({ t0: c.t0 + tAt(i0) - .05, t1: c.t0 + tAt(i, true) + .25, text: sw.slice(i0, i + 1).join(' ') }); i0 = i + 1; }
    }
  }
  for (let i = 0; i < out.length - 1; i++) out[i].t1 = Math.min(out[i].t1, out[i + 1].t0);
  return out;
}
export function drawCaption(x, t, chunks) {
  const c = chunks.find(k => t >= k.t0 && t < k.t1); if (!c) return;
  const a = ss(seg(t, c.t0, c.t0 + .08));
  x.save(); x.globalAlpha = a;
  x.font = '700 58px Fredoka'; const lines = wrap(x, c.text, 900);
  lines.forEach((l, i) => text(x, l, W / 2, 1420 + (i - (lines.length - 1) / 2) * 70, '700 58px Fredoka', CREAM, 'center', 14, INK));
  x.restore();
}

// ---- speech bubble anchored at a screen point (sx, sy = top of the speaker's head) ----
export function drawBubble(x, t, b, sx, sy) {
  const k = ease(t, b.t0, .3) * (1 - ss(seg(t, b.t1 + .5, b.t1 + .75)));
  if (k <= .01) return;
  const typed = clamp((t - b.t0) / Math.max(.4, (b.t1 - b.t0) * .85));
  const s = b.text.slice(0, Math.ceil(b.text.length * typed));
  x.save(); x.font = '700 50px Fredoka';
  const lines = wrap(x, b.text, 640), lw = Math.max(...lines.map(l => x.measureText(l).width)), bw = lw + 80, bh = lines.length * 62 + (b.en ? 70 : 0) + 50;
  const cx = clamp(sx, bw / 2 + 70, W - bw / 2 - 90), cy = Math.max(260 + bh / 2, sy - 60 - bh / 2);
  x.translate(cx, cy); x.scale(k, k);
  x.beginPath(); x.roundRect(-bw / 2, -bh / 2, bw, bh, 34);
  const tx = clamp(sx - cx, -bw / 2 + 40, bw / 2 - 40); x.moveTo(tx - 22, bh / 2 - 2); x.lineTo(tx + (sx - cx) * .15, bh / 2 + 46); x.lineTo(tx + 22, bh / 2 - 2);
  x.fillStyle = CREAM; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
  x.fillStyle = CREAM; x.fillRect(tx - 19, bh / 2 - 9, 38, 12);
  let shown = 0;
  lines.forEach((l, i) => { const part = s.slice(shown, shown + l.length); shown += l.length + 1; text(x, part, -lw / 2, -bh / 2 + 54 + i * 62, '700 50px Fredoka', b.it ? GREEN : INK, 'left'); });
  if (b.en && typed >= 1) text(x, b.en, 0, bh / 2 - 46, 'italic 38px "IM Fell English"', '#6b5a4c');
  x.restore();
}

// ---- big letter card: letter, Italian name, pronunciation, example ----
export function drawLetterCard(x, t, c) {
  const k = ease(t, c.t0) * (1 - ss(seg(t, c.t1 - .2, c.t1)));
  if (!paperCard(x, W / 2, 470, 860, 420, k, CREAM, -.015)) return;
  text(x, c.letter, -260, -10, '250px "Lilita One"', c.col || RED, 'center', 12, INK);
  text(x, c.name, 120, -110, fit(x, c.name, '96px "Lilita One"', 470), GREEN);
  text(x, c.pron, 120, -20, fit(x, c.pron, '700 56px Fredoka', 470), INK);
  if (c.ex) text(x, c.ex, 120, 80, fit(x, c.ex, 'italic 50px "IM Fell English"', 470), '#6b5a4c');
  if (c.note) text(x, c.note, 120, 150, fit(x, c.note, '600 40px Fredoka', 470), RED);
  x.restore();
}

export function drawBanner(x, t, a, b, lines) {
  const k = ease(t, a, .45) * (1 - ss(seg(t, b - .3, b)));
  const y = 330 - (1 - ss(seg(t, a, a + .4))) * 300;
  if (!paperCard(x, W / 2, y, 900, 210, Math.min(1, k * 1.0), GREEN, .01)) return;
  text(x, lines[0], 0, -42, '700 44px Fredoka', CREAM); text(x, lines[1], 0, 30, fit(x, lines[1], '84px "Lilita One"', 820), CREAM, 'center', 10, INK);
  x.restore();
}
export function drawTags(x, t, a, b, tags) {
  tags.forEach((s, i) => {
    const k = ease(t, a + i * .6) * (1 - ss(seg(t, b - .3, b)));
    if (!paperCard(x, W / 2, 560 + i * 130, 820, 104, k, CREAM, (i - 1) * .012)) return;
    text(x, '✔', -360, 0, '700 54px Fredoka', GREEN); text(x, s, -310, 2, fit(x, s, '700 46px Fredoka', 680), INK, 'left');
    x.restore();
  });
}
export function drawLabel(x, t, a, b, s, y = 300, col = RED) {
  const k = ease(t, a) * (1 - ss(seg(t, b - .25, b)));
  if (!paperCard(x, W / 2, y, 860, 130, k, col, -.01)) return;
  text(x, s, 0, 4, fit(x, s, '76px "Lilita One"', 780), CREAM, 'center', 10, INK); x.restore();
}
export function drawStrip(x, t, a, b, items) {
  items.forEach(([L, name], i) => {
    const k = ease(t, a + i * .45) * (1 - ss(seg(t, b - .25, b)));
    const cx = 190 + (i % 3) * 350, cy = 470 + Math.floor(i / 3) * 210;
    if (!paperCard(x, cx, cy, 310, 180, k, CREAM, (i % 2 ? .02 : -.02))) return;
    text(x, L, -90, 0, '120px "Lilita One"', RED, 'center', 8, INK); text(x, name, 50, 6, '700 56px Fredoka', GREEN); x.restore();
  });
}
export function drawDoppia(x, t, a, b) {
  const k = ease(t, a) * (1 - ss(seg(t, b - .3, b)));
  if (!paperCard(x, W / 2, 480, 900, 330, k)) return;
  text(x, 'Rossi', 0, -95, '110px "Lilita One"', GREEN, 'center', 10, INK);
  const parts = [['R', 'erre'], ['O', 'o'], ['SS', 'doppia esse'], ['I', 'i']];
  parts.forEach(([L, n], i) => { const kk = ss(seg(t, a + .6 + i * .5, a + .9 + i * .5)); x.globalAlpha = kk; text(x, L, -330 + i * 220, 40, '80px "Lilita One"', RED); text(x, n, -330 + i * 220, 110, fit(x, n, '600 36px Fredoka', 200), INK); x.globalAlpha = 1; });
  x.restore();
}

// ---- quiz ----
export function drawQuiz(x, t, q) {
  const k = ease(t, q.t0, .45) * (1 - ss(seg(t, q.t1 - .3, q.t1)));
  if (!paperCard(x, W / 2, 620, 920, 720, k)) return;
  text(x, 'QUIZ', 0, -290, '90px "Lilita One"', RED, 'center', 10, INK);
  x.font = '700 54px Fredoka'; wrap(x, q.question, 800).forEach((l, i) => text(x, l, 0, -170 + i * 66, '700 54px Fredoka', INK));
  q.options.forEach((o, i) => {
    const y = 10 + i * 120, right = i === q.answer && t > q.reveal;
    x.beginPath(); x.roundRect(-360, y - 48, 720, 96, 22); x.fillStyle = right ? GREEN : '#f1e6cc'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
    text(x, o, 0, y + 2, '700 54px Fredoka', right ? CREAM : INK);
    if (right) text(x, '★', 300, y, '80px Fredoka', '#f2c230', 'center', 6, INK);
  });
  x.restore();
  // PAUSE stamp + countdown
  if (t > q.pause && t < q.reveal) {
    const u = t - q.pause, n = 3 - Math.floor(u / ((q.reveal - q.pause) / 3));
    const kk = back(seg(t, q.pause, q.pause + .3), 2.2);
    x.save(); x.translate(W / 2, 1180); x.rotate(-.08); x.scale(kk, kk);
    x.beginPath(); x.roundRect(-300, -90, 600, 180, 24); x.fillStyle = RED; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
    text(x, `⏸ PAUSE!  ${Math.max(1, n)}`, 0, 6, '96px "Lilita One"', CREAM, 'center', 10, INK); x.restore();
  }
}

export function drawRecap(x, t, a, b, items) {
  const k = ease(t, a, .4) * (1 - ss(seg(t, b - .3, b)));
  if (!paperCard(x, W / 2, 560, 900, 600, k)) return;
  text(x, 'RECAP', 0, -230, '86px "Lilita One"', GREEN, 'center', 10, INK);
  items.forEach((s, i) => { const kk = ss(seg(t, a + .5 + i * .6, a + .8 + i * .6)); x.globalAlpha = kk; text(x, '• ' + s, -370, -110 + i * 100, fit(x, '• ' + s, '700 48px Fredoka', 760), INK, 'left'); x.globalAlpha = 1; });
  x.restore();
}
export function drawEnd(x, t, a, s1, s2) {
  const k = ease(t, a, .45);
  if (!paperCard(x, W / 2, 1150, 900, 230, k, RED, .01)) return;
  text(x, s1, 0, -40, '700 48px Fredoka', CREAM); text(x, s2, 0, 40, fit(x, s2, '78px "Lilita One"', 820), CREAM, 'center', 10, INK);
  x.restore();
}
export { W, H };
