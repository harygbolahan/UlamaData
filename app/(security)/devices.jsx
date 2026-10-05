import { useTheme } from '@/contexts/theme-context';
import api from '@/services/api';
import { getDeviceSignature } from '@/services/device';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getDeviceIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('ipad') || lower.includes('tablet')) return 'tablet-portrait';
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) return 'phone-portrait';
    return 'laptop';
};

// "2024-05-12 12:00:00" -> "12 May 2024, 12:00 PM"; falls back to the raw value
const formatLastUsed = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(String(value).replace(' ', 'T'));
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export default function DevicesScreen() {
    const { colors, fonts, isDark } = useTheme();
    const [devices, setDevices] = useState([]);
    const [primaryDevice, setPrimaryDevice] = useState(null);
    const [currentSignature, setCurrentSignature] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadDevices = useCallback(async () => {
        setError(null);
        try {
            const [response, signature] = await Promise.all([
                api.getSecuritySettings(),
                getDeviceSignature(),
            ]);
            const data = response?.data || response;
            setDevices(Array.isArray(data?.devices) ? data.devices : []);
            setPrimaryDevice(data?.user_device || null);
            setCurrentSignature(signature);
        } catch (err) {
            setError(err.message || 'Could not load your devices');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDevices();
    };

    const cardBg = isDark ? '#1f1f1f' : '#f5f5f5';

    const renderBadge = (label, color) => (
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color, fontFamily: fonts.inter.semiBold }]}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    My Devices
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
                    <Text style={[styles.message, { color: colors.text, fontFamily: fonts.inter.medium }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={() => { setLoading(true); loadDevices(); }}
                    >
                        <Text style={[styles.retryText, { fontFamily: fonts.inter.semiBold }]}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                >
                    <Text style={[styles.intro, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        These devices have signed in to your account. If you do not recognise one, change your password.
                    </Text>

                    {devices.length === 0 ? (
                        <View style={styles.center}>
                            <Ionicons name="phone-portrait-outline" size={48} color={colors.icon} />
                            <Text style={[styles.message, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                No devices registered yet
                            </Text>
                        </View>
                    ) : (
                        devices.map((device) => {
                            const isCurrent = !!currentSignature && device.id === currentSignature;
                            const isPrimary = !!primaryDevice && device.id === primaryDevice;
                            return (
                                <View key={device.id} style={[styles.card, { backgroundColor: cardBg }]}>
                                    <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name={getDeviceIcon(device.name)} size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.deviceName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            {device.name || 'Unknown device'}
                                        </Text>
                                        <Text style={[styles.meta, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Last used: {formatLastUsed(device.last_used)}
                                        </Text>
                                        {!!device.ip && (
                                            <Text style={[styles.meta, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                IP: {device.ip}
                                            </Text>
                                        )}
                                        {(isCurrent || isPrimary) && (
                                            <View style={styles.badges}>
                                                {isCurrent && renderBadge('This device', colors.success || '#4CAF50')}
                                                {isPrimary && renderBadge('Primary', colors.primary)}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    message: { fontSize: 15, marginTop: 12, textAlign: 'center' },
    retryButton: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
    retryText: { color: '#fff', fontSize: 14 },
    list: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
    intro: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: { flex: 1 },
    deviceName: { fontSize: 14, marginBottom: 4 },
    meta: { fontSize: 12, marginTop: 1 },
    badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11 },
});
