"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

function RisingBubble({ startPosition, color, speed, size, distort }: {
  startPosition: [number, number, number];
  color: string;
  speed: number;
  size: number;
  distort: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = useRef(Math.random() * Math.PI * 2);
  const startOffset = useRef(Math.random() * 14); // stagger start times

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed + startOffset.current;

    // Start from bottom (-7) and rise to top (7), then loop back to bottom
    const range = 14; // total vertical travel distance
    let y = -7 + (t % range);

    // Gentle horizontal sway
    const x = startPosition[0] + Math.sin(t * 0.4 + offset.current) * 0.6;
    const z = startPosition[2] + Math.cos(t * 0.25 + offset.current) * 0.4;

    meshRef.current.position.set(x, y, z);
    meshRef.current.rotation.x = t * 0.1;
    meshRef.current.rotation.z = t * 0.15;
  });

  return (
    <Sphere ref={meshRef} args={[size, 32, 32]} position={startPosition}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={distort}
        speed={1.5}
        roughness={0.15}
        metalness={0.1}
        transparent
        opacity={0.7}
      />
    </Sphere>
  );
}

function Particles({ count = 60 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = -7 + Math.random() * 14; // spread vertically from bottom to top
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, [count]);

  useFrame(() => {
    if (!points.current) return;

    // Move particles upward from bottom to top
    const posArray = points.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += 0.008; // rise speed
      if (posArray[i * 3 + 1] > 7) {
        posArray[i * 3 + 1] = -7; // reset to bottom
        posArray[i * 3] = (Math.random() - 0.5) * 10; // randomize X on reset
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#074469" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

export default function MindScene() {
  // Generate bubble configs
  const bubbles = useMemo(() => {
    const colors = ["#074469", "#006a64", "#9ccbf7", "#9deee5", "#2a5c82", "#84d5cc"];
    const configs = [];
    for (let i = 0; i < 14; i++) {
      configs.push({
        startPosition: [
          (Math.random() - 0.5) * 8,  // spread across width
          -7,                           // all start at bottom
          (Math.random() - 0.5) * 3 - 1,
        ] as [number, number, number],
        color: colors[i % colors.length],
        speed: 0.15 + Math.random() * 0.35,
        size: 0.2 + Math.random() * 0.55,
        distort: 0.2 + Math.random() * 0.3,
      });
    }
    return configs;
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} color="#ffffff" />
        <pointLight position={[-3, -3, 2]} intensity={0.4} color="#9deee5" />
        <pointLight position={[3, 2, -2]} intensity={0.3} color="#cde5ff" />

        {/* Rising bubbles */}
        {bubbles.map((b, i) => (
          <RisingBubble key={i} {...b} />
        ))}

        {/* Floating particles also rising */}
        <Particles count={80} />
      </Canvas>
    </div>
  );
}
