import BiometricSetupModal from '@/components/services/BiometricSetupModal';
import TransactionPinModal from '@/components/services/TransactionPinModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/auth-context';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { authenticateWithBiometric, isBiometricAvailable, isBiometricEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        swapAirtimeAuto,
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
    const [transferPin, setTransferPin] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingNetworks, setLoadingNetworks] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);

    useEffect(() => {
        initializeSwap();
    }, []);

    useEffect(() => {
        if (selectedNetwork) {
            loadSwapDetails();
        }
    }, [selectedNetwork]);

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

    const initializeSwap = async () => {
        try {
            setLoadingNetworks(true);

            // Fetch swap method
            try {
                const methodData = await fetchSwapMethod();
                // Handle different potential API response structures
                const method = methodData.method || (methodData.data && methodData.data.method) || 'manual';
                setSwapMethod(method);
            } catch (err) {
                console.error('Error fetching swap method:', err);
                setSwapMethod('manual'); // Fallback to manual
            }

            // Fetch networks
            try {
                const networksData = await fetchSwapNetworks();
                setNetworks(Array.isArray(networksData) ? networksData : (networksData.data || []));
            } catch (err) {
                console.error('Error fetching networks:', err);
            }
        } catch (error) {
            console.error('Initialization error:', error);
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
            if (!transferPin) {
                Alert.alert('Error', 'Please enter your SIM transfer PIN');
                return;
            }
            handleAutoSwap();
        } else {
            // Validate manual fields
            if (!bankName || !accountNumber || !accountName) {
                Alert.alert('Error', 'Please fill all account details');
                return;
            }
            if (accountNumber.length !== 10) {
                Alert.alert('Error', 'Account number must be 10 digits');
                return;
            }
            // For manual swap, show confirmation drawer first
            setShowConfirmationDrawer(true);
        }
    };

    const handleAutoSwap = async () => {
        try {
            setLoading(true);

            // Request OTP
            const otpResponse = await requestSwapOtp(selectedNetwork.network, phoneNumber);
            setOtpIdentifier(otpResponse.identifier);
            setShowOtpModal(true);

            Alert.alert('Success', otpResponse.message);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthentication = async () => {
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

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert('Error', 'Please enter a valid OTP');
            return;
        }

        try {
            setLoading(true);

            const verifyResponse = await verifySwapOtp(selectedNetwork.network, phoneNumber, otp);

            Alert.alert(
                'Success',
                `${verifyResponse.message}\nAirtime Balance: ${verifyResponse.airtimeBalance}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setShowOtpModal(false);
                            handleAuthentication();
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

            if (swapMethod === 'auto') {
                const response = await swapAirtimeAuto(
                    selectedNetwork.network,
                    amount,
                    '1',
                    phoneNumber,
                    otp,
                    transferPin,
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
                        apiResponse: response.response || swapDetails?.guide || swapDetails?.note || 'You will be credited immediately we receive the airtime.',
                        oldBalance: response.old_balance?.toString(),
                        newBalance: response.new_balance?.toString(),
                        status: response.Status || response.status || 'Pending'
                    }
                });

                return true;
            } else {
                // Manual Swap - Send to WhatsApp
                if (!swapDetails?.admin_phone) {
                    setProcessing(false);
                    setShowPinModal(false);
                    Alert.alert(
                        'Admin Contact Missing',
                        'We couldn\'t find the admin contact for this network. Please try again later.'
                    );
                    return false;
                }

                const message = `*AIRTIME SWAP REQUEST (MANUAL)*\n\n` +
                    `*Network:* ${selectedNetwork.network}\n` +
                    `*Phone Number:* ${phoneNumber}\n` +
                    `*Airtime Amount:* ₦${parseFloat(amount).toLocaleString()}\n` +
                    `*Expected Amount:* ₦${getConvertedAmount().toLocaleString()}\n\n` +
                    `*User Account Details:*\n` +
                    `*Bank:* ${bankName}\n` +
                    `*Acc Number:* ${accountNumber}\n` +
                    `*Acc Name:* ${accountName}\n\n` +
                    `I have processed the payment. Please verify and credit my account.`;

                // Construct WhatsApp URL using admin_phone
                const adminPhone = swapDetails.admin_phone.replace(/\D/g, '');
                const waNumber = adminPhone.startsWith('234') ? adminPhone : `234${adminPhone.replace(/^0/, '')}`;
                const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

                setProcessing(false);
                setShowPinModal(false);

                try {
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                        await Linking.openURL(url);
                    } else {
                        Alert.alert('Error', 'WhatsApp is not installed or the link is invalid.');
                    }
                } catch (err) {
                    console.error('Error opening WhatsApp:', err);
                    Alert.alert('Error', 'Could not open WhatsApp');
                }

                router.back();
                return true;
            }
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
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

                    {/* Transfer PIN (Auto Swap) */}
                    {swapMethod === 'auto' && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                SIM Transfer PIN
                            </Text>
                            <View style={[styles.input, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <TextInput
                                    placeholder="Enter your 4-digit transfer PIN"
                                    placeholderTextColor={colors.icon}
                                    value={transferPin}
                                    onChangeText={setTransferPin}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    secureTextEntry
                                    style={[styles.inputText, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                />
                            </View>
                        </>
                    )}

                    {/* Manual Swap Account Details */}
                    {swapMethod !== 'auto' && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Bank Name
                            </Text>
                            <View style={[styles.input, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <TextInput
                                    placeholder="Enter bank name"
                                    placeholderTextColor={colors.icon}
                                    value={bankName}
                                    onChangeText={setBankName}
                                    style={[styles.inputText, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                />
                            </View>

                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Account Number
                            </Text>
                            <View style={[styles.input, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <TextInput
                                    placeholder="Enter 10-digit account number"
                                    placeholderTextColor={colors.icon}
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    keyboardType="numeric"
                                    maxLength={10}
                                    style={[styles.inputText, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                />
                            </View>

                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Account Name
                            </Text>
                            <View style={[styles.input, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <TextInput
                                    placeholder="Enter account name"
                                    placeholderTextColor={colors.icon}
                                    value={accountName}
                                    onChangeText={setAccountName}
                                    style={[styles.inputText, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                />
                            </View>
                        </>
                    )}

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
                {(selectedNetwork && phoneNumber.length === 11 && amount && (swapMethod === 'auto' ? transferPin : (bankName && accountNumber.length === 10 && accountName))) && (
                    <View style={[styles.footer, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                { backgroundColor: colors.primary },
                                (loading || processing) && { opacity: 0.5 }
                            ]}
                            onPress={handleContinue}
                            disabled={loading || processing}
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
                )}

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

                            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
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

                                {swapDetails && (
                                    <View style={[styles.transferInfoCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                        <View style={styles.transferInfoHeader}>
                                            <Text style={[styles.transferInfoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Step 1: Transfer Airtime to:
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.copyBadge, { backgroundColor: colors.primary + '15' }]}
                                                onPress={async () => {
                                                    await Clipboard.setStringAsync(swapDetails.admin_phone);
                                                    showToast('success', 'Phone number copied!');
                                                }}
                                            >
                                                <Ionicons name="copy-outline" size={12} color={colors.primary} />
                                                <Text style={[styles.copyBadgeText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                    Copy
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={[styles.transferNumber, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {swapDetails.admin_phone}
                                        </Text>

                                        <View style={[styles.divider, { backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0' }]} />

                                        <Text style={[styles.transferInfoLabel, { color: colors.icon, fontFamily: fonts.inter.regular, marginTop: 12 }]}>
                                            Step 2: Transfer Instructions:
                                        </Text>
                                        <View style={[styles.guideBox, { backgroundColor: colors.primary + '08' }]}>
                                            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                                            <Text style={[styles.guideText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                                {swapDetails.guide}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {swapDetails?.note && (
                                    <View style={[styles.instructionBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
                                        <Ionicons name="alert-circle" size={20} color={colors.warning} />
                                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                            {swapDetails.note}
                                        </Text>
                                    </View>
                                )}

                                <Text style={[styles.confirmationNote, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Please transfer the airtime to the number above. You will be credited immediately after we receive and verify the transfer.
                                </Text>
                            </ScrollView>

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
                                        handleAuthentication();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.confirmButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                        {swapMethod === 'auto' ? 'I Understand, Continue' : 'I Have Transferred, Send Details'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <BiometricSetupModal
                    visible={showBiometricSetup}
                    onClose={() => {
                        setShowBiometricSetup(false);
                        setShowPinModal(true);
                    }}
                    onSuccess={handleBiometricSetupSuccess}
                />

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

                <LoadingOverlay visible={loadingNetworks || loading || processing} />
            </KeyboardAvoidingView>
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
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10
    },
    confirmButtonText: {
        fontSize: 15,
        color: '#fff',
        alignContent: 'center',

    },
    transferInfoCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    transferInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    transferInfoLabel: {
        fontSize: 12,
    },
    copyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    copyBadgeText: {
        fontSize: 12,
    },
    transferNumber: {
        fontSize: 24,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    guideBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        gap: 10,
        marginTop: 8,
    },
    guideText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
