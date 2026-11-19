import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ThemeId } from '../../engine/types';
import {
  getCourtyardFadeTexture,
  getCourtyardGroundTexture,
  getGlowPoolTexture,
  getLacquerWoodTexture,
  getMistRingTexture,
  getPanoramaTexture,
  getTabletopMatTexture,
  getWallTexture,
  getWarBannerClothTexture,
} from './proceduralTextures';
import { useGlbGeometry } from './glbRegistry';

interface Environment360Props {
  theme: ThemeId;
  tileSize: number;
  cols?: number;
  rows?: number;
  isPaused?: boolean;
}

const BANNER_ANGLES = Array.from({ length: 8 }).map(
  (_, i) => (i * Math.PI) / 4 + Math.PI / 12
);
const PILLAR_ANGLES = Array.from({ length: 8 }).map(
  (_, i) => (i * Math.PI) / 4 + Math.PI / 6
);

export const Environment360: React.FC<Environment360Props> = ({
  theme,
  tileSize,
  cols = 4,
  rows = 4,
  isPaused = false,
}) => {
  const mistLowerRef = useRef<THREE.Mesh>(null);
  const mistUpperRef = useRef<THREE.Mesh>(null);
  const flamesGroupRef = useRef<THREE.Group>(null);
  const bannersGroupRef = useRef<THREE.Group>(null);

  const panoramaTexture = useMemo(() => getPanoramaTexture(theme), [theme]);
  const tabletopTexture = useMemo(() => getTabletopMatTexture(theme), [theme]);
  const courtyardGroundTexture = useMemo(() => getCourtyardGroundTexture(theme), [theme]);
  const courtyardFadeTexture = useMemo(() => getCourtyardFadeTexture(theme), [theme]);
  const lacquerTexture = useMemo(() => getLacquerWoodTexture(theme), [theme]);
  const wallTexture = useMemo(() => getWallTexture(theme), [theme]);
  const mistTexture = useMemo(() => getMistRingTexture(theme), [theme]);
  const glowPoolTexture = useMemo(() => getGlowPoolTexture(theme), [theme]);
  const warBannerTexture = useMemo(() => getWarBannerClothTexture(theme), [theme]);

  const toriiGeom = useGlbGeometry('torii-gate');
  const lanternGeom = useGlbGeometry('lantern-pedestal');

  const isSengoku = theme === 'sengoku';
  const centerX = ((cols - 1) / 2) * tileSize;
  const centerZ = ((rows - 1) / 2) * tileSize;

  // Exact per-axis & diagonal clearance for 4x4, 5x5, 6x5, and 6x6 boards
  const halfX = (cols * tileSize) / 2;
  const halfZ = (rows * tileSize) / 2;
  const cornerDist = Math.hypot(halfX, halfZ);
  const platformRadius = cornerDist + 3.4;
  const groundRadius = Math.max(40, cornerDist * 3.8);
  const bannerRadius = cornerDist + 4.35;
  const pillarRadius = cornerDist + 6.4;

  const cardinalGates = useMemo(
    () =>
      [
        [halfX + 2.65, 0],
        [-(halfX + 2.65), 0],
        [0, halfZ + 2.65],
        [0, -(halfZ + 2.65)],
      ] as const,
    [halfX, halfZ]
  );

  const diagonalBraziers = useMemo(
    () =>
      [
        [halfX + 1.45, halfZ + 1.45],
        [-(halfX + 1.45), halfZ + 1.45],
        [halfX + 1.45, -(halfZ + 1.45)],
        [-(halfX + 1.45), -(halfZ + 1.45)],
      ] as const,
    [halfX, halfZ]
  );

  const lanternPositions = useMemo(
    () =>
      [
        [-2.15, halfZ + 2.35],
        [2.15, halfZ + 2.35],
        [-2.15, -(halfZ + 2.35)],
        [2.15, -(halfZ + 2.35)],
        [halfX + 2.35, -2.15],
        [halfX + 2.35, 2.15],
        [-(halfX + 2.35), -2.15],
        [-(halfX + 2.35), 2.15],
      ] as const,
    [halfX, halfZ]
  );

  useFrame(({ clock }) => {
    if (isPaused) return;
    const t = clock.getElapsedTime();

    if (mistLowerRef.current) {
      mistLowerRef.current.rotation.z = t * 0.032;
    }
    if (mistUpperRef.current) {
      mistUpperRef.current.rotation.z = -t * 0.022;
    }

    if (flamesGroupRef.current) {
      flamesGroupRef.current.children.forEach((brazier, idx) => {
        const flicker =
          0.92 + Math.sin(t * 7.5 + idx * 1.9) * 0.11 + Math.cos(t * 11.2 + idx) * 0.06;
        brazier.scale.set(0.95 + (flicker - 1) * 0.4, flicker, 0.95 + (flicker - 1) * 0.4);
      });
    }

    if (bannersGroupRef.current) {
      bannersGroupRef.current.children.forEach((bannerCloth, idx) => {
        bannerCloth.rotation.x = Math.sin(t * 1.55 + idx * 0.95) * 0.055;
      });
    }
  });

  const gateColor = isSengoku ? '#d95341' : '#6374b5';
  const gateEmissive = isSengoku ? '#42100a' : '#1e1b4b';
  const stoneColor = isSengoku ? '#5c5047' : '#334155';
  const capTimberColor = isSengoku ? '#2b1c15' : '#1e2538';
  const bambooColor = isSengoku ? '#7d6945' : '#475569';
  const flameOuterColor = isSengoku ? '#ea580c' : '#0284c7';
  const flameMidColor = isSengoku ? '#f59e0b' : '#38bdf8';
  const flameCoreColor = isSengoku ? '#fef08a' : '#e0f2fe';
  const lanternGlowColor = isSengoku ? '#ffbe66' : '#7dd3fc';

  return (
    <group position={[centerX, 0, centerZ]}>
      {/* 360 Panoramic Horizon Sky Dome */}
      <mesh renderOrder={-10}>
        <sphereGeometry args={[Math.max(48, groundRadius + 8), 48, 32]} />
        <meshBasicMaterial
          map={panoramaTexture ?? undefined}
          color={panoramaTexture ? '#ffffff' : isSengoku ? '#141822' : '#0f172a'}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wide Textured Courtyard Flagstone Floor */}
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[groundRadius, 64]} />
        <meshStandardMaterial
          map={courtyardGroundTexture ?? undefined}
          bumpMap={courtyardGroundTexture ?? undefined}
          bumpScale={0.14}
          roughness={0.88}
          metalness={0.08}
          color={isSengoku ? '#c7c2be' : '#94a3b8'}
        />
      </mesh>

      {/* Smooth Radial Edge Fade blending Courtyard into Twilight Horizon */}
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[groundRadius + 0.2, 64]} />
        <meshBasicMaterial
          map={courtyardFadeTexture ?? undefined}
          transparent
          depthWrite={false}
          color={courtyardFadeTexture ? '#ffffff' : isSengoku ? '#141822' : '#0f172a'}
        />
      </mesh>

      {/* Elevated Dressed Temple Stone Dais beneath Tactical Board (top at y = -0.11) */}
      <group position={[0, -0.22, 0]}>
        <mesh rotation={[0, Math.PI / 8, 0]} receiveShadow>
          <cylinderGeometry args={[platformRadius, platformRadius + 0.9, 0.22, 8]} />
          <meshStandardMaterial
            color={isSengoku ? '#d6ccbf' : '#cbd5e1'}
            map={tabletopTexture ?? undefined}
            bumpMap={tabletopTexture ?? undefined}
            bumpScale={0.08}
            roughness={0.82}
            metalness={0.12}
          />
        </mesh>
        <mesh position={[0, 0.114, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[platformRadius - 1.15, platformRadius - 1.0, 48]} />
          <meshBasicMaterial
            color={isSengoku ? '#8a6c44' : '#475569'}
            transparent
            opacity={0.38}
          />
        </mesh>
      </group>

      {/* 2 Slow Counter-Drifting Courtyard Mist Rings */}
      <mesh
        ref={mistLowerRef}
        position={[0, -0.14, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[platformRadius * 3.1, platformRadius * 3.1]} />
        <meshBasicMaterial
          map={mistTexture ?? undefined}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={mistUpperRef}
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[platformRadius * 3.1, platformRadius * 3.1]} />
        <meshBasicMaterial
          map={mistTexture ?? undefined}
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>

      {/* 4 Cardinal Textured 3D Torii Gateways (per-axis clearance) */}
      {cardinalGates.map(([gx, gz], idx) => {
        const rotY = Math.atan2(-gx, -gz);
        return (
          <group key={`outer-gate-${idx}`} position={[gx, 0, gz]} rotation={[0, rotY, 0]}>
            {[-0.66, 0.66].map((px, pIdx) => (
              <mesh key={`plinth-${pIdx}`} position={[px, -0.02, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.56, 0.24, 0.56]} />
                <meshStandardMaterial
                  color={stoneColor}
                  map={wallTexture ?? undefined}
                  bumpMap={wallTexture ?? undefined}
                  bumpScale={0.05}
                  roughness={0.82}
                />
              </mesh>
            ))}

            <mesh position={[0, 1.63, 0]} castShadow>
              <boxGeometry args={[2.35, 0.14, 0.34]} />
              <meshStandardMaterial
                color={capTimberColor}
                map={lacquerTexture ?? undefined}
                bumpMap={lacquerTexture ?? undefined}
                bumpScale={0.04}
                roughness={0.74}
              />
            </mesh>

            <group position={[0, 0.72, 0]} scale={1.38}>
              {toriiGeom ? (
                <mesh geometry={toriiGeom} castShadow receiveShadow>
                  <meshStandardMaterial
                    color={gateColor}
                    map={lacquerTexture ?? undefined}
                    bumpMap={lacquerTexture ?? undefined}
                    bumpScale={0.06}
                    emissive={gateEmissive}
                    emissiveIntensity={0.22}
                    metalness={0.2}
                    roughness={0.62}
                  />
                </mesh>
              ) : (
                <>
                  <mesh position={[-0.48, 0, 0]}>
                    <boxGeometry args={[0.16, 1.0, 0.16]} />
                    <meshStandardMaterial
                      color={gateColor}
                      map={lacquerTexture ?? undefined}
                      roughness={0.62}
                    />
                  </mesh>
                  <mesh position={[0.48, 0, 0]}>
                    <boxGeometry args={[0.16, 1.0, 0.16]} />
                    <meshStandardMaterial
                      color={gateColor}
                      map={lacquerTexture ?? undefined}
                      roughness={0.62}
                    />
                  </mesh>
                  <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[1.3, 0.15, 0.24]} />
                    <meshStandardMaterial
                      color={gateColor}
                      map={lacquerTexture ?? undefined}
                      roughness={0.62}
                    />
                  </mesh>
                </>
              )}
            </group>
          </group>
        );
      })}

      {/* 4 Blazing Diagonal Corner Fire Braziers + Ground Light Pools */}
      <group>
        {diagonalBraziers.map(([bx, bz], idx) => (
          <group key={`brazier-base-${idx}`} position={[bx, 0, bz]}>
            <mesh position={[0, -0.098, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
              <planeGeometry args={[3.4, 3.4]} />
              <meshBasicMaterial
                map={glowPoolTexture ?? undefined}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.3, 0.42, 0.52, 8]} />
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.8}
              />
            </mesh>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.42, 0.28, 0.18, 8]} />
              <meshStandardMaterial color="#1c1917" roughness={0.5} metalness={0.6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Animated Flickering Fire Cones for the 4 Braziers */}
      <group ref={flamesGroupRef}>
        {diagonalBraziers.map(([bx, bz], idx) => (
          <group key={`brazier-flame-${idx}`} position={[bx, 0.54, bz]}>
            <mesh position={[0, 0.22, 0]}>
              <coneGeometry args={[0.28, 0.62, 7]} />
              <meshBasicMaterial color={flameOuterColor} transparent opacity={0.86} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <coneGeometry args={[0.19, 0.5, 7]} />
              <meshBasicMaterial color={flameMidColor} transparent opacity={0.92} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <coneGeometry args={[0.1, 0.34, 6]} />
              <meshBasicMaterial color={flameCoreColor} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 8 True 3D Textured Stone Lanterns flanking Cardinal Gates */}
      {lanternPositions.map(([lx, lz], idx) => (
        <group key={`outer-lantern-${idx}`} position={[lx, 0, lz]}>
          <mesh position={[0, -0.098, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
            <planeGeometry args={[2.6, 2.6]} />
            <meshBasicMaterial
              map={glowPoolTexture ?? undefined}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Stepped stone plinth */}
          <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.62, 0.18, 0.62]} />
            <meshStandardMaterial
              color={stoneColor}
              map={wallTexture ?? undefined}
              bumpMap={wallTexture ?? undefined}
              bumpScale={0.05}
              roughness={0.82}
            />
          </mesh>

          {/* Sculpted stone column / GLB shaft */}
          {lanternGeom ? (
            <mesh position={[0, 0.42, 0]} scale={1.15} geometry={lanternGeom} castShadow>
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.78}
              />
            </mesh>
          ) : (
            <mesh position={[0, 0.36, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.22, 0.58, 8]} />
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                roughness={0.78}
              />
            </mesh>
          )}

          {/* Glowing firebox chamber + dark ink corner struts */}
          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[0.28, 0.32, 0.28]} />
            <meshBasicMaterial color={lanternGlowColor} />
          </mesh>
          {[
            [-0.14, -0.14],
            [0.14, -0.14],
            [-0.14, 0.14],
            [0.14, 0.14],
          ].map(([sx, sz], sIdx) => (
            <mesh key={`strut-${sIdx}`} position={[sx, 0.86, sz]}>
              <boxGeometry args={[0.05, 0.34, 0.05]} />
              <meshStandardMaterial color="#1c1917" roughness={0.75} />
            </mesh>
          ))}

          {/* Pagoda 4-sided stone roof + finial */}
          <mesh position={[0, 1.13, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.48, 0.24, 4]} />
            <meshStandardMaterial
              color={stoneColor}
              map={wallTexture ?? undefined}
              bumpMap={wallTexture ?? undefined}
              bumpScale={0.05}
              roughness={0.82}
            />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={stoneColor} map={wallTexture ?? undefined} roughness={0.78} />
          </mesh>
        </group>
      ))}

      {/* 8 True 3D World-Fixed Sengoku War Banners on Outer Courtyard */}
      <group ref={bannersGroupRef}>
        {BANNER_ANGLES.map((angle, idx) => {
          const wx = Math.cos(angle) * bannerRadius;
          const wz = Math.sin(angle) * bannerRadius;
          const rotY = Math.atan2(-wx, -wz);
          return (
            <group
              key={`war-banner-${idx}`}
              position={[wx, -0.34, wz]}
              rotation={[0, rotY, 0]}
            >
              {/* Crossed timber ground stand */}
              <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.88, 0.1, 0.14]} />
                <meshStandardMaterial
                  color={capTimberColor}
                  map={lacquerTexture ?? undefined}
                  roughness={0.82}
                />
              </mesh>
              <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.14, 0.1, 0.88]} />
                <meshStandardMaterial
                  color={capTimberColor}
                  map={lacquerTexture ?? undefined}
                  roughness={0.82}
                />
              </mesh>
              {/* Bamboo vertical mast & horizontal top rod */}
              <mesh position={[0, 1.12, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.055, 2.25, 8]} />
                <meshStandardMaterial color={bambooColor} roughness={0.76} />
              </mesh>
              <mesh position={[0.42, 2.16, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.032, 0.032, 1.0, 8]} />
                <meshStandardMaterial color={bambooColor} roughness={0.76} />
              </mesh>
              {/* Hanging double-sided cloth strip (child pivot animated by useFrame) */}
              <mesh position={[0.42, 1.28, 0]}>
                <planeGeometry args={[0.92, 1.72]} />
                <meshBasicMaterial
                  map={warBannerTexture ?? undefined}
                  color={warBannerTexture ? '#ffffff' : isSengoku ? '#991b1b' : '#334155'}
                  transparent
                  alphaTest={0.12}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 8 Grounded Weathered Temple Ruin Pillars on Outer Courtyard */}
      {PILLAR_ANGLES.map((angle, idx) => {
        const px = Math.cos(angle) * pillarRadius;
        const pz = Math.sin(angle) * pillarRadius;
        const pillarH = 1.6 + (idx % 3) * 0.45;
        return (
          <group key={`courtyard-pillar-${idx}`} position={[px, -0.34, pz]}>
            <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.72, 0.28, 0.72]} />
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.84}
              />
            </mesh>
            <mesh position={[0, 0.28 + pillarH / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.46, pillarH, 0.46]} />
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.06}
                roughness={0.82}
              />
            </mesh>
            <mesh position={[0, 0.28 + pillarH + 0.08, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.64, 0.16, 0.64]} />
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.84}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
