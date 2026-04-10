import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReferralScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { user, getReferralData } = useAuth();
    const { showToast } = useToast();
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

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

    const shareReferralLink = async () => {
        try {
            const link = referralData?.referralLink || `https://ulamadata.ng/register?ref=${user?.id || referralData?.referralCode || user?.referral_code}`;
            const message = `Join UlamaData using my referral link: ${link}\n\nDownload the app and start enjoying amazing benefits!`;

            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const referralLink = referralData?.referralLink || `https://ulamadata.ng/register?ref=${user?.id || referralData?.referralCode || user?.referral_code || ''}`;
    const totalReferrals = referralData?.totalReferrals || 0;
    const referralEarnings = referralData?.totalEarnings || 0;
    const referralsList = referralData?.referrals || [];

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Recently';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
                        Your Referral Link
                    </Text>
                    <View style={[styles.codeBox, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]} numberOfLines={1} ellipsizeMode="middle">
                            {referralLink}
                        </Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => copyToClipboard(referralLink)}
                        >
                            <Ionicons name="copy" size={18} color="#fff" />
                            <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                Copy Link
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={shareReferralLink}
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
                                Share your referral link with friends
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { fontFamily: fonts.inter.bold }]}>2</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                They sign up using your link
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
                ) : referralsList.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Your Referrals
                        </Text>
                        {referralsList.map((referral, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.referralItem, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                onPress={() => handleReferralPress(referral)}
                                activeOpacity={0.7}
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
                                    <View style={styles.referralMeta}>
                                        <Text style={[styles.referralDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Joined {formatDate(referral.created_at)}
                                        </Text>
                                        <Text style={[styles.referralDot, { color: colors.icon }]}>•</Text>
                                        <Text style={[styles.referralTransactions, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                            {referral.transaction_count || 0} Trx
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.referralBadge, { backgroundColor: '#10B981' + '20' }]}>
                                    <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={colors.icon} />
                        <Text style={[styles.emptyStateText, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                            No referrals yet
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Start sharing your link to earn rewards
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Referral Details Modal */}
            <Modal
                visible={showDetailsModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowDetailsModal(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#333' : '#ddd' }]} />

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Referral Details
                            </Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedReferral && (
                            <View style={styles.detailsContainer}>
                                <View style={styles.detailsHeader}>
                                    <View style={[styles.detailsAvatar, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.detailsInitial, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                            {selectedReferral.name?.charAt(0).toUpperCase() || 'U'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.detailsName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        {selectedReferral.name || 'User'}
                                    </Text>
                                </View>

                                <View style={styles.infoList}>
                                    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Email Address
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {selectedReferral.email || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                        <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Joined Date
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {formatDate(selectedReferral.created_at)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                                        <Ionicons name="list-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Total Transactions
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {selectedReferral.transaction_count || 0}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoItem, { borderBottomColor: 'transparent' }]}>
                                        <Ionicons name="id-card-outline" size={20} color={colors.icon} />
                                        <View style={styles.infoText}>
                                            <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Referral ID
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                #{selectedReferral.id || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
    linkText: {
        fontSize: 14,
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
    referralMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    referralDot: {
        fontSize: 12,
        opacity: 0.5,
    },
    referralTransactions: {
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
    },
    detailsContainer: {
        alignItems: 'center',
    },
    detailsHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    detailsAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailsInitial: {
        fontSize: 32,
    },
    detailsName: {
        fontSize: 22,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
    },
    infoList: {
        width: '100%',
        gap: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    infoText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
    },
});
