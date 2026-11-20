// Parla Italiano! · Lesson 1.2 · Vowels & Stress. Vertical 1080×1920, everything a pure function of t.
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

// spread 0: café
popup(0, S.plant(), .15, .05, { s: 1.1 });
popup(0, S.counter('CAFFÈ'), .05, .125);
popup(0, S.suitcase(), -.115, .19);
const cupP = popup(0, S.cup(), .02, .119, { y: .033, show: at('ecco').t0 });
// spread 1: five big vowel tiles
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const vtiles = VOWELS.map((ch, i) => popup(1, S.letterTile(ch, .024, '#fff3c4'), (i - 2) * .03, .1, { s: 1.15, delay: .3 + i * .12 }));
// spread 3: the bishop's hat (papa) and the baby-food bowl (pappa) on stage
const g06 = cue('g06');
popup(3, S.mitre(), -.035, .17, { show: g06.t0, hide: cue('g07').t0, s: 1.2 });
popup(3, S.bowl(), .035, .17, { show: (g06.t0 + g06.t1) / 2, hide: cue('g07').t0, s: 1.2 });
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
const SPOT = { orso: [[-.085, .19], [-.058, .235], [-.058, .225], [-.06, .225]], giulia: [[.04, .1], [.058, .235], [.058, .225], [.06, .225]] };
const speaking = (who, t) => CUES.some(c => c.who === who && t >= c.t0 && t < c.t1 - .05);
const talk = t => (Math.floor(t * 9) % 2 ? 'open' : 'smile');
const blink = t => ((t % 3.7) < .1 ? 1 : 0);
const cueAt = t => CUES.find(k => t >= k.t0 && t < k.t1 + .12) || {};

function poseOrso(t) {
  const p = { brows: 'neutral', mouth: 'smile', blink: blink(t) };
  const c = cueAt(t);
  if (speaking('orso', t)) Object.assign(p, { mouth: talk(t), brows: 'up', eyes: 'open', armR: -1.4 });
  if (c.tag === 'laugh') Object.assign(p, { mouth: 'o', eyes: 'wide', brows: 'up' });
  if (c.tag === 'hookVO') Object.assign(p, { mouth: 'worried', brows: 'worried', look: [.5, -.4] });
  if (c.tag === 'glide') Object.assign(p, { mouth: talk(t), brows: 'up' });
  if (c.tag === 'vowels' || c.tag === 'notte') Object.assign(p, { mouth: 'o', eyes: 'open', brows: 'up' });
  if (c.tag === 'openClosed') Object.assign(p, { mouth: 'grin', eyes: 'happy', prop: 'thumb', armR: -1.9 });
  if (sp(t) === 2) Object.assign(p, { propL: 'book', armL: .9 });
  if (c.tag === 'mistake') Object.assign(p, { mouth: 'worried', brows: 'worried', eyes: 'open', armR: -2.9, look: [0, .5] });
  if (['win', 'clap', 'star'].includes(c.tag)) Object.assign(p, { mouth: 'grin', eyes: 'happy', brows: 'up', prop: 'thumb', armR: -1.9 });
  if (c.tag === 'countdown') Object.assign(p, { look: [0, -.8], brows: 'up', mouth: 'flat' });
  if (c.tag === 'ciao' || c.tag === 'close') Object.assign(p, { mouth: c.tag === 'ciao' ? talk(t) : 'grin', eyes: 'happy', armR: -2.6 });
  return p;
}
function poseGiulia(t) {
  const p = { brows: 'neutral', mouth: 'smile', blink: blink(t + 1.3) };
  const c = cueAt(t), s = sp(t);
  if (s === 2 || s === 3) Object.assign(p, { prop: 'flag', armR: -.9 });
  if (speaking('giulia', t)) Object.assign(p, { mouth: talk(t), brows: 'up', prop: s ? 'point' : p.prop, armR: s ? -1.6 : p.armR });
  if (c.tag === 'laugh' || c.tag === 'mistake') Object.assign(p, { mouth: 'grin', eyes: 'happy', brows: 'up', armL: 1.2, armR: -1.2, prop: null });
  if (c.tag === 'glide') Object.assign(p, { mouth: 'flat', brows: 'frown', look: [-.6, 0] });
  if (['clap', 'win', 'star'].includes(c.tag)) Object.assign(p, { mouth: 'grin', eyes: 'happy', armL: 1.2, armR: -1.2, prop: null });
  return p;
}
function placeChar(ch, who, t) {
  const s = sp(t), [x, z] = SPOT[who][s];
  let k = 0; for (const [r, f] of spreadWindow(s)) k = Math.max(k, back(seg(t, r + .25, r + .7), 1.6) * (1 - ss(seg(t, f - .05, f + .3))));
  if (t < .9) k = back(seg(t, .5, 1.1), 1.6);
  ch.root.position.set(x, 0, z); ch.root.rotation.x = -(Math.PI / 2) * (1 - Math.min(1, k)); ch.root.visible = k > .003;
  ch.shadow.position.set(x, .0005, z + .003); ch.shadow.visible = k > .6;
  const c = CUES.find(q => t >= q.t0 && t < q.t1) || {};
  const hop = (who === 'orso' && ['win', 'clap', 'ciao', 'openClosed'].includes(c.tag)) || (who === 'giulia' && ['laugh', 'clap'].includes(c.tag));
  if (hop) { const u = (t - c.t0) % .55 / .55; ch.root.position.y = Math.sin(Math.PI * u) * .01; }
}
function sp(t) { return spreadAt(t); }

// ---------- camera ----------
const SHOT = {
  cafeWide: [0, .1, .58, -.01, .065, .1, 36], orsoCafe: [-.07, .085, .44, -.08, .055, .17, 34], giuliaCafe: [.09, .1, .4, .04, .072, .1, 32],
  vowels: [0, .15, .72, 0, .035, .17, 36], vowelsClose: [0, .12, .62, 0, .035, .18, 34],
  streetWide: [0, .12, .7, 0, .07, .08, 36], stage: [0, .12, .66, 0, .07, .1, 36], stageClose: [0, .1, .56, 0, .05, .14, 34],
};
const keys = [];
const K = (t, s) => keys.push([t, s]);
K(0, [0, .3, .75, 0, .02, .1, 36]); K(1.2, SHOT.cafeWide);
K(cue('o01').t0, SHOT.orsoCafe); K(at('laugh').t0, SHOT.giuliaCafe); K(at('hookVO').t0 + 1.5, SHOT.cafeWide); K(at('turn1').t0, [0, .25, .62, 0, .03, .12, 36]);
K(at('turn1').t1, SHOT.vowels); K(at('glide').t0 + .5, SHOT.vowelsClose); K(at('final').t0, SHOT.vowels); K(at('openClosed').t1, SHOT.vowels);
K(at('turn2').t0, SHOT.streetWide); K(at('turn2').t1, SHOT.streetWide); K(at('bonus').t1, SHOT.streetWide);
K(at('turn3').t1, SHOT.stage); K(cue('g06').t0, SHOT.stageClose); K(cue('g07').t0, SHOT.stage); K(at('gatto').t1, SHOT.stage);
K(at('turn4').t1, SHOT.cafeWide); K(cue('o02').t0, SHOT.orsoCafe); K(cue('g09').t0, SHOT.giuliaCafe); K(cue('o03').t0, SHOT.orsoCafe); K(at('clap').t0, SHOT.cafeWide);
K(at('quiz').t0, [0, .12, .66, 0, .07, .1, 36]); K(at('recap').t0, [0, .15, .7, 0, .07, .1, 36]); K(TL.DUR, [0, .2, .82, 0, .06, .1, 36]);
keys.sort((a, b) => a[0] - b[0]);
for (let i = keys.length - 1; i > 0; i--) if (keys[i][0] - keys[i - 1][0] < .05) keys.splice(i - 1, 1);
for (let i = keys.length - 1; i > 0; i--) if (keys[i][0] - keys[i - 1][0] > .8) keys.splice(i, 0, [keys[i][0] - .45, keys[i - 1][1]]);
const camT = track(keys);

// ---------- overlay content ----------
const VCARD = [['A', 'casa', '[KAH-zah]', 'house'], ['E', 'bene', '[BEH-neh]', 'well'], ['I', 'vino', '[VEE-noh]', 'wine'], ['O', 'sole', '[SOH-leh]', 'sun'], ['U', 'uno', '[OO-noh]', 'one']];
const BUBBLES = CUES.filter(c => c.bubble).map(c => ({ t0: c.t0, t1: c.t1, text: c.bubble, en: c.en, it: true, who: c.who }));
BUBBLES.push({ t0: at('glide').t0 + .6, t1: at('glide').t0 + 3.2, text: '“Vee-noh-oo? Soh-lay?”', who: 'orso' });
const QUIZ = { t0: at('quiz').t0, t1: at('star').t1, pause: at('countdown').t0, reveal: at('answer').t0, question: 'Which word means “grandpa”?', options: ['a)  nono', 'b)  nonno', 'c)  nonna'], answer: 1 };
const split = (c, n) => [...Array(n)].map((_, i) => c.t0 + (c.t1 - c.t0) * i / n);

function drawHUD(t) {
  OV.clearRect(0, 0, W, H);
  // hook: the misunderstanding
  const lg = at('laugh'); HUD.drawLabel(OV, t, lg.t0 + .2, at('hookVO').t0 + 4, 'nono = NINTH ?!', 300);
  // objectives
  const ob = at('objectives'); HUD.drawBanner(OV, t, ob.t0, ob.t1, ['LESSON 1.2', 'VOWELS & STRESS']);
  HUD.drawTags(OV, t, ob.t0 + 1, ob.t1, ['5 pure vowels', 'Stress the right syllable', 'Double letters change meaning']);
  const gl = at('glide'); HUD.drawLabel(OV, t, gl.t0 + 3, gl.t1, 'No glide! Short & pure', 300, '#1f8a4c');
  // vowel cards, one per fifth of Giulia's line
  const g01 = cue('g01'), vs = split(g01, 5);
  VCARD.forEach(([L, w, pr, gloss], i) => HUD.drawLetterCard(OV, t, { t0: vs[i], t1: (vs[i + 1] ?? g01.t1 + .6), letter: L, name: w, pron: pr, ex: gloss }));
  const fn = at('final'); HUD.drawLabel(OV, t, fn.t0 + .3, fn.t1, 'Say every vowel, even the last!', 300);
  const nt = at('notte'); HUD.drawLetterCard(OV, t, { t0: nt.t0, t1: nt.t1 + 1.2, letter: 'e!', name: 'notte', pron: '[NOHT-teh]', ex: 'night', note: 'say the final e' });
  const oc = at('openClosed'); HUD.drawLabel(OV, t, oc.t0 + 3, oc.t1, 'Open or closed E / O? Relax!', 300, '#1f8a4c');
  // stress
  const st = at('stress'); HUD.drawLabel(OV, t, st.t0 + .2, st.t1, 'One strong syllable per word', 300);
  const s1 = cue('g03'), s1t = split(s1, 3);
  HUD.drawSyllables(OV, t, s1.t0 - .4, at('further').t1, [{ syl: ['CA', 'sa'], stress: 0, t: s1t[0] }, { syl: ['i', 'TA', 'lia'], stress: 1, t: s1t[1] }, { syl: ['a', 'MI', 'co'], stress: 1, t: s1t[2] }], 'Usually: the one before last');
  const s2 = cue('g04'); HUD.drawSyllables(OV, t, s2.t0 - .3, s2.t1 + .8, [{ syl: ['TA', 'vo', 'lo'], stress: 0, gloss: 'table', t: s2.t0 }], 'Sometimes: one further back');
  const ac = at('accents'), s3 = cue('g05'), s3t = split(s3, 4);
  HUD.drawSyllables(OV, t, ac.t0 + 3.5, s3.t1 + .6, [{ syl: ['cit', 'TÀ'], stress: 1, gloss: 'city', t: Math.min(ac.t0 + 5.8, s3t[0]) }, { syl: ['caf', 'FÈ'], stress: 1, gloss: 'coffee', t: Math.min(ac.t0 + 6.6, s3t[1]) }, { syl: ['per', 'CHÉ'], stress: 1, gloss: 'why', t: Math.min(ac.t0 + 7.4, s3t[2]) }, { syl: ['PIÙ'], stress: 0, gloss: 'more', t: Math.min(ac.t0 + 8.2, s3t[3]) }], 'Accent on the last vowel = stress there!');
  const bn = at('bonus'); HUD.drawPair(OV, t, bn.t0 + .3, bn.t1 + .3, { word: 'è', pron: '[eh]', gloss: 'is', dt: 2.5 }, { word: 'e', pron: '[eh]', gloss: 'and', dt: 2.5 });
  // doubles
  const db = at('doubles'); HUD.drawLabel(OV, t, db.t0 + .3, db.t1, 'Double = hold it longer', 300);
  const pp = cue('g06'); HUD.drawPair(OV, t, pp.t0, pp.t1 + .4, { word: 'papa', pron: '[PAH-pah]', gloss: 'Pope', dt: (pp.t1 - pp.t0) / 2 }, { word: 'pappa', pron: '[PAHP-pah]', gloss: 'baby food', dbl: [2, 4], dt: (pp.t1 - pp.t0) / 2 }, 400);
  const nn = cue('g07'); HUD.drawPair(OV, t, nn.t0, at('mistake').t1, { word: 'nono', pron: '[NOH-noh]', gloss: 'ninth', dt: (nn.t1 - nn.t0) / 2 }, { word: 'nonno', pron: '[NOHN-noh]', gloss: 'grandpa', dbl: [2, 4], dt: (nn.t1 - nn.t0) / 2 }, 400);
  const tr = at('trick'); HUD.drawLabel(OV, t, tr.t0 + .3, tr.t0 + 6, 'Trick: “blac(k) cat”', 300, '#1f8a4c');
  const gt = at('gatto'); HUD.drawPair(OV, t, tr.t0 + 6.4, gt.t1 + .6, { word: 'gatto', pron: '[GAHT-toh]', gloss: 'cat', dbl: [2, 4], dt: .8 }, { word: 'mamma', pron: '[MAHM-mah]', gloss: 'mom', dbl: [2, 4], dt: .8 }, 400);
  const wn = at('win'); HUD.drawLabel(OV, t, wn.t0, wn.t1 + .3, 'nonno ✔   caffè ✔', 300, '#1f8a4c');
  HUD.drawQuiz(OV, t, QUIZ);
  const rc = at('recap'); HUD.drawRecap(OV, t, rc.t0, TL.DUR, ['5 short, pure vowels', 'Say the final vowel', 'Stress: usually one-before-last', 'città, caffè: accent = stress', 'nono (9th) ≠ nonno (grandpa)']);
  HUD.drawEnd(OV, t, at('next').t0, 'Follow for', 'Lesson 1.3 · Special Letter Combos');
  // bubbles
  const v = new THREE.Vector3();
  for (const b of BUBBLES) { if (t < b.t0 - .05 || t > b.t1 + .8) continue; const ch = b.who === 'orso' ? orso : giulia; ch.head(v).project(cam); HUD.drawBubble(OV, t, b, (v.x + 1) / 2 * W, (1 - v.y) / 2 * H); }
  HUD.drawCaption(OV, t, chunks);
  const f = Math.max(1 - seg(t, 0, .25), seg(t, TL.DUR - .5, TL.DUR));
  if (f > 0) { OV.fillStyle = `rgba(0,0,0,${f})`; OV.fillRect(0, 0, W, H); }
}

// ---------- render ----------
const sv = new THREE.Vector3();
window.render = t => {
  const close = ss(seg(t, at('close').t0, at('close').t1));
  book.setOpen(Math.PI / 2 * (eio(seg(t, .15, 1.05)) * (1 - close)));
  let leaf = 0;
  for (const tr of TURNS) if (t >= tr.t0 && t <= tr.t1) {
    const u = eio(seg(t, tr.t0 + .2, tr.t1)); leaf = u;
    const from = SP[TURNS[TURNS.indexOf(tr) - 1]?.to ?? 0];
    book.leafFront.material.map = from.ground; book.leafBack.material.map = SP[tr.to].back;
    book.leafFront.material.emissiveMap = from.ground; book.leafBack.material.emissiveMap = SP[tr.to].back;
    book.leafFront.material.needsUpdate = book.leafBack.material.needsUpdate = true;
  }
  book.setLeaf(leaf > 0 && leaf < 1 ? leaf : 0);
  const s = spreadAt(t), last = [...TURNS].reverse().find(tr => t >= tr.t0);
  book.groundMat.map = SP[s].ground;
  book.backMat.map = SP[last && t < last.t1 ? (TURNS[TURNS.indexOf(last) - 1]?.to ?? 0) : s].back;
  updatePops(t);
  // vowel tiles: wobble while Orso glides, hop when Giulia says each one
  const gl = at('glide'), wob = seg(t, gl.t0 + .6, gl.t0 + 3.2) > 0 && t < gl.t0 + 3.2 ? 1 : 0;
  const g01 = cue('g01'), vi = t >= g01.t0 && t < g01.t1 ? Math.floor((t - g01.t0) / (g01.t1 - g01.t0) * 5) : -1;
  vtiles.forEach((v, i) => { v.g.rotation.z = wob * Math.sin(t * 9 + i) * .25; v.g.position.y = vi === i ? .01 : 0; });
  // star on the right answer
  const sr = at('star'), sk = back(seg(t, sr.t0, sr.t0 + .4), 2); starM.visible = sk > .01 && t < sr.t1 + .5; starM.position.set(-.06, .12 + Math.sin(t * 3) * .005, .2); starM.scale.setScalar(Math.max(.01, sk)); starM.rotation.z = t * .8;
  orso.pose(poseOrso(t)); giulia.pose(poseGiulia(t)); placeChar(orso, 'orso', t); placeChar(giulia, 'giulia', t);
  const c = camT(t); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); cam.fov = c[6]; cam.updateProjectionMatrix();
  post.dof.focus = cam.position.distanceTo(sv.set(c[3], c[4], c[5])); post.dof.aper = 3; post.dof.maxCoc = QS.has('nodof') ? 0 : 10;
  scene.updateMatrixWorld(); post.composer.render();
  drawHUD(t);
};

// ---------- sound events for the mix ----------
const EV = [];
for (const c of CUES) if (c.id) EV.push({ t: c.t0, type: c.n ? 'vo' : 'it', id: c.id });
EV.push({ t: .15, type: 'open' }, { t: at('close').t0, type: 'closeBook' });
for (const tr of TURNS) EV.push({ t: tr.t0 + .15, type: 'turn' });
for (const p of pops) for (const [r] of spreadWindow(p.sp)) { const tt = (p.show ?? r + p.delay); if (tt < TL.DUR) EV.push({ t: tt + .05, type: 'pop', pan: clamp(p.base.x * 4, -1, 1) }); }
split(cue('g01'), 5).forEach(tt => EV.push({ t: tt, type: 'plink' }));
EV.push({ t: gl0(), type: 'swish' }, { t: at('clap').t0, type: 'keytink' }, { t: QUIZ.pause, type: 'stamp' }, { t: QUIZ.reveal, type: 'ding' }, { t: at('star').t0, type: 'sparkle' });
for (let i = 0; i < 3; i++) EV.push({ t: QUIZ.pause + .4 + i * (QUIZ.reveal - QUIZ.pause - .4) / 3, type: 'tick' });
for (const tag of ['syl1', 'syl2', 'syl3']) { const c = at(tag), n = tag === 'syl3' ? 4 : tag === 'syl1' ? 3 : 1; split(c, n).forEach(tt => EV.push({ t: tt + .3, type: 'tink' })); }
for (const b of BUBBLES) EV.push({ t: b.t0, type: 'bubble', who: b.who, n: b.text.length, dur: Math.max(.4, (b.t1 - b.t0) * .85) });
function gl0() { return at('glide').t0 + 3.2; }
EV.push({ t: .3, type: 'music', cue: 'main' });
window.EV = EV.sort((a, b) => a.t - b.t);
window.DUR = TL.DUR;
window.CUES = CUES;
window.TEXTS = t => [];
window.READY = true;
