import { Suspense, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import TulsiImage from "@/assets/petal-tulsi.webp";
import JasmineImage from "@/assets/petal-jasmine.webp";
import MarigoldImage from "@/assets/petal-marigold.webp";

/*
 * Pushpa vrishti: tulsi leaves, jasmine and marigold petals, each a real photograph cut out and
 * laid on a gently curved surface, falling the way real petals do: swinging side to side like a
 * pendulum, banking into each swing, speeding up as it straightens and now and then flipping over.
 */

// A thin curved sheet the shape of the photo: cupped across its width, bowed along its length.
function curvedSheet(length, aspect, cup, curl) {
  const width = length * aspect;
  const SU = 8;
  const SV = 12;
  const pos = [];
  const uv = [];
  const idx = [];
  for (let j = 0; j <= SV; j++) {
    const v = j / SV;
    for (let i = 0; i <= SU; i++) {
      const u = i / SU;
      const x = (u - 0.5) * width;
      const y = (v - 0.5) * length;
      const z = cup * ((u - 0.5) * 2) ** 2 * width * 0.5 + curl * (v - 0.5) ** 2 * length;
      pos.push(x, y, z);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < SV; j++) {
    for (let i = 0; i < SU; i++) {
      const a = j * (SU + 1) + i;
      const b = a + SU + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/*
 * Lengths keep the real proportions: a tulsi leaf (with its stalk) is the largest, a marigold
 * petal a little smaller, and a jasmine petal the smallest. Aspect is width / length of each photo.
 */
const KINDS = {
  tulsi: { src: TulsiImage, share: 0.42, length: 0.34, aspect: 334 / 512, cup: 0.18, curl: -0.1, size: [0.85, 1.15] },
  marigold: { src: MarigoldImage, share: 0.33, length: 0.27, aspect: 299 / 512, cup: 0.32, curl: 0.18, size: [0.85, 1.1] },
  jasmine: { src: JasmineImage, share: 0.25, length: 0.21, aspect: 311 / 512, cup: 0.4, curl: -0.14, size: [0.85, 1.1] },
};

/* ---------- motion ---------- */

function makePetal(spread, size) {
  const rand = Math.random;
  return {
    x: (rand() - 0.5) * spread,
    y: rand() * 12 - 6,
    z: rand() * -3 + 1,
    fall: 0.38 + rand() * 0.3, // base fall speed
    swing: 0.35 + rand() * 0.5, // side-to-side amplitude
    freq: 0.9 + rand() * 0.9, // swings per second (radians)
    phase: rand() * Math.PI * 2,
    flip: rand() < 0.35 ? 0.6 + rand() * 1.2 : 0, // some tumble end over end
    yaw: rand() * Math.PI * 2,
    yawSpeed: (rand() - 0.5) * 0.8,
    scale: size[0] + rand() * (size[1] - size[0]),
    drift: (rand() - 0.5) * 0.15, // a breath of wind
  };
}

function PetalKind({ kind, count, spread, still }) {
  const def = KINDS[kind];
  const mesh = useRef();
  const map = useLoader(THREE.TextureLoader, def.src);
  if (map.colorSpace !== THREE.SRGBColorSpace) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;
  }
  const geometry = useMemo(() => curvedSheet(def.length, def.aspect, def.cup, def.curl), [def]);
  const petals = useMemo(() => Array.from({ length: count }, () => makePetal(spread, def.size)), [count, spread, def]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    petals.forEach((p, i) => {
      // pendulum glide: the swing angle drives both the sideways motion and the bank
      const s = Math.sin(t * p.freq + p.phase);
      const c = Math.cos(t * p.freq + p.phase);
      if (!still) {
        // falls fastest at the bottom of each swing, slows as it banks up at the ends
        p.y -= p.fall * (0.7 + 0.6 * Math.abs(c)) * dt;
        p.x += p.drift * dt;
        p.yaw += p.yawSpeed * dt;
        if (p.y < -6.5) {
          p.y = 6.5;
          p.x = (Math.random() - 0.5) * spread;
        }
      }
      dummy.position.set(p.x + s * p.swing, p.y, p.z);
      dummy.rotation.set(
        0.5 + c * 0.25 + (p.flip ? t * p.flip : 0), // pitch: nose dips into the glide
        p.yaw,
        -s * 0.75 // bank into each swing like a falling leaf
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      {/* the photo carries its own light and colour; the scene lights only add shading as it turns */}
      <meshStandardMaterial
        map={map}
        emissiveMap={map}
        emissive="#ffffff"
        emissiveIntensity={0.4}
        alphaTest={0.4}
        side={THREE.DoubleSide}
        roughness={0.6}
        metalness={0}
        envMapIntensity={0.35}
      />
    </instancedMesh>
  );
}

export default function Petals({ count, still, spread = 16 }) {
  return (
    <Suspense fallback={null}>
      {Object.keys(KINDS).map((kind) => {
        const n = Math.max(1, Math.round(count * KINDS[kind].share));
        return <PetalKind key={kind} kind={kind} count={n} spread={spread} still={still} />;
      })}
    </Suspense>
  );
}
