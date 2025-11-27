import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AirtimeSwapScreen() {
    const { colors, fonts, isDark } = useTheme();
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [showNetworkModal, setShowNetworkModal] = useState(false);

    const networks = [
        { id: 'mtn', name: 'MTN', icon: '📱', color: '#FFCC00', rate: 85 },
        { id: 'airtel', name: 'AIRTEL', icon: '📱', color: '#FF0000', rate: 80 },
        { id: '9mobile', name: '9MOBILE', icon: '📱', color: '#00A65A', rate: 75 },
        { id: 'glo', name: 'GLO', icon: '📱', color: '#00A859', rate: 80 },
    ];

    const getConvertedAmount = () => {
        if (!amount || !selectedNetwork) return 0;
        return (parseFloat(amount) * selectedNetwork.rate) / 100;
    };

    const handleContinue = () => {
        if (!selectedNetwork || !phoneNumber || !amount) return;

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: 'Airtime to Cash',
                beneficiary: phoneNumber,
                amount: getConvertedAmount().toString(),
                network: selectedNetwork.name,
                airtimeAmount: amount,
                conversionRate: `${selectedNetwork.rate}%`,
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
                            Instantly convert your airtime to wallet balance
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
                            <View style={[styles.networkIcon, { backgroundColor: selectedNetwork.color }]}>
                                <Text style={styles.networkEmoji}>{selectedNetwork.icon}</Text>
                            </View>
                            <View style={styles.networkInfo}>
                                <Text style={[styles.networkName, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    {selectedNetwork.name}
                                </Text>
                                <Text style={[styles.networkRate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Conversion rate: {selectedNetwork.rate}%
                                </Text>
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
                {amount && selectedNetwork && parseFloat(amount) > 0 && (
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
                                Conversion rate: {selectedNetwork.rate}%
                            </Text>
                        </View>
                    </View>
                )}

                {/* Instructions */}
                <View style={[styles.instructionsCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        How it works
                    </Text>
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
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Continue Button */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        { backgroundColor: colors.primary },
                        (!selectedNetwork || !phoneNumber || !amount) && { opacity: 0.5 }
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedNetwork || !phoneNumber || !amount}
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
                                key={network.id}
                                style={[styles.option, { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                                onPress={() => {
                                    setSelectedNetwork(network);
                                    setShowNetworkModal(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionLeft}>
                                    <View style={[styles.icon, { backgroundColor: network.color }]}>
                                        <Text style={styles.iconEmoji}>{network.icon}</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                            {network.name}
                                        </Text>
                                        <Text style={[styles.optionRate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Rate: {network.rate}%
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
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
    },
    networkEmoji: { fontSize: 20 },
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
    },
    iconEmoji: { fontSize: 20 },
    optionText: { fontSize: 15, marginBottom: 2 },
    optionRate: { fontSize: 12 },
});
