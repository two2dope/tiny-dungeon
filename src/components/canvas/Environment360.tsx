import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ThemeId } from '../../engine/types';
import {
  getCourtyardFadeTexture,
  getCourtyardGroundTexture,
  getEmberBedTexture,
  getGlowPoolTexture,
  getLacquerWoodTexture,
  getMistRingTexture,
  getPanoramaTexture,
  getStylizedFlameTexture,
  getTabletopMatTexture,
  getWallTexture,
  getWarBannerClothTexture,
} from './proceduralTextures';
import { getMapBiome } from './mapBiomes';
import { useGlbGeometry } from './glbRegistry';

interface Environment360Props {
  theme: ThemeId;
  mapId?: number;
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
const FLAME_ANGLES = [0, Math.PI / 3, (Math.PI * 2) / 3] as const;

export const Environment360: React.FC<Environment360Props> = ({
  theme,
  mapId = 1,
  tileSize,
  cols = 4,
  rows = 4,
  isPaused = false,
}) => {
  const mistLowerRef = useRef<THREE.Mesh>(null);
  const mistUpperRef = useRef<THREE.Mesh>(null);
  const flamesGroupRef = useRef<THREE.Group>(null);
  const sparksGroupRef = useRef<THREE.Group>(null);
  const glowPoolsRef = useRef<THREE.Group>(null);
  const bannersGroupRef = useRef<THREE.Group>(null);

  const biome = getMapBiome(theme, mapId);

  const panoramaTexture = useMemo(() => getPanoramaTexture(theme, mapId), [theme, mapId]);
  const tabletopTexture = useMemo(() => getTabletopMatTexture(theme, mapId), [theme, mapId]);
  const courtyardGroundTexture = useMemo(
    () => getCourtyardGroundTexture(theme, mapId),
    [theme, mapId]
  );
  const courtyardFadeTexture = useMemo(
    () => getCourtyardFadeTexture(theme, mapId),
    [theme, mapId]
  );
  const lacquerTexture = useMemo(() => getLacquerWoodTexture(theme, mapId), [theme, mapId]);
  const wallTexture = useMemo(() => getWallTexture(theme, mapId), [theme, mapId]);
  const mistTexture = useMemo(() => getMistRingTexture(theme, mapId), [theme, mapId]);
  const glowPoolTexture = useMemo(() => getGlowPoolTexture(theme, mapId), [theme, mapId]);
  const warBannerTexture = useMemo(
    () => getWarBannerClothTexture(theme, mapId),
    [theme, mapId]
  );
  const flameTexture = useMemo(
    () => getStylizedFlameTexture(biome.flameOuter, biome.flameMid, biome.flameCore),
    [biome.flameOuter, biome.flameMid, biome.flameCore]
  );
  const emberBedTexture = useMemo(
    () => getEmberBedTexture(biome.flameOuter, biome.flameCore),
    [biome.flameOuter, biome.flameCore]
  );

  const toriiGeom = useGlbGeometry('torii-gate');
  const lanternGeom = useGlbGeometry('lantern-pedestal');

  const isSengoku = theme === 'sengoku';
  const centerX = ((cols - 1) / 2) * tileSize;
  const centerZ = ((rows - 1) / 2) * tileSize;

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
      flamesGroupRef.current.children.forEach((brazierFlame, idx) => {
        const flickerY =
          0.92 + Math.sin(t * 7.2 + idx * 1.9) * 0.12 + Math.cos(t * 11.4 + idx) * 0.06;
        const flickerW = 0.96 + Math.cos(t * 6.4 + idx * 1.3) * 0.07;
        brazierFlame.scale.set(flickerW, flickerY, flickerW);
        brazierFlame.rotation.z = Math.sin(t * 4.5 + idx) * 0.05;
      });
    }

    if (glowPoolsRef.current) {
      glowPoolsRef.current.children.forEach((pool, idx) => {
        const pulse = 1 + Math.sin(t * 5.8 + idx * 1.7) * 0.07;
        pool.scale.set(pulse, pulse, 1);
      });
    }

    if (sparksGroupRef.current) {
      sparksGroupRef.current.children.forEach((brazierSparks, bIdx) => {
        brazierSparks.children.forEach((spark, sIdx) => {
          const cycle = (t * 0.58 + bIdx * 0.27 + sIdx * 0.25) % 1;
          const angle = t * 1.8 + sIdx * ((Math.PI * 2) / 4) + bIdx;
          const radius = 0.12 + cycle * 0.22;
          spark.position.set(
            Math.cos(angle) * radius,
            cycle * 1.05,
            Math.sin(angle) * radius
          );
          const s = Math.max(0.05, (1 - cycle) * 1.1);
          spark.scale.setScalar(s);
        });
      });
    }

    if (bannersGroupRef.current) {
      bannersGroupRef.current.children.forEach((bannerCloth, idx) => {
        bannerCloth.rotation.x = Math.sin(t * 1.55 + idx * 0.95) * 0.055;
      });
    }
  });

  const gateColor = biome.gateColor;
  const gateEmissive = biome.gateEmissive;
  const stoneColor = biome.stoneColor;
  const capTimberColor = biome.capTimberColor;
  const bambooColor = biome.bambooColor;
  const flameOuterColor = biome.flameOuter;
  const flameCoreColor = biome.flameCore;
  const lanternGlowColor = biome.lanternGlow;

  return (
    <group position={[centerX, 0, centerZ]}>
      {/* 360 Panoramic Horizon Sky Dome */}
      <mesh renderOrder={-10}>
        <sphereGeometry args={[Math.max(48, groundRadius + 8), 48, 32]} />
        <meshBasicMaterial
          map={panoramaTexture ?? undefined}
          color={panoramaTexture ? '#ffffff' : biome.clearColor}
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
          roughness={biome.motif === 'water' ? 0.56 : 0.88}
          metalness={biome.motif === 'water' ? 0.18 : 0.08}
          color={isSengoku ? '#d4cec8' : '#94a3b8'}
        />
      </mesh>

      {/* Smooth Radial Edge Fade blending Courtyard into Twilight Horizon */}
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[groundRadius + 0.2, 64]} />
        <meshBasicMaterial
          map={courtyardFadeTexture ?? undefined}
          transparent
          depthWrite={false}
          color={courtyardFadeTexture ? '#ffffff' : biome.clearColor}
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
            color={`rgb(${biome.daisCrestRgb})`}
            transparent
            opacity={0.42}
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
          opacity={0.44}
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
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>

      {/* 4 Cardinal Textured 3D Torii Gateways */}
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
                    emissiveIntensity={0.24}
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

      {/* Pulsing Textured Firelight Pools beneath the 4 Braziers */}
      <group ref={glowPoolsRef}>
        {diagonalBraziers.map(([bx, bz], idx) => (
          <mesh
            key={`brazier-glow-${idx}`}
            position={[bx, -0.098, bz]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={3}
          >
            <planeGeometry args={[3.9, 3.9]} />
            <meshBasicMaterial
              map={glowPoolTexture ?? undefined}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* 4 Sculpted Iron Cauldron Tripod Braziers + Glowing Ember Bed */}
      <group>
        {diagonalBraziers.map(([bx, bz], idx) => (
          <group key={`brazier-base-${idx}`} position={[bx, 0, bz]}>
            {/* Carved Octagonal Stone Pedestal */}
            <mesh position={[0, -0.04, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.46, 0.54, 0.16, 8]} />
              <meshStandardMaterial
                color={stoneColor}
                map={wallTexture ?? undefined}
                bumpMap={wallTexture ?? undefined}
                bumpScale={0.05}
                roughness={0.82}
              />
            </mesh>

            {/* 3 Forged-Iron Tripod Legs */}
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, lIdx) => (
              <mesh
                key={`leg-${lIdx}`}
                position={[Math.cos(ang) * 0.26, 0.18, Math.sin(ang) * 0.26]}
                rotation={[Math.sin(ang) * 0.25, 0, -Math.cos(ang) * 0.25]}
                castShadow
              >
                <cylinderGeometry args={[0.045, 0.065, 0.36, 8]} />
                <meshStandardMaterial color="#1e1b18" metalness={0.68} roughness={0.42} />
              </mesh>
            ))}

            {/* Hammered-Iron Cauldron Bowl */}
            <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.45, 0.24, 0.24, 12]} />
              <meshStandardMaterial color="#1f1b1a" metalness={0.65} roughness={0.44} />
            </mesh>

            {/* Burnished Brass Cauldron Collar Ring */}
            <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.44, 0.032, 8, 18]} />
              <meshStandardMaterial color="#92400e" metalness={0.7} roughness={0.34} />
            </mesh>

            {/* Glowing Charcoal & Magma Ember Bed Inside Bowl */}
            <mesh position={[0, 0.485, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.4, 16]} />
              {emberBedTexture ? (
                <meshBasicMaterial map={emberBedTexture} />
              ) : (
                <meshBasicMaterial color={flameOuterColor} />
              )}
            </mesh>
          </group>
        ))}
      </group>

      {/* Painterly Crossed-Quad Flickering Flame Sprites (zero triangle cones) */}
      <group ref={flamesGroupRef}>
        {diagonalBraziers.map(([bx, bz], idx) => (
          <group key={`brazier-flame-${idx}`} position={[bx, 0.48, bz]}>
            {FLAME_ANGLES.map((ang, fIdx) => (
              <mesh
                key={`flame-plane-${fIdx}`}
                position={[0, 0.44, 0]}
                rotation={[0, ang, 0]}
              >
                <planeGeometry args={[0.84, 0.98]} />
                {flameTexture ? (
                  <meshBasicMaterial
                    map={flameTexture}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                  />
                ) : (
                  <meshBasicMaterial
                    color={flameOuterColor}
                    transparent
                    opacity={0.72}
                    side={THREE.DoubleSide}
                  />
                )}
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Rising Orbiting Ember Sparks above the 4 Braziers */}
      <group ref={sparksGroupRef}>
        {diagonalBraziers.map(([bx, bz], bIdx) => (
          <group key={`brazier-sparks-${bIdx}`} position={[bx, 0.56, bz]}>
            {Array.from({ length: 4 }).map((_, sIdx) => (
              <mesh key={`spark-${sIdx}`}>
                <octahedronGeometry args={[0.042, 0]} />
                <meshBasicMaterial color={flameCoreColor} />
              </mesh>
            ))}
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
              <mesh position={[0, 1.12, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.055, 2.25, 8]} />
                <meshStandardMaterial color={bambooColor} roughness={0.76} />
              </mesh>
              <mesh position={[0.42, 2.16, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.032, 0.032, 1.0, 8]} />
                <meshStandardMaterial color={bambooColor} roughness={0.76} />
              </mesh>
              <mesh position={[0.42, 1.28, 0]}>
                <planeGeometry args={[0.92, 1.72]} />
                <meshBasicMaterial
                  map={warBannerTexture ?? undefined}
                  color={warBannerTexture ? '#ffffff' : biome.bannerRight}
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
