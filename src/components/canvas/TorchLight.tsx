import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ThemeId } from '../../engine/types';
import { useGlbGeometry } from './glbRegistry';

interface TorchLightProps {
  position: [number, number, number];
  intensity?: number;
  color?: string;
  glowColor?: string;
  theme?: ThemeId;
  isPaused?: boolean;
}

export const TorchLight: React.FC<TorchLightProps> = ({
  position,
  intensity = 4.2,
  color = '#ff8833',
  glowColor = '#ffb454',
  theme = 'sengoku',
  isPaused = false,
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const lanternGeom = useGlbGeometry('lantern-pedestal');

  useFrame(({ clock }) => {
    if (isPaused || !lightRef.current) return;
    const t = clock.getElapsedTime();
    const flicker =
      Math.sin(t * 7.5 + position[0]) * 0.18 +
      Math.sin(t * 17.3 + position[2]) * 0.1 +
      Math.cos(t * 29.1) * 0.05;
    lightRef.current.intensity = Math.max(2.0, intensity + flicker);
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        distance={16}
        decay={1.1}
      />
      {lanternGeom ? (
        <group scale={1.35}>
          <mesh geometry={lanternGeom}>
            <meshStandardMaterial
              color={theme === 'sengoku' ? '#3f2e21' : '#334155'}
              roughness={0.55}
              metalness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshBasicMaterial color={glowColor} />
          </mesh>
        </group>
      ) : (
        <>
          <group visible={theme === 'sengoku'}>
            {/* Paper lantern (Chochin) cap & base */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.11, 0.12, 0.04, 8]} />
              <meshStandardMaterial color="#1f1714" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.24, 10]} />
              <meshStandardMaterial
                color={glowColor}
                emissive={color}
                emissiveIntensity={1.2}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.11, 0.09, 0.04, 8]} />
              <meshStandardMaterial color="#1f1714" roughness={0.8} />
            </mesh>
          </group>
          <group visible={theme !== 'sengoku'}>
            <mesh position={[0, -0.18, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 0.32, 6]} />
              <meshStandardMaterial color="#2a2d38" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshBasicMaterial color="#ffc466" />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
};
