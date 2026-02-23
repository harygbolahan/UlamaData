import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function AuthSelectorScreen() {
    const { colors, fonts, isDark } = useTheme();
    const router = useRouter();

    const handleLogin = () => {
        router.push('/(auth)/login');
    };

    const handleSignup = () => {
        router.push('/(auth)/signup');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={['#000000', '#0F0F0F', '#1A1A1A']}
                style={StyleSheet.absoluteFill}
            />

            {/* Background elements */}
            <View style={styles.patternContainer}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </View>

            <SafeAreaView style={styles.content}>
                <View style={styles.topSection}>
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(1000).springify()}
                        style={styles.logoContainer}
                    >
                        <View style={styles.logoBox}>
                            <Ionicons name="wallet" size={60} color="#ffffff" />
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400).duration(800).springify()}
                        style={styles.textContainer}
                    >
                        <Text style={[styles.title, { fontFamily: fonts.inter.bold }]}>
                            UlamaData
                        </Text>
                        <Text style={[styles.subtitle, { fontFamily: fonts.inter.regular }]}>
                            Everything you need to manage your bills and earn rewards in one simple app.
                        </Text>
                    </Animated.View>
                </View>

                <View style={styles.bottomSection}>
                    <Animated.View
                        entering={FadeInDown.delay(600).duration(800).springify()}
                        style={styles.buttonContainer}
                    >
                        <TouchableOpacity
                            onPress={handleLogin}
                            style={[styles.primaryButton, { backgroundColor: '#ffffff' }]}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.primaryButtonText, { fontFamily: fonts.inter.bold }]}>
                                Sign In
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSignup}
                            style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.4)' }]}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.secondaryButtonText, { fontFamily: fonts.inter.bold }]}>
                                Create Account
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    circle1: {
        width: 300,
        height: 300,
        top: -50,
        right: -100,
    },
    circle2: {
        width: 250,
        height: 250,
        bottom: 200,
        left: -100,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'space-between',
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: height * 0.05,
    },
    logoContainer: {
        marginBottom: 32,
    },
    logoBox: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 10,
    },
    bottomSection: {
        paddingBottom: 40,
    },
    buttonContainer: {
        gap: 16,
        marginBottom: 32,
    },
    primaryButton: {
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        fontSize: 18,
        color: '#000000',
    },
    secondaryButton: {
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    secondaryButtonText: {
        fontSize: 18,
        color: '#ffffff',
    },
    footer: {
        paddingHorizontal: 10,
    },
    footerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 20,
    },
    footerLink: {
        color: '#ffffff',
        textDecorationLine: 'underline',
    },
});
