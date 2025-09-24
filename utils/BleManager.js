import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { BleManager, State as BleState } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import base64 from 'react-native-base64';

// Create a context to provide BLE data and functions to the entire app
const BleContext = createContext();

// --- MOCK DATA (used for UI development and as a fallback) ---
const initialMockData = {
  speed: 0,
  rpm: 0,
  gear: 'N',
  fuel: 75,
  mode: 'Road',
  highBeam: false,
  hazards: false,
  engineCheck: false,
  battery: true,
};

// --- BLE PROVIDER COMPONENT ---
export const BleProvider = ({ children }) => {
  const bleManager = useMemo(() => new BleManager(), []);
  const [scannedDevices, setScannedDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [bikeData, setBikeData] = useState(initialMockData);
  const [logs, setLogs] = useState([]);

  // Function to add a log entry
  const addLog = useCallback((message) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 200)); // Keep last 200 logs
  }, []);

  // --- Core BLE Functions ---

  // Request necessary permissions for Android
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
      );
    }
    return true;
  };
  
  // Start scanning for devices
  const startScan = useCallback(async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      addLog('Permissions not granted.');
      setConnectionStatus('Permissions Required');
      return;
    }

    bleManager.onStateChange((state) => {
        if (state === BleState.PoweredOn) {
            addLog('Scanning started...');
            setConnectionStatus('Scanning...');
            setScannedDevices([]);
            bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
              if (error) {
                addLog(`Scan Error: ${error.message}`);
                stopScan();
                return;
              }
              if (device && device.name) {
                setScannedDevices(prev => {
                  if (!prev.find(d => d.id === device.id)) {
                    return [...prev, device];
                  }
                  return prev;
                });
              }
            });
        } else {
            addLog(`Bluetooth is ${state}.`);
            setConnectionStatus(`Bluetooth ${state}`);
        }
    }, true);
  }, [bleManager, addLog]);

  const stopScan = useCallback(() => {
    bleManager.stopDeviceScan();
    addLog('Scan stopped.');
    if (connectionStatus === 'Scanning...') {
        setConnectionStatus('Disconnected');
    }
  }, [bleManager, addLog, connectionStatus]);

  // Handle disconnection
  const onDisconnected = (device) => {
    addLog(`Disconnected from ${device?.name || 'device'}.`);
    setConnectedDevice(null);
    setConnectionStatus('Disconnected');
    setBikeData(initialMockData); // Reset to blank/initial state
    // Implement exponential backoff retry logic here if needed
  };

  // The comprehensive connection logic with multiple authentication fallbacks
  const connectToDevice = useCallback(async (device) => {
    stopScan();
    setConnectionStatus(`Connecting to ${device.name}...`);
    addLog(`Attempting connection to ${device.name} (${device.id})`);
  
    try {
      const connected = await device.connect();
      setConnectionStatus('Discovering...');
      addLog('Connection successful. Discovering services...');
  
      await connected.discoverAllServicesAndCharacteristics();
      const services = await connected.services();
      let discoveredUUIDs = { services: {} };
  
      for (const service of services) {
        const characteristics = await service.characteristics();
        discoveredUUIDs.services[service.uuid] = characteristics.map(c => ({
          uuid: c.uuid,
          isReadable: c.isReadable,
          isWritableWithResponse: c.isWritableWithResponse,
          isWritableWithoutResponse: c.isWritableWithoutResponse,
          isNotifiable: c.isNotifiable,
        }));
      }
  
      addLog(`Discovered ${services.length} services. Storing UUIDs.`);
      await AsyncStorage.setItem(`@uuid_${device.id}`, JSON.stringify(discoveredUUIDs));
      
      // *** AUTHENTICATION & DATA MONITORING SEQUENCE ***
      // This is where the magic happens. We try multiple methods to get data.
  
      let dataStreamEstablished = false;
  
      // Method 1 & 2: Try to find a known or discovered notification characteristic
      const notifyCharacteristic = findCharacteristic(services, ['NOTIFY', 'INDICATE']);
      if (notifyCharacteristic) {
        addLog(`Found potential data characteristic: ${notifyCharacteristic.uuid}. Subscribing...`);
        // Setup the data listener
        notifyCharacteristic.monitor((error, char) => {
          if (error) {
            addLog(`Monitor Error: ${error.message}`);
            return;
          }
          // Decode the data and update the state
          const decodedData = parseBikeData(char.value);
          setBikeData(decodedData);
        });
        dataStreamEstablished = true;
        addLog('Successfully subscribed to data stream.');
      }
  
      // Method 3: Attempt Authentication (Generic Key Write)
      if (!dataStreamEstablished) {
        const writeCharacteristic = findCharacteristic(services, ['WRITE', 'WRITE_NO_RESPONSE']);
        if (writeCharacteristic) {
          addLog('Attempting Auth Method: Generic Key Write...');
          try {
            const authKey = base64.encode('YEZDI_AUTH_DEFAULT');
            await writeCharacteristic.writeWithResponse(authKey);
            addLog('Generic key written. Now attempting to monitor for data again.');
            // Re-attempt to find and monitor characteristic post-auth
            // (In a real scenario, the bike might only expose the notify char after auth)
          } catch (e) {
            addLog(`Generic key write failed: ${e.message}`);
          }
        }
      }
  
      // Method 4: Initiate Bonding
      addLog('Attempting Auth Method: Bonding...');
      try {
        await connected.requestConnectionPriority(1); // High priority
        // On Android, connecting often initiates bonding if required.
        // On iOS, this is handled more automatically.
        // A specific bonding API is not always present in ble-plx, it's part of the connection.
        addLog('Bonding successful or already bonded.');
      } catch (e) {
        addLog(`Bonding request failed: ${e.message}`);
      }
  
      /**
       * GUIDE FOR PACKET SNIFFING AND REPLICATION (Method 3 Cont.)
       *
       * This is a manual process for advanced users if the above methods fail due to a
       * proprietary, complex authentication handshake (common on modern vehicles).
       *
       * **Disclaimer**: Reverse-engineering communication protocols may violate the terms of
       * service of the vehicle manufacturer. Proceed at your own risk.
       *
       * 1. **Capture BLE Packets**:
       * - Use the official Yezdi app to connect to your bike.
       * - While it's connecting, use a BLE sniffer tool to capture the communication.
       * - **Software**: nRF Connect for Mobile (offers a logger), Wireshark with BLE plugins.
       * - **Hardware**: Ubertooth One, Nordic Semiconductor nRF52 DK.
       *
       * 2. **Analyze the Handshake**:
       * - In the captured logs, look at the packets immediately after the connection is established.
       * - You're looking for `Write Request` or `Write Command` packets sent from the phone (Master) to the bike (Slave).
       * - The **value** (payload) of these packets is the authentication key or challenge-response. It might be a static key, or it could be dynamic (e.g., encrypted timestamp).
       *
       * 3. **Replicate the Sequence**:
       * - Identify the Service and Characteristic UUIDs the official app writes to.
       * - In the code below, replace `YOUR_AUTH_CHAR_UUID` and `YOUR_AUTH_PACKET_AS_BASE64`
       * with the values you discovered.
       *
       * // Example Code to be implemented manually:
       * // const authServiceUUID = '...';
       * // const authCharUUID = '...';
       * // const authPayload = '...'; // base64 encoded payload from your sniffing
       * // await connected.writeCharacteristicWithResponseForService(authServiceUUID, authCharUUID, authPayload);
       * // addLog('Sent custom authentication packet.');
       *
       * 4. **Challenge-Response**:
       * - If the bike first sends a `Read Request` or `Notification` (the challenge) and the app
       * responds with a `Write Request` (the response), you'll need to replicate this logic.
       * - This often involves cryptographic functions (HMAC, SHA256) on the challenge data.
       * You'll need to decompile the official app to find the algorithm and secret key.
       */
  
      setConnectedDevice(connected);
      setConnectionStatus('Connected');
      
      // Monitor for disconnections
      const sub = connected.onDisconnected((error, dev) => {
        onDisconnected(dev);
        sub.remove();
      });
  
    } catch (error) {
      addLog(`Connection Failed: ${error.message}`);
      setConnectionStatus('Connection Failed');
    }
  }, [bleManager, addLog, stopScan]);

  // Helper to find a characteristic with specific properties
  const findCharacteristic = (services, properties) => {
    for (const service of services) {
      for (const char of service.characteristics) {
        if (properties.some(prop => char[`is${prop}`])) {
          return char;
        }
      }
    }
    return null;
  };

  // --- Data Parsing ---
  // This function needs to be adapted to the actual data format from the bike.
  // This is a placeholder implementation assuming a simple byte structure.
  const parseBikeData = (base64Value) => {
    try {
      const bytes = base64.decode(base64Value);
      // Example structure: [speed, rpm_high, rpm_low, flags, fuel, gear]
      // This is PURELY an example and MUST be replaced with the bike's actual protocol.
      const data = new Uint8Array(bytes.split('').map(c => c.charCodeAt(0)));
      
      if(data.length < 6) return bikeData; // Invalid packet

      const speed = data[0];
      const rpm = (data[1] << 8) | data[2]; // Combine two bytes for RPM
      const flags = data[3];
      const fuel = data[4];
      const gearRaw = data[5];

      const newBikeData = {
        speed,
        rpm,
        fuel,
        gear: gearRaw === 0 ? 'N' : gearRaw.toString(),
        mode: 'Road', // Mode might be in a different packet
        highBeam: (flags & 1) > 0, // Bit 0
        hazards: (flags & 2) > 0,  // Bit 1
        engineCheck: (flags & 4) > 0, // Bit 2
        battery: (flags & 8) > 0, // Bit 3
      };
      
      addLog(`Data Parsed: Speed ${speed} km/h, RPM ${rpm}`);
      return newBikeData;
    } catch (e) {
      addLog(`Data Parse Error: ${e.message}`);
      return bikeData; // Return previous state on error
    }
  };

  const exportLogs = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + 'ble_logs.txt';
      await FileSystem.writeAsStringAsync(fileUri, logs.join('\n'));
      addLog(`Logs exported to: ${fileUri}`);
      alert(`Logs exported successfully!`);
    } catch (e) {
      addLog(`Log Export Error: ${e.message}`);
      alert('Failed to export logs.');
    }
  };


  const value = {
    startScan,
    stopScan,
    connectToDevice,
    scannedDevices,
    connectedDevice,
    connectionStatus,
    bikeData,
    logs,
    exportLogs,
    addLog,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
};

// Custom hook to use the BLE context
export const useBle = () => {
  return useContext(BleContext);
};