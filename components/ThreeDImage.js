import React from 'react';
import { View, Image } from 'react-native';

// Simplified version that works without @react-three/fiber
export default function ThreeDImage({ style, imageSource }) {
  return (
    <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 15 }]}>
      <Image 
        source={imageSource} 
        style={{ 
          width: '90%', 
          height: '90%', 
          resizeMode: 'contain',
        }} 
      />
    </View>
  );
}
