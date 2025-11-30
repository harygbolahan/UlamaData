import TransactionPinModal from '@/components/services/TransactionPinModal';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EarnTab() {
    const { colors, fonts, isDark } = useTheme();
    const { getReferralData, user, withdrawCashback } = useAuth();
    const { showToast } = useToast();
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchReferralData();
        }, [])
    );

    const fetchReferralData = async () => {
        setIsLoading(true);
        const result = await getReferralData();
        if (result.success) {
            setReferralData(result.data);
        }
        setIsLoading(false);
    };

    const handleCopyCode = async () => {
        if (referralData?.referralCode) {
            await Clipboard.setStringAsync(referralData.referralCode);
            showToast('success', 'Referral code copied to clipboard');
        }
    };

    const handleShareCode = async () => {
        if (referralData?.referralCode) {
            try {
                await Share.share({
                    message: `Join me on DataBeta! Use my referral code: ${referralData.referralCode}`,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    const handleWithdrawPress = () => {
        const cashback = parseFloat(user?.cashback || 0);
        if (cashback <= 0) {
            showToast('error', 'You have no cashback to withdraw');
            return;
        }
        setShowWithdrawModal(true);
    };

    const handleWithdrawConfirm = () => {
        const amount = parseFloat(withdrawAmount);
        const cashback = parseFloat(user?.cashback || 0);

        if (!withdrawAmount || amount <= 0) {
            showToast('error', 'Please enter a valid amount');
            return;
        }

        if (amount > cashback) {
            showToast('error', 'Amount exceeds available cashback');
            return;
        }

        setShowWithdrawModal(false);
        setShowPinModal(true);
    };

    const handlePinConfirm = async (pin) => {
        const amount = parseFloat(withdrawAmount);
        
        const result = await withdrawCashback(amount, pin);
        
        if (result.success) {
            setShowPinModal(false);
            setWithdrawAmount('');
            return true;
        } else {
            return false;
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Earn Rewards
                </Text>
                <TouchableOpacity>
                    <Ionicons name="information-circle-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.balanceRow}>
                        <View>
                            <Text style={[styles.balanceLabel, { fontFamily: fonts.inter.regular }]}>
                                Total Earnings
                            </Text>
                            <Text style={[styles.balanceAmount, { fontFamily: fonts.inter.bold }]}>
                                ₦{user?.cashback || '0'}
                            </Text>
                        </View>
                        <View style={styles.pointsBadge}>
                            <Ionicons name="people" size={16} color="#FFD700" />
                            <Text style={[styles.pointsText, { fontFamily: fonts.inter.semiBold }]}>
                                {referralData?.totalReferrals || 0} referrals
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.withdrawButton}
                        onPress={handleWithdrawPress}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                        <Text style={[styles.withdrawButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Withdraw to Wallet
                        </Text>
                    </TouchableOpacity>
                </View>


                {/* Referral Card */}
                <View style={[styles.referralCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.referralTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Your Referral Code
                    </Text>
                    <View style={[styles.codeContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.codeText, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            {referralData?.referralCode || 'N/A'}
                        </Text>
                        <TouchableOpacity onPress={handleCopyCode}>
                            <Ionicons name="copy-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        style={[styles.shareButton, { backgroundColor: colors.primary }]}
                        onPress={handleShareCode}
                    >
                        <Ionicons name="share-social" size={18} color="#fff" />
                        <Text style={[styles.shareText, { fontFamily: fonts.inter.semiBold }]}>
                            Share Code
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Withdraw Amount Modal */}
            {showWithdrawModal && (
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => {
                            setShowWithdrawModal(false);
                            setWithdrawAmount('');
                        }}
                    />
                    <View style={[styles.withdrawModalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3a3a3a' : '#d0d0d0' }]} />
                        
                        <Text style={[styles.withdrawModalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Withdraw Cashback
                        </Text>
                        <Text style={[styles.withdrawModalSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Available: ₦{user?.cashback || '0'}
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <Text style={[styles.currencySymbol, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                ₦
                            </Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text, fontFamily: fonts.inter.semiBold }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.icon}
                                keyboardType="numeric"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                                autoFocus
                            />
                        </View>

                        <View style={styles.quickAmounts}>
                            {['25', '50', '100', 'All'].map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[styles.quickAmountButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                    onPress={() => {
                                        if (amount === 'All') {
                                            setWithdrawAmount(user?.cashback || '0');
                                        } else {
                                            setWithdrawAmount(amount);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.quickAmountText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        {amount === 'All' ? 'All' : `₦${amount}`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                            onPress={handleWithdrawConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.confirmButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Transaction PIN Modal */}
            <TransactionPinModal
                visible={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    setWithdrawAmount('');
                }}
                onConfirm={handlePinConfirm}
                enableBiometric={false}
            />
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
    headerTitle: { fontSize: 22 },
    balanceCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    withdrawButtonText: {
        fontSize: 14,
    },
    balanceLabel: { color: '#fff', fontSize: 12, opacity: 0.9, marginBottom: 6 },
    balanceAmount: { color: '#fff', fontSize: 28 },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 5,
    },
    pointsText: { color: '#fff', fontSize: 11 },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
    earnCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    earnIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    earnInfo: { flex: 1 },
    earnTitle: { fontSize: 14, marginBottom: 4 },
    earnDesc: { fontSize: 12, marginBottom: 8 },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },
    referralCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginTop: 12,
    },
    referralTitle: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    codeText: { fontSize: 18, letterSpacing: 2 },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    shareText: { color: '#fff', fontSize: 14 },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    withdrawModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
    },
    modalHandle: {
        width: 48,
        height: 5,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    withdrawModalTitle: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    withdrawModalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    currencySymbol: {
        fontSize: 24,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        padding: 0,
    },
    quickAmounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    quickAmountButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 13,
    },
    confirmButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
