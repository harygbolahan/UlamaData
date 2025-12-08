import { AutoLockDebug } from '@/components/auto-lock-debug';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

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
        // { id: '8', title: 'Notifications', icon: 'notifications-outline', route: '/(profile)/notifications' },
        { id: '9', title: 'Help & Support', icon: 'help-circle-outline', route: '/(profile)/support' },
        { id: '10', title: 'Privacy Policy', icon: 'shield-outline', route: '/(profile)/privacy-policy' },
        { id: '11', title: 'Terms & Conditions', icon: 'document-text-outline', route: '/(profile)/terms-conditions' },
        { id: '12', title: 'About', icon: 'information-circle-outline', route: '/(profile)/about' },
        { id: '13', title: 'Terminate Account', icon: 'trash-outline', route: '/(profile)/terminate-account', danger: true },
    ];

    const isKycVerified = user?.KycStatus === 'verified';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Profile
                </Text>
                <TouchableOpacity>
                    <Ionicons name="settings-outline" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Auto-Lock Debug - Remove this in production */}
                 {/* <AutoLockDebug />  */}

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
                            <Ionicons name="alert-circle" size={24 * scale} color={colors.warning} />
                        </View>
                        <View style={styles.kycContent}>
                            <Text style={[styles.kycTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Complete KYC Verification
                            </Text>
                            <Text style={[styles.kycMessage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Verify your identity to unlock higher limits
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20 * scale} color={colors.warning} />
                    </TouchableOpacity>
                )}

                {/* Profile Card */}
                <View style={[styles.profileCard, {
                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                }]}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatarLarge, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="person" size={40 * scale} color={colors.primary} />
                            <TouchableOpacity style={[styles.editAvatar, { backgroundColor: colors.primary }]}>
                                <Ionicons name="camera" size={14 * scale} color="#fff" />
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
                                        size={12 * scale} 
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
                            <View style={[styles.menuIcon, { 
                                backgroundColor: item.danger ? colors.error + '20' : colors.primary + '20' 
                            }]}>
                                <Ionicons 
                                    name={item.icon} 
                                    size={18 * scale} 
                                    color={item.danger ? colors.error : colors.primary} 
                                />
                            </View>
                            <Text style={[styles.menuText, { 
                                color: item.danger ? colors.error : colors.text, 
                                fontFamily: fonts.inter.medium 
                            }]}>
                                {item.title}
                            </Text>
                            <Ionicons name="chevron-forward" size={20 * scale} color={colors.icon} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Theme Toggle */}
                <View style={[styles.themeCard, {
                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                }]}>
                    <View style={styles.themeLeft}>
                        <View style={[styles.themeIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18 * scale} color={colors.primary} />
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
                    <Ionicons name="log-out-outline" size={20 * scale} color={colors.error} />
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
                            <Ionicons name="log-out-outline" size={32 * scale} color={colors.error} />
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
        paddingHorizontal: 20 * scale,
        paddingTop: 50 * scale,
        marginBottom: 20 * scale,
    },
    headerTitle: {
        fontSize: 22 * scale,
    },
    profileCard: {
        marginHorizontal: 20 * scale,
        padding: 20 * scale,
        borderRadius: 16 * scale,
        marginBottom: 20 * scale,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20 * scale,
    },
    avatarLarge: {
        width: 80 * scale,
        height: 80 * scale,
        borderRadius: 40 * scale,
        marginBottom: 12 * scale,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAvatar: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2196F3',
        width: 26 * scale,
        height: 26 * scale,
        borderRadius: 13 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2 * scale,
        borderColor: '#fff',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * scale,
        marginBottom: 6 * scale,
    },
    profileName: {
        fontSize: 20 * scale,
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 * scale,
        paddingHorizontal: 8 * scale,
        paddingVertical: 3 * scale,
        borderRadius: 12 * scale,
    },
    verificationText: {
        fontSize: 10 * scale,
    },
    profileEmail: {
        fontSize: 12 * scale,
        marginBottom: 2 * scale,
    },
    profilePhone: {
        fontSize: 12 * scale,
        marginBottom: 8 * scale,
    },
    accountTypeBadge: {
        paddingHorizontal: 12 * scale,
        paddingVertical: 4 * scale,
        borderRadius: 12 * scale,
        marginTop: 4 * scale,
    },
    accountTypeText: {
        fontSize: 11 * scale,
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
        fontSize: 17 * scale,
        marginBottom: 3 * scale,
    },
    statLabel: {
        fontSize: 11 * scale,
    },
    statDivider: {
        width: 1,
        height: 40 * scale,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20 * scale,
        gap: 10 * scale,
        marginBottom: 24 * scale,
    },
    quickActionCard: {
        width: '48%',
        padding: 12 * scale,
        borderRadius: 12 * scale,
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 40 * scale,
        height: 40 * scale,
        borderRadius: 20 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6 * scale,
    },
    quickActionText: {
        fontSize: 11 * scale,
    },
    section: {
        marginBottom: 20 * scale,
    },
    sectionTitle: {
        fontSize: 18.2 * scale,
        paddingHorizontal: 20 * scale,
        marginBottom: 12 * scale,
    },
    menuItem: {
        marginHorizontal: 20 * scale,
        padding: 12 * scale,
        borderRadius: 12 * scale,
        marginBottom: 10 * scale,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        width: 36 * scale,
        height: 36 * scale,
        borderRadius: 18 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10 * scale,
    },
    menuText: {
        flex: 1,
        fontSize: 14.6 * scale,
    },
    themeCard: {
        marginHorizontal: 20 * scale,
        padding: 12 * scale,
        borderRadius: 12 * scale,
        marginBottom: 20 * scale,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    themeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIcon: {
        width: 36 * scale,
        height: 36 * scale,
        borderRadius: 18 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10 * scale,
    },
    themeText: {
        fontSize: 13 * scale,
    },
    toggle: {
        width: 50 * scale,
        height: 28 * scale,
        borderRadius: 14 * scale,
        backgroundColor: '#ccc',
        padding: 2 * scale,
    },
    toggleThumb: {
        width: 24 * scale,
        height: 24 * scale,
        borderRadius: 12 * scale,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 * scale }],
    },
    logoutButton: {
        marginHorizontal: 20 * scale,
        padding: 12 * scale,
        borderRadius: 12 * scale,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10 * scale,
    },
    logoutText: {
        fontSize: 14 * scale,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20 * scale,
    },
    dialogContainer: {
        width: '100%',
        maxWidth: 340 * scale,
        borderRadius: 20 * scale,
        padding: 24 * scale,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 * scale },
        shadowOpacity: 0.3,
        shadowRadius: 8 * scale,
        elevation: 8,
    },
    dialogIcon: {
        width: 64 * scale,
        height: 64 * scale,
        borderRadius: 32 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16 * scale,
    },
    dialogTitle: {
        fontSize: 22 * scale,
        textAlign: 'center',
        marginBottom: 12 * scale,
    },
    dialogMessage: {
        fontSize: 14 * scale,
        textAlign: 'center',
        lineHeight: 20 * scale,
        marginBottom: 24 * scale,
    },
    dialogButtons: {
        flexDirection: 'row',
        gap: 12 * scale,
    },
    dialogButton: {
        flex: 1,
        borderRadius: 12 * scale,
        overflow: 'hidden',
    },
    cancelButton: {
        borderWidth: 1.5 * scale,
    },
    cancelButtonText: {
        fontSize: 15 * scale,
        textAlign: 'center',
        paddingVertical: 14 * scale,
    },
    logoutDialogButton: {
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 14 * scale,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutDialogButtonText: {
        color: '#fff',
        fontSize: 15 * scale,
    },
    kycAlert: {
        marginHorizontal: 20 * scale,
        marginBottom: 16 * scale,
        padding: 16 * scale,
        borderRadius: 12 * scale,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12 * scale,
        borderWidth: 1,
    },
    kycIconContainer: {
        width: 40 * scale,
        height: 40 * scale,
        borderRadius: 20 * scale,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kycContent: {
        flex: 1,
    },
    kycTitle: {
        fontSize: 14 * scale,
        marginBottom: 2 * scale,
    },
    kycMessage: {
        fontSize: 12 * scale,
    },
});
