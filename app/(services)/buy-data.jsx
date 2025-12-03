import BeneficiaryList from '@/components/services/BeneficiaryList';
import NetworkSelector from '@/components/services/NetworkSelector';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BuyDataScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchDataNetworks, fetchDataTypes, fetchDataPlans } = useServices();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState('data');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [activePlanType, setActivePlanType] = useState(null);
    
    const [networks, setNetworks] = useState([]);
    const [dataTypes, setDataTypes] = useState([]);
    const [dataPlans, setDataPlans] = useState([]);
    
    const [loadingNetworks, setLoadingNetworks] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Fetch networks on mount
    useEffect(() => {
        loadNetworks();
    }, []);

    // Fetch data types when network is selected
    useEffect(() => {
        if (selectedNetwork) {
            loadDataTypes(selectedNetwork.name);
        } else {
            setDataTypes([]);
            setActivePlanType(null);
            setDataPlans([]);
        }
    }, [selectedNetwork]);

    // Fetch data plans when plan type is selected
    useEffect(() => {
        if (selectedNetwork && activePlanType) {
            loadDataPlans(selectedNetwork.name, activePlanType);
        } else {
            setDataPlans([]);
        }
    }, [selectedNetwork, activePlanType]);

    const loadNetworks = async () => {
        setLoadingNetworks(true);
        try {
            const data = await fetchDataNetworks();
            setNetworks(data);
        } catch (error) {
            showToast('error', error.message || 'Failed to load networks');
        } finally {
            setLoadingNetworks(false);
        }
    };

    const loadDataTypes = async (networkName) => {
        setLoadingTypes(true);
        try {
            const types = await fetchDataTypes(networkName);
            setDataTypes(types);
            if (types.length > 0) {
                setActivePlanType(types[0]);
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to load data types');
            setDataTypes([]);
        } finally {
            setLoadingTypes(false);
        }
    };

    const loadDataPlans = async (networkName, dataType) => {
        setLoadingPlans(true);
        try {
            const plans = await fetchDataPlans(networkName, dataType);
            setDataPlans(plans);
        } catch (error) {
            showToast('error', error.message || 'Failed to load data plans');
            setDataPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    const handlePlanSelect = async (plan) => {
        if (!selectedNetwork || !phoneNumber) {
            showToast('warning', 'Please select a network and enter phone number');
            return;
        }

        // Validate phone number
        if (phoneNumber.length < 11) {
            showToast('warning', 'Please enter a valid phone number');
            return;
        }

        try {
            router.push({
                pathname: '/(services)/transaction-summary',
                params: {
                    service: 'Data Subscription',
                    beneficiary: phoneNumber,
                    amount: plan.price.toString(),
                    bonus: '0',
                    network: selectedNetwork.name,
                    planSize: plan.datasize,
                    validity: `${plan.day} days`,
                    planId: plan.id.toString(),
                    planType: activePlanType,
                }
            });
        } catch (error) {
            showToast('error', error.message || 'Failed to proceed');
        }
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
        
        // Switch to data tab immediately
        setActiveTab('data');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Buy Data
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Tabs */}
                {/* <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                            activeTab === 'data' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setActiveTab('data')}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.tabText,
                            { fontFamily: fonts.inter.semiBold },
                            activeTab === 'data' ? { color: '#fff' } : { color: colors.text }
                        ]}>
                            Data
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                            activeTab === 'beneficiaries' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setActiveTab('beneficiaries')}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.tabText,
                            { fontFamily: fonts.inter.semiBold },
                            activeTab === 'beneficiaries' ? { color: '#fff' } : { color: colors.text }
                        ]}>
                            Beneficiaries
                        </Text>
                    </TouchableOpacity>
                </View> */}

                {activeTab === 'data' ? (
                    <>
                        {/* Network & Phone Number Selector */}
                        {loadingNetworks ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Loading networks...
                                </Text>
                            </View>
                        ) : (
                            <>
                                <NetworkSelector
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
                            </>
                        )}



                        {/* Plan Type Selector */}
                {selectedNetwork && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Select Plan Type
                        </Text>
                        {loadingTypes ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.planTypes}
                            >
                                {dataTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.planTypeChip,
                                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                            activePlanType === type && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setActivePlanType(type)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[
                                            styles.planTypeText,
                                            { fontFamily: fonts.inter.semiBold },
                                            activePlanType === type ? { color: '#fff' } : { color: colors.text }
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </>
                )}

                {/* Data Plans Grid */}
                {selectedNetwork && activePlanType && (
                    <>
                        {loadingPlans ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
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
                                            { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }
                                        ]}
                                        onPress={() => handlePlanSelect(plan)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.planLabel, { backgroundColor: colors.primary + '20' }]}>
                                            <Text style={[styles.planLabelText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                {plan.type}
                                            </Text>
                                        </View>
                                        <Text style={[styles.planSize, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {plan.datasize}
                                        </Text>
                                        <View style={styles.planDetails}>
                                            <Text style={[styles.planPrice, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                                ₦{plan.price}
                                            </Text>
                                            <Text style={[styles.planDays, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                {plan.day} {plan.day === '1' ? 'day' : 'days'}
                                            </Text>
                                        </View>
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

                <View style={{ height: 30 }} />
                    </>
                ) : (
                    <BeneficiaryList 
                        onSelectBeneficiary={handleBeneficiarySelect}
                    />
                )}
            </ScrollView>
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
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabText: { fontSize: 14 },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
    planTypes: {
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 16,
    },
    planTypeChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    planTypeText: { fontSize: 13 },
    plansGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
    },
    planCard: {
        width: '47%',
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
    planSize: { fontSize: 20, marginBottom: 8 },
    planDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planPrice: { fontSize: 16 },
    planDays: { fontSize: 12 },
    cashbackBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    cashbackText: { fontSize: 10, color: '#4CAF50' },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 14 },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: { fontSize: 14 },
});
