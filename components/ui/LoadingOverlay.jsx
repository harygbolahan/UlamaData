import { useTheme } from '@/contexts/theme-context';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

export default function LoadingOverlay({ visible = true }) {
    const { colors } = useTheme();
    const spinValue = useRef(new Animated.Value(0)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Fade in
            Animated.timing(fadeValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Spin animation
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            // Fade out
            Animated.timing(fadeValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (!visible) return null;

    return (
        <Animated.View 
            style={[
                styles.overlay, 
                { 
                    backgroundColor: colors.background + 'E6',
                    opacity: fadeValue 
                }
            ]}
        >
            <View style={styles.content}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 50,
    },
});
