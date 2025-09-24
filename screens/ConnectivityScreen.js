import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBle } from '../utils/BleManager';

export default function ConnectivityScreen() {
    const { startScan, stopScan, connectToDevice, scannedDevices, connectionStatus, logs } = useBle();

    useEffect(() => {
        startScan();
        return () => stopScan();
    }, []);

    const renderDeviceItem = ({ item }) => {
        const isYezdi = item.name?.toLowerCase().includes('yezdi');
        return (
            <TouchableOpacity 
                style={[styles.deviceItem, isYezdi && styles.yezdiDevice]}
                onPress={() => connectToDevice(item)}
            >
                <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Available Devices</Text>
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{connectionStatus}</Text>
                    {connectionStatus === 'Scanning...' && <ActivityIndicator color="#00FFFF" />}
                </View>
            </View>

            <FlatList
                data={scannedDevices}
                renderItem={renderDeviceItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            
            <View style={styles.logContainer}>
                <Text style={styles.logHeader}>Live Logs</Text>
                <ScrollView nestedScrollEnabled>
                    {logs.map((log, index) => (
                        <Text key={index} style={styles.logText}>{log}</Text>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    statusText: { color: '#00FFFF', marginRight: 10 },
    deviceItem: { backgroundColor: '#1a1a1a', padding: 15, marginHorizontal: 20, marginVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
    yezdiDevice: { borderColor: '#00FFFF', borderWidth: 2 },
    deviceName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    deviceId: { color: '#888', fontSize: 12 },
    logContainer: { flex: 0.5, backgroundColor: '#111', padding: 15, borderTopWidth: 1, borderTopColor: '#333' },
    logHeader: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    logText: { color: '#aaa', fontSize: 10, fontFamily: 'monospace', marginBottom: 3 },
});