import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function USSDPaymentScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { amount } = useLocalSearchParams();

    const ussdCodes = [
        { bank: 'GTBank', code: '*737*50*Amount*Account#', color: '#FF6B00' },
        { bank: 'Access Bank', code: '*901*Amount*Account#', color: '#E31E24' },
        { bank: 'First Bank', code: '*894*Amount*Account#', color: '#0066CC' },
        { bank: 'UBA', code: '*919*Amount*Account#', color: '#D32F2F' },
        { bank: 'Zenith Bank', code: '*966*Amount*Account#', color: '#8B0000' },
        { bank: 'Fidelity Bank', code: '*770*Amount*Account#', color: '#4CAF50' },
    ];

    const handleCopy = async (text) => {
        await Clipboard.setStringAsync(text);
    };

    const handleConfirmPayment = () => {
        router.push('/(fund-wallet)/payment-success');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    USSD Payment
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.amountLabel, { fontFamily: fonts.inter.regular }]}>
                        Amount to Pay
                    </Text>
                    <Text style={[styles.amountText, { fontFamily: fonts.inter.bold }]}>
                        ₦{parseFloat(amount || '0').toLocaleString()}
                    </Text>
                </View>

                <View style={[styles.instructionsCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                    <View style={styles.instructionsText}>
                        <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            How to Pay with USSD
                        </Text>
                        <Text style={[styles.instructionsDesc, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Dial the USSD code for your bank, follow the prompts, and your wallet will be credited instantly.
                        </Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Select Your Bank
                </Text>

                {ussdCodes.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.bankCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={() => handleCopy(item.code)}
                    >
                        <View style={[styles.bankIcon, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name="call" size={20} color={item.color} />
                        </View>
                        <View style={styles.bankInfo}>
                            <Text style={[styles.bankName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {item.bank}
                            </Text>
                            <Text style={[styles.ussdCode, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {item.code}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleCopy(item.code)}>
                            <Ionicons name="copy-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}

                <View style={[styles.noteCard, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="bulb" size={20} color={colors.warning} />
                    <Text style={[styles.noteText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Replace "Amount" with {amount} and "Account" with your account number when dialing.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="I have completed the payment"
                    onPress={handleConfirmPayment}
                />
            </View>
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
    amountCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    amountLabel: { color: '#fff', fontSize: 14, opacity: 0.9, marginBottom: 8 },
    amountText: { color: '#fff', fontSize: 32 },
    instructionsCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    instructionsText: { flex: 1 },
    instructionsTitle: { fontSize: 14, marginBottom: 4 },
    instructionsDesc: { fontSize: 12, lineHeight: 18 },
    sectionTitle: {
        fontSize: 16,
        marginHorizontal: 20,
        marginBottom: 12,
    },
    bankCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    bankIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bankInfo: { flex: 1 },
    bankName: { fontSize: 14, marginBottom: 4 },
    ussdCode: { fontSize: 12 },
    noteCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    noteText: { flex: 1, fontSize: 12 },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
