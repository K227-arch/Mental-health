"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus } from "@react-three/drei";
import * as THREE from "three";

function FloatingOrb({ position, color, speed = 1, distort = 0.4, size = 1 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
  distort?: number;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[size, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort}
          speed={2}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </Sphere>
    </Float>
  );
}

function NeuralRing({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Torus ref={meshRef} args={[1.2, 0.05, 16, 100]} position={position}>
        <meshStandardMaterial color={color} transparent opacity={0.6} metalness={0.8} roughness={0.2} />
      </Torus>
    </Float>
  );
}

function Particles({ count = 80 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.05;
      points.current.rotation.x = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#9ccbf7" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export default function MindScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, -3, 2]} intensity={0.5} color="#9deee5" />
        <pointLight position={[3, 2, -2]} intensity={0.4} color="#cde5ff" />

        {/* Main brain-like orb */}
        <FloatingOrb position={[0, 0, 0]} color="#074469" size={1.3} distort={0.5} speed={0.8} />

        {/* Smaller orbiting spheres representing wellness */}
        <FloatingOrb position={[2.2, 1, -1]} color="#006a64" size={0.4} distort={0.3} speed={1.2} />
        <FloatingOrb position={[-2, -0.8, -0.5]} color="#9ccbf7" size={0.35} distort={0.25} speed={1.5} />
        <FloatingOrb position={[1.5, -1.5, 0.5]} color="#9deee5" size={0.3} distort={0.2} speed={1.8} />

        {/* Neural connection rings */}
        <NeuralRing position={[0, 0, 0]} color="#9ccbf7" />

        {/* Ambient particles */}
        <Particles count={100} />
      </Canvas>
    </div>
  );
}
