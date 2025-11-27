import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function UpgradeScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { user, getLevels, upgradeLevel } = useAuth();
    const { showToast } = useToast();
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        setIsLoading(true);
        const result = await getLevels();
        setIsLoading(false);

        if (result.success) {
            setLevels(result.data.levels || []);
        }
    };

    const handleUpgradePress = (level) => {
        setSelectedLevel(level);
        setShowConfirmDialog(true);
    };

    const confirmUpgrade = async () => {
        if (!selectedLevel) return;

        setShowConfirmDialog(false);
        setIsUpgrading(true);

        const result = await upgradeLevel(selectedLevel.name);
        setIsUpgrading(false);

        if (result.success) {
            // Refresh levels after upgrade
            fetchLevels();
        }
    };

    const getLevelIcon = (levelName) => {
        const name = levelName.toUpperCase();
        if (name.includes('TOP')) return 'star';
        if (name.includes('AFFILIATE')) return 'people';
        if (name.includes('API')) return 'code-slash';
        return 'trophy';
    };

    const getLevelColor = (index) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        return colors[index % colors.length];
    };

    const isCurrentLevel = (levelName) => {
        return user?.type?.toUpperCase() === levelName.toUpperCase();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Upgrade Account
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Wallet Balance */}
                <View style={[styles.walletCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <View style={styles.walletLeft}>
                        <Text style={[styles.walletLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Wallet Balance
                        </Text>
                        <Text style={[styles.walletAmount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            ₦{parseFloat(user?.wallet || 0).toLocaleString()}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.fundButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/fund-wallet')}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={[styles.fundButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Fund
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Current Level */}
                {user?.type && (
                    <View style={[styles.currentLevelCard, { 
                        backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                        borderColor: colors.primary,
                    }]}>
                        <View style={styles.currentLevelContent}>
                            <View style={[styles.currentLevelIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.currentLevelInfo}>
                                <Text style={[styles.currentLevelLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Current Level
                                </Text>
                                <Text style={[styles.currentLevelName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    {user.type.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Loading levels...
                        </Text>
                    </View>
                )}

                {/* Levels List */}
                {!isLoading && levels.length > 0 && (
                    <View style={styles.levelsContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Available Levels
                        </Text>
                        {levels.map((level, index) => {
                            const levelColor = getLevelColor(index);
                            const isCurrent = isCurrentLevel(level.name);
                            const canAfford = parseFloat(user?.wallet || 0) >= parseFloat(level.price);

                            return (
                                <View
                                    key={level.id}
                                    style={[styles.levelCard, { 
                                        backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                                        borderColor: isCurrent ? colors.primary : 'transparent',
                                        borderWidth: isCurrent ? 2 : 0,
                                    }]}
                                >
                                    <View style={styles.levelHeader}>
                                        <View style={[styles.levelIcon, { backgroundColor: levelColor + '20' }]}>
                                            <Ionicons name={getLevelIcon(level.name)} size={24} color={levelColor} />
                                        </View>
                                        <View style={styles.levelInfo}>
                                            <View style={styles.levelNameRow}>
                                                <Text style={[styles.levelName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                                    {level.name}
                                                </Text>
                                                {isCurrent && (
                                                    <View style={[styles.currentBadge, { backgroundColor: colors.primary + '20' }]}>
                                                        <Text style={[styles.currentBadgeText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                            Current
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.levelPrice, { color: levelColor, fontFamily: fonts.inter.bold }]}>
                                                ₦{parseFloat(level.price).toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>

                                    {!isCurrent && (
                                        <>
                                            {!canAfford && (
                                                <View style={[styles.warningBadge, { backgroundColor: colors.error + '15' }]}>
                                                    <Ionicons name="alert-circle" size={14} color={colors.error} />
                                                    <Text style={[styles.warningText, { color: colors.error, fontFamily: fonts.inter.regular }]}>
                                                        Insufficient balance
                                                    </Text>
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.upgradeButton, { 
                                                    backgroundColor: levelColor,
                                                    opacity: isUpgrading ? 0.6 : 1
                                                }]}
                                                onPress={() => handleUpgradePress(level)}
                                                disabled={isUpgrading}
                                            >
                                                <Text style={[styles.upgradeButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                                    {isUpgrading ? 'Processing...' : 'Upgrade Now'}
                                                </Text>
                                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Empty State */}
                {!isLoading && levels.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="layers-outline" size={64} color={colors.icon} />
                        <Text style={[styles.emptyStateText, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                            No upgrade levels available
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Confirmation Dialog */}
            <Modal
                visible={showConfirmDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowConfirmDialog(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setShowConfirmDialog(false)}
                >
                    <Pressable 
                        style={[styles.dialogContainer, { backgroundColor: colors.background }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={[styles.dialogIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="arrow-up-circle" size={32} color={colors.primary} />
                        </View>

                        <Text style={[styles.dialogTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Confirm Upgrade
                        </Text>

                        <Text style={[styles.dialogMessage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Are you sure you want to upgrade to {selectedLevel?.name} for ₦{parseFloat(selectedLevel?.price || 0).toLocaleString()}?
                        </Text>

                        <View style={styles.dialogButtons}>
                            <Pressable
                                style={[styles.dialogButton, styles.cancelButton, { 
                                    backgroundColor: isDark ? colors.card : '#f5f5f5',
                                    borderColor: colors.border
                                }]}
                                onPress={() => setShowConfirmDialog(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Cancel
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.dialogButton, styles.confirmButton]}
                                onPress={confirmUpgrade}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primary + 'DD']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={[styles.confirmButtonText, { fontFamily: fonts.inter.bold }]}>
                                        Confirm
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
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
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    walletCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    walletLeft: {},
    walletLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    walletAmount: {
        fontSize: 20,
    },
    fundButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    fundButtonText: {
        color: '#fff',
        fontSize: 13,
    },
    currentLevelCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 2,
    },
    currentLevelContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    currentLevelIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLevelInfo: {
        flex: 1,
    },
    currentLevelLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    currentLevelName: {
        fontSize: 17,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        marginTop: 12,
    },
    levelsContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    levelCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    levelIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelInfo: {
        flex: 1,
    },
    levelNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    levelName: {
        fontSize: 16,
    },
    currentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    currentBadgeText: {
        fontSize: 10,
    },
    levelPrice: {
        fontSize: 18,
    },
    warningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    warningText: {
        fontSize: 12,
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 14,
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialogContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    dialogIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    dialogTitle: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 12,
    },
    dialogMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    dialogButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    dialogButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cancelButton: {
        borderWidth: 1.5,
    },
    cancelButtonText: {
        fontSize: 15,
        textAlign: 'center',
        paddingVertical: 14,
    },
    confirmButton: {
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 15,
    },
});
