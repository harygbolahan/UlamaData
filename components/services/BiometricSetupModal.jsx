import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { enableBiometric, getSupportedBiometrics } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BiometricSetupModal({ visible, onClose, onSuccess }) {
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN, 3: Success
    const [error, setError] = useState('');
    const [biometricType, setBiometricType] = useState('biometric');
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

    useEffect(() => {
        if (visible) {
            checkBiometricType();
            resetModal();
        }
    }, [visible]);

    const checkBiometricType = async () => {
        const types = await getSupportedBiometrics();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
        } else {
            setBiometricType('biometric');
        }
    };

    const resetModal = () => {
        setPin('');
        setConfirmPin('');
        setStep(1);
        setError('');
    };

    const handlePinPress = (num) => {
        const currentPin = step === 1 ? pin : confirmPin;
        if (currentPin.length < 5) {
            const newPin = currentPin + num;
            if (step === 1) {
                setPin(newPin);
            } else {
                setConfirmPin(newPin);
            }
            setError('');
            
            // Animate the dot
            const index = currentPin.length;
            Animated.sequence([
                Animated.timing(scaleAnims[index], {
                    toValue: 1.3,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnims[index], {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();

            // Auto-proceed when PIN is complete
            if (newPin.length === 5) {
                setTimeout(() => {
                    if (step === 1) {
                        setStep(2);
                    } else {
                        handleConfirmPin(newPin);
                    }
                }, 300);
            }
        }
    };

    const handlePinDelete = () => {
        if (step === 1 && pin.length > 0) {
            setPin(pin.slice(0, -1));
            setError('');
        } else if (step === 2 && confirmPin.length > 0) {
            setConfirmPin(confirmPin.slice(0, -1));
            setError('');
        }
    };

    const handleConfirmPin = async (confirmedPin) => {
        if (pin !== confirmedPin) {
            shake();
            setError('PINs do not match');
            setTimeout(() => {
                setConfirmPin('');
                setError('');
            }, 1000);
            return;
        }

        // Enable biometric with the PIN
        const result = await enableBiometric(pin);
        if (result.success) {
            setStep(3);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 2000);
        } else {
            showToast('error', result.error || 'Failed to enable biometric authentication');
            onClose();
        }
    };

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const getBiometricIcon = () => {
        switch (biometricType) {
            case 'face':
                return 'scan';
            case 'fingerprint':
                return 'finger-print';
            default:
                return 'shield-checkmark';
        }
    };

    const getBiometricText = () => {
        switch (biometricType) {
            case 'face':
                return 'Face Recognition';
            case 'fingerprint':
                return 'Fingerprint';
            default:
                return 'Biometric';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3a3a3a' : '#d0d0d0' }]} />

                    {step === 3 ? (
                        <View style={styles.successContainer}>
                            <View style={[styles.successIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
                            </View>
                            <Text style={[styles.successTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Biometric Enabled!
                            </Text>
                            <Text style={[styles.successText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                You can now use {getBiometricText().toLowerCase()} for transactions
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name={getBiometricIcon()} size={48} color={colors.primary} />
                            </View>

                            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {step === 1 ? 'Set Up Biometric' : 'Confirm Your PIN'}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {step === 1 
                                    ? 'Enter your 5-digit transaction PIN to enable biometric authentication'
                                    : 'Re-enter your PIN to confirm'
                                }
                            </Text>

                            {error && (
                                <Text style={[styles.errorText, { color: colors.error, fontFamily: fonts.inter.medium }]}>
                                    {error}
                                </Text>
                            )}

                            {/* PIN Display */}
                            <Animated.View style={[styles.pinDisplay, { transform: [{ translateX: shakeAnim }] }]}>
                                {[0, 1, 2, 3, 4].map((i) => {
                                    const currentPin = step === 1 ? pin : confirmPin;
                                    return (
                                        <Animated.View
                                            key={i}
                                            style={[
                                                styles.pinDot,
                                                { 
                                                    backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                                                    borderWidth: 2,
                                                    borderColor: error ? colors.error : (isDark ? '#2a2a2a' : '#e0e0e0')
                                                },
                                                currentPin.length > i && { 
                                                    backgroundColor: error ? colors.error : colors.primary,
                                                    borderColor: error ? colors.error : colors.primary
                                                },
                                                { transform: [{ scale: scaleAnims[i] }] }
                                            ]}
                                        />
                                    );
                                })}
                            </Animated.View>

                            {/* Number Pad */}
                            <View style={styles.numberPad}>
                                <View style={styles.numberRow}>
                                    {[1, 2, 3].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[styles.numberButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                            onPress={() => handlePinPress(num.toString())}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.numberText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.numberRow}>
                                    {[4, 5, 6].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[styles.numberButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                            onPress={() => handlePinPress(num.toString())}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.numberText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.numberRow}>
                                    {[7, 8, 9].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[styles.numberButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                            onPress={() => handlePinPress(num.toString())}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.numberText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.numberRow}>
                                    <View style={styles.numberButton} />
                                    <TouchableOpacity
                                        style={[styles.numberButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                        onPress={() => handlePinPress('0')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.numberText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            0
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.numberButton}
                                        onPress={handlePinDelete}
                                        activeOpacity={0.7}
                                        disabled={(step === 1 ? pin : confirmPin).length === 0}
                                    >
                                        <Ionicons 
                                            name="backspace-outline" 
                                            size={24} 
                                            color={(step === 1 ? pin : confirmPin).length === 0 ? colors.icon + '40' : colors.icon} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
    },
    modalHandle: {
        width: 48,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 6,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 8,
    },
    pinDisplay: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginHorizontal: 6,
    },
    numberPad: {
        alignItems: 'center',
        marginBottom: 12,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    numberButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    numberText: {
        fontSize: 24,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 22,
        marginBottom: 8,
    },
    successText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
