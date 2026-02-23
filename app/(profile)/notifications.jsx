import { useNotification } from '@/contexts/notification-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function NotificationsScreen() {
    const { colors, fonts, isDark } = useTheme();
    const {
        expoPushToken,
        isRegistering,
        isSyncing,
        error,
        isSynced,
        registerForNotifications,
        syncTokenWithBackend
    } = useNotification();

    const notificationSettings = [
        { id: '1', title: 'Transaction Alerts', description: 'Get notified of all transactions', value: true },
        { id: '2', title: 'Promotional Offers', description: 'Receive special offers and deals', value: true },
        { id: '3', title: 'Payment Reminders', description: 'Reminders for scheduled payments', value: false },
        { id: '4', title: 'Security Alerts', description: 'Important security notifications', value: true },
    ];

    const copyToClipboard = async () => {
        if (expoPushToken) {
            await Clipboard.setStringAsync(expoPushToken);
            Alert.alert('Success', 'Push token copied to clipboard');
        }
    };

    const handleSyncToken = async () => {
        const success = await syncTokenWithBackend();
        if (success) {
            Alert.alert('Success', 'Push token registered with backend successfully');
        } else {
            Alert.alert('Error', 'Failed to register push token. Please try again later.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Notifications
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status section */}
                <View style={[styles.statusCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.statusTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Push Notification Status
                    </Text>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={[styles.statusText, { color: colors.error }]}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                onPress={registerForNotifications}
                            >
                                <Text style={styles.retryText}>Retry Setup</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text style={[styles.statusText, { color: colors.success }]}>
                                {expoPushToken ? '✅ Token Registered' : '⏳ Registering...'}
                            </Text>
                            {expoPushToken && (
                                <View style={styles.syncSection}>
                                    <View style={styles.statusItem}>
                                        <Text style={[styles.statusLabel, { color: colors.text }]}>
                                            Backend Sync: {isSynced ? '✅ Synced' : '⏳ Pending'}
                                        </Text>
                                    </View>
                                    {!isSynced && (
                                        <TouchableOpacity
                                            style={[styles.syncButton, { backgroundColor: colors.primary }]}
                                            onPress={handleSyncToken}
                                            disabled={isSyncing}
                                        >
                                            {isSyncing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                                                    <Text style={styles.syncButtonText}>Sync to Backend</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            {expoPushToken && (
                                <TouchableOpacity onPress={copyToClipboard} style={styles.tokenContainer}>
                                    <Text numberOfLines={1} style={[styles.tokenText, { color: colors.icon }]}>
                                        Token: {expoPushToken}
                                    </Text>
                                    <Ionicons name="copy-outline" size={16} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* {notificationSettings.map((setting) => (
                    <View
                        key={setting.id}
                        style={[styles.settingCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {setting.title}
                            </Text>
                            <Text style={[styles.settingDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {setting.description}
                            </Text>
                        </View>
                        <Switch
                            value={setting.value}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                ))} */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * scale,
        paddingTop: 50 * scale,
        marginBottom: 20 * scale,
    },
    headerTitle: { fontSize: 18 * scale },
    settingCard: {
        marginHorizontal: 20 * scale,
        padding: 16 * scale,
        borderRadius: 12 * scale,
        marginBottom: 12 * scale,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusCard: {
        marginHorizontal: 20 * scale,
        padding: 16 * scale,
        borderRadius: 12 * scale,
        marginBottom: 20 * scale,
    },
    statusTitle: {
        fontSize: 16 * scale,
        marginBottom: 8 * scale,
    },
    statusText: {
        fontSize: 14 * scale,
        marginBottom: 8 * scale,
    },
    statusItem: {
        marginBottom: 12 * scale,
    },
    statusLabel: {
        fontSize: 13 * scale,
        opacity: 0.8,
    },
    errorContainer: {
        gap: 12 * scale,
    },
    retryButton: {
        paddingVertical: 8 * scale,
        paddingHorizontal: 16 * scale,
        borderRadius: 8 * scale,
        alignSelf: 'flex-start',
    },
    retryText: {
        color: '#fff',
        fontSize: 13 * scale,
        fontWeight: '600',
    },
    tokenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * scale,
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 8 * scale,
        borderRadius: 6 * scale,
    },
    tokenText: {
        fontSize: 12 * scale,
        flex: 1,
    },
    syncSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 12 * scale,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6 * scale,
        paddingHorizontal: 12 * scale,
        borderRadius: 8 * scale,
        gap: 6 * scale,
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 13 * scale,
        fontWeight: '600',
    },
    settingInfo: {
        flex: 1,
        marginRight: 12 * scale,
    },
    settingTitle: {
        fontSize: 14 * scale,
        marginBottom: 4 * scale,
    },
    settingDesc: {
        fontSize: 12 * scale,
    },
});
