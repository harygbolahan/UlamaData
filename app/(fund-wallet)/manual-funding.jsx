import Button from '@/components/ui/Button';
import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManualFunding() {
    const { colors, fonts, isDark } = useTheme();
    const { accountDetails, submitManualPayment } = usePayment();
    const { showToast } = useToast();
    const params = useLocalSearchParams();
    const [amount, setAmount] = useState(params.amount || '');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [submitting, setSubmitting] = useState(false);

    const manualAccounts = accountDetails.manual_accounts || {};
    const availableAccounts = Object.entries(manualAccounts);

    const paymentMethods = ['Bank Transfer', 'POS', 'ATM', 'USSD'];
    const quickAmounts = [1000, 2000, 5000, 10000];

    const handleCopy = async (text, label) => {
        await Clipboard.setStringAsync(text);
        showToast('success', `${label} copied to clipboard`);
    };

    const handleSubmit = async () => {
        if (!selectedAccount) {
            showToast('warning', 'Please select an account');
            return;
        }

        setSubmitting(true);
        try {
            const [bankName, accountInfo] = selectedAccount;
            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            const response = await submitManualPayment(
                parseFloat(amount),
                accountInfo.number,
                accountInfo.name,
                paymentMethod,
                currentDate
            );

            if (response.status === 'success') {
                showToast('success', response.message || 'Request submitted successfully');
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                showToast('error', response.message || 'Failed to submit request');
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Manual Funding
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Amount Input */}
                <View style={styles.amountSection}>
                    <Text style={[styles.amountLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Enter Amount
                    </Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={[styles.currencySymbol, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            ₦
                        </Text>
                        <TextInput
                            placeholder="0"
                            placeholderTextColor={colors.icon}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            style={[styles.amountInput, { color: colors.text, fontFamily: fonts.inter.bold }]}
                        />
                    </View>
                </View>

                {/* Quick Amounts */}
                <View style={styles.quickAmountsContainer}>
                    {quickAmounts.map((quickAmount) => (
                        <TouchableOpacity
                            key={quickAmount}
                            style={[
                                styles.quickAmountChip,
                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                amount === quickAmount.toString() && {
                                    backgroundColor: colors.primary,
                                }
                            ]}
                            onPress={() => setAmount(quickAmount.toString())}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.quickAmountText,
                                { fontFamily: fonts.inter.semiBold },
                                amount === quickAmount.toString() ? { color: '#fff' } : { color: colors.text }
                            ]}>
                                ₦{quickAmount.toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Account Selection */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Select Account
                </Text>
                
                {availableAccounts.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            No manual accounts available
                        </Text>
                    </View>
                ) : (
                    <View style={styles.accountsContainer}>
                        {availableAccounts.map(([bankName, accountInfo]) => (
                            <TouchableOpacity
                                key={bankName}
                                style={[
                                    styles.accountCard,
                                    { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                    selectedAccount?.[0] === bankName && {
                                        backgroundColor: colors.primary + '15',
                                        borderColor: colors.primary,
                                        borderWidth: 2
                                    }
                                ]}
                                onPress={() => setSelectedAccount([bankName, accountInfo])}
                                activeOpacity={0.7}
                            >
                                <View style={styles.accountInfo}>
                                    <Text style={[styles.bankName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        {bankName}
                                    </Text>
                                    <Text style={[styles.accountName, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        {accountInfo.name}
                                    </Text>
                                    <Text style={[styles.accountNumber, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        {accountInfo.number}
                                    </Text>
                                    <Text style={[styles.charge, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        Charge: {accountInfo.charge}
                                    </Text>
                                </View>
                                {selectedAccount?.[0] === bankName && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Account Details */}
                {selectedAccount && (
                    <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={styles.detailsHeader}>
                            <Ionicons name="card-outline" size={24} color={colors.primary} />
                            <Text style={[styles.detailsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Transfer Details
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Bank Name
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    {selectedAccount[0]}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Account Name
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    {selectedAccount[1].name}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
                                onPress={() => handleCopy(selectedAccount[1].name, 'Account name')}
                            >
                                <Ionicons name="copy-outline" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Account Number
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    {selectedAccount[1].number}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
                                onPress={() => handleCopy(selectedAccount[1].number, 'Account number')}
                            >
                                <Ionicons name="copy-outline" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Payment Method */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Payment Method
                </Text>
                <View style={styles.methodsContainer}>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method}
                            style={[
                                styles.methodChip,
                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                paymentMethod === method && {
                                    backgroundColor: colors.primary,
                                }
                            ]}
                            onPress={() => setPaymentMethod(method)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.methodText,
                                { fontFamily: fonts.inter.semiBold },
                                paymentMethod === method ? { color: '#fff' } : { color: colors.text }
                            ]}>
                                {method}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        After making the transfer, click submit below. Your request will be reviewed and your wallet credited within 24 hours.
                    </Text>
                </View>

                {/* Instructions */}
                <View style={[styles.instructionsCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        How to Fund
                    </Text>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>1</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Transfer ₦{parseFloat(amount).toLocaleString()} to the account above
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>2</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Select your payment method
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>3</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Click submit and wait for confirmation
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <Button
                    title={submitting ? 'Submitting...' : 'Submit Request'}
                    onPress={handleSubmit}
                    disabled={!selectedAccount || submitting}
                    style={{ opacity: (!selectedAccount || submitting) ? 0.5 : 1 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    amountSection: {
        marginBottom: 16,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 13,
        marginBottom: 12,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        minWidth: 100,
        textAlign: 'center',
    },
    quickAmountsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    quickAmountChip: {
        flex: 1,
        minWidth: '47%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    accountsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    accountCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
    },
    accountInfo: {
        flex: 1,
    },
    bankName: {
        fontSize: 15,
        marginBottom: 4,
    },
    accountName: {
        fontSize: 13,
        marginBottom: 4,
    },
    accountNumber: {
        fontSize: 14,
        marginBottom: 4,
    },
    charge: {
        fontSize: 12,
    },
    detailsCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
    },
    copyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    methodChip: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    methodText: {
        fontSize: 14,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    instructionsCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    instructionsTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepText: {
        color: '#fff',
        fontSize: 14,
    },
    instructionText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    emptyState: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
