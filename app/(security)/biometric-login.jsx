import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { disableBiometricLogin, disablePinLogin, enableBiometricLogin, enablePinLogin, getSupportedBiometrics, isBiometricAvailable, isBiometricLoginEnabled, isPinLoginEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BiometricLoginScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState('biometric');
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        setLoading(true);
        const available = await isBiometricAvailable();
        const enabled = await isBiometricLoginEnabled();
        const pinLoginEnabled = await isPinLoginEnabled();
        setBiometricAvailable(available);
        setBiometricEnabled(enabled);
        setPinEnabled(pinLoginEnabled);

        if (available) {
            const types = await getSupportedBiometrics();
            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                setBiometricType('Face Recognition');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                setBiometricType('Fingerprint');
            } else {
                setBiometricType('Biometric');
            }
        }
        setLoading(false);
    };

    const handleToggleBiometric = async (value) => {
        if (value) {
            // Enable biometric login - ask for password
            setShowPasswordModal(true);
        } else {
            // Disable biometric login
            Alert.alert(
                'Disable Biometric Login',
                'Are you sure you want to disable biometric login? You will need to enter your password to login.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            const result = await disableBiometricLogin();
                            if (result.success) {
                                setBiometricEnabled(false);
                                showToast('success', 'Biometric login disabled');
                            } else {
                                showToast('error', 'Failed to disable biometric login');
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleTogglePin = async (value) => {
        if (value) {
            // Enable PIN login - ask for PIN
            setShowPinModal(true);
        } else {
            // Disable PIN login
            Alert.alert(
                'Disable PIN Login',
                'Are you sure you want to disable PIN login?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            const result = await disablePinLogin();
                            if (result.success) {
                                setPinEnabled(false);
                                showToast('success', 'PIN login disabled');
                            } else {
                                showToast('error', 'Failed to disable PIN login');
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleEnableBiometric = async () => {
        if (!password.trim()) {
            showToast('error', 'Please enter your password');
            return;
        }

        setProcessing(true);
        try {
            const result = await enableBiometricLogin(user.email, password);
            
            if (result.success) {
                setBiometricEnabled(true);
                setShowPasswordModal(false);
                setPassword('');
                showToast('success', 'Biometric login enabled successfully!');
            } else {
                showToast('error', result.error || 'Failed to enable biometric login');
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to enable biometric login');
        } finally {
            setProcessing(false);
        }
    };

    const handleEnablePin = async () => {
        if (!pin.trim()) {
            showToast('error', 'Please enter your PIN');
            return;
        }

        if (pin.length !== 5) {
            showToast('error', 'PIN must be 5 digits');
            return;
        }

        if (!/^\d+$/.test(pin)) {
            showToast('error', 'PIN must contain only numbers');
            return;
        }

        setProcessing(true);
        try {
            console.log('Calling enablePinLogin with PIN:', pin.length, 'digits');
            
            // Check if function exists
            if (typeof enablePinLogin !== 'function') {
                console.error('enablePinLogin is not a function:', typeof enablePinLogin);
                showToast('error', 'Function not available. Please restart the app.');
                setProcessing(false);
                return;
            }
            
            const result = await enablePinLogin(pin);
            console.log('enablePinLogin result:', result);
            
            if (result.success) {
                setPinEnabled(true);
                setShowPinModal(false);
                setPin('');
                showToast('success', 'PIN login enabled successfully!');
            } else {
                showToast('error', result.error || 'Failed to enable PIN login');
            }
        } catch (error) {
            console.error('Error in handleEnablePin:', error);
            showToast('error', error.message || 'Failed to enable PIN login');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Biometric Login
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
                            Your device doesn't support biometric authentication or you haven't set it up yet. Please enable fingerprint or face recognition in your device settings.
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="finger-print" size={48} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Quick & Secure Login
                                </Text>
                                <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                    Use {biometricType.toLowerCase()} to login quickly without entering your password every time.
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
                                            ? 'Biometric login is active'
                                            : 'Use biometric to login'
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

                        {/* PIN Login Option */}
                        <View style={[styles.settingCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingLabel, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Enable PIN Login
                                    </Text>
                                    <Text style={[styles.settingDescription, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        {pinEnabled 
                                            ? 'PIN login is active'
                                            : 'Use 5-digit PIN to login'
                                        }
                                    </Text>
                                </View>
                                <Switch
                                    value={pinEnabled}
                                    onValueChange={handleTogglePin}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor="#fff"
                                    disabled={loading}
                                />
                            </View>
                        </View>


                        <View style={[styles.warningCard, { backgroundColor: '#FF9800' + '15' }]}>
                            <Ionicons name="warning" size={20} color="#FF9800" />
                            <Text style={[styles.warningText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                If you change your password or transaction PIN, you'll need to set up login authentication again.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Password Modal */}
            <Modal
                visible={showPasswordModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Enable Biometric Login
                        </Text>
                        <Text style={[styles.modalDescription, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Enter your password to securely store your credentials for biometric login.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                Password
                            </Text>
                            <View style={[styles.passwordInput, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                    placeholder="Enter your password"
                                    placeholderTextColor={colors.icon}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!passwordVisible}
                                    autoCapitalize="none"
                                    editable={!processing}
                                />
                                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                                    <Ionicons 
                                        name={passwordVisible ? 'eye-off' : 'eye'} 
                                        size={20} 
                                        color={colors.icon} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setPassword('');
                                }}
                                disabled={processing}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                                onPress={handleEnableBiometric}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={[styles.modalButtonText, { color: '#fff', fontFamily: fonts.inter.semiBold }]}>
                                        Enable
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* PIN Modal */}
            <Modal
                visible={showPinModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Enable PIN Login
                        </Text>
                        <Text style={[styles.modalDescription, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Enter your 5-digit transaction PIN to enable PIN login.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                Transaction PIN
                            </Text>
                            <View style={[styles.passwordInput, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                    placeholder="Enter 5-digit PIN"
                                    placeholderTextColor={colors.icon}
                                    value={pin}
                                    onChangeText={setPin}
                                    secureTextEntry
                                    keyboardType="numeric"
                                    maxLength={5}
                                    editable={!processing}
                                />
                                <Ionicons name="keypad" size={20} color={colors.icon} />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                onPress={() => {
                                    setShowPinModal(false);
                                    setPin('');
                                }}
                                disabled={processing}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                                onPress={handleEnablePin}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={[styles.modalButtonText, { color: '#fff', fontFamily: fonts.inter.semiBold }]}>
                                        Enable
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 8,
    },
    modalDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    passwordInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        // backgroundColor set dynamically
    },
    modalButtonText: {
        fontSize: 16,
    },
});
