import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';

export function AutoLockWarningModal({ visible, secondsRemaining, onStayActive, onLockNow }) {
    const { colors, fonts, isDark } = useTheme();
    const slideAnim = useRef(new Animated.Value(300)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 65,
                friction: 11,
                useNativeDriver: true,
            }).start();

            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.12,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            slideAnim.setValue(300);
            pulseAnim.setValue(1);
        }
    }, [visible]);

    const getUrgencyColor = () => {
        if (secondsRemaining <= 3) return '#FF3B30';
        if (secondsRemaining <= 5) return '#FF9500';
        return '#FFD60A';
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onStayActive}
        >
            <BlurView 
                intensity={80} 
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurContainer}
            >
                <TouchableOpacity 
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onStayActive}
                >
                    <Animated.View 
                        style={[
                            styles.drawer,
                            { 
                                backgroundColor: colors.background,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <View style={[styles.handle, { backgroundColor: isDark ? '#3a3a3a' : '#d0d0d0' }]} />

                        <View style={styles.content}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <View style={[styles.countdownCircle, { backgroundColor: getUrgencyColor() }]}>
                                    <Text style={[styles.countdown, { fontFamily: fonts.inter.bold }]}>
                                        {secondsRemaining}
                                    </Text>
                                </View>
                            </Animated.View>

                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Still here?
                                </Text>
                                <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Locking in {secondsRemaining}s
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.lockButton, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                onPress={onLockNow}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="lock-closed" size={22} color={colors.icon} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                                onPress={onStayActive}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.buttonText, { fontFamily: fonts.inter.medium }]}>
                                    I'm Here
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    blurContainer: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    drawer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
        paddingBottom: 36,
        paddingHorizontal: 24,
    },
    handle: {
        width: 44,
        height: 5,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 18,
    },
    countdownCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdown: {
        fontSize: 28,
        color: '#fff',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 15,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    lockButton: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        flex: 1,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 17,
        color: '#fff',
    },
});
