import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RoomState, ThemeId } from '../../engine/types';
import { formatCoordLabel } from '../../engine/dungeon';

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

  let floorColor = isSengoku ? '#786754' : '#3f4c63';
  if (isCurrent) floorColor = isSengoku ? '#d6b88e' : '#64748b';
  else if (isValidMove) floorColor = isSengoku ? '#b89c72' : '#475569';
  else if (room.cleared) floorColor = isSengoku ? '#8a7965' : '#334155';

  const borderColor = isSengoku ? '#4a3a2c' : '#1e293b';
  const highlightColor = isSengoku ? '#fbbf24' : '#38bdf8';
  const minionId = room.minion?.id;
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
        <meshStandardMaterial color={floorColor} roughness={0.65} metalness={0.12} />
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
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.52, 0.58, 0.08, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.45} />
          </mesh>
          <group ref={itemRef} position={[0, 0.36, 0]} scale={1.45}>
            <mesh castShadow>
              <octahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial
                color="#34d399"
                emissive="#10b981"
                emissiveIntensity={0.9}
                metalness={0.35}
                roughness={0.12}
              />
            </mesh>
            <mesh position={[0.2, -0.05, 0.14]} scale={0.7}>
              <octahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial color="#6ee7b7" emissive="#10b981" emissiveIntensity={0.75} />
            </mesh>
          </group>
        </group>
      )}

      {/* Minions */}
      {room.type === 'minion' && !room.cleared && (
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.52, 0.58, 0.08, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.45} />
          </mesh>
          <group position={[0, 0.3, 0]} scale={1.45}>
            {minionId === 'm_goblin' && (
              <>
                <mesh castShadow>
                  <coneGeometry args={[0.22, 0.44, 5]} />
                  <meshStandardMaterial color="#65a30d" emissive="#365314" emissiveIntensity={0.3} roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.25, 0]}>
                  <sphereGeometry args={[0.13, 8, 8]} />
                  <meshStandardMaterial color="#a3e635" emissive="#4d7c0f" emissiveIntensity={0.25} roughness={0.45} />
                </mesh>
              </>
            )}
            {minionId === 'm_skeleton' && (
              <>
                <mesh castShadow>
                  <cylinderGeometry args={[0.16, 0.19, 0.46, 6]} />
                  <meshStandardMaterial color="#f5f5f4" emissive="#57534e" emissiveIntensity={0.25} roughness={0.4} />
                </mesh>
                <mesh position={[0.21, 0.06, 0]}>
                  <boxGeometry args={[0.07, 0.34, 0.26]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
                </mesh>
              </>
            )}
            {minionId === 'm_orc' && (
              <>
                <mesh castShadow>
                  <boxGeometry args={[0.42, 0.5, 0.34]} />
                  <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.45} />
                </mesh>
                <mesh position={[-0.25, 0.15, 0]}>
                  <sphereGeometry args={[0.13, 6, 6]} />
                  <meshStandardMaterial color="#7f1d1d" metalness={0.5} />
                </mesh>
                <mesh position={[0.25, 0.15, 0]}>
                  <sphereGeometry args={[0.13, 6, 6]} />
                  <meshStandardMaterial color="#7f1d1d" metalness={0.5} />
                </mesh>
              </>
            )}
            {(minionId === 'm_troll' || !minionId) && (
              <>
                <mesh castShadow position={[0, 0.12, 0]}>
                  <dodecahedronGeometry args={[0.32, 0]} />
                  <meshStandardMaterial color="#b91c1c" emissive="#7f1d1d" emissiveIntensity={0.45} />
                </mesh>
                <mesh position={[0, 0.42, 0]}>
                  <coneGeometry args={[0.16, 0.24, 4]} />
                  <meshStandardMaterial color="#f87171" />
                </mesh>
              </>
            )}
          </group>
        </group>
      )}

      {/* Traps */}
      {room.type === 'trap' && !room.cleared && (
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.52, 0.58, 0.08, 16]} />
            <meshStandardMaterial color="#f97316" emissive="#c2410c" emissiveIntensity={0.5} />
          </mesh>
          <group position={[0, 0.06, 0]} scale={1.45}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 0.36, 8]} />
              <meshBasicMaterial color="#fb923c" />
            </mesh>
            <mesh position={[-0.14, 0.12, -0.14]}>
              <coneGeometry args={[0.07, 0.24, 4]} />
              <meshStandardMaterial color="#f87171" emissive="#ef4444" emissiveIntensity={0.4} metalness={0.75} />
            </mesh>
            <mesh position={[0.14, 0.12, 0.14]}>
              <coneGeometry args={[0.07, 0.24, 4]} />
              <meshStandardMaterial color="#e2e8f0" emissive="#f87171" emissiveIntensity={0.35} metalness={0.8} />
            </mesh>
            <mesh position={[-0.14, 0.12, 0.14]}>
              <coneGeometry args={[0.07, 0.24, 4]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
            </mesh>
            <mesh position={[0.14, 0.12, -0.14]}>
              <coneGeometry args={[0.07, 0.24, 4]} />
              <meshStandardMaterial color="#f87171" metalness={0.8} />
            </mesh>
          </group>
        </group>
      )}

      {/* Magic Items */}
      {room.type === 'item' && !room.cleared && (
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.52, 0.58, 0.08, 16]} />
            <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.5} />
          </mesh>
          <group ref={itemRef} position={[0, 0.32, 0]} scale={1.45}>
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
          </group>
        </group>
      )}

      {/* Boss Gateway */}
      {room.type === 'boss' && (
        <group position={[0, 0.56, 0]} scale={1.15}>
          <mesh position={[-0.48, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 1.0, 0.2]} />
            <meshStandardMaterial
              color={isSengoku ? '#dc2626' : '#9333ea'}
              emissive={isSengoku ? '#991b1b' : '#6b21a8'}
              emissiveIntensity={0.45}
              metalness={0.4}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0.48, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 1.0, 0.2]} />
            <meshStandardMaterial
              color={isSengoku ? '#dc2626' : '#9333ea'}
              emissive={isSengoku ? '#991b1b' : '#6b21a8'}
              emissiveIntensity={0.45}
              metalness={0.4}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.28, 0.16, 0.26]} />
            <meshStandardMaterial
              color={isSengoku ? '#ef4444' : '#a855f7'}
              emissive={isSengoku ? '#b91c1c' : '#7e22ce'}
              emissiveIntensity={0.5}
              metalness={0.45}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#f59e0b"
              emissiveIntensity={1.1}
            />
          </mesh>
        </group>
      )}

      {/* Always-visible tactical label */}
      <Html
        position={[0, 0.95, 0]}
        center
        distanceFactor={13}
        zIndexRange={[10, 0]}
      >
        <div className="pointer-events-none select-none">{renderBadge()}</div>
      </Html>
    </group>
  );
};
