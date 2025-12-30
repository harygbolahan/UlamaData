import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionSuccessScreen() {
    const params = useLocalSearchParams();
    const { colors, fonts, isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const {
        service = 'Data Subscription',
        beneficiary = '08038295877',
        amount = '400',
        network = 'MTN',
        planSize,
        validity,
        meterType,
        provider,
        transactionId,
        requestId,
        apiResponse,
        dataSize,
        dataType,
        oldBalance,
        newBalance,
        airtimeType,
        phone,
        cablePlan,
        iuc,
        customerName,
        planName,
        token,
        units,
        meterNumber,
        discoName,
        customerAddress,
        dataPins,
        quantity,
        serial,
        airtimePin,
        pinSize,
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
    if (token) {
        additionalDetails.push({ label: 'Token', value: token, highlight: true });
    }
    if (units) {
        additionalDetails.push({ label: 'Units', value: units });
    }
    if (quantity && (service === 'Data Pin' || service === 'Airtime Pin')) {
        additionalDetails.push({ label: 'Quantity', value: `${quantity} PIN(s)` });
    }
    if (pinSize && service === 'Airtime Pin') {
        additionalDetails.push({ label: 'Pin Size', value: `₦${pinSize}` });
    }
    if (serial) {
        additionalDetails.push({ label: 'Serial Number', value: serial, highlight: true });
    }
    if (airtimePin) {
        additionalDetails.push({ label: 'PIN', value: airtimePin, highlight: true });
    }
    if (dataPins) {
        try {
            const pins = JSON.parse(dataPins);
            if (Array.isArray(pins) && pins.length > 0) {
                pins.forEach((pin, index) => {
                    additionalDetails.push({ 
                        label: `PIN ${index + 1}`, 
                        value: pin, 
                        highlight: true 
                    });
                });
            }
        } catch (e) {
            console.error('Error parsing data pins:', e);
        }
    }
    if (oldBalance) {
        additionalDetails.push({ label: 'Previous Balance', value: `₦${parseFloat(oldBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
    }
    if (newBalance) {
        additionalDetails.push({ label: 'New Balance', value: `₦${parseFloat(newBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.push('/(tabs)/home')}
            >
                <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.successIconContainer,
                        {
                            backgroundColor: colors.primary + '15',
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Transaction Successful!
                    </Text>

                    <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {apiResponse || `Your ${service.toLowerCase()} was successful`}
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
                            ₦{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Beneficiary
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {beneficiary}
                        </Text>
                    </View>

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
                        <View key={index} style={[
                            styles.detailRow,
                            detail.highlight && styles.highlightRow,
                            detail.highlight && { backgroundColor: colors.primary + '10', padding: 12, borderRadius: 8, marginVertical: 4 }
                        ]}>
                            <Text style={[
                                styles.detailLabel, 
                                { 
                                    color: detail.highlight ? colors.primary : colors.icon, 
                                    fontFamily: detail.highlight ? fonts.inter.semiBold : fonts.inter.regular 
                                }
                            ]}>
                                {detail.label}
                            </Text>
                            <Text style={[
                                styles.detailValue, 
                                { 
                                    color: detail.highlight ? colors.primary : colors.text, 
                                    fontFamily: detail.highlight ? fonts.inter.bold : fonts.inter.semiBold 
                                }
                            ]}>
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

               
            </View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Button
                    title="Done"
                    onPress={() => router.push('/(tabs)/home')}
                />
            </Animated.View>
            <LoadingOverlay visible={isLoading} />
        </SafeAreaView>
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
    successIconContainer: {
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
    highlightRow: {
        marginHorizontal: -4,
    },
    detailLabel: { fontSize: 14 },
    detailValue: { fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 16 },
    actions: {
        flexDirection: 'row',
        gap: 32,
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: { fontSize: 13 },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
