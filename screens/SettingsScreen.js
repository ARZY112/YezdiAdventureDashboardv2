import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBle } from '../utils/BleManager';

export default function SettingsScreen() {
    const { exportLogs } = useBle();
    const [isBlinkEnabled, setIsBlinkEnabled] = useState(true);
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [accentColor, setAccentColor] = useState('#00FFFF');
    
    // Debug state
    const [customServiceUUID, setCustomServiceUUID] = useState('');
    const [customCharUUID, setCustomCharUUID] = useState('');
    const [customAuthKey, setCustomAuthKey] = useState('');

    const handleSaveDebug = () => {
        Alert.alert("Debug Info Saved", "Custom UUIDs and key have been saved for the next connection attempt.");
        // Here you would save these values to AsyncStorage and the BleManager would read them
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Settings</Text>

                <View style={styles.settingItem}>
                    <Text style={styles.label}>120km/h Warning Blink</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isBlinkEnabled ? "#00FFFF" : "#f4f3f4"}
                        onValueChange={() => setIsBlinkEnabled(prev => !prev)}
                        value={isBlinkEnabled}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.label}>Accent Color</Text>
                    <View style={styles.colorInputContainer}>
                        <TextInput
                            style={styles.colorInput}
                            value={accentColor}
                            onChangeText={setAccentColor}
                            placeholder="#00FFFF"
                            placeholderTextColor="#666"
                        />
                        <View style={[styles.colorPreview, { backgroundColor: accentColor }]}/>
                    </View>
                </View>

                <Text style={styles.sectionHeader}>Navigation</Text>
                <View style={styles.settingItem}>
                    <Text style={styles.label}>Map Display Mode</Text>
                    {/* Add a picker or segmented control here for Normal, Directions, Off */}
                </View>

                <Text style={styles.sectionHeader}>Connectivity & Debug</Text>
                 <View style={styles.settingItem}>
                    <Text style={styles.label}>Debug Mode</Text>
                    <Switch
                        onValueChange={() => setIsDebugMode(prev => !prev)}
                        value={isDebugMode}
                    />
                </View>

                {isDebugMode && (
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugTitle}>Manual BLE Configuration</Text>
                        <TextInput style={styles.input} placeholder="Service UUID" placeholderTextColor="#666" value={customServiceUUID} onChangeText={setCustomServiceUUID} />
                        <TextInput style={styles.input} placeholder="Characteristic UUID" placeholderTextColor="#666" value={customCharUUID} onChangeText={setCustomCharUUID} />
                        <TextInput style={styles.input} placeholder="Authentication Key (Base64)" placeholderTextColor="#666" value={customAuthKey} onChangeText={setCustomAuthKey} />
                        <TouchableOpacity style={styles.button} onPress={handleSaveDebug}>
                            <Text style={styles.buttonText}>Save & Apply</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={exportLogs}>
                    <Text style={styles.buttonText}>Export BLE Logs</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { padding: 20 },
    header: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
    sectionHeader: { color: '#888', fontSize: 18, marginTop: 30, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
    label: { color: '#fff', fontSize: 16 },
    colorInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 5 },
    colorInput: { color: '#fff', padding: 10 },
    colorPreview: { width: 30, height: 30, marginLeft: 10, borderRadius: 5, borderWidth: 1, borderColor: '#555' },
    debugContainer: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginTop: 10 },
    debugTitle: { color: '#00FFFF', fontSize: 16, marginBottom: 10 },
    input: { backgroundColor: '#111', color: '#fff', padding: 12, borderRadius: 5, marginVertical: 5, borderWidth: 1, borderColor: '#333' },
    button: { backgroundColor: '#00FFFF', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#000', fontWeight: 'bold' },
});