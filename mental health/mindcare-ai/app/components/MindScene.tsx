"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

// Shared scroll state
const scrollState = { velocity: 0, direction: 0 };

function RisingBubble({ startPosition, color, speed, size, distort }: {
  startPosition: [number, number, number];
  color: string;
  speed: number;
  size: number;
  distort: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = useRef(Math.random() * Math.PI * 2);
  const yPos = useRef(startPosition[1]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Move based on scroll direction + natural drift
    const scrollInfluence = scrollState.velocity * 0.4;
    yPos.current += (speed * 0.015) + scrollInfluence;

    // Wrap around
    if (yPos.current > 7) yPos.current = -7;
    if (yPos.current < -7) yPos.current = 7;

    // Gentle horizontal sway
    const x = startPosition[0] + Math.sin(t * 0.4 * speed + offset.current) * 0.6;
    const z = startPosition[2] + Math.cos(t * 0.25 * speed + offset.current) * 0.4;

    meshRef.current.position.set(x, yPos.current, z);
    meshRef.current.rotation.x = t * 0.1 * speed;
    meshRef.current.rotation.z = t * 0.15 * speed;
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
      pos[i * 3 + 1] = -7 + Math.random() * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, [count]);

  useFrame(() => {
    if (!points.current) return;

    const posArray = points.current.geometry.attributes.position.array as Float32Array;
    const scrollInfluence = scrollState.velocity * 0.3;

    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += 0.005 + scrollInfluence;
      if (posArray[i * 3 + 1] > 7) {
        posArray[i * 3 + 1] = -7;
        posArray[i * 3] = (Math.random() - 0.5) * 10;
      }
      if (posArray[i * 3 + 1] < -7) {
        posArray[i * 3 + 1] = 7;
        posArray[i * 3] = (Math.random() - 0.5) * 10;
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
  // Track scroll/wheel velocity
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // deltaY positive = scrolling down, negative = scrolling up
      scrollState.velocity = e.deltaY * 0.005;
      scrollState.direction = e.deltaY > 0 ? 1 : -1;
    };

    // Also listen for scroll as backup
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      if (Math.abs(delta) > 1) {
        scrollState.velocity = delta * 0.015;
        scrollState.direction = delta > 0 ? 1 : -1;
      }
      lastScrollY = currentY;
    };

    // Decay velocity over time
    const decay = setInterval(() => {
      scrollState.velocity *= 0.9;
    }, 30);

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      clearInterval(decay);
    };
  }, []);

  const bubbles = useMemo(() => {
    const colors = ["#074469", "#006a64", "#9ccbf7", "#9deee5", "#2a5c82", "#84d5cc"];
    const configs = [];
    for (let i = 0; i < 14; i++) {
      configs.push({
        startPosition: [
          (Math.random() - 0.5) * 8,
          -7 + Math.random() * 14,
          (Math.random() - 0.5) * 3 - 1,
        ] as [number, number, number],
        color: colors[i % colors.length],
        speed: 0.3 + Math.random() * 0.5,
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

        {bubbles.map((b, i) => (
          <RisingBubble key={i} {...b} />
        ))}

        <Particles count={80} />
      </Canvas>
    </div>
  );
}
