import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useBle } from '../utils/BleManager';
import Speedometer from '../components/Speedometer';
import ThreeDImage from '../components/ThreeDImage';
import MapView, { Marker } from 'react-native-maps'; // Assuming settings will provide location data

// Placeholder assets
const YezdiLogoFaded = require('../assets/yezdi_logo_faded.png');
const YezdiBikeImage = require('../assets/yezdi_bike_image.png');
const YezdiBikeIcon = require('../assets/yezdi_bike_icon.png');


const Indicator = ({ label, active, size }) => (
    <View style={{ alignItems: 'center', marginHorizontal: size * 0.1 }}>
        <Text style={[styles.indicatorText, { fontSize: size * 0.2, color: active ? '#00FFFF' : '#444' }]}>{label}</Text>
    </View>
);

export default function DashboardScreen() {
    const { width, height } = useWindowDimensions();
    const { bikeData, connectionStatus } = useBle();
    const [currentTime, setCurrentTime] = useState('');
    const [leftPanelVisible, setLeftPanelVisible] = useState(false);
    
    // For now, these are static. They would come from settings context.
    const [navMode, setNavMode] = useState('off'); // 'normal', 'directions', 'off'
    const [musicPlaying, setMusicPlaying] = useState(true); // This would come from expo-av

    const isConnected = connectionStatus === 'Connected';
    const isLandscape = width > height;
    const baseSize = Math.min(width, height) / 10;

    // Red blink animation for high speed warning
    const blinkValue = useSharedValue(0);
    useEffect(() => {
        if (isConnected && bikeData.speed >= 120) {
            blinkValue.value = withRepeat(
                withTiming(1, { duration: 700, easing: Easing.ease }),
                -1,
                true
            );
        } else {
            blinkValue.value = withTiming(0, { duration: 700 });
        }
    }, [bikeData.speed, isConnected]);

    const blinkOverlayStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: `rgba(255, 0, 0, ${blinkValue.value * 0.2})`,
        };
    });

    // Left panel animation
    const panelAnimation = useSharedValue(0);
    const toggleLeftPanel = () => {
        setLeftPanelVisible(!leftPanelVisible);
        panelAnimation.value = withTiming(leftPanelVisible ? 0 : 1, { duration: 300 });
    };
    const panelStyle = useAnimatedStyle(() => ({
        transform: [{ scale: panelAnimation.value }],
        opacity: panelAnimation.value,
    }));


    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const renderRightPanel = () => {
        const panelStyles = {
            width: isLandscape ? '30%' : '100%',
            height: isLandscape ? '80%' : '30%',
            marginTop: isLandscape ? 0 : 10,
        };

        if (navMode === 'off') {
            return <ThreeDImage style={panelStyles} imageSource={YezdiBikeImage} />;
        }
        
        // Placeholder for map view
        return (
            <View style={[styles.mapContainer, panelStyles]}>
                <MapView
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                        latitude: 26.1445, // Guwahati
                        longitude: 91.7362,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    customMapStyle={mapStyle} // Dark map style
                >
                    <Marker coordinate={{ latitude: 26.1445, longitude: 91.7362 }} />
                </MapView>
                <View style={styles.mapFadeEffect} />
            </View>
        );
    };

    const mainContainerStyle = useMemo(() => ({
        flex: 1,
        flexDirection: isLandscape ? 'row' : 'column',
        padding: baseSize * 0.2,
    }), [isLandscape, baseSize]);

    const centralDashStyle = useMemo(() => ({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: baseSize * 0.2,
    }), [baseSize]);
    
    return (
        <ImageBackground source={YezdiLogoFaded} style={styles.background} imageStyle={styles.backgroundImage}>
            <SafeAreaView style={styles.container}>
                <Animated.View style={[StyleSheet.absoluteFill, blinkOverlayStyle, { zIndex: 99 }]} pointerEvents="none" />
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={toggleLeftPanel} style={styles.menuButton}>
                         <Image source={YezdiBikeIcon} style={{width: 40, height: 40, tintColor: '#fff'}}/>
                    </TouchableOpacity>
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{currentTime}</Text>
                        <Text style={styles.connectionText} style={{color: isConnected ? '#0f0' : '#f00'}}>
                            {connectionStatus}
                        </Text>
                    </View>
                </View>

                {/* Left Side Panel (Animated) */}
                <Animated.View style={[styles.leftPanel, panelStyle]}>
                    <TouchableOpacity style={styles.panelButton}><Ionicons name="bluetooth" size={baseSize*0.6} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.panelButton}><Ionicons name="settings" size={baseSize*0.6} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.panelButton}><Image source={YezdiBikeIcon} style={{width: baseSize*0.6, height: baseSize*0.6, tintColor: '#fff'}} /></TouchableOpacity>
                </Animated.View>


                <View style={mainContainerStyle}>
                    {/* Center-Left Section */}
                    <View style={centralDashStyle}>
                        <Speedometer speed={isConnected ? bikeData.speed : 0} size={baseSize * 4} />
                        <Text style={styles.gearText}>{isConnected ? bikeData.gear : 'N'}</Text>
                        <Text style={styles.modeText}>{isConnected ? bikeData.mode : '--'}</Text>
                    </View>

                    {/* Center & Right Section */}
                    <View style={{ flex: 1, justifyContent: 'space-between', paddingLeft: isLandscape ? 20 : 0 }}>
                        <View>
                            {/* RPM and Fuel */}
                            <View style={styles.barContainer}>
                                <Text style={styles.barLabel}>RPM</Text>
                                <View style={styles.barBackground}>
                                    <View style={[styles.barFill, { width: `${isConnected ? (bikeData.rpm / 160) * 100 : 0}%` }]} />
                                </View>
                            </View>
                            <View style={styles.barContainer}>
                                <Text style={styles.barLabel}>FUEL</Text>
                                <View style={styles.barBackground}>
                                    <View style={[styles.barFill, { width: `${isConnected ? bikeData.fuel : 0}%` }]} />
                                </View>
                            </View>
                            
                            {/* Indicators */}
                            <View style={styles.indicatorsContainer}>
                                <Indicator label="HI-BEAM" active={isConnected && bikeData.highBeam} size={baseSize} />
                                <Indicator label="HAZARD" active={isConnected && bikeData.hazards} size={baseSize} />
                                <Indicator label="CHECK" active={isConnected && bikeData.engineCheck} size={baseSize} />
                                <Indicator label="BATT" active={isConnected && bikeData.battery} size={baseSize} />
                            </View>
                        </View>
                        
                        {renderRightPanel()}

                        {musicPlaying && (
                            <View style={styles.musicContainer}>
                                <View style={styles.musicFadeLeft} />
                                <View style={styles.musicInfo}>
                                    <Text style={styles.songTitle}>Solar Sailer</Text>
                                    <Text style={styles.songArtist}>Daft Punk</Text>
                                </View>
                                <View style={styles.musicControls}>
                                    <Ionicons name="play-skip-back" size={baseSize*0.5} color="#fff" />
                                    <Ionicons name="play" size={baseSize*0.5} color="#fff" style={{ marginHorizontal: 15 }} />
                                    <Ionicons name="play-skip-forward" size={baseSize*0.5} color="#fff" />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#000' },
    backgroundImage: { resizeMode: 'contain', opacity: 0.05 },
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    menuButton: { padding: 10 },
    timeContainer: { alignItems: 'flex-end' },
    timeText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    connectionText: { fontSize: 14 },
    leftPanel: { position: 'absolute', top: 80, left: 15, backgroundColor: 'rgba(20,20,20,0.8)', borderRadius: 10, padding: 10, zIndex: 10 },
    panelButton: { padding: 10, marginVertical: 5 },
    gearText: { color: '#fff', fontSize: 60, fontWeight: '800', position: 'absolute', bottom: '25%' },
    modeText: { color: '#00FFFF', fontSize: 18, position: 'absolute', bottom: '15%' },
    barContainer: { marginVertical: 5, width: '100%' },
    barLabel: { color: '#888', fontSize: 12, marginBottom: 3 },
    barBackground: { height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#00FFFF', borderRadius: 5 },
    indicatorsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    indicatorText: { fontWeight: 'bold' },
    mapContainer: {
        borderRadius: 15,
        overflow: 'hidden',
        borderColor: '#333',
        borderWidth: 1,
        position: 'relative',
    },
    mapFadeEffect: { // To create faded corners
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 15,
        borderWidth: 20,
        borderColor: 'rgba(0,0,0,1)', // Fades to black background
    },
    musicContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(10,10,10,0.5)',
        borderRadius: 10,
    },
    musicFadeLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 100,
    },
    musicInfo: { flex: 1 },
    songTitle: { color: '#fff', fontWeight: 'bold' },
    songArtist: { color: '#ccc', fontSize: 12 },
    musicControls: { flexDirection: 'row' },
});

// Custom map style for dark mode
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];