import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DungeonCoord, ThemeId } from '../../engine/types';

interface PartyPawn3DProps {
  coord: DungeonCoord;
  theme?: ThemeId;
  isPaused?: boolean;
}

export const PartyPawn3D: React.FC<PartyPawn3DProps> = ({
  coord,
  theme = 'sengoku',
  isPaused = false,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pawnRef = useRef<THREE.Group>(null);

  const targetX = coord.x * 2.6;
  const targetZ = coord.y * 2.6;

  useFrame(({ clock }, delta) => {
    if (isPaused) return;
    const t = clock.getElapsedTime();

    if (rootRef.current) {
      const alpha = Math.min(1, delta * 10);
      rootRef.current.position.x = THREE.MathUtils.lerp(
        rootRef.current.position.x,
        targetX,
        alpha
      );
      rootRef.current.position.z = THREE.MathUtils.lerp(
        rootRef.current.position.z,
        targetZ,
        alpha
      );
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.85;
    }
    if (pawnRef.current) {
      pawnRef.current.position.y = 0.52 + Math.sin(t * 3) * 0.05;
    }
  });

  const ringColor = theme === 'sengoku' ? '#f59e0b' : '#d4af37';
  const bodyColor = theme === 'sengoku' ? '#b45309' : '#c87d55';
  const emissiveColor = theme === 'sengoku' ? '#d97706' : '#ff6b35';

  return (
    <group ref={rootRef} position={[targetX, 0, targetZ]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <ringGeometry args={[0.56, 0.72, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.85} />
      </mesh>

      {/* 4 cardinal tactical compass arrows on floor */}
      {[
        { pos: [0, 0.095, -0.88] as [number, number, number], rot: [-Math.PI / 2, 0, 0] as [number, number, number] },
        { pos: [0, 0.095, 0.88] as [number, number, number], rot: [Math.PI / 2, 0, 0] as [number, number, number] },
        { pos: [0.88, 0.095, 0] as [number, number, number], rot: [0, 0, -Math.PI / 2] as [number, number, number] },
        { pos: [-0.88, 0.095, 0] as [number, number, number], rot: [0, 0, Math.PI / 2] as [number, number, number] },
      ].map((arrow, idx) => (
        <mesh key={`arrow-${idx}`} position={arrow.pos} rotation={arrow.rot}>
          <coneGeometry args={[0.14, 0.28, 3]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.85} />
        </mesh>
      ))}

      <group ref={pawnRef} position={[0, 0.52, 0]}>
        {/* Pedestal */}
        <mesh position={[0, -0.28, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.34, 0.14, 12]} />
          <meshStandardMaterial color="#1e1b18" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Core miniature body */}
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.65}
            roughness={0.25}
            emissive={emissiveColor}
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Banner/Crown pinnacle */}
        <mesh position={[0, 0.38, 0]}>
          <coneGeometry args={[0.14, 0.28, 4]} />
          <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
};
