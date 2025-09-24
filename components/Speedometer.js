import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const MAX_SPEED = 180;

export default function Speedometer({ speed = 0, size = 250 }) {
    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = useSharedValue(circumference);

    // Animate the circle fill based on speed
    React.useEffect(() => {
        const progress = Math.min(speed / MAX_SPEED, 1);
        strokeDashoffset.value = withTiming(circumference * (1 - progress), { duration: 500 });
    }, [speed, circumference]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: strokeDashoffset.value,
    }));

    const speedColor = speed > 100 ? '#FF0000' : '#00FFFF';

    // Placeholder for swipeable odometer
    const onGestureEvent = (event) => {
        // Implement logic to change odometer display based on swipe
    };

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Circle */}
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#333" strokeWidth="15" fill="transparent" />
                {/* Progress Circle */}
                <AnimatedPath
                    d={`M ${size / 2} 20 A ${radius} ${radius} 0 1 1 ${size / 2 - 0.01} 20`}
                    fill="none"
                    stroke={speedColor}
                    strokeWidth="15"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                />
            </Svg>
            <View style={styles.textContainer}>
                <Text style={[styles.speedText, { fontSize: size * 0.25 }]}>{speed}</Text>
                <Text style={[styles.unitText, { fontSize: size * 0.1 }]}>km/h</Text>
            </View>

            {/* Odometer (implement swipe logic here) */}
            <PanGestureHandler onGestureEvent={onGestureEvent}>
                <View style={styles.odometerContainer}>
                    <Text style={styles.odometerText}>ODO: 12345 km</Text>
                </View>
            </PanGestureHandler>
        </View>
    );
}

const styles = StyleSheet.create({
    textContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    speedText: { color: 'white', fontWeight: 'bold' },
    unitText: { color: '#aaa' },
    odometerContainer: { position: 'absolute', bottom: '20%' },
    odometerText: { color: '#fff', fontSize: 16 },
});