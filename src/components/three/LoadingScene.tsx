import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';

const CYAN = '#22d3ee';
const VIOLET = '#a78bfa';
const PINK = '#ec4899';
const SKY = '#38bdf8';

/* -------------------------------------------------------------------------- */
/*  Pulsing core                                                               */
/* -------------------------------------------------------------------------- */

function Core() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.35;
    ref.current.rotation.y = t * 0.55;
    const mat = ref.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.95 + Math.sin(t * 3) * 0.4;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.42, 1]} />
      <meshStandardMaterial
        color={CYAN}
        emissive={CYAN}
        emissiveIntensity={1}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/*  Wireframe shells                                                           */
/* -------------------------------------------------------------------------- */

function Shell({
  radius,
  color,
  opacity,
  speed,
}: {
  radius: number;
  color: string;
  opacity: number;
  speed: [number, number, number];
}) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * speed[0];
    ref.current.rotation.y += dt * speed[1];
    ref.current.rotation.z += dt * speed[2];
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[radius, 1]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/*  Orbiting ring                                                              */
/* -------------------------------------------------------------------------- */

function Ring({
  radius,
  tilt,
  speed,
  color,
}: {
  radius: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return (
    <group ref={ref} rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, 0.01, 8, 140]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Orbital data nodes                                                         */
/* -------------------------------------------------------------------------- */

function OrbitNodes() {
  const groupRef = useRef<Group>(null);
  const meshRefs = useRef<(Mesh | null)[]>([]);

  const nodes = useMemo(() => {
    const colors = [CYAN, VIOLET, PINK, SKY];
    return Array.from({ length: 7 }, (_, i) => {
      const angle = (i / 7) * Math.PI * 2;
      const radius = 1.55 + (i % 2) * 0.18;
      const y = Math.sin(i * 1.3) * 0.4;
      return {
        pos: [
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius * 0.85,
        ] as [number, number, number],
        color: colors[i % colors.length],
        phase: i * 0.9,
      };
    });
  }, []);

  useFrame((state, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.4;
    const t = state.clock.getElapsedTime();
    meshRefs.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.7 + Math.sin(t * 2.4 + nodes[i].phase) * 0.55;
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={n.pos}
        >
          <icosahedronGeometry args={[0.07, 1]} />
          <meshStandardMaterial
            color={n.color}
            emissive={n.color}
            emissiveIntensity={0.8}
            metalness={0.4}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scene wrapper — slow overall rotation for cinematic depth                  */
/* -------------------------------------------------------------------------- */

function SceneRotator({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return <group ref={ref}>{children}</group>;
}

/* -------------------------------------------------------------------------- */
/*  Public scene                                                               */
/* -------------------------------------------------------------------------- */

export function LoadingScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [1.4, 1.05, 3.7], fov: 48 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.65} />
        <pointLight position={[3, 3, 3]} intensity={1.0} color={CYAN} />
        <pointLight position={[-3, -1, 2]} intensity={0.75} color={VIOLET} />
        <pointLight position={[0, 1.5, 0.5]} intensity={0.8} color={SKY} />

        <SceneRotator>
          <Core />
          <Shell
            radius={0.65}
            color={CYAN}
            opacity={0.32}
            speed={[0.2, 0.3, 0]}
          />
          <Shell
            radius={0.88}
            color={VIOLET}
            opacity={0.16}
            speed={[-0.16, 0.24, 0.1]}
          />

          <Ring radius={1.2} tilt={[1.0, 0.2, 0]} speed={0.5} color={CYAN} />
          <Ring
            radius={1.5}
            tilt={[-0.6, 0.7, 0.3]}
            speed={-0.35}
            color={VIOLET}
          />
          <Ring
            radius={1.85}
            tilt={[1.2, -0.3, 0.2]}
            speed={0.25}
            color={PINK}
          />

          <OrbitNodes />
        </SceneRotator>
      </Suspense>
    </Canvas>
  );
}
