import { useAuth } from '@/contexts/auth-context';
import { useAutoLock } from '@/contexts/auto-lock-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { authenticateForLogin, isBiometricLoginEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export default function LoginScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { login } = useAuth();
    const { unlock } = useAutoLock();
    const { showToast } = useToast();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    // Check biometric availability when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            checkBiometric();
        }, [])
    );

    const checkBiometric = async () => {
        try {
            const enabled = await isBiometricLoginEnabled();
            setBiometricAvailable(enabled);
        } catch (error) {
            console.error('Error checking biometric:', error);
            setBiometricAvailable(false);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            setIsSubmitting(true);
            const result = await authenticateForLogin();

            if (result.success && result.email && result.password) {
                // Use stored credentials to login via API
                const loginResult = await login({
                    email: result.email,
                    password: result.password
                }, true); // Skip toast for biometric login

                if (loginResult.success) {
                    unlock(); // Unlock the app
                    router.replace('/(tabs)/home');
                } else {
                    showToast('error', loginResult.message || 'Login failed');
                }
            } else if (result.cancelled) {
                // User cancelled, do nothing
            } else if (result.useFallback) {
                // User chose to use password instead
                showToast('info', 'Please login with your password');
            } else {
                showToast('error', result.error || 'Biometric authentication failed');
            }
        } catch (error) {
            console.error('Biometric auth error:', error);
            showToast('error', 'Biometric authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('warning', 'Please fill in all fields');
            return;
        }
        setIsSubmitting(true);
        const result = await login({ email, password });
        setIsSubmitting(false);

        if (result.success) {
            unlock(); // Unlock the app
            router.replace('/(tabs)/home');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={true}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="wallet" size={isSmallScreen ? 32 : 40} color={colors.primary} />
                            </View>
                            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Welcome Back
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Login to continue to UlamaData
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    Email Address
                                </Text>
                                <View style={[styles.inputWrapper, {
                                    backgroundColor: isDark ? colors.card : colors.background,
                                    borderColor: colors.border,
                                }]}>
                                    <Ionicons name="mail-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                        placeholder="Enter your email"
                                        placeholderTextColor={colors.icon + '80'}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    Password
                                </Text>
                                <View style={[styles.inputWrapper, {
                                    backgroundColor: isDark ? colors.card : colors.background,
                                    borderColor: colors.border,
                                }]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                        placeholder="Enter your password"
                                        placeholderTextColor={colors.icon + '80'}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color={colors.icon}
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Forgot Password */}
                            <Pressable
                                style={styles.forgotPassword}
                                onPress={() => router.push('/(auth)/forgot-password')}
                            >
                                <Text style={[styles.forgotText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                    Forgot Password?
                                </Text>
                            </Pressable>

                            {/* Login Button */}
                            <Pressable
                                style={[styles.loginButton, { opacity: isSubmitting ? 0.7 : 1 }]}
                                onPress={handleLogin}
                                disabled={isSubmitting}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primary + 'DD']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={[styles.buttonText, { fontFamily: fonts.inter.bold }]}>
                                            Sign In
                                        </Text>
                                    )}
                                </LinearGradient>
                            </Pressable>

                            {/* Biometric */}
                            {biometricAvailable && (
                                <>
                                    <View style={styles.divider}>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                        <Text style={[styles.dividerText, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                            or continue with
                                        </Text>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                    </View>

                                    <Pressable
                                        style={[styles.biometricButton, {
                                            backgroundColor: isDark ? colors.card : colors.background,
                                            borderColor: colors.border,
                                        }]}
                                        onPress={handleBiometricLogin}
                                    >
                                        <Ionicons name={Platform.OS === 'ios' ? 'scan' : 'finger-print'} size={24} color={colors.primary} />
                                        <Text style={[styles.biometricText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            Use {Platform.OS === 'ios' ? 'FaceID' : 'Fingerprint'}
                                        </Text>
                                    </Pressable>
                                </>
                            )}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Don't have an account?{' '}
                            </Text>
                            <Pressable onPress={() => router.push('/(auth)/signup')}>
                                <Text style={[styles.footerLink, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                    Sign Up
                                </Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}



const styles = {
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: isSmallScreen ? 32 : 40,
    },
    iconWrapper: {
        width: isSmallScreen ? 70 : 80,
        height: isSmallScreen ? 70 : 80,
        borderRadius: isSmallScreen ? 20 : 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: isSmallScreen ? 16 : 20,
    },
    title: {
        fontSize: isSmallScreen ? 26 : 32,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: isSmallScreen ? 14 : 16,
        textAlign: 'center',
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: isSmallScreen ? 16 : 20,
    },
    label: {
        fontSize: isSmallScreen ? 13 : 14,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: isSmallScreen ? 50 : 54,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: isSmallScreen ? 14 : 15,
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: isSmallScreen ? 20 : 24,
        paddingVertical: 4,
    },
    forgotText: {
        fontSize: isSmallScreen ? 13 : 14,
    },
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: isSmallScreen ? 16 : 20,
    },
    gradientButton: {
        paddingVertical: isSmallScreen ? 15 : 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: isSmallScreen ? 15 : 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: isSmallScreen ? 16 : 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: isSmallScreen ? 12 : 13,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: isSmallScreen ? 14 : 16,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 10,
    },
    biometricText: {
        fontSize: isSmallScreen ? 14 : 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        flexWrap: 'wrap',
    },
    footerText: {
        fontSize: isSmallScreen ? 13 : 14,
    },
    footerLink: {
        fontSize: isSmallScreen ? 13 : 14,
    },
};
