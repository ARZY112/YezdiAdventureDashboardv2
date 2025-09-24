import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber/native';
import { TextureLoader } from 'three';
import { View } from 'react-native';

function BikeModel({ imageSource }) {
  const texture = useLoader(TextureLoader, imageSource);
  return (
    <mesh rotation={[0.2, -0.3, 0.1]}>
      <planeGeometry args={[4, 3]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

export default function ThreeDImage({ style, imageSource }) {
  return (
    <View style={style}>
        <Canvas>
          <ambientLight intensity={Math.PI} />
          <Suspense fallback={null}>
              <BikeModel imageSource={imageSource} />
          </Suspense>
        </Canvas>
    </View>
  );
}