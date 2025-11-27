import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BankTransferScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { amount } = useLocalSearchParams();

    const bankDetails = {
        bankName: 'Wema Bank',
        accountNumber: '1234567890',
        accountName: 'DataBeta Technologies',
        reference: `DB${Date.now().toString().slice(-8)}`,
    };

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
                    Bank Transfer
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.amountLabel, { fontFamily: fonts.inter.regular }]}>
                        Amount to Transfer
                    </Text>
                    <Text style={[styles.amountText, { fontFamily: fonts.inter.bold }]}>
                        ₦{parseFloat(amount || '0').toLocaleString()}
                    </Text>
                </View>

                <View style={[styles.instructionsCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                    <View style={styles.instructionsText}>
                        <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Transfer Instructions
                        </Text>
                        <Text style={[styles.instructionsDesc, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Transfer the exact amount to the account below and your wallet will be credited within 5 minutes.
                        </Text>
                    </View>
                </View>

                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.detailsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Bank Details
                    </Text>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Bank Name
                        </Text>
                        <View style={styles.detailValueContainer}>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {bankDetails.bankName}
                            </Text>
                            <TouchableOpacity onPress={() => handleCopy(bankDetails.bankName)}>
                                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Account Number
                        </Text>
                        <View style={styles.detailValueContainer}>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {bankDetails.accountNumber}
                            </Text>
                            <TouchableOpacity onPress={() => handleCopy(bankDetails.accountNumber)}>
                                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Account Name
                        </Text>
                        <View style={styles.detailValueContainer}>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {bankDetails.accountName}
                            </Text>
                            <TouchableOpacity onPress={() => handleCopy(bankDetails.accountName)}>
                                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Reference
                        </Text>
                        <View style={styles.detailValueContainer}>
                            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {bankDetails.reference}
                            </Text>
                            <TouchableOpacity onPress={() => handleCopy(bankDetails.reference)}>
                                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={[styles.warningCard, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="warning" size={20} color={colors.warning} />
                    <Text style={[styles.warningText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Please ensure you transfer the exact amount and include the reference for automatic credit.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="I have made the transfer"
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
    detailsCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    detailsTitle: { fontSize: 16, marginBottom: 16 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: { fontSize: 13 },
    detailValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailValue: { fontSize: 13 },
    divider: { height: 1, marginVertical: 12 },
    warningCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
    },
    warningText: { flex: 1, fontSize: 12 },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
