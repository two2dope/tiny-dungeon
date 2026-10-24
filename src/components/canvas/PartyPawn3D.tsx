import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DungeonCoord } from '../../engine/types';

interface PartyPawn3DProps {
  coord: DungeonCoord;
}

export const PartyPawn3D: React.FC<PartyPawn3DProps> = ({ coord }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const pawnRef = useRef<THREE.Group>(null);

  // Map 2D grid (x, y) to 3D world (x * 2.5, 0, y * 2.5)
  const targetX = coord.x * 2.6;
  const targetZ = coord.y * 2.6;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
    }
    if (pawnRef.current) {
      // Subtle hovering bob
      pawnRef.current.position.y = 0.5 + Math.sin(t * 3) * 0.05;
    }
  });

  return (
    <group position={[targetX, 0, targetZ]}>
      {/* Illuminated coordinate rune ring on floor */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.7, 32]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.8} />
      </mesh>

      {/* Hero party avatar pawn */}
      <group ref={pawnRef} position={[0, 0.5, 0]}>
        {/* Core crystal / obelisk body */}
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color="#c87d55"
            metalness={0.7}
            roughness={0.2}
            emissive="#ff6b35"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Golden crown / pinnacle */}
        <mesh position={[0, 0.35, 0]}>
          <coneGeometry args={[0.15, 0.25, 4]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
};
