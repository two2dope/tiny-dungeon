import React from 'react';
import { ThemeId, Wall } from '../../engine/types';

interface Walls3DProps {
  walls: Wall[];
  theme?: ThemeId;
}

export const Walls3D: React.FC<Walls3DProps> = ({ walls, theme = 'sengoku' }) => {
  const tileSize = 2.6;

  const perimeterWalls = [
    { pos: [1.5 * tileSize, 0.45, -0.5 * tileSize] as [number, number, number], size: [4 * tileSize + 0.4, 0.9, 0.32] as [number, number, number] },
    { pos: [1.5 * tileSize, 0.45, 3.5 * tileSize] as [number, number, number], size: [4 * tileSize + 0.4, 0.9, 0.32] as [number, number, number] },
    { pos: [-0.5 * tileSize, 0.45, 1.5 * tileSize] as [number, number, number], size: [0.32, 0.9, 4 * tileSize + 0.4] as [number, number, number] },
    { pos: [3.5 * tileSize, 0.45, 1.5 * tileSize] as [number, number, number], size: [0.32, 0.9, 4 * tileSize + 0.4] as [number, number, number] },
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
            <meshStandardMaterial color={perimColor} roughness={0.65} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[pw.size[0] + 0.08, 0.1, pw.size[2] + 0.08]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {walls.map((wall, idx) => {
        const midX = ((wall.from.x + wall.to.x) / 2) * tileSize;
        const midZ = ((wall.from.y + wall.to.y) / 2) * tileSize;
        const isHorizontal = wall.from.y !== wall.to.y;

        const wallSize: [number, number, number] = isHorizontal
          ? [tileSize * 0.92, 0.78, 0.26]
          : [0.26, 0.78, tileSize * 0.92];

        return (
          <group key={`wall-${idx}`} position={[midX, 0.39, midZ]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={wallSize} />
              <meshStandardMaterial
                color={innerWallColor}
                roughness={0.65}
                metalness={0.15}
              />
            </mesh>
            <mesh position={isHorizontal ? [tileSize * 0.42, 0.06, 0] : [0, 0.06, tileSize * 0.42]}>
              <boxGeometry args={[0.32, 0.9, 0.32]} />
              <meshStandardMaterial color={pillarColor} roughness={0.65} />
            </mesh>
            <mesh position={isHorizontal ? [-tileSize * 0.42, 0.06, 0] : [0, 0.06, -tileSize * 0.42]}>
              <boxGeometry args={[0.32, 0.9, 0.32]} />
              <meshStandardMaterial color={pillarColor} roughness={0.65} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
