import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EarnTab() {
    const { colors, fonts, isDark } = useTheme();
    const { getReferralData, user } = useAuth();
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchReferralData();
        }, [])
    );

    const fetchReferralData = async () => {
        setIsLoading(true);
        const result = await getReferralData();
        if (result.success) {
            setReferralData(result.data);
        }
        setIsLoading(false);
    };

    const handleCopyCode = async () => {
        if (referralData?.referralCode) {
            await Clipboard.setStringAsync(referralData.referralCode);
            Alert.alert('Copied!', 'Referral code copied to clipboard');
        }
    };

    const handleShareCode = async () => {
        if (referralData?.referralCode) {
            try {
                await Share.share({
                    message: `Join me on DataBeta! Use my referral code: ${referralData.referralCode}`,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Earn Rewards
                </Text>
                <TouchableOpacity>
                    <Ionicons name="information-circle-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.balanceRow}>
                        <View>
                            <Text style={[styles.balanceLabel, { fontFamily: fonts.inter.regular }]}>
                                Total Earnings
                            </Text>
                            <Text style={[styles.balanceAmount, { fontFamily: fonts.inter.bold }]}>
                                ₦{user?.cashback || '0'}
                            </Text>
                        </View>
                        <View style={styles.pointsBadge}>
                            <Ionicons name="people" size={16} color="#FFD700" />
                            <Text style={[styles.pointsText, { fontFamily: fonts.inter.semiBold }]}>
                                {referralData?.totalReferrals || 0} referrals
                            </Text>
                        </View>
                    </View>
                </View>


                {/* Referral Card */}
                <View style={[styles.referralCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.referralTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Your Referral Code
                    </Text>
                    <View style={[styles.codeContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.codeText, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            {referralData?.referralCode || 'N/A'}
                        </Text>
                        <TouchableOpacity onPress={handleCopyCode}>
                            <Ionicons name="copy-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        style={[styles.shareButton, { backgroundColor: colors.primary }]}
                        onPress={handleShareCode}
                    >
                        <Ionicons name="share-social" size={18} color="#fff" />
                        <Text style={[styles.shareText, { fontFamily: fonts.inter.semiBold }]}>
                            Share Code
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
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
    headerTitle: { fontSize: 22 },
    balanceCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceLabel: { color: '#fff', fontSize: 12, opacity: 0.9, marginBottom: 6 },
    balanceAmount: { color: '#fff', fontSize: 28 },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 5,
    },
    pointsText: { color: '#fff', fontSize: 11 },
    sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
    earnCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    earnIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    earnInfo: { flex: 1 },
    earnTitle: { fontSize: 14, marginBottom: 4 },
    earnDesc: { fontSize: 12, marginBottom: 8 },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },
    referralCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginTop: 12,
    },
    referralTitle: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    codeText: { fontSize: 18, letterSpacing: 2 },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    shareText: { color: '#fff', fontSize: 14 },
});
