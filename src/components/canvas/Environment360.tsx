import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ThemeId } from '../../engine/types';
import { getPanoramaTexture, getTabletopMatTexture } from './proceduralTextures';
import { useGlbGeometry } from './glbRegistry';

interface Environment360Props {
  theme: ThemeId;
  tileSize: number;
  cols?: number;
  rows?: number;
  isPaused?: boolean;
}

const CARDINAL_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2] as const;
const LANTERN_ANGLES = Array.from({ length: 8 }).map(
  (_, i) => (i * Math.PI) / 4 + Math.PI / 8
);

export const Environment360: React.FC<Environment360Props> = ({
  theme,
  tileSize,
  cols = 4,
  rows = 4,
  isPaused = false,
}) => {
  const ruinsGroupRef = useRef<THREE.Group>(null);
  const panoramaTexture = useMemo(() => getPanoramaTexture(theme), [theme]);
  const tabletopTexture = useMemo(() => getTabletopMatTexture(theme), [theme]);
  const toriiGeom = useGlbGeometry('torii-gate');
  const lanternGeom = useGlbGeometry('lantern-pedestal');

  const isSengoku = theme === 'sengoku';
  const centerX = ((cols - 1) / 2) * tileSize;
  const centerZ = ((rows - 1) / 2) * tileSize;
  const boardRadius = (Math.max(cols, rows) * tileSize) / 2;
  const lanternRadius = boardRadius + 2.25;
  const gateDist = boardRadius + 3.2;
  const platformRadius = boardRadius + 4.2;
  const ruinsBaseRadius = boardRadius + 6.2;

  const ruinConfigs = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => {
        const angle = (idx / 12) * Math.PI * 2 + 0.18;
        const radius = ruinsBaseRadius + (idx % 3) * 2.1;
        const baseY = -1.25 + (idx % 4) * 0.72;
        const scale = 0.72 + (idx % 3) * 0.34;
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          baseY,
          scale,
          rotY: angle * 1.4,
          phase: idx * 0.85,
        };
      }),
    [ruinsBaseRadius]
  );

  useFrame(({ clock }) => {
    if (isPaused || !ruinsGroupRef.current) return;
    const t = clock.getElapsedTime();
    ruinsGroupRef.current.children.forEach((child, idx) => {
      const cfg = ruinConfigs[idx];
      if (!cfg) return;
      child.position.y = cfg.baseY + Math.sin(t * 0.7 + cfg.phase) * 0.22;
    });
  });

  const gateColor = isSengoku ? '#7f1d1d' : '#312e81';
  const gateEmissive = isSengoku ? '#450a0a' : '#1e1b4b';
  const stoneColor = isSengoku ? '#3d2e24' : '#1e293b';
  const trimRingColor = isSengoku ? '#d97706' : '#38bdf8';
  const orbColor = isSengoku ? '#ffb454' : '#7dd3fc';

  return (
    <group position={[centerX, 0, centerZ]}>
      {/* 360 Panoramic Horizon Sky Dome */}
      <mesh renderOrder={-10}>
        <sphereGeometry args={[44, 48, 32]} />
        <meshBasicMaterial
          map={panoramaTexture ?? undefined}
          color={panoramaTexture ? '#ffffff' : isSengoku ? '#1c1410' : '#0f172a'}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Carved Ritual Compass Platform under Tactical Board */}
      <group position={[0, -0.24, 0]}>
        <mesh rotation={[0, Math.PI / 8, 0]} receiveShadow>
          <cylinderGeometry args={[platformRadius, platformRadius + 0.8, 0.16, 8]} />
          <meshStandardMaterial
            color={isSengoku ? '#d6c3a5' : '#cbd5e1'}
            map={tabletopTexture ?? undefined}
            roughness={0.78}
            metalness={0.18}
          />
        </mesh>
        <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[platformRadius - 1.3, platformRadius - 1.05, 48]} />
          <meshBasicMaterial color={trimRingColor} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* 4 Outer Guardian Gateways (Cardinal Parallax Landmarks) */}
      {CARDINAL_ANGLES.map((angle, idx) => {
        const gx = Math.cos(angle) * gateDist;
        const gz = Math.sin(angle) * gateDist;
        const rotY = Math.atan2(-gx, -gz);
        return (
          <group key={`outer-gate-${idx}`} position={[gx, 0, gz]} rotation={[0, rotY, 0]}>
            <mesh position={[0, -0.04, 0]} receiveShadow>
              <boxGeometry args={[2.1, 0.28, 0.9]} />
              <meshStandardMaterial color={stoneColor} roughness={0.75} />
            </mesh>
            <group position={[0, 0.72, 0]} scale={1.35}>
              {toriiGeom ? (
                <mesh geometry={toriiGeom} castShadow>
                  <meshStandardMaterial
                    color={gateColor}
                    emissive={gateEmissive}
                    emissiveIntensity={0.28}
                    metalness={0.35}
                    roughness={0.45}
                  />
                </mesh>
              ) : (
                <>
                  <mesh position={[-0.48, 0, 0]}>
                    <boxGeometry args={[0.16, 1.0, 0.16]} />
                    <meshStandardMaterial color={gateColor} roughness={0.5} />
                  </mesh>
                  <mesh position={[0.48, 0, 0]}>
                    <boxGeometry args={[0.16, 1.0, 0.16]} />
                    <meshStandardMaterial color={gateColor} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[1.3, 0.15, 0.24]} />
                    <meshStandardMaterial color={gateColor} roughness={0.5} />
                  </mesh>
                </>
              )}
            </group>
          </group>
        );
      })}

      {/* 8 Perimeter Stone Lantern Pillars */}
      {LANTERN_ANGLES.map((angle, idx) => {
        const lx = Math.cos(angle) * lanternRadius;
        const lz = Math.sin(angle) * lanternRadius;
        return (
          <group key={`outer-lantern-${idx}`} position={[lx, 0, lz]}>
            <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.26, 0.34, 0.56, 8]} />
              <meshStandardMaterial color={stoneColor} roughness={0.72} />
            </mesh>
            <group position={[0, 0.68, 0]} scale={1.25}>
              {lanternGeom ? (
                <mesh geometry={lanternGeom}>
                  <meshStandardMaterial color={stoneColor} roughness={0.6} metalness={0.3} />
                </mesh>
              ) : (
                <mesh>
                  <boxGeometry args={[0.2, 0.36, 0.2]} />
                  <meshStandardMaterial color={stoneColor} roughness={0.6} />
                </mesh>
              )}
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color={orbColor} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* 12 Drifting Monolith Ruins in Outer Abyss (360 Parallax Depth) */}
      <group ref={ruinsGroupRef}>
        {ruinConfigs.map((cfg, idx) => (
          <group
            key={`ruin-${idx}`}
            position={[cfg.x, cfg.baseY, cfg.z]}
            rotation={[0, cfg.rotY, 0]}
            scale={cfg.scale}
          >
            <mesh castShadow>
              <dodecahedronGeometry args={[0.72, 0]} />
              <meshStandardMaterial color={stoneColor} roughness={0.82} metalness={0.18} />
            </mesh>
            <mesh position={[0, 0.72, 0]}>
              <boxGeometry args={[0.38, 0.95, 0.38]} />
              <meshStandardMaterial
                color={gateColor}
                emissive={gateEmissive}
                emissiveIntensity={0.22}
                roughness={0.65}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
