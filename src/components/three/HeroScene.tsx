import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Float,
  Line,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei';
import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  Color,
  DoubleSide,
  NormalBlending,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type Points,
} from 'three';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const BRAND = {
  blue: '#5e8bff',
  violet: '#a78bfa',
  pink: '#ec4899',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  green: '#34d399',
};

/* -------------------------------------------------------------------------- */
/*  Active throttling — pauses work when tab hidden                            */
/* -------------------------------------------------------------------------- */

function useActive() {
  const ref = useRef(typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const onVis = () => {
      ref.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  return ref;
}

/* -------------------------------------------------------------------------- */
/*  Theme tracking — observes the `dark` class on <html> reactively            */
/* -------------------------------------------------------------------------- */

function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/* -------------------------------------------------------------------------- */
/*  Pauses the R3F render loop when the canvas leaves the viewport             */
/* -------------------------------------------------------------------------- */

function ViewportFrameloop() {
  const { gl, set } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        set({ frameloop: entry.isIntersecting ? 'always' : 'never' });
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [gl, set]);
  return null;
}

/* -------------------------------------------------------------------------- */
/*  AI screen — radar pulse, scan sweep, waveform, status                      */
/* -------------------------------------------------------------------------- */

function useAIScreenTexture(reduced: boolean, active: { current: boolean }) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 240;
    const t = new CanvasTexture(c);
    t.anisotropy = 2;
    return { canvas: c, texture: t };
  }, []);

  const dataPoints = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 35 + Math.random() * 60,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  const tRef = useRef(0);
  const tickRef = useRef(0);

  const draw = useMemo(
    () => (t: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#060912';
      ctx.fillRect(0, 0, W, H);

      // Faint grid
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 16; x < W; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 16; y < H; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const cx = W / 2;
      const cy = H / 2 + 6;

      // Expanding radar rings
      for (let i = 0; i < 3; i++) {
        const phase = ((t * 0.35) + i * 0.33) % 1;
        const r = phase * 110;
        const alpha = (1 - phase) * 0.5;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Static reference rings
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.lineWidth = 1;
      [30, 60, 90].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Rotating scan line trail
      const angle = t * 1.1;
      for (let i = 0; i < 18; i++) {
        const a = angle - i * 0.045;
        const alpha = (1 - i / 18) * 0.35;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95);
        ctx.stroke();
      }

      // Pulsing core
      const core = (Math.sin(t * 3) + 1) / 2;
      ctx.fillStyle = `rgba(34, 211, 238, ${0.45 + core * 0.55})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5 + core * 2, 0, Math.PI * 2);
      ctx.fill();

      // Data points
      dataPoints.forEach((p) => {
        const pulse = (Math.sin(t * 2 + p.phase) + 1) / 2;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        ctx.fillStyle = `rgba(167, 139, 250, ${0.45 + pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.6 + pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Top status bar
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(12, 14, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('AI · CORE ACTIVE', 22, 17);

      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.font = '500 8px "JetBrains Mono", monospace';
      ctx.fillText(`NODES: ${dataPoints.length}`, W - 70, 17);

      // Bottom waveform
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 10; x < W - 10; x += 2) {
        const y =
          H - 18 +
          Math.sin(x * 0.15 + t * 4) * 4 +
          Math.sin(x * 0.07 + t * 2) * 3;
        if (x === 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(94, 139, 255, 0.8)';
      ctx.font = '500 8px "JetBrains Mono", monospace';
      ctx.fillText('STREAM · 92.4%', 12, H - 4);
      ctx.fillText(
        `T+${(t * 10).toFixed(1)}s`,
        W - 60,
        H - 4,
      );

      texture.needsUpdate = true;
    },
    [canvas, texture, dataPoints],
  );

  useEffect(() => {
    draw(0);
  }, [draw]);

  useFrame((_, dt) => {
    if (!active.current) return;
    tRef.current += dt * (reduced ? 0.3 : 1);
    tickRef.current += dt;
    if (tickRef.current > 1 / 15) {
      tickRef.current = 0;
      draw(tRef.current);
    }
  });

  return texture;
}

/* -------------------------------------------------------------------------- */
/*  Holographic code panel texture                                             */
/* -------------------------------------------------------------------------- */

type CodeRow = { indent: number; segs: { w: number; color: string }[] };

function useHoloCodeTexture(reduced: boolean, active: { current: boolean }) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const t = new CanvasTexture(c);
    t.anisotropy = 2;
    return { canvas: c, texture: t };
  }, []);

  const rowsRef = useRef<CodeRow[]>([]);
  const offsetRef = useRef(0);
  const tickRef = useRef(0);

  const palette = useMemo(
    () => [BRAND.cyan, BRAND.violet, BRAND.pink, BRAND.blue, '#cbd5e1'],
    [],
  );

  const makeRow = useMemo(
    () => (): CodeRow => {
      const indent = Math.floor(Math.random() * 3) * 12;
      const segCount = 1 + Math.floor(Math.random() * 3);
      const segs: CodeRow['segs'] = [];
      for (let i = 0; i < segCount; i++) {
        segs.push({
          w: 18 + Math.floor(Math.random() * 50),
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      }
      return { indent, segs };
    },
    [palette],
  );

  useEffect(() => {
    const rowCount = Math.ceil(canvas.height / 11) + 2;
    rowsRef.current = Array.from({ length: rowCount }, () => makeRow());
    rowsRef.current.forEach((r, i) => {
      if (i % 5 === 0) r.segs = [];
    });
  }, [canvas.height, makeRow]);

  const draw = useMemo(
    () => () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      // Holo background
      ctx.fillStyle = 'rgba(10, 18, 34, 0.92)';
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('// SYSTEM.STREAM', 10, 13);

      // Code rows
      const rowH = 11;
      const offset = offsetRef.current;
      rowsRef.current.forEach((row, i) => {
        const y = 20 + i * rowH - offset;
        if (y > H - 6 || y < 14) return;
        let x = 10 + row.indent;
        row.segs.forEach((s) => {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x, y, s.w, 5);
          x += s.w + 5;
          if (x > W - 8) return;
        });
      });
      ctx.globalAlpha = 1;

      // Scan lines (subtle horizontal striations for holo feel)
      ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      // Corner brackets
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.lineWidth = 1.2;
      const bs = 8;
      [
        [0, 0, 1, 1],
        [W, 0, -1, 1],
        [0, H, 1, -1],
        [W, H, -1, -1],
      ].forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x as number, (y as number) + (dy as number) * bs);
        ctx.lineTo(x as number, y as number);
        ctx.lineTo((x as number) + (dx as number) * bs, y as number);
        ctx.stroke();
      });

      texture.needsUpdate = true;
    },
    [canvas, texture],
  );

  useEffect(() => {
    draw();
  }, [draw]);

  useFrame((_, dt) => {
    if (!active.current) return;
    const speed = reduced ? 4 : 14;
    offsetRef.current += dt * speed;
    tickRef.current += dt;

    if (offsetRef.current >= 11) {
      const shift = Math.floor(offsetRef.current / 11);
      for (let i = 0; i < shift; i++) {
        rowsRef.current.shift();
        const r = makeRow();
        if (Math.random() < 0.18) r.segs = [];
        rowsRef.current.push(r);
      }
      offsetRef.current -= shift * 11;
    }

    if (tickRef.current > 1 / 12) {
      tickRef.current = 0;
      draw();
    }
  });

  return texture;
}

/* -------------------------------------------------------------------------- */
/*  Holographic chart panel texture                                            */
/* -------------------------------------------------------------------------- */

function useHoloChartTexture(reduced: boolean, active: { current: boolean }) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const t = new CanvasTexture(c);
    t.anisotropy = 2;
    return { canvas: c, texture: t };
  }, []);

  const phaseRef = useRef(0);
  const tickRef = useRef(0);

  const draw = useMemo(
    () => (phase: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = 'rgba(10, 18, 34, 0.92)';
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = 'rgba(167, 139, 250, 0.85)';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('// NEURAL.SIGNAL', 10, 13);

      // Grid
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.1)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(10, 30 + g * 28);
        ctx.lineTo(W - 10, 30 + g * 28);
        ctx.stroke();
      }

      // Waveform (multi-band)
      const bands = [
        { color: 'rgba(34, 211, 238, 0.9)', freq: 0.42, amp: 22, off: 0 },
        { color: 'rgba(167, 139, 250, 0.7)', freq: 0.18, amp: 16, off: 0.5 },
        { color: 'rgba(236, 72, 153, 0.6)', freq: 0.62, amp: 10, off: 1.1 },
      ];
      bands.forEach((band) => {
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const N = 36;
        for (let i = 0; i <= N; i++) {
          const x = 10 + (i / N) * (W - 20);
          const y =
            H / 2 +
            8 +
            Math.sin(phase + band.off + i * band.freq) * band.amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Bottom legend dots
      const legend = [
        { c: 'rgba(34, 211, 238, 0.9)', l: 'A' },
        { c: 'rgba(167, 139, 250, 0.9)', l: 'B' },
        { c: 'rgba(236, 72, 153, 0.9)', l: 'C' },
      ];
      legend.forEach((p, i) => {
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(14 + i * 30, H - 12, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
        ctx.font = '500 7px "JetBrains Mono", monospace';
        ctx.fillText(p.l, 20 + i * 30, H - 9);
      });

      // Scan lines
      ctx.fillStyle = 'rgba(167, 139, 250, 0.05)';
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      // Corner brackets
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)';
      ctx.lineWidth = 1.2;
      const bs = 8;
      [
        [0, 0, 1, 1],
        [W, 0, -1, 1],
        [0, H, 1, -1],
        [W, H, -1, -1],
      ].forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x as number, (y as number) + (dy as number) * bs);
        ctx.lineTo(x as number, y as number);
        ctx.lineTo((x as number) + (dx as number) * bs, y as number);
        ctx.stroke();
      });

      texture.needsUpdate = true;
    },
    [canvas, texture],
  );

  useEffect(() => {
    draw(0);
  }, [draw]);

  useFrame((_, dt) => {
    if (!active.current) return;
    phaseRef.current += dt * (reduced ? 0.2 : 0.9);
    tickRef.current += dt;
    if (tickRef.current > 1 / 12) {
      tickRef.current = 0;
      draw(phaseRef.current);
    }
  });

  return texture;
}

/* -------------------------------------------------------------------------- */
/*  Apple logo texture for the back of the lid                                 */
/* -------------------------------------------------------------------------- */

const APPLE_PATH =
  'M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03-3.19 2.61-4.74 2.73-4.81-1.49-2.18-3.81-2.48-4.63-2.51-1.97-.2-3.84 1.16-4.84 1.16-1.02 0-2.55-1.13-4.2-1.1-2.16.03-4.15 1.25-5.27 3.17-2.24 3.89-.57 9.65 1.61 12.81 1.07 1.55 2.34 3.28 4 3.22 1.6-.07 2.2-1.04 4.13-1.04 1.93 0 2.46 1.04 4.15 1.01 1.72-.03 2.81-1.57 3.86-3.12 1.21-1.79 1.71-3.52 1.74-3.61-.04-.02-3.34-1.28-3.37-5.07z';

function useAppleLogoTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const tex = new CanvasTexture(c);
    tex.anisotropy = 4;
    if (!ctx) return tex;

    ctx.clearRect(0, 0, c.width, c.height);
    const path = new Path2D(APPLE_PATH);

    ctx.save();
    const drawSize = 200;
    ctx.translate((c.width - drawSize) / 2, (c.height - drawSize) / 2);
    ctx.scale(drawSize / 24, drawSize / 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill(path);
    ctx.restore();

    tex.needsUpdate = true;
    return tex;
  }, []);
}

/* -------------------------------------------------------------------------- */
/*  AI Laptop                                                                  */
/* -------------------------------------------------------------------------- */

function AILaptop({
  reduced,
  active,
  isDark,
}: {
  reduced: boolean;
  active: { current: boolean };
  isDark: boolean;
}) {
  const screenTex = useAIScreenTexture(reduced, active);
  const appleTex = useAppleLogoTexture();

  return (
    <group position={[0, -0.55, 0]} rotation={[0.05, 0, 0]}>
      {/* Base */}
      <RoundedBox args={[2.4, 0.09, 1.55]} radius={0.04} smoothness={2}>
        <meshStandardMaterial color="#141828" metalness={0.85} roughness={0.28} />
      </RoundedBox>

      {/* Trackpad */}
      <mesh position={[0, 0.046, 0.42]}>
        <planeGeometry args={[0.7, 0.42]} />
        <meshStandardMaterial
          color="#0b0f1e"
          metalness={0.5}
          roughness={0.5}
          emissive="#1a2c52"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Keyboard area (single plane) */}
      <mesh position={[0, 0.046, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.85]} />
        <meshStandardMaterial
          color="#0a1024"
          emissive={BRAND.cyan}
          emissiveIntensity={0.04}
          roughness={0.85}
        />
      </mesh>

      {/* Front edge cyan accent strip */}
      <mesh position={[0, 0.025, 0.77]}>
        <boxGeometry args={[1.8, 0.012, 0.006]} />
        <meshStandardMaterial
          color={BRAND.cyan}
          emissive={BRAND.cyan}
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Screen group */}
      <group position={[0, 0.045, -0.75]} rotation={[-0.18, 0, 0]}>
        {/* Lid — silver MacBook-style back */}
        <RoundedBox
          args={[2.4, 1.5, 0.06]}
          radius={0.045}
          smoothness={2}
          position={[0, 0.76, 0]}
        >
          <meshStandardMaterial
            color={isDark ? '#dee1e8' : '#9aa1b0'}
            metalness={isDark ? 0.45 : 0.55}
            roughness={isDark ? 0.5 : 0.45}
            emissive={isDark ? '#1a1f2a' : '#000000'}
            emissiveIntensity={isDark ? 0.18 : 0}
          />
        </RoundedBox>

        {/* Dark bezel covering the front face only */}
        <mesh position={[0, 0.76, 0.031]}>
          <planeGeometry args={[2.36, 1.46]} />
          <meshStandardMaterial
            color="#0a0f1e"
            metalness={0.5}
            roughness={0.65}
          />
        </mesh>

        {/* Apple logo on the back of the lid */}
        <mesh position={[0, 0.78, -0.034]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial
            map={appleTex}
            color={isDark ? '#ffffff' : '#4b5263'}
            emissive={new Color(isDark ? BRAND.cyan : '#000000')}
            emissiveMap={appleTex}
            emissiveIntensity={isDark ? 0.7 : 0}
            toneMapped={false}
            transparent
            alphaTest={0.05}
            depthWrite={false}
          />
        </mesh>

        {/* Screen face */}
        <mesh position={[0, 0.76, 0.034]}>
          <planeGeometry args={[2.22, 1.34]} />
          <meshStandardMaterial
            map={screenTex}
            emissiveMap={screenTex}
            emissive={new Color('#ffffff')}
            emissiveIntensity={1.05}
            toneMapped={false}
            roughness={0.95}
            metalness={0}
          />
        </mesh>

        {/* Screen back-glow */}
        <mesh position={[0, 0.76, -0.04]}>
          <planeGeometry args={[2.9, 1.9]} />
          <meshBasicMaterial
            color={BRAND.cyan}
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Holographic projection cone — volumetric beam from screen to holograms     */
/* -------------------------------------------------------------------------- */

function HoloLightCone({ isDark }: { isDark: boolean }) {
  const color = isDark ? BRAND.cyan : '#0891b2';
  return (
    <group position={[0, 1.7, 0]}>
      {/* Outer wide cone */}
      <mesh>
        <cylinderGeometry args={[1.9, 0.35, 2.6, 32, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDark ? 0.05 : 0.1}
          side={DoubleSide}
          blending={isDark ? AdditiveBlending : NormalBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Inner brighter cone */}
      <mesh>
        <cylinderGeometry args={[1.2, 0.2, 2.6, 24, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDark ? 0.07 : 0.14}
          side={DoubleSide}
          blending={isDark ? AdditiveBlending : NormalBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Neural core — central rotating wireframe orb with internal nodes           */
/* -------------------------------------------------------------------------- */

type NeuralNode = {
  pos: [number, number, number];
  color: string;
  scale: number;
};

function NeuralCore({
  position,
  reduced,
  active,
  isDark,
}: {
  position: [number, number, number];
  reduced: boolean;
  active: { current: boolean };
  isDark: boolean;
}) {
  const shellRef = useRef<Group>(null);
  const coreGroupRef = useRef<Group>(null);

  const nodes = useMemo<NeuralNode[]>(() => {
    const result: NeuralNode[] = [];
    const colors = [BRAND.cyan, BRAND.violet, BRAND.pink, BRAND.blue, BRAND.green];
    // Spherical Fibonacci distribution of 8 nodes
    const N = 8;
    const phi = Math.PI * (Math.sqrt(5) - 1);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const radius = 0.34;
      result.push({
        pos: [
          Math.cos(theta) * r * radius,
          y * radius,
          Math.sin(theta) * r * radius,
        ],
        color: colors[i % colors.length],
        scale: 0.06 + Math.random() * 0.03,
      });
    }
    return result;
  }, []);

  const edges = useMemo<[number, number][]>(() => {
    const out: [number, number][] = [];
    // Connect each node to its 2 nearest neighbors
    for (let i = 0; i < nodes.length; i++) {
      const dists: { j: number; d: number }[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].pos[0] - nodes[j].pos[0];
        const dy = nodes[i].pos[1] - nodes[j].pos[1];
        const dz = nodes[i].pos[2] - nodes[j].pos[2];
        dists.push({ j, d: dx * dx + dy * dy + dz * dz });
      }
      dists.sort((a, b) => a.d - b.d);
      for (let k = 0; k < 2; k++) {
        const pair: [number, number] = [
          Math.min(i, dists[k].j),
          Math.max(i, dists[k].j),
        ];
        if (!out.some((e) => e[0] === pair[0] && e[1] === pair[1])) {
          out.push(pair);
        }
      }
    }
    return out;
  }, [nodes]);

  const meshRefs = useRef<(Mesh | null)[]>([]);
  const pulseTick = useRef(0);

  useFrame((state, dt) => {
    if (!active.current) return;
    if (shellRef.current && !reduced) {
      shellRef.current.rotation.y += dt * 0.18;
      shellRef.current.rotation.x += dt * 0.07;
    }
    if (coreGroupRef.current && !reduced) {
      coreGroupRef.current.rotation.y -= dt * 0.22;
    }
    pulseTick.current += dt;
    if (pulseTick.current > 1 / 18) {
      pulseTick.current = 0;
      const t = state.clock.getElapsedTime();
      meshRefs.current.forEach((m, i) => {
        if (!m) return;
        const mat = m.material as MeshStandardMaterial;
        mat.emissiveIntensity = 0.7 + Math.sin(t * 2 + i * 1.7) * 0.5;
      });
    }
  });

  return (
    <Float
      speed={reduced ? 0.4 : 0.7}
      floatIntensity={reduced ? 0.2 : 0.45}
      rotationIntensity={0.15}
    >
      <group position={position}>
        {/* Wireframe shell */}
        <group ref={shellRef}>
          <mesh>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshBasicMaterial
              color={isDark ? BRAND.cyan : '#0891b2'}
              wireframe
              transparent
              opacity={isDark ? 0.25 : 0.55}
            />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.7, 0]} />
            <meshBasicMaterial
              color={isDark ? BRAND.violet : '#7c3aed'}
              wireframe
              transparent
              opacity={isDark ? 0.12 : 0.32}
            />
          </mesh>
        </group>

        {/* Inner nodes + edges */}
        <group ref={coreGroupRef}>
          {nodes.map((n, i) => (
            <mesh
              key={i}
              ref={(el) => {
                meshRefs.current[i] = el;
              }}
              position={n.pos}
            >
              <icosahedronGeometry args={[n.scale, 1]} />
              <meshStandardMaterial
                color={n.color}
                emissive={n.color}
                emissiveIntensity={0.8}
                metalness={0.4}
                roughness={0.25}
              />
            </mesh>
          ))}
          {edges.map(([a, b], i) => (
            <Line
              key={i}
              points={[nodes[a].pos, nodes[b].pos]}
              color={BRAND.cyan}
              lineWidth={1}
              transparent
              opacity={0.5}
            />
          ))}
        </group>
      </group>
    </Float>
  );
}

/* -------------------------------------------------------------------------- */
/*  Holographic panel — code or chart                                          */
/* -------------------------------------------------------------------------- */

function HoloPanel({
  position,
  rotation = [0, 0, 0],
  kind,
  accent,
  reduced,
  active,
  isDark,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  kind: 'code' | 'chart';
  accent: string;
  reduced: boolean;
  active: { current: boolean };
  isDark: boolean;
}) {
  const codeTex = useHoloCodeTexture(reduced, active);
  const chartTex = useHoloChartTexture(reduced, active);
  const tex = kind === 'code' ? codeTex : chartTex;

  return (
    <Float
      speed={reduced ? 0.4 : 0.85}
      floatIntensity={reduced ? 0.25 : 0.6}
      rotationIntensity={0.15}
    >
      <group position={position} rotation={rotation}>
        {/* Edge frame */}
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[1.32, 0.84]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={isDark ? 0.12 : 0.4}
            blending={isDark ? AdditiveBlending : NormalBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Content face */}
        <mesh>
          <planeGeometry args={[1.25, 0.78]} />
          <meshStandardMaterial
            map={tex}
            emissiveMap={tex}
            emissive={new Color('#ffffff')}
            emissiveIntensity={0.9}
            toneMapped={false}
            transparent
            opacity={0.95}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
        {/* Outer glow plane */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[1.8, 1.1]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={isDark ? 0.08 : 0.22}
            depthWrite={false}
            blending={isDark ? AdditiveBlending : NormalBlending}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* -------------------------------------------------------------------------- */
/*  Data streams — particles flowing upward from screen to holograms           */
/* -------------------------------------------------------------------------- */

const STREAM_COUNT = 36;
const STREAM_Y_MIN = 0.6;
const STREAM_Y_MAX = 3.3;

function DataStreams({
  reduced,
  active,
  isDark,
}: {
  reduced: boolean;
  active: { current: boolean };
  isDark: boolean;
}) {
  const pointsRef = useRef<Points>(null);

  const { positionAttr, speeds } = useMemo(() => {
    const arr = new Float32Array(STREAM_COUNT * 3);
    const speeds = new Float32Array(STREAM_COUNT);
    for (let i = 0; i < STREAM_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.8;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] =
        STREAM_Y_MIN + Math.random() * (STREAM_Y_MAX - STREAM_Y_MIN);
      arr[i * 3 + 2] = Math.sin(angle) * radius * 0.45;
      speeds[i] = 0.25 + Math.random() * 0.55;
    }
    return { positionAttr: new BufferAttribute(arr, 3), speeds };
  }, []);

  useFrame((_, dt) => {
    if (!active.current) return;
    const arr = positionAttr.array as Float32Array;
    const dy = dt * (reduced ? 0.3 : 1);
    for (let i = 0; i < STREAM_COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * dy;
      if (arr[i * 3 + 1] > STREAM_Y_MAX) {
        arr[i * 3 + 1] = STREAM_Y_MIN;
        // re-roll xz spread occasionally for variation
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.05 + Math.random() * 0.8;
        arr[i * 3] = Math.cos(angle) * radius;
        arr[i * 3 + 2] = Math.sin(angle) * radius * 0.45;
      }
    }
    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <primitive attach="attributes-position" object={positionAttr} />
      </bufferGeometry>
      <pointsMaterial
        color={isDark ? BRAND.cyan : '#0891b2'}
        size={isDark ? 0.07 : 0.06}
        transparent
        opacity={isDark ? 0.85 : 0.95}
        sizeAttenuation
        blending={isDark ? AdditiveBlending : NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subtle orbiting accent rings                                               */
/* -------------------------------------------------------------------------- */

function OrbitRing({
  radius,
  position,
  tilt,
  speed,
  color,
  active,
  isDark,
}: {
  radius: number;
  position: [number, number, number];
  tilt: [number, number, number];
  speed: number;
  color: string;
  active: { current: boolean };
  isDark: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!active.current || !ref.current) return;
    ref.current.rotation.z += dt * speed;
  });
  return (
    <group ref={ref} position={position} rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, isDark ? 0.008 : 0.012, 8, 120]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isDark ? 0.6 : 0.4}
          transparent
          opacity={isDark ? 0.55 : 0.95}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scene                                                                      */
/* -------------------------------------------------------------------------- */

function SceneContents({ reduced }: { reduced: boolean }) {
  const active = useActive();
  const isDark = useIsDark();
  return (
    <>
      <ambientLight intensity={isDark ? 0.7 : 1.05} />
      <directionalLight position={[5, 8, 5]} intensity={isDark ? 1.1 : 1.35} />
      <directionalLight
        position={[-4, 4, -5]}
        intensity={isDark ? 0.9 : 0.75}
        color="#ffffff"
      />
      <pointLight
        position={[0, 2, -3]}
        intensity={isDark ? 0.9 : 0.45}
        color="#e8eef5"
      />
      <pointLight
        position={[-4, 2, -3]}
        intensity={isDark ? 0.7 : 0.35}
        color={BRAND.blue}
      />
      <pointLight
        position={[4, 4, 2]}
        intensity={isDark ? 0.7 : 0.35}
        color={BRAND.violet}
      />
      <pointLight
        position={[0, 1.6, 0.5]}
        intensity={isDark ? 1.0 : 0.55}
        color={BRAND.cyan}
      />

      <AILaptop reduced={reduced} active={active} isDark={isDark} />

      <HoloLightCone isDark={isDark} />

      <NeuralCore
        position={[0, 2.5, 0]}
        reduced={reduced}
        active={active}
        isDark={isDark}
      />

      <HoloPanel
        position={[-1.85, 2.15, 0.2]}
        rotation={[0, 0.55, 0]}
        kind="code"
        accent={BRAND.cyan}
        reduced={reduced}
        active={active}
        isDark={isDark}
      />
      <HoloPanel
        position={[1.85, 2.15, 0.2]}
        rotation={[0, -0.55, 0]}
        kind="chart"
        accent={BRAND.violet}
        reduced={reduced}
        active={active}
        isDark={isDark}
      />

      <DataStreams reduced={reduced} active={active} isDark={isDark} />

      <OrbitRing
        radius={2.6}
        position={[0, 1.4, 0]}
        tilt={[1.1, 0.3, 0]}
        speed={0.18}
        color={BRAND.cyan}
        active={active}
        isDark={isDark}
      />
      <OrbitRing
        radius={3.1}
        position={[0, 1.4, 0]}
        tilt={[-0.7, 0.5, 0.2]}
        speed={-0.12}
        color={BRAND.violet}
        active={active}
        isDark={isDark}
      />

      <ViewportFrameloop />
    </>
  );
}

export function HeroScene() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const lowEnd = useMediaQuery('(max-width: 768px)');

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, lowEnd ? 1.25 : 1.5]}
        camera={{ position: [0.5, 1.4, 7], fov: 44 }}
        gl={{
          antialias: !lowEnd,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <SceneContents reduced={reduced} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={!reduced}
            autoRotateSpeed={0.35}
            rotateSpeed={0.7}
            minPolarAngle={Math.PI / 3.5}
            maxPolarAngle={Math.PI / 1.7}
            target={[0, 1.3, 0]}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
