import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionFailedScreen() {
    const params = useLocalSearchParams();
    const { colors, fonts, isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const {
        service = 'Transaction',
        beneficiary,
        amount,
        network,
        error = 'Transaction failed. Please try again.',
        transactionId,
        requestId,
        planSize,
        validity,
        meterType,
        provider,
        dataSize,
        dataType,
        airtimeType,
        phone,
        cablePlan,
        iuc,
        customerName,
        planName,
        meterNumber,
        discoName,
        customerAddress,
        quantity,
    } = params;

    const additionalDetails = [];

    if (dataSize) {
        additionalDetails.push({ label: 'Data Size', value: dataSize });
    }
    if (dataType) {
        additionalDetails.push({ label: 'Data Type', value: dataType });
    }
    if (airtimeType) {
        additionalDetails.push({ label: 'Airtime Type', value: airtimeType });
    }
    if (planSize && !dataSize) {
        additionalDetails.push({ label: 'Plan', value: planSize });
    }
    if (validity) {
        additionalDetails.push({ label: 'Validity', value: validity });
    }
    if (meterType) {
        additionalDetails.push({ label: 'Meter Type', value: meterType });
    }
    if (discoName || provider) {
        additionalDetails.push({ label: 'Provider', value: discoName || provider });
    }
    if (cablePlan || planName) {
        additionalDetails.push({ label: 'Cable Plan', value: cablePlan || planName });
    }
    if (customerName) {
        additionalDetails.push({ label: 'Customer Name', value: customerName });
    }
    if (customerAddress) {
        additionalDetails.push({ label: 'Address', value: customerAddress });
    }
    if (iuc) {
        additionalDetails.push({ label: 'Smart Card/IUC', value: iuc });
    }
    if (meterNumber) {
        additionalDetails.push({ label: 'Meter Number', value: meterNumber });
    }
    if (quantity && (service.includes('Pin'))) {
        additionalDetails.push({ label: 'Quantity', value: `${quantity} PIN(s)` });
    }

    const displayTransactionId = requestId || transactionId || `TXN${Date.now().toString().slice(-8)}`;
    const date = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    useEffect(() => {
        // Simulate initial loading
        setTimeout(() => setIsLoading(false), 500);

        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.push('/(tabs)/home')}
            >
                <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.failedIconContainer,
                        {
                            backgroundColor: '#FF5252' + '15',
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <Ionicons name="close-circle" size={80} color="#FF5252" />
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Transaction Failed
                    </Text>

                    <Text style={[styles.subtitle, { color: '#FF5252', fontFamily: fonts.inter.medium }]}>
                        {error}
                    </Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.detailsCard,
                        {
                            backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Amount
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            ₦{parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>

                    {beneficiary && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Beneficiary
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {beneficiary}
                            </Text>
                        </View>
                    )}

                    {network && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Network
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {network}
                            </Text>
                        </View>
                    )}

                    {additionalDetails.map((detail, index) => (
                        <View key={index} style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {detail.label}
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {detail.value}
                            </Text>
                        </View>
                    ))}

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Transaction ID
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {displayTransactionId}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Date & Time
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {date}
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.infoBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.icon} />
                    <Text style={[styles.infoText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        If your account was debited, it will be automatically refunded within few minutes. You can also contact support for further assistance.
                    </Text>
                </Animated.View>
            </View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <View style={styles.buttonContainer}>
                    <Button
                        title="Try Again"
                        onPress={() => router.back()}
                        variant="outline"
                        style={{ flex: 1 }}
                    />
                    <View style={{ width: 12 }} />
                    <Button
                        title="Go Home"
                        onPress={() => router.push('/(tabs)/home')}
                        style={{ flex: 1 }}
                    />
                </View>
            </Animated.View>
            <LoadingOverlay visible={isLoading} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 100,
        alignItems: 'center',
    },
    failedIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    detailsCard: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        gap: 16,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: { fontSize: 14 },
    detailValue: { fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 16 },
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FF5252' + '10',
        alignItems: 'center',
        gap: 10,
        width: '100%',
    },
    infoText: {
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
    buttonContainer: {
        flexDirection: 'row',
    }
});
