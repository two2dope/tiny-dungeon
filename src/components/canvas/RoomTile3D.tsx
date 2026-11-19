import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BossOutcome, DungeonCoord, HeroParty, RoomState, ThemeId } from '../../engine/types';
import { getRelevantHeroLevel } from '../../engine/combat';
import { getRelicCount } from '../../engine/relics';
import { getSlabTexture } from './proceduralTextures';
import {
  getStandeeTexture,
  resolveVillainStandeeKind,
  StandeeKind,
  StandeeVisualState,
} from './standeeTextures';

type BossBoardState = 'dormant' | 'active' | 'defeated' | 'victorious';

function resolveRoomStandeeKind(room: RoomState): StandeeKind | null {
  if (room.type === 'boss') {
    return resolveVillainStandeeKind(room.villain?.id);
  }
  if (room.cleared) return null;
  if (room.type === 'minion') {
    const mId = room.minion?.id;
    if (mId === 'm_goblin') return 'goblin';
    if (mId === 'm_skeleton') return 'skeleton';
    if (mId === 'm_orc') return 'orc';
    return 'troll';
  }
  if (room.type === 'gem') return 'gem';
  if (room.type === 'item') return 'item';
  if (room.type === 'trap') return 'trap';
  return null;
}

function resolveBossBoardState(
  room: RoomState,
  currentRound: number,
  bossOutcomes: Record<string, BossOutcome>
): BossBoardState {
  const villain = room.villain;
  if (!villain) return 'dormant';
  const recorded = bossOutcomes[villain.id];
  if (recorded === 'defeated') return 'defeated';
  if (recorded === 'victorious') return 'victorious';
  if (currentRound === villain.round) return 'active';
  return 'dormant';
}

const StandeePedestal: React.FC<{ color: string; emissive: string }> = ({
  color,
  emissive,
}) => (
  <group position={[0, 0.11, 0]}>
    <mesh receiveShadow>
      <cylinderGeometry args={[0.52, 0.6, 0.09, 20]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.42} />
    </mesh>
    <mesh position={[0, 0.025, 0]} receiveShadow>
      <cylinderGeometry args={[0.42, 0.46, 0.07, 20]} />
      <meshStandardMaterial color="#1c1917" metalness={0.45} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.06, 0]}>
      <boxGeometry args={[0.44, 0.05, 0.1]} />
      <meshStandardMaterial color="#44403c" metalness={0.5} roughness={0.35} />
    </mesh>
  </group>
);

interface RoomTile3DProps {
  room: RoomState;
  isCurrent: boolean;
  isValidMove: boolean;
  party?: HeroParty;
  currentRound?: number;
  bossOutcomes?: Record<string, BossOutcome>;
  theme?: ThemeId;
  isPaused?: boolean;
  onSelect: (coord: DungeonCoord) => void;
  onHover?: (room: RoomState | null) => void;
}

const RoomTile3DBase: React.FC<RoomTile3DProps> = ({
  room,
  isCurrent,
  isValidMove,
  party,
  currentRound = 1,
  bossOutcomes = {},
  theme = 'sengoku',
  isPaused = false,
  onSelect,
  onHover,
}) => {
  const tileSize = 2.6;
  const posX = room.coord.x * tileSize;
  const posZ = room.coord.y * tileSize;
  const pulseRef = useRef<THREE.Mesh>(null);
  const bossRingRef = useRef<THREE.Mesh>(null);

  const isBoss = room.type === 'boss' && Boolean(room.villain);
  const bossState: BossBoardState | null = isBoss
    ? resolveBossBoardState(room, currentRound, bossOutcomes)
    : null;

  useFrame(({ clock }) => {
    if (isPaused) return;
    const t = clock.getElapsedTime();
    if (pulseRef.current && isValidMove) {
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.42 + Math.sin(t * 4) * 0.18;
    }
    if (bossRingRef.current && bossState === 'active') {
      const mat = bossRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.68 + Math.sin(t * 5) * 0.3;
      const scale = 1 + Math.sin(t * 5) * 0.08;
      bossRingRef.current.scale.set(scale, scale, 1);
    }
  });

  const isSengoku = theme === 'sengoku';
  const slabTexture = useMemo(() => getSlabTexture(theme), [theme]);
  const standeeKind = resolveRoomStandeeKind(room);
  const visualState: StandeeVisualState =
    bossState === 'dormant' || bossState === 'defeated' || bossState === 'victorious'
      ? bossState
      : 'normal';

  const standeeTexture = useMemo(
    () => (standeeKind ? getStandeeTexture(standeeKind, theme, visualState) : null),
    [standeeKind, theme, visualState]
  );

  let floorColor = isSengoku ? '#786754' : '#3f4c63';
  if (isCurrent) floorColor = isSengoku ? '#d6b88e' : '#64748b';
  else if (isValidMove) floorColor = isSengoku ? '#b89c72' : '#475569';
  else if (room.cleared) floorColor = isSengoku ? '#8a7965' : '#334155';

  const borderColor = isSengoku ? '#4a3a2c' : '#1e293b';
  const highlightColor = isSengoku ? '#fbbf24' : '#38bdf8';

  const renderBadge = (): React.ReactNode | null => {
    const moveRing = isValidMove ? 'ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.65)]' : '';

    if (room.type === 'start') {
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono whitespace-nowrap shadow bg-stone-950/90 border-amber-400/75 text-amber-200 ${moveRing}`}>
          Início
        </div>
      );
    }

    if (isBoss && room.villain && bossState) {
      if (bossState === 'dormant') {
        return (
          <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono whitespace-nowrap shadow bg-stone-900/90 border-stone-500/70 text-stone-300 ${moveRing}`}>
            🔒 R{room.villain.round}
          </div>
        );
      }
      if (bossState === 'active') {
        return (
          <div className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow-lg bg-red-950/95 border-amber-300 text-amber-200 ${moveRing}`}>
            ⚔️ R{room.villain.round} • {room.villain.tier1Power}/{room.villain.tier2Power}
          </div>
        );
      }
      if (bossState === 'defeated') {
        return (
          <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow bg-emerald-950/95 border-emerald-400 text-emerald-200 ${moveRing}`}>
            ✓ DERROTADO
          </div>
        );
      }
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow bg-red-950/95 border-red-400 text-red-200 ${moveRing}`}>
          ☠ VITORIOSO
        </div>
      );
    }

    if (room.cleared || room.type === 'empty') {
      return null;
    }

    if (room.type === 'minion' && room.minion) {
      const relevantLevel = party ? getRelevantHeroLevel(party, room.minion) : 1;
      const canBeatCleanly = relevantLevel >= room.minion.reqLevel;

      return (
        <div
          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow ${
            canBeatCleanly
              ? 'bg-emerald-950/95 border-emerald-400/80 text-emerald-200'
              : 'bg-red-950/95 border-red-400/85 text-red-100'
          } ${moveRing}`}
        >
          ⚔️ Nv.{room.minion.reqLevel}
        </div>
      );
    }

    if (room.type === 'gem') {
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow bg-emerald-950/95 border-emerald-300/80 text-emerald-100 ${moveRing}`}>
          💎 +{room.gemsCount ?? 1}
        </div>
      );
    }

    if (room.type === 'item') {
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow bg-amber-400/95 border-amber-200 text-stone-950 ${moveRing}`}>
          ✦ +1
        </div>
      );
    }

    if (room.type === 'trap') {
      const omamoriReduction = party ? getRelicCount(party, 'amuleto-omamori') : 0;
      const effectiveDamage = Math.max(0, (room.trapDamage ?? 1) - omamoriReduction);
      return (
        <div
          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow ${
            effectiveDamage === 0
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-orange-950/95 border-orange-300 text-orange-100'
          } ${moveRing}`}
        >
          ⚠️ -{effectiveDamage}♥
        </div>
      );
    }

    return null;
  };

  const badgeNode = renderBadge();

  // Boss altar visual params per state
  const bossAltarBase =
    bossState === 'active'
      ? isSengoku
        ? '#991b1b'
        : '#b45309'
      : bossState === 'defeated'
        ? '#064e3b'
        : bossState === 'victorious'
          ? '#7f1d1d'
          : '#292524';
  const bossAltarEmissive =
    bossState === 'active'
      ? isSengoku
        ? '#7f1d1d'
        : '#92400e'
      : bossState === 'defeated'
        ? '#065f46'
        : bossState === 'victorious'
          ? '#991b1b'
          : '#000000';
  const bossRingColor =
    bossState === 'active'
      ? '#fbbf24'
      : bossState === 'defeated'
        ? '#10b981'
        : bossState === 'victorious'
          ? '#dc2626'
          : '#57534e';

  const standeePlaneArgs: [number, number] = isBoss
    ? bossState === 'active'
      ? [1.34, 1.68]
      : bossState === 'defeated'
        ? [1.06, 1.32]
        : bossState === 'dormant'
          ? [1.18, 1.48]
          : [1.28, 1.6]
    : room.type === 'gem' || room.type === 'item' || room.type === 'trap'
      ? [0.92, 1.15]
      : [1.06, 1.32];

  const standeeY = isBoss
    ? bossState === 'active'
      ? 0.92
      : bossState === 'defeated'
        ? 0.72
        : bossState === 'dormant'
          ? 0.8
          : 0.88
    : room.type === 'gem' || room.type === 'item' || room.type === 'trap'
      ? 0.64
      : 0.78;

  const standeeOpacity =
    bossState === 'dormant' ? 0.85 : bossState === 'defeated' ? 0.9 : 1;

  return (
    <group position={[posX, 0, posZ]}>
      {/* Contrasting base frame */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[tileSize * 0.98, 0.08, tileSize * 0.98]} />
        <meshStandardMaterial color={borderColor} roughness={0.7} />
      </mesh>

      {/* Main floor slab */}
      <mesh
        position={[0, 0.02, 0]}
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(room);
        }}
        onPointerOut={() => onHover?.(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (isValidMove) onSelect(room.coord);
        }}
      >
        <boxGeometry args={[tileSize * 0.92, 0.12, tileSize * 0.92]} />
        <meshStandardMaterial
          color={floorColor}
          map={slabTexture ?? undefined}
          bumpMap={slabTexture ?? undefined}
          bumpScale={0.065}
          roughness={0.65}
          metalness={0.12}
        />
      </mesh>

      {/* Valid Move Highlighter */}
      {isValidMove && (
        <mesh
          ref={pulseRef}
          position={[0, 0.095, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover?.(room);
          }}
          onPointerOut={() => onHover?.(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(room.coord);
          }}
        >
          <ringGeometry args={[tileSize * 0.3, tileSize * 0.45, 4]} />
          <meshBasicMaterial
            color={highlightColor}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Cleared seal marker */}
      {room.cleared && room.type !== 'start' && room.type !== 'boss' && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 16]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#059669"
            emissiveIntensity={0.45}
          />
        </mesh>
      )}

      {/* Gems */}
      {room.type === 'gem' && !room.cleared && (
        <StandeePedestal color="#10b981" emissive="#059669" />
      )}

      {/* Minions */}
      {room.type === 'minion' && !room.cleared && (
        <StandeePedestal color="#ef4444" emissive="#b91c1c" />
      )}

      {/* Traps */}
      {room.type === 'trap' && !room.cleared && (
        <StandeePedestal color="#f97316" emissive="#c2410c" />
      )}

      {/* Magic Items */}
      {room.type === 'item' && !room.cleared && (
        <StandeePedestal color="#f59e0b" emissive="#b45309" />
      )}

      {/* Boss Imperial Altar with 4 Visual States */}
      {isBoss && (
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.76, 0.86, 0.08, 28]} />
            <meshStandardMaterial
              color={bossAltarBase}
              emissive={bossAltarEmissive}
              emissiveIntensity={bossState === 'dormant' ? 0 : 0.45}
            />
          </mesh>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <cylinderGeometry args={[0.62, 0.68, 0.08, 28]} />
            <meshStandardMaterial color="#181311" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh ref={bossRingRef} position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.61, 28]} />
            <meshBasicMaterial
              color={bossRingColor}
              transparent
              opacity={bossState === 'dormant' ? 0.6 : 0.95}
            />
          </mesh>
        </group>
      )}

      {/* 2.5D Die-Cut Illustrated Standee & Prop Medallion Billboard */}
      {standeeTexture && (
        <Billboard position={[0, standeeY, 0]} follow={true}>
          <mesh>
            <planeGeometry args={standeePlaneArgs} />
            <meshBasicMaterial
              map={standeeTexture}
              transparent
              opacity={standeeOpacity}
              alphaTest={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Billboard>
      )}

      {/* Decluttered objective micro-chip (hidden on empty/cleared tiles) */}
      {badgeNode && (
        <Html
          position={
            isBoss
              ? [0, bossState === 'defeated' ? 1.48 : 1.75, 0]
              : room.type === 'start'
                ? [0, 0.14, 0.56]
                : [0, 1.38, 0]
          }
          center
          distanceFactor={11}
          zIndexRange={[5, 0]}
        >
          <div className="pointer-events-none select-none">{badgeNode}</div>
        </Html>
      )}
    </group>
  );
};

export const RoomTile3D = React.memo(RoomTile3DBase);
