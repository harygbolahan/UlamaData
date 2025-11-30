import TransactionPinModal from '@/components/services/TransactionPinModal';
import { useAuth } from '@/contexts/auth-context';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const networkLogos = {
    'MTN': require('@/assets/networks/mtn.png'),
    'Airtel': require('@/assets/networks/airtel.png'),
    'Glo': require('@/assets/networks/glo.png'),
    '9mobile': require('@/assets/networks/9mobile.png'),
};

export default function AirtimeSwapScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const { 
        fetchSwapMethod, 
        fetchSwapNetworks, 
        fetchSwapDetails,
        swapAirtimeManual,
        requestSwapOtp,
        verifySwapOtp
    } = useServices();

    const [swapMethod, setSwapMethod] = useState(null);
    const [networks, setNetworks] = useState([]);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [swapDetails, setSwapDetails] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showConfirmationDrawer, setShowConfirmationDrawer] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpIdentifier, setOtpIdentifier] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingNetworks, setLoadingNetworks] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        initializeSwap();
    }, []);

    useEffect(() => {
        if (selectedNetwork) {
            loadSwapDetails();
        }
    }, [selectedNetwork]);

    const initializeSwap = async () => {
        try {
            setLoadingNetworks(true);
            
            // Fetch swap method
            const methodData = await fetchSwapMethod();
            setSwapMethod(methodData.method);

            // Fetch networks
            const networksData = await fetchSwapNetworks();
            setNetworks(networksData);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to load swap data');
        } finally {
            setLoadingNetworks(false);
        }
    };

    const loadSwapDetails = async () => {
        try {
            const details = await fetchSwapDetails(selectedNetwork.network);
            setSwapDetails(details);
        } catch (error) {
            console.error('Error loading swap details:', error);
        }
    };

    const getConvertedAmount = () => {
        if (!amount || !swapDetails) return 0;
        return (parseFloat(amount) * parseFloat(swapDetails.price)) / 100;
    };

    const handleContinue = () => {
        if (!selectedNetwork || !phoneNumber || !amount) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (phoneNumber.length !== 11) {
            Alert.alert('Error', 'Please enter a valid 11-digit phone number');
            return;
        }

        if (parseFloat(amount) < 100) {
            Alert.alert('Error', 'Minimum swap amount is ₦100');
            return;
        }

        if (swapMethod === 'auto') {
            handleAutoSwap();
        } else {
            // For manual swap, show confirmation drawer first
            setShowConfirmationDrawer(true);
        }
    };

    const handleAutoSwap = async () => {
        try {
            setLoading(true);
            
            // Request OTP
            const otpResponse = await requestSwapOtp(selectedNetwork.id, phoneNumber);
            setOtpIdentifier(otpResponse.identifier);
            setShowOtpModal(true);
            
            Alert.alert('Success', otpResponse.message);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        try {
            setLoading(true);
            
            const verifyResponse = await verifySwapOtp(otpIdentifier, otp);
            setSessionId(verifyResponse.sessionId);
            
            Alert.alert(
                'Success',
                `${verifyResponse.message}\nAirtime Balance: ${verifyResponse.airtimeBalance}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setShowOtpModal(false);
                            setShowPinModal(true);
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePinConfirm = async (pin) => {
        if (!pin || pin.length !== 5) {
            showToast('error', 'Please enter your 5-digit PIN');
            return false;
        }

        try {
            setProcessing(true);
            
            const response = await swapAirtimeManual(
                selectedNetwork.network,
                amount,
                '1',
                phoneNumber,
                pin
            );

            // Update user balance if provided
            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            setShowPinModal(false);
            
            // Navigate to success screen with swap details
            router.push({
                pathname: '/(services)/transaction-success',
                params: {
                    service: 'Airtime to Cash',
                    beneficiary: phoneNumber,
                    amount: getConvertedAmount().toString(),
                    network: selectedNetwork.network,
                    airtimeAmount: amount,
                    conversionRate: `${swapDetails.price}%`,
                    transactionId: response['request-id'] || Date.now().toString(),
                    apiResponse: response.response || swapDetails?.note || 'You will be credited immediately we receive the airtime.',
                    oldBalance: response.old_balance?.toString(),
                    newBalance: response.new_balance?.toString(),
                    status: response.Status || response.status || 'Pending'
                }
            });
            
            return true;
        } catch (error) {
            setProcessing(false);
            const errorMessage = error.message || 'Transaction failed';
            showToast('error', errorMessage);
            
            if (errorMessage.toLowerCase().includes('pin')) {
                return false;
            }
            
            return false;
        }
    };

    if (loadingNetworks) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                    Loading swap data...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Airtime to Cash
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Info Banner */}
                <View style={[styles.infoBanner, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
                    <View style={styles.infoBannerText}>
                        <Text style={[styles.infoBannerTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Convert Airtime to Cash
                        </Text>
                        <Text style={[styles.infoBannerSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            {swapMethod === 'auto' ? 'Automatic conversion with OTP verification' : 'Instantly convert your airtime to wallet balance'}
                        </Text>
                    </View>
                </View>

                {/* Network Selector */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Select Network
                </Text>
                <TouchableOpacity
                    style={[styles.networkCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                    onPress={() => setShowNetworkModal(true)}
                >
                    {selectedNetwork ? (
                        <View style={styles.networkSelected}>
                            <View style={[styles.networkIcon, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                                <Image 
                                    source={networkLogos[selectedNetwork.network]} 
                                    style={styles.networkLogo}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.networkInfo}>
                                <Text style={[styles.networkName, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    {selectedNetwork.network}
                                </Text>
                                {swapDetails && (
                                    <Text style={[styles.networkRate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        Conversion rate: {swapDetails.price}%
                                    </Text>
                                )}
                            </View>
                        </View>
                    ) : (
                        <Text style={[styles.placeholder, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Tap to select network
                        </Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>

                {/* Phone Number */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Phone Number
                </Text>
                <View style={[styles.input, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <TextInput
                        placeholder="Enter phone number"
                        placeholderTextColor={colors.icon}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={11}
                        style={[styles.inputText, { color: colors.text, fontFamily: fonts.inter.regular }]}
                    />
                </View>

                {/* Amount */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Airtime Amount
                </Text>
                <View style={[styles.amountInput, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.currency, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>₦</Text>
                    <TextInput
                        placeholder="0.00"
                        placeholderTextColor={colors.icon}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        style={[styles.amountInputText, { color: colors.text, fontFamily: fonts.inter.bold }]}
                    />
                </View>

                {/* Conversion Preview */}
                {amount && swapDetails && parseFloat(amount) > 0 && (
                    <View style={[styles.conversionCard, { backgroundColor: colors.success + '15' }]}>
                        <View style={styles.conversionRow}>
                            <View style={styles.conversionItem}>
                                <Text style={[styles.conversionLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Airtime Amount
                                </Text>
                                <Text style={[styles.conversionValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    ₦{parseFloat(amount).toLocaleString()}
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={24} color={colors.success} />
                            <View style={styles.conversionItem}>
                                <Text style={[styles.conversionLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    You'll Receive
                                </Text>
                                <Text style={[styles.conversionValue, { color: colors.success, fontFamily: fonts.inter.bold }]}>
                                    ₦{getConvertedAmount().toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.conversionNote}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.icon} />
                            <Text style={[styles.conversionNoteText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Conversion rate: {swapDetails.price}%
                            </Text>
                        </View>
                    </View>
                )}

                {/* Instructions */}
                {swapDetails && (
                    <View style={[styles.instructionsCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {swapMethod === 'auto' ? 'How Auto Swap Works' : 'How it works'}
                        </Text>
                        {swapMethod === 'auto' ? (
                            <>
                                <View style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>1</Text>
                                    </View>
                                    <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                        Enter your phone number and amount
                                    </Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>2</Text>
                                    </View>
                                    <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                        Verify with OTP sent to your number
                                    </Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>3</Text>
                                    </View>
                                    <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                        Airtime is automatically deducted and cash credited
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>1</Text>
                                    </View>
                                    <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                        Transfer airtime to the number we provide
                                    </Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>2</Text>
                                    </View>
                                    <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                        We verify the transfer within 5 minutes
                                    </Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>3</Text>
                                    </View>
                                    <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                        Cash is credited to your wallet instantly
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Continue Button */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        { backgroundColor: colors.primary },
                        (!selectedNetwork || !phoneNumber || !amount || loading || processing) && { opacity: 0.5 }
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedNetwork || !phoneNumber || !amount || loading || processing}
                    activeOpacity={0.8}
                >
                    {(loading || processing) ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={[styles.continueText, { fontFamily: fonts.inter.semiBold }]}>
                            Continue
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Network Modal */}
            <Modal visible={showNetworkModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => setShowNetworkModal(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Select Network
                        </Text>
                        {networks.map((network) => (
                            <TouchableOpacity
                                key={network.id}
                                style={[styles.option, { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                onPress={() => {
                                    setSelectedNetwork(network);
                                    setShowNetworkModal(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionLeft}>
                                    <View style={[styles.icon, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                                        <Image 
                                            source={networkLogos[network.network]} 
                                            style={styles.networkLogo}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View>
                                        <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                            {network.network}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* OTP Modal (for auto swap) */}
            <Modal visible={showOtpModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => !loading && setShowOtpModal(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Enter OTP
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Enter the 6-digit code sent to {phoneNumber}
                        </Text>
                        
                        <View style={[styles.input, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5', marginTop: 20 }]}>
                            <TextInput
                                placeholder="Enter OTP"
                                placeholderTextColor={colors.icon}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                style={[styles.inputText, { color: colors.text, fontFamily: fonts.inter.regular, textAlign: 'center', fontSize: 24 }]}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.continueButton, { backgroundColor: colors.primary, marginTop: 20 }, loading && { opacity: 0.5 }]}
                            onPress={handleVerifyOtp}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.continueText, { fontFamily: fonts.inter.semiBold }]}>
                                    Verify OTP
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Drawer (Manual Swap) */}
            <Modal visible={showConfirmationDrawer} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => !processing && setShowConfirmationDrawer(false)}
                    />
                    <View style={[styles.confirmationDrawer, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3a3a3a' : '#d0d0d0' }]} />
                        
                        <View style={[styles.confirmationHeader, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="information-circle" size={48} color={colors.primary} />
                        </View>

                        <Text style={[styles.confirmationTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Transfer Instructions
                        </Text>

                        <View style={[styles.confirmationCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <View style={styles.confirmationRow}>
                                <Text style={[styles.confirmationLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Network
                                </Text>
                                <Text style={[styles.confirmationValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    {selectedNetwork?.network}
                                </Text>
                            </View>
                            <View style={styles.confirmationRow}>
                                <Text style={[styles.confirmationLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Airtime Amount
                                </Text>
                                <Text style={[styles.confirmationValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    ₦{parseFloat(amount).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.confirmationRow}>
                                <Text style={[styles.confirmationLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    You'll Receive
                                </Text>
                                <Text style={[styles.confirmationValue, { color: colors.success, fontFamily: fonts.inter.bold }]}>
                                    ₦{getConvertedAmount().toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        {swapDetails?.note && (
                            <View style={[styles.instructionBox, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                                <Ionicons name="alert-circle" size={20} color={colors.warning} />
                                <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    {swapDetails.note}
                                </Text>
                            </View>
                        )}

                        <Text style={[styles.confirmationNote, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Please transfer the airtime to the number above. You will be credited immediately after we receive and verify the transfer.
                        </Text>

                        <View style={styles.confirmationActions}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                onPress={() => setShowConfirmationDrawer(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    setShowConfirmationDrawer(false);
                                    setShowPinModal(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.confirmButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    I Understand, Continue
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* PIN Modal */}
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
    loadingText: { marginTop: 12, fontSize: 14 },
    infoBanner: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    infoBannerText: { flex: 1 },
    infoBannerTitle: { fontSize: 14, marginBottom: 4 },
    infoBannerSubtitle: { fontSize: 12 },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
    networkCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    networkSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    networkIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    networkLogo: {
        width: '100%',
        height: '100%',
    },
    networkInfo: { flex: 1 },
    networkName: { fontSize: 14, marginBottom: 2 },
    networkRate: { fontSize: 12 },
    placeholder: { fontSize: 14 },
    input: {
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    inputText: { fontSize: 14 },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    currency: { fontSize: 24 },
    amountInputText: { flex: 1, fontSize: 32 },
    conversionCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    conversionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    conversionItem: { flex: 1 },
    conversionLabel: { fontSize: 12, marginBottom: 4 },
    conversionValue: { fontSize: 20 },
    conversionNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    conversionNoteText: { fontSize: 12 },
    instructionsCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        gap: 16,
    },
    instructionsTitle: { fontSize: 14, marginBottom: 4 },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: { fontSize: 12, color: '#fff' },
    instructionText: { flex: 1, fontSize: 13 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
    },
    continueButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueText: { fontSize: 16, color: '#fff' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: { flex: 1 },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    optionText: { fontSize: 15, marginBottom: 2 },
    confirmationDrawer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
        maxHeight: '80%',
    },
    confirmationHeader: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    confirmationCard: {
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 16,
    },
    confirmationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    confirmationLabel: {
        fontSize: 14,
    },
    confirmationValue: {
        fontSize: 14,
    },
    instructionBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    confirmationNote: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    confirmationActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
    },
    confirmButton: {
        flex: 1.5,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        color: '#fff',
    },
});
