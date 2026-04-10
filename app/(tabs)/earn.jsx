import TransactionPinModal from '@/components/services/TransactionPinModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { authenticateWithBiometric, isBiometricAvailable, isBiometricEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EarnTab() {
    const { colors, fonts, isDark } = useTheme();
    const { getReferralData, user, withdrawCashback } = useAuth();
    const { showToast } = useToast();
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchReferralData();
            checkBiometricStatus();
        }, [])
    );

    const checkBiometricStatus = async () => {
        const available = await isBiometricAvailable();
        const enabled = await isBiometricEnabled();
        setBiometricAvailable(available);
        setBiometricEnabled(enabled);
    };

    const fetchReferralData = async () => {
        setIsLoading(true);
        const result = await getReferralData();
        if (result.success) {
            setReferralData(result.data);
        }
        setIsLoading(false);
    };

    console.log('Referral Data:', referralData)


    const handleCopyCode = async () => {
        const link = referralData?.referralLink || `https://ulamadata.ng/register?ref=${user?.id || referralData?.referralCode || user?.referral_code}`;
        if (link) {
            await Clipboard.setStringAsync(link);
            showToast('success', 'Referral link copied to clipboard');
        }
    };

    const handleShareCode = async () => {
        const link = referralData?.referralLink || `https://ulamadata.ng/register?ref=${user?.id || referralData?.referralCode || user?.referral_code}`;
        if (link) {
            try {
                await Share.share({
                    message: `Join me on UlamaData! Use my referral link: ${link}`,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Recently';
        }
    };

    const handleReferralPress = (referral) => {
        setSelectedReferral(referral);
        setShowDetailsModal(true);
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
        setTimeout(() => {
            setShowPinModal(true);
        }, 100);
    };

    const handleBiometric = async () => {
        if (!biometricEnabled) {
            showToast('info', 'Please enable biometrics in security settings first');
            return;
        }

        const amount = parseFloat(withdrawAmount);
        const cashback = parseFloat(user?.cashback || 0);

        if (amount > cashback) {
            showToast('error', 'Amount exceeds available cashback');
            return;
        }

        setIsProcessing(true);
        const result = await authenticateWithBiometric();

        if (result.success && result.pin) {
            const success = await handlePinConfirm(result.pin);
            if (success) {
                setShowWithdrawModal(false);
            }
        } else if (!result.cancelled && !result.useFallback) {
            showToast('error', result.error || 'Biometric authentication failed');
        }
        setIsProcessing(false);
    };

    const handlePinConfirm = async (pin) => {
        setShowPinModal(false);
        setIsProcessing(true);

        const amount = parseFloat(withdrawAmount);

        try {
            const result = await withdrawCashback(amount, pin);
            setIsProcessing(false);

            if (result.success) {
                setWithdrawAmount('');
                return true;
            } else {
                return false;
            }
        } catch (error) {
            setIsProcessing(false);
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
                                Total Referral Earnings
                            </Text>
                            <Text style={[styles.balanceAmount, { fontFamily: fonts.inter.bold }]}>
                                ₦{referralData?.totalEarnings || '0'}
                            </Text>
                        </View>
                        <View style={styles.pointsBadge}>
                            <Ionicons name="people" size={16} color="#FFD700" />
                            <Text style={[styles.pointsText, { fontFamily: fonts.inter.semiBold }]}>
                                {referralData?.totalReferrals || 0} referrals
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cashbackContainer}>
                        <Text style={[styles.cashbackLabel, { color: '#fff', fontFamily: fonts.inter.regular }]}>Available Cashback: ₦{user?.cashback || '0'}</Text>
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
                        Your Referral Link
                    </Text>
                    <View style={[styles.codeContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]} numberOfLines={1} ellipsizeMode="middle">
                            {referralData?.referralLink || `https://ulamadata.ng/register?ref=${user?.id || referralData?.referralCode || user?.referral_code || ''}`}
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
                            Share Link
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Referral List */}
                {referralData?.referrals?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Your Recent Referrals
                        </Text>
                        <View style={styles.referralsContainer}>
                            {referralData.referrals.map((referral, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.referralItem, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                    onPress={() => handleReferralPress(referral)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.referralAvatar, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.referralInitial, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                            {referral.name?.charAt(0).toUpperCase() || 'U'}
                                        </Text>
                                    </View>
                                    <View style={styles.referralInfo}>
                                        <Text style={[styles.referralName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            {referral.name || 'User'}
                                        </Text>
                                        <View style={styles.referralMeta}>
                                            <Text style={[styles.referralDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Joined {formatDate(referral.created_at)}
                                            </Text>
                                            <Text style={[styles.referralDot, { color: colors.icon }]}>•</Text>
                                            <Text style={[styles.referralTransactions, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                                {referral.transaction_count || 0} Trx
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.referralBadge, { backgroundColor: '#10B981' + '20' }]}>
                                        <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Referral Details Modal */}
            <Modal
                visible={showDetailsModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowDetailsModal(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#333' : '#ddd' }]} />

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Referral Details
                            </Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedReferral && (
                            <View style={styles.detailsContainer}>
                                <View style={styles.detailsHeader}>
                                    <View style={[styles.detailsAvatar, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.detailsInitial, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                            {selectedReferral.name?.charAt(0).toUpperCase() || 'U'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.detailsName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        {selectedReferral.name || 'User'}
                                    </Text>

                                </View>

                                <View style={styles.infoList}>
                                    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Email Address
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {selectedReferral.email || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                        <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Joined Date
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {formatDate(selectedReferral.created_at)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                        <Ionicons name="list-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Total Transactions
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {selectedReferral.transaction_count || 0}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoItem, { borderBottomColor: 'transparent' }]}>
                                        <Ionicons name="id-card-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Referral ID
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                #{selectedReferral.id || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Withdraw Amount Modal */}
            <Modal
                visible={showWithdrawModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowWithdrawModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => {
                            setShowWithdrawModal(false);
                            setWithdrawAmount('');
                        }}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoidingView}
                    >
                        <View style={[styles.withdrawModalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.withdrawModalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    Withdraw Cashback
                                </Text>
                                <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

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

                            <View style={{ gap: 12 }}>
                                {biometricAvailable && biometricEnabled && (
                                    <TouchableOpacity
                                        style={[styles.biometricConfirmButton, { borderColor: colors.primary, borderWidth: 1 }]}
                                        onPress={handleBiometric}
                                        activeOpacity={0.7}
                                        disabled={isProcessing}
                                    >
                                        <Ionicons name={Platform.OS === 'ios' ? 'scan' : 'finger-print'} size={20} color={colors.primary} />
                                        <Text style={[styles.biometricConfirmText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                            {Platform.OS === 'ios' ? 'FaceID' : 'Fingerprint'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                    onPress={handleWithdrawConfirm}
                                    activeOpacity={0.8}
                                    disabled={isProcessing}
                                >
                                    <Ionicons name="keypad-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={[styles.confirmButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                        {biometricAvailable && biometricEnabled ? 'Continue with PIN' : 'Continue'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Transaction PIN Modal */}
            <TransactionPinModal
                visible={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    setWithdrawAmount('');
                }}
                onConfirm={handlePinConfirm}
            />

            {isProcessing && <LoadingOverlay visible={true} />}
        </View >
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
    cashbackContainer: {
        marginBottom: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    cashbackLabel: {
        fontSize: 13,
        opacity: 0.9,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 16 },
    referralsContainer: {
        paddingHorizontal: 20,
    },
    referralItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    referralAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    referralInitial: {
        fontSize: 18,
    },
    referralInfo: {
        flex: 1,
    },
    referralName: {
        fontSize: 14,
        marginBottom: 2,
    },
    referralMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    referralDate: {
        fontSize: 12,
    },
    referralDot: {
        fontSize: 12,
        opacity: 0.5,
    },
    referralTransactions: {
        fontSize: 12,
    },
    referralBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    linkText: {
        fontSize: 14,
        flex: 1,
        marginRight: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoidingView: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backdrop: {
        flex: 1,
    },
    withdrawModalContent: {
        width: '100%',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    withdrawModalTitle: {
        fontSize: 20,
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
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    biometricConfirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    biometricConfirmText: {
        fontSize: 16,
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
    },
    detailsContainer: {
        alignItems: 'center',
    },
    detailsHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    detailsAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailsInitial: {
        fontSize: 32,
    },
    detailsName: {
        fontSize: 22,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
    },
    infoList: {
        width: '100%',
        gap: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    infoText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
    },
});
