import * as THREE from 'three';

/* =========================================================
   TECHFEST '27 — SINGULARITY
   A scroll-driven 3D journey: Core → Event ring → Wormhole → Crystals → Portal
   ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;
let narrow = innerWidth < 900;

/* ---------------- Event data ---------------- */
const EVENTS = [
  { name: 'RoboWars', cat: 'Robotics', color: '#ff3d81', prize: '₹3,00,000', team: '2–5', day: 'Day 1 & 3',
    desc: 'Build a 15 kg combat robot and send it into the cage. Last bot moving wins.',
    rules: ['Max weight 15 kg, wireless control only', 'Three-minute knockout rounds', 'Safety inspection on Day 1 morning'] },
  { name: 'Code Sprint', cat: 'Competitive coding', color: '#00e5ff', prize: '₹1,50,000', team: 'Solo', day: 'Day 2',
    desc: 'Five hours, eight problems, one leaderboard. Algorithms at the speed of thought.',
    rules: ['C++, Java, Python, Rust and Go', 'ICPC-style scoring with penalties', 'Online qualifier two weeks before'] },
  { name: 'Neural Nexus', cat: 'AI / ML', color: '#8b5cff', prize: '₹2,00,000', team: '1–3', day: 'Day 2',
    desc: 'Train models live on a surprise dataset, then face off in an adversarial model battle.',
    rules: ['GPU credits provided to finalists', 'Any framework allowed', 'Judged on accuracy and robustness'] },
  { name: 'Drone Dash', cat: 'Aerial racing', color: '#ffb547', prize: '₹2,50,000', team: '1–2', day: 'Day 2',
    desc: 'FPV drones tear through a neon obstacle course built across the campus quad.',
    rules: ['5-inch class, max 6S battery', 'Three timed laps per heat', 'Spotter mandatory for each pilot'] },
  { name: 'Hack the Singularity', cat: '36-hour hackathon', color: '#39ff9f', prize: '₹4,00,000', team: '2–4', day: 'Day 1 → 3',
    desc: 'Thirty-six hours to build something that should not exist yet. Mentors on call all night.',
    rules: ['Open theme, with three sponsor tracks', 'All code written during the event', 'Five-minute demo plus Q&A'] },
  { name: 'Pixel Arena', cat: 'Esports & game dev', color: '#ff6b3d', prize: '₹2,00,000', team: '1–5', day: 'Day 2 night',
    desc: 'A LAN night of tournaments plus a 24-hour game jam whose winning game gets played on the main stage.',
    rules: ['Bring your own peripherals', 'Double-elimination brackets', 'Jam theme revealed at 21:00'] },
];

/* ---------------- Renderer / scene ---------------- */
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const bgColor = new THREE.Color('#05030f');
scene.background = bgColor;
scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.011);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 700);
camera.position.set(0, 0, 70);

scene.add(new THREE.AmbientLight(0x6a5acd, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(10, 20, 15);
scene.add(key);

/* ---------------- Helpers ---------------- */
function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner); grd.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.6)')); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const dotTex = glowTexture();

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* =========================================================
   1. THE CORE
   ========================================================= */
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const coreU = {
  uTime: { value: 0 }, uAmp: { value: 0.55 }, uPulse: { value: 0 },
  uA: { value: new THREE.Color('#5b3cff') }, uB: { value: new THREE.Color('#00e5ff') }, uC: { value: new THREE.Color('#ff3d81') },
};
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(4, touch ? 24 : 40),
  new THREE.ShaderMaterial({
    uniforms: coreU,
    vertexShader: NOISE + /* glsl */`
      uniform float uTime, uAmp, uPulse;
      varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){
        float n = snoise(normal*1.3 + vec3(uTime*.22));
        n += snoise(normal*3.4 - vec3(uTime*.38)) * .35;
        float d = n * (uAmp + uPulse);
        vD = d;
        vec4 mv = modelViewMatrix * vec4(position + normal*d, 1.);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA, uB, uC; uniform float uPulse;
      varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){
        float f = pow(1. - max(dot(vN, vV), 0.), 2.);
        vec3 c = mix(uA, uB, smoothstep(-.5, .7, vD));
        c = mix(c, uC, smoothstep(.45, 1.1, vD));
        c = c * (.45 + f * 1.3) + uB * f * .8 + uPulse * .5;
        gl_FragColor = vec4(c, 1.);
      }`,
  })
);
core.userData = { kind: 'core', label: 'Click: pulse the core' };
coreGroup.add(core);

const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(6.4, 2),
  new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.14 }));
coreGroup.add(shell);

const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(124,92,255,1)', 'rgba(124,92,255,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .9 }));
glow.scale.set(26, 26, 1);
coreGroup.add(glow);

const orbits = [];
[[8.5, 0x00e5ff, 1.1, 0.3], [10.5, 0xff3d81, -0.6, -0.5], [12.5, 0x7c5cff, 0.4, 0.9]].forEach(([r, col, speed, tilt]) => {
  const g = new THREE.Group();
  g.rotation.x = Math.PI / 2 + tilt; g.rotation.y = tilt * .6;
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 6, 160), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .45 })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ color: col }));
  moon.position.x = r; g.add(moon);
  const mg = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  mg.scale.setScalar(2.2); moon.add(mg);
  g.userData.speed = speed;
  coreGroup.add(g); orbits.push(g);
});
const coreLight = new THREE.PointLight(0x7c5cff, 60, 60, 1.6);
coreGroup.add(coreLight);

// Burst particles (on core click)
const BURST = 700;
const burstGeo = new THREE.BufferGeometry();
const burstPos = new Float32Array(BURST * 3), burstVel = new Float32Array(BURST * 3);
burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
const burstMat = new THREE.PointsMaterial({ size: 0.35, map: dotTex, color: 0x9fe9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const burst = new THREE.Points(burstGeo, burstMat);
coreGroup.add(burst);
let burstLife = 0;
function fireBurst() {
  for (let i = 0; i < BURST; i++) {
    const v = new THREE.Vector3().randomDirection();
    burstPos.set([v.x * 4, v.y * 4, v.z * 4], i * 3);
    const s = 6 + Math.random() * 14;
    burstVel.set([v.x * s, v.y * s, v.z * s], i * 3);
  }
  burstGeo.attributes.position.needsUpdate = true;
  burstLife = 1; coreU.uPulse.value = 1.1;
}

/* =========================================================
   STARFIELD (spans the whole journey)
   ========================================================= */
const STARS = touch ? 2500 : 5000;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(STARS * 3), starCol = new Float32Array(STARS * 3);
const palette = ['#ffffff', '#9fe9ff', '#b9a6ff', '#ff9cc0'].map(c => new THREE.Color(c));
for (let i = 0; i < STARS; i++) {
  const r = 14 + Math.random() * 70, a = Math.random() * Math.PI * 2;
  starPos.set([Math.cos(a) * r, Math.sin(a) * r * .7, 60 - Math.random() * 430], i * 3);
  const c = palette[(Math.random() * palette.length) | 0];
  starCol.set([c.r, c.g, c.b], i * 3);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.45, map: dotTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(stars);

/* =========================================================
   2. EVENT RING
   ========================================================= */
const RING_Z = -80, RING_R = 16;
const ring = new THREE.Group();
ring.position.set(0, 0, RING_Z);
scene.add(ring);
const ringTrack = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.04, 6, 200), new THREE.MeshBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: .35 }));
ringTrack.rotation.x = Math.PI / 2;
ring.add(ringTrack);
const ringLight = new THREE.PointLight(0xffffff, 120, 50, 1.5);
ringLight.position.set(0, 6, 6);
ring.add(ringLight);

const geos = [
  new THREE.TorusKnotGeometry(1.9, 0.55, 140, 18),
  new THREE.OctahedronGeometry(2.8),
  new THREE.IcosahedronGeometry(2.6, 1),
  new THREE.TetrahedronGeometry(3.1),
  new THREE.DodecahedronGeometry(2.6),
  new THREE.BoxGeometry(3.4, 3.4, 3.4),
];
const worlds = EVENTS.map((ev, i) => {
  const holder = new THREE.Group();
  const a = (i / EVENTS.length) * Math.PI * 2;
  holder.position.set(Math.sin(a) * RING_R, 0, Math.cos(a) * RING_R);
  const col = new THREE.Color(ev.color);
  const mesh = new THREE.Mesh(geos[i], new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .35, metalness: .35, roughness: .3, flatShading: true }));
  mesh.userData = { kind: 'world', index: i, label: ev.name };
  const wire = new THREE.Mesh(geos[i], new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: .35 }));
  wire.scale.setScalar(1.18);
  mesh.add(wire);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55 }));
  halo.scale.setScalar(11);
  holder.add(halo);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.03, 6, 90), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .5 }));
  orbit.rotation.x = Math.PI / 2.4;
  holder.add(mesh, orbit);
  ring.add(holder);
  return { holder, mesh, wire, halo, orbit, scale: 1, hover: 0 };
});

/* =========================================================
   3. WORMHOLE (schedule)
   ========================================================= */
const TUN_START = -110, TUN_END = -262;
const tunnel = new THREE.Group();
scene.add(tunnel);
const tunnelRings = [];
const tc1 = new THREE.Color('#00e5ff'), tc2 = new THREE.Color('#7c5cff'), tc3 = new THREE.Color('#ff3d81');
for (let z = TUN_START, i = 0; z > TUN_END; z -= 3.6, i++) {
  const k = (TUN_START - z) / (TUN_START - TUN_END);
  const col = k < .5 ? tc1.clone().lerp(tc2, k * 2) : tc2.clone().lerp(tc3, (k - .5) * 2);
  const sides = i % 3 === 0 ? 6 : 64;
  const m = new THREE.Mesh(new THREE.TorusGeometry(9, i % 3 === 0 ? 0.09 : 0.035, 6, sides), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8 }));
  m.position.z = z; m.userData.base = col.clone();
  tunnel.add(m); tunnelRings.push(m);
}
// data streaks along the walls
const STREAKS = touch ? 220 : 420;
const streakPos = new Float32Array(STREAKS * 6), streakCol = new Float32Array(STREAKS * 6);
for (let i = 0; i < STREAKS; i++) {
  const a = Math.random() * Math.PI * 2, r = 7.6 + Math.random() * 1.2;
  const z = TUN_START - Math.random() * (TUN_START - TUN_END), len = 1.5 + Math.random() * 6;
  streakPos.set([Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a) * r, Math.sin(a) * r, z - len], i * 6);
  const c = [tc1, tc2, tc3][i % 3];
  streakCol.set([c.r, c.g, c.b, 0, 0, 0], i * 6);
}
const streakGeo = new THREE.BufferGeometry();
streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
streakGeo.setAttribute('color', new THREE.BufferAttribute(streakCol, 3));
const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
tunnel.add(streaks);

/* =========================================================
   4. CRYSTALS (speakers)
   ========================================================= */
const crystals = [];
const crystalCols = ['#7c5cff', '#00e5ff', '#ff3d81', '#39ff9f', '#ffb547'];
for (let i = 0; i < 12; i++) {
  const col = new THREE.Color(crystalCols[i % crystalCols.length]);
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.8 + Math.random() * 1.1, 0),
    new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .5, metalness: .6, roughness: .15, flatShading: true }));
  const side = i % 2 ? 1 : -1;
  m.position.set(side * (7 + Math.random() * 9), (Math.random() - .5) * 12, -263 - Math.random() * 15);
  m.scale.y = 1.6;
  m.userData = { kind: 'crystal', label: 'Click: spin', spin: 0, base: m.position.y, phase: Math.random() * 6 };
  scene.add(m); crystals.push(m);
}
const crystalLight = new THREE.PointLight(0x00e5ff, 80, 60, 1.5);
crystalLight.position.set(0, 4, -272);
scene.add(crystalLight);

/* =========================================================
   5. PORTAL (register)
   ========================================================= */
const PORTAL_Z = -305;
const portal = new THREE.Group();
portal.position.z = PORTAL_Z;
scene.add(portal);
const portalU = { uTime: { value: 0 }, uWarp: { value: 0 } };
const disc = new THREE.Mesh(new THREE.CircleGeometry(7.4, 96), new THREE.ShaderMaterial({
  uniforms: portalU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv; uniform float uTime, uWarp;
    void main(){
      vec2 p = vUv - .5; float r = length(p) * 2.; float a = atan(p.y, p.x);
      float s = sin(a * 5. + r * 16. - uTime * (3. + uWarp * 12.)) * .5 + .5;
      float s2 = sin(a * 3. - r * 9. + uTime * 2.) * .5 + .5;
      vec3 c = mix(vec3(.45,.3,1.), vec3(0.,.9,1.), s);
      c = mix(c, vec3(1.,.24,.5), s2 * smoothstep(.2, 1., r));
      float core = smoothstep(.35, 0., r);
      float alpha = (s * .6 + .25) * smoothstep(1., .82, r) + core;
      gl_FragColor = vec4(c * (1. + uWarp * 2.) + core, alpha * .9);
    }`,
}));
portal.add(disc);
const portalRing = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.32, 24, 180),
  new THREE.MeshStandardMaterial({ color: 0x7c5cff, emissive: 0x7c5cff, emissiveIntensity: 1.2, metalness: .8, roughness: .2 }));
portal.add(portalRing);
const portalRing2 = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
portal.add(portalRing2);
// vortex particles
const VORTEX = touch ? 900 : 1800;
const vPos = new Float32Array(VORTEX * 3), vData = [];
for (let i = 0; i < VORTEX; i++) vData.push({ a: Math.random() * Math.PI * 2, r: 2 + Math.random() * 14, s: .3 + Math.random() * .8, z: (Math.random() - .5) * 4 });
const vGeo = new THREE.BufferGeometry();
vGeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
const vortex = new THREE.Points(vGeo, new THREE.PointsMaterial({ size: .28, map: dotTex, color: 0xb9a6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
portal.add(vortex);
const portalLight = new THREE.PointLight(0xff3d81, 90, 60, 1.5);
portalLight.position.set(0, 0, 6);
portal.add(portalLight);

/* =========================================================
   SCROLL → CAMERA KEYFRAMES
   ========================================================= */
const S = id => document.getElementById(id);
const topOf = el => el.getBoundingClientRect().top + scrollY;
let anchors = [];
function buildAnchors() {
  narrow = innerWidth < 900;
  const vh = innerHeight;
  const ev = S('events'), tl = S('timeline');
  const evStart = topOf(ev), evEnd = evStart + ev.offsetHeight - vh;
  const tlStart = topOf(tl), tlEnd = tlStart + tl.offsetHeight - vh;
  const C = (pos, look, bg, accent, extra = {}) => ({ pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look), bg: new THREE.Color(bg), accent, ...extra });
  anchors = [
    { y: 0, ...C(narrow ? [0, -2.5, 24] : [-7, 0, 18], [narrow ? 0 : -7, narrow ? -2.5 : 0, 0], '#05030f', '#7c5cff') },
    { y: topOf(S('about')), ...C(narrow ? [0, 7, 20] : [-3, 2, 16], narrow ? [0, 4, 0] : [-8, 0, 0], '#08041a', '#00e5ff') },
    { y: topOf(S('about')) + vh * .55, ...C([18, 6, -14], [0, 0, -45], '#0a0418', '#8b5cff') },
    { y: evStart, ...C(narrow ? [0, 9, -46] : [7, 5, -50], narrow ? [0, -4, -80] : [7, 0, -80], '#0b0418', '#ff3d81') },
    { y: evEnd, ...C(narrow ? [0, 9, -46] : [7, 5, -50], narrow ? [0, -4, -80] : [7, 0, -80], '#0b0418', '#ff3d81') },
    { y: tlStart, ...C([0, 0, -104], [0, 0, -130], '#020a14', '#00e5ff', { linear: true }) },
    { y: tlEnd, ...C([0, 0, -252], [0, 0, -280], '#0d0516', '#ff3d81') },
    { y: topOf(S('speakers')), ...C([0, 1.5, -258], [0, 0, -290], '#0d0516', '#39ff9f') },
    { y: topOf(S('register')), ...C(narrow ? [0, 0, -276] : [9, 0, -284], narrow ? [0, 0, PORTAL_Z] : [9, 0, PORTAL_Z], '#04020c', '#7c5cff') },
  ];
  anchors.ev = [evStart, evEnd]; anchors.tl = [tlStart, tlEnd];
}

const camTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3(), bgTarget = new THREE.Color();
const camNow = new THREE.Vector3(0, 0, 70), lookNow = new THREE.Vector3();
let accentNow = '';
function sampleScroll(sy) {
  let i = 0;
  while (i < anchors.length - 2 && sy >= anchors[i + 1].y) i++;
  const a = anchors[i], b = anchors[i + 1];
  let t = clamp((sy - a.y) / Math.max(1, b.y - a.y));
  if (!a.linear) t = smooth(t);
  camTarget.lerpVectors(a.pos, b.pos, t);
  lookTarget.lerpVectors(a.look, b.look, t);
  bgTarget.copy(a.bg).lerp(b.bg, t);
  const acc = t < .5 ? a.accent : b.accent;
  return acc;
}

/* ---------------- UI state ---------------- */
const root = document.documentElement;
let activeEvent = -1, ringRot = 0, ringRotTarget = 0, activeDay = -1;
const evCard = $('#evCard');
function setEvent(i) {
  if (i === activeEvent) return;
  activeEvent = i;
  const e = EVENTS[i];
  $('#evIdx').textContent = String(i + 1).padStart(2, '0');
  $('#evName').textContent = e.name; $('#evCat').textContent = e.cat; $('#evDesc').textContent = e.desc;
  $('#evPrize').textContent = e.prize; $('#evTeam').textContent = e.team; $('#evDay').textContent = e.day;
  evCard.classList.remove('swap'); void evCard.offsetWidth; evCard.classList.add('swap');
}
setEvent(0);
$('#evMore').addEventListener('click', () => openModal(activeEvent));

/* ---------------- Modal ---------------- */
const modal = $('#modal');
let lastFocus = null;
function openModal(i) {
  const e = EVENTS[i];
  $('#mCat').textContent = `${e.cat} · ${e.day}`;
  $('#mTitle').textContent = e.name;
  $('#mDesc').textContent = e.desc;
  $('#mRules').innerHTML = e.rules.map(r => `<li>${r}</li>`).join('') + `<li>Prize pool: ${e.prize} · Team: ${e.team}</li>`;
  modal.style.setProperty('--accent', e.color);
  $('#mReg').onclick = () => { $('select[name=track]').value = e.name; closeModal(); };
  lastFocus = document.activeElement;
  modal.hidden = false; $('#mClose').focus();
  hovered = null; tip.classList.remove('on'); cursor.classList.remove('big');
  pulseWorld = i;
}
function closeModal() { modal.hidden = true; lastFocus && lastFocus.focus(); }
$('#mClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
let pulseWorld = -1;

/* ---------------- Pointer / raycast ---------------- */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2(), mouse = new THREE.Vector2(), mouseSmooth = new THREE.Vector2();
const cursor = $('#cursor'), tip = $('#tip');
const pickables = [core, ...worlds.map(w => w.mesh), ...crystals];
let hovered = null;
function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, false).find(h => h.distance < 90);
  return hit ? hit.object : null;
}
addEventListener('pointermove', e => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  cursor.style.opacity = 1;
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px';
  hovered = e.target === canvas ? pick(e.clientX, e.clientY) : null;
  const overUI = !!e.target.closest('a, button, input, select, .flip');
  cursor.classList.toggle('big', !!hovered || overUI);
  canvas.style.cursor = hovered ? 'pointer' : 'default';
  tip.classList.toggle('on', !!hovered);
  if (hovered) tip.textContent = hovered.userData.label;
}, { passive: true });
canvas.addEventListener('click', e => {
  const obj = pick(e.clientX, e.clientY);
  if (!obj) return;
  if (obj.userData.kind === 'core') fireBurst();
  else if (obj.userData.kind === 'world') openModal(obj.userData.index);
  else if (obj.userData.kind === 'crystal') obj.userData.spin = 18;
});

/* ---------------- Warp transition (register) ---------------- */
let warp = 0, warpTarget = 0;
const form = $('#regForm'), err = $('#regErr'), success = $('#success'), flash = $('#flash');
form.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = String(fd.get('name')).trim(), email = String(fd.get('email')).trim();
  if (!name) { err.textContent = '> Pilot name required.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = '> Invalid comm-link (email).'; return; }
  err.textContent = '';
  warpTarget = 1;
  setTimeout(() => { flash.classList.add('on'); }, 1500);
  setTimeout(() => {
    flash.classList.remove('on');
    $('.portal-ui').style.visibility = 'hidden';
    $('#successTitle').textContent = `You're in, ${name.split(' ')[0]}.`;
    success.hidden = false; warpTarget = 0; form.reset();
  }, 1650);
});
$('#again').addEventListener('click', () => { success.hidden = true; $('.portal-ui').style.visibility = ''; });

/* ---------------- DOM niceties ---------------- */
// split hero letters
$$('[data-split]').forEach((el, w) => {
  el.innerHTML = [...el.textContent].map((c, i) => `<span class="ch" style="transition-delay:${(w * 0.25 + i * 0.045).toFixed(3)}s">${c}</span>`).join('');
});
// reveal
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  const n = e.target.querySelector('[data-count]');
  if (n) countUp(n);
}), { threshold: .2 });
$$('.reveal').forEach(el => io.observe(el));
function countUp(el) {
  const to = +el.dataset.count, t0 = performance.now();
  const f = t => { const k = clamp((t - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
// countdown
const fest = new Date('2027-02-12T09:00:00+05:30').getTime();
const cd = Object.fromEntries($$('[data-cd]').map(b => [b.dataset.cd, b]));
const tickCd = () => {
  let s = Math.max(0, Math.floor((fest - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60);
  cd.d.textContent = String(d).padStart(2, '0'); cd.h.textContent = String(h).padStart(2, '0');
  cd.m.textContent = String(m).padStart(2, '0'); cd.s.textContent = String(s % 60).padStart(2, '0');
};
tickCd(); setInterval(tickCd, 1000);
// flip cards on tap
$$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('flipped')));
// nav
const burger = $('#burger'), links = $('#navLinks');
burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
$$('a', links).forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));
const dots = $$('.dots a'), secs = $$('[data-sec]');
const progress = $('#progress');

/* ---------------- Resize ---------------- */
function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  buildAnchors();
}
addEventListener('resize', onResize);

/* =========================================================
   LOOP
   ========================================================= */
const clock = new THREE.Clock();
let intro = 0, started = false;
const tmp = new THREE.Vector3();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const sp = reduce ? 0.25 : 1;
  const sy = scrollY;

  // --- scroll-driven targets
  const acc = sampleScroll(sy);
  if (acc !== accentNow && modal.hidden) { accentNow = acc; root.style.setProperty('--accent', acc); }
  const k = 1 - Math.exp(-dt * (reduce ? 10 : 3.2));
  camNow.lerp(camTarget, k); lookNow.lerp(lookTarget, k);
  bgColor.lerp(bgTarget, k); scene.fog.color.copy(bgColor);
  mouseSmooth.lerp(mouse, 1 - Math.exp(-dt * 3));

  // intro fly-in
  if (started) intro = Math.min(1, intro + dt / 2.6);
  const ie = 1 - Math.pow(1 - intro, 3);
  tmp.set(Math.sin(t * .3) * 20 * (1 - ie), 8 * (1 - ie), 70);
  camera.position.lerpVectors(tmp, camNow, ie);
  camera.position.x += mouseSmooth.x * 1.2; camera.position.y += mouseSmooth.y * .8;
  camera.lookAt(lookNow);

  // warp
  warp = lerp(warp, warpTarget, 1 - Math.exp(-dt * 3));
  camera.fov = 60 + warp * 55; camera.updateProjectionMatrix();
  portalU.uWarp.value = warp;

  // --- core
  coreU.uTime.value = t * sp;
  coreU.uPulse.value *= Math.exp(-dt * 2.2);
  coreU.uAmp.value = lerp(coreU.uAmp.value, hovered === core ? 0.95 : 0.55, 1 - Math.exp(-dt * 4));
  core.rotation.y += dt * .15 * sp; core.rotation.x = mouseSmooth.y * .3;
  shell.rotation.y -= dt * .08 * sp; shell.rotation.z += dt * .05 * sp;
  shell.scale.setScalar(1 + coreU.uPulse.value * .25);
  orbits.forEach(o => { o.rotation.z += dt * o.userData.speed * sp; });
  coreLight.intensity = 60 + coreU.uPulse.value * 200;
  if (burstLife > 0) {
    burstLife = Math.max(0, burstLife - dt * .7);
    for (let i = 0; i < BURST * 3; i++) { burstPos[i] += burstVel[i] * dt; burstVel[i] *= 0.985; }
    burstGeo.attributes.position.needsUpdate = true;
  }
  burstMat.opacity = burstLife;

  // --- stars (warp streaming)
  if (warp > .01) {
    const zc = camera.position.z;
    for (let i = 2; i < STARS * 3; i += 3) {
      starPos[i] += warp * dt * 260;
      if (starPos[i] > zc + 10) starPos[i] -= 420;
    }
    starGeo.attributes.position.needsUpdate = true;
  }
  stars.rotation.z += dt * .01 * sp;

  // --- event ring
  const [es, ee] = anchors.ev;
  const lp = clamp((sy - es) / Math.max(1, ee - es));
  const af = clamp(lp * 1.12 - .04) * (EVENTS.length - 1);
  const idx = Math.round(af);
  if (sy > es - innerHeight * .5 && sy < ee + innerHeight * .5) setEvent(idx);
  ringRotTarget = -af * (Math.PI * 2 / EVENTS.length);
  ringRot = lerp(ringRot, ringRotTarget, 1 - Math.exp(-dt * 5));
  ring.rotation.y = ringRot;
  const inEvents = sy > es - innerHeight * .3 && sy < ee + innerHeight * .3;
  if (inEvents && modal.hidden) root.style.setProperty('--accent', EVENTS[idx].color), accentNow = '';
  worlds.forEach((w, i) => {
    const isHover = hovered === w.mesh;
    const target = (i === idx ? 1.35 : .85) * (isHover ? 1.15 : 1) * (pulseWorld === i && !modal.hidden ? 1.25 : 1);
    w.scale = lerp(w.scale, target, 1 - Math.exp(-dt * 6));
    w.holder.scale.setScalar(w.scale);
    w.mesh.rotation.x += dt * (.3 + (isHover ? 2 : 0)) * sp;
    w.mesh.rotation.y += dt * (.5 + (isHover ? 2 : 0)) * sp;
    w.mesh.material.emissiveIntensity = lerp(w.mesh.material.emissiveIntensity, i === idx || isHover ? .9 : .25, .1);
    w.halo.material.opacity = i === idx ? .75 : .3;
    w.orbit.rotation.z += dt * (i === idx ? 1.5 : .4) * sp;
    w.holder.position.y = Math.sin(t * 1.2 + i) * .4;
  });

  // --- wormhole
  const [ts, te] = anchors.tl;
  const tp = clamp((sy - ts) / Math.max(1, te - ts));
  const day = sy < ts - innerHeight * .2 ? -1 : Math.min(2, Math.floor(tp * 3));
  if (day !== activeDay) {
    activeDay = day;
    $$('.day').forEach((d, i) => { d.classList.toggle('on', i === day); d.classList.toggle('past', i < day); });
  }
  $('#warpbar').style.width = tp * 100 + '%';
  const camZ = camera.position.z;
  tunnelRings.forEach((r, i) => {
    r.rotation.z = t * (i % 2 ? .2 : -.15) * sp + i * .2;
    const near = Math.exp(-Math.abs(r.position.z - camZ + 12) * .08);
    r.scale.setScalar(1 + near * .15 + Math.sin(t * 2 + i * .5) * .02);
    r.material.opacity = .35 + near * .65;
  });
  streaks.position.z = (t * 8 * sp) % 20 - 10;

  // --- crystals
  crystals.forEach(c => {
    const u = c.userData;
    u.spin *= Math.exp(-dt * 1.5);
    c.rotation.y += dt * (.6 + u.spin) * sp;
    c.position.y = u.base + Math.sin(t * .8 + u.phase) * .8;
    c.material.emissiveIntensity = hovered === c ? 1.4 : .5;
  });

  // --- portal
  portalU.uTime.value = t * sp;
  portalRing.rotation.z -= dt * (.3 + warp * 6);
  portalRing2.rotation.z += dt * (.5 + warp * 4);
  for (let i = 0; i < VORTEX; i++) {
    const v = vData[i];
    v.a += dt * v.s * (1.2 + warp * 8) * sp * (6 / (v.r + 1));
    v.r -= dt * (0.6 + warp * 10) * v.s;
    if (v.r < 1) v.r = 14;
    vPos[i * 3] = Math.cos(v.a) * v.r; vPos[i * 3 + 1] = Math.sin(v.a) * v.r; vPos[i * 3 + 2] = v.z + (1 - v.r / 14) * -3;
  }
  vGeo.attributes.position.needsUpdate = true;

  // --- UI sync
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (sy / Math.max(1, max)) * 100 + '%';
  const mid = sy + innerHeight / 2;
  let cur = 0;
  secs.forEach((s, i) => { if (topOf(s) <= mid) cur = i; });
  dots.forEach((d, i) => d.classList.toggle('on', i === cur));

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ---------------- Boot ---------------- */
buildAnchors();
camNow.copy(anchors[0].pos); lookNow.copy(anchors[0].look);
sampleScroll(scrollY); camNow.copy(camTarget); lookNow.copy(lookTarget);
document.body.classList.add('loading');
renderer.compile(scene, camera);
requestAnimationFrame(frame);

const pct = $('#loadPct');
let shown = 0;
const fontsReady = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => buildAnchors());
const loadTick = () => {
  shown = Math.min(100, shown + 3 + Math.random() * 6);
  pct.textContent = Math.floor(shown);
  if (shown < 100) setTimeout(loadTick, 30);
  else fontsReady.then(() => {
    $('#loader').classList.add('done');
    document.body.classList.remove('loading');
    document.body.classList.add('ready');
    started = true;
    if (reduce) intro = 1;
  });
};
loadTick();
