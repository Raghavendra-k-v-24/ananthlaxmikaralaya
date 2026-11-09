import { useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import ChakraHalo from "@/assets/chakra-halo.webp";
import Cosmos from "./Cosmos";
import Petals from "./Petals";

// Outer radius of the chakra in model units (the halo anchor's half-width maps to this)
const R_TOTAL = 1.18;
// The chakra artwork (chakra-halo.webp) spans its whole square, side points included
const HALO_SIZE = R_TOTAL * 2 * 1.06;

/* ---------- textures ---------- */

function canvasTexture(draw, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d"), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const radialTexture = (stops) =>
  canvasTexture((ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(([at, c]) => g.addColorStop(at, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }, 128);

// Thin light rays fanning out from the centre, faded towards the edge
const raysTexture = () =>
  canvasTexture((ctx, s) => {
    const c = s / 2;
    ctx.translate(c, c);
    const rays = 48;
    for (let i = 0; i < rays; i++) {
      const long = i % 2 === 0;
      const len = c * (long ? 1 : 0.72);
      const half = (Math.PI / rays) * (long ? 0.32 : 0.22);
      const g = ctx.createRadialGradient(0, 0, c * 0.18, 0, 0, len);
      g.addColorStop(0, "rgba(255,226,160,0.55)");
      g.addColorStop(1, "rgba(255,200,110,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, len, -half, half);
      ctx.closePath();
      ctx.fill();
      ctx.rotate((Math.PI * 2) / rays);
    }
  }, 512);

/* ---------- scene parts ---------- */

// Converts the halo anchor's on-screen box into world position and scale
function placeOverAnchor(state, anchor, target) {
  const canvasRect = state.gl.domElement.getBoundingClientRect();
  const rect = anchor.getBoundingClientRect();
  if (!canvasRect.width || !rect.width) return;
  const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
  const worldPerPx = vp.width / canvasRect.width;
  const cx = rect.left + rect.width / 2 - canvasRect.left;
  const cy = rect.top + rect.height / 2 - canvasRect.top;
  target.position.x = (cx - canvasRect.width / 2) * worldPerPx;
  target.position.y = -(cy - canvasRect.height / 2) * worldPerPx;
  target.scale.setScalar(((rect.width / 2) * worldPerPx) / R_TOTAL);
}

function Chakra({ anchorRef, progress, still }) {
  const root = useRef();
  const wheel = useRef();
  const rays = useRef();
  const glow = useRef();
  // flag the artwork as sRGB before its first upload (needsUpdate re-uploads it if it was already sent);
  // without this it is treated as linear and renders pale and washed out
  const art = useLoader(THREE.TextureLoader, ChakraHalo);
  if (art.colorSpace !== THREE.SRGBColorSpace) {
    art.colorSpace = THREE.SRGBColorSpace;
    art.anisotropy = 8;
    art.needsUpdate = true;
  }

  const textures = useMemo(
    () => ({
      glow: radialTexture([
        [0, "rgba(255,226,160,0.95)"],
        [0.3, "rgba(255,186,90,0.45)"],
        [0.62, "rgba(240,150,60,0.12)"],
        [1, "rgba(240,150,60,0)"],
      ]),
      rays: raysTexture(),
    }),
    []
  );

  useFrame((state, delta) => {
    if (anchorRef.current) placeOverAnchor(state, anchorRef.current, root.current);
    if (still) return;
    const t = state.clock.elapsedTime;
    const boost = progress ? progress.get() * 1.6 : 0;
    // Spin flat in the picture plane about the artwork's exact centre (chakra-halo.webp is cropped
    // so its centre is the image centre). x/y stay locked at 0 so it never tips towards or away
    // from the viewer, and the group is re-pinned over the halo anchor every frame above.
    const w = wheel.current;
    w.rotation.x = 0;
    w.rotation.y = 0;
    w.rotation.z = (w.rotation.z - delta * (0.14 + boost * 0.5)) % (Math.PI * 2);
    rays.current.rotation.z += delta * 0.06;
    glow.current.material.opacity = 0.82 + Math.sin(t * 1.3) * 0.18;
    rays.current.material.opacity = 0.5 + Math.sin(t * 0.9 + 1) * 0.15;
  });

  return (
    <group ref={root}>
      <mesh ref={rays} position={[0, 0, -0.3]}>
        <planeGeometry args={[R_TOTAL * 4.6, R_TOTAL * 4.6]} />
        <meshBasicMaterial map={textures.rays} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={glow} position={[0, 0, -0.2]}>
        <planeGeometry args={[R_TOTAL * 3.4, R_TOTAL * 3.4]} />
        <meshBasicMaterial map={textures.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={wheel}>
        <planeGeometry args={[HALO_SIZE, HALO_SIZE]} />
        <meshBasicMaterial map={art} transparent alphaTest={0.02} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GoldDust({ count, still }) {
  const points = useRef();
  const sprite = useMemo(
    () =>
      radialTexture([
        [0, "rgba(255,240,200,1)"],
        [0.25, "rgba(246,212,138,0.8)"],
        [1, "rgba(246,212,138,0)"],
      ]),
    []
  );
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = Math.random() * -6 + 1.5;
      speeds[i] = 0.08 + Math.random() * 0.28;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state, delta) => {
    if (still) return;
    const attr = points.current.geometry.attributes.position;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = attr.array[i * 3 + 1] + speeds[i] * delta;
      if (y > 5.5) y = -5.5;
      attr.array[i * 3 + 1] = y;
      attr.array[i * 3] += Math.sin(t * 0.6 + i) * 0.0015;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.09}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#f6d48a"
      />
    </points>
  );
}

const canvasProps = (active, still, compact) => ({
  className: "!absolute inset-0",
  frameloop: still ? "demand" : active ? "always" : "never",
  dpr: [1, compact ? 1.5 : 1.75],
  camera: { position: [0, 0, 12], fov: 35 },
  gl: { antialias: true, alpha: true, powerPreference: "high-performance" },
});

// Behind the deity: the universe turning around Him, the chakra halo, gold dust and a few petals
export default function ChakraScene({ anchorRef, eventSource, progress, active, still, compact, onReady }) {
  return (
    <Canvas {...canvasProps(active, still, compact)} eventSource={eventSource} eventPrefix="client" onCreated={() => onReady?.()}>
      <ambientLight intensity={0.6} color="#ffe9c4" />
      <directionalLight position={[3, 5, 8]} intensity={1.8} color="#ffe2b0" />
      <pointLight position={[0, 0, 4]} intensity={14} color="#ffb04a" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffd9a0" position={[0, 5, 4]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffb259" position={[-5, 0, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#9a8cff" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={2.4} color="#fff1cf" position={[0, 0, 6]} scale={3} />
      </Environment>

      <Cosmos anchorRef={anchorRef} still={still} compact={compact} />
      <Chakra anchorRef={anchorRef} progress={progress} still={still} />
      <GoldDust count={compact ? 200 : 420} still={still} />
      <Petals count={compact ? 12 : 22} still={still} />
    </Canvas>
  );
}

// In front of the deity: a light shower of petals (pushpa vrishti)
export function PetalShower({ active, still, compact }) {
  return (
    <Canvas {...canvasProps(active, still, compact)} style={{ pointerEvents: "none" }}>
      <ambientLight intensity={0.8} color="#ffe9c4" />
      <directionalLight position={[3, 5, 8]} intensity={1.6} color="#ffe2b0" />
      <Petals count={compact ? 7 : 14} still={still} spread={9} />
    </Canvas>
  );
}
