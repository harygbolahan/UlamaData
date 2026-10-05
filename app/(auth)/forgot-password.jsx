import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const RESEND_COOLDOWN_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 8;

export default function ForgotPasswordScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState('email'); // 'email' -> 'reset'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const requestCode = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showToast('warning', 'Please enter your email address');
            return;
        }
        if (submitting) return;

        setSubmitting(true);
        try {
            await api.forgotPassword(trimmedEmail);
            setEmail(trimmedEmail);
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setStep('reset');
            showToast('success', 'A verification code has been sent to your email');
        } catch (error) {
            if (error.status === 429) setCooldown(RESEND_COOLDOWN_SECONDS);
            showToast('error', error.message || 'Could not send the code. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const resendCode = async () => {
        if (cooldown > 0 || submitting) return;
        await requestCode();
    };

    const handleReset = async () => {
        if (code.trim().length < 4) {
            showToast('warning', 'Enter the code sent to your email');
            return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            showToast('warning', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }
        if (password !== confirmPassword) {
            showToast('warning', 'Passwords do not match');
            return;
        }
        if (submitting) return;

        setSubmitting(true);
        try {
            await api.resetPassword({
                email,
                code: code.trim(),
                password,
                passwordConfirmation: confirmPassword,
            });
            showToast('success', 'Password updated. Please log in with your new password.');
            router.replace('/(auth)/login');
        } catch (error) {
            showToast('error', error.message || 'Could not reset your password. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputWrapperStyle = {
        backgroundColor: isDark ? colors.card : colors.background,
        borderColor: colors.border,
    };

    const renderButton = (label, onPress) => (
        <Pressable style={styles.actionButton} onPress={onPress} disabled={submitting}>
            <LinearGradient
                colors={[colors.primary, colors.primary + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradientButton, submitting && { opacity: 0.7 }]}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={[styles.buttonText, { fontFamily: fonts.inter.bold }]}>{label}</Text>
                )}
            </LinearGradient>
        </Pressable>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        {/* Header */}
                        <Pressable
                            style={styles.backButton}
                            onPress={() => (step === 'reset' ? setStep('email') : router.back())}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </Pressable>
                        <View style={styles.header}>
                            <View style={[styles.iconWrapper, {
                                backgroundColor: colors.primary + '15'
                            }]}>
                                <Ionicons
                                    name={step === 'reset' ? 'shield-checkmark' : 'lock-closed'}
                                    size={isSmallScreen ? 32 : 40}
                                    color={colors.primary}
                                />
                            </View>
                            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {step === 'reset' ? 'Reset Password' : 'Forgot Password?'}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {step === 'reset'
                                    ? `Enter the code we sent to ${email} and choose a new password`
                                    : 'Enter your email and we will send you a verification code'}
                            </Text>
                        </View>

                        {step === 'email' ? (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        Email Address
                                    </Text>
                                    <View style={[styles.inputWrapper, inputWrapperStyle]}>
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
                                            onSubmitEditing={requestCode}
                                        />
                                    </View>
                                </View>

                                {renderButton('Send Code', requestCode)}
                            </View>
                        ) : (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        Verification Code
                                    </Text>
                                    <View style={[styles.inputWrapper, inputWrapperStyle]}>
                                        <Ionicons name="keypad-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, styles.codeInput, { color: colors.text, fontFamily: fonts.inter.semiBold }]}
                                            placeholder="123456"
                                            placeholderTextColor={colors.icon + '80'}
                                            value={code}
                                            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            textContentType="oneTimeCode"
                                            autoComplete="sms-otp"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        New Password
                                    </Text>
                                    <View style={[styles.inputWrapper, inputWrapperStyle]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                            placeholder="At least 8 characters"
                                            placeholderTextColor={colors.icon + '80'}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                                            <Ionicons
                                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={colors.icon}
                                            />
                                        </Pressable>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        Confirm Password
                                    </Text>
                                    <View style={[styles.inputWrapper, inputWrapperStyle]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                            placeholder="Re-enter new password"
                                            placeholderTextColor={colors.icon + '80'}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            onSubmitEditing={handleReset}
                                        />
                                    </View>
                                </View>

                                {renderButton('Reset Password', handleReset)}

                                <Pressable
                                    style={styles.resendButton}
                                    onPress={resendCode}
                                    disabled={cooldown > 0 || submitting}
                                >
                                    <Text style={[
                                        styles.resendText,
                                        { color: cooldown > 0 ? colors.icon : colors.primary, fontFamily: fonts.inter.semiBold },
                                    ]}>
                                        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive the code? Resend"}
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: isSmallScreen ? 32 : 40,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        padding: 8,
        zIndex: 10,
        marginTop: isSmallScreen ? 20 : 40,
        marginLeft: isSmallScreen ? 5 : 10,
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
        paddingHorizontal: 20,
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: isSmallScreen ? 20 : 24,
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
    codeInput: {
        letterSpacing: 6,
        fontSize: isSmallScreen ? 16 : 18,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: isSmallScreen ? 15 : 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: isSmallScreen ? 15 : 16,
        paddingHorizontal: 20
    },
    resendButton: {
        marginTop: isSmallScreen ? 12 : 16,
        paddingVertical: 12,
    },
    resendText: {
        fontSize: isSmallScreen ? 13 : 14,
        textAlign: 'center',
    },
});
