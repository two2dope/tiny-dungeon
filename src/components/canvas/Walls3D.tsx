import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DungeonCoord, EdgePortal, EdgeSide, ThemeId, Wall } from '../../engine/types';
import {
  getLacquerWoodTexture,
  getOfudaStripTexture,
  getUiTokenTexture,
  getWallTexture,
} from './proceduralTextures';
import { getMapBiome } from './mapBiomes';

interface Walls3DProps {
  walls: Wall[];
  portals?: EdgePortal[];
  canCrossBarriers?: boolean;
  cols?: number;
  rows?: number;
  theme?: ThemeId;
  mapId?: number;
  isPaused?: boolean;
}

function getPortalEdgeTransform(
  coord: DungeonCoord,
  side: EdgeSide,
  tileSize: number
): { pos: [number, number, number]; rotY: number } {
  const cx = coord.x * tileSize;
  const cz = coord.y * tileSize;
  const half = tileSize * 0.49;

  switch (side) {
    case 'west':
      return { pos: [cx - half, 0, cz], rotY: Math.PI / 2 };
    case 'east':
      return { pos: [cx + half, 0, cz], rotY: Math.PI / 2 };
    case 'north':
      return { pos: [cx, 0, cz - half], rotY: 0 };
    case 'south':
      return { pos: [cx, 0, cz + half], rotY: 0 };
  }
}

export const Walls3D: React.FC<Walls3DProps> = ({
  walls,
  portals = [],
  canCrossBarriers = false,
  cols = 4,
  rows = 4,
  theme = 'sengoku',
  mapId = 1,
  isPaused = false,
}) => {
  const tileSize = 2.6;
  const portalSpinRef = useRef<THREE.Group>(null);
  const biome = getMapBiome(theme, mapId);
  const wallTexture = useMemo(() => getWallTexture(theme, mapId), [theme, mapId]);
  const lacquerTexture = useMemo(() => getLacquerWoodTexture(theme, mapId), [theme, mapId]);
  const lockTexture = useMemo(
    () => getUiTokenTexture('/assets/ui/token-sealed-lock.webp', 'lock'),
    []
  );
  const portalTexture = useMemo(
    () => getUiTokenTexture('/assets/ui/token-edge-portal.webp', 'portal'),
    []
  );
  const ofudaTexture = useMemo(() => getOfudaStripTexture(), []);

  useFrame(({ clock }) => {
    if (isPaused || !portalSpinRef.current) return;
    const t = clock.getElapsedTime();
    portalSpinRef.current.children.forEach((child, idx) => {
      const sign = idx % 2 === 0 ? 1 : -1;
      const spinner = child.children[0];
      if (spinner) {
        spinner.rotation.z = sign * t * 0.9;
        const pulse = 1 + Math.sin(t * 2.8 + idx) * 0.04;
        spinner.scale.set(pulse, pulse, 1);
      }
    });
  });

  const centerX = ((cols - 1) / 2) * tileSize;
  const centerZ = ((rows - 1) / 2) * tileSize;
  const spanX = cols * tileSize + 0.4;
  const spanZ = rows * tileSize + 0.4;

  const perimeterWalls = [
    {
      pos: [centerX, 0.38, -0.5 * tileSize] as [number, number, number],
      size: [spanX, 0.76, 0.32] as [number, number, number],
      trimY: 0.4,
    },
    {
      pos: [-0.5 * tileSize, 0.38, centerZ] as [number, number, number],
      size: [0.32, 0.76, spanZ] as [number, number, number],
      trimY: 0.4,
    },
    {
      pos: [centerX, 0.12, (rows - 0.5) * tileSize] as [number, number, number],
      size: [spanX, 0.24, 0.32] as [number, number, number],
      trimY: 0.14,
    },
    {
      pos: [(cols - 0.5) * tileSize, 0.12, centerZ] as [number, number, number],
      size: [0.32, 0.24, spanZ] as [number, number, number],
      trimY: 0.14,
    },
  ];

  const perimColor = biome.perimWall;
  const trimColor = biome.wallTrim;
  const innerWallColor = biome.innerWall;
  const pillarColor = biome.pillarWall;

  const portalMarkers = portals.flatMap((portal) => [
    { key: `${portal.id}-a`, ...getPortalEdgeTransform(portal.a, portal.aSide, tileSize) },
    { key: `${portal.id}-b`, ...getPortalEdgeTransform(portal.b, portal.bSide, tileSize) },
  ]);

  return (
    <group>
      {perimeterWalls.map((pw, idx) => (
        <group key={`perim-${idx}`} position={pw.pos}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={pw.size} />
            <meshStandardMaterial
              color={perimColor}
              map={wallTexture ?? undefined}
              bumpMap={wallTexture ?? undefined}
              bumpScale={0.065}
              roughness={0.65}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[0, pw.trimY, 0]} castShadow receiveShadow>
            <boxGeometry args={[pw.size[0] + 0.08, 0.08, pw.size[2] + 0.08]} />
            <meshStandardMaterial
              color={trimColor}
              map={wallTexture ?? undefined}
              bumpMap={wallTexture ?? undefined}
              bumpScale={0.05}
              roughness={0.65}
              metalness={0.2}
            />
          </mesh>
        </group>
      ))}

      {walls.map((wall, idx) => {
        const midX = ((wall.from.x + wall.to.x) / 2) * tileSize;
        const midZ = ((wall.from.y + wall.to.y) / 2) * tileSize;
        const isHorizontal = wall.from.y !== wall.to.y;

        if (wall.sealed) {
          const ironColor = canCrossBarriers ? '#10b981' : '#312e2b';
          const trimTint = canCrossBarriers ? '#059669' : '#7c2d12';
          const barOffsetY = canCrossBarriers ? -0.18 : 0.04;
          const barHeight = canCrossBarriers ? 0.28 : 0.48;

          return (
            <group
              key={`sealed-wall-${idx}`}
              position={[midX, 0.06, midZ]}
              rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}
            >
              {/* Grounded forged-iron floor sill */}
              <mesh position={[0, 0.03, 0]} receiveShadow>
                <boxGeometry args={[tileSize * 0.9, 0.06, 0.24]} />
                <meshStandardMaterial color="#18181b" metalness={0.65} roughness={0.45} />
              </mesh>

              {/* Flanking carved gatepost pillars */}
              {[-tileSize * 0.41, tileSize * 0.41].map((px, pIdx) => (
                <group key={`sealed-post-${pIdx}`} position={[px, 0.3, 0]}>
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.26, 0.6, 0.28]} />
                    <meshStandardMaterial
                      color={pillarColor}
                      map={wallTexture ?? undefined}
                      bumpMap={wallTexture ?? undefined}
                      bumpScale={0.05}
                      roughness={0.68}
                    />
                  </mesh>
                  <mesh position={[0, 0.33, 0]}>
                    <boxGeometry args={[0.3, 0.08, 0.32]} />
                    <meshStandardMaterial color="#92400e" metalness={0.55} roughness={0.35} />
                  </mesh>
                </group>
              ))}

              {/* Sculpted Lacquered Gate Header Beam */}
              <mesh position={[0, 0.56, 0]} castShadow>
                <boxGeometry args={[tileSize * 0.92, 0.11, 0.24]} />
                <meshStandardMaterial
                  color={trimTint}
                  map={lacquerTexture ?? undefined}
                  emissive={canCrossBarriers ? '#065f46' : '#450a0a'}
                  emissiveIntensity={canCrossBarriers ? 0.4 : 0.25}
                  roughness={0.45}
                  metalness={0.35}
                />
              </mesh>

              {/* Forged Gunmetal Vertical Grille Bars (lowered smoothly when unlocked by Kaginawa) */}
              <group position={[0, 0.26 + barOffsetY, 0]}>
                {[-0.7, -0.35, 0, 0.35, 0.7].map((bx) => (
                  <mesh key={bx} castShadow>
                    <cylinderGeometry args={[0.032, 0.036, barHeight, 8]} />
                    <meshStandardMaterial
                      color={ironColor}
                      metalness={0.78}
                      roughness={0.32}
                      transparent={canCrossBarriers}
                      opacity={canCrossBarriers ? 0.42 : 0.96}
                    />
                  </mesh>
                ))}
                {/* Mid locking iron cross-rail */}
                <mesh>
                  <boxGeometry args={[1.66, 0.055, 0.09]} />
                  <meshStandardMaterial
                    color={ironColor}
                    metalness={0.75}
                    roughness={0.36}
                    transparent={canCrossBarriers}
                    opacity={canCrossBarriers ? 0.4 : 0.95}
                  />
                </mesh>
              </group>

              {/* Hanging Ofuda Paper Seals & Centered Lock Medallion (when locked) */}
              {!canCrossBarriers && (
                <>
                  {[-0.5, 0.5].map((ox, oIdx) => (
                    <mesh
                      key={`ofuda-${oIdx}`}
                      position={[ox, 0.37, 0.1]}
                      rotation={[0, 0, oIdx === 0 ? 0.06 : -0.07]}
                    >
                      <planeGeometry args={[0.14, 0.32]} />
                      <meshBasicMaterial
                        map={ofudaTexture ?? undefined}
                        color={ofudaTexture ? '#ffffff' : '#e7d7b8'}
                        transparent
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  ))}

                  {/* Two-sided central iron & seal medallion */}
                  <group position={[0, 0.32, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.21, 0.21, 0.12, 8]} />
                      <meshStandardMaterial color="#27272a" metalness={0.68} roughness={0.35} />
                    </mesh>
                    {lockTexture && (
                      <>
                        <mesh position={[0, 0, 0.065]}>
                          <planeGeometry args={[0.34, 0.34]} />
                          <meshBasicMaterial map={lockTexture} transparent alphaTest={0.08} />
                        </mesh>
                        <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]}>
                          <planeGeometry args={[0.34, 0.34]} />
                          <meshBasicMaterial map={lockTexture} transparent alphaTest={0.08} />
                        </mesh>
                      </>
                    )}
                  </group>
                </>
              )}
            </group>
          );
        }

        const wallSize: [number, number, number] = isHorizontal
          ? [tileSize * 0.92, 0.52, 0.26]
          : [0.26, 0.52, tileSize * 0.92];

        return (
          <group key={`wall-${idx}`} position={[midX, 0.26, midZ]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={wallSize} />
              <meshStandardMaterial
                color={innerWallColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.065}
                roughness={0.65}
                metalness={0.15}
              />
            </mesh>
            <mesh
              position={isHorizontal ? [tileSize * 0.42, 0.04, 0] : [0, 0.04, tileSize * 0.42]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.3, 0.6, 0.3]} />
              <meshStandardMaterial
                color={pillarColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.68}
              />
            </mesh>
            <mesh
              position={isHorizontal ? [-tileSize * 0.42, 0.04, 0] : [0, 0.04, -tileSize * 0.42]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.3, 0.6, 0.3]} />
              <meshStandardMaterial
                color={pillarColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.68}
              />
            </mesh>
          </group>
        );
      })}

      {/* Sculpted Spirit Torii Portals linking opposite board edges */}
      {portalMarkers.map((marker) => (
        <group key={marker.key} position={marker.pos} rotation={[0, marker.rotY, 0]}>
          {/* Grounded carved stone threshold step */}
          <mesh position={[0, 0.06, 0]} receiveShadow>
            <boxGeometry args={[1.26, 0.1, 0.34]} />
            <meshStandardMaterial
              color={perimColor}
              map={wallTexture ?? undefined}
              roughness={0.78}
            />
          </mesh>

          {/* Left & Right stone pillar plinths + lacquered Torii columns */}
          {[-0.45, 0.45].map((px, pIdx) => (
            <group key={`portal-col-${pIdx}`} position={[px, 0, 0]}>
              <mesh position={[0, 0.13, 0]} castShadow>
                <boxGeometry args={[0.2, 0.12, 0.22]} />
                <meshStandardMaterial color="#18181b" roughness={0.6} metalness={0.35} />
              </mesh>
              <mesh position={[0, 0.48, 0]} castShadow>
                <cylinderGeometry args={[0.065, 0.08, 0.66, 10]} />
                <meshStandardMaterial
                  color="#0f766e"
                  map={lacquerTexture ?? undefined}
                  emissive="#115e59"
                  emissiveIntensity={0.25}
                  roughness={0.45}
                  metalness={0.25}
                />
              </mesh>
            </group>
          ))}

          {/* Lower tie beam (Nuki) */}
          <mesh position={[0, 0.66, 0]} castShadow>
            <boxGeometry args={[1.18, 0.075, 0.12]} />
            <meshStandardMaterial
              color="#115e59"
              map={lacquerTexture ?? undefined}
              roughness={0.5}
            />
          </mesh>

          {/* Flared upper Torii lintel (Kasagi) + cap + bronze tablet */}
          <mesh position={[0, 0.81, 0]} castShadow>
            <boxGeometry args={[1.38, 0.095, 0.2]} />
            <meshStandardMaterial
              color="#b45309"
              emissive="#92400e"
              emissiveIntensity={0.24}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.87, 0]}>
            <boxGeometry args={[1.48, 0.045, 0.24]} />
            <meshStandardMaterial color="#1c1917" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.74, 0]}>
            <boxGeometry args={[0.14, 0.14, 0.14]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.72} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Animated Spinning Spirit Portal Vortices */}
      <group ref={portalSpinRef}>
        {portalMarkers.map((marker) => (
          <group
            key={`vortex-${marker.key}`}
            position={[marker.pos[0], 0.4, marker.pos[2]]}
            rotation={[0, marker.rotY, 0]}
          >
            <group>
              <mesh>
                <planeGeometry args={[0.68, 0.68]} />
                {portalTexture ? (
                  <meshBasicMaterial
                    map={portalTexture}
                    transparent
                    alphaTest={0.05}
                    side={THREE.DoubleSide}
                  />
                ) : (
                  <meshBasicMaterial color="#2dd4bf" transparent opacity={0.85} side={THREE.DoubleSide} />
                )}
              </mesh>
              <mesh>
                <circleGeometry args={[0.38, 20]} />
                <meshBasicMaterial
                  color="#2dd4bf"
                  transparent
                  opacity={0.22}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};
