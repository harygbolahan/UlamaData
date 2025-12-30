import { useAuth } from '@/contexts/auth-context';
import { useAutoLock } from '@/contexts/auto-lock-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeBackScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { login, user } = useAuth();
    const { unlock } = useAutoLock();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [storedEmail, setStoredEmail] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadStoredEmail();
    }, []);

    const loadStoredEmail = async () => {
        try {
            const email = await AsyncStorage.getItem('user_email');
            const name = await AsyncStorage.getItem('user_name');
            
            console.log('Welcome Back - Stored email:', email);
            console.log('Welcome Back - Stored name:', name);
            
            if (email) {
                setStoredEmail(email);
                setUserName(name || email.split('@')[0]);
            } else {
                // No stored email, redirect to full login
                console.log('No stored email found, redirecting to login');
                router.replace('/(auth)/login');
            }
        } catch (error) {
            console.error('Error loading stored email:', error);
            router.replace('/(auth)/login');
        }
    };

    const handleLogin = async () => {
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        const result = await login({
            email: storedEmail,
            password: password.trim(),
        });

        if (result.success) {
            unlock(); // Unlock the app
            router.replace('/(tabs)/home');
        } else {
            setError(result.error || 'Invalid password');
            setLoading(false);
        }
    };

    const handleDifferentAccount = () => {
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={[styles.logoCircle, { backgroundColor: colors.primary + '20' }]}>
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Welcome Text */}
                <View style={styles.welcomeContainer}>
                    <Text style={[styles.welcomeText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Welcome Back
                    </Text>
                    <Text style={[styles.nameText, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                        {userName}
                    </Text>
                    <Text style={[styles.emailText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {storedEmail}
                    </Text>
                </View>

                {/* Password Input */}
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Password
                        </Text>
                        <View style={[
                            styles.inputWrapper,
                            { 
                                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                borderColor: error ? '#FF3B30' : 'transparent'
                            }
                        ]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.icon}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError('');
                                }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                                disabled={loading}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={colors.icon}
                                />
                            </TouchableOpacity>
                        </View>
                        {error ? (
                            <Text style={[styles.errorText, { fontFamily: fonts.inter.regular }]}>
                                {error}
                            </Text>
                        ) : null}
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            { backgroundColor: colors.primary },
                            loading && styles.loginButtonDisabled
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.loginButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                Login
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Different Account */}
                    <TouchableOpacity
                        style={styles.differentAccountButton}
                        onPress={handleDifferentAccount}
                        disabled={loading}
                    >
                        <Text style={[styles.differentAccountText, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                            Use a different account
                        </Text>
                    </TouchableOpacity>
                </View>
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
        paddingTop: 100,
        paddingBottom: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    welcomeText: {
        fontSize: 18,
        marginBottom: 8,
    },
    nameText: {
        fontSize: 28,
        marginBottom: 4,
    },
    emailText: {
        fontSize: 14,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 6,
    },
    loginButton: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    differentAccountButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    differentAccountText: {
        fontSize: 14,
    },
});
