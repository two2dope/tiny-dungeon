import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { DungeonCoord, ThemeId } from '../../engine/types';
import { getStandeeTexture } from './standeeTextures';

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
      pawnRef.current.position.y = 0.16 + Math.sin(t * 2.5) * 0.025;
    }
  });

  const partyStandeeTexture = useMemo(() => getStandeeTexture('party', theme), [theme]);

  const ringColor = theme === 'sengoku' ? '#f59e0b' : '#d4af37';

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

      <group ref={pawnRef} position={[0, 0.16, 0]}>
        {/* Low Champion Pedestal + Gold Rim (no colliding 3D crystal) */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.46, 0.1, 16]} />
          <meshStandardMaterial color="#1e1b18" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.32, 0.35, 0.06, 16]} />
          <meshStandardMaterial color={ringColor} metalness={0.75} roughness={0.22} />
        </mesh>

        {/* 2.5D Sashimono Party Banner Standee */}
        {partyStandeeTexture && (
          <Billboard position={[0, 0.64, 0]} follow={true}>
            <mesh>
              <planeGeometry args={[1.05, 1.32]} />
              <meshBasicMaterial
                map={partyStandeeTexture}
                transparent
                alphaTest={0.08}
                side={THREE.DoubleSide}
              />
            </mesh>
          </Billboard>
        )}
      </group>
    </group>
  );
};
