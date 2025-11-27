import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function PaymentSuccessScreen() {
    const { colors, fonts } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

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
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Animated.View style={[
                    styles.iconContainer,
                    { backgroundColor: colors.success + '20', transform: [{ scale: scaleAnim }] }
                ]}>
                    <Ionicons name="checkmark-circle" size={100} color={colors.success} />
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Payment Successful!
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Your wallet has been funded successfully
                    </Text>
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <Button
                    title="Done"
                    onPress={() => router.replace('/(tabs)/home')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
