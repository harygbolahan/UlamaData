import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { authenticateForLogin, isBiometricLoginEnabled, isPinLoginEnabled, verifyPinForLogin } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SplashScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { isAuthenticated, isLoading, login } = useAuth();
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;
    const [biometricChecking, setBiometricChecking] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(async () => {
            await handleNavigation();
        }, 3000);

        return () => clearTimeout(timer);
    }, [isAuthenticated, isLoading]);

    const handleNavigation = async () => {
        try {
            // Check if user has seen onboarding
            const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
            
            if (hasSeenOnboarding !== 'true') {
                // First time user - show onboarding
                router.replace('/(onboarding)');
                return;
            }

            // Check if PIN login is enabled FIRST
            const pinLoginEnabled = await isPinLoginEnabled();
            
            if (pinLoginEnabled) {
                // PIN is enabled - show PIN modal
                setShowPinModal(true);
                return;
            }

            // Check if biometric login is enabled
            const biometricEnabled = await isBiometricLoginEnabled();
            
            if (biometricEnabled) {
                // Biometric is enabled - require authentication regardless of stored token
                setBiometricChecking(true);
                const result = await authenticateForLogin();
                
                if (result.success && result.email && result.password) {
                    // Authenticate with stored credentials
                    const loginResult = await login({
                        email: result.email,
                        password: result.password,
                    }, true); // Skip toast
                    
                    if (loginResult.success) {
                        router.replace('/(tabs)/home');
                        return;
                    }
                }
                
                // If biometric fails or user cancels, logout and go to login
                setBiometricChecking(false);
                router.replace('/(auth)/login');
                return;
            }

            // No biometric or PIN - check if user is already authenticated
            if (isAuthenticated) {
                // User is already logged in - go to home
                router.replace('/(tabs)/home');
                return;
            }
            
            // Default: go to login screen
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Navigation error:', error);
            router.replace('/(auth)/login');
        }
    };

    const handlePinPress = (num) => {
        if (pin.length < 5) {
            const newPin = pin + num;
            setPin(newPin);
            setPinError('');
            
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

            // Auto-submit when 5 digits entered
            if (newPin.length === 5) {
                setTimeout(() => handlePinSubmit(newPin), 200);
            }
        }
    };

    const handlePinDelete = () => {
        if (pin.length > 0) {
            setPin(pin.slice(0, -1));
            setPinError('');
        }
    };

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start(() => {
            setTimeout(() => {
                setPinError('');
                setPin('');
            }, 500);
        });
    };

    const handlePinSubmit = async (pinToVerify) => {
        setPinError('');
        setBiometricChecking(true);

        const result = await verifyPinForLogin(pinToVerify);
        
        if (result.success) {
            // PIN verified - check if we have stored credentials
            const biometricEnabled = await isBiometricLoginEnabled();
            
            if (biometricEnabled) {
                // Get stored credentials (without biometric prompt)
                const SecureStore = require('expo-secure-store');
                const email = await SecureStore.getItemAsync('biometric_email');
                const password = await SecureStore.getItemAsync('biometric_password');
                
                if (email && password) {
                    const loginResult = await login({
                        email,
                        password,
                    }, true);
                    
                    if (loginResult.success) {
                        setShowPinModal(false);
                        setPin('');
                        router.replace('/(tabs)/home');
                        return;
                    }
                }
            }
            
            // If no credentials stored, just go to home if already authenticated
            if (isAuthenticated) {
                setShowPinModal(false);
                setPin('');
                router.replace('/(tabs)/home');
                return;
            }
        }
        
        setBiometricChecking(false);
        setPinError(result.error || 'Incorrect PIN');
        shake();
    };

    const handleSkipPin = () => {
        setShowPinModal(false);
        setPin('');
        setPinError('');
        router.replace('/(auth)/login');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.logoCircle}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </Animated.View>
            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                <Text style={[styles.title, { fontFamily: fonts.inter.bold }]}>
                    DataBeta
                </Text>
                <Text style={[styles.subtitle, { fontFamily: fonts.inter.regular }]}>
                    Fast & Secure VTU Services
                </Text>
                {biometricChecking && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={[styles.loadingText, { fontFamily: fonts.inter.regular }]}>
                            Authenticating...
                        </Text>
                    </View>
                )}
            </Animated.View>

            {/* PIN Modal */}
            <Modal
                visible={showPinModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={handleSkipPin}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3a3a3a' : '#d0d0d0' }]} />

                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Enter PIN to Login
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: pinError ? '#FF3B30' : colors.icon, fontFamily: fonts.inter.regular }]}>
                            {pinError || 'Enter your 5-digit PIN to continue'}
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
                                            borderColor: pinError ? '#FF3B30' : (isDark ? '#2a2a2a' : '#e0e0e0')
                                        },
                                        pin.length > i && { 
                                            backgroundColor: pinError ? '#FF3B30' : colors.primary,
                                            borderColor: pinError ? '#FF3B30' : colors.primary
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
                                        disabled={biometricChecking}
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
                                        disabled={biometricChecking}
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
                                        disabled={biometricChecking}
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
                                    disabled={biometricChecking}
                                >
                                    <Text style={[styles.numberText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        0
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.numberButton}
                                    onPress={handlePinDelete}
                                    activeOpacity={0.7}
                                    disabled={pin.length === 0 || biometricChecking}
                                >
                                    <Ionicons 
                                        name="backspace-outline" 
                                        size={24} 
                                        color={pin.length === 0 ? colors.icon + '40' : colors.icon} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkipPin}
                            disabled={biometricChecking}
                        >
                            <Text style={[styles.skipButtonText, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                Use Password Instead
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    loadingContainer: {
        marginTop: 24,
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    skipButton: {
        paddingVertical: 12,
        alignSelf: 'center',
    },
    skipButtonText: {
        fontSize: 14,
    },
});
