import React from 'react';
import { Wall } from '../../engine/types';

interface Walls3DProps {
  walls: Wall[];
}

export const Walls3D: React.FC<Walls3DProps> = ({ walls }) => {
  const tileSize = 2.6;

  // Exterior perimeter walls
  const perimeterWalls = [
    // North wall (y = -0.5)
    { pos: [1.5 * tileSize, 0.4, -0.5 * tileSize] as [number, number, number], size: [4 * tileSize + 0.4, 0.8, 0.3] as [number, number, number] },
    // South wall (y = 3.5)
    { pos: [1.5 * tileSize, 0.4, 3.5 * tileSize] as [number, number, number], size: [4 * tileSize + 0.4, 0.8, 0.3] as [number, number, number] },
    // West wall (x = -0.5)
    { pos: [-0.5 * tileSize, 0.4, 1.5 * tileSize] as [number, number, number], size: [0.3, 0.8, 4 * tileSize + 0.4] as [number, number, number] },
    // East wall (x = 3.5)
    { pos: [3.5 * tileSize, 0.4, 1.5 * tileSize] as [number, number, number], size: [0.3, 0.8, 4 * tileSize + 0.4] as [number, number, number] },
  ];

  return (
    <group>
      {/* Perimeter boundaries */}
      {perimeterWalls.map((pw, idx) => (
        <mesh key={`perim-${idx}`} position={pw.pos} castShadow receiveShadow>
          <boxGeometry args={pw.size} />
          <meshStandardMaterial color="#1a1c23" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* Interior blocking walls */}
      {walls.map((wall, idx) => {
        const midX = ((wall.from.x + wall.to.x) / 2) * tileSize;
        const midZ = ((wall.from.y + wall.to.y) / 2) * tileSize;
        const isHorizontal = wall.from.y !== wall.to.y; // runs along X

        const wallSize: [number, number, number] = isHorizontal
          ? [tileSize * 0.9, 0.75, 0.25]
          : [0.25, 0.75, tileSize * 0.9];

        return (
          <group key={`wall-${idx}`} position={[midX, 0.375, midZ]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={wallSize} />
              <meshStandardMaterial
                color="#282b36"
                roughness={0.85}
                metalness={0.15}
              />
            </mesh>
            {/* Dark stone pillar accents on wall ends */}
            <mesh position={isHorizontal ? [tileSize * 0.42, 0.05, 0] : [0, 0.05, tileSize * 0.42]}>
              <boxGeometry args={[0.3, 0.85, 0.3]} />
              <meshStandardMaterial color="#161820" roughness={0.9} />
            </mesh>
            <mesh position={isHorizontal ? [-tileSize * 0.42, 0.05, 0] : [0, 0.05, -tileSize * 0.42]}>
              <boxGeometry args={[0.3, 0.85, 0.3]} />
              <meshStandardMaterial color="#161820" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
