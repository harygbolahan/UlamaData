import NetworkSelector from '@/components/services/NetworkSelector';
import DatePicker from '@/components/ui/DatePicker';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ScheduleTransactionScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchDataNetworks, fetchDataTypes, fetchDataPlans, fetchAirtimeNetworks, fetchAirtimeTypes } = useServices();
    const { showToast } = useToast();
    
    const [serviceType, setServiceType] = useState('data');
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('Everyday');
    const [scheduleDate, setScheduleDate] = useState('');
    const [showFrequencyModal, setShowFrequencyModal] = useState(false);

    const [networks, setNetworks] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [dataPlans, setDataPlans] = useState([]);
    
    const [loadingNetworks, setLoadingNetworks] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);

    const frequencies = [
        { id: 'Everyday', name: 'Everyday', icon: 'calendar', description: 'Every day at 12:00 AM' },
        { id: 'Sunday', name: 'Sunday', icon: 'calendar-outline', description: 'Every Sunday at 12:00 AM' },
        { id: 'Monday', name: 'Monday', icon: 'calendar-outline', description: 'Every Monday at 12:00 AM' },
        { id: 'Tuesday', name: 'Tuesday', icon: 'calendar-outline', description: 'Every Tuesday at 12:00 AM' },
        { id: 'Wednesday', name: 'Wednesday', icon: 'calendar-outline', description: 'Every Wednesday at 12:00 AM' },
        { id: 'Thursday', name: 'Thursday', icon: 'calendar-outline', description: 'Every Thursday at 12:00 AM' },
        { id: 'Friday', name: 'Friday', icon: 'calendar-outline', description: 'Every Friday at 12:00 AM' },
        { id: 'Saturday', name: 'Saturday', icon: 'calendar-outline', description: 'Every Saturday at 12:00 AM' },
    ];

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

    // Set default schedule date to tomorrow
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];
        setScheduleDate(formattedDate);
    }, []);

    const loadNetworks = async () => {
        setLoadingNetworks(true);
        try {
            const data = serviceType === 'data' 
                ? await fetchDataNetworks()
                : await fetchAirtimeNetworks();
            setNetworks(data);
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

    const handleContinue = () => {
        if (!selectedNetwork || !phoneNumber) {
            showToast('warning', 'Please select network and enter phone number');
            return;
        }

        if (serviceType === 'data' && !selectedPlan) {
            showToast('warning', 'Please select a data plan');
            return;
        }

        if (serviceType === 'airtime' && !amount) {
            showToast('warning', 'Please enter amount');
            return;
        }

        if (serviceType === 'airtime' && parseFloat(amount) < 50) {
            showToast('warning', 'Minimum amount is ₦50');
            return;
        }

        if (phoneNumber.length !== 11) {
            showToast('warning', 'Please enter a valid phone number');
            return;
        }

        if (!scheduleDate) {
            showToast('warning', 'Please select a schedule date');
            return;
        }

        const finalAmount = serviceType === 'data' ? selectedPlan.price : parseFloat(amount);

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: serviceType === 'data' ? 'Schedule Data' : 'Schedule Airtime',
                beneficiary: phoneNumber,
                amount: finalAmount.toString(),
                network: selectedNetwork.name,
                planSize: serviceType === 'data' ? selectedPlan.datasize : `₦${amount}`,
                validity: serviceType === 'data' ? `${selectedPlan.day} days` : undefined,
                planId: serviceType === 'data' ? selectedPlan.id.toString() : undefined,
                scheduleType: selectedType,
                scheduleFrequency: frequency,
                scheduleDate: scheduleDate,
                isSchedule: 'true',
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
                    Schedule Transaction
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Service Type */}
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

                {/* Network & Phone */}
                {loadingNetworks ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Loading networks...
                        </Text>
                    </View>
                ) : (
                    <NetworkSelector
                        selectedNetwork={selectedNetwork}
                        onNetworkSelect={setSelectedNetwork}
                        phoneNumber={phoneNumber}
                        onPhoneNumberChange={setPhoneNumber}
                        networks={networks.map(n => ({
                            id: n.network.toLowerCase(),
                            name: n.network.toUpperCase(),
                        }))}
                    />
                )}

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

                {/* Schedule Date */}
                <View style={{ paddingHorizontal: 20 }}>
                    <DatePicker
                        label="Schedule Date"
                        value={scheduleDate}
                        onChange={setScheduleDate}
                        minimumDate={new Date()}
                    />
                </View>
                <View style={{ height: 20 }} />

                {/* Frequency */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Frequency
                </Text>
                <TouchableOpacity
                    style={[styles.frequencyCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                    onPress={() => setShowFrequencyModal(true)}
                >
                    <View style={styles.frequencyLeft}>
                        <Ionicons name={frequencies.find(f => f.id === frequency)?.icon} size={20} color={colors.primary} />
                        <View>
                            <Text style={[styles.frequencyName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {frequencies.find(f => f.id === frequency)?.name}
                            </Text>
                            <Text style={[styles.frequencyDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {frequencies.find(f => f.id === frequency)?.description}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>

                {/* Plans or Amount */}
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
                    </>
                )}

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        This transaction will be automatically processed based on your selected frequency. You can cancel anytime.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Continue Button */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        { backgroundColor: colors.primary },
                        (!selectedNetwork || !phoneNumber || (serviceType === 'data' ? !selectedPlan : !amount)) && { opacity: 0.5 }
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedNetwork || !phoneNumber || (serviceType === 'data' ? !selectedPlan : !amount)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.continueText, { fontFamily: fonts.inter.semiBold }]}>
                        Schedule Transaction
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Frequency Modal */}
            <Modal visible={showFrequencyModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => setShowFrequencyModal(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Select Frequency
                        </Text>
                        {frequencies.map((freq) => (
                            <TouchableOpacity
                                key={freq.id}
                                style={[styles.option, { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                onPress={() => {
                                    setFrequency(freq.id);
                                    setShowFrequencyModal(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionLeft}>
                                    <Ionicons name={freq.icon} size={20} color={colors.primary} />
                                    <View>
                                        <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                            {freq.name}
                                        </Text>
                                        <Text style={[styles.optionDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            {freq.description}
                                        </Text>
                                    </View>
                                </View>
                                {frequency === freq.id && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
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
    frequencyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    frequencyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    frequencyName: { fontSize: 14, marginBottom: 2 },
    frequencyDesc: { fontSize: 12 },
    plansGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
        marginBottom: 20,
    },
    planCard: {
        width: '30%',
        margin: '1.66%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    planSize: { fontSize: 16, marginBottom: 4 },
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
    infoCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    infoText: { flex: 1, fontSize: 13 },
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
    modalTitle: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    optionText: { fontSize: 15, marginBottom: 2 },
    optionDesc: { fontSize: 12 },
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
