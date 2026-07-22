import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';

export default function TransactionSuccessScreen() {
    const params = useLocalSearchParams();
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [resendModalVisible, setResendModalVisible] = useState(false);
    const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [resendMessage, setResendMessage] = useState('');
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const receiptRef = useRef(null);

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
        transref,
    } = params;

    const handleShare = async () => {
        try {
            setIsLoading(true);
            setIsCapturing(true);

            // Wait for UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the receipt view as image
            const uri = await captureRef(receiptRef, {
                format: 'png',
                quality: 1,
            });

            // Share the image
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Receipt',
                    UTI: 'public.png',
                });
            } else {
                showToast('error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing receipt:', error);
            showToast('error', 'Failed to share receipt');
        } finally {
            setIsCapturing(false);
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        setResendStatus('idle');
        setResendMessage('Are you sure you want to resend this transaction?');
        setResendModalVisible(true);
    };

    const confirmResend = async () => {
        setResendStatus('loading');
        try {
            const refToUse = transref || transactionId || requestId;
            const response = await api.post('/resend-transaction', {
                transref: refToUse,
                pin: "12345"
            });
            console.log('Resend Response:', response);
            
            const resData = response.data || response;
            const statusStr = (resData.status || resData.Status || '').toLowerCase();
            const isSuccess = statusStr === 'success' || statusStr === 'successful';
            
            setResendStatus(isSuccess ? 'success' : 'error');
            setResendMessage(resData.message || resData.api_response || resData.response || 'Transaction processed.');
        } catch (error) {
            console.error('Error resending transaction:', error);
            setResendStatus('error');
            setResendMessage(error.message || 'Could not resend transaction.');
        }
    };

    const extractAddress = (data) => {
        if (!data) return null;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return extractAddress(parsed);
            } catch (e) {
                const match = data.match(/(?:^|[^a-z0-9_])(?:customer_?address|address)\s*[:=]\s*["']?([^"'\n\r,}]+)/i);
                if (match && match[1]) {
                    const val = match[1].trim();
                    if (!val.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && !val.includes('@')) {
                        return val;
                    }
                }
                return null;
            }
        }
        if (typeof data === 'object') {
            const addressKeys = ['customerAddress', 'customer_address', 'address', 'Address', 'customer_Address', 'user_address'];
            for (const key of addressKeys) {
                if (data[key] && typeof data[key] === 'string' && data[key].trim().length > 0) {
                    const val = data[key].trim();
                    if (!val.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && !val.includes('@')) {
                        return val;
                    }
                }
            }
            const containerKeys = ['api_response', 'api_response_log', 'data', 'details', 'log', 'response', 'result'];
            for (const key of containerKeys) {
                if (data[key]) {
                    const found = extractAddress(data[key]);
                    if (found) return found;
                }
            }
        }
        return null;
    };

    const resolvedAddress = customerAddress || params.address || extractAddress(apiResponse) || extractAddress(params);

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
    if (resolvedAddress) {
        additionalDetails.push({ label: 'Address', value: resolvedAddress });
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
    if (oldBalance && !isCapturing) {
        additionalDetails.push({ label: 'Previous Balance', value: `₦${parseFloat(oldBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
    }
    if (newBalance && !isCapturing) {
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
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.push('/(tabs)/home')}
            >
                <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View ref={receiptRef} collapsable={false} style={styles.content}>
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
                    {!isCapturing && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Amount
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                ₦{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    )}

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
                    title="Share Receipt"
                    onPress={handleShare}
                    style={{ marginBottom: 12 }}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                        title="Retry/Resend"
                        onPress={handleRetry}
                        variant="outline"
                        style={{ flex: 1 }}
                    />
                    <Button
                        title="Done"
                        onPress={() => router.push('/(tabs)/home')}
                        variant="outline"
                        style={{ flex: 1 }}
                    />
                </View>
            </Animated.View>
            <LoadingOverlay visible={isLoading} />

            {/* Custom Resend Modal */}
            <Modal
                visible={resendModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (resendStatus !== 'loading') {
                        setResendModalVisible(false);
                    }
                }}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                        {resendStatus === 'loading' ? (
                            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[modalStyles.message, { color: colors.text, fontFamily: fonts.inter.medium, marginTop: 16 }]}>
                                    Resending transaction...
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={[
                                    modalStyles.iconContainer, 
                                    { 
                                        backgroundColor: resendStatus === 'success' 
                                            ? (colors.success || '#10B981') + '15' 
                                            : resendStatus === 'error' 
                                                ? colors.error + '15' 
                                                : colors.primary + '15' 
                                    }
                                ]}>
                                    <Ionicons 
                                        name={
                                            resendStatus === 'success' 
                                                ? "checkmark-circle" 
                                                : resendStatus === 'error' 
                                                    ? "alert-circle" 
                                                    : "refresh"
                                        } 
                                        size={48} 
                                        color={
                                            resendStatus === 'success' 
                                                ? (colors.success || '#10B981') 
                                                : resendStatus === 'error' 
                                                    ? colors.error 
                                                    : colors.primary
                                        } 
                                    />
                                </View>

                                <Text style={[modalStyles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    {
                                        resendStatus === 'success' 
                                            ? "Success" 
                                            : resendStatus === 'error' 
                                                ? "Transaction Failed" 
                                                : "Resend Transaction"
                                    }
                                </Text>

                                <Text style={[modalStyles.message, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {resendMessage}
                                </Text>

                                {resendStatus === 'idle' ? (
                                    <View style={modalStyles.buttonContainer}>
                                        <TouchableOpacity
                                            style={[modalStyles.button, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                            onPress={() => setResendModalVisible(false)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={{ color: colors.text, fontFamily: fonts.inter.medium }}>
                                                Cancel
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[modalStyles.button, { backgroundColor: colors.primary }]}
                                            onPress={confirmResend}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={{ color: '#fff', fontFamily: fonts.inter.medium }}>
                                                Resend
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[modalStyles.button, { backgroundColor: colors.primary, width: '100%' }]}
                                        onPress={() => setResendModalVisible(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ color: '#fff', fontFamily: fonts.inter.medium }}>
                                            Close
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
