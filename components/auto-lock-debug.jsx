import { useAutoLock } from '@/contexts/auto-lock-context';
import { useTheme } from '@/contexts/theme-context';
import { isBiometricLoginEnabled, isPinLoginEnabled } from '@/services/biometric';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function AutoLockDebug() {
    const { colors, fonts } = useTheme();
    const { isLocked, lockReason, lock, unlock } = useAutoLock();
    const [debugInfo, setDebugInfo] = useState({});

    const loadDebugInfo = async () => {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const storedEmail = await AsyncStorage.getItem('user_email');
        const pinEnabled = await isPinLoginEnabled();
        const biometricEnabled = await isBiometricLoginEnabled();

        setDebugInfo({
            hasSeenOnboarding,
            storedEmail,
            pinEnabled,
            biometricEnabled,
            shouldLock: (hasSeenOnboarding === 'true' && storedEmail) // Lock if user has logged in before
        });
    };

    useEffect(() => {
        loadDebugInfo();
        const interval = setInterval(loadDebugInfo, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                Auto-Lock Debug
            </Text>
            
            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.icon }]}>Is Locked:</Text>
                <Text style={[styles.value, { color: isLocked ? '#FF3B30' : '#34C759' }]}>
                    {isLocked ? 'YES' : 'NO'}
                </Text>
            </View>

            {lockReason && (
                <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: colors.icon }]}>Lock Reason:</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{lockReason}</Text>
                </View>
            )}

            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.icon }]}>Onboarding Done:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                    {debugInfo.hasSeenOnboarding || 'N/A'}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.icon }]}>Stored Email:</Text>
                <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
                    {debugInfo.storedEmail || 'None'}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.icon }]}>PIN Enabled:</Text>
                <Text style={[styles.value, { color: debugInfo.pinEnabled ? '#34C759' : '#FF3B30' }]}>
                    {debugInfo.pinEnabled ? 'YES' : 'NO'}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.icon }]}>Biometric Enabled:</Text>
                <Text style={[styles.value, { color: debugInfo.biometricEnabled ? '#34C759' : '#FF3B30' }]}>
                    {debugInfo.biometricEnabled ? 'YES' : 'NO'}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.icon }]}>Should Lock:</Text>
                <Text style={[styles.value, { color: debugInfo.shouldLock ? '#34C759' : '#FF3B30' }]}>
                    {debugInfo.shouldLock ? 'YES' : 'NO'}
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF3B30' }]}
                    onPress={() => lock('manual')}
                >
                    <Text style={styles.buttonText}>Lock Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#34C759' }]}
                    onPress={unlock}
                >
                    <Text style={styles.buttonText}>Unlock</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.note, { color: colors.icon }]}>
                Timer: 30s inactivity or 30s background
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 8,
    },
    title: {
        fontSize: 16,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        flex: 1,
    },
    value: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    note: {
        fontSize: 11,
        marginTop: 8,
        textAlign: 'center',
    },
});
