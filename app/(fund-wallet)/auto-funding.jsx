import Button from '@/components/ui/Button';
import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AutoFunding() {
    const { colors, fonts, isDark } = useTheme();
    const { accountDetails, generateAccount, loading } = usePayment();
    const { showToast } = useToast();
    const params = useLocalSearchParams();
    const [amount, setAmount] = useState(params.amount || '');
    const [generatingAccount, setGeneratingAccount] = useState(null);

    const quickAmounts = [1000, 2000, 5000, 10000];

    const virtualAccounts = accountDetails.virtual_accounts || {};
    const availableAccounts = Object.entries(virtualAccounts).filter(
        ([_, account]) => account.status === 'On'
    );

    const handleCopy = async (text, label) => {
        await Clipboard.setStringAsync(text);
        showToast('success', `${label} copied to clipboard`);
    };

    const handleGenerateAccount = async (accountType) => {
        setGeneratingAccount(accountType);
        try {
            const response = await generateAccount(accountType);
            
            if (response.icon === 'success' && response.accountNumber) {
                showToast('success', `Account generated: ${response.accountNumber}`);
            } else if (response.icon === 'success') {
                showToast('success', response.message || 'Account generated successfully');
            } else {
                showToast('error', response.message || 'Failed to generate account');
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to generate account');
        } finally {
            setGeneratingAccount(null);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Auto Funding
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Info Banner */}
                <View style={[styles.infoBanner, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="flash" size={20} color={colors.primary} />
                    <Text style={[styles.infoBannerText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Transfer to any account below. Funds reflect instantly.
                    </Text>
                </View>

                {/* Virtual Accounts List */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Virtual Accounts
                </Text>
                
                {availableAccounts.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            No virtual accounts available
                        </Text>
                    </View>
                ) : (
                    <View style={styles.accountsContainer}>
                        {availableAccounts.map(([key, account]) => (
                            <View
                                key={key}
                                style={[
                                    styles.accountCard,
                                    { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }
                                ]}
                            >
                                {/* Bank Header */}
                                <View style={styles.accountHeader}>
                                    <View style={[styles.bankIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="business" size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.bankHeaderInfo}>
                                        <Text style={[styles.bankName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            {account.name}
                                        </Text>
                                        <Text style={[styles.bankCharge, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Charge: {account.charge}
                                        </Text>
                                    </View>
                                </View>

                                {/* Account Number or Generate Button or KYC Button */}
                                {account.number ? (
                                    <View style={styles.accountNumberSection}>
                                        <View style={styles.accountNumberInfo}>
                                            <Text style={[styles.accountLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Account Number
                                            </Text>
                                            <Text style={[styles.accountNumber, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                                {account.number}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
                                            onPress={() => handleCopy(account.number, 'Account number')}
                                        >
                                            <Ionicons name="copy-outline" size={20} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : account.kyc !== 'verified' ? (
                                    <View style={styles.generateButtonSection}>
                                        <TouchableOpacity
                                            style={[
                                                styles.generateButton,
                                                { backgroundColor: '#F59E0B' }
                                            ]}
                                            onPress={() => router.push('/(profile)/kyc')}
                                        >
                                            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                                            <Text style={[styles.generateButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                                Verify KYC
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.kycNote, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            KYC verification required to generate account
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.generateButtonSection}>
                                        <TouchableOpacity
                                            style={[
                                                styles.generateButton,
                                                { backgroundColor: colors.primary },
                                                generatingAccount === key && { opacity: 0.6 }
                                            ]}
                                            onPress={() => handleGenerateAccount(key)}
                                            disabled={generatingAccount === key}
                                        >
                                            {generatingAccount === key ? (
                                                <>
                                                    <Ionicons name="hourglass-outline" size={18} color="#fff" />
                                                    <Text style={[styles.generateButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                                        Generating...
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                                                    <Text style={[styles.generateButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                                        Generate Account
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

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
                            Copy the account number above
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>2</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Open your bank app and transfer the exact amount
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>3</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Your wallet will be credited instantly
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <Button
                    title="Done"
                    onPress={() => router.back()}
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
    infoBanner: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    accountsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    accountCard: {
        padding: 16,
        borderRadius: 16,
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    bankIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bankHeaderInfo: {
        flex: 1,
    },
    bankName: {
        fontSize: 16,
        marginBottom: 4,
    },
    bankCharge: {
        fontSize: 12,
    },
    accountNumberSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.1)',
    },
    accountNumberInfo: {
        flex: 1,
    },
    accountLabel: {
        fontSize: 11,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    accountNumber: {
        fontSize: 18,
        letterSpacing: 1,
    },
    copyButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    generateButtonSection: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.1)',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    kycNote: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 16,
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
