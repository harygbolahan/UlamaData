import { useTheme } from '@/contexts/theme-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'All Your Bills, One Place',
        description: 'Manage electricity, cable subscriptions, and utilities effortlessly from your phone.',
        icon: 'receipt-outline',
        iconType: 'Ionicons',
        gradient: ['#667eea', '#764ba2'],
    },
    {
        id: '2',
        title: 'Recharge Instantly',
        description: 'Buy airtime and data bundles for any network in seconds. Simple and reliable.',
        icon: 'wifi',
        iconType: 'Ionicons',
        gradient: ['#f093fb', '#f5576c'],
    },
    {
        id: '3',
        title: 'Secure & Protected',
        description: 'Your transactions are encrypted and protected with bank-level security standards.',
        icon: 'shield-checkmark-outline',
        iconType: 'Ionicons',
        gradient: ['#11998e', '#38ef7d'],
    },
    {
        id: '4',
        title: 'Invite & Earn',
        description: 'Refer friends to join and get rewarded with cashback on every successful referral.',
        icon: 'people-outline',
        iconType: 'Ionicons',
        gradient: ['#4facfe', '#00f2fe'],
    },
];

function AnimatedIcon({ icon, iconType, isActive }) {
    const scale = useSharedValue(0.5);
    const rotate = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        if (isActive) {
            // Entry animation
            scale.value = withSpring(1, {
                damping: 12,
                stiffness: 100,
            });

            translateY.value = withSpring(0, {
                damping: 15,
                stiffness: 90,
            });

            // Continuous floating animation
            translateY.value = withRepeat(
                withSequence(
                    withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );

            // Subtle rotation
            rotate.value = withRepeat(
                withSequence(
                    withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            scale.value = 0.5;
            translateY.value = 20;
            rotate.value = 0;
        }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    const IconComponent = iconType === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

    return (
        <Animated.View style={[styles.iconWrapper, animatedStyle]}>
            <View style={styles.iconCircle}>
                <IconComponent name={icon} size={72} color="#ffffff" />
            </View>
        </Animated.View>
    );
}

function OnboardingSlide({ item, fonts, isActive }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);

    useEffect(() => {
        if (isActive) {
            opacity.value = withTiming(1, { duration: 600 });
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 90,
            });
        } else {
            opacity.value = 0;
            translateY.value = 30;
        }
    }, [isActive]);

    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={[styles.slide, { width }]}>
            <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            >
                {/* Geometric Background Pattern */}
                <View style={styles.patternContainer}>
                    <View style={[styles.circle, styles.circle1]} />
                    <View style={[styles.circle, styles.circle2]} />
                    <View style={[styles.circle, styles.circle3]} />
                </View>

                <Animated.View style={[styles.content, contentStyle]}>
                    {/* Animated Icon */}
                    <AnimatedIcon
                        icon={item.icon}
                        iconType={item.iconType}
                        isActive={isActive}
                    />

                    {/* Text Content */}
                    <View style={styles.textContent}>
                        <Text style={[styles.title, { fontFamily: fonts.inter.bold }]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.description, { fontFamily: fonts.inter.regular }]}>
                            {item.description}
                        </Text>
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

export default function OnboardingScreen() {
    const { fonts } = useTheme();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const flatListRef = React.useRef(null);
    const buttonScale = useSharedValue(1);

    const handleNext = async () => {
        buttonScale.value = withSequence(
            withTiming(0.96, { duration: 100 }),
            withSpring(1, { damping: 10, stiffness: 100 })
        );

        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/(onboarding)/auth-selector');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(onboarding)/auth-selector');
    };

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const renderItem = ({ item, index }) => (
        <OnboardingSlide
            item={item}
            fonts={fonts}
            isActive={index === currentIndex}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Skip Button */}
            {currentIndex < slides.length - 1 && (
                <View style={styles.skipContainer}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={[styles.skipText, { fontFamily: fonts.inter.medium }]}>
                            Skip
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
                scrollEventThrottle={16}
            />

            {/* Footer */}
            <View style={styles.footer}>
                {/* Progress Indicators */}
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                {
                                    backgroundColor: index === currentIndex
                                        ? '#ffffff'
                                        : 'rgba(255,255,255,0.3)',
                                    width: index === currentIndex ? 32 : 8,
                                }
                            ]}
                        />
                    ))}
                </View>

                {/* Action Button */}
                <Animated.View style={buttonStyle}>
                    <TouchableOpacity
                        onPress={handleNext}
                        style={styles.button}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.buttonText, { fontFamily: fonts.inter.bold }]}>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>


            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipContainer: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
    },
    skipButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
    },
    skipText: {
        color: '#ffffff',
        fontSize: 15,
    },
    slide: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 9999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    circle1: {
        width: 400,
        height: 400,
        top: -150,
        right: -100,
    },
    circle2: {
        width: 300,
        height: 300,
        bottom: -100,
        left: -80,
    },
    circle3: {
        width: 200,
        height: 200,
        top: '40%',
        left: -50,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
        width: '100%',
    },
    iconWrapper: {
        marginBottom: 48,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    textContent: {
        alignItems: 'center',
        maxWidth: 340,
    },
    title: {
        fontSize: 36,
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 26,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 50,
        gap: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    indicator: {
        height: 4,
        borderRadius: 2,
    },
    button: {
        backgroundColor: '#ffffff',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 17,
        color: '#000000',
        letterSpacing: 0.3,
    },
    signInLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    signInText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
    },
    signInBold: {
        color: '#ffffff',
    },
});
