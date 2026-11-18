import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RoomState, ThemeId } from '../../engine/types';
import { formatCoordLabel } from '../../engine/dungeon';
import { getSlabTexture } from './proceduralTextures';
import { getStandeeTexture, StandeeKind } from './standeeTextures';
import { useGlbGeometry } from './glbRegistry';

function resolveRoomStandeeKind(room: RoomState): StandeeKind | null {
  if (room.type === 'boss') {
    if (room.villain?.id === 'v_manticore') return 'manticore';
    if (room.villain?.id === 'v_beholder') return 'beholder';
    return 'dragon';
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
  theme?: ThemeId;
  isPaused?: boolean;
  onSelect: () => void;
  onHover?: (room: RoomState | null) => void;
}

export const RoomTile3D: React.FC<RoomTile3DProps> = ({
  room,
  isCurrent,
  isValidMove,
  theme = 'sengoku',
  isPaused = false,
  onSelect,
  onHover,
}) => {
  const tileSize = 2.6;
  const posX = room.coord.x * tileSize;
  const posZ = room.coord.y * tileSize;
  const itemRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (isPaused) return;
    const t = clock.getElapsedTime();
    if (itemRef.current) {
      itemRef.current.rotation.y = t * 1.15;
    }
    if (pulseRef.current && isValidMove) {
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.42 + Math.sin(t * 4) * 0.18;
    }
  });

  const isSengoku = theme === 'sengoku';
  const slabTexture = useMemo(() => getSlabTexture(theme), [theme]);
  const standeeKind = resolveRoomStandeeKind(room);
  const standeeTexture = useMemo(
    () => (standeeKind ? getStandeeTexture(standeeKind, theme) : null),
    [standeeKind, theme]
  );
  const relicChestGeom = useGlbGeometry('relic-chest');
  const toriiGateGeom = useGlbGeometry('torii-gate');

  let floorColor = isSengoku ? '#786754' : '#3f4c63';
  if (isCurrent) floorColor = isSengoku ? '#d6b88e' : '#64748b';
  else if (isValidMove) floorColor = isSengoku ? '#b89c72' : '#475569';
  else if (room.cleared) floorColor = isSengoku ? '#8a7965' : '#334155';

  const borderColor = isSengoku ? '#4a3a2c' : '#1e293b';
  const highlightColor = isSengoku ? '#fbbf24' : '#38bdf8';
  const coordLabel = formatCoordLabel(room.coord);

  const renderBadge = () => {
    const moveRing = isValidMove ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.7)]' : '';
    const moveHint = isValidMove ? ' 🎯' : '';

    if (room.type === 'start') {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[11px] font-mono whitespace-nowrap shadow-md bg-stone-900/90 border-amber-400 text-amber-200 ${moveRing}`}>
          🚩 {coordLabel} • Início{moveHint}
        </div>
      );
    }

    if (room.type === 'boss' && room.villain) {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold whitespace-nowrap shadow-lg bg-purple-950/95 border-amber-300 text-amber-200 ${moveRing}`}>
          💀 {room.villain.name.split(' ')[0]} (R{room.villain.round}){moveHint}
        </div>
      );
    }

    if (room.cleared) {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[10px] font-mono whitespace-nowrap bg-stone-900/80 border-emerald-500/60 text-emerald-300 ${moveRing}`}>
          {coordLabel} ✓{moveHint}
        </div>
      );
    }

    if (room.type === 'minion' && room.minion) {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold whitespace-nowrap shadow-md bg-red-950/95 border-red-400 text-white ${moveRing}`}>
          ⚔️ {room.minion.name.split(' ')[0]} Nv.{room.minion.reqLevel} (+{room.minion.glory}★){moveHint}
        </div>
      );
    }

    if (room.type === 'gem') {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold whitespace-nowrap shadow-md bg-emerald-950/95 border-emerald-300 text-white ${moveRing}`}>
          💎 +{room.gemsCount ?? 1} Gemas{moveHint}
        </div>
      );
    }

    if (room.type === 'item') {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold whitespace-nowrap shadow-md bg-amber-400/95 border-amber-200 text-stone-950 ${moveRing}`}>
          🧰 Artefato (+2★){moveHint}
        </div>
      );
    }

    if (room.type === 'trap') {
      return (
        <div className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold whitespace-nowrap shadow-md bg-orange-950/95 border-orange-300 text-white ${moveRing}`}>
          ⚠️ Armadilha (-{room.trapDamage ?? 1}❤️){moveHint}
        </div>
      );
    }

    return (
      <div className={`px-2 py-0.5 rounded-md border text-[10px] font-mono whitespace-nowrap bg-stone-800/85 border-stone-400/60 text-stone-100 ${moveRing}`}>
        {coordLabel}{isValidMove ? ' 🎯 Mover' : ''}
      </div>
    );
  };

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
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(room);
        }}
        onPointerOut={() => onHover?.(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (isValidMove) onSelect();
        }}
      >
        <boxGeometry args={[tileSize * 0.92, 0.12, tileSize * 0.92]} />
        <meshStandardMaterial
          color={floorColor}
          map={slabTexture ?? undefined}
          bumpMap={slabTexture ?? undefined}
          bumpScale={0.03}
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
            onSelect();
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
          <circleGeometry args={[0.28, 16]} />
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
        <group>
          <StandeePedestal color="#f59e0b" emissive="#b45309" />
          <group ref={itemRef} position={[0, 0.2, 0.28]} scale={0.85}>
            {relicChestGeom ? (
              <mesh geometry={relicChestGeom} castShadow>
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#d97706"
                  emissiveIntensity={0.45}
                  metalness={0.78}
                  roughness={0.22}
                />
              </mesh>
            ) : (
              <>
                <mesh castShadow>
                  <boxGeometry args={[0.36, 0.22, 0.28]} />
                  <meshStandardMaterial
                    color="#fbbf24"
                    emissive="#d97706"
                    emissiveIntensity={0.55}
                    metalness={0.8}
                    roughness={0.2}
                  />
                </mesh>
                <mesh position={[0, 0.14, 0]} castShadow>
                  <boxGeometry args={[0.38, 0.08, 0.3]} />
                  <meshStandardMaterial color="#fde047" metalness={0.85} roughness={0.18} />
                </mesh>
              </>
            )}
          </group>
        </group>
      )}

      {/* Boss Pedestal & Backdrop Torii Gateway */}
      {room.type === 'boss' && (
        <group>
          <group position={[0, 0.12, 0.14]}>
            <mesh receiveShadow>
              <cylinderGeometry args={[0.64, 0.72, 0.1, 24]} />
              <meshStandardMaterial
                color={isSengoku ? '#991b1b' : '#4c1d95'}
                emissive={isSengoku ? '#450a0a' : '#2e1065'}
                emissiveIntensity={0.35}
              />
            </mesh>
            <mesh position={[0, 0.03, 0]} receiveShadow>
              <cylinderGeometry args={[0.52, 0.56, 0.08, 24]} />
              <meshStandardMaterial color="#1c1917" metalness={0.5} roughness={0.35} />
            </mesh>
          </group>

          <group position={[0, 0.62, -0.52]} scale={1.18}>
            {toriiGateGeom ? (
              <mesh geometry={toriiGateGeom} castShadow>
                <meshStandardMaterial
                  color={isSengoku ? '#991b1b' : '#4c1d95'}
                  emissive={isSengoku ? '#450a0a' : '#2e1065'}
                  emissiveIntensity={0.28}
                  metalness={0.42}
                  roughness={0.38}
                />
              </mesh>
            ) : (
              <>
                <mesh position={[-0.48, 0, 0]} castShadow>
                  <boxGeometry args={[0.2, 1.0, 0.2]} />
                  <meshStandardMaterial
                    color={isSengoku ? '#991b1b' : '#4c1d95'}
                    emissive={isSengoku ? '#450a0a' : '#2e1065'}
                    emissiveIntensity={0.28}
                    metalness={0.42}
                    roughness={0.38}
                  />
                </mesh>
                <mesh position={[0.48, 0, 0]} castShadow>
                  <boxGeometry args={[0.2, 1.0, 0.2]} />
                  <meshStandardMaterial
                    color={isSengoku ? '#991b1b' : '#4c1d95'}
                    emissive={isSengoku ? '#450a0a' : '#2e1065'}
                    emissiveIntensity={0.28}
                    metalness={0.42}
                    roughness={0.38}
                  />
                </mesh>
                <mesh position={[0, 0.5, 0]} castShadow>
                  <boxGeometry args={[1.28, 0.16, 0.26]} />
                  <meshStandardMaterial
                    color={isSengoku ? '#b91c1c' : '#5b21b6'}
                    emissive={isSengoku ? '#450a0a' : '#2e1065'}
                    emissiveIntensity={0.3}
                    metalness={0.45}
                    roughness={0.35}
                  />
                </mesh>
              </>
            )}
          </group>
        </group>
      )}

      {/* 2.5D Die-Cut Illustrated Standee Billboard */}
      {standeeTexture && (
        <Billboard
          position={[
            room.type === 'boss' ? 0 : 0,
            room.type === 'boss' ? 0.88 : room.type === 'item' ? 0.78 : 0.76,
            room.type === 'boss' ? 0.14 : room.type === 'item' ? -0.05 : 0,
          ]}
          follow={true}
        >
          <mesh>
            <planeGeometry args={room.type === 'boss' ? [1.24, 1.55] : [1.02, 1.28]} />
            <meshBasicMaterial
              map={standeeTexture}
              transparent
              alphaTest={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Billboard>
      )}

      {/* Always-visible tactical label */}
      <Html
        position={
          room.type === 'boss'
            ? [0, 1.82, 0.14]
            : room.cleared || room.type === 'start' || room.type === 'empty'
              ? [0, 0.18, 0.88]
              : [0, 1.52, 0]
        }
        center
        distanceFactor={13}
        zIndexRange={[10, 0]}
      >
        <div className="pointer-events-none select-none">{renderBadge()}</div>
      </Html>
    </group>
  );
};
