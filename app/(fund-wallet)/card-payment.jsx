import Button from '@/components/ui/Button';
import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardPaymentScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { initiateCardPayment } = usePayment();
    const { showToast } = useToast();
    const params = useLocalSearchParams();
    const [amount, setAmount] = useState(params.amount || '');
    const [processing, setProcessing] = useState(false);

    const quickAmounts = [1000, 2000, 5000, 10000];

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) < 100) {
            showToast('warning', 'Amount should be more than 100.');
            return;
        }

        setProcessing(true);
        try {
            const response = await initiateCardPayment(parseFloat(amount));
            
            if (response.link) {
                // Navigate to in-app WebView
                router.push({
                    pathname: '/(fund-wallet)/payment-webview',
                    params: { url: response.link }
                });
            } else if (response.status === 'inactive') {
                showToast('error', 'Card payment is currently unavailable');
            } else {
                showToast('error', response.message || 'Failed to initiate payment');
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to initiate payment');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Card Payment
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Amount Input */}
                <View style={styles.amountSection}>
                    <Text style={[styles.amountLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Enter Amount
                    </Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={[styles.currencySymbol, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            ₦
                        </Text>
                        <TextInput
                            placeholder="0"
                            placeholderTextColor={colors.icon}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            style={[styles.amountInput, { color: colors.text, fontFamily: fonts.inter.bold }]}
                        />
                    </View>
                </View>

                {/* Quick Amounts */}
                <View style={styles.quickAmountsContainer}>
                    {quickAmounts.map((quickAmount) => (
                        <TouchableOpacity
                            key={quickAmount}
                            style={[
                                styles.quickAmountChip,
                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                amount === quickAmount.toString() && {
                                    backgroundColor: colors.primary,
                                }
                            ]}
                            onPress={() => setAmount(quickAmount.toString())}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.quickAmountText,
                                { fontFamily: fonts.inter.semiBold },
                                amount === quickAmount.toString() ? { color: '#fff' } : { color: colors.text }
                            ]}>
                                ₦{quickAmount.toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Ionicons name="card-outline" size={44} color={colors.primary} />
                    <Text style={[styles.infoTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Secure Card Payment
                    </Text>
                    <Text style={[styles.infoText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Complete your payment securely within the app
                    </Text>
                </View>

             

                <View style={[styles.instructionsCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        How It Works
                    </Text>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>1</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Click "Proceed to Payment" below
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>2</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Enter your card details on the secure page
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.stepText, { fontFamily: fonts.inter.bold }]}>3</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Complete payment within the app
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title={processing ? 'Processing...' : `Proceed to Payment`}
                    onPress={handlePayment}
                    disabled={processing}
                    style={{ opacity: processing ? 0.5 : 1 }}
                />
            </View>
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
        paddingTop: 20,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    amountSection: {
        marginBottom: 16,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 13,
        marginBottom: 12,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        minWidth: 100,
        textAlign: 'center',
    },
    quickAmountsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    quickAmountChip: {
        flex: 1,
        minWidth: '47%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
    },
    infoCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 18,
        marginTop: 16,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    featuresCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    featuresTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        fontSize: 14,
    },
    instructionsCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    instructionsTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepText: {
        color: '#fff',
        fontSize: 14,
    },
    instructionText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
