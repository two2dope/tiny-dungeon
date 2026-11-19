import React, { useMemo } from 'react';
import { ThemeId, Wall } from '../../engine/types';
import { getWallTexture } from './proceduralTextures';

interface Walls3DProps {
  walls: Wall[];
  cols?: number;
  rows?: number;
  theme?: ThemeId;
}

export const Walls3D: React.FC<Walls3DProps> = ({
  walls,
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
    { pos: [centerX, 0.38, -0.5 * tileSize] as [number, number, number], size: [spanX, 0.76, 0.32] as [number, number, number], trimY: 0.4 },
    { pos: [-0.5 * tileSize, 0.38, centerZ] as [number, number, number], size: [0.32, 0.76, spanZ] as [number, number, number], trimY: 0.4 },
    // Front walls (South & East) — cutaway low parapet for clear isometric visibility
    { pos: [centerX, 0.12, (rows - 0.5) * tileSize] as [number, number, number], size: [spanX, 0.24, 0.32] as [number, number, number], trimY: 0.14 },
    { pos: [(cols - 0.5) * tileSize, 0.12, centerZ] as [number, number, number], size: [0.32, 0.24, spanZ] as [number, number, number], trimY: 0.14 },
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
    </group>
  );
};
