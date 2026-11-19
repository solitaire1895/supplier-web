// Deep Space Cinema · space: backdrop (nebula baked once into a cube map; stars and hyperspace streaks per pixel),
// planet with atmosphere, and the environment map the hull reflects.
import * as THREE from 'three';

const NOISE = `
  float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  vec3 h33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 6; i++){ s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;

// —— Nebula (baked once) ——
const nebulaMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: NOISE + `
    varying vec3 vD;
    void main(){
      vec3 d = normalize(vD);
      vec3 q = d * 2.2;
      vec3 w = vec3(fbm(q + 3.1), fbm(q + 7.7), fbm(q + 1.3));
      float n = fbm(q + 2.4 * w);
      float n2 = fbm(d * 4.5 + w * 1.8 + 9.);
      // a band across the sky (galactic plane), tilted
      float band = exp(-pow(dot(d, normalize(vec3(.25, 1., -.35))) / .42, 2.));
      float cloud = smoothstep(.42, .85, n) * (.35 + .9 * band);
      float dust = smoothstep(.5, .75, n2) * band;
      vec3 teal = vec3(.03, .16, .19), magenta = vec3(.19, .04, .15), deep = vec3(.006, .009, .02);
      vec3 col = deep + mix(teal, magenta, smoothstep(.35, .7, w.x)) * cloud * 1.15;
      col += vec3(.12, .1, .14) * pow(cloud, 3.) * .6;           // brighter cores
      col *= 1. - .75 * dust;                                     // dark dust lanes
      col += vec3(.015, .018, .03) * band;                        // milky glow
      gl_FragColor = vec4(col, 1.);
    }`
});

// —— Sky shader: nebula cube + stars + sun + hyperspace streaks ——
export function makeSky(renderer, sunDir) {
  const cubeRT = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType });
  const bakeScene = new THREE.Scene(); bakeScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), nebulaMat));
  const cc = new THREE.CubeCamera(.1, 100, cubeRT); cc.update(renderer, bakeScene);

  const U = {
    tNeb: { value: cubeRT.texture }, sunDir: { value: sunDir.clone() }, pxAng: { value: .0004 },
    warp: { value: 0 }, warpDir: { value: new THREE.Vector3(0, 0, -1) }, warpPhase: { value: 0 }, starDim: { value: 1 }, nebGain: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: NOISE + `
      varying vec3 vW; uniform samplerCube tNeb; uniform vec3 sunDir, warpDir; uniform float pxAng, warp, warpPhase, starDim, nebGain;
      vec3 starLayer(vec3 d, float scale, float prob, float bmax, float seed){
        vec3 p = d * scale, c = floor(p);
        vec3 r = h33(c + seed);
        if (r.x > prob) return vec3(0.);
        vec3 s = normalize((c + .2 + .6 * h33(c + seed + 5.)) / scale);
        float a = length(d - s);
        float b = bmax * (.12 + .88 * pow(r.y, 4.));
        float sz = pxAng * (.75 + 1.2 * b / bmax);
        float g = exp(-.5 * a * a / (sz * sz));
        vec3 tint = mix(vec3(.75, .85, 1.), vec3(1., .88, .72), r.z);
        if (r.z > .92) tint = vec3(.7, .8, 1.15);
        // tiny diffraction spikes on the brightest
        if (b > bmax * .45) {
          vec3 up = abs(s.y) < .9 ? vec3(0,1,0) : vec3(1,0,0); vec3 e1 = normalize(cross(up, s)), e2 = cross(s, e1);
          vec3 o = d - s; float x = dot(o, e1), y = dot(o, e2);
          float spike = exp(-abs(x) / (pxAng * .5)) * exp(-abs(y) / (pxAng * 10.)) + exp(-abs(y) / (pxAng * .5)) * exp(-abs(x) / (pxAng * 10.));
          g += spike * .25;
        }
        return tint * b * g;
      }
      void main(){
        vec3 d = normalize(vW - cameraPosition);
        vec3 col = textureCube(tNeb, d).rgb * nebGain;
        vec3 st = starLayer(d, 900., .006, .9, 1.) + starLayer(d, 380., .0045, 2.6, 11.) + starLayer(d, 140., .004, 9., 23.);
        col += st * starDim * (1. - .85 * warp);
        // sun: small hot disc + wide soft glow
        float sd = max(dot(d, sunDir), 0.);
        col += vec3(1., .93, .82) * (smoothstep(.99995, .99998, sd) * 40. + pow(sd, 400.) * 1.2 + pow(sd, 30.) * .06);
        // hyperspace: streaks streaming out from the vanishing point
        if (warp > .001) {
          vec3 wd = normalize(warpDir);
          vec3 up = abs(wd.y) < .9 ? vec3(0,1,0) : vec3(1,0,0); vec3 e1 = normalize(cross(up, wd)), e2 = cross(wd, e1);
          float ang = acos(clamp(dot(d, wd), -1., 1.));
          float az = atan(dot(d, e2), dot(d, e1));
          const float N = 1400.;
          float fb = (az / 6.2831853 + .5) * N, bin = floor(fb);
          vec3 sum = vec3(0.);
          for (int k = -1; k <= 1; k++) {
            float b = bin + float(k);
            vec3 r = h33(vec3(b, 3.7, 9.1));
            if (r.x > .62) continue;
            float baz = (b + .5) / N - .5; baz *= 6.2831853;
            float daz = az - baz; daz = mod(daz + 3.14159265, 6.2831853) - 3.14159265;
            float perp = abs(daz) * sin(max(ang, 1e-4));
            float a0 = mix(.02, 1.1, r.y);                      // where the star sits (angle from the vanishing point)
            float head = a0 * (1. + warpPhase * (.6 + r.z));    // the field streams outward
            float len = warp * (.04 + .55 * head);
            float tail = max(head - len, .0);
            float along = clamp((ang - tail) / max(head - tail, 1e-4), 0., 1.);
            float inSeg = step(tail, ang) * step(ang, head);
            float w = pxAng * (.8 + 1.4 * r.z * warp);
            float line = exp(-.5 * perp * perp / (w * w)) * inSeg * pow(along, 1.5);
            vec3 tint = mix(vec3(.55, .8, 1.25), vec3(.85, .8, 1.25), r.z);
            sum += tint * line * (1.5 + 5. * r.y) * warp;
          }
          col += sum;
          // the tunnel glow around the vanishing point
          col += vec3(.25, .5, 1.) * warp * .35 * exp(-ang * 2.2);
        }
        gl_FragColor = vec4(col, 1.);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(9000, 64, 32), mat);
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  return { mesh, U };
}

// —— Planet + atmosphere ——
export function makePlanet(R, sunDir) {
  const U = { sunDir: { value: sunDir.clone() } };
  const surf = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec3 vN, vO, vW; void main(){ vO = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: NOISE + `
      varying vec3 vN, vO, vW; uniform vec3 sunDir;
      void main(){
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW), o = vO;
        // continents and oceans
        vec3 q = o * 3.;
        float w = fbm(q * 1.7 + 4.);
        float land = smoothstep(.5, .54, fbm(q + 1.6 * w));
        vec3 ocean = mix(vec3(.02, .05, .09), vec3(.03, .08, .12), fbm(q * 4.));
        vec3 ground = mix(vec3(.13, .11, .08), vec3(.22, .19, .14), fbm(q * 6. + 3.));
        ground = mix(ground, vec3(.08, .1, .06), smoothstep(.45, .7, fbm(q * 9.)));
        float ice = smoothstep(.78, .9, abs(o.y));
        vec3 col = mix(ocean, ground, land); col = mix(col, vec3(.75, .78, .8), ice);
        // cloud bands with swirls
        vec3 cq = vec3(o.x * 4., o.y * 9., o.z * 4.);
        float cw = fbm(cq * .8 + 11.);
        float cloud = smoothstep(.48, .75, fbm(cq + 2.5 * cw));
        col = mix(col, vec3(.86, .88, .9), cloud * .9);
        // light: lambert with a soft terminator
        float ndl = dot(n, sunDir);
        float lit = smoothstep(-.06, .25, ndl);
        vec3 c = col * lit * .95;
        // night side: faint city lights on land, not under clouds
        float city = step(.83, h31(floor(o * 900.))) * land * (1. - cloud) * (1. - ice);
        c += vec3(1., .78, .5) * city * .6 * smoothstep(.05, -.15, ndl);
        // limb scattering on the surface (blue haze toward the edge on the day side)
        float rim = pow(1. - max(dot(n, v), 0.), 3.);
        c += vec3(.25, .5, .95) * rim * smoothstep(-.2, .4, ndl) * .45;
        gl_FragColor = vec4(c, 1.);
      }`
  });
  const atm = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: `varying vec3 vN, vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      varying vec3 vN, vW; uniform vec3 sunDir;
      void main(){
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
        float f = 1. - abs(dot(n, v));            // brightest just outside the limb
        float shell = pow(smoothstep(.0, 1., f), 6.) * smoothstep(1., .93, f);
        float day = smoothstep(-.35, .45, dot(n, sunDir));
        vec3 col = mix(vec3(.2, .45, 1.), vec3(.55, .75, 1.), day) * shell * (.08 + 1.1 * day);
        gl_FragColor = vec4(col, 1.);
      }`
  });
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 96), surf);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.022, 160, 96), atm);
  root.add(body, shell);
  return { root, body, shell, surf, atm };
}

// —— Environment for metal reflections: the sky (nebula), the planet, a sun glint ——
export function bakeEnv(renderer, sky, planetPos, planetR, sunDir) {
  const s = new THREE.Scene();
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), sky.mesh.material); s.add(skyMesh);
  const p = makePlanet(planetR * 500 / 9000, sunDir); p.root.position.copy(planetPos).multiplyScalar(500 / 9000); s.add(p.root);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .93, .82).multiplyScalar(30) }));
  sun.position.copy(sunDir).multiplyScalar(450); s.add(sun);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0, .1, 1000);
  pm.dispose();
  return rt.texture;
}
