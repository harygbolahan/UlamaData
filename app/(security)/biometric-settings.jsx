import BiometricSetupModal from '@/components/services/BiometricSetupModal';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { disableBiometric, getSupportedBiometrics, isBiometricAvailable, isBiometricEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function BiometricSettingsScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState('biometric');
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        setLoading(true);
        const available = await isBiometricAvailable();
        const enabled = await isBiometricEnabled();
        setBiometricAvailable(available);
        setBiometricEnabled(enabled);

        if (available) {
            const types = await getSupportedBiometrics();
            if (Platform.OS === 'ios') {
                setBiometricType('FaceID');
            } else {
                setBiometricType('Fingerprint');
            }
        }
        setLoading(false);
    };

    const handleToggleBiometric = async (value) => {
        if (value) {
            // Enable biometric
            setShowSetupModal(true);
        } else {
            // Disable biometric
            Alert.alert(
                'Disable Biometric',
                'Are you sure you want to disable biometric authentication? You will need to enter your PIN for all transactions.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            const result = await disableBiometric();
                            if (result.success) {
                                setBiometricEnabled(false);
                                showToast('success', 'Biometric authentication disabled');
                            } else {
                                showToast('error', 'Failed to disable biometric authentication');
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleSetupSuccess = () => {
        setBiometricEnabled(true);
        showToast('success', 'Biometric authentication enabled successfully!');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Biometric Settings
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {!biometricAvailable ? (
                    <View style={[styles.unavailableCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
                        <Text style={[styles.unavailableTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Biometric Not Available
                        </Text>
                        <Text style={[styles.unavailableText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Your device doesn't support biometric authentication or you haven't set it up yet. Please enable {Platform.OS === 'ios' ? 'FaceID' : 'fingerprint'} in your device settings.
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Secure & Convenient
                                </Text>
                                <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                    Use {biometricType.toLowerCase()} to authorize transactions quickly and securely without entering your PIN every time.
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.settingCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingLabel, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Enable {biometricType}
                                    </Text>
                                    <Text style={[styles.settingDescription, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        {biometricEnabled
                                            ? 'Biometric authentication is active'
                                            : 'Use biometric for transactions'
                                        }
                                    </Text>
                                </View>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={handleToggleBiometric}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor="#fff"
                                    disabled={loading}
                                />
                            </View>
                        </View>


                        <View style={[styles.warningCard, { backgroundColor: '#FF9800' + '15' }]}>
                            <Ionicons name="warning" size={20} color="#FF9800" />
                            <Text style={[styles.warningText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                If you change your transaction PIN, you'll need to set up biometric authentication again.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            <BiometricSetupModal
                visible={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                onSuccess={handleSetupSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    unavailableCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
    },
    unavailableTitle: {
        fontSize: 18,
    },
    unavailableText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        gap: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
    },
    settingCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
    },
    detailsCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    detailText: {
        fontSize: 13,
        flex: 1,
    },
    warningCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
    },
    warningText: {
        flex: 1,
        fontSize: 12,
    },
});
