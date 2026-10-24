import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TorchLightProps {
  position: [number, number, number];
  intensity?: number;
  color?: string;
}

export const TorchLight: React.FC<TorchLightProps> = ({
  position,
  intensity = 2.5,
  color = '#ff8833',
}) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      // Natural organic flicker
      const flicker =
        Math.sin(t * 8) * 0.15 +
        Math.sin(t * 19) * 0.1 +
        Math.cos(t * 31) * 0.05;
      lightRef.current.intensity = Math.max(0.5, intensity + flicker);
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        distance={9}
        decay={2}
        castShadow
        shadow-bias={-0.002}
      />
      {/* Tiny glowing flame core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffc466" />
      </mesh>
    </group>
  );
};
