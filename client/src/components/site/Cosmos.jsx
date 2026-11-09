import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/*
 * The universe behind the Lord: a spiral galaxy turning around Him, drifting nebula clouds,
 * a twinkling starfield and the occasional shooting star. Indigo, violet and temple gold only,
 * and kept dim so the hero text stays readable.
 */

const CAMERA_Z = 12; // must match the camera in ChakraScene

// The cursor, eased so the sky glides after it rather than snapping (x, y in -1..1)
const look = new THREE.Vector2();
function easeLook(state, delta) {
  const k = 1 - Math.exp(-delta * 2.2);
  look.x += (state.pointer.x - look.x) * k;
  look.y += (state.pointer.y - look.y) * k;
}
const GALAXY_Z = -9;

// mulberry32: a seeded random so the sky looks the same on every visit
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- shared point shader: soft round stars, twinkle, optional galactic rotation ---------- */

const pointVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSpin;      // 0 = static field, >0 = the disc slowly turns as one
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    if (uSpin > 0.0) {
      float r = length(p.xz);
      // the whole disc turns as one, so the spiral arms keep their shape forever
      // (orbiting inner stars faster would wind the arms up into rings within a minute)
      float a = atan(p.z, p.x) - uTime * uSpin * 0.4;
      p.x = cos(a) * r;
      p.z = sin(a) * r;
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPixelRatio * (1.0 / -mv.z);
    vColor = aColor;
    vTwinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aPhase) + aPhase * 6.2831);
  }
`;

const pointFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float alpha = pow(core, 1.8) * vTwinkle * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vColor * (0.6 + core), alpha);
  }
`;

function usePointMaterial({ size, opacity, spin = 0 }) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uPixelRatio: { value: 1 },
          uSpin: { value: spin },
          uOpacity: { value: opacity },
        },
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [size, opacity, spin]
  );
}

/* ---------- galaxy ---------- */

const GALAXY_INNER = new THREE.Color("#ffd9a0"); // temple gold at the core
const GALAXY_MID = new THREE.Color("#e8a8ff");
const GALAXY_OUTER = new THREE.Color("#5b4bff"); // indigo at the rim

function galaxyGeometry(count) {
  const rand = rng(108);
  const ARMS = 5;
  const RADIUS = 19;
  const SWIRL = 0.5; // how tightly the arms wind
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = (0.04 + Math.pow(rand(), 1.05) * 0.96) * RADIUS;
    const branch = ((i % ARMS) / ARMS) * Math.PI * 2;
    const swirl = r * SWIRL;
    // scatter grows towards the rim; pow() keeps most stars tight to the arm
    const spread = 0.07 + r * 0.024;
    const off = () => Math.pow(rand(), 2.6) * (rand() < 0.5 ? 1 : -1) * spread * 3;
    pos[i * 3] = Math.cos(branch + swirl) * r + off();
    pos[i * 3 + 1] = off() * 0.35;
    pos[i * 3 + 2] = Math.sin(branch + swirl) * r + off();
    const k = r / RADIUS;
    if (k < 0.35) c.copy(GALAXY_INNER).lerp(GALAXY_MID, k / 0.35);
    else c.copy(GALAXY_MID).lerp(GALAXY_OUTER, (k - 0.35) / 0.65);
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = 0.6 + rand() * rand() * 2.4;
    phase[i] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}

function radialGlowTexture() {
  const s = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,222,160,0.9)");
  g.addColorStop(0.25, "rgba(240,170,110,0.35)");
  g.addColorStop(0.6, "rgba(140,90,220,0.1)");
  g.addColorStop(1, "rgba(90,70,220,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Projects the halo anchor's screen centre (shifted down by `dropFactor` anchor-heights) onto the plane at depth `z`
function anchorAtDepth(state, anchor, z, out, dropFactor = 0) {
  const canvasRect = state.gl.domElement.getBoundingClientRect();
  const rect = anchor.getBoundingClientRect();
  if (!canvasRect.width || !rect.width) return false;
  const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
  const worldPerPx = vp.width / canvasRect.width;
  const depthScale = (CAMERA_Z - z) / CAMERA_Z;
  out.x = (rect.left + rect.width / 2 - canvasRect.left - canvasRect.width / 2) * worldPerPx * depthScale;
  out.y = -(rect.top + rect.height / 2 + rect.height * dropFactor - canvasRect.top - canvasRect.height / 2) * worldPerPx * depthScale;
  return true;
}

function Galaxy({ anchorRef, count, still }) {
  const group = useRef();
  const geometry = useMemo(() => galaxyGeometry(count), [count]);
  const material = usePointMaterial({ size: 95, opacity: 0.7, spin: 0.16 });
  const core = useMemo(radialGlowTexture, []);
  const target = useMemo(() => new THREE.Vector2(), []);

  const disc = useRef();
  useFrame((state) => {
    // the galaxy's heart sits behind the Lord's chest, so its arms sweep out around Him
    if (anchorRef.current && anchorAtDepth(state, anchorRef.current, GALAXY_Z, target, 1.15)) {
      // a little parallax: the universe lies far behind the Lord, so it shifts against the cursor
      group.current.position.set(target.x - look.x * 0.9, target.y - look.y * 0.6, GALAXY_Z);
    }
    disc.current.rotation.set(0.62 - look.y * 0.14, look.x * 0.12, -0.18 + look.x * 0.05);
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (!still) material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    // tipped back so the disc reads as a galaxy seen at an angle, with the Lord at its heart
    <group ref={group}>
      <group ref={disc} rotation={[0.62, 0, -0.18]}>
        <points geometry={geometry} material={material} />
      </group>
      <mesh>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={core} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ---------- nebula ---------- */

function nebulaTexture(seed, palette) {
  const rand = rng(seed);
  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 70; i++) {
    // blobs clustered towards the middle, so the sprite fades to nothing at its edges
    const ang = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 1.4) * s * 0.3;
    const x = s / 2 + Math.cos(ang) * dist;
    const y = s / 2 + Math.sin(ang) * dist * 0.7;
    const r = s * (0.06 + rand() * 0.16);
    const [cr, cg, cb] = palette[Math.floor(rand() * palette.length)];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.05 + rand() * 0.07})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// kept clear of the text column (left-middle) so the heading and buttons stay crisp
const NEBULAE = [
  { seed: 7, pos: [7, 3.5, -16], scale: 17, rot: 0.4, speed: 0.006, opacity: 0.9, palette: [[120, 80, 230], [190, 90, 200], [70, 80, 220]] },
  { seed: 21, pos: [-18, 8.5, -18], scale: 19, rot: 2.1, speed: -0.004, opacity: 0.7, palette: [[90, 70, 210], [60, 60, 170], [150, 90, 220]] },
  { seed: 33, pos: [11, -7.5, -14], scale: 13, rot: 4.0, speed: 0.005, opacity: 0.55, palette: [[240, 170, 90], [200, 110, 150], [130, 80, 210]] },
];

function Nebulae({ still }) {
  const refs = useRef([]);
  const textures = useMemo(() => NEBULAE.map((n) => nebulaTexture(n.seed, n.palette)), []);
  useFrame((state, delta) => {
    if (still) return;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += delta * NEBULAE[i].speed;
      m.position.x = NEBULAE[i].pos[0] - look.x * 1.6;
      m.position.y = NEBULAE[i].pos[1] - look.y * 1.0;
      m.material.opacity = NEBULAE[i].opacity * (0.85 + Math.sin(state.clock.elapsedTime * 0.15 + i * 2) * 0.15);
    });
  });
  return NEBULAE.map((n, i) => (
    <mesh key={n.seed} ref={(m) => (refs.current[i] = m)} position={n.pos} rotation={[0, 0, n.rot]} scale={n.scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={textures[i]} transparent opacity={n.opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  ));
}

/* ---------- distant starfield ---------- */

function starGeometry(count) {
  const rand = rng(9);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const tints = [new THREE.Color("#fff6e0"), new THREE.Color("#ffe1a8"), new THREE.Color("#c9c4ff"), new THREE.Color("#a99bff")];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * 60;
    pos[i * 3 + 1] = (rand() - 0.5) * 34;
    pos[i * 3 + 2] = -12 - rand() * 22;
    const c = tints[Math.floor(rand() * tints.length)];
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = 0.5 + Math.pow(rand(), 4) * 3;
    phase[i] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}

function Starfield({ count, still }) {
  const points = useRef();
  const geometry = useMemo(() => starGeometry(count), [count]);
  const material = usePointMaterial({ size: 80, opacity: 0.9 });
  useFrame((state, delta) => {
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (still) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    points.current.rotation.z += delta * 0.004; // the whole sky turns, very slowly
    points.current.position.set(-look.x * 2.2, -look.y * 1.3, 0);
  });
  return <points ref={points} geometry={geometry} material={material} />;
}

/* ---------- shooting star ---------- */

function streakTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(255,230,180,0)");
  g.addColorStop(0.85, "rgba(255,230,180,0.55)");
  g.addColorStop(1, "rgba(255,255,240,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 2, 256, 4);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function ShootingStar({ still }) {
  const mesh = useRef();
  const tex = useMemo(streakTexture, []);
  const s = useRef({ next: 4, start: 0, from: new THREE.Vector3(), dir: new THREE.Vector3() });
  useFrame((state) => {
    const m = mesh.current;
    if (still) {
      m.visible = false;
      return;
    }
    const t = state.clock.elapsedTime;
    const st = s.current;
    if (t > st.next) {
      // start somewhere in the upper sky, fall down-left at a shallow angle
      st.start = t;
      st.next = t + 9 + Math.random() * 9;
      st.from.set(2 + Math.random() * 12, 5 + Math.random() * 4, -10);
      const a = Math.PI + 0.35 + Math.random() * 0.25;
      st.dir.set(Math.cos(a), Math.sin(a), 0);
      m.rotation.z = a; // the bright head of the streak leads
    }
    const k = (t - st.start) / 1.4;
    if (k < 0 || k > 1) {
      m.visible = false;
      return;
    }
    m.visible = true;
    m.position.copy(st.from).addScaledVector(st.dir, k * 14);
    m.material.opacity = Math.sin(k * Math.PI) * 0.9;
  });
  return (
    <mesh ref={mesh} visible={false} scale={[3.2, 0.06, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ---------- gold sparkles trailing the cursor ---------- */

const TRAIL_MAX = 90;
const trailVertex = /* glsl */ `
  uniform float uPixelRatio;
  attribute float aLife;
  attribute float aSize;
  varying float vLife;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (0.4 + aLife) * uPixelRatio * (88.0 / -mv.z);
    vLife = aLife;
  }
`;
const trailFragment = /* glsl */ `
  varying float vLife;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // a soft dot with a faint four-point glint
    float glint = max(0.0, 1.0 - abs(c.x) * 14.0) * max(0.0, 1.0 - abs(c.y) * 2.2)
                + max(0.0, 1.0 - abs(c.y) * 14.0) * max(0.0, 1.0 - abs(c.x) * 2.2);
    float a = (pow(smoothstep(0.5, 0.0, d), 2.0) * 1.0 + glint * 0.75) * vLife;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(vec3(1.0, 0.72, 0.35), vec3(1.0, 0.96, 0.85), vLife), a);
  }
`;

function CursorTrail({ still }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
    g.setAttribute("aLife", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX), 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX), 1));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: 1 } },
        vertexShader: trailVertex,
        fragmentShader: trailFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const sim = useRef({ vel: new Float32Array(TRAIL_MAX * 3), next: 0, last: null, carry: 0 });

  useFrame((state, delta) => {
    if (still) return;
    const st = sim.current;
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    const pos = geo.attributes.position.array;
    const life = geo.attributes.aLife.array;
    const size = geo.attributes.aSize.array;
    const dt = Math.min(delta, 0.05);

    // emit along the path the cursor travelled since the last frame
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 2]);
    const px = (state.pointer.x * vp.width) / 2;
    const py = (state.pointer.y * vp.height) / 2;
    if (st.last) {
      const dx = px - st.last[0];
      const dy = py - st.last[1];
      const dist = Math.hypot(dx, dy);
      if (dist > 0.002 && dist < 3) {
        st.carry += dist * 7;
        while (st.carry >= 1) {
          st.carry -= 1;
          const i = st.next;
          st.next = (st.next + 1) % TRAIL_MAX;
          const f = Math.random();
          pos[i * 3] = st.last[0] + dx * f + (Math.random() - 0.5) * 0.08;
          pos[i * 3 + 1] = st.last[1] + dy * f + (Math.random() - 0.5) * 0.08;
          pos[i * 3 + 2] = 2;
          st.vel[i * 3] = (Math.random() - 0.5) * 0.35 - dx * 0.6;
          st.vel[i * 3 + 1] = (Math.random() - 0.2) * 0.35 - dy * 0.6;
          life[i] = 1;
          size[i] = 0.55 + Math.random() * 0.75;
        }
      }
    }
    st.last = [px, py];

    for (let i = 0; i < TRAIL_MAX; i++) {
      if (life[i] <= 0) continue;
      life[i] = Math.max(0, life[i] - dt / 1.5);
      st.vel[i * 3 + 1] -= dt * 0.25; // settles gently, like drifting gold dust
      pos[i * 3] += st.vel[i * 3] * dt;
      pos[i * 3 + 1] += st.vel[i * 3 + 1] * dt;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aLife.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
  });

  return <points geometry={geo} material={material} frustumCulled={false} />;
}

function LookTracker({ still }) {
  useFrame((state, delta) => {
    if (!still) easeLook(state, delta);
  });
  return null;
}

export default function Cosmos({ anchorRef, still, compact }) {
  return (
    <group>
      <LookTracker still={still} />
      <Nebulae still={still} />
      <Starfield count={compact ? 700 : 1600} still={still} />
      <Galaxy anchorRef={anchorRef} count={compact ? 9000 : 22000} still={still} />
      <ShootingStar still={still} />
      {/* touch screens have no hover, so the trail is for mouse users only */}
      {!compact && <CursorTrail still={still} />}
    </group>
  );
}
