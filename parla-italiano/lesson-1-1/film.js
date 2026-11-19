// Parla Italiano! · Lesson 1.1 · The Italian Alphabet. Vertical 1080×1920, everything a pure function of t.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeBook, texOf, BW, BD } from './engine/book.js';
import { cutMesh, blobShadow, thread } from './engine/cutmesh.js';
import { makePost } from './engine/post.js';
import { cv } from './engine/paper.js';
import { drawOrso, drawGiulia, CHAR_W, CHAR_H } from './engine/cast.js';
import { seg, ss, eio, eo, back, clamp, lerp, track, TAU } from './engine/lib.js';
import * as S from './spreads.js';
import * as HUD from './hud.js';
import { buildTimeline } from './timeline.js';

const W = 1080, H = 1920;
const QS = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const OV = document.getElementById('ov').getContext('2d');
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, W / H, .004, 30);
const post = makePost(renderer, scene, cam, W, H);

// ---------- data ----------
await Promise.all(['500 40px Fredoka', '600 40px Fredoka', '700 40px Fredoka', '40px "Lilita One"', '40px "IM Fell English"', 'italic 40px "IM Fell English"'].map(f => document.fonts.load(f)));
const durs = { ...(await (await fetch('vo/dur.json')).json()), ...(await (await fetch('it/dur.json')).json()) };
const words = await (await fetch('vo/words.json')).json();
const SCRIPT = Object.fromEntries((await (await fetch('vo_lines.json')).json()).map(l => [l.id, l.text]));
const TL = buildTimeline(durs), CUES = TL.cues, at = TL.at;
const cue = id => CUES.find(c => c.id === id);
const chunks = HUD.captionChunks(CUES, words, SCRIPT);

// ---------- room ----------
const A = '/core/assets/polyhaven/';
const hdr = await new RGBELoader().loadAsync(A + 'lythwood_lounge_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = hdr; scene.background = hdr; scene.backgroundBlurriness = .25;
scene.backgroundRotation.set(0, 2.3, 0); scene.environmentRotation.set(0, 2.3, 0);
const tl = new THREE.TextureLoader();
const wt = n => { const t = tl.load(A + `walnut_${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 1.4); t.anisotropy = 8; return t; };
const wd = wt('diff'); wd.colorSpace = THREE.SRGBColorSpace;
const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.7), new THREE.MeshStandardMaterial({ map: wd, normalMap: wt('nor'), roughnessMap: wt('rough'), color: '#c9a88a', envMapIntensity: .8 }));
desk.position.set(0, -.02, .25); desk.receiveShadow = true; scene.add(desk);
const gl = new GLTFLoader();
async function prop(name, x, z, s, ry) { const m = (await gl.loadAsync(A + `${name}/${name}.gltf`)).scene; m.position.set(x, 0, z); m.scale.setScalar(s); m.rotation.y = ry; m.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(m); return m; }
const lamp = await prop('desk_lamp_arm_01', -.36, .5, .55, -.76);
lamp.traverse(o => { if (o.isMesh && o.material.name.includes('light')) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#ffd9a0'); o.material.emissiveIntensity = 6; } });
const tea = await prop('tea_set_01', .5, .05, 1, .3);

const sun = new THREE.DirectionalLight('#fff1dc', 2.4); sun.position.set(-.4, .7, .8); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0002; sun.shadow.normalBias = .0015;
Object.assign(sun.shadow.camera, { left: -.3, right: .3, top: .4, bottom: -.2, near: .1, far: 3 }); scene.add(sun);
scene.add(new THREE.HemisphereLight('#fff6e8', '#6b5040', .35));

// ---------- book ----------
const orsoIcon = cv(CHAR_W, CHAR_H); drawOrso(orsoIcon.getContext('2d'), { armR: -2.6, mouth: 'open', eyes: 'happy', brows: 'up' });
const book = makeBook(S.coverCanvas((x, px, py, w, h) => x.drawImage(orsoIcon, px, py, w, h)));
scene.add(book.root);
const SP = S.spreadCanvases().map(s => ({ back: texOf(s.back), ground: texOf(s.ground) }));
book.backMat.map = SP[0].back; book.groundMat.map = SP[0].ground;

// spread changes: [cue tag, new spread]
const TURNS = [['turn1', 1], ['turn2', 2], ['turn3', 3], ['turn4', 0]].map(([tag, to]) => ({ t0: at(tag).t0, t1: at(tag).t1, to }));
function spreadAt(t) { let s = 0; for (const tr of TURNS) if (t >= tr.t0 + .25) s = tr.to; return s; }
function spreadWindow(sp) {   // [rise, fold] intervals where spread sp is up
  const W = []; let s0 = 0, from = 0;
  for (const tr of TURNS) { if (s0 === sp) W.push([from, tr.t0]); s0 = tr.to; from = tr.t1; }
  if (s0 === sp) W.push([from, 1e9]); return W;
}

// ---------- pop-up props ----------
const pops = [];
function popup(sp, item, x, z, o = {}) {
  const g = new THREE.Group(), m = cutMesh(item, { s: o.s ?? 1 }); g.add(m); g.position.set(x, o.y ?? 0, z); g.rotation.y = o.ry ?? 0;
  book.stage.add(g); const p = { g, m, sp, delay: o.delay ?? (.3 - z) * .9, show: o.show, hide: o.hide, base: new THREE.Vector3(x, o.y ?? 0, z), sway: o.sway ?? 0 };
  pops.push(p); return p;
}
function popK(p, t) {
  let k = 0;
  for (const [r, f] of spreadWindow(p.sp)) {
    const rise = back(seg(t, r + p.delay, r + p.delay + .45), 1.7), fold = ss(seg(t, f - .05, f + .3));
    k = Math.max(k, rise * (1 - fold));
  }
  if (p.show != null) k *= back(seg(t, p.show, p.show + .4), 1.7);
  if (p.hide != null) k *= 1 - ss(seg(t, p.hide, p.hide + .3));
  return k;
}
function updatePops(t) {
  for (const p of pops) {
    const k = popK(p, t); p.k = k;
    p.g.visible = k > .003; p.g.rotation.x = -(Math.PI / 2) * (1 - Math.min(1, k)); p.g.scale.setScalar(1);
    if (p.sway) p.g.rotation.z = Math.sin(t * 1.3 + p.base.x * 40) * p.sway;
  }
}

// spread 0: hotel
popup(0, S.plant(), .15, .05, { s: 1.1 });
const counter = popup(0, S.counter(), .05, .125);
popup(0, S.bell(), .1, .119, { y: .033, delay: .5 });
popup(0, S.suitcase(), -.115, .19);
// spread 1: alphabet tiles (4 rows: 7, 7, 7, 5) + the foreign box + 5 big vowels
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), FOREIGN = 'JKWXY';
const tiles = ABC.map((ch, i) => {
  const row = Math.floor(i / 7), col = i % 7, n = row < 3 ? 7 : 5;
  const x = (col - (n - 1) / 2) * .026, z = .05 + row * .034;
  const p = popup(1, S.letterTile(ch, .02), x, z, { delay: .15 + i * .035, hide: null });
  p.ch = ch; p.home = new THREE.Vector3(x, 0, z); return p;
});
const fbox = popup(1, S.box('foreign words'), .11, .245, { s: .9 });
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const vtiles = VOWELS.map((ch, i) => popup(1, S.letterTile(ch, .022, '#fff3c4'), (i - 2) * .03, .22, { show: at('vowelsWrong').t0 + i * .15 }));
// spread 2: street signs (hung on the backdrop) + scooter
const SIGNS = [['H', 'acca', -.12, S.hangSign('H · acca', .075, '#1f8a4c')], ['CG', 'ci gi', -.06, S.hangSign('C · G', .075, '#d23a35')], ['Q', 'cu', 0, S.hangSign('Q · cu', .075, '#1f8a4c')], ['R', 'erre', .06, S.hangSign('R · erre', .075, '#d23a35')], ['Z', 'zeta', .12, S.hangSign('Z · zeta', .075, '#1f8a4c')]];
const signs = SIGNS.map(([L, , x, item]) => {
  const g = new THREE.Group(), m = cutMesh(item); g.add(m); const s1 = thread(.06), s2 = thread(.06); s1.position.x = -.03; s2.position.x = .03; g.add(s1, s2);
  g.position.set(x, .16, .012); book.sky.add(g); return { L, g, x };
});
const scoot = popup(2, S.scooter(), -.2, .25, { show: at('motorbike').t0, s: 1.3 });
// spread 3: city pins on the map
const pinX = px => (px / S.PW - .5) * BW, pinZ = py => py / S.PH * BD;
const pins = Object.entries(S.CITIES).filter(([n]) => n !== 'Otranto').map(([n, [px, py]], i) => popup(3, S.pin(n), pinX(px), pinZ(py), { show: at('cities').t0 + i * (durs.g12 / 4) }));
// props that drop in
const key = (() => { const g = new THREE.Group(); g.add(cutMesh(S.keyProp())); const s = thread(.2); s.position.y = .04; g.add(s); book.stage.add(g); return g; })();
const starM = (() => { const g = new THREE.Group(); g.add(cutMesh(S.star())); book.stage.add(g); return g; })();

// ---------- characters ----------
function makeChar(draw, Hm) {
  const c = cv(CHAR_W, CHAR_H), t = texOf(c), w = Hm * CHAR_W / CHAR_H, ay = 1100 / CHAR_H;
  const geo = new THREE.PlaneGeometry(w, Hm); geo.translate(0, ay * Hm - Hm / 2, 0);
  const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, alphaToCoverage: true, roughness: .85, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5, side: THREE.DoubleSide });
  const root = new THREE.Group(); root.add(mesh); book.stage.add(root);
  const shadow = blobShadow(Hm * .28, .45); book.stage.add(shadow);
  let keyS = '';
  return { root, shadow, Hm, pose(p) { const k = JSON.stringify(p); if (k !== keyS) { keyS = k; draw(c.getContext('2d'), p); t.needsUpdate = true; } },
    head(v = new THREE.Vector3()) { return v.set(0, Hm * .97, 0).applyMatrix4(root.matrixWorld); } };
}
const orso = makeChar(drawOrso, .085), giulia = makeChar(drawGiulia, .09);
// where each character stands on each spread: [x, z]
const SPOT = { orso: [[-.085, .19], [-.12, .2], [-.09, .2], [-.13, .21]], giulia: [[.04, .1], [.13, .19], [.1, .18], [.14, .2]] };
const speaking = (who, t) => CUES.some(c => c.who === who && t >= c.t0 && t < c.t1 - .05);
const talk = t => (Math.floor(t * 9) % 2 ? 'open' : 'smile');
const blink = t => ((t % 3.7) < .1 ? 1 : 0);

function poseOrso(t) {
  const p = { brows: 'neutral', mouth: 'smile', blink: blink(t) };
  const c = CUES.find(k => t >= k.t0 && t < k.t1 + .12) || {};
  if (speaking('orso', t)) Object.assign(p, { mouth: talk(t), brows: 'up', eyes: 'open', armR: -1.4 });
  if (c.tag === 'spellEN') Object.assign(p, { mouth: talk(t), brows: 'up', armR: -2.0, prop: 'thumb' });
  if (c.id === 'n01') Object.assign(p, { mouth: 'worried', brows: 'worried', look: [.5, -.4] });
  if (c.tag === 'vowelsWrong') Object.assign(p, { mouth: talk(t), brows: 'up' });
  if (c.tag === 'swap') Object.assign(p, { mouth: 'o', eyes: 'wide', brows: 'up', armR: -2.2 });
  if (c.tag === 'swapped') Object.assign(p, { mouth: 'grin', eyes: 'happy', prop: 'thumb', armR: -1.9 });
  if (c.tag === 'motorbike') Object.assign(p, { mouth: 'o', eyes: 'wide', brows: 'up', armL: 1.4, armR: -1.4 });
  if (c.tag === 'map' || c.tag === 'cities') Object.assign(p, { propL: 'book', armL: .9 });
  if (['keyWin', 'key', 'star'].includes(c.tag)) Object.assign(p, { mouth: 'grin', eyes: 'happy', brows: 'up', prop: 'thumb', armR: -1.9 });
  if (c.tag === 'andiamo' || c.tag === 'close') Object.assign(p, { mouth: c.tag === 'andiamo' ? talk(t) : 'grin', eyes: 'happy', armR: -2.6 });
  if (c.tag === 'countdown') Object.assign(p, { look: [0, -.8], brows: 'up', mouth: 'flat' });
  return p;
}
function poseGiulia(t) {
  const p = { brows: 'neutral', mouth: 'smile', blink: blink(t + 1.3) };
  const c = CUES.find(k => t >= k.t0 && t < k.t1 + .12) || {};
  const sp = spreadAt(t);
  if (sp === 2 || sp === 3) Object.assign(p, { prop: 'flag', armR: -.9 });
  if (speaking('giulia', t)) Object.assign(p, { mouth: talk(t), brows: 'up', prop: sp === 1 || sp === 3 ? 'point' : p.prop, armR: sp === 1 || sp === 3 ? -1.6 : p.armR });
  if (c.tag === 'spellEN' || c.id === 'n01') Object.assign(p, { mouth: 'flat', brows: 'frown', look: [-.6, 0] });
  if (c.tag === 'motorbike') Object.assign(p, { mouth: 'grin', eyes: 'happy', armL: 1.2, armR: -1.2, prop: null });
  if (['key', 'keyWin', 'star'].includes(c.tag)) Object.assign(p, { mouth: 'grin', eyes: 'happy' });
  return p;
}
function placeChar(ch, who, t) {
  const sp = spreadAt(t), [x, z] = SPOT[who][sp];
  let k = 0; for (const [r, f] of spreadWindow(sp)) k = Math.max(k, back(seg(t, r + .25, r + .7), 1.6) * (1 - ss(seg(t, f - .05, f + .3))));
  if (t < .9) k = back(seg(t, .5, 1.1), 1.6);
  ch.root.position.set(x, 0, z); ch.root.rotation.x = -(Math.PI / 2) * (1 - Math.min(1, k)); ch.root.visible = k > .003;
  ch.shadow.position.set(x, .0005, z + .003); ch.shadow.visible = k > .6;
  // little hop when excited
  const c = CUES.find(q => t >= q.t0 && t < q.t1) || {};
  if (who === 'orso' && ['swapped', 'keyWin', 'andiamo'].includes(c.tag)) { const u = (t - c.t0) % .55 / .55; ch.root.position.y = Math.sin(Math.PI * u) * .01; }
}

// ---------- camera ----------
const SHOT = {
  hotelWide: [0, .1, .58, -.01, .065, .1, 36], orsoHotel: [-.07, .085, .44, -.08, .055, .17, 34], giuliaHotel: [.09, .1, .4, .04, .072, .1, 32],
  alphaTop: [0, .34, .5, 0, .0, .1, 36], vowels: [0, .16, .62, 0, .02, .18, 36], vowelsClose: [0, .13, .58, 0, .02, .2, 36],
  street: x => [x, .14, .44, x, .14, .0, 34], streetWide: [0, .13, .62, 0, .12, .02, 36], scooter: [0, .09, .52, 0, .035, .2, 36],
  map: [0, .55, .36, 0, 0, .16, 36], mapCity: (x, z) => [x * .6, .3, z + .22, x * .8, 0, z, 34],
};
const keys = [];
const K = (t, s) => keys.push([t, s]);
K(0, [0, .3, .75, 0, .02, .1, 36]); K(1.2, SHOT.hotelWide);
K(cue('g01').t0, SHOT.giuliaHotel); K(at('spellEN').t0, SHOT.orsoHotel); K(cue('n01').t0 + 2.5, SHOT.hotelWide); K(at('turn1').t0, [0, .25, .62, 0, .03, .12, 36]);
K(at('turn1').t1, SHOT.alphaTop); K(at('letters21').t1, SHOT.alphaTop); K(at('vowelsWrong').t0 + .8, SHOT.vowels);
K(cue('g02').t0, SHOT.vowelsClose); K(at('swap').t1, SHOT.vowels); K(at('turn2').t0, SHOT.streetWide);
for (const s of signs) { const c1 = CUES.find(c => c.letter === s.L); if (c1) K(c1.t0 - .1, SHOT.street(s.x)); }
K(at('motorbike').t0 - .3, SHOT.scooter); K(at('motorbike').t1 + .2, SHOT.scooter); K(at('strip').t0, SHOT.streetWide); K(at('turn3').t0, SHOT.streetWide);
K(at('turn3').t1, SHOT.map); K(at('cities').t0, SHOT.map); K(at('doppia').t1, SHOT.map);
K(at('turn4').t1, SHOT.hotelWide); K(cue('g13').t0, SHOT.giuliaHotel); K(at('spellIT').t0 + .2, SHOT.orsoHotel); K(cue('g14').t0, SHOT.hotelWide);
K(at('quiz').t0, [0, .12, .66, 0, .07, .1, 36]); K(at('recap').t0, [0, .15, .7, 0, .07, .1, 36]); K(TL.DUR, [0, .2, .82, 0, .06, .1, 36]);
keys.sort((a, b) => a[0] - b[0]);
for (let i = keys.length - 1; i > 0; i--) if (keys[i][0] - keys[i - 1][0] < .05) keys.splice(i - 1, 1);
// hold each shot until shortly before the next one, then move
for (let i = keys.length - 1; i > 0; i--) if (keys[i][0] - keys[i - 1][0] > .8) keys.splice(i, 0, [keys[i][0] - .45, keys[i - 1][1]]);
const camT = track(keys);

// ---------- overlay content ----------
const VCARD = [['A', 'a', '[ah]', 'amore · love'], ['E', 'e', '[eh] like “bed”', 'Elena'], ['I', 'i', '[ee] like “see”', 'Italia'], ['O', 'o', '[oh]', 'oro · gold'], ['U', 'u', '[oo] like “food”', 'uva · grapes']];
const LCARD = { H: ['acca', '[AHK-kah]', 'silent: hotel = “otel”'], CG: ['ci · gi', '[chee] · [jee]', 'ciao · gelato'], Q: ['cu', '[koo]', 'quadro · painting'], R: ['erre', '[ER-reh] rolled!', 'Roma'], Z: ['zeta', '[DZEH-tah]', 'zero'] };
const BUBBLES = CUES.filter(c => c.bubble).map(c => ({ t0: c.t0, t1: c.t1, text: c.bubble, en: c.en, it: true, who: c.who }));
BUBBLES.push({ t0: at('spellEN').t0, t1: at('spellEN').t1, text: '“Oh… Ar… Ess… Oh!”', who: 'orso' });
BUBBLES.push({ t0: at('vowelsWrong').t0 + 2.2, t1: at('vowelsWrong').t1, text: '“Ay, ee, eye, oh, you?”', who: 'orso' });
BUBBLES.push({ t0: at('motorbike').t0, t1: at('motorbike').t1, text: 'Rrrrrrr…!', who: 'orso' });
const QUIZ = { t0: at('quiz').t0, t1: at('star').t1, pause: at('countdown').t0, reveal: at('answer').t0, question: 'What’s the Italian name of the letter H?', options: ['a)  aitch', 'b)  acca', 'c)  hey'], answer: 1 };

function drawHUD(t) {
  OV.clearRect(0, 0, W, H);
  // objectives
  const ob = at('objectives'); HUD.drawBanner(OV, t, ob.t0, ob.t1, ['LESSON 1.1', 'THE ITALIAN ALPHABET']);
  HUD.drawTags(OV, t, ob.t0 + 1, ob.t1, ['Say the 21 letters', 'Spot the 5 “foreign” letters', 'Spell your name like an Italian']);
  const l21 = at('letters21'); HUD.drawLabel(OV, t, l21.t0 + .3, l21.t1, '21 letters · J K W X Y = foreign', 300);
  const rd = at('read'); HUD.drawLabel(OV, t, rd.t0, rd.t1, 'Read it the way it’s written!', 300, '#1f8a4c');
  const vw = at('vowelsWrong'); HUD.drawLabel(OV, t, vw.t0, vw.t1, 'Careful: vowels!', 300);
  CUES.filter(c => c.vowel != null).forEach(c => { const [L, n, pr, ex] = VCARD[c.vowel]; HUD.drawLetterCard(OV, t, { t0: c.t0, t1: c.t1 + .1, letter: L, name: n, pron: pr, ex }); });
  const sw = at('swap'); HUD.drawLabel(OV, t, sw.t0 + 1, sw.t1 + .9, 'E = “eh”   ·   I = “ee”', 300, '#1f8a4c');
  for (const L of Object.keys(LCARD)) { const cs = CUES.filter(c => c.letter === L); if (!cs.length) continue; const [n, pr, ex] = LCARD[L];
    HUD.drawLetterCard(OV, t, { t0: cs[0].t0, t1: cs[cs.length - 1].t1, letter: L === 'CG' ? 'C G' : L, name: n, pron: pr, ex }); }
  const st = at('strip'); HUD.drawStrip(OV, t, st.t0 + .8, st.t1, [['F', 'effe'], ['L', 'elle'], ['M', 'emme'], ['N', 'enne'], ['S', 'esse'], ['V', 'vu']]);
  const mp = at('map'); HUD.drawLabel(OV, t, mp.t0 + 2.5, at('cities').t1, 'A come Ancona  =  A like Ancona', 300);
  const dp = at('doppia'); HUD.drawDoppia(OV, t, dp.t0 + .8, dp.t1 + .3);
  HUD.drawQuiz(OV, t, QUIZ);
  const rc = at('recap'); HUD.drawRecap(OV, t, rc.t0, TL.DUR, ['21 letters (J K W X Y = foreign)', 'E = “eh”,  I = “ee”', 'H = acca (silent)', 'Spell with cities: A come Ancona']);
  HUD.drawEnd(OV, t, rc.t0 + 4.5, 'Follow for', 'Lesson 1.2 · Vowels & Stress');
  // bubbles
  const v = new THREE.Vector3();
  for (const b of BUBBLES) { if (t < b.t0 - .05 || t > b.t1 + .8) continue; const ch = b.who === 'orso' ? orso : giulia; ch.head(v).project(cam); HUD.drawBubble(OV, t, b, (v.x + 1) / 2 * W, (1 - v.y) / 2 * H); }
  // Giulia's "?" during the English spelling
  const se = at('spellEN'); if (t > se.t0 + .6 && t < se.t1 + 2) { giulia.head(v).project(cam); const k = back(seg(t, se.t0 + .6, se.t0 + .9), 2);
    OV.save(); OV.translate((v.x + 1) / 2 * W + 60, (1 - v.y) / 2 * H - 40); OV.scale(k, k); OV.font = '150px "Lilita One"'; OV.textAlign = 'center'; OV.lineWidth = 14; OV.strokeStyle = '#3a2a24'; OV.strokeText('?', 0, 0); OV.fillStyle = '#d23a35'; OV.fillText('?', 0, 0); OV.restore(); }
  HUD.drawCaption(OV, t, chunks);
  // fade in / out
  const f = Math.max(1 - seg(t, 0, .25), seg(t, TL.DUR - .5, TL.DUR));
  if (f > 0) { OV.fillStyle = `rgba(0,0,0,${f})`; OV.fillRect(0, 0, W, H); }
}

// ---------- render ----------
const sv = new THREE.Vector3();
window.render = t => {
  // book open, and closing at the very end
  const close = ss(seg(t, at('close').t0, at('close').t1));
  book.setOpen(Math.PI / 2 * (eio(seg(t, .15, 1.05)) * (1 - close)));
  // page turns
  let leaf = 0;
  for (const tr of TURNS) if (t >= tr.t0 && t <= tr.t1) {
    const u = eio(seg(t, tr.t0 + .2, tr.t1)); leaf = u;
    const from = SP[TURNS[TURNS.indexOf(tr) - 1]?.to ?? 0];
    book.leafFront.material.map = from.ground; book.leafBack.material.map = SP[tr.to].back;
    book.leafFront.material.emissiveMap = from.ground; book.leafBack.material.emissiveMap = SP[tr.to].back;
    book.leafFront.material.needsUpdate = book.leafBack.material.needsUpdate = true;
  }
  book.setLeaf(leaf > 0 && leaf < 1 ? leaf : 0);
  const sp = spreadAt(t), last = [...TURNS].reverse().find(tr => t >= tr.t0);
  book.groundMat.map = SP[sp].ground;
  book.backMat.map = SP[last && t < last.t1 ? (TURNS[TURNS.indexOf(last) - 1]?.to ?? 0) : sp].back;
  updatePops(t);
  // the five foreign letters jump into the box
  const l21 = at('letters21');
  for (const p of tiles) {
    if (!FOREIGN.includes(p.ch)) continue;
    const i = FOREIGN.indexOf(p.ch), j0 = l21.t0 + 3.6 + i * .35, u = eio(seg(t, j0, j0 + .7));
    const tgt = new THREE.Vector3(fbox.base.x - .02 + i * .01, .02, fbox.base.z - .008);
    p.g.position.lerpVectors(p.home, tgt, u); p.g.position.y += Math.sin(Math.PI * u) * .05;
    p.g.rotation.z = u * (i % 2 ? 1 : -1) * 1.2; if (u >= 1) p.g.visible = false;
  }
  // vowel cards: flip red when Orso misreads, swap E and I
  const sw = at('swap'), su = eio(seg(t, sw.t0 + 2.5, sw.t0 + 3.6));
  vtiles[1].g.position.x = lerp(-.03, 0, su); vtiles[2].g.position.x = lerp(0, -.03, su);
  vtiles[1].g.position.y = vtiles[2].g.position.y = Math.sin(Math.PI * su) * .03;
  const lit = CUES.find(c => c.vowel != null && t >= c.t0 && t < c.t1);
  vtiles.forEach((v, i) => { v.g.position.y += lit && lit.vowel === i ? .008 : 0; });
  // street signs drop on strings when their letter comes up
  for (const s of signs) {
    const cs = CUES.filter(c => c.letter === s.L), c1 = cs[0], end = cs[cs.length - 1]?.t1 ?? 0;
    const up = sp === 2 && c1 ? back(seg(t, c1.t0 - .4, c1.t0), 1.4) * (1 - ss(seg(t, end + .3, end + .7))) : 0;
    const out = sp !== 2 ? 1 : 0; s.g.visible = sp === 2 && up > .01; s.g.position.y = .3 - (.3 - .15) * up; s.g.rotation.z = Math.sin((t - (c1?.t0 ?? 0)) * 3) * .06 * Math.exp(-(t - (c1?.t0 ?? 0)) * .8) * up; void out;
  }
  // scooter rides across during the rolled R
  const mb = at('motorbike'), mu = seg(t, mb.t0, mb.t1 + .3); scoot.g.position.x = lerp(-.2, .22, mu); scoot.g.position.y = Math.abs(Math.sin(t * 30)) * .002;
  // the room key drops into Orso's paw
  const kc = at('key'); const ku = eo(seg(t, kc.t0, kc.t0 + .5)); key.visible = t > kc.t0 && spreadAt(t) === 0 && t < at('quiz').t0;
  key.position.set(SPOT.orso[0][0] + .03, lerp(.25, .055, ku), SPOT.orso[0][1] + .01); key.rotation.z = Math.sin(t * 4) * .2 * (1 - ku * .7);
  // star on the right answer
  const sr = at('star'), sk = back(seg(t, sr.t0, sr.t0 + .4), 2); starM.visible = sk > .01 && t < sr.t1 + .5; starM.position.set(-.06, .12 + Math.sin(t * 3) * .005, .2); starM.scale.setScalar(Math.max(.01, sk)); starM.rotation.z = t * .8;
  // characters
  orso.pose(poseOrso(t)); giulia.pose(poseGiulia(t)); placeChar(orso, 'orso', t); placeChar(giulia, 'giulia', t);
  // camera
  const c = camT(t); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); cam.fov = c[6]; cam.updateProjectionMatrix();
  post.dof.focus = cam.position.distanceTo(sv.set(c[3], c[4], c[5])); post.dof.aper = 3; post.dof.maxCoc = 10;
  scene.updateMatrixWorld(); post.composer.render();
  drawHUD(t);
};

// ---------- sound events for the mix ----------
const EV = [];
for (const c of CUES) if (c.id) EV.push({ t: c.t0, type: c.n ? 'vo' : 'it', id: c.id });
EV.push({ t: .15, type: 'open' }, { t: at('close').t0, type: 'closeBook' });
for (const tr of TURNS) EV.push({ t: tr.t0 + .15, type: 'turn' });
for (const p of pops) for (const [r] of spreadWindow(p.sp)) { const tt = (p.show ?? r + p.delay); if (tt < TL.DUR) EV.push({ t: tt + .05, type: 'pop', pan: clamp(p.base.x * 4, -1, 1) }); }
FOREIGN.split('').forEach((_, i) => EV.push({ t: at('letters21').t0 + 3.6 + i * .35 + .6, type: 'plink' }));
EV.push({ t: at('swap').t0 + 2.5, type: 'swish' }, { t: at('motorbike').t0, type: 'scooter' }, { t: at('key').t0 + .45, type: 'keytink' }, { t: QUIZ.pause, type: 'stamp' },
  { t: QUIZ.reveal, type: 'ding' }, { t: at('star').t0, type: 'sparkle' });
for (let i = 0; i < 3; i++) EV.push({ t: QUIZ.pause + .4 + i * (QUIZ.reveal - QUIZ.pause - .4) / 3, type: 'tick' });
for (const s of signs) { const c1 = CUES.find(c => c.letter === s.L); if (c1) EV.push({ t: c1.t0 - .1, type: 'tink' }); }
for (const b of BUBBLES) EV.push({ t: b.t0, type: 'bubble', who: b.who, n: b.text.length, dur: Math.max(.4, (b.t1 - b.t0) * .85) });
EV.push({ t: .3, type: 'music', cue: 'main' });
window.EV = EV.sort((a, b) => a.t - b.t);
window.DUR = TL.DUR;
window.CUES = CUES;
window.TEXTS = t => [];
window.READY = true;
