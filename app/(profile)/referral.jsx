import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReferralScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { user, getReferralData } = useAuth();
    const { showToast } = useToast();
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        setIsLoading(true);
        const result = await getReferralData();
        setIsLoading(false);

        if (result.success) {
            setReferralData(result.data);
        }
    };

    const copyToClipboard = async (text) => {
        await Clipboard.setStringAsync(String(text));
        showToast('success', 'Copied to clipboard!');
    };

    const shareReferralCode = async () => {
        try {
            const code = referralData?.refer_code || user?.referral_code;
            const message = `Join DataBeta using my referral code: ${code}\n\nDownload the app and start enjoying amazing benefits!`;
            
            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const referralCode = String(referralData?.refer_code || user?.referral_code || 'N/A');
    const totalReferrals = referralData?.count || 0;
    const referralEarnings = referralData?.earnings || 0;
    const referrals = referralData?.referrals || [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Referral Program
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Referral Code Card */}
                <View style={[styles.codeCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <View style={[styles.codeIconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="gift" size={28} color={colors.primary} />
                    </View>
                    <Text style={[styles.codeLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Your Referral Code
                    </Text>
                    <View style={[styles.codeBox, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                        <Text style={[styles.codeText, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            {referralCode}
                        </Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => copyToClipboard(referralCode)}
                        >
                            <Ionicons name="copy" size={18} color="#fff" />
                            <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                Copy Code
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={shareReferralCode}
                        >
                            <Ionicons name="share-social" size={18} color="#fff" />
                            <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                Share
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#10B981' + '20' }]}>
                            <Ionicons name="people" size={24} color="#10B981" />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            {totalReferrals}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Total Referrals
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                            <Ionicons name="cash" size={24} color="#F59E0B" />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            ₦{parseFloat(referralEarnings).toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Total Earnings
                        </Text>
                    </View>
                </View>

                {/* How it Works */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        How It Works
                    </Text>
                    <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>1</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                Share your referral code with friends
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>2</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                They sign up using your code
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>3</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                Earn rewards when they make transactions
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Referral List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Loading referrals...
                        </Text>
                    </View>
                ) : referrals.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Your Referrals
                        </Text>
                        {referrals.map((referral, index) => (
                            <View
                                key={index}
                                style={[styles.referralItem, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                            >
                                <View style={[styles.referralAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.referralInitial, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                        {referral.name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </View>
                                <View style={styles.referralInfo}>
                                    <Text style={[styles.referralName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        {referral.name || 'User'}
                                    </Text>
                                    <Text style={[styles.referralDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        Joined {referral.date || 'Recently'}
                                    </Text>
                                </View>
                                <View style={[styles.referralBadge, { backgroundColor: '#10B981' + '20' }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={colors.icon} />
                        <Text style={[styles.emptyStateText, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                            No referrals yet
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Start sharing your code to earn rewards
                        </Text>
                    </View>
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
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    codeCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    codeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    codeLabel: {
        fontSize: 13,
        marginBottom: 12,
    },
    codeBox: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    codeText: {
        fontSize: 24,
        letterSpacing: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 20,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 12,
    },
    infoCard: {
        padding: 16,
        borderRadius: 12,
        gap: 16,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 14,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        marginTop: 12,
    },
    referralItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    referralAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    referralInitial: {
        fontSize: 18,
    },
    referralInfo: {
        flex: 1,
    },
    referralName: {
        fontSize: 14,
        marginBottom: 2,
    },
    referralDate: {
        fontSize: 12,
    },
    referralBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 13,
    },
});
