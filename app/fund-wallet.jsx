import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FundWallet() {
    const { colors, fonts, isDark } = useTheme();
    const { getAvailablePaymentMethods, loading, refreshPaymentData } = usePayment();
    const { showToast } = useToast();
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            await refreshPaymentData();
            const allMethods = getAllPaymentMethods();
            setPaymentMethods(allMethods);
        } catch (error) {
            showToast('error', 'Failed to load payment methods');
        }
    };

    const getAllPaymentMethods = () => {
        const allMethods = [
            {
                id: 'auto',
                name: 'Auto Funding',
                icon: 'flash',
                color: '#10B981',
                description: 'Instant virtual account transfer',
            },
            {
                id: 'manual',
                name: 'Manual Transfer',
                icon: 'swap-horizontal',
                color: '#3B82F6',
                description: 'Transfer to our bank account',
            },
            {
                id: 'onetime',
                name: 'One-Time Account',
                icon: 'time',
                color: '#F59E0B',
                description: 'Generate temporary account',
            },
            {
                id: 'card',
                name: 'Card Payment',
                icon: 'card',
                color: '#8B5CF6',
                description: 'Pay with debit/credit card',
            },
            {
                id: 'coupon',
                name: 'Coupon Code',
                icon: 'pricetag',
                color: '#EC4899',
                description: 'Redeem coupon code',
            }
        ];

        // Get available methods from context
        const availableMethods = getAvailablePaymentMethods();
        const availableIds = availableMethods.map(m => m.id);

        // Only return methods that are available
        return allMethods.filter(method => availableIds.includes(method.id));
    };

    const handleMethodSelect = (method) => {
        const routes = {
            auto: '/(fund-wallet)/auto-funding',
            manual: '/(fund-wallet)/manual-funding',
            onetime: '/(fund-wallet)/onetime-account',
            card: '/(fund-wallet)/card-payment',
            coupon: '/(fund-wallet)/coupon-payment'
        };

        if (routes[method.id]) {
            router.push(routes[method.id]);
        }
    };

    if (loading && paymentMethods.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                    Loading payment methods...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Fund Wallet
                </Text>
                <TouchableOpacity onPress={loadPaymentMethods}>
                    <Ionicons name="refresh" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="wallet" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Choose Payment Method
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Select how you'd like to add money to your wallet
                    </Text>
                </View>

                {/* Payment Methods Grid */}
                <View style={styles.methodsGrid}>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.methodCard,
                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }
                            ]}
                            onPress={() => handleMethodSelect(method)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.methodIconContainer, { backgroundColor: method.color + '20' }]}>
                                <Ionicons name={method.icon} size={32} color={method.color} />
                            </View>
                            
                            <View style={styles.methodContent}>
                                <Text style={[
                                    styles.methodName,
                                    { color: colors.text, fontFamily: fonts.inter.semiBold }
                                ]}>
                                    {method.name}
                                </Text>
                                <Text style={[
                                    styles.methodDescription,
                                    { color: colors.icon, fontFamily: fonts.inter.regular }
                                ]}>
                                    {method.description}
                                </Text>
                            </View>

                            <View style={styles.methodAction}>
                                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                

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
        paddingBottom: 20,
    },
    headerTitle: { 
        fontSize: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    methodsGrid: {
        gap: 12,
        marginBottom: 24,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    methodIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodContent: {
        flex: 1,
    },
    methodName: {
        fontSize: 16,
        marginBottom: 4,
    },
    methodDescription: {
        fontSize: 12,
        lineHeight: 18,
    },
    methodAction: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    disabledText: {
        fontSize: 10,
    },
    infoSection: {
        gap: 12,
        marginBottom: 24,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    featuresCard: {
        padding: 20,
        borderRadius: 16,
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
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});
