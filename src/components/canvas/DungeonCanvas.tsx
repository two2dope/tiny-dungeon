import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EventFeedback, useGameStore } from '../../store/gameStore';
import { formatCoordLabel, getShortestPath, getValidMoves } from '../../engine/dungeon';
import { RoomTile3D } from './RoomTile3D';
import { Walls3D } from './Walls3D';
import { PartyPawn3D } from './PartyPawn3D';
import { TorchLight } from './TorchLight';
import { Environment360 } from './Environment360';
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

const TacticalPath3D: React.FC<{ path: DungeonCoord[]; tileSize: number }> = ({
  path,
  tileSize,
}) => {
  if (path.length < 2) return null;

  return (
    <group>
      {path.slice(0, -1).map((from, idx) => {
        const to = path[idx + 1];
        const dx = to.x - from.x;
        const dz = to.y - from.y;
        const midX = ((from.x + to.x) / 2) * tileSize;
        const midZ = ((from.y + to.y) / 2) * tileSize;
        const rotY = Math.atan2(dx, dz);

        return (
          <group key={`seg-${idx}`} position={[midX, 0.14, midZ]} rotation={[0, rotY, 0]}>
            <mesh>
              <boxGeometry args={[0.18, 0.04, tileSize * 0.92]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0.04, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.2, 0.42, 4]} />
              <meshBasicMaterial color="#fde047" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const ActionBurst3D: React.FC<{
  coord: DungeonCoord;
  feedback: EventFeedback | null;
  tileSize: number;
  isPaused: boolean;
}> = ({ coord, feedback, tileSize, isPaused }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Group>(null);
  const progressRef = useRef<number>(1);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (feedback && feedback.id !== lastIdRef.current) {
      lastIdRef.current = feedback.id;
      progressRef.current = 0;
    }
  }, [feedback]);

  const toneColor =
    feedback?.tone === 'damage'
      ? '#ef4444'
      : feedback?.tone === 'glory'
        ? '#fbbf24'
        : feedback?.tone === 'heal'
          ? '#34d399'
          : '#38bdf8';

  useFrame((_, delta) => {
    if (isPaused || !groupRef.current) return;
    if (progressRef.current >= 1) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    progressRef.current = Math.min(1, progressRef.current + delta / 0.6);
    const p = progressRef.current;

    if (ringRef.current) {
      const s = 0.4 + p * 1.9;
      ringRef.current.scale.set(s, s, 1);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.9;
    }
    if (sparksRef.current) {
      sparksRef.current.children.forEach((child, idx) => {
        const angle = (idx / 6) * Math.PI * 2;
        const radius = 0.25 + p * 0.95;
        child.position.set(
          Math.cos(angle) * radius,
          0.25 + p * 1.35,
          Math.sin(angle) * radius
        );
        const shrink = Math.max(0.05, 1 - p * 0.85);
        child.scale.setScalar(shrink);
      });
    }
  });

  return (
    <group
      ref={groupRef}
      visible={false}
      position={[coord.x * tileSize, 0.12, coord.y * tileSize]}
    >
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.65, 24]} />
        <meshBasicMaterial color={toneColor} transparent opacity={0.9} />
      </mesh>
      <group ref={sparksRef}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <mesh key={`spark-${idx}`}>
            <octahedronGeometry args={[0.11, 0]} />
            <meshBasicMaterial color={toneColor} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

interface DungeonSceneProps {
  onTileSelect: (coord: DungeonCoord) => void;
  hoveredRoom: RoomState | null;
  onHoverRoom: (room: RoomState | null) => void;
  isPaused: boolean;
}

const DungeonScene: React.FC<DungeonSceneProps> = ({
  onTileSelect,
  hoveredRoom,
  onHoverRoom,
  isPaused,
}) => {
  const dungeon = useGameStore((state) => state.dungeon);
  const dicePool = useGameStore((state) => state.dicePool);
  const selectedDieId = useGameStore((state) => state.selectedDieId);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const theme = useGameStore((state) => state.theme);
  const lastEventFeedback = useGameStore((state) => state.lastEventFeedback);

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

  const tacticalPath = useMemo(() => {
    if (!hoveredRoom || !canAct) return [];
    const isTargetValid = validMoves.some(
      (m) => m.x === hoveredRoom.coord.x && m.y === hoveredRoom.coord.y
    );
    if (!isTargetValid) return [];
    return getShortestPath(dungeon, dungeon.currentCoord, hoveredRoom.coord, steps);
  }, [dungeon, hoveredRoom, validMoves, canAct, steps]);

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
      <Environment360 theme={theme} tileSize={tileSize} isPaused={isPaused} />

      {/* Grounded Tactical Tabletop Base Slab */}
      <group position={[1.5 * tileSize, -0.12, 1.5 * tileSize]}>
        <mesh receiveShadow>
          <boxGeometry args={[4 * tileSize + 1.4, 0.12, 4 * tileSize + 1.4]} />
          <meshStandardMaterial
            color={theme === 'sengoku' ? '#1e1610' : '#0f172a'}
            roughness={0.78}
            metalness={0.15}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[4 * tileSize + 1.65, 0.06, 4 * tileSize + 1.65]} />
          <meshStandardMaterial
            color={theme === 'sengoku' ? '#92400e' : '#475569'}
            roughness={0.48}
            metalness={0.45}
          />
        </mesh>
      </group>

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
      <TacticalPath3D path={tacticalPath} tileSize={tileSize} />
      <PartyPawn3D coord={dungeon.currentCoord} theme={theme} isPaused={isPaused} />
      <ActionBurst3D
        coord={dungeon.currentCoord}
        feedback={lastEventFeedback}
        tileSize={tileSize}
        isPaused={isPaused}
      />
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
          hoveredRoom={hoveredRoom}
          onHoverRoom={setHoveredRoom}
          isPaused={isPaused}
        />
        <OrbitControls
          enableRotate={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.3}
          minPolarAngle={Math.PI / 6}
          minDistance={10}
          maxDistance={28}
          target={[0, 0, 0]}
        />
      </Canvas>

      {hoveredRoom && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/40 text-xs font-mono text-amber-200 shadow-xl backdrop-blur-md whitespace-nowrap"
        >
          {getRoomPreviewText(hoveredRoom)}
        </div>
      )}
    </div>
  );
};
