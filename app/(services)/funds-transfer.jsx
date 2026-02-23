import { useAuth } from '@/contexts/auth-context';
import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { useApiColors } from '@/hooks/use-api-colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FundsTransferScreen() {
    const { fonts, isDark } = useTheme();
    const colors = useApiColors();
    const { user, refreshUser } = useAuth();
    const { getBanks, getTransferCharge, validateAccount, transferFunds } = usePayment();
    const { showToast } = useToast();

    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('wallet');
    const [transferCharge, setTransferCharge] = useState({ charge: 0, charge2: 0 });

    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankSearchQuery, setBankSearchQuery] = useState('');

    useEffect(() => {
        loadBanks();
        loadTransferCharge();
    }, []);

    const loadBanks = async () => {
        try {
            const data = await getBanks();
            setBanks(data || []);
        } catch (error) {
            showToast('error', 'Failed to load banks');
        }
    };

    const loadTransferCharge = async () => {
        try {
            const data = await getTransferCharge();
            setTransferCharge(data);
        } catch (error) {
            console.error('Failed to load transfer charge:', error);
        }
    };

    const handleValidateAccount = async () => {
        if (!selectedBank || !accountNumber) {
            return;
        }

        if (accountNumber.length !== 10) {
            return;
        }

        setValidating(true);
        setAccountName('');

        try {
            const response = await validateAccount(selectedBank, accountNumber);
            if (response?.name && response.name !== 'Could not verify the account') {
                setAccountName(response.name);
            } else {
                // Don't show toast for validation failures, just clear the account name
                setAccountName('');
            }
        } catch (error) {
            // Silently handle validation errors - user can retry by changing account number
            setAccountName('');
            console.log('Account validation failed:', error.message);
        } finally {
            setValidating(false);
        }
    };

    useEffect(() => {
        if (accountNumber.length === 10 && selectedBank) {
            handleValidateAccount();
        } else {
            setAccountName('');
        }
    }, [accountNumber, selectedBank]);

    const calculateTotal = () => {
        const amountNum = parseFloat(amount) || 0;
        // Use charge2 for UlamaData (001), charge for other banks
        const charge = selectedBank === '001' ? transferCharge.charge2 : transferCharge.charge;
        return amountNum + charge;
    };

    const getAvailableBalance = () => {
        return source === 'wallet' ? parseFloat(user?.wallet || 0) : parseFloat(user?.cashback || 0);
    };

    const isTransferDisabled = () => {
        if (!selectedBank || !accountNumber || !accountName || !amount) return true;
        if (parseFloat(amount) <= 0) return true;
        const total = calculateTotal();
        const availableBalance = getAvailableBalance();
        return total > availableBalance;
    };

    const handleTransfer = () => {
        if (!selectedBank) {
            showToast('error', 'Please select a bank');
            return;
        }
        if (!accountNumber || accountNumber.length !== 10) {
            showToast('error', 'Please enter a valid 10-digit account number');
            return;
        }
        if (!accountName) {
            showToast('error', 'Please validate the account first');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            showToast('error', 'Please enter a valid amount');
            return;
        }

        const total = calculateTotal();
        const availableBalance = getAvailableBalance();

        if (total > availableBalance) {
            showToast('error', `Insufficient balance. You need ₦${total.toLocaleString()}`);
            return;
        }

        // Navigate to transaction summary
        router.push({
            pathname: '/(services)/funds-transfer-summary',
            params: {
                selectedBank,
                bankName: banks.find(b => b.code === selectedBank)?.name || 'Bank',
                accountNumber,
                accountName,
                amount,
                source,
                charge: charge.toString(),
                total: total.toString()
            }
        });
    };

    const accentColor = colors.primary;
    // Use charge2 for UlamaData (001), charge for other banks
    const charge = selectedBank === '001' ? transferCharge.charge2 : transferCharge.charge;
    const availableBalance = getAvailableBalance();
    const total = calculateTotal();
    const hasInsufficientBalance = total > availableBalance && amount && parseFloat(amount) > 0;

    const filteredBanks = banks.filter(bank =>
        bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
    );

    const selectedBankName = banks.find(b => b.code === selectedBank)?.name || '';

    const handleSelectBank = (bankCode) => {
        setSelectedBank(bankCode);
        setShowBankModal(false);
        setBankSearchQuery('');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: accentColor }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.primaryText, fontFamily: fonts.inter.bold }]}>
                        Transfer Funds
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                    {/* Balance Cards */}
                    <View style={styles.balanceCards}>
                        <TouchableOpacity
                            style={[
                                styles.balanceCard,
                                {
                                    backgroundColor: source === 'wallet' ? accentColor + '15' : (colors.isDark ? '#1f1f1f' : '#fff'),
                                    borderColor: source === 'wallet' ? accentColor : 'transparent',
                                    borderWidth: 2
                                }
                            ]}
                            onPress={() => setSource('wallet')}
                            activeOpacity={0.7}
                        >

                            <Text style={[styles.balanceCardLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Wallet Balance
                            </Text>
                            <Text style={[styles.balanceCardValue, { color: source === 'wallet' ? accentColor : colors.text, fontFamily: fonts.inter.bold }]}>
                                ₦{balanceVisible ? parseFloat(user?.wallet || 0).toLocaleString() : '****'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.balanceCard,
                                {
                                    backgroundColor: source === 'cashback' ? accentColor + '15' : (colors.isDark ? '#1f1f1f' : '#fff'),
                                    borderColor: source === 'cashback' ? accentColor : 'transparent',
                                    borderWidth: 2
                                }
                            ]}
                            onPress={() => setSource('cashback')}
                            activeOpacity={0.7}
                        >

                            <Text style={[styles.balanceCardLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Cashback Balance
                            </Text>
                            <Text style={[styles.balanceCardValue, { color: source === 'cashback' ? accentColor : colors.text, fontFamily: fonts.inter.bold }]}>
                                ₦{balanceVisible ? parseFloat(user?.cashback || 0).toLocaleString() : '****'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Bank Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Select Bank
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.bankSelector,
                                    {
                                        backgroundColor: colors.isDark ? '#1f1f1f' : '#fff',
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => setShowBankModal(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="business-outline" size={20} color={colors.icon} />
                                <Text
                                    style={[
                                        styles.bankSelectorText,
                                        {
                                            color: selectedBankName ? colors.text : colors.icon,
                                            fontFamily: fonts.inter.regular
                                        }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {selectedBankName || 'Choose a bank'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Account Number */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Account Number
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="card-outline" size={20} color={colors.icon} style={styles.inputIconLeft} />
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.isDark ? '#1f1f1f' : '#fff',
                                            color: colors.text,
                                            borderColor: colors.border,
                                            fontFamily: fonts.inter.regular
                                        }
                                    ]}
                                    placeholder="Enter 10-digit account number"
                                    placeholderTextColor={colors.icon}
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                {validating && (
                                    <ActivityIndicator size="small" color={accentColor} style={styles.inputIconRight} />
                                )}
                            </View>
                            {accountName ? (
                                <View style={[styles.accountNameContainer, { backgroundColor: colors.success + '15' }]}>
                                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                    <Text style={[styles.accountName, { color: colors.success, fontFamily: fonts.inter.semiBold }]}>
                                        {accountName}
                                    </Text>
                                </View>
                            ) : accountNumber.length === 10 && !validating ? (
                                <View style={[styles.accountNameContainer, { backgroundColor: colors.error + '15' }]}>
                                    <Ionicons name="alert-circle" size={18} color={colors.error} />
                                    <Text style={[styles.accountName, { color: colors.error, fontFamily: fonts.inter.regular }]}>
                                        Could not verify account. Please check details.
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Amount */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Amount
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.currencySymbol, { color: colors.icon, fontFamily: fonts.inter.semiBold }]}>
                                    ₦
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.amountInput,
                                        {
                                            backgroundColor: colors.isDark ? '#1f1f1f' : '#fff',
                                            color: colors.text,
                                            borderColor: hasInsufficientBalance ? colors.error : colors.border,
                                            fontFamily: fonts.inter.semiBold
                                        }
                                    ]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.icon}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />
                            </View>
                            {hasInsufficientBalance && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={14} color={colors.error} />
                                    <Text style={[styles.errorText, { color: colors.error, fontFamily: fonts.inter.regular }]}>
                                        Insufficient balance. Need ₦{(total - availableBalance).toLocaleString()} more
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Summary */}
                        {amount && parseFloat(amount) > 0 && (
                            <View style={[styles.summaryCard, { backgroundColor: colors.isDark ? '#1f1f1f' : '#F8F9FA' }]}>
                                <View style={styles.summaryHeader}>
                                    <Ionicons name="receipt-outline" size={20} color={accentColor} />
                                    <Text style={[styles.summaryTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        Transaction Summary
                                    </Text>
                                </View>
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
                                        ₦{charge.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        Total Deduction
                                    </Text>
                                    <Text style={[styles.summaryTotal, { color: accentColor, fontFamily: fonts.inter.bold }]}>
                                        ₦{total.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Transfer Button */}
                <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.transferButton,
                            {
                                backgroundColor: isTransferDisabled() ? colors.icon + '30' : accentColor,
                            }
                        ]}
                        onPress={handleTransfer}
                        disabled={isTransferDisabled() || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={[styles.transferButtonText, { fontFamily: fonts.inter.bold }]}>
                                    Transfer ₦{amount ? parseFloat(amount).toLocaleString() : '0'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Bank Selection Modal */}
            <Modal
                visible={showBankModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBankModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Select Bank
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowBankModal(false);
                                    setBankSearchQuery('');
                                }}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        backgroundColor: colors.isDark ? '#1f1f1f' : '#F8F9FA',
                                        color: colors.text,
                                        fontFamily: fonts.inter.regular
                                    }
                                ]}
                                placeholder="Search banks..."
                                placeholderTextColor={colors.icon}
                                value={bankSearchQuery}
                                onChangeText={setBankSearchQuery}
                                autoFocus
                            />
                            {bankSearchQuery ? (
                                <TouchableOpacity
                                    onPress={() => setBankSearchQuery('')}
                                    style={styles.clearSearchButton}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.icon} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Banks List */}
                        <FlatList
                            data={filteredBanks}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.bankItem,
                                        {
                                            backgroundColor: selectedBank === item.code
                                                ? accentColor + '15'
                                                : 'transparent'
                                        }
                                    ]}
                                    onPress={() => handleSelectBank(item.code)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.bankItemContent}>
                                        <Ionicons
                                            name="business"
                                            size={20}
                                            color={selectedBank === item.code ? accentColor : colors.icon}
                                        />
                                        <Text
                                            style={[
                                                styles.bankItemText,
                                                {
                                                    color: selectedBank === item.code ? accentColor : colors.text,
                                                    fontFamily: selectedBank === item.code
                                                        ? fonts.inter.semiBold
                                                        : fonts.inter.regular
                                                }
                                            ]}
                                        >
                                            {item.name}
                                        </Text>
                                    </View>
                                    {selectedBank === item.code && (
                                        <Ionicons name="checkmark-circle" size={22} color={accentColor} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="search-outline" size={48} color={colors.icon} />
                                    <Text style={[styles.emptyStateText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        No banks found
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20
    },
    backButton: { width: 40 },
    headerTitle: { fontSize: 18 },
    content: { flex: 1, paddingHorizontal: 16 },
    balanceCards: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        marginBottom: 24
    },
    balanceCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12
    },
    balanceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    balanceCardLabel: { fontSize: 11, marginBottom: 4 },
    balanceCardValue: { fontSize: 18 },
    form: { paddingBottom: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, marginBottom: 8 },
    bankSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        gap: 12
    },
    bankSelectorText: {
        flex: 1,
        fontSize: 15
    },
    inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
    inputIconLeft: {
        position: 'absolute',
        left: 14,
        zIndex: 1
    },
    inputIconRight: {
        position: 'absolute',
        right: 14,
        zIndex: 1
    },
    currencySymbol: {
        position: 'absolute',
        left: 14,
        fontSize: 16,
        zIndex: 1
    },
    input: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        paddingLeft: 44,
        fontSize: 15
    },
    amountInput: {
        fontSize: 18
    },
    accountNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 10,
        borderRadius: 8,
        gap: 8
    },
    accountName: { fontSize: 14 },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6
    },
    errorText: { fontSize: 12 },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 8
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
    },
    summaryTitle: { fontSize: 15 },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14 },
    summaryTotal: { fontSize: 18 },
    summaryDivider: {
        height: 1,
        marginVertical: 8
    },
    footer: {
        padding: 16,
        borderTopWidth: 1
    },
    transferButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8
    },
    transferButtonText: {
        color: '#fff',
        fontSize: 16
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 20
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1
    },
    modalTitle: {
        fontSize: 18
    },
    modalCloseButton: {
        padding: 4
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        position: 'relative'
    },
    searchIcon: {
        position: 'absolute',
        left: 32,
        zIndex: 1
    },
    searchInput: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        paddingLeft: 40,
        paddingRight: 40,
        fontSize: 15
    },
    clearSearchButton: {
        position: 'absolute',
        right: 32,
        zIndex: 1
    },
    bankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 12,
        marginBottom: 4,
        borderRadius: 12
    },
    bankItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1
    },
    bankItemText: {
        fontSize: 15,
        flex: 1
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48
    },
    emptyStateText: {
        fontSize: 15,
        marginTop: 12
    }
});
