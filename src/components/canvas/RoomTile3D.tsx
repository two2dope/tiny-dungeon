import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomState } from '../../engine/types';

interface RoomTile3DProps {
  room: RoomState;
  isCurrent: boolean;
  isValidMove: boolean;
  onSelect: () => void;
}

export const RoomTile3D: React.FC<RoomTile3DProps> = ({
  room,
  isCurrent,
  isValidMove,
  onSelect,
}) => {
  const tileSize = 2.6;
  const posX = room.coord.x * tileSize;
  const posZ = room.coord.y * tileSize;
  const itemRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (itemRef.current) {
      const t = clock.getElapsedTime();
      itemRef.current.rotation.y = t * 1.2;
    }
  });

  // Base stone plate color
  let floorColor = '#181a22';
  if (isCurrent) floorColor = '#242835';
  else if (room.cleared) floorColor = '#1e212b';

  return (
    <group position={[posX, 0, posZ]}>
      {/* Interactive floor slab */}
      <mesh
        position={[0, 0, 0]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          if (isValidMove) onSelect();
        }}
      >
        <boxGeometry args={[tileSize * 0.94, 0.12, tileSize * 0.94]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Valid Move Highlighter Overlay */}
      {isValidMove && (
        <mesh
          position={[0, 0.07, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <planeGeometry args={[tileSize * 0.9, tileSize * 0.9]} />
          <meshBasicMaterial
            color="#ff9233"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Content representation */}
      {room.type === 'gem' && !room.cleared && (
        <group ref={itemRef} position={[0, 0.35, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#059669"
              emissiveIntensity={0.5}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
        </group>
      )}

      {room.type === 'minion' && !room.cleared && (
        <group position={[0, 0.25, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.45, 0.35]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#991b1b"
              emissiveIntensity={0.3}
              roughness={0.6}
            />
          </mesh>
          {/* Spikes */}
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.15, 0.2, 4]} />
            <meshStandardMaterial color="#450a0a" roughness={0.4} />
          </mesh>
        </group>
      )}

      {room.type === 'trap' && !room.cleared && (
        <group position={[0, 0.08, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.35, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {room.type === 'item' && !room.cleared && (
        <group ref={itemRef} position={[0, 0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.22, 0.25]} />
            <meshStandardMaterial
              color="#d4af37"
              emissive="#c87d55"
              emissiveIntensity={0.4}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      )}

      {room.type === 'boss' && (
        <group position={[0, 0.5, 0]}>
          {/* Boss Gateway Pillars */}
          <mesh position={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.9, 0.2]} />
            <meshStandardMaterial color="#3b0764" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.9, 0.2]} />
            <meshStandardMaterial color="#3b0764" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[1.1, 0.15, 0.25]} />
            <meshStandardMaterial color="#581c87" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Central dark core */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#7e22ce"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
