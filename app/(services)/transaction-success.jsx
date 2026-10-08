import PinPrintModal from '@/components/pin-print-modal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { generateElectricityReceiptHTML } from '@/services/electricity-receipt';
import { sharePdfFromHtml } from '@/services/share-pdf';
import { captureRef } from 'react-native-view-shot';

// Network brand palette
const NETWORK_COLORS = {
    MTN: { bg: '#FFCC00', text: '#000000' },
    AIRTEL: { bg: '#E40000', text: '#FFFFFF' },
    GLO: { bg: '#2EAD2E', text: '#FFFFFF' },
    '9MOBILE': { bg: '#006633', text: '#FFFFFF' },
    ETISALAT: { bg: '#006633', text: '#FFFFFF' },
};

function getNetworkBrand(network) {
    if (!network) return { bg: '#888', text: '#fff' };
    const key = network.toUpperCase().replace(/\s+/g, '');
    for (const [k, v] of Object.entries(NETWORK_COLORS)) {
        if (key.includes(k)) return v;
    }
    return { bg: '#555', text: '#fff' };
}

function DashedDivider({ color }) {
    return (
        <View style={[dashedStyles.row]}>
            {Array.from({ length: 28 }).map((_, i) => (
                <View key={i} style={[dashedStyles.dash, { backgroundColor: color }]} />
            ))}
        </View>
    );
}

const dashedStyles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, paddingHorizontal: 4 },
    dash: { width: 5, height: 1.5, borderRadius: 1 },
});

export default function TransactionSuccessScreen() {
    const params = useLocalSearchParams();
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showPinPrintModal, setShowPinPrintModal] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const receiptRef = useRef(null);

    const {
        service = 'Data Subscription',
        beneficiary = '',
        amount = '0',
        network = '',
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

    const isRechargeCard = service === 'Airtime Pin' || service === 'Data Pin';
    const isElectricity = service === 'Electricity Bill';
    // The purchase response's request-id is the same ref History uses to fetch printable PINs
    const pinRef = transref || requestId;
    const networkBrand = getNetworkBrand(network || provider || '');
    const displayTransactionId = requestId || transactionId || `TXN${Date.now().toString().slice(-8)}`;
    const isDataService =
        service === 'Data Subscription' ||
        service === 'Data Pin' ||
        (service || '').toLowerCase().includes('data');

    const date = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Info rows
    const infoRows = [];
    infoRows.push({ label: 'Recipient', value: beneficiary || phone || 'N/A' });
    if (network) infoRows.push({ label: 'Network', value: network });
    if (customerName) infoRows.push({ label: 'Customer', value: customerName });
    if (customerAddress) infoRows.push({ label: 'Address', value: customerAddress });
    if (iuc) infoRows.push({ label: 'Smart Card / IUC', value: iuc });
    if (meterNumber) infoRows.push({ label: 'Meter Number', value: meterNumber });
    if (meterType) infoRows.push({ label: 'Meter Type', value: meterType });
    if (discoName || provider) infoRows.push({ label: 'Provider', value: discoName || provider });
    if (cablePlan || planName) infoRows.push({ label: 'Plan', value: cablePlan || planName });
    if (validity) infoRows.push({ label: 'Validity', value: validity });
    if (units) infoRows.push({ label: 'Units', value: isElectricity ? `${units} kWh` : units });
    if (quantity && (service === 'Data Pin' || service === 'Airtime Pin')) {
        infoRows.push({ label: 'Quantity', value: `${quantity} PIN(s)` });
    }
    if (pinSize && service === 'Airtime Pin') {
        infoRows.push({ label: 'Pin Denomination', value: `₦${pinSize}` });
    }
    infoRows.push({ label: 'Transaction ID', value: displayTransactionId });
    infoRows.push({ label: 'Date', value: date });

    // Balance rows â€” hidden during share capture
    const balanceRows = [];
    if (oldBalance) {
        balanceRows.push({
            label: 'Prev. Balance',
            value: `₦${parseFloat(oldBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        });
    }
    if (newBalance) {
        balanceRows.push({
            label: 'New Balance',
            value: `₦${parseFloat(newBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        });
    }

    // PIN/Token highlights
    const highlightRows = [];
    if (token) highlightRows.push({ label: isElectricity ? 'Meter Token' : 'Token', value: token });
    if (serial) highlightRows.push({ label: 'Serial Number', value: serial });
    if (airtimePin) highlightRows.push({ label: 'PIN', value: airtimePin });
    if (dataPins) {
        try {
            const pins = JSON.parse(dataPins);
            if (Array.isArray(pins)) {
                pins.forEach((pin, i) => highlightRows.push({ label: `PIN ${i + 1}`, value: pin }));
            }
        } catch (_) {}
    }

    const handleShare = async () => {
        try {
            setIsCapturing(true);
            await new Promise(resolve => setTimeout(resolve, 150));
            const uri = await captureRef(receiptRef, { format: 'png', quality: 1 });
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
        }
    };

    const handleElectricityReceipt = async () => {
        try {
            setIsCapturing(true);
            const html = generateElectricityReceiptHTML({
                token,
                units,
                meterNumber: meterNumber || beneficiary,
                meterType,
                disco: discoName || provider || network,
                customerName,
                customerAddress,
                amount,
                reference: displayTransactionId,
                date,
                status: 'Completed',
            }, colors.primary);
            await sharePdfFromHtml(html, { fileName: `Electricity-Receipt-${displayTransactionId}`, dialogTitle: 'Electricity Receipt' });
        } catch (error) {
            console.error('Error generating electricity receipt:', error);
            showToast('error', 'Failed to generate receipt');
        } finally {
            setIsCapturing(false);
        }
    };

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 400);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    const dividerColor = isDark ? '#2e2e2e' : '#ddd';
    const cardBg = isDark ? '#1a1a1a' : '#FFFFFF';
    const subtleText = isDark ? '#777' : '#9a9a9a';
    const screenBg = isDark ? '#0d0d0d' : '#F0F0F5';

    return (
        <View style={[styles.screen, { backgroundColor: screenBg }]}>
            {/* Close button */}
            <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: isDark ? '#2a2a2a' : '#e2e2e6' }]}
                onPress={() => router.push('/(tabs)/home')}
                activeOpacity={0.7}
            >
                <Ionicons name="close" size={18} color={isDark ? '#aaa' : '#555'} />
            </TouchableOpacity>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                <Animated.View
                    style={[
                        styles.receiptWrapper,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* â”€â”€ Receipt (captured for share) â”€â”€ */}
                    <View ref={receiptRef} collapsable={false} style={{ backgroundColor: screenBg }}>

                        {/* Top notch row */}
                        <View style={[styles.notchRow, { backgroundColor: screenBg }]}>
                            <View style={[styles.notch, { backgroundColor: screenBg }]} />
                            <DashedDivider color={dividerColor} />
                            <View style={[styles.notch, { backgroundColor: screenBg }]} />
                        </View>

                        {/* Receipt body */}
                        <View style={[styles.receiptBody, { backgroundColor: cardBg }]}>

                            {/* Branding header */}
                            <View style={styles.brandRow}>
                                <Text style={[styles.brandName, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                    UlamaData
                                </Text>
                                <Text style={[styles.brandSub, { color: subtleText, fontFamily: fonts.inter.regular }]}>
                                    Transaction Receipt
                                </Text>
                            </View>

                            {/* Success badge */}
                            <View style={styles.centerRow}>
                                <View style={[styles.successPill, { backgroundColor: '#16A34A' }]}>
                                    <Ionicons name="checkmark" size={13} color="#fff" />
                                    <Text style={[styles.successPillText, { fontFamily: fonts.inter.bold }]}>
                                        {isDataService ? 'Data Purchase Successful' : 'Transaction Successful'}
                                    </Text>
                                </View>
                            </View>

                            {/* Network badge + Plan hero */}
                            {(network || provider) ? (
                                <View style={styles.networkSection}>
                                    <View style={[styles.networkBadge, { backgroundColor: networkBrand.bg }]}>
                                        <Text style={[styles.networkBadgeText, { color: networkBrand.text, fontFamily: fonts.inter.bold }]}>
                                            {(network || provider).toUpperCase()}
                                        </Text>
                                    </View>
                                    {(planSize || dataSize) ? (
                                        <Text style={[styles.planHero, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {planSize || dataSize}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}

                            {/* Amount â€” hidden when capturing for share */}
                            {!isCapturing && (
                                <View style={[styles.amountBox, {
                                    backgroundColor: colors.primary + '12',
                                    borderColor: colors.primary + '25',
                                }]}>
                                    <Text style={[styles.amountLabel, { color: subtleText, fontFamily: fonts.inter.regular }]}>
                                        Amount Paid
                                    </Text>
                                    <Text style={[styles.amountValue, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                        ₦{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Text>
                                </View>
                            )}

                            <DashedDivider color={dividerColor} />

                            {/* Info rows */}
                            <View style={styles.infoSection}>
                                {infoRows.map((row, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.infoRow,
                                            i < infoRows.length - 1 && {
                                                borderBottomWidth: 0.5,
                                                borderBottomColor: dividerColor,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.infoLabel, { color: subtleText, fontFamily: fonts.inter.regular }]}>
                                            {row.label}
                                        </Text>
                                        <Text
                                            style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}
                                            numberOfLines={row.label === 'Address' ? 4 : 2}
                                        >
                                            {row.value}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Balance rows â€” hidden during capture */}
                            {!isCapturing && balanceRows.length > 0 && (
                                <>
                                    <DashedDivider color={dividerColor} />
                                    <View style={styles.infoSection}>
                                        {balanceRows.map((row, i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.infoRow,
                                                    i < balanceRows.length - 1 && {
                                                        borderBottomWidth: 0.5,
                                                        borderBottomColor: dividerColor,
                                                    },
                                                ]}
                                            >
                                                <Text style={[styles.infoLabel, { color: subtleText, fontFamily: fonts.inter.regular }]}>
                                                    {row.label}
                                                </Text>
                                                <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                    {row.value}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Highlighted PIN / Token rows */}
                            {highlightRows.length > 0 && (
                                <>
                                    <DashedDivider color={dividerColor} />
                                    <View style={[styles.infoSection, { gap: 8 }]}>
                                        {highlightRows.map((row, i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.highlightBox,
                                                    {
                                                        backgroundColor: colors.primary + '10',
                                                        borderColor: colors.primary + '30',
                                                    },
                                                ]}
                                            >
                                                <Text style={[styles.highlightLabel, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                    {row.label}
                                                </Text>
                                                <Text style={[styles.highlightValue, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                                    {row.value}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* api_response â€” dynamic dial info (e.g. "Dial *461*4# to check balance") */}
                            {apiResponse && isDataService && (
                                <>
                                    <DashedDivider color={dividerColor} />
                                    <View style={[styles.dialBox, {
                                        backgroundColor: isDark ? '#0d2010' : '#F0FDF4',
                                        borderColor: '#16A34A30',
                                    }]}>
                                        <Ionicons name="information-circle" size={16} color="#16A34A" style={{ marginTop: 1 }} />
                                        <Text style={[styles.dialText, {
                                            color: isDark ? '#4ade80' : '#15803D',
                                            fontFamily: fonts.inter.regular,
                                        }]}>
                                            {apiResponse}
                                        </Text>
                                    </View>
                                </>
                            )}

                            <DashedDivider color={dividerColor} />

                            {/* Footer branding */}
                            <View style={styles.footerBrand}>
                                <Text style={[styles.footerBrandName, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                    UlamaData
                                </Text>
                                <Text style={[styles.footerNote, { color: subtleText, fontFamily: fonts.inter.regular }]}>
                                    This is a computer-generated receipt.{'\n'}For support, contact us via the app.
                                </Text>
                            </View>
                        </View>

                        {/* Bottom notch row */}
                        <View style={[styles.notchRow, { backgroundColor: screenBg }]}>
                            <View style={[styles.notch, { backgroundColor: screenBg }]} />
                            <DashedDivider color={dividerColor} />
                            <View style={[styles.notch, { backgroundColor: screenBg }]} />
                        </View>
                    </View>
                    {/* â”€â”€ End receipt capture area â”€â”€ */}

                    {/* Action buttons */}
                    <View style={styles.actions}>
                        {isRechargeCard && (
                            <TouchableOpacity
                                style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    if (!pinRef) {
                                        showToast('info', 'PIN details are not ready yet. Open this transaction from History to print.');
                                        return;
                                    }
                                    setShowPinPrintModal(true);
                                }}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="download-outline" size={19} color="#fff" />
                                <Text style={[styles.shareBtnText, { fontFamily: fonts.inter.bold }]}>
                                    Download / Print Cards
                                </Text>
                            </TouchableOpacity>
                        )}

                        {isElectricity && (
                            <TouchableOpacity
                                style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                                onPress={handleElectricityReceipt}
                                disabled={isCapturing}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="document-text-outline" size={19} color="#fff" />
                                <Text style={[styles.shareBtnText, { fontFamily: fonts.inter.bold }]}>
                                    Download Receipt
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.shareBtn,
                                { backgroundColor: isRechargeCard || isElectricity ? colors.primary + 'CC' : colors.primary },
                            ]}
                            onPress={handleShare}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="share-social-outline" size={19} color="#fff" />
                            <Text style={[styles.shareBtnText, { fontFamily: fonts.inter.bold }]}>
                                Share Receipt
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.doneBtn, {
                                borderColor: colors.primary + '40',
                                backgroundColor: colors.primary + '10',
                            }]}
                            onPress={() => router.push('/(tabs)/home')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.doneBtnText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

            <LoadingOverlay visible={isLoading} />

            {isRechargeCard && !!pinRef && (
                <PinPrintModal
                    visible={showPinPrintModal}
                    onClose={() => setShowPinPrintModal(false)}
                    pinRef={pinRef}
                    provider={network || provider}
                    serviceName={service}
                    amount={amount}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    closeBtn: {
        position: 'absolute',
        top: 52,
        right: 20,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        paddingTop: 62,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    receiptWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
    },

    // Notch rows (receipt paper effect)
    notchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    notch: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginHorizontal: -11,
        zIndex: 3,
    },

    // Receipt body
    receiptBody: {
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 4,
    },

    // Branding
    brandRow: {
        alignItems: 'center',
        paddingTop: 22,
        paddingBottom: 14,
        gap: 4,
    },
    brandName: {
        fontSize: 22,
        letterSpacing: -0.5,
    },
    brandSub: {
        fontSize: 10.5,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
    },

    // Success badge
    centerRow: {
        alignItems: 'center',
        marginBottom: 20,
    },
    successPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    successPillText: {
        fontSize: 12,
        color: '#fff',
        letterSpacing: 0.2,
    },

    // Network + Plan
    networkSection: {
        alignItems: 'center',
        marginBottom: 18,
        gap: 12,
    },
    networkBadge: {
        paddingHorizontal: 22,
        paddingVertical: 7,
        borderRadius: 100,
    },
    networkBadgeText: {
        fontSize: 14,
        letterSpacing: 0.8,
    },
    planHero: {
        fontSize: 21,
        textAlign: 'center',
        letterSpacing: -0.3,
        lineHeight: 28,
    },

    // Amount box
    amountBox: {
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 28,
        letterSpacing: -0.5,
    },

    // Info rows
    infoSection: {
        gap: 0,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 11,
        gap: 12,
    },
    infoLabel: {
        fontSize: 13,
        flex: 1,
    },
    infoValue: {
        fontSize: 13,
        textAlign: 'right',
        flex: 1.6,
    },

    // Highlight (PIN/Token)
    highlightBox: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 14,
        alignItems: 'center',
        gap: 4,
    },
    highlightLabel: {
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
    },
    highlightValue: {
        fontSize: 19,
        letterSpacing: 2,
    },

    // Dial / api_response info box
    dialBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        marginBottom: 2,
    },
    dialText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 19,
    },

    // Footer branding
    footerBrand: {
        alignItems: 'center',
        paddingBottom: 22,
        gap: 6,
    },
    footerBrandName: {
        fontSize: 16,
        letterSpacing: -0.3,
    },
    footerNote: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 17,
    },

    // Action buttons
    actions: {
        marginTop: 6,
        gap: 10,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 14,
    },
    shareBtnText: {
        fontSize: 15,
        color: '#fff',
    },
    doneBtn: {
        height: 50,
        borderRadius: 14,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: 15,
    },
});
