import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Network images
const networkImages = {
    MTN: require('@/assets/networks/mtn.png'),
    GLO: require('@/assets/networks/glo.png'),
    AIRTEL: require('@/assets/networks/airtel.png'),
    '9MOBILE': require('@/assets/networks/9mobile.png'),
};

export default function BulkOrderScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchDataNetworks, fetchDataTypes, fetchDataPlans, fetchAirtimeNetworks, fetchAirtimeTypes } = useServices();
    const { showToast } = useToast();
    
    const [serviceType, setServiceType] = useState('data');
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [phoneNumbers, setPhoneNumbers] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [amount, setAmount] = useState('');
    const [showNetworkModal, setShowNetworkModal] = useState(false);

    const [networks, setNetworks] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [dataPlans, setDataPlans] = useState([]);
    
    const [loadingNetworks, setLoadingNetworks] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Fetch networks when service type changes
    useEffect(() => {
        loadNetworks();
    }, [serviceType]);

    // Fetch types when network is selected
    useEffect(() => {
        if (selectedNetwork) {
            loadTypes();
        } else {
            setTypes([]);
            setSelectedType(null);
            setDataPlans([]);
        }
    }, [selectedNetwork, serviceType]);

    // Fetch data plans when type is selected (only for data)
    useEffect(() => {
        if (serviceType === 'data' && selectedNetwork && selectedType) {
            loadDataPlans();
        } else if (serviceType === 'data') {
            setDataPlans([]);
        }
    }, [selectedNetwork, selectedType, serviceType]);

    const loadNetworks = async () => {
        setLoadingNetworks(true);
        try {
            const data = serviceType === 'data' 
                ? await fetchDataNetworks()
                : await fetchAirtimeNetworks();
            setNetworks(data);
            // Reset selections when service type changes
            setSelectedNetwork(null);
            setSelectedType(null);
            setDataPlans([]);
            setSelectedPlan(null);
        } catch (error) {
            showToast('error', error.message || 'Failed to load networks');
        } finally {
            setLoadingNetworks(false);
        }
    };

    const loadTypes = async () => {
        setLoadingTypes(true);
        try {
            const typesData = serviceType === 'data'
                ? await fetchDataTypes(selectedNetwork.name)
                : await fetchAirtimeTypes();
            
            if (serviceType === 'data') {
                setTypes(typesData);
                if (typesData.length > 0) {
                    setSelectedType(typesData[0]);
                }
            } else {
                setTypes(typesData);
                if (typesData.length > 0) {
                    setSelectedType(typesData[0].type);
                }
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to load types');
            setTypes([]);
        } finally {
            setLoadingTypes(false);
        }
    };

    const loadDataPlans = async () => {
        setLoadingPlans(true);
        try {
            const plans = await fetchDataPlans(selectedNetwork.name, selectedType);
            setDataPlans(plans);
        } catch (error) {
            showToast('error', error.message || 'Failed to load data plans');
            setDataPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    const getPhoneCount = () => {
        const numbers = phoneNumbers.split('\n').filter(n => n.trim().length > 0);
        return numbers.length;
    };

    const getTotalAmount = () => {
        const count = getPhoneCount();
        if (serviceType === 'data' && selectedPlan) {
            return count * selectedPlan.price;
        } else if (serviceType === 'airtime' && amount) {
            return count * parseFloat(amount);
        }
        return 0;
    };

    const handleContinue = () => {
        const numbers = phoneNumbers.split('\n').filter(n => n.trim().length > 0);
        
        if (!selectedNetwork || numbers.length === 0) {
            showToast('warning', 'Please select network and enter phone numbers');
            return;
        }

        if (serviceType === 'data' && !selectedPlan) {
            showToast('warning', 'Please select a data plan');
            return;
        }
        
        if (serviceType === 'airtime' && !amount) {
            showToast('warning', 'Please enter amount per number');
            return;
        }

        if (serviceType === 'airtime' && parseFloat(amount) < 50) {
            showToast('warning', 'Minimum amount is ₦50');
            return;
        }

        // Validate phone numbers
        const invalidNumbers = numbers.filter(n => n.trim().length !== 11);
        if (invalidNumbers.length > 0) {
            showToast('warning', `${invalidNumbers.length} invalid phone number(s). All numbers must be 11 digits.`);
            return;
        }

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: serviceType === 'data' ? 'Bulk Data' : 'Bulk Airtime',
                beneficiary: `${numbers.length} recipients`,
                amount: getTotalAmount().toString(),
                network: selectedNetwork.name,
                planSize: serviceType === 'data' ? selectedPlan.datasize : `₦${amount} each`,
                bulkPhones: numbers.join(','),
                bulkType: selectedType,
                planId: serviceType === 'data' ? selectedPlan.id.toString() : undefined,
                isBulk: 'true',
            }
        });
    };

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Bulk Order
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Service Type Toggle */}
                <View style={styles.serviceTypes}>
                    <TouchableOpacity
                        style={[
                            styles.serviceTypeChip,
                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                            serviceType === 'data' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setServiceType('data')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="wifi" size={16} color={serviceType === 'data' ? '#fff' : colors.icon} />
                        <Text style={[
                            styles.serviceTypeText,
                            { fontFamily: fonts.inter.semiBold },
                            serviceType === 'data' ? { color: '#fff' } : { color: colors.text }
                        ]}>
                            Data
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.serviceTypeChip,
                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                            serviceType === 'airtime' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setServiceType('airtime')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="phone-portrait" size={16} color={serviceType === 'airtime' ? '#fff' : colors.icon} />
                        <Text style={[
                            styles.serviceTypeText,
                            { fontFamily: fonts.inter.semiBold },
                            serviceType === 'airtime' ? { color: '#fff' } : { color: colors.text }
                        ]}>
                            Airtime
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Network Selector */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Select Network
                </Text>
                {loadingNetworks ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Loading networks...
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.networkCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={() => setShowNetworkModal(true)}
                    >
                        {selectedNetwork ? (
                            <View style={styles.networkSelected}>
                                <Image 
                                    source={networkImages[selectedNetwork.name]} 
                                    style={styles.networkImage}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.networkName, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    {selectedNetwork.name}
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.placeholder, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Tap to select network
                            </Text>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                    </TouchableOpacity>
                )}

                {/* Phone Numbers Input */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Phone Numbers (One per line)
                </Text>
                <View style={[styles.textAreaContainer, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <TextInput
                        placeholder="08012345678&#10;08098765432&#10;07011223344"
                        placeholderTextColor={colors.icon}
                        value={phoneNumbers}
                        onChangeText={setPhoneNumbers}
                        multiline
                        numberOfLines={6}
                        keyboardType="default"
                        returnKeyType="default"
                        blurOnSubmit={false}
                        textAlignVertical="top"
                        style={[styles.textArea, { color: colors.text, fontFamily: fonts.inter.regular }]}
                    />
                    <View style={styles.countBadge}>
                        <Text style={[styles.countText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                            {getPhoneCount()} numbers
                        </Text>
                    </View>
                </View>

                {/* Type Selector */}
                {selectedNetwork && types.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Select Type
                        </Text>
                        {loadingTypes ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.typesContainer}
                            >
                                {types.map((type) => {
                                    const typeValue = serviceType === 'data' ? type : type.type;
                                    return (
                                        <TouchableOpacity
                                            key={typeValue}
                                            style={[
                                                styles.typeChip,
                                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                                selectedType === typeValue && { backgroundColor: colors.primary }
                                            ]}
                                            onPress={() => setSelectedType(typeValue)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                styles.typeText,
                                                { fontFamily: fonts.inter.semiBold },
                                                selectedType === typeValue ? { color: '#fff' } : { color: colors.text }
                                            ]}>
                                                {typeValue}
                                            </Text>
                                            {serviceType === 'airtime' && type.discount && (
                                                <Text style={[
                                                    styles.typeDiscount,
                                                    { fontFamily: fonts.inter.regular },
                                                    selectedType === typeValue ? { color: '#fff' } : { color: colors.icon }
                                                ]}>
                                                    {type.discount}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </>
                )}

                {/* Data Plans or Amount */}
                {serviceType === 'data' ? (
                    <>
                        {selectedNetwork && selectedType && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Select Plan
                                </Text>
                                {loadingPlans ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Loading plans...
                                        </Text>
                                    </View>
                                ) : dataPlans.length > 0 ? (
                                    <View style={styles.plansGrid}>
                                        {dataPlans.map((plan) => (
                                            <TouchableOpacity
                                                key={plan.id}
                                                style={[
                                                    styles.planCard,
                                                    { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                                    selectedPlan?.id === plan.id && {
                                                        backgroundColor: colors.primary + '20',
                                                        borderColor: colors.primary,
                                                        borderWidth: 2
                                                    }
                                                ]}
                                                onPress={() => setSelectedPlan(plan)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.planSize, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                                    {plan.datasize}
                                                </Text>
                                                <Text style={[styles.planPrice, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                    ₦{plan.price}
                                                </Text>
                                                <Text style={[styles.planDays, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                    {plan.day} {plan.day === '1' ? 'day' : 'days'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="file-tray-outline" size={48} color={colors.icon} />
                                        <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            No plans available
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Amount Per Number
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
                    </>
                )}

                {/* Total Summary */}
                {getTotalAmount() > 0 && (
                    <View style={[styles.summaryCard, { backgroundColor: colors.primary + '15' }]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                Recipients
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {getPhoneCount()}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                {serviceType === 'data' ? 'Plan' : 'Amount per number'}
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {serviceType === 'data' ? `${selectedPlan?.datasize} - ₦${selectedPlan?.price}` : `₦${amount}`}
                            </Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={[styles.totalLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Total Amount
                            </Text>
                            <Text style={[styles.totalValue, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                ₦{getTotalAmount().toLocaleString()}
                            </Text>
                        </View>
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
                        getTotalAmount() === 0 && { opacity: 0.5 }
                    ]}
                    onPress={handleContinue}
                    disabled={getTotalAmount() === 0}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.continueText, { fontFamily: fonts.inter.semiBold }]}>
                        Continue
                    </Text>
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
                                key={network.network}
                                style={[styles.option, { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                onPress={() => {
                                    setSelectedNetwork({ 
                                        id: network.network.toLowerCase(), 
                                        name: network.network.toUpperCase() 
                                    });
                                    setShowNetworkModal(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionLeft}>
                                    <Image 
                                        source={networkImages[network.network.toUpperCase()]} 
                                        style={styles.networkImageSmall}
                                        resizeMode="contain"
                                    />
                                    <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        {network.network.toUpperCase()}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
    serviceTypes: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    serviceTypeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    serviceTypeText: { fontSize: 14 },
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
        gap: 10,
    },
    networkImage: {
        width: 32,
        height: 32,
    },
    networkImageSmall: {
        width: 28,
        height: 28,
    },
    networkName: { fontSize: 14 },
    placeholder: { fontSize: 14 },
    textAreaContainer: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    textArea: {
        fontSize: 14,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    countBadge: {
        marginTop: 8,
        alignSelf: 'flex-end',
    },
    countText: { fontSize: 12 },
    plansGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
        marginBottom: 20,
    },
    planCard: {
        width: '47%',
        margin: '1.5%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    planSize: { fontSize: 18, marginBottom: 4 },
    planPrice: { fontSize: 14, marginBottom: 4 },
    planDays: { fontSize: 12 },
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
    summaryCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14 },
    totalRow: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    totalLabel: { fontSize: 16 },
    totalValue: { fontSize: 18 },
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
    continueText: {
        fontSize: 16,
        color: '#fff',
    },
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
    modalTitle: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    optionText: { fontSize: 15 },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 14 },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: { fontSize: 14 },
    typesContainer: {
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
});
