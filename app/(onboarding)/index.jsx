import { useTheme } from '@/contexts/theme-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Electricity & Cable Payments',
        description: 'Pay for your electricity and cable subscriptions effortlessly, directly from the app.',
        emoji: '💡',
    },
    {
        id: '2',
        title: 'Data & Airtime Top-Up',
        description: 'Easily top-up your phone with data and airtime, anytime, anywhere, with just a few taps.',
        emoji: '📱',
    },
    {
        id: '3',
        title: 'Referral Rewards',
        description: 'Earn rewards by referring others to our platform—share the benefits of secure transactions!',
        emoji: '🎁',
    },
];

//remove header from the page (headershown = false)




function OnboardingSlide({ item, colors, fonts }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={[styles.slide, { width }]}>
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor: colors.secondary + '40',
                            borderColor: colors.secondary,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={[styles.iconInner, { backgroundColor: colors.background }]}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                    </View>
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.description, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {item.description}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
}

export default function OnboardingScreen() {
    const { colors, fonts } = useTheme();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: currentIndex,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [currentIndex]);

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            // Mark onboarding as completed
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/(auth)/signup');
        }
    };

    const handleLogin = async () => {
        // Mark onboarding as completed
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(auth)/login');
    };

    const renderItem = ({ item }) => (
        <OnboardingSlide item={item} colors={colors} fonts={fonts} />
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentIndex ? colors.primary : colors.icon + '40',
                                    width: index === currentIndex ? 32 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
                >
                    <Text style={[styles.getStartedText, { fontFamily: fonts.inter.semiBold }]}>
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleLogin}
                    style={[styles.loginButton, { backgroundColor: colors.secondary }]}
                >
                    <Text style={[styles.loginText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                        Already have an account?
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: height * 0.05,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
        borderWidth: 3,
    },
    iconInner: {
        width: 120,
        height: 120,
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    emoji: {
        fontSize: 60,
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 50,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    getStartedButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    getStartedText: {
        color: '#fff',
        fontSize: 16,
    },
    loginButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 16,
    },
});
