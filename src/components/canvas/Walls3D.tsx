import React, { useMemo } from 'react';
import { ThemeId, Wall } from '../../engine/types';
import { getWallTexture } from './proceduralTextures';

interface Walls3DProps {
  walls: Wall[];
  theme?: ThemeId;
}

export const Walls3D: React.FC<Walls3DProps> = ({ walls, theme = 'sengoku' }) => {
  const tileSize = 2.6;
  const wallTexture = useMemo(() => getWallTexture(theme), [theme]);

  const perimeterWalls = [
    // Back walls (North & West) — full height framing
    { pos: [1.5 * tileSize, 0.38, -0.5 * tileSize] as [number, number, number], size: [4 * tileSize + 0.4, 0.76, 0.32] as [number, number, number], trimY: 0.4 },
    { pos: [-0.5 * tileSize, 0.38, 1.5 * tileSize] as [number, number, number], size: [0.32, 0.76, 4 * tileSize + 0.4] as [number, number, number], trimY: 0.4 },
    // Front walls (South & East) — cutaway low parapet for clear isometric visibility
    { pos: [1.5 * tileSize, 0.12, 3.5 * tileSize] as [number, number, number], size: [4 * tileSize + 0.4, 0.24, 0.32] as [number, number, number], trimY: 0.14 },
    { pos: [3.5 * tileSize, 0.12, 1.5 * tileSize] as [number, number, number], size: [0.32, 0.24, 4 * tileSize + 0.4] as [number, number, number], trimY: 0.14 },
  ];

  const perimColor = theme === 'sengoku' ? '#574132' : '#334155';
  const trimColor = theme === 'sengoku' ? '#856248' : '#64748b';
  const innerWallColor = theme === 'sengoku' ? '#73533d' : '#475569';
  const pillarColor = theme === 'sengoku' ? '#3d2b20' : '#1e293b';

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
          <mesh position={[0, pw.trimY, 0]}>
            <boxGeometry args={[pw.size[0] + 0.08, 0.08, pw.size[2] + 0.08]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} metalness={0.2} />
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
            <mesh position={isHorizontal ? [tileSize * 0.42, 0.04, 0] : [0, 0.04, tileSize * 0.42]}>
              <boxGeometry args={[0.3, 0.6, 0.3]} />
              <meshStandardMaterial color={pillarColor} roughness={0.65} />
            </mesh>
            <mesh position={isHorizontal ? [-tileSize * 0.42, 0.04, 0] : [0, 0.04, -tileSize * 0.42]}>
              <boxGeometry args={[0.3, 0.6, 0.3]} />
              <meshStandardMaterial color={pillarColor} roughness={0.65} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
