// Deep Space Cinema · the ship: a fictional long-spine cruiser (forward = +z, about 125 units long).
// Hull: merged boxes/cylinders with UVs in world units, procedural panel maps, greebles, windows drawn in the shader.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry } from '/core/lib.js';

export const LIGHT_A = new THREE.Color('#6fd6ff');   // ice blue
export const LIGHT_B = new THREE.Color('#a48cff');   // soft violet

// —— Procedural panel maps (colour / bump / roughness), one 1024 tile = 8 × 8 world units ——
function panelMaps(seed) {
  const N = 1024, R = mulberry(seed);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const cc = mk(), cb = mk(), cr = mk();
  const gc = cc.getContext('2d'), gb = cb.getContext('2d'), gr = cr.getContext('2d');
  gc.fillStyle = '#6c7076'; gc.fillRect(0, 0, N, N); gb.fillStyle = '#808080'; gb.fillRect(0, 0, N, N); gr.fillStyle = '#909090'; gr.fillRect(0, 0, N, N);
  // recursive plate split
  const plates = [];
  (function split(x, y, w, h, d) {
    if (d > 5 || (d > 2 && R() < .25) || w < 40 || h < 40) { plates.push([x, y, w, h]); return; }
    if (w > h ? R() < .8 : R() < .2) { const s = Math.round(w * (.3 + .4 * R())); split(x, y, s, h, d + 1); split(x + s, y, w - s, h, d + 1); }
    else { const s = Math.round(h * (.3 + .4 * R())); split(x, y, w, s, d + 1); split(x, y + s, w, h - s, d + 1); }
  })(0, 0, N, N, 0);
  for (const [x, y, w, h] of plates) {
    const v = 66 + Math.floor(R() * 30), tint = R() < .12 ? -18 : 0;
    gc.fillStyle = `rgb(${v + tint},${v + 2 + tint},${v + 6 + tint})`; gc.fillRect(x, y, w, h);
    const bh = 128 + Math.floor((R() - .5) * 40) + (R() < .15 ? 40 : 0); gb.fillStyle = `rgb(${bh},${bh},${bh})`; gb.fillRect(x, y, w, h);
    const rv = 90 + Math.floor(R() * 90); gr.fillStyle = `rgb(${rv},${rv},${rv})`; gr.fillRect(x, y, w, h);
    // grime gradient toward one edge
    const gg = gc.createLinearGradient(x, y, x, y + h); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, `rgba(20,18,16,${.15 * R()})`); gc.fillStyle = gg; gc.fillRect(x, y, w, h);
    // details: vents (parallel slots), rivets
    if (R() < .18 && w > 80 && h > 50) {
      const n = 4 + Math.floor(R() * 6), sx = x + w * .15, sw = w * .7;
      for (let i = 0; i < n; i++) { const yy = y + h * .2 + i * (h * .6 / n); gc.fillStyle = 'rgba(25,27,30,.85)'; gc.fillRect(sx, yy, sw, 3); gb.fillStyle = '#404040'; gb.fillRect(sx, yy, sw, 3); }
    }
    if (R() < .4) { gc.fillStyle = 'rgba(40,42,46,.7)'; gb.fillStyle = '#b0b0b0'; for (let i = 6; i < w - 4; i += 14) { gc.fillRect(x + i, y + 5, 2, 2); gc.fillRect(x + i, y + h - 7, 2, 2); gb.fillRect(x + i, y + 5, 2, 2); gb.fillRect(x + i, y + h - 7, 2, 2); } }
    // seams
    gc.strokeStyle = 'rgba(22,24,27,.9)'; gc.lineWidth = 2.5; gc.strokeRect(x + 1, y + 1, w - 2, h - 2);
    gb.strokeStyle = '#303030'; gb.lineWidth = 3; gb.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 8, 1 / 8); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cc, true), bump: tex(cb, false), rough: tex(cr, false) };
}

// —— Geometry helpers: UVs in world units, a per-vertex window density ——
function withWin(g, win) { const n = g.attributes.position.count; g.setAttribute('aWin', new THREE.BufferAttribute(new Float32Array(n).fill(win), 1)); return g; }
function boxGeo(w, h, d, R, o = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) { const ou = Math.floor(R() * 8), ov = Math.floor(R() * 8); for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] + ou, uv.getY(i) * dims[f][1] + ov); } }
  if (o.taper) {   // shrink the +z end
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0) { p.setX(i, p.getX(i) * o.taper[0]); p.setY(i, p.getY(i) * o.taper[1] + (o.taper[2] || 0)); }
    g.computeVertexNormals();
  }
  return withWin(g, o.win || 0);
}
function cylGeo(r0, r1, len, seg, R, o = {}) {
  const g = new THREE.CylinderGeometry(r0, r1, len, seg, 1, !!o.open);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * Math.max(r0, r1) + 3, uv.getY(i) * len);
  g.rotateX(Math.PI / 2);   // axis → z (r0 end at +z)
  return withWin(g, o.win || 0);
}

// —— Hull material: physical metal + windows in the shader ——
function hullMaterial(maps, U) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: maps.map, bumpMap: maps.bump, bumpScale: 2.2, roughnessMap: maps.rough, roughness: 1, metalness: .5, envMapIntensity: .35 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      attribute float aWin; varying float vWin; varying vec3 vWN; varying vec2 vU;`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
      vWin = aWin; vU = uv; vWN = normalize(mat3(modelMatrix) * normal);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying float vWin; varying vec3 vWN; varying vec2 vU; uniform float uTime, uWinGain; uniform vec3 uWinA, uWinB;
      float wh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if (vWin > 0. && abs(vWN.y) < .55) {
        vec2 q = vU / vec2(.62, 1.05); vec2 c = floor(q), f = fract(q);
        float deck = step(wh(vec2(c.y, 7.)), .62);                       // which decks have windows
        float block = step(wh(vec2(floor(c.x / 9.), c.y + 31.)), .55 + .2 * min(vWin, 1.));   // lit blocks
        float on = step(wh(c), .8) * deck * block;
        float fl = wh(c + floor(uTime * (.3 + wh(c + 3.) * .9) + wh(c + 9.) * 7.));   // a few switch on and off
        if (wh(c + 17.) < .12) on *= step(.45, fl);
        vec2 aa = fwidth(q) * .7;
        float win = smoothstep(.22 - aa.x, .22 + aa.x, f.x) * smoothstep(.78 + aa.x, .78 - aa.x, f.x) * smoothstep(.38 - aa.y, .38 + aa.y, f.y) * smoothstep(.64 + aa.y, .64 - aa.y, f.y);
        vec3 wc = mix(uWinA, uWinB, step(.75, wh(c + 5.)));
        totalEmissiveRadiance += wc * win * on * uWinGain * (.75 + .5 * wh(c + 1.)) * min(vWin, 1.6);
        diffuseColor.rgb *= 1. - .6 * win;
      }`);
  };
  return m;
}

// Additive glow sprite texture
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,255,255,.55)'); gr.addColorStop(.35, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = glowTex();
export function glowSprite(color, size) {
  const m = new THREE.SpriteMaterial({ map: GLOW, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: true });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); s.userData.base = size; return s;
}

// —— Engine: nozzle, glowing throat, plume ——
function plumeMat(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying float vA; varying vec3 vN, vW; void main(){ vA = uv.y; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `varying float vA; varying vec3 vN, vW; uniform float uPower; uniform vec3 uA, uB;
      void main(){
        float along = vA;                                  // 1 at the nozzle, 0 at the tip
        vec3 v = normalize(cameraPosition - vW);
        float core = pow(abs(dot(normalize(vN), v)), 1.6);
        float a = pow(along, 2.2) * core;
        vec3 c = mix(uB, uA, along) + vec3(1.) * pow(along, 8.) * .8;
        gl_FragColor = vec4(c * a * min(uPower, 1.4) * .35, 1.);
      }`
  });
}
function throatMat(U) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 vP; uniform float uPower, uR; uniform vec3 uA, uB;
      void main(){ float r = length(vP) / uR; vec3 c = mix(vec3(1.), uA, smoothstep(.0, .75, r)); c = mix(c, uB, smoothstep(.75, 1., r));
        gl_FragColor = vec4(c * (1.2 + 1.6 * min(uPower, 1.2)) * (1. - .55 * r), 1.); }`
  });
}

export function makeShip() {
  const R = mulberry(7);
  const U = { uTime: { value: 0 }, uWinGain: { value: 2.6 }, uWinA: { value: new THREE.Color('#bfe6ff') }, uWinB: { value: new THREE.Color('#ffe2b8') } };
  const maps = panelMaps(3);
  const hullMat = hullMaterial(maps, U);
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2a2d32', map: maps.map, bumpMap: maps.bump, bumpScale: 1.5, roughness: .55, metalness: .85, envMapIntensity: .45 });
  const geos = [], darks = [], greebleFaces = [];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1);
  const put = (g, x, y, z, rx = 0, ry = 0, rz = 0, list = geos) => { M.compose(new THREE.Vector3(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S); g.applyMatrix4(M); list.push(g); return g; };
  // record the four long faces of a box for greebles
  const box = (w, h, d, x, y, z, o = {}) => {
    put(boxGeo(w, h, d, R, o), x, y, z);
    if (o.greeble !== false && !o.taper) {
      const dens = o.greeble ?? 1;
      greebleFaces.push({ c: [x, y + h / 2, z], n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], eu: w / 2, ev: d / 2, dens });
      greebleFaces.push({ c: [x, y - h / 2, z], n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], eu: w / 2, ev: d / 2, dens: dens * .6 });
      greebleFaces.push({ c: [x + w / 2, y, z], n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], eu: h / 2, ev: d / 2, dens: dens * .45 });
      greebleFaces.push({ c: [x - w / 2, y, z], n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], eu: h / 2, ev: d / 2, dens: dens * .45 });
    }
  };

  // spine (octagonal)
  put(cylGeo(4.5, 4.5, 74, 8, R), 0, 0, -2, 0, 0, Math.PI / 8);
  // engine block + armour
  box(24, 15, 22, 0, 0, -50, { win: .15 });
  box(28, 9, 14, 0, 0, -47, { win: 0, greeble: 1.4 });
  box(10, 4, 18, 0, 9.2, -48, { win: .6 });
  // rear habitat section with a hangar bay on each side
  box(20, 11, 18, 0, 0, -28, { win: 1.1 });
  box(14, 3.5, 16, 0, 7.2, -28, { win: 1 });
  // mid modules around the spine
  for (const z of [-8, 10]) {
    box(11, 5, 13, 0, 6.6, z, { win: 1.2 }); box(11, 5, 13, 0, -6.6, z, { win: 1 });
    box(6, 8, 13, 8.6, 0, z, { win: 1.3 }); box(6, 8, 13, -8.6, 0, z, { win: 1.3 });
    put(boxGeo(26, 1.4, 3, R), 0, 0, z + 7.6, 0, 0, 0, darks);   // structural rib
  }
  // ventral keel and dorsal conduit
  box(4, 3, 46, 0, -6.4, -6, { win: 0, greeble: 1.6 });
  box(2.4, 1.6, 52, 0, 5.2, 4, { win: 0, greeble: 1.8 });
  // command section (tapered bow) and bridge
  put(boxGeo(16, 8, 30, R, { taper: [.22, .35, -.6], win: .8 }), 0, 0, 47);
  box(6, 3.6, 8, 0, 5.6, 38, { win: 1.6 });
  box(3.4, 1.8, 4.6, 0, 8.3, 37.4, { win: 2 });
  box(9, 2, 10, 0, -4.8, 40, { win: .6 });
  // lateral radiator wings (thin) and the dorsal fin
  for (const s of [-1, 1]) put(boxGeo(15, .7, 11, R), s * 17, 0, -30, 0, 0, s * .12, darks);
  put(boxGeo(.8, 9, 15, R), 0, 13, -31, 0, 0, 0, darks);
  // antenna masts on the bow
  for (const [x, z, l] of [[1.2, 44, 7], [-1.6, 46, 5], [.6, 50, 4]]) put(cylGeo(.12, .12, l, 6, R), x, 4.2 + l / 2, z, -Math.PI / 2, 0, 0, darks);

  // greebles: small boxes on the big faces
  const gR = mulberry(19);
  for (const f of greebleFaces) {
    const area = f.eu * f.ev * 4, n = Math.floor(area * .22 * f.dens);
    for (let i = 0; i < n; i++) {
      const a = (gR() * 2 - 1) * f.eu * .92, b = (gR() * 2 - 1) * f.ev * .94;
      const big = gR() < .08, sw = big ? 1.5 + gR() * 2.5 : .25 + gR() * .9, sl = big ? 2 + gR() * 4 : .3 + gR() * 1.6, sh = big ? .5 + gR() * 1 : .1 + gR() * .45;
      const g = boxGeo(sw, sh, sl, gR);
      // orient: local y → face normal, local x → u, local z → v
      const n3 = new THREE.Vector3(...f.n), u3 = new THREE.Vector3(...f.u), v3 = new THREE.Vector3(...f.v);
      const basis = new THREE.Matrix4().makeBasis(u3, n3, v3);
      const p = new THREE.Vector3(...f.c).addScaledVector(u3, a).addScaledVector(v3, b).addScaledVector(n3, sh / 2);
      g.applyMatrix4(basis); g.translate(p.x, p.y, p.z);
      (gR() < .25 ? darks : geos).push(withWin(g, 0));
    }
  }

  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const hull = new THREE.Mesh(mergeGeometries(geos), hullMat); hull.castShadow = hull.receiveShadow = true; body.add(hull);
  const dark = new THREE.Mesh(mergeGeometries(darks.map(g => { g.deleteAttribute('aWin'); return g; })), darkMat); dark.castShadow = dark.receiveShadow = true; body.add(dark);

  // hangar bays: lit recesses
  const bayMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9fd8ff').multiplyScalar(.55) });
  for (const s of [-1, 1]) {
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), bayMat); bay.position.set(s * 10.04, -.6, -26); bay.rotation.y = s * Math.PI / 2; body.add(bay);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(.3, 4.4, 10.2), darkMat); frame.position.set(s * 10.1, -.6, -26); body.add(frame);
  }

  // engines
  const EU = { uPower: { value: .4 }, uA: { value: LIGHT_A.clone() }, uB: { value: LIGHT_B.clone() }, uR: { value: 1 } };
  const engines = [];
  const nozMat = new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: .35, metalness: .95, side: THREE.DoubleSide, envMapIntensity: .6 });
  const pm = plumeMat(EU);
  for (const [x, y, r] of [[5.6, 3.7, 4.1], [-5.6, 3.7, 4.1], [5.6, -3.7, 4.1], [-5.6, -3.7, 4.1], [11.4, 0, 2.5], [-11.4, 0, 2.5]]) {
    const z0 = -61;
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(r * .82, r, 5, 32, 1, true), nozMat); noz.rotation.x = Math.PI / 2; noz.position.set(x, y, z0 - 2); body.add(noz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .35, 8, 40), nozMat); ring.position.set(x, y, z0 - 4.5); body.add(ring);
    const tU = Object.assign({}, EU, { uR: { value: r * .8 } });
    const throat = new THREE.Mesh(new THREE.CircleGeometry(r * .8, 40), throatMat(tU)); throat.position.set(x, y, z0 - 1.2); throat.rotation.y = Math.PI; body.add(throat);
    const plume = new THREE.Mesh(new THREE.CylinderGeometry(r * .78, r * .25, 1, 32, 1, true), pm);
    plume.geometry.translate(0, -.5, 0); plume.rotation.x = Math.PI / 2; plume.position.set(x, y, z0 - 2.5); body.add(plume);
    const halo = glowSprite(LIGHT_A.clone(), r * 5); halo.position.set(x, y, z0 - 4); body.add(halo);
    engines.push({ plume, halo, r });
  }
  const engLight = new THREE.PointLight(LIGHT_A.clone(), 0, 90, 1.4); engLight.position.set(0, 0, -68); body.add(engLight);

  // beacons: port red, starboard green, white strobes
  const beacons = [];
  for (const [x, y, z, col, ph] of [[-24.4, -.9, -30, '#ff3030', 0], [24.4, .9, -30, '#30ff70', 0], [0, 17.6, -31, '#ffffff', .5], [0, -1.5, 61.6, '#ffffff', .25], [0, 9.3, 37.4, '#ff3030', .7]]) {
    const c = new THREE.Color(col);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), new THREE.MeshBasicMaterial({ color: c.clone() })); dot.position.set(x, y, z); body.add(dot);
    const s = glowSprite(c.clone(), 4); s.position.set(x, y, z); body.add(s);
    beacons.push({ dot, s, c, ph, strobe: col === '#ffffff' });
  }

  function update(t, power, stretch = 1) {
    U.uTime.value = t;
    EU.uPower.value = power;
    for (const e of engines) {
      const L = 6 + 16 * Math.min(power, 1.4);
      e.plume.scale.set(1, L / stretch, 1);
      e.halo.scale.setScalar(e.r * (1.8 + 1.6 * power));
      e.halo.material.color.copy(LIGHT_A).lerp(LIGHT_B, .25).multiplyScalar(.15 + .3 * Math.min(power, 1.5));
    }
    engLight.intensity = 150 + 900 * Math.min(power, 1.5);
    for (const b of beacons) {
      const p = ((t + b.ph * 1.6) % 1.6) / 1.6;
      const on = b.strobe ? Math.exp(-p * 18) * 1.6 : .35 + .65 * Math.exp(-p * 4);
      b.dot.material.color.copy(b.c).multiplyScalar(1 + 6 * on);
      b.s.material.color.copy(b.c).multiplyScalar(on * 1.4);
    }
  }
  return { root, body, update, U, hullMat };
}
