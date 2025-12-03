import BiometricSetupModal from '@/components/services/BiometricSetupModal';
import TransactionPinModal from '@/components/services/TransactionPinModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/auth-context';
import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { authenticateWithBiometric, isBiometricAvailable, isBiometricEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function FundsTransferSummaryScreen() {
    const params = useLocalSearchParams();
    const { colors, fonts, isDark } = useTheme();
    const { user, refreshUser } = useAuth();
    const { transferFunds } = usePayment();
    const { showToast } = useToast();

    const [showPinModal, setShowPinModal] = useState(false);
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    const {
        selectedBank,
        bankName,
        accountNumber,
        accountName,
        amount,
        source,
        charge,
        total
    } = params;

    const accentColor = colors.primary;

    useEffect(() => {
        const checkBiometric = async () => {
            try {
                const available = await isBiometricAvailable();
                const enabled = await isBiometricEnabled();
                setBiometricAvailable(available);
                setBiometricEnabled(enabled);
            } catch (error) {
                console.error('Error checking biometric:', error);
                setBiometricAvailable(false);
                setBiometricEnabled(false);
            }
        };
        checkBiometric();
    }, []);

    const handleBiometric = async () => {
        // Check if biometric is enabled (PIN stored)
        if (!biometricEnabled) {
            // First time - show setup modal
            setShowBiometricSetup(true);
            return;
        }

        // Biometric is enabled - authenticate and get stored PIN
        setProcessing(true);
        const result = await authenticateWithBiometric();
        
        if (result.success && result.pin) {
            // Auto-submit with stored PIN
            await handlePinConfirm(result.pin);
        } else if (result.useFallback) {
            // User chose to use PIN instead
            setProcessing(false);
            setShowPinModal(true);
        } else if (result.cancelled) {
            // User cancelled
            setProcessing(false);
            showToast('info', 'Authentication cancelled');
        } else {
            // Authentication failed
            setProcessing(false);
            showToast('error', result.error || 'Biometric authentication failed');
            setShowPinModal(true);
        }
    };

    const handleBiometricSetupSuccess = async () => {
        setBiometricEnabled(true);
        showToast('success', 'Biometric authentication enabled successfully!');
    };

    const handlePinConfirm = async (pin) => {
        setProcessing(true);
        setShowPinModal(false);

        try {
            const response = await transferFunds(
                selectedBank,
                amount,
                accountNumber,
                source,
                pin
            );

            if (response.status === 'success') {
                await refreshUser();
                showToast('success', response.message || 'Fund transfer successful');
                
                // Navigate to success screen
                router.push({
                    pathname: '/(services)/transaction-success',
                    params: {
                        service: 'Funds Transfer',
                        beneficiary: accountNumber,
                        amount: amount,
                        network: bankName,
                        customerName: accountName,
                        transactionId: response.transaction_id || Date.now().toString(),
                        oldBalance: source === 'wallet' ? user?.wallet : user?.cashback,
                        newBalance: response.new_balance || (parseFloat(source === 'wallet' ? user?.wallet : user?.cashback || 0) - parseFloat(total)).toString()
                    }
                });
            } else {
                showToast('error', response.message || 'Transfer failed');
            }
        } catch (error) {
            showToast('error', error.message || 'Transfer failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Confirm Transfer
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <Text style={[styles.amount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    ₦{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Recipient
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {accountName}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Account Number
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {accountNumber}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Bank
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {bankName}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Transfer From
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {source === 'wallet' ? 'Wallet' : 'Cashback'}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Transfer Amount
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            ₦{parseFloat(amount).toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Transfer Fee
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            ₦{parseFloat(charge).toLocaleString()}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Total Deduction
                        </Text>
                        <Text style={[styles.summaryTotal, { color: accentColor, fontFamily: fonts.inter.bold }]}>
                            ₦{parseFloat(total).toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.authContainer}>
                    {biometricAvailable && (
                        <TouchableOpacity
                            style={styles.biometricButton}
                            onPress={handleBiometric}
                            activeOpacity={0.7}
                            disabled={processing}
                        >
                            <View style={[styles.biometricIcon, { backgroundColor: accentColor + '15' }]}>
                                <Ionicons name="finger-print" size={64} color={accentColor} />
                            </View>
                            <Text style={[styles.biometricText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                {biometricEnabled ? 'Authenticate with Biometric' : 'Set Up Biometric'}
                            </Text>
                            <Text style={[styles.biometricSubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {biometricEnabled 
                                    ? 'Quick and secure authentication' 
                                    : 'Enable for faster transactions'
                                }
                            </Text>
                        </TouchableOpacity>
                    )}

                    {biometricAvailable && (
                        <View style={styles.dividerContainer}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.icon + '30' }]} />
                            <Text style={[styles.dividerText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                or
                            </Text>
                            <View style={[styles.dividerLine, { backgroundColor: colors.icon + '30' }]} />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.pinButton, { backgroundColor: accentColor }]}
                        onPress={() => setShowPinModal(true)}
                        activeOpacity={0.8}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="keypad-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={[styles.pinButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    Continue with PIN
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <TransactionPinModal
                visible={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    setProcessing(false);
                }}
                onConfirm={handlePinConfirm}
                onError={() => {
                    showToast('error', 'Incorrect PIN. Please try again.');
                }}
            />

            <BiometricSetupModal
                visible={showBiometricSetup}
                onClose={() => setShowBiometricSetup(false)}
                onSuccess={handleBiometricSetupSuccess}
            />

            {processing && <LoadingOverlay visible={true} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    scrollContent: {
        paddingBottom: 30,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    amount: {
        fontSize: 36,
        textAlign: 'center',
        marginBottom: 24,
    },
    summaryCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        gap: 16,
        marginBottom: 32,
        width: '90%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 16 },
    summaryTotal: { fontSize: 18 },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    authContainer: {
        paddingHorizontal: 20,
        gap: 16,
        width: '100%',
    },
    biometricButton: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    biometricIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    biometricText: {
        fontSize: 15,
    },
    biometricSubtext: {
        fontSize: 12,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        marginHorizontal: 12,
    },
    pinButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinButtonText: {
        fontSize: 16,
        color: '#fff',
    },
});
