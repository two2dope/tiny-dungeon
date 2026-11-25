import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BossOutcome, DungeonCoord, HeroParty, RoomState, ThemeId } from '../../engine/types';
import { getRelevantHeroLevel } from '../../engine/combat';
import { getPrimaryRoomKind, getRoomContents } from '../../engine/dungeon';
import { getRelicCount } from '../../engine/relics';
import { HeroCrestSvg } from '../ui/TacticalIcons';
import { getSlabTexture, getStandeeHaloTexture } from './proceduralTextures';
import { getMapBiome } from './mapBiomes';
import { soundEngine } from '../../audio/soundEngine';
import {
  getStandeeTexture,
  resolveVillainStandeeKind,
  StandeeKind,
  StandeeVisualState,
} from './standeeTextures';

type BossBoardState = 'dormant' | 'active' | 'defeated' | 'victorious';

function resolveRoomStandeeKind(room: RoomState): StandeeKind | null {
  const primary = getPrimaryRoomKind(room);
  if (primary === 'boss') {
    const bossItem = getRoomContents(room).find((c) => c.kind === 'boss');
    const villainId = bossItem?.kind === 'boss' ? bossItem.villain.id : room.villain?.id;
    return resolveVillainStandeeKind(villainId);
  }
  if (room.cleared) return null;
  if (primary === 'minion') {
    const minionItem = getRoomContents(room).find((c) => c.kind === 'minion');
    const mId = minionItem?.kind === 'minion' ? minionItem.minion.id : room.minion?.id;
    if (mId === 'm_goblin') return 'goblin';
    if (mId === 'm_skeleton') return 'skeleton';
    if (mId === 'm_orc') return 'orc';
    return 'troll';
  }
  if (primary === 'gem') return 'gem';
  if (primary === 'item') return 'item';
  if (primary === 'trap') return 'trap';
  if (primary === 'potion') return 'potion';
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

const StandeePedestal: React.FC<{
  color: string;
  emissive: string;
  variant: 'minion' | 'prop';
  theme: ThemeId;
}> = ({ color, emissive, variant, theme }) => {
  const haloTexture = useMemo(
    () => getStandeeHaloTexture(color, variant, theme),
    [color, variant, theme]
  );

  return (
    <group>
      {/* Textured Ground Halo + Contact AO Shadow */}
      <mesh position={[0, 0.084, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[1.56, 1.56]} />
        {haloTexture ? (
          <meshBasicMaterial map={haloTexture} transparent opacity={0.9} depthWrite={false} />
        ) : (
          <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
        )}
      </mesh>

      {/* Low Grounded Carved Stone/Iron Socket Plinth */}
      <group position={[0, 0.105, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[0.46, 0.54, 0.055, 20]} />
          <meshStandardMaterial color="#221e1b" roughness={0.62} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.025, 0]} receiveShadow>
          <cylinderGeometry args={[0.37, 0.41, 0.04, 20]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.34}
            metalness={0.5}
            roughness={0.38}
          />
        </mesh>
        <mesh position={[0, 0.042, 0]}>
          <boxGeometry args={[0.44, 0.036, 0.1]} />
          <meshStandardMaterial color="#181512" metalness={0.65} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
};

interface RoomTile3DProps {
  room: RoomState;
  isCurrent: boolean;
  isValidMove: boolean;
  isPortal?: boolean;
  canCrossBarriers?: boolean;
  party?: HeroParty;
  currentRound?: number;
  bossOutcomes?: Record<string, BossOutcome>;
  theme?: ThemeId;
  mapId?: number;
  isPaused?: boolean;
  onSelect: (coord: DungeonCoord) => void;
  onLockedClick?: (room: RoomState) => void;
  onHover?: (room: RoomState | null) => void;
}

const RoomTile3DBase: React.FC<RoomTile3DProps> = ({
  room,
  isCurrent,
  isValidMove,
  isPortal = false,
  canCrossBarriers = false,
  party,
  currentRound = 1,
  bossOutcomes = {},
  theme = 'sengoku',
  mapId = 1,
  isPaused = false,
  onSelect,
  onLockedClick,
  onHover,
}) => {
  const tileSize = 2.6;
  const posX = room.coord.x * tileSize;
  const posZ = room.coord.y * tileSize;
  const slabMeshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const bossRingRef = useRef<THREE.Mesh>(null);
  const standeeGroupRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef<boolean>(false);

  const primaryKind = getPrimaryRoomKind(room);
  const isBoss = primaryKind === 'boss' && Boolean(room.villain);
  const bossState: BossBoardState | null = isBoss
    ? resolveBossBoardState(room, currentRound, bossOutcomes)
    : null;

  useEffect(() => {
    return () => {
      if (hoveredRef.current && typeof document !== 'undefined') {
        document.body.style.cursor = 'auto';
      }
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (isPaused) return;
    const t = clock.getElapsedTime();

    if (slabMeshRef.current) {
      const targetY = isValidMove && hoveredRef.current ? 0.056 : 0.02;
      slabMeshRef.current.position.y = THREE.MathUtils.lerp(
        slabMeshRef.current.position.y,
        targetY,
        Math.min(1, delta * 14)
      );
    }

    if (pulseRef.current && isValidMove) {
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      const hoverBoost = hoveredRef.current ? 0.25 : 0;
      mat.opacity = Math.min(0.95, 0.44 + Math.sin(t * 4.2) * 0.18 + hoverBoost);
      const scaleTarget = hoveredRef.current ? 1.04 : 1;
      pulseRef.current.scale.setScalar(
        THREE.MathUtils.lerp(pulseRef.current.scale.x, scaleTarget, Math.min(1, delta * 12))
      );
    }

    if (bossRingRef.current) {
      bossRingRef.current.rotation.z =
        bossState === 'active' ? -t * 0.55 : bossState === 'dormant' ? 0 : -t * 0.18;
      if (bossState === 'active') {
        const mat = bossRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.72 + Math.sin(t * 4.5) * 0.24;
        const scale = 1 + Math.sin(t * 4.5) * 0.06;
        bossRingRef.current.scale.set(scale, scale, 1);
      }
    }

    if (standeeGroupRef.current && !room.cleared) {
      const shouldPulse =
        (isBoss && bossState === 'active') || primaryKind === 'gem' || primaryKind === 'item';
      const s = shouldPulse ? 1 + Math.sin(t * 2.6 + posX + posZ) * 0.02 : 1;
      standeeGroupRef.current.scale.set(s, s, s);
    }
  });

  const isSengoku = theme === 'sengoku';
  const biome = getMapBiome(theme, mapId);
  const slabTexture = useMemo(() => getSlabTexture(theme, mapId), [theme, mapId]);
  const standeeKind = resolveRoomStandeeKind(room);
  const visualState: StandeeVisualState =
    bossState === 'dormant' || bossState === 'defeated' || bossState === 'victorious'
      ? bossState
      : 'normal';

  const standeeTexture = useMemo(
    () => (standeeKind ? getStandeeTexture(standeeKind, theme, visualState) : null),
    [standeeKind, theme, visualState]
  );

  let floorColor = biome.floorBase;
  if (isCurrent) floorColor = biome.floorCurrent;
  else if (isValidMove) floorColor = biome.floorValid;
  else if (room.locked && !canCrossBarriers && !room.cleared) {
    floorColor = biome.floorLocked;
  } else if (room.cleared) floorColor = biome.floorCleared;

  const borderColor = biome.borderColor;
  const highlightColor = biome.highlightColor;

  const renderBadge = (): React.ReactNode | null => {
    const moveRing = isValidMove ? 'ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.65)]' : '';
    const lockNode = room.locked ? (
      canCrossBarriers ? (
        <span aria-hidden="true">🔓</span>
      ) : (
        <img
          src="/assets/ui/token-sealed-lock.webp"
          alt=""
          aria-hidden="true"
          className="w-3.5 h-3.5 object-contain shrink-0"
        />
      )
    ) : null;
    const portalNode = isPortal ? (
      <img
        src="/assets/ui/token-edge-portal.webp"
        alt=""
        aria-hidden="true"
        className="w-3.5 h-3.5 object-contain shrink-0"
      />
    ) : null;

    if (room.type === 'start') {
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono whitespace-nowrap shadow flex items-center gap-1 bg-stone-950/90 border-amber-400/75 text-amber-200 ${moveRing}`}>
          {portalNode}
          <span>Início</span>
        </div>
      );
    }

    if (isBoss && room.villain && bossState) {
      if (bossState === 'dormant') {
        return (
          <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono whitespace-nowrap shadow flex items-center gap-1 bg-stone-900/90 border-stone-500/70 text-stone-300 ${moveRing}`}>
            {portalNode}
            <span>🔒 R{room.villain.round}</span>
          </div>
        );
      }
      if (bossState === 'active') {
        return (
          <div className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow-lg flex items-center gap-1 bg-red-950/95 border-amber-300 text-amber-200 ${moveRing}`}>
            {portalNode}
            <span>⚔️ R{room.villain.round} • {room.villain.tier1Power}/{room.villain.tier2Power}</span>
          </div>
        );
      }
      if (bossState === 'defeated') {
        return (
          <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 bg-emerald-950/95 border-emerald-400 text-emerald-200 ${moveRing}`}>
            {portalNode}
            <span>✓ DERROTADO</span>
          </div>
        );
      }
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 bg-red-950/95 border-red-400 text-red-200 ${moveRing}`}>
          {portalNode}
          <span>☠ VITORIOSO</span>
        </div>
      );
    }

    if (room.cleared || primaryKind === 'empty') {
      if (!isPortal) return null;
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 bg-teal-950/90 border-teal-400/75 text-teal-200 ${moveRing}`}>
          {portalNode}
          <span>Saída</span>
        </div>
      );
    }

    const contents = getRoomContents(room);
    const omamoriReduction = party ? getRelicCount(party, 'amuleto-omamori') * 2 : 0;

    const formatSecondaryChip = (entryKind: string): string | null => {
      const entry = contents.find((c) => c.kind === entryKind);
      if (!entry) return null;
      if (entry.kind === 'gem') return `💎${entry.count}`;
      if (entry.kind === 'trap') {
        const dmg = Math.max(0, entry.damage - omamoriReduction);
        return `⚠️-${dmg}♥`;
      }
      if (entry.kind === 'potion') return `🧪${entry.count}`;
      if (entry.kind === 'item') return `✦`;
      return null;
    };

    const minionItem = contents.find((c) => c.kind === 'minion');
    if (primaryKind === 'minion' && minionItem?.kind === 'minion') {
      const minion = minionItem.minion;
      const relevantLevel = party ? getRelevantHeroLevel(party, minion) : 1;
      const canBeatCleanly = relevantLevel >= minion.reqLevel;
      const extras = ['gem', 'trap', 'potion', 'item']
        .map(formatSecondaryChip)
        .filter(Boolean);

      return (
        <div
          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 ${
            canBeatCleanly
              ? 'bg-emerald-950/95 border-emerald-400/80 text-emerald-200'
              : 'bg-red-950/95 border-red-400/85 text-red-100'
          } ${moveRing}`}
        >
          {portalNode}
          {lockNode}
          <HeroCrestSvg classType={minion.classAffinity ?? 'warrior'} className="w-3.5 h-3.5" />
          <span>Nv.{minion.reqLevel}</span>
          {extras.length > 0 && <span className="text-amber-200">• {extras.join(' ')}</span>}
        </div>
      );
    }

    const gemItem = contents.find((c) => c.kind === 'gem');
    const trapItem = contents.find((c) => c.kind === 'trap');
    const potionItem = contents.find((c) => c.kind === 'potion');

    if (primaryKind === 'item') {
      const extras = ['gem', 'trap', 'potion'].map(formatSecondaryChip).filter(Boolean);
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 bg-amber-400/95 border-amber-200 text-stone-950 ${moveRing}`}>
          {portalNode}
          {lockNode}
          <span>✦ +1{extras.length > 0 ? ` • ${extras.join(' ')}` : ''}</span>
        </div>
      );
    }

    if (primaryKind === 'gem' && gemItem?.kind === 'gem') {
      const extras = ['trap', 'potion'].map(formatSecondaryChip).filter(Boolean);
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 bg-emerald-950/95 border-emerald-300/80 text-emerald-100 ${moveRing}`}>
          {portalNode}
          {lockNode}
          <span>💎 +{gemItem.count}{extras.length > 0 ? ` • ${extras.join(' ')}` : ''}</span>
        </div>
      );
    }

    if (primaryKind === 'trap' && trapItem?.kind === 'trap') {
      const effectiveDamage = Math.max(0, trapItem.damage - omamoriReduction);
      const extras = ['potion'].map(formatSecondaryChip).filter(Boolean);
      return (
        <div
          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 ${
            effectiveDamage === 0
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-orange-950/95 border-orange-300 text-orange-100'
          } ${moveRing}`}
        >
          {portalNode}
          {lockNode}
          <span>⚠️ -{effectiveDamage}♥{extras.length > 0 ? ` • ${extras.join(' ')}` : ''}</span>
        </div>
      );
    }

    if (primaryKind === 'potion' && potionItem?.kind === 'potion') {
      return (
        <div className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 bg-teal-950/95 border-teal-300/85 text-teal-100 ${moveRing}`}>
          {portalNode}
          {lockNode}
          <span>🧪 +{potionItem.count}</span>
        </div>
      );
    }

    return null;
  };

  const badgeNode = renderBadge();

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
          : '#78716c';

  const bossHaloTexture = useMemo(
    () => (isBoss ? getStandeeHaloTexture(bossRingColor, 'boss', theme) : null),
    [isBoss, bossRingColor, theme]
  );

  const standeePlaneArgs: [number, number] = isBoss
    ? bossState === 'active'
      ? [1.34, 1.68]
      : bossState === 'defeated'
        ? [1.06, 1.32]
        : bossState === 'dormant'
          ? [1.18, 1.48]
          : [1.28, 1.6]
    : primaryKind === 'gem' || primaryKind === 'item' || primaryKind === 'trap' || primaryKind === 'potion'
      ? [0.92, 1.15]
      : [1.06, 1.32];

  // Ground every bottom-anchored standee/medallion cleanly inside its pedestal/altar cradle
  const standeeY = isBoss ? 0.14 + standeePlaneArgs[1] / 2 : 0.12 + standeePlaneArgs[1] / 2;

  const standeeOpacity =
    bossState === 'dormant' ? 0.85 : bossState === 'defeated' ? 0.9 : 1;

  const handlePointerEnter = () => {
    hoveredRef.current = true;
    if (typeof document !== 'undefined') {
      document.body.style.cursor = isValidMove ? 'pointer' : 'default';
    }
    if (isValidMove) {
      soundEngine.play('hover');
    }
    onHover?.(room);
  };

  const handlePointerLeave = () => {
    hoveredRef.current = false;
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
    onHover?.(null);
  };

  const handleTileClick = () => {
    if (isValidMove) {
      onSelect(room.coord);
    } else if (room.locked && !canCrossBarriers) {
      onLockedClick?.(room);
    }
  };

  return (
    <group position={[posX, 0, posZ]}>
      {/* Contrasting base frame */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[tileSize * 0.98, 0.08, tileSize * 0.98]} />
        <meshStandardMaterial color={borderColor} roughness={0.7} />
      </mesh>

      {/* Main floor slab with subtle hover lift */}
      <mesh
        ref={slabMeshRef}
        position={[0, 0.02, 0]}
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          handlePointerEnter();
        }}
        onPointerOut={handlePointerLeave}
        onClick={(e) => {
          e.stopPropagation();
          handleTileClick();
        }}
      >
        <boxGeometry args={[tileSize * 0.92, 0.12, tileSize * 0.92]} />
        <meshStandardMaterial
          color={floorColor}
          map={slabTexture ?? undefined}
          bumpMap={slabTexture ?? undefined}
          bumpScale={0.065}
          roughness={biome.motif === 'water' ? 0.42 : 0.65}
          metalness={biome.motif === 'water' ? 0.22 : 0.12}
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
            handlePointerEnter();
          }}
          onPointerOut={handlePointerLeave}
          onClick={(e) => {
            e.stopPropagation();
            handleTileClick();
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
      {room.cleared && room.type !== 'start' && !isBoss && (
        <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 16]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#059669"
            emissiveIntensity={0.45}
          />
        </mesh>
      )}

      {!room.cleared && primaryKind === 'gem' && (
        <StandeePedestal color="#10b981" emissive="#059669" variant="prop" theme={theme} />
      )}
      {!room.cleared && primaryKind === 'minion' && (
        <StandeePedestal color="#ef4444" emissive="#b91c1c" variant="minion" theme={theme} />
      )}
      {!room.cleared && primaryKind === 'trap' && (
        <StandeePedestal color="#f97316" emissive="#c2410c" variant="prop" theme={theme} />
      )}
      {!room.cleared && primaryKind === 'item' && (
        <StandeePedestal color="#f59e0b" emissive="#b45309" variant="prop" theme={theme} />
      )}
      {!room.cleared && primaryKind === 'potion' && (
        <StandeePedestal color="#14b8a6" emissive="#0f766e" variant="prop" theme={theme} />
      )}

      {/* Boss Imperial Altar with Textured Runic Ground Halo */}
      {isBoss && (
        <group>
          <mesh
            ref={bossRingRef}
            position={[0, 0.086, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={2}
          >
            <planeGeometry args={[2.06, 2.06]} />
            {bossHaloTexture ? (
              <meshBasicMaterial
                map={bossHaloTexture}
                transparent
                opacity={bossState === 'dormant' ? 0.58 : 0.94}
                depthWrite={false}
              />
            ) : (
              <meshBasicMaterial color={bossRingColor} transparent opacity={0.5} depthWrite={false} />
            )}
          </mesh>

          <group position={[0, 0.11, 0]}>
            <mesh receiveShadow>
              <cylinderGeometry args={[0.72, 0.82, 0.06, 28]} />
              <meshStandardMaterial
                color="#1c1917"
                metalness={0.45}
                roughness={0.45}
              />
            </mesh>
            <mesh position={[0, 0.03, 0]} receiveShadow>
              <cylinderGeometry args={[0.58, 0.64, 0.05, 28]} />
              <meshStandardMaterial
                color={bossAltarBase}
                emissive={bossAltarEmissive}
                emissiveIntensity={bossState === 'dormant' ? 0 : 0.42}
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* 2.5D Die-Cut Illustrated Standee & Prop Medallion Billboard */}
      {standeeTexture && (
        <group ref={standeeGroupRef}>
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
        </group>
      )}

      {/* Decluttered objective micro-chip */}
      {badgeNode && (
        <Html
          position={
            isBoss
              ? [0, bossState === 'defeated' ? 1.48 : 1.78, 0]
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
