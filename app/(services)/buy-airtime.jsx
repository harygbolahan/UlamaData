import BeneficiaryList from '@/components/services/BeneficiaryList';
import NetworkSelector from '@/components/services/NetworkSelector';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuyAirtimeScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchAirtimeNetworks, fetchAirtimeTypes } = useServices();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('airtime');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState(null);

    const [networks, setNetworks] = useState([]);
    const [airtimeTypes, setAirtimeTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);

    const [loadingNetworks, setLoadingNetworks] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);

    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    // Fetch networks and types on mount
    useEffect(() => {
        loadNetworks();
        loadAirtimeTypes();
    }, []);

    // Auto-select MTN as default network once networks are loaded
    useEffect(() => {
        if (networks.length > 0 && !selectedNetwork) {
            const mtnNetwork = networks.find(n => n.network.toUpperCase() === 'MTN');
            if (mtnNetwork) {
                setSelectedNetwork({
                    id: mtnNetwork.network.toLowerCase(),
                    name: mtnNetwork.network.toUpperCase()
                });
            }
        }
    }, [networks]);

    const loadNetworks = async () => {
        setLoadingNetworks(true);
        try {
            const data = await fetchAirtimeNetworks();
            setNetworks(data);
        } catch (error) {
            showToast('error', error.message || 'Failed to load networks');
        } finally {
            setLoadingNetworks(false);
        }
    };

    const loadAirtimeTypes = async () => {
        setLoadingTypes(true);
        try {
            const types = await fetchAirtimeTypes();
            setAirtimeTypes(types);
            if (types.length > 0) {
                setSelectedType(types[0].type);
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to load airtime types');
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleQuickAmountSelect = async (quickAmount) => {
        setAmount(quickAmount.toString());

        if (selectedNetwork && phoneNumber && phoneNumber.length === 11) {
            proceedToSummary(quickAmount.toString());
        }
    };

    const handleContinue = async () => {
        if (!selectedNetwork || !amount || !phoneNumber) {
            showToast('warning', 'Please fill all fields');
            return;
        }

        if (phoneNumber.length < 11) {
            showToast('warning', 'Please enter a valid phone number');
            return;
        }

        if (parseFloat(amount) < 50) {
            showToast('warning', 'Minimum amount is ₦50');
            return;
        }

        proceedToSummary(amount);
    };

    const proceedToSummary = (amountValue) => {
        // Get discount info from selected type
        const typeInfo = airtimeTypes.find(t => t.type === selectedType);
        const discount = typeInfo?.discount || '';

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: 'airtime',
                beneficiary: phoneNumber,
                amount: amountValue,
                bonus: discount,
                network: selectedNetwork.name,
                airtimeType: selectedType || 'VTU',
            }
        });
    };

    const handleBeneficiarySelect = (beneficiary) => {
        // Find and set the network - match by network name
        const network = networks.find(n =>
            n.network.toLowerCase() === beneficiary.network.toLowerCase()
        );

        // Update all states
        setPhoneNumber(beneficiary.phoneNumber);
        if (network) {
            setSelectedNetwork({
                id: network.network.toLowerCase(),
                name: network.network.toUpperCase()
            });
        }

        // Switch to airtime tab immediately
        setActiveTab('airtime');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Buy Airtime
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {activeTab === 'airtime' ? (
                    <>
                        {/* Network & Phone Number Selector */}
                        <NetworkSelector
                            mode="cards"
                            selectedNetwork={selectedNetwork}
                            onNetworkSelect={setSelectedNetwork}
                            phoneNumber={phoneNumber}
                            onPhoneNumberChange={setPhoneNumber}
                            onViewAllBeneficiaries={() => setActiveTab('beneficiaries')}
                            onSelectBeneficiary={handleBeneficiarySelect}
                            networks={networks.map(n => ({
                                id: n.network.toLowerCase(),
                                name: n.network.toUpperCase(),
                            }))}
                        />

                        {/* Airtime Type Selector */}
                        {airtimeTypes.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Airtime Type
                                </Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.airtimeTypes}
                                >
                                    {airtimeTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.typeChip,
                                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                                selectedType === type.type && { backgroundColor: colors.primary }
                                            ]}
                                            onPress={() => setSelectedType(type.type)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                styles.typeText,
                                                { fontFamily: fonts.inter.semiBold },
                                                selectedType === type.type ? { color: '#fff' } : { color: colors.text }
                                            ]}>
                                                {type.type}
                                            </Text>
                                            {type.discount && (
                                                <Text style={[
                                                    styles.typeDiscount,
                                                    { fontFamily: fonts.inter.regular },
                                                    selectedType === type.type ? { color: '#fff' } : { color: colors.icon }
                                                ]}>
                                                    {type.discount}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

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
                                onSubmitEditing={handleContinue}
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
                                        ₦{quickAmount}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ height: 30 }} />
                    </>
                ) : (
                    <BeneficiaryList
                        onSelectBeneficiary={handleBeneficiarySelect}
                    />
                )}
            </ScrollView>

            {activeTab === 'airtime' && (
                <View style={styles.footerButtonContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary + 'DD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={[styles.buttonText, { fontFamily: fonts.inter.bold }]}>
                                Continue
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <LoadingOverlay visible={loadingNetworks || loadingTypes} />
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
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
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
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickAmountText: { fontSize: 10 },
    airtimeTypes: {
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 16,
    },
    typeChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 4,
    },
    typeText: { fontSize: 13 },
    typeDiscount: { fontSize: 10 },
    footerButtonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 10,
    },
    continueButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});
