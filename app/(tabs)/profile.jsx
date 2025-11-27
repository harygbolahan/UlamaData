import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileTab() {
    const { colors, fonts, toggleTheme, isDark } = useTheme();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => {
        setShowLogoutDialog(true);
    };

    const confirmLogout = async () => {
        setShowLogoutDialog(false);
        setIsLoggingOut(true);
        await logout(true); // Pass true to clear biometric credentials
        setIsLoggingOut(false);
        router.replace('/(auth)/login');
    };

    const menuItems = [
        { id: '1', title: 'Personal Information', icon: 'person-outline', route: '/(profile)/personal' },
        { id: '2', title: 'Upgrade Account', icon: 'arrow-up-circle-outline', route: '/(profile)/upgrade' },
        // { id: '3', title: 'Referral Program', icon: 'gift-outline', route: '/(profile)/referral' },
        // { id: '4', title: 'Dashboard Style', icon: 'grid-outline', route: '/(profile)/dashboard-selector' },
        { id: '5', title: 'Security & Privacy', icon: 'shield-checkmark-outline', route: '/(profile)/security' },
        // { id: '6', title: 'Payment Methods', icon: 'card-outline', route: '/(profile)/payment' },
        // { id: '7', title: 'Transaction History', icon: 'time-outline', route: '/(profile)/history' },
        { id: '8', title: 'Notifications', icon: 'notifications-outline', route: '/(profile)/notifications' },
        { id: '9', title: 'Help & Support', icon: 'help-circle-outline', route: '/(profile)/support' },
        { id: '10', title: 'About', icon: 'information-circle-outline', route: '/(profile)/about' },
    ];

    const isKycVerified = user?.KycStatus === 'verified';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Profile
                </Text>
                <TouchableOpacity>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* KYC Alert Card */}
                {!isKycVerified && (
                    <TouchableOpacity 
                        style={[styles.kycAlert, { 
                            backgroundColor: colors.warning + '15',
                            borderColor: colors.warning + '40',
                        }]}
                        onPress={() => router.push('/(profile)/kyc')}
                    >
                        <View style={[styles.kycIconContainer, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="alert-circle" size={24} color={colors.warning} />
                        </View>
                        <View style={styles.kycContent}>
                            <Text style={[styles.kycTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Complete KYC Verification
                            </Text>
                            <Text style={[styles.kycMessage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Verify your identity to unlock higher limits
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.warning} />
                    </TouchableOpacity>
                )}

                {/* Profile Card */}
                <View style={[styles.profileCard, {
                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                }]}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                                style={styles.avatarImage}
                            />
                            <TouchableOpacity style={styles.editAvatar}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.profileName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {user?.name || 'John'} {user?.surname || 'Doe'}
                            </Text>
                            {user?.KycStatus && (
                                <View style={[styles.verificationBadge, { 
                                    backgroundColor: user.KycStatus === 'verified' ? colors.success + '20' : colors.warning + '20' 
                                }]}>
                                    <Ionicons 
                                        name={user.KycStatus === 'verified' ? 'checkmark-circle' : 'alert-circle'} 
                                        size={12} 
                                        color={user.KycStatus === 'verified' ? colors.success : colors.warning} 
                                    />
                                    <Text style={[styles.verificationText, { 
                                        color: user.KycStatus === 'verified' ? colors.success : colors.warning,
                                        fontFamily: fonts.inter.medium 
                                    }]}>
                                        {user.KycStatus === 'verified' ? 'Verified' : 'Unverified'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.profileEmail, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            {user?.email || 'john.doe@example.com'}
                        </Text>
                        <Text style={[styles.profilePhone, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            {user?.phone || '+234 801 234 5678'}
                        </Text>
                        {user?.type && (
                            <View style={[styles.accountTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.accountTypeText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                    {user.type} Account
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {user?.maxTrans || '0'}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Max Trans
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.isDark ? '#2a2a2a' : '#e0e0e0' }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                ₦{parseFloat(user?.wallet || 0).toLocaleString()}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Wallet
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.isDark ? '#2a2a2a' : '#e0e0e0' }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                ₦{parseFloat(user?.cashback || 0).toLocaleString()}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Cashback
                            </Text>
                        </View>
                    </View>
                </View>


                {/* Menu Items */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Account Settings
                    </Text>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, {
                                backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                            }]}
                            onPress={() => item.route && router.push(item.route)}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name={item.icon} size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.menuText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                {item.title}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Theme Toggle */}
                <View style={[styles.themeCard, {
                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                }]}>
                    <View style={styles.themeLeft}>
                        <View style={[styles.themeIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.themeText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Dark Mode
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggle, isDark && { backgroundColor: colors.primary }]}
                        onPress={toggleTheme}
                    >
                        <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={[styles.logoutButton, {
                        backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5',
                        opacity: isLoggingOut ? 0.6 : 1
                    }]}
                    onPress={handleLogout}
                    disabled={isLoggingOut}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error, fontFamily: fonts.inter.semiBold }]}>
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Logout Confirmation Dialog */}
            <Modal
                visible={showLogoutDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutDialog(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setShowLogoutDialog(false)}
                >
                    <Pressable 
                        style={[styles.dialogContainer, { backgroundColor: colors.background }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <View style={[styles.dialogIcon, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="log-out-outline" size={32} color={colors.error} />
                        </View>

                        {/* Title */}
                        <Text style={[styles.dialogTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Logout
                        </Text>

                        {/* Message */}
                        <Text style={[styles.dialogMessage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Are you sure you want to logout? You'll need to sign in again to access your account.
                        </Text>

                        {/* Buttons */}
                        <View style={styles.dialogButtons}>
                            <Pressable
                                style={[styles.dialogButton, styles.cancelButton, { 
                                    backgroundColor: colors.isDark ? colors.card : '#f5f5f5',
                                    borderColor: colors.border
                                }]}
                                onPress={() => setShowLogoutDialog(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Cancel
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.dialogButton, styles.logoutDialogButton]}
                                onPress={confirmLogout}
                            >
                                <LinearGradient
                                    colors={[colors.error, colors.error + 'DD']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={[styles.logoutDialogButtonText, { fontFamily: fonts.inter.bold }]}>
                                        Logout
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
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
    },
    profileCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 12,
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editAvatar: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2196F3',
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    profileName: {
        fontSize: 20,
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    verificationText: {
        fontSize: 10,
    },
    profileEmail: {
        fontSize: 12,
        marginBottom: 2,
    },
    profilePhone: {
        fontSize: 12,
        marginBottom: 8,
    },
    accountTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    accountTypeText: {
        fontSize: 11,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 17,
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 11,
    },
    statDivider: {
        width: 1,
        height: 40,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 24,
    },
    quickActionCard: {
        width: '48%',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    quickActionText: {
        fontSize: 11,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    menuItem: {
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    menuText: {
        flex: 1,
        fontSize: 13,
    },
    themeCard: {
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    themeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    themeText: {
        fontSize: 13,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ccc',
        padding: 2,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },
    logoutButton: {
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    logoutText: {
        fontSize: 14,
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
    logoutDialogButton: {
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutDialogButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    kycAlert: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    kycIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kycContent: {
        flex: 1,
    },
    kycTitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    kycMessage: {
        fontSize: 12,
    },
});
