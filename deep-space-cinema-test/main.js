// Journey Through the Unknown · Deep Space Cinema test film
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, seg, eio, eo, ei, ss, lerp, hash, vnoise } from '/core/lib.js';
import { DUR, T, shotAt, SFX } from './story.js';
import { makeSky, makePlanet, bakeEnv } from './space.js';
import { makeShip, glowSprite, LIGHT_A, LIGHT_B } from './ship.js';

const QS = new URLSearchParams(location.search);
const W = innerWidth || 1920, H = innerHeight || 1080, SS = +(QS.get('ss') || 2);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(SS); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(22, W / H, .5, 20000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SS, ao: false });
post.bloom.strength = .45; post.bloom.threshold = 1.0; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .38; post.vig.uniforms.contrast.value = .14; post.vig.uniforms.sat.value = 1.05;
post.dof.maxCoc = 0;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SUN = V(.6, .42, .68).normalize();

// —— World ——
const sky = makeSky(renderer, SUN); scene.add(sky.mesh);
const PLANET_R = 3800;
const planet = makePlanet(PLANET_R, SUN); scene.add(planet.root);
// shot A layout: the camera at the origin looking down -z; the planet fills the lower-left, its limb near the centre
const dirAt = (yawDeg, pitchDeg) => V(Math.tan(yawDeg * Math.PI / 180), Math.tan(pitchDeg * Math.PI / 180), -1).normalize();
const PLANET_D = 9000, PLANET_A = 25;   // distance, angular radius (deg)
const PLANET_POS_A = dirAt(-27, -22).multiplyScalar(PLANET_D);
planet.root.scale.setScalar(PLANET_D * Math.sin(PLANET_A * Math.PI / 180) / PLANET_R);
scene.environment = bakeEnv(renderer, sky, PLANET_POS_A, PLANET_D * Math.sin(PLANET_A * Math.PI / 180), SUN);

const sun = new THREE.DirectionalLight('#fff1e0', 4.2); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;
Object.assign(sun.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 1, far: 500 });
scene.add(sun, sun.target);
const fill = new THREE.HemisphereLight('#3a4a66', '#0a0c12', .12); scene.add(fill);

const ship = makeShip(); scene.add(ship.root);

// hyperspace trail + flash
const trailMat = new THREE.ShaderMaterial({
  uniforms: { uA: { value: LIGHT_A.clone() }, uB: { value: LIGHT_B.clone() }, uI: { value: 0 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying float vA; varying vec3 vN, vW; void main(){ vA = uv.y; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `varying float vA; varying vec3 vN, vW; uniform vec3 uA, uB; uniform float uI;
    void main(){ vec3 v = normalize(cameraPosition - vW); float core = pow(abs(dot(normalize(vN), v)), 2.);
      vec3 c = mix(uB, uA, vA) + vec3(.6) * pow(core, 4.); gl_FragColor = vec4(c * core * uI * smoothstep(0., .35, vA), 1.); }`
});
const trail = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true), trailMat);
trail.geometry.translate(0, .5, 0); trail.visible = false; trail.frustumCulled = false; scene.add(trail);
const flash = glowSprite(new THREE.Color('#cfe8ff'), 10); flash.visible = false; scene.add(flash);

// —— Staging ——
const setShip = (pos, fwd, roll = 0, stretch = 1) => {
  ship.root.position.copy(pos);
  const m = new THREE.Matrix4().lookAt(V(0, 0, 0), fwd.clone().normalize().negate(), V(0, 1, 0));
  ship.root.quaternion.setFromRotationMatrix(m);
  ship.root.rotateZ(roll);
  ship.root.scale.set(1, 1, stretch);
  ship.root.translateZ(64 * (stretch - 1));   // stretch forward from the tail
  ship.stretch = stretch;
};
const shake = (t, amp) => V((vnoise(t * 9) - .5), (vnoise(t * 9 + 40) - .5), 0).multiplyScalar(amp);

function frame(t) {
  const [t0, t1, name] = shotAt(t), u = seg(t, t0, t1);
  let pos, look, fov = 22, power = .35, fade = 1, warp = 0, warpPhase = 0, overPlanet = false;
  trail.visible = false; flash.visible = false; trailMat.uniforms.uI.value = 0;

  switch (name) {
    case 'emerge': {   // the ship slides out from behind the planet's limb
      const H0 = V(1, .3, .15).normalize();
      setShip(dirAt(-14, -9).multiplyScalar(400).addScaledVector(H0, 26 * t), H0, -.07 + .02 * Math.sin(t * .4));
      planet.root.position.copy(PLANET_POS_A); planet.root.visible = true; overPlanet = true;
      pos = V(0, 0, 0).lerp(V(6, 4, -24), eio(u));
      look = dirAt(-6, -4).multiplyScalar(400).lerp(dirAt(0, -2).multiplyScalar(400), eio(u));
      fov = lerp(23, 21, eio(u)); power = .3 + .05 * Math.sin(t * 1.3);
      fade = ss(seg(t, ...T.fadeIn));
      break;
    }
    case 'hull': {     // low three-quarter, slow push along the hull to the engines
      const H0 = V(0, 0, 1); setShip(V(0, 0, 3 * (t - 5)), H0, .03);
      planet.root.position.set(-6500, -5400, -2600); planet.root.visible = true;
      const e = eio(u), sp = 3 * (t - 5);
      pos = V(78, -30, 128).lerp(V(56, -15, -44), e).add(V(0, 0, sp));
      look = V(-4, 2, 18).lerp(V(0, 1, -50), ss(u)).add(V(0, 0, sp));
      fov = lerp(30, 34, e); power = lerp(.45, .78, ss(seg(t, 6, 10)));
      break;
    }
    case 'jump': {     // behind the engines: build, held breath, hyperspace
      const H0 = V(0, 0, 1);
      const j = seg(t, T.jump, T.flash), z = 8 * (t - 10) + 5200 * Math.pow(j, 3.2);
      const stretch = 1 + 3.5 * Math.sin(Math.PI * clamp(j * 1.15)) * (j < 1 ? 1 : 0);
      setShip(V(0, 0, z), H0, 0, stretch);
      ship.root.visible = t < T.flash;
      planet.root.visible = false;
      const b = ss(seg(t, ...T.build)), lunge = eo(seg(t, T.jump, T.jump + .5)) * (1 - ss(seg(t, 12.7, 14)));
      pos = V(44, 15, -160).lerp(V(34, 11, -142), eio(seg(t, 10, 11.75))).add(V(0, 0, 30 * lunge));
      pos.add(shake(t, .25 * b + 1.3 * Math.exp(-Math.max(0, t - T.jump) * 3) * (t > T.jump ? 1 : 0)));
      look = V(0, 0, 40);
      fov = 30 + 8 * lunge;
      power = t < T.build[1] ? lerp(.8, 1.5, b) : t < T.jump ? 1.65 : 2.2;
      // warp streaks: grow with the jump, settle back after the flash
      warp = ss(seg(t, T.jump, T.jump + .45)) * (1 - ss(seg(t, ...T.settle)));
      warpPhase = Math.max(0, t - T.jump) * 1.6;
      // trail: from where the jump began to the ship's tail, fading after the flash
      if (t > T.jump) {
        const zA = -64 + 8 * (T.jump - 10), zB = Math.min(z, 5200) - 64;
        trail.visible = true; trail.position.set(0, 0, zA);
        trail.rotation.set(Math.PI / 2, 0, 0);
        const r = 3.2 * (1 - .6 * seg(t, T.flash, 14.4));
        trail.scale.set(r, Math.max(zB - zA, 1), r);
        trailMat.uniforms.uI.value = 2.6 * ss(seg(t, T.jump, T.jump + .15)) * (1 - ss(seg(t, T.flash, 14.2)));
      }
      // flash at the vanishing point
      const fl = t >= T.flash ? Math.exp(-(t - T.flash) * 5) : 0;
      if (fl > .01) { flash.visible = true; flash.position.set(0, 0, 5200); flash.scale.setScalar(900 * (.4 + fl)); flash.material.color.set('#d8ecff').multiplyScalar(3 * fl); }
      fade = (1 + 1.2 * fl) * (1 - ss(seg(t, ...T.fadeOut)));
      break;
    }
  }

  // planet: drawn over the ship only in the emergence shot (it sits "in front")
  for (const m of [planet.body, planet.shell]) { m.material.depthTest = !overPlanet; m.renderOrder = overPlanet ? 10 + (m === planet.shell ? 1 : 0) : 0; }
  planet.body.material.transparent = overPlanet;

  ship.update(t, power, ship.stretch || 1);
  camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; camera.updateProjectionMatrix();
  sky.mesh.position.copy(camera.position);
  sky.U.pxAng.value = (fov * Math.PI / 180) / H;
  sky.U.warp.value = warp; sky.U.warpPhase.value = warpPhase; sky.U.warpDir.value.set(0, 0, 1);
  post.vig.uniforms.fade.value = fade;
  // keep the shadow camera on the ship
  sun.target.position.copy(ship.root.position); sun.position.copy(ship.root.position).addScaledVector(SUN, 250);
}

window.render = t => { frame(t); post.composer.render(); };
window.DUR = DUR;
window.EV = SFX;
window.TEXTS = () => [];
window.READY = true;
