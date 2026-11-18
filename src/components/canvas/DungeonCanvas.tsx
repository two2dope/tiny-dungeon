import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { formatCoordLabel, getValidMoves } from '../../engine/dungeon';
import { RoomTile3D } from './RoomTile3D';
import { Walls3D } from './Walls3D';
import { PartyPawn3D } from './PartyPawn3D';
import { TorchLight } from './TorchLight';
import { DungeonCoord, RoomState, ThemeId } from '../../engine/types';
import { soundEngine } from '../../audio/soundEngine';

const AmbientMotes: React.FC<{ theme: ThemeId; isPaused: boolean }> = ({ theme, isPaused }) => {
  const groupRef = useRef<THREE.Group>(null);
  const motes = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        x: ((i * 7) % 10) - 1,
        y: 0.6 + ((i * 3) % 5) * 0.45,
        z: ((i * 5) % 10) - 1,
        speed: 0.4 + (i % 4) * 0.15,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (isPaused || !groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      const mote = motes[idx];
      child.position.y = mote.y + Math.sin(t * mote.speed + idx) * 0.25;
      child.rotation.y = t * 0.8 + idx;
    });
  });

  const color = theme === 'sengoku' ? '#ea580c' : '#ff9233';

  return (
    <group ref={groupRef}>
      {motes.map((m, idx) => (
        <mesh key={idx} position={[m.x, m.y, m.z]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshBasicMaterial color={color} transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
};

interface DungeonSceneProps {
  onTileSelect: (coord: DungeonCoord) => void;
  onHoverRoom: (room: RoomState | null) => void;
  isPaused: boolean;
}

const DungeonScene: React.FC<DungeonSceneProps> = ({
  onTileSelect,
  onHoverRoom,
  isPaused,
}) => {
  const dungeon = useGameStore((state) => state.dungeon);
  const dicePool = useGameStore((state) => state.dicePool);
  const selectedDieId = useGameStore((state) => state.selectedDieId);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const theme = useGameStore((state) => state.theme);

  const selectedDie = dicePool.dice.find((d) => d.id === selectedDieId);
  const hasMovementDie = selectedDie && selectedDie.symbol === 'boot';
  const canAct = consumedDieIds.length < 3;
  const steps = hasMovementDie ? 2 : 1;

  const validMoves = useMemo(() => {
    if (!canAct) return [];
    return getValidMoves(dungeon, dungeon.currentCoord, steps);
  }, [dungeon, steps, canAct]);

  const tileSize = 2.6;
  const centerOffset = 1.5 * tileSize;

  const torchMain = theme === 'sengoku' ? '#ffb347' : '#ff944d';
  const torchAlt = theme === 'sengoku' ? '#fb923c' : '#ffaa66';

  return (
    <group position={[-centerOffset, 0, -centerOffset]}>
      <ambientLight intensity={1.25} color="#ffffff" />
      <hemisphereLight
        args={[
          theme === 'sengoku' ? '#fff7ed' : '#e2e8f0',
          theme === 'sengoku' ? '#785c44' : '#475569',
          1.5,
        ]}
      />
      <directionalLight
        position={[10, 20, 12]}
        intensity={2.4}
        color={theme === 'sengoku' ? '#ffedd5' : '#f8fafc'}
        castShadow
      />

      <TorchLight position={[-0.3, 1.15, -0.3]} intensity={4.2} color={torchMain} theme={theme} isPaused={isPaused} />
      <TorchLight position={[3 * tileSize + 0.3, 1.15, -0.3]} intensity={4.2} color={torchAlt} theme={theme} isPaused={isPaused} />
      <TorchLight position={[-0.3, 1.15, 3 * tileSize + 0.3]} intensity={4.2} color={torchAlt} theme={theme} isPaused={isPaused} />
      <TorchLight position={[3 * tileSize + 0.3, 1.15, 3 * tileSize + 0.3]} intensity={4.2} color="#ffbf5e" theme={theme} isPaused={isPaused} />
      <TorchLight position={[1.5 * tileSize, 2.1, 1.5 * tileSize]} intensity={4.2} color="#ff8533" theme={theme} isPaused={isPaused} />

      <AmbientMotes theme={theme} isPaused={isPaused} />

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
            theme={theme}
            isPaused={isPaused}
            onHover={onHoverRoom}
            onSelect={() => {
              soundEngine.play('step');
              onTileSelect(room.coord);
            }}
          />
        );
      })}

      <Walls3D walls={dungeon.walls} theme={theme} />
      <PartyPawn3D coord={dungeon.currentCoord} theme={theme} isPaused={isPaused} />
    </group>
  );
};

export const DungeonCanvas: React.FC = () => {
  const stageMove = useGameStore((state) => state.stageMove);
  const theme = useGameStore((state) => state.theme);
  const [hoveredRoom, setHoveredRoom] = useState<RoomState | null>(null);
  const [isPaused, setIsPaused] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

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

  const clearColor = theme === 'sengoku' ? '#292019' : '#182030';

  const getRoomPreviewText = (room: RoomState) => {
    const label = formatCoordLabel(room.coord);
    if (room.type === 'boss' && room.villain) {
      return `${label} • Chefe ${room.villain.name} (Rodada ${room.villain.round} • Poder ${room.villain.tier1Power}/${room.villain.tier2Power})`;
    }
    if (room.cleared) return `${label} • Câmara já explorada`;
    if (room.type === 'minion' && room.minion) {
      return `${label} • ${room.minion.name} (Nível req. ${room.minion.reqLevel} • +${room.minion.glory} Glória)`;
    }
    if (room.type === 'gem') return `${label} • Veio de Gemas (+${room.gemsCount ?? 1} gemas)`;
    if (room.type === 'trap') return `${label} • Armadilha (${room.trapDamage ?? 1} de dano)`;
    if (room.type === 'item') return `${label} • Arca de Artefato (+2 Glória)`;
    return `${label} • Câmara Vazia`;
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        frameloop={isPaused ? 'demand' : 'always'}
        camera={{ position: [10, 14, 10], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(clearColor);
          scene.fog = null;
        }}
      >
        <color attach="background" args={[clearColor]} />
        <DungeonScene
          onTileSelect={stageMove}
          onHoverRoom={setHoveredRoom}
          isPaused={isPaused}
        />
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

      {hoveredRoom && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/40 text-xs font-mono text-amber-200 shadow-xl backdrop-blur-md whitespace-nowrap"
        >
          {getRoomPreviewText(hoveredRoom)}
        </div>
      )}
    </div>
  );
};
