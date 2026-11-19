import React, { useMemo } from 'react';
import { DungeonCoord, EdgePortal, EdgeSide, ThemeId, Wall } from '../../engine/types';
import { getWallTexture } from './proceduralTextures';

interface Walls3DProps {
  walls: Wall[];
  portals?: EdgePortal[];
  canCrossBarriers?: boolean;
  cols?: number;
  rows?: number;
  theme?: ThemeId;
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
      return { pos: [cx - half, 0.36, cz], rotY: Math.PI / 2 };
    case 'east':
      return { pos: [cx + half, 0.36, cz], rotY: Math.PI / 2 };
    case 'north':
      return { pos: [cx, 0.36, cz - half], rotY: 0 };
    case 'south':
      return { pos: [cx, 0.36, cz + half], rotY: 0 };
  }
}

export const Walls3D: React.FC<Walls3DProps> = ({
  walls,
  portals = [],
  canCrossBarriers = false,
  cols = 4,
  rows = 4,
  theme = 'sengoku',
}) => {
  const tileSize = 2.6;
  const wallTexture = useMemo(() => getWallTexture(theme), [theme]);
  const centerX = ((cols - 1) / 2) * tileSize;
  const centerZ = ((rows - 1) / 2) * tileSize;
  const spanX = cols * tileSize + 0.4;
  const spanZ = rows * tileSize + 0.4;

  const perimeterWalls = [
    // Back walls (North & West) — full height framing
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
    // Front walls (South & East) — cutaway low parapet for clear isometric visibility
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

  const perimColor = theme === 'sengoku' ? '#5c4636' : '#334155';
  const trimColor = theme === 'sengoku' ? '#7a5a42' : '#64748b';
  const innerWallColor = theme === 'sengoku' ? '#73533d' : '#475569';
  const pillarColor = theme === 'sengoku' ? '#3a291e' : '#1e293b';

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
          const gateColor = canCrossBarriers ? '#10b981' : '#b91c1c';
          const barColor = canCrossBarriers ? '#6ee7b7' : '#fbbf24';
          return (
            <group
              key={`sealed-wall-${idx}`}
              position={[midX, 0.34, midZ]}
              rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}
            >
              {/* Sealed Gate Top Beam */}
              <mesh position={[0, 0.28, 0]} castShadow>
                <boxGeometry args={[tileSize * 0.94, 0.14, 0.24]} />
                <meshStandardMaterial
                  color={gateColor}
                  emissive={gateColor}
                  emissiveIntensity={canCrossBarriers ? 0.35 : 0.2}
                  roughness={0.45}
                  metalness={0.5}
                  transparent={canCrossBarriers}
                  opacity={canCrossBarriers ? 0.55 : 1}
                />
              </mesh>
              {/* Iron vertical bars */}
              {[-0.75, -0.35, 0, 0.35, 0.75].map((bx) => (
                <mesh key={bx} position={[bx, -0.02, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.52, 8]} />
                  <meshStandardMaterial
                    color={barColor}
                    metalness={0.75}
                    roughness={0.3}
                    transparent={canCrossBarriers}
                    opacity={canCrossBarriers ? 0.32 : 0.95}
                  />
                </mesh>
              ))}
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

      {/* Edge Portals (Side Exits linking opposite board edges) */}
      {portals.flatMap((portal) => [
        { key: `${portal.id}-a`, ...getPortalEdgeTransform(portal.a, portal.aSide, tileSize) },
        { key: `${portal.id}-b`, ...getPortalEdgeTransform(portal.b, portal.bSide, tileSize) },
      ]).map((marker) => (
        <group key={marker.key} position={marker.pos} rotation={[0, marker.rotY, 0]}>
          <mesh position={[-0.48, 0.12, 0]} castShadow>
            <boxGeometry args={[0.14, 0.72, 0.14]} />
            <meshStandardMaterial color="#0f766e" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0.48, 0.12, 0]} castShadow>
            <boxGeometry args={[0.14, 0.72, 0.14]} />
            <meshStandardMaterial color="#0f766e" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.18, 0.12, 0.16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.35}
              metalness={0.5}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <torusGeometry args={[0.32, 0.045, 10, 24]} />
            <meshBasicMaterial color="#2dd4bf" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
