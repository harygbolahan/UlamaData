import { useTheme } from '@/contexts/theme-context';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeSkeleton() {
    const { colors, isDark } = useTheme();
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const skeletonColor = isDark ? '#2a2a2a' : '#e0e0e0';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Skeleton */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Animated.View 
                        style={[
                            styles.avatar, 
                            { backgroundColor: skeletonColor, opacity }
                        ]} 
                    />
                    <View>
                        <Animated.View 
                            style={[
                                styles.textLine, 
                                { width: 100, backgroundColor: skeletonColor, opacity }
                            ]} 
                        />
                        <Animated.View 
                            style={[
                                styles.textLine, 
                                { width: 150, marginTop: 8, backgroundColor: skeletonColor, opacity }
                            ]} 
                        />
                    </View>
                </View>
                <Animated.View 
                    style={[
                        styles.iconButton, 
                        { backgroundColor: skeletonColor, opacity }
                    ]} 
                />
            </View>

            {/* Balance Card Skeleton */}
            <Animated.View 
                style={[
                    styles.balanceCard, 
                    { backgroundColor: skeletonColor, opacity }
                ]} 
            >
                <Animated.View 
                    style={[
                        styles.textLine, 
                        { width: 80, backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                    ]} 
                />
                <Animated.View 
                    style={[
                        styles.balanceAmount, 
                        { backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                    ]} 
                />
                <View style={styles.balanceActions}>
                    <Animated.View 
                        style={[
                            styles.actionButton, 
                            { backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                        ]} 
                    />
                    <Animated.View 
                        style={[
                            styles.actionButton, 
                            { backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                        ]} 
                    />
                </View>
            </Animated.View>

            {/* Services Grid Skeleton */}
            <View style={styles.section}>
                <Animated.View 
                    style={[
                        styles.sectionTitle, 
                        { backgroundColor: skeletonColor, opacity }
                    ]} 
                />
                <View style={styles.servicesGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <Animated.View 
                            key={item}
                            style={[
                                styles.serviceCard, 
                                { backgroundColor: skeletonColor, opacity }
                            ]} 
                        >
                            <Animated.View 
                                style={[
                                    styles.serviceIcon, 
                                    { backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                                ]} 
                            />
                            <Animated.View 
                                style={[
                                    styles.serviceText, 
                                    { backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                                ]} 
                            />
                        </Animated.View>
                    ))}
                </View>
            </View>

            {/* Recent Transactions Skeleton */}
            <View style={styles.section}>
                <Animated.View 
                    style={[
                        styles.sectionTitle, 
                        { backgroundColor: skeletonColor, opacity }
                    ]} 
                />
                {[1, 2, 3].map((item) => (
                    <Animated.View 
                        key={item}
                        style={[
                            styles.transactionCard, 
                            { backgroundColor: skeletonColor, opacity }
                        ]} 
                    >
                        <View style={styles.transactionLeft}>
                            <Animated.View 
                                style={[
                                    styles.transactionIcon, 
                                    { backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                                ]} 
                            />
                            <View>
                                <Animated.View 
                                    style={[
                                        styles.textLine, 
                                        { width: 120, backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                                    ]} 
                                />
                                <Animated.View 
                                    style={[
                                        styles.textLine, 
                                        { width: 80, marginTop: 6, backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                                    ]} 
                                />
                            </View>
                        </View>
                        <Animated.View 
                            style={[
                                styles.textLine, 
                                { width: 60, backgroundColor: isDark ? '#1a1a1a' : '#d0d0d0', opacity }
                            ]} 
                        />
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    textLine: {
        height: 12,
        borderRadius: 6,
    },
    balanceCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        height: 180,
    },
    balanceAmount: {
        height: 40,
        width: 200,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 20,
    },
    balanceActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        height: 20,
        width: 150,
        borderRadius: 6,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
    },
    serviceCard: {
        width: '23%',
        margin: '1%',
        aspectRatio: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginBottom: 8,
    },
    serviceText: {
        height: 10,
        width: '80%',
        borderRadius: 5,
    },
    transactionCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
});
