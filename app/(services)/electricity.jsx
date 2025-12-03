import NetworkSelector from '@/components/services/NetworkSelector';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ElectricityScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchElectricityProviders, validateElectricity } = useServices();
    const { showToast } = useToast();
    const [meterNumber, setMeterNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [meterType, setMeterType] = useState('prepaid');
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedInfo, setVerifiedInfo] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loadingProviders, setLoadingProviders] = useState(true);

    const quickAmounts = [1000, 2000, 5000, 10000, 15000, 20000];

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            setLoadingProviders(true);
            const data = await fetchElectricityProviders();
            setProviders(data);
        } catch (error) {
            console.error('Error loading providers:', error);
            showToast('error', 'Failed to load electricity providers');
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleVerify = async () => {
        if (!selectedProvider || !meterNumber || meterNumber.length < 10) return;

        setIsVerifying(true);
        try {
            const response = await validateElectricity(
                selectedProvider.id,
                meterType,
                meterNumber
            );

            if (response.status === 'success') {
                setVerifiedInfo({
                    name: response.name || response.message,
                    address: response.customer_address || '',
                    outstandingAmount: response.outstandingAmount || ''
                });
                showToast('success', 'Meter verified successfully');
            }
        } catch (error) {
            console.error('Error verifying meter:', error);
            showToast('error', error.message || 'Failed to verify meter number');
            setVerifiedInfo(null);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleQuickAmountSelect = (quickAmount) => {
        setAmount(quickAmount.toString());

        if (selectedProvider && meterNumber && verifiedInfo) {
            // Check minimum amount
            const minAmount = parseFloat(selectedProvider.minAmount || 0);
            if (quickAmount < minAmount) {
                showToast('error', `Minimum amount is ₦${minAmount.toLocaleString()}`);
                return;
            }

            setTimeout(() => {
                router.push({
                    pathname: '/(services)/transaction-summary',
                    params: {
                        service: 'electricity',
                        serviceType: 'Electricity Bill',
                        beneficiary: meterNumber,
                        amount: quickAmount.toString(),
                        provider: selectedProvider.name,
                        providerId: selectedProvider.id,
                        meterType: meterType.charAt(0).toUpperCase() + meterType.slice(1),
                        customerName: verifiedInfo.name,
                        customerAddress: verifiedInfo.address,
                        outstandingAmount: verifiedInfo.outstandingAmount || '',
                    }
                });
            }, 300);
        }
    };

    if (loadingProviders) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Electricity
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Loading providers...
                    </Text>
                </View>
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
                    Electricity
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Provider Selection */}
                <TouchableOpacity
                    style={[styles.providerSelector, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                    onPress={() => setShowProviderModal(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.providerSelectorLeft}>
                        {selectedProvider ? (
                            <View style={[styles.providerIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="flash" size={16} color={colors.primary} />
                            </View>
                        ) : (
                            <View style={[styles.providerIcon, { backgroundColor: colors.icon + '30' }]}>
                                <Ionicons name="flash-outline" size={16} color={colors.icon} />
                            </View>
                        )}
                        <Text style={[
                            styles.providerSelectorText,
                            { 
                                color: selectedProvider ? colors.text : colors.icon,
                                fontFamily: fonts.inter.regular 
                            }
                        ]}>
                            {selectedProvider ? selectedProvider.name : 'Select Provider'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.icon} />
                </TouchableOpacity>

                {/* Meter Number Input with Beneficiary Support */}
                <NetworkSelector
                    selectedNetwork={null}
                    onNetworkSelect={() => {}}
                    phoneNumber={meterNumber}
                    onPhoneNumberChange={(text) => {
                        setMeterNumber(text);
                        setVerifiedInfo(null);
                    }}
                    onSelectBeneficiary={(beneficiary) => {
                        setMeterNumber(beneficiary.phoneNumber);
                        const provider = providers.find(p => 
                            p.name.toLowerCase() === beneficiary.network.toLowerCase()
                        );
                        if (provider) {
                            setSelectedProvider(provider);
                        }
                        setVerifiedInfo(null);
                    }}
                    beneficiaryType="electricity"
                    networks={[]}
                />

                <TouchableOpacity
                    style={[
                        styles.verifyButtonFull, 
                        { 
                            backgroundColor: colors.primary,
                            opacity: (!selectedProvider || meterNumber.length < 10) ? 0.5 : 1
                        }
                    ]}
                    onPress={handleVerify}
                    disabled={isVerifying || !selectedProvider || meterNumber.length < 10}
                >
                    {isVerifying ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={[styles.verifyText, { fontFamily: fonts.inter.semiBold }]}>Verify Meter Number</Text>
                    )}
                </TouchableOpacity>

                {/* Verified Info */}
                {verifiedInfo && (
                    <View style={[styles.verifiedCard, { backgroundColor: colors.success + '15' }]}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <View style={styles.verifiedInfo}>
                            <Text style={[styles.verifiedName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {verifiedInfo.name}
                            </Text>
                            {verifiedInfo.address && (
                                <Text style={[styles.verifiedAddress, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {verifiedInfo.address}
                                </Text>
                            )}
                            {verifiedInfo.outstandingAmount && (
                                <Text style={[styles.verifiedAddress, { color: '#FF5252', fontFamily: fonts.inter.medium }]}>
                                    Outstanding: ₦{parseFloat(verifiedInfo.outstandingAmount).toLocaleString()}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Meter Type Toggle */}
                <View style={styles.meterTypes}>
                    <TouchableOpacity
                        style={[
                            styles.meterTypeChip,
                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                            meterType === 'prepaid' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setMeterType('prepaid')}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.meterTypeText,
                            { fontFamily: fonts.inter.semiBold },
                            meterType === 'prepaid' ? { color: '#fff' } : { color: colors.text }
                        ]}>
                            Prepaid
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.meterTypeChip,
                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                            meterType === 'postpaid' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setMeterType('postpaid')}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.meterTypeText,
                            { fontFamily: fonts.inter.semiBold },
                            meterType === 'postpaid' ? { color: '#fff' } : { color: colors.text }
                        ]}>
                            Postpaid
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Enter Amount
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

                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Quick Amount
                </Text>

                <View style={styles.quickAmountsGrid}>
                    {quickAmounts.map((quickAmount) => (
                        <TouchableOpacity
                            key={quickAmount}
                            style={[
                                styles.quickAmountCard,
                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                amount === quickAmount.toString() && {
                                    backgroundColor: colors.primary + '20',
                                    borderColor: colors.primary,
                                    borderWidth: 2
                                }
                            ]}
                            onPress={() => handleQuickAmountSelect(quickAmount)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.quickAmountText,
                                {
                                    color: amount === quickAmount.toString() ? colors.primary : colors.text,
                                    fontFamily: fonts.inter.semiBold
                                }
                            ]}>
                                ₦{quickAmount.toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            <Modal visible={showProviderModal} transparent animationType="slide">
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowProviderModal(false)}
                >
                    <TouchableOpacity 
                        style={[styles.modalContent, { backgroundColor: colors.background }]} 
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Select Provider
                        </Text>
                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            style={styles.modalScroll}
                        >
                            {providers.map((provider) => (
                                <TouchableOpacity
                                    key={provider.id}
                                    style={[styles.option, { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                    onPress={() => {
                                        setSelectedProvider(provider);
                                        setShowProviderModal(false);
                                        setVerifiedInfo(null);
                                        setMeterNumber('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionLeft}>
                                        <View style={[styles.icon, { backgroundColor: colors.primary + '20' }]}>
                                            <Ionicons name="flash" size={20} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                                {provider.name}
                                            </Text>
                                            {provider.discount && (
                                                <Text style={[styles.discountText, { color: colors.success, fontFamily: fonts.inter.regular }]}>
                                                    {provider.discount}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
    },
    providerSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    providerSelectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    providerSelectorText: {
        fontSize: 15,
    },
    providerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyButtonFull: {
        marginHorizontal: 20,
        marginTop: -12,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyText: {
        color: '#fff',
        fontSize: 12,
    },
    verifiedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
    },
    verifiedInfo: {
        flex: 1,
    },
    verifiedName: {
        fontSize: 14,
        marginBottom: 2,
    },
    verifiedAddress: {
        fontSize: 12,
    },
    meterTypes: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    meterTypeChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    meterTypeText: { fontSize: 14 },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
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
    quickAmountsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
    },
    quickAmountCard: {
        width: '30%',
        margin: '1.66%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickAmountText: { fontSize: 14 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '60%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
    modalScroll: {
        flexGrow: 0,
    },
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
    },
    iconEmoji: { fontSize: 20 },
    optionText: { fontSize: 15 },
    discountText: { fontSize: 11, marginTop: 2 },
});
