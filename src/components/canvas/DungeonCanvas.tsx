import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EventFeedback, useGameStore } from '../../store/gameStore';
import {
  formatCoordLabel,
  getMapDimensions,
  getPortalDestination,
  getRoomContents,
  getShortestPath,
  getValidMoves,
} from '../../engine/dungeon';
import { getRelevantHeroLevel } from '../../engine/combat';
import { RoomTile3D } from './RoomTile3D';
import { Walls3D } from './Walls3D';
import { PartyPawn3D } from './PartyPawn3D';
import { TorchLight } from './TorchLight';
import { Environment360 } from './Environment360';
import { DungeonCoord, HeroClass, RoomState, ThemeId } from '../../engine/types';
import {
  getMovementBonusSteps,
  getRelicCount,
  hasBarrierCrossingAbility,
} from '../../engine/relics';
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
        const isPortalJump = Math.abs(dx) + Math.abs(dz) > 1;

        if (isPortalJump) {
          return (
            <group key={`portal-seg-${idx}`}>
              <mesh
                position={[from.x * tileSize, 0.16, from.y * tileSize]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[0.55, 0.72, 24]} />
                <meshBasicMaterial color="#2dd4bf" transparent opacity={0.95} side={THREE.DoubleSide} />
              </mesh>
              <mesh
                position={[to.x * tileSize, 0.16, to.y * tileSize]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[0.55, 0.72, 24]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.95} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        }

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
  const party = useGameStore((state) => state.party);
  const currentRound = useGameStore((state) => state.currentRound);
  const bossOutcomes = useGameStore((state) => state.bossOutcomes);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const theme = useGameStore((state) => state.theme);
  const lastEventFeedback = useGameStore((state) => state.lastEventFeedback);

  const canAct = consumedDieIds.length < 3;
  const steps = 2 + getMovementBonusSteps(party);
  const canCrossBarriers = hasBarrierCrossingAbility(party);

  const validMoves = useMemo(() => {
    if (!canAct) return [];
    return getValidMoves(dungeon, dungeon.currentCoord, steps, { canCrossBarriers });
  }, [dungeon, steps, canAct, canCrossBarriers]);

  const tileSize = 2.6;
  const { cols, rows } = getMapDimensions(dungeon);
  const centerOffsetX = ((cols - 1) / 2) * tileSize;
  const centerOffsetZ = ((rows - 1) / 2) * tileSize;

  const tacticalPath = useMemo(() => {
    if (!hoveredRoom || !canAct) return [];
    const isTargetValid = validMoves.some(
      (m) => m.x === hoveredRoom.coord.x && m.y === hoveredRoom.coord.y
    );
    if (!isTargetValid) return [];
    return getShortestPath(dungeon, dungeon.currentCoord, hoveredRoom.coord, steps, {
      canCrossBarriers,
    });
  }, [dungeon, hoveredRoom, validMoves, canAct, steps, canCrossBarriers]);

  const handleSelectTile = useCallback(
    (coord: DungeonCoord) => {
      soundEngine.play('step');
      onTileSelect(coord);
    },
    [onTileSelect]
  );

  const torchMain = theme === 'sengoku' ? '#ffb347' : '#ff944d';
  const torchAlt = theme === 'sengoku' ? '#fb923c' : '#ffaa66';

  return (
    <group position={[-centerOffsetX, 0, -centerOffsetZ]}>
      <ambientLight intensity={1.15} color="#ffffff" />
      <hemisphereLight
        args={[
          theme === 'sengoku' ? '#dbeafe' : '#e2e8f0',
          theme === 'sengoku' ? '#6e4e37' : '#475569',
          theme === 'sengoku' ? 1.35 : 1.5,
        ]}
      />
      <directionalLight
        position={[10, 20, 12]}
        intensity={theme === 'sengoku' ? 2.45 : 2.4}
        color={theme === 'sengoku' ? '#ffedd5' : '#f8fafc'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      <TorchLight position={[-0.3, 1.15, -0.3]} intensity={4.2} color={torchMain} theme={theme} isPaused={isPaused} />
      <TorchLight position={[(cols - 1) * tileSize + 0.3, 1.15, -0.3]} intensity={4.2} color={torchAlt} theme={theme} isPaused={isPaused} />
      <TorchLight position={[-0.3, 1.15, (rows - 1) * tileSize + 0.3]} intensity={4.2} color={torchAlt} theme={theme} isPaused={isPaused} />
      <TorchLight position={[(cols - 1) * tileSize + 0.3, 1.15, (rows - 1) * tileSize + 0.3]} intensity={4.2} color="#ffbf5e" theme={theme} isPaused={isPaused} />
      <TorchLight position={[centerOffsetX, 2.1, centerOffsetZ]} intensity={4.2} color="#ff8533" theme={theme} isPaused={isPaused} />

      <AmbientMotes theme={theme} isPaused={isPaused} />
      <Environment360 theme={theme} tileSize={tileSize} cols={cols} rows={rows} isPaused={isPaused} />

      {/* Grounded Tactical Tabletop Base Slab */}
      <group position={[centerOffsetX, -0.12, centerOffsetZ]}>
        <mesh receiveShadow>
          <boxGeometry args={[cols * tileSize + 1.4, 0.12, rows * tileSize + 1.4]} />
          <meshStandardMaterial
            color={theme === 'sengoku' ? '#1e1610' : '#0f172a'}
            roughness={0.78}
            metalness={0.15}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[cols * tileSize + 1.65, 0.06, rows * tileSize + 1.65]} />
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
            party={party}
            currentRound={currentRound}
            bossOutcomes={bossOutcomes}
            canCrossBarriers={canCrossBarriers}
            theme={theme}
            isPaused={isPaused}
            onHover={onHoverRoom}
            onSelect={handleSelectTile}
          />
        );
      })}

      <Walls3D
        walls={dungeon.walls}
        portals={dungeon.portals}
        canCrossBarriers={canCrossBarriers}
        cols={cols}
        rows={rows}
        theme={theme}
      />
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

interface DungeonCanvasProps {
  isLedgerOpen?: boolean;
}

export const DungeonCanvas: React.FC<DungeonCanvasProps> = ({ isLedgerOpen = false }) => {
  const stageMove = useGameStore((state) => state.stageMove);
  const theme = useGameStore((state) => state.theme);
  const dungeon = useGameStore((state) => state.dungeon);
  const party = useGameStore((state) => state.party);
  const currentRound = useGameStore((state) => state.currentRound);
  const bossOutcomes = useGameStore((state) => state.bossOutcomes);
  const [hoveredRoom, setHoveredRoom] = useState<RoomState | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!canvasEl) return;
    const onLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => {
      setContextLost(false);
    };
    canvasEl.addEventListener('webglcontextlost', onLost);
    canvasEl.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvasEl.removeEventListener('webglcontextlost', onLost);
      canvasEl.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [canvasEl]);

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

  const clearColor = theme === 'sengoku' ? '#141822' : '#182030';

  const getRoomPreviewText = (room: RoomState) => {
    const label = formatCoordLabel(room.coord);
    const canCross = hasBarrierCrossingAbility(party);
    const portalDest = getPortalDestination(dungeon, room.coord);
    const portalSuffix = portalDest ? ` • 🌀 Saída ↔ ${formatCoordLabel(portalDest)}` : '';
    const lockPrefix = room.locked && !canCross ? '🔒 Sala Trancada (Gancho Kaginawa) • ' : '';

    if (room.type === 'boss' && room.villain) {
      const outcome = bossOutcomes[room.villain.id];
      const statusText =
        outcome === 'defeated'
          ? 'Derrotado ✓'
          : outcome === 'victorious'
            ? 'Vitorioso ☠'
            : currentRound === room.villain.round
              ? 'ATIVO nesta rodada!'
              : `Adormecido — desperta na Rodada ${room.villain.round}`;
      return `${label} • Chefe ${room.villain.name} (${statusText} • Poder ${room.villain.tier1Power}/${room.villain.tier2Power})${portalSuffix}`;
    }
    if (room.cleared) return `${label} • Câmara já explorada${portalSuffix}`;

    const heroLabels: Record<HeroClass, string> = {
      warrior: 'Guerreiro',
      mage: 'Mago',
      cleric: 'Clérigo',
      rogue: 'Ladino',
    };
    const contents = getRoomContents(room);
    if (contents.length === 0) {
      return `${label} • ${lockPrefix}Câmara Vazia${portalSuffix}`;
    }

    const parts = contents.map((entry) => {
      if (entry.kind === 'minion') {
        const relevantLevel = getRelevantHeroLevel(party, entry.minion);
        const meetsReq = relevantLevel >= entry.minion.reqLevel;
        const classLabel = entry.minion.classAffinity
          ? `${heroLabels[entry.minion.classAffinity]} `
          : '';
        const combatHint = meetsReq
          ? 'Sem dano ✓'
          : `Seu Nv.${relevantLevel}: -${entry.minion.damage}♥`;
        return `${entry.minion.name} (${classLabel}Nv.${entry.minion.reqLevel} • ${combatHint})`;
      }
      if (entry.kind === 'gem') return `💎 +${entry.count} Gema(s)`;
      if (entry.kind === 'trap') {
        const reduction = getRelicCount(party, 'amuleto-omamori') * 2;
        const effectiveDamage = Math.max(0, entry.damage - reduction);
        return `⚠️ Armadilha (-${effectiveDamage}♥)`;
      }
      if (entry.kind === 'potion') return `🧪 +${entry.count} Poção(ões)`;
      if (entry.kind === 'item') return `✦ Forja Gratuita (+1 casa)`;
      return '';
    });

    return `${label} • ${lockPrefix}${parts.filter(Boolean).join(' + ')}${portalSuffix}`;
  };

  return (
    <div
      className={`w-full h-full relative cursor-grab active:cursor-grabbing ${
        theme === 'sengoku' ? 'bg-[#141822]' : 'bg-[#182030]'
      }`}
    >
      <Canvas
        key={canvasKey}
        shadows
        dpr={[1, 1.5]}
        frameloop={isPaused ? 'demand' : 'always'}
        camera={{ position: [10, 14, 10], fov: 38 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(clearColor);
          scene.fog = null;
          setCanvasEl(gl.domElement);
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
          maxPolarAngle={Math.PI / 2.85}
          minPolarAngle={Math.PI / 5.5}
          minDistance={10}
          maxDistance={38}
          target={[0, 0, 0]}
        />
      </Canvas>

      {contextLost && (
        <div
          role="alert"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#141822]/95 text-amber-100 p-4 text-center"
        >
          <p className="font-mono text-xs sm:text-sm text-amber-200/90 max-w-sm">
            O contexto gráfico 3D (WebGL) foi interrompido pelo navegador.
          </p>
          <button
            type="button"
            onClick={() => {
              setContextLost(false);
              setCanvasKey((k) => k + 1);
            }}
            className="touch-target gui-btn-crimson px-4 py-2 rounded-lg font-serif font-bold text-xs uppercase tracking-wider"
          >
            Recarregar Cena 3D
          </button>
        </div>
      )}

      {hoveredRoom && (
        <div
          aria-live="polite"
          className={`pointer-events-none absolute top-[4.75rem] ${
            isLedgerOpen ? 'left-1/2 lg:left-[calc(50%+11.75rem)]' : 'left-1/2'
          } -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-[#120e14]/90 border border-amber-500/45 text-xs font-mono text-amber-200 shadow-xl backdrop-blur-md whitespace-nowrap transition-[left] duration-200`}
        >
          {getRoomPreviewText(hoveredRoom)}
        </div>
      )}
    </div>
  );
};
