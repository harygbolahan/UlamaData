import NetworkSelector from '@/components/services/NetworkSelector';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ScheduleTransactionScreen() {
    const { colors, fonts, isDark } = useTheme();
    const [serviceType, setServiceType] = useState('data');
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [frequency, setFrequency] = useState('daily');
    const [showFrequencyModal, setShowFrequencyModal] = useState(false);

    const dataPlans = [
        { id: '1', size: '1GB', price: 300 },
        { id: '2', size: '2GB', price: 600 },
        { id: '3', size: '5GB', price: 1500 },
    ];

    const frequencies = [
        { id: 'daily', name: 'Daily', icon: 'calendar', description: 'Every day at 12:00 AM' },
        { id: 'weekly', name: 'Weekly', icon: 'calendar-outline', description: 'Every Monday at 12:00 AM' },
        { id: 'monthly', name: 'Monthly', icon: 'calendar-number', description: '1st of every month' },
    ];

    const handleContinue = () => {
        if (!selectedNetwork || !phoneNumber || !selectedPlan) return;

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: `Scheduled ${serviceType === 'data' ? 'Data' : 'Airtime'}`,
                beneficiary: phoneNumber,
                amount: selectedPlan.price.toString(),
                network: selectedNetwork.name,
                planSize: selectedPlan.size,
                frequency: frequencies.find(f => f.id === frequency)?.name,
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
                <NetworkSelector
                    selectedNetwork={selectedNetwork}
                    onNetworkSelect={setSelectedNetwork}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={setPhoneNumber}
                />

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
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Select Plan
                        </Text>
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
                                        {plan.size}
                                    </Text>
                                    <Text style={[styles.planPrice, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        ₦{plan.price}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
                                value={selectedPlan?.price.toString() || ''}
                                onChangeText={(text) => setSelectedPlan({ id: 'custom', size: text, price: parseFloat(text) || 0 })}
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
                        (!selectedNetwork || !phoneNumber || !selectedPlan) && { opacity: 0.5 }
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedNetwork || !phoneNumber || !selectedPlan}
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
    planPrice: { fontSize: 14 },
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
});
