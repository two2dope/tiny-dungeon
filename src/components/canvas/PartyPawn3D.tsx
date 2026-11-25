import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { DungeonCoord, ThemeId } from '../../engine/types';
import { getStandeeTexture } from './standeeTextures';
import { getStandeeHaloTexture } from './proceduralTextures';
import { getMapBiome } from './mapBiomes';

interface PartyPawn3DProps {
  coord: DungeonCoord;
  theme?: ThemeId;
  mapId?: number;
  isPaused?: boolean;
}

export const PartyPawn3D: React.FC<PartyPawn3DProps> = ({
  coord,
  theme = 'sengoku',
  mapId = 1,
  isPaused = false,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const landingRingRef = useRef<THREE.Mesh>(null);
  const pawnRef = useRef<THREE.Group>(null);

  const targetX = coord.x * 2.6;
  const targetZ = coord.y * 2.6;

  const startPosRef = useRef<{ x: number; z: number }>({ x: targetX, z: targetZ });
  const targetPosRef = useRef<{ x: number; z: number }>({ x: targetX, z: targetZ });
  const moveProgressRef = useRef<number>(1);
  const moveDurationRef = useRef<number>(0.26);
  const hopHeightRef = useRef<number>(0.42);
  const squashRef = useRef<number>(0);

  useEffect(() => {
    const prevTarget = targetPosRef.current;
    if (prevTarget.x === targetX && prevTarget.z === targetZ) return;
    const currentX = rootRef.current ? rootRef.current.position.x : prevTarget.x;
    const currentZ = rootRef.current ? rootRef.current.position.z : prevTarget.z;
    startPosRef.current = { x: currentX, z: currentZ };
    targetPosRef.current = { x: targetX, z: targetZ };
    const dist = Math.hypot(targetX - currentX, targetZ - currentZ);
    hopHeightRef.current = dist > 3.2 ? 0.72 : 0.42;
    moveDurationRef.current = dist > 3.2 ? 0.36 : 0.25;
    moveProgressRef.current = 0;
  }, [targetX, targetZ]);

  useFrame(({ clock }, delta) => {
    if (isPaused) return;
    const t = clock.getElapsedTime();
    let arcY = 0;
    let tiltX = 0;
    let tiltZ = 0;

    if (rootRef.current) {
      if (moveProgressRef.current < 1) {
        const nextP = Math.min(1, moveProgressRef.current + delta / moveDurationRef.current);
        moveProgressRef.current = nextP;
        const ease = 1 - Math.pow(1 - nextP, 3);
        rootRef.current.position.x = THREE.MathUtils.lerp(
          startPosRef.current.x,
          targetPosRef.current.x,
          ease
        );
        rootRef.current.position.z = THREE.MathUtils.lerp(
          startPosRef.current.z,
          targetPosRef.current.z,
          ease
        );
        arcY = Math.sin(nextP * Math.PI) * hopHeightRef.current;
        const dx = targetPosRef.current.x - startPosRef.current.x;
        const dz = targetPosRef.current.z - startPosRef.current.z;
        const norm = Math.max(0.001, Math.hypot(dx, dz));
        const tiltAmt = Math.sin(nextP * Math.PI) * 0.14;
        tiltZ = -(dx / norm) * tiltAmt;
        tiltX = (dz / norm) * tiltAmt;

        if (nextP >= 1) {
          squashRef.current = 1;
        }
      } else {
        rootRef.current.position.x = targetPosRef.current.x;
        rootRef.current.position.z = targetPosRef.current.z;
      }
    }

    if (squashRef.current > 0) {
      squashRef.current = Math.max(0, squashRef.current - delta * 4.5);
    }

    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.45;
    }

    if (shadowRef.current) {
      const s = Math.max(0.55, 1 - arcY * 0.32);
      shadowRef.current.scale.set(s, s, 1);
      (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0.18,
        0.46 - arcY * 0.18
      );
    }

    if (landingRingRef.current) {
      const sq = squashRef.current;
      if (sq > 0.01) {
        landingRingRef.current.visible = true;
        const progress = 1 - sq;
        const s = 0.72 + progress * 0.95;
        landingRingRef.current.scale.set(s, s, 1);
        (landingRingRef.current.material as THREE.MeshBasicMaterial).opacity = sq * 0.78;
      } else {
        landingRingRef.current.visible = false;
      }
    }

    if (pawnRef.current) {
      const idleBreath = moveProgressRef.current >= 1 ? Math.sin(t * 2.4) * 0.006 : 0;
      pawnRef.current.position.y = 0.11 + arcY + idleBreath;
      const sq = squashRef.current;
      const scaleY = 1 - sq * 0.14;
      const scaleXZ = 1 + sq * 0.09;
      pawnRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
      pawnRef.current.rotation.set(tiltX, 0, tiltZ);
    }
  });

  const biome = getMapBiome(theme, mapId);
  const ringColor = theme === 'sengoku' ? biome.highlightColor : '#38bdf8';
  const partyStandeeTexture = useMemo(() => getStandeeTexture('party', theme), [theme]);
  const haloTexture = useMemo(
    () => getStandeeHaloTexture(ringColor, 'party', theme),
    [ringColor, theme]
  );

  return (
    <group ref={rootRef} position={[targetX, 0, targetZ]}>
      {/* Textured Runic Sumi-e Compass Halo + Ground AO */}
      <mesh
        ref={haloRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.088, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[1.76, 1.76]} />
        {haloTexture ? (
          <meshBasicMaterial
            map={haloTexture}
            transparent
            opacity={0.94}
            depthWrite={false}
          />
        ) : (
          <meshBasicMaterial color={ringColor} transparent opacity={0.45} depthWrite={false} />
        )}
      </mesh>

      {/* Dynamic Soft Contact Shadow */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.09, 0]}
        renderOrder={2}
      >
        <circleGeometry args={[0.48, 24]} />
        <meshBasicMaterial color="#090706" transparent opacity={0.46} depthWrite={false} />
      </mesh>

      {/* Landing Impact Ripple Ring */}
      <mesh
        ref={landingRingRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.093, 0]}
        renderOrder={3}
      >
        <ringGeometry args={[0.46, 0.58, 24]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={pawnRef} position={[0, 0.11, 0]}>
        {/* Grounded Champion Plinth + Gold Socket Rim */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.46, 0.08, 16]} />
          <meshStandardMaterial color="#1e1b18" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.032, 0]}>
          <cylinderGeometry args={[0.31, 0.34, 0.05, 16]} />
          <meshStandardMaterial color={ringColor} metalness={0.72} roughness={0.25} />
        </mesh>

        {/* 2.5D Sashimono Party Banner Standee Seated Firmly in Socket */}
        {partyStandeeTexture && (
          <Billboard position={[0, 0.69, 0]} follow={true}>
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
