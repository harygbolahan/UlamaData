import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocalAuthentication } from 'expo-local-authentication';


/**
 * TransactionPinModal - A modal component for entering transaction PIN
 * 
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onConfirm - Callback when PIN is entered (should return false if PIN is invalid)
 * @param {function} onError - Optional callback when PIN validation fails
 * @param {boolean} enableBiometric - Enable biometric authentication option (default: true)
 * 
 * Features:
 * - Animated PIN dots with scale effect
 * - Error state with shake animation
 * - Larger touch targets (80x80) for better UX
 * - Forgot PIN link
 * - Disabled backspace when no PIN entered
 * - Auto-reset on modal close
 * - Biometric authentication option
 */
export default function TransactionPinModal({ visible, onClose, onConfirm, onError, enableBiometric = true }) {
    const { colors, fonts, isDark } = useTheme();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

    useEffect(() => {
        if (pin.length === 5) {
            setTimeout(async () => {
                const isValid = await onConfirm(pin);
                if (isValid === false && onError) {
                    shake();
                } else if (isValid !== false) {
                    setPin('');
                    setError(false);
                }
            }, 200);
        }
    }, [pin]);

    useEffect(() => {
        if (!visible) {
            setPin('');
            setError(false);
        }
    }, [visible]);

    useEffect(() => {
        const checkBiometric = async () => {
            if (enableBiometric) {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                setBiometricAvailable(hasHardware && isEnrolled);
            }
        };
        checkBiometric();
    }, [enableBiometric]);

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to complete transaction',
                fallbackLabel: 'Use PIN',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
            });

            if (result.success) {
                // Biometric successful, close modal and trigger success
                onClose();
                // You might want to handle this differently based on your flow
            }
        } catch (error) {
            console.error('Biometric error:', error);
        }
    };

    const handlePinPress = (num) => {
        if (pin.length < 5) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);
            
            // Animate the dot
            const index = pin.length;
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
        }
    };

    const handlePinDelete = () => {
        if (pin.length > 0) {
            setPin(pin.slice(0, -1));
            setError(false);
        }
    };

    const shake = () => {
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start(() => {
            setTimeout(() => {
                setError(false);
                setPin('');
            }, 500);
        });
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

                    <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Enter Transaction PIN
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {error ? 'Incorrect PIN. Please try again' : 'Please enter your 5-digit PIN to continue'}
                    </Text>

                    {/* PIN Display */}
                    <Animated.View style={[styles.pinDisplay, { transform: [{ translateX: shakeAnim }] }]}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.pinDot,
                                    { 
                                        backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                                        borderWidth: 2,
                                        borderColor: error ? colors.error : (isDark ? '#2a2a2a' : '#e0e0e0')
                                    },
                                    pin.length > i && { 
                                        backgroundColor: error ? colors.error : colors.primary,
                                        borderColor: error ? colors.error : colors.primary
                                    },
                                    { transform: [{ scale: scaleAnims[i] }] }
                                ]}
                            />
                        ))}
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
                                disabled={pin.length === 0}
                            >
                                <Ionicons 
                                    name="backspace-outline" 
                                    size={24} 
                                    color={pin.length === 0 ? colors.icon + '40' : colors.icon} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.bottomActions}>
                        {biometricAvailable && (
                            <TouchableOpacity 
                                style={styles.biometricAction}
                                onPress={handleBiometricAuth}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="finger-print" size={20} color={colors.primary} />
                                <Text style={[styles.biometricText, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                    Use Biometric
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={styles.forgotPin}
                            onPress={() => {
                                onClose();
                                router.push('/(security)/change-pin');
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.forgotPinText, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                Forgot PIN?
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    modalTitle: {
        fontSize: 20,
        marginBottom: 6,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 24,
        minHeight: 18,
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
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    biometricAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    biometricText: {
        fontSize: 14,
    },
    forgotPin: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    forgotPinText: {
        fontSize: 14,
    },
});
