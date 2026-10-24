import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { getValidMoves } from '../../engine/dungeon';
import { RoomTile3D } from './RoomTile3D';
import { Walls3D } from './Walls3D';
import { PartyPawn3D } from './PartyPawn3D';
import { TorchLight } from './TorchLight';
import { DungeonCoord } from '../../engine/types';

interface DungeonSceneProps {
  onTileSelect: (coord: DungeonCoord) => void;
}

const DungeonScene: React.FC<DungeonSceneProps> = ({ onTileSelect }) => {
  const dungeon = useGameStore((state) => state.dungeon);
  const dicePool = useGameStore((state) => state.dicePool);
  const selectedDieId = useGameStore((state) => state.selectedDieId);

  // Compute available movement steps based on active die
  const selectedDie = dicePool.dice.find((d) => d.id === selectedDieId);
  const hasMovementDie = selectedDie && selectedDie.symbol === 'boot';
  const steps = hasMovementDie ? 2 : 1;

  const validMoves = useMemo(() => {
    return getValidMoves(dungeon, dungeon.currentCoord, steps);
  }, [dungeon, steps]);

  const tileSize = 2.6;
  const centerOffset = 1.5 * tileSize;

  return (
    <group position={[-centerOffset, 0, -centerOffset]}>
      {/* Ambient Fill Light */}
      <ambientLight intensity={0.25} color="#1b2030" />

      {/* Atmospheric Pointlights (Torches) */}
      <TorchLight position={[-0.2, 1.2, -0.2]} intensity={3.5} color="#ff7a29" />
      <TorchLight position={[3 * tileSize + 0.2, 1.2, -0.2]} intensity={3.2} color="#ff8e3d" />
      <TorchLight position={[-0.2, 1.2, 3 * tileSize + 0.2]} intensity={3.2} color="#ff8e3d" />
      <TorchLight position={[3 * tileSize + 0.2, 1.2, 3 * tileSize + 0.2]} intensity={3.8} color="#ffaa44" />
      <TorchLight position={[1.5 * tileSize, 1.8, 1.5 * tileSize]} intensity={2.0} color="#ff6b35" />

      {/* Floor Room Tiles */}
      {Object.values(dungeon.rooms).map((room) => {
        const isCurrent =
          room.coord.x === dungeon.currentCoord.x &&
          room.coord.y === dungeon.currentCoord.y;
        const isValid = validMoves.some(
          (m) => m.x === room.coord.x && m.y === room.coord.y
        );

        return (
          <RoomTile3D
            key={`${room.coord.x}-${room.coord.y}`}
            room={room}
            isCurrent={isCurrent}
            isValidMove={isValid}
            onSelect={() => onTileSelect(room.coord)}
          />
        );
      })}

      {/* Interior & Perimeter Walls */}
      <Walls3D walls={dungeon.walls} />

      {/* Hero Party Marker */}
      <PartyPawn3D coord={dungeon.currentCoord} />
    </group>
  );
};

export const DungeonCanvas: React.FC = () => {
  const stageMove = useGameStore((state) => state.stageMove);

  // Check WebGL availability for test/headless environments
  const isWebGLAvailable = () => {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  };

  if (!isWebGLAvailable()) {
    return (
      <div
        data-testid="dungeon-canvas-fallback"
        className="w-full h-full flex items-center justify-center bg-dungeon-darkest text-stone-500 font-mono text-sm"
      >
        [WebGL 3D Dungeon Canvas Active]
      </div>
    );
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        camera={{ position: [10, 14, 10], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#08090c');
          scene.fog = null;
        }}
      >
        <DungeonScene onTileSelect={stageMove} />
        <OrbitControls
          enableRotate={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.3}
          minPolarAngle={Math.PI / 6}
          minDistance={10}
          maxDistance={25}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};
