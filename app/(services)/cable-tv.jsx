import NetworkSelector from '@/components/services/NetworkSelector';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CABLE_IMAGES = {
    dstv: require('@/assets/cableLogos/dstv.png'),
    gotv: require('@/assets/cableLogos/gotv.png'),
    startimes: require('@/assets/cableLogos/startimes.png'),
    showmax: require('@/assets/cableLogos/showmax.png'),
    '6CmbpwAHJc': require('@/assets/cableLogos/showmax.png'), // Showmax API pid
};

const CABLE_BACKGROUNDS = {
    dstv: 'rgba(0, 102, 204, 0.2)',
    gotv: 'rgba(255, 0, 0, 0.2)',
    startimes: 'rgba(255, 165, 0, 0.2)',
    showmax: 'rgba(139, 0, 139, 0.2)',
    '6CmbpwAHJc': 'rgba(139, 0, 139, 0.2)', // Showmax API pid
};

export default function CableTVScreen() {
    const { colors, fonts, isDark } = useTheme();
    const servicesContext = useServices();
    
    // Debug: Log what's available in the context
    console.log('Services Context Keys:', Object.keys(servicesContext));
    console.log('fetchCableProviders type:', typeof servicesContext.fetchCableProviders);
    
    const { fetchCableProviders, fetchCablePlans, validateCable } = servicesContext;
    const [smartCardNumber, setSmartCardNumber] = useState('');
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedInfo, setVerifiedInfo] = useState(null);
    const [providers, setProviders] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingPlans, setLoadingPlans] = useState(false);

    useEffect(() => {
        loadProviders();
    }, []);

    useEffect(() => {
        if (selectedProvider) {
            loadPlans();
        }
    }, [selectedProvider]);

    // Set GOtv as default provider once providers are loaded
    useEffect(() => {
        if (providers.length > 0 && !selectedProvider) {
            const gotvProvider = providers.find(p => 
                p.name.toLowerCase().includes('gotv') || 
                p.pid === 'gotv'
            );
            if (gotvProvider) {
                setSelectedProvider(gotvProvider);
            }
        }
    }, [providers]);

    const loadProviders = async () => {
        try {
            setLoadingProviders(true);
            const data = await fetchCableProviders();
            console.log('Cable Providers:', data); // Debug: Check provider structure
            setProviders(data);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to load cable providers');
        } finally {
            setLoadingProviders(false);
        }
    };

    const loadPlans = async () => {
        try {
            setLoadingPlans(true);
            setPlans([]);
            const data = await fetchCablePlans(selectedProvider.name);
            setPlans(data);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to load plans');
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleVerify = async () => {
        if (!selectedProvider || !smartCardNumber || smartCardNumber.length < 10) return;

        setIsVerifying(true);
        try {
            const data = await validateCable(selectedProvider.name, smartCardNumber);
            setVerifiedInfo({
                name: data.name,
                outstandingAmount: data.outstandingAmount
            });
        } catch (error) {
            Alert.alert('Verification Failed', error.message || 'Could not verify smart card number');
            setVerifiedInfo(null);
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePlanSelect = (plan) => {
        if (!selectedProvider || !smartCardNumber || !verifiedInfo) return;

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: 'cable',
                serviceType: 'Cable TV Subscription',
                beneficiary: smartCardNumber,
                amount: plan.price.toString(),
                provider: selectedProvider.name,
                planId: plan.name, // Use plan name (e.g., "GOtv Smallie - monthly N1900")
                planName: plan.name,
                customerName: verifiedInfo.name,
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Cable TV
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Provider & Smart Card Input */}
                        <NetworkSelector
                            selectedNetwork={selectedProvider ? {
                                id: selectedProvider.pid || selectedProvider.name.toLowerCase(),
                                name: selectedProvider.name
                            } : null}
                            onNetworkSelect={(network) => {
                                const provider = providers.find(p => 
                                    p.pid === network.id || p.name.toLowerCase() === network.id
                                );
                                if (provider) {
                                    setSelectedProvider(provider);
                                    setVerifiedInfo(null);
                                }
                            }}
                            phoneNumber={smartCardNumber}
                            onPhoneNumberChange={(text) => {
                                setSmartCardNumber(text);
                                setVerifiedInfo(null);
                            }}
                            onSelectBeneficiary={(beneficiary) => {
                                setSmartCardNumber(beneficiary.phoneNumber);
                                const provider = providers.find(p => 
                                    p.name.toLowerCase() === beneficiary.network.toLowerCase()
                                );
                                if (provider) {
                                    setSelectedProvider(provider);
                                }
                                setVerifiedInfo(null);
                            }}
                            beneficiaryType="cable"
                            networks={providers.map(p => ({
                                id: p.pid || p.name.toLowerCase(),
                                name: p.name
                            }))}
                            customImages={CABLE_IMAGES}
                            customBackgrounds={CABLE_BACKGROUNDS}
                        />

                        <TouchableOpacity
                            style={[
                                styles.verifyButton, 
                                { 
                                    backgroundColor: colors.primary,
                                    marginHorizontal: 20,
                                    marginTop: -12,
                                    marginBottom: 20,
                                    opacity: (!selectedProvider || smartCardNumber.length < 10) ? 0.5 : 1
                                }
                            ]}
                            onPress={handleVerify}
                            disabled={isVerifying || !selectedProvider || smartCardNumber.length < 10}
                        >
                            {isVerifying ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[styles.verifyText, { fontFamily: fonts.inter.semiBold }]}>Verify Smart Card</Text>
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
                                    {verifiedInfo.outstandingAmount && (
                                        <Text style={[styles.verifiedPackage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Outstanding: ₦{verifiedInfo.outstandingAmount}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Select Plan
                        </Text>

                        {plans.length === 0 && !loadingPlans ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="file-tray-outline" size={48} color={colors.icon} />
                                <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {selectedProvider ? 'No plans available' : 'Select a provider to view plans'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.plansGrid}>
                                {plans.map((plan) => (
                                    <TouchableOpacity
                                        key={plan.id}
                                        style={[
                                            styles.planCard,
                                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                            !verifiedInfo && { opacity: 0.5 }
                                        ]}
                                        onPress={() => handlePlanSelect(plan)}
                                        activeOpacity={0.7}
                                        disabled={!verifiedInfo}
                                    >
                                        <View style={[styles.planLabel, { backgroundColor: colors.primary + '20' }]}>
                                            <Text style={[styles.planLabelText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                {selectedProvider?.name || 'Cable TV'}
                                            </Text>
                                        </View>
                                        <Text style={[styles.planName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {plan.name}
                                        </Text>
                                        <View style={styles.planDetails}>
                                            <Text style={[styles.planPrice, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                                ₦{parseFloat(plan.price).toLocaleString()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                <View style={{ height: 30 }} />
            </ScrollView>

            <LoadingOverlay visible={loadingProviders || loadingPlans} />

            <Modal visible={showProviderModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Select Provider
                        </Text>
                        {providers.map((provider) => {
                            // Try multiple ways to find the image: pid, lowercase name, or name
                            const lowerName = provider.name.toLowerCase();
                            const providerImage = CABLE_IMAGES[provider.pid] || CABLE_IMAGES[lowerName] || CABLE_IMAGES[provider.name];
                            const providerBg = CABLE_BACKGROUNDS[provider.pid] || CABLE_BACKGROUNDS[lowerName] || CABLE_BACKGROUNDS[provider.name] || 'rgba(128, 128, 128, 0.2)';
                            
                            return (
                                <TouchableOpacity
                                    key={provider.id}
                                    style={[styles.option, { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                    onPress={() => {
                                        setSelectedProvider(provider);
                                        setShowProviderModal(false);
                                        setVerifiedInfo(null);
                                        setSmartCardNumber('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionLeft}>
                                        <View style={[styles.icon, { backgroundColor: providerBg }]}>
                                            {providerImage ? (
                                                <Image
                                                    source={providerImage}
                                                    style={styles.iconImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Ionicons name="tv-outline" size={20} color={colors.icon} />
                                            )}
                                        </View>
                                        <View>
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
                            );
                        })}
                    </View>
                </View>
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
    verifyButton: {
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
        marginBottom: 20,
        gap: 10,
    },
    verifiedInfo: {
        flex: 1,
    },
    verifiedName: {
        fontSize: 14,
        marginBottom: 2,
    },
    verifiedPackage: {
        fontSize: 12,
    },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
    plansGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
    },
    planCard: {
        width: '45%',
        margin: '1.5%',
        padding: 16,
        borderRadius: 12,
    },
    planLabel: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    planLabelText: { fontSize: 10 },
    planName: { fontSize: 16, marginBottom: 8 },
    planDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    planPrice: { fontSize: 16 },
    planDuration: { fontSize: 12 },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    discountText: {
        fontSize: 11,
        marginTop: 2,
    },
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
        overflow: 'hidden',
    },
    iconImage: {
        width: 40,
        height: 40,
    },
    optionText: { fontSize: 15 },
});
