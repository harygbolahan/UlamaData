import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/auth-context';
import { usePayment } from '@/contexts/payment-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CouponPayment() {
    const { colors, fonts, isDark } = useTheme();
    const { applyCoupon } = usePayment();
    const { refreshUser } = useAuth();
    const { showToast } = useToast();
    const [couponCode, setCouponCode] = useState('');
    const [applying, setApplying] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            showToast('warning', 'Please enter a coupon code');
            return;
        }

        setApplying(true);
        try {
            const response = await applyCoupon(couponCode.trim());
            
            if (response.status === 'success') {
                showToast('success', response.message || 'Coupon applied successfully');
                
                // Refresh user data to get updated balance
                await refreshUser();
                
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                showToast('error', response.message || 'Failed to apply coupon');
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to apply coupon');
        } finally {
            setApplying(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Coupon Code
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="pricetag" size={64} color={colors.primary} />
                    </View>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Redeem Coupon Code
                </Text>
                <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                    Enter your coupon code to add funds to your wallet
                </Text>

                {/* Coupon Input */}
                <View style={[styles.inputCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Coupon Code
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.icon + '30' }]}>
                        <Ionicons name="ticket-outline" size={20} color={colors.icon} />
                        <TextInput
                            placeholder="Enter coupon code"
                            placeholderTextColor={colors.icon}
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                            style={[styles.input, { color: colors.text, fontFamily: fonts.inter.medium }]}
                        />
                    </View>
                </View>

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Coupon codes are case-sensitive. Make sure to enter the exact code you received.
                    </Text>
                </View>

             
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <Button
                    title={applying ? 'Applying...' : 'Apply Coupon'}
                    onPress={handleApplyCoupon}
                    disabled={!couponCode.trim() || applying}
                    style={{ opacity: (!couponCode.trim() || applying) ? 0.5 : 1 }}
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    inputCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
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
    featureText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    tipsCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    tipsTitle: {
        fontSize: 16,
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    tipText: {
        flex: 1,
        fontSize: 12,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
