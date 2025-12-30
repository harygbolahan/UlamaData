import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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

export default function ForgotPasswordScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleResetPassword = () => {
        if (!email) {
            showToast('warning', 'Please enter your email address');
            return;
        }
        setEmailSent(true);
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    };

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
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={24} color={colors.text} />
                            </Pressable>
                        <View style={styles.header}>
                            
                            <View style={[styles.iconWrapper, { 
                                backgroundColor: emailSent ? colors.success + '15' : colors.primary + '15' 
                            }]}>
                                <Ionicons 
                                    name={emailSent ? 'checkmark-circle' : 'lock-closed'} 
                                    size={isSmallScreen ? 32 : 40} 
                                    color={emailSent ? colors.success : colors.primary} 
                                />
                            </View>
                            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {emailSent ? 'Check Your Email' : 'Forgot Password?'}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {emailSent
                                    ? 'We sent a password reset link to your email'
                                    : 'Enter your email to receive a reset link'}
                            </Text>
                        </View>

                        {/* Content */}
                        {!emailSent ? (
                            <View style={styles.form}>
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

                                <Pressable style={styles.actionButton} onPress={handleResetPassword}>
                                    <LinearGradient
                                        colors={[colors.primary, colors.primary + 'DD']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={[styles.buttonText, { fontFamily: fonts.inter.bold }]}>
                                            Send Reset Link
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        ) : (
                            <Animated.View style={[styles.successContent, { transform: [{ scale: scaleAnim }] }]}>
                                <View style={[styles.successCard, {
                                    backgroundColor: isDark ? colors.card : colors.background,
                                    borderColor: colors.success + '30',
                                }]}>
                                    <Ionicons name="mail" size={isSmallScreen ? 48 : 56} color={colors.success} />
                                    <Text style={[styles.successTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        Email Sent Successfully!
                                    </Text>
                                    <Text style={[styles.successText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        We've sent a password reset link to
                                    </Text>
                                    <Text style={[styles.emailText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                        {email}
                                    </Text>
                                    <Text style={[styles.infoText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        Please check your inbox and follow the instructions to reset your password.
                                    </Text>
                                </View>

                                <Pressable style={styles.actionButton} onPress={() => router.back()}>
                                    <LinearGradient
                                        colors={[colors.primary, colors.primary + 'DD']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={[styles.buttonText, { fontFamily: fonts.inter.bold }]}>
                                            Back to Login
                                        </Text>
                                    </LinearGradient>
                                </Pressable>

                                <Pressable style={styles.resendButton} onPress={() => setEmailSent(false)}>
                                    <Text style={[styles.resendText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                        Didn't receive the email? Resend
                                    </Text>
                                </Pressable>
                            </Animated.View>
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
    },
    successContent: {
        alignItems: 'center',
    },
    successCard: {
        padding: isSmallScreen ? 24 : 28,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: isSmallScreen ? 20 : 24,
        borderWidth: 1.5,
        width: '100%',
    },
    successTitle: {
        fontSize: isSmallScreen ? 20 : 24,
        marginTop: isSmallScreen ? 16 : 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    successText: {
        fontSize: isSmallScreen ? 13 : 14,
        textAlign: 'center',
        marginBottom: 6,
    },
    emailText: {
        fontSize: isSmallScreen ? 14 : 16,
        textAlign: 'center',
        marginBottom: isSmallScreen ? 12 : 16,
    },
    infoText: {
        fontSize: isSmallScreen ? 12 : 13,
        textAlign: 'center',
        lineHeight: 20,
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
