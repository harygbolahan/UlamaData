import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function TerminateAccountScreen() {
    const { colors, fonts } = useTheme();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTerminate = () => {
        if (!reason.trim()) {
            showToast('error', 'Please provide a reason for account termination');
            return;
        }
        setShowConfirmDialog(true);
    };

    const confirmTermination = async () => {
        if (!password.trim()) {
            showToast('error', 'Please enter your password to confirm');
            return;
        }

        setIsProcessing(true);
        // TODO: Implement actual API call to terminate account
        // const result = await terminateAccount({ password, reason });
        
        setTimeout(() => {
            setIsProcessing(false);
            setShowConfirmDialog(false);
            showToast('success', 'Account terminated successfully');
            logout(true);
            router.replace('/(auth)/login');
        }, 2000);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Terminate Account
                </Text>
                <View style={{ width: 24 * scale }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Warning Card */}
                <View style={[styles.warningCard, { 
                    backgroundColor: colors.error + '15',
                    borderColor: colors.error + '40',
                }]}>
                    <View style={[styles.warningIcon, { backgroundColor: colors.error + '20' }]}>
                        <Ionicons name="warning" size={32 * scale} color={colors.error} />
                    </View>
                    <Text style={[styles.warningTitle, { color: colors.error, fontFamily: fonts.inter.bold }]}>
                        Warning: This Action is Permanent
                    </Text>
                    <Text style={[styles.warningText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Terminating your account will permanently delete all your data and cannot be undone.
                    </Text>
                </View>

                {/* What Will Happen */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        What Will Happen
                    </Text>
                    
                    {[
                        { icon: 'wallet', text: 'Your wallet balance will be forfeited' },
                        { icon: 'gift', text: 'All cashback and rewards will be lost' },
                        { icon: 'time', text: 'Transaction history will be permanently deleted' },
                        { icon: 'person', text: 'Personal information will be removed' },
                        { icon: 'card', text: 'Saved payment methods will be deleted' },
                        { icon: 'notifications', text: 'You will no longer receive notifications' },
                    ].map((item, index) => (
                        <View key={index} style={[styles.listItem, { backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <Ionicons name={item.icon} size={20 * scale} color={colors.error} />
                            <Text style={[styles.listText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                {item.text}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* User Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Account to be terminated
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        {user?.name} {user?.surname}
                    </Text>
                    <Text style={[styles.infoEmail, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {user?.email}
                    </Text>
                </View>

                {/* Reason Input */}
                <View style={styles.section}>
                    <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                        Reason for Termination *
                    </Text>
                    <TextInput
                        style={[styles.textArea, { 
                            backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5',
                            color: colors.text,
                            fontFamily: fonts.inter.regular,
                            borderColor: colors.border
                        }]}
                        placeholder="Please tell us why you're leaving..."
                        placeholderTextColor={colors.icon}
                        multiline
                        numberOfLines={4}
                        value={reason}
                        onChangeText={setReason}
                        textAlignVertical="top"
                    />
                </View>

                {/* Terminate Button */}
                <TouchableOpacity 
                    style={[styles.terminateButton, { opacity: !reason.trim() ? 0.5 : 1 }]}
                    onPress={handleTerminate}
                    disabled={!reason.trim()}
                >
                    <LinearGradient
                        colors={[colors.error, colors.error + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Ionicons name="trash" size={20 * scale} color="#fff" />
                        <Text style={[styles.terminateButtonText, { fontFamily: fonts.inter.bold }]}>
                            Terminate Account
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
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
                    onPress={() => !isProcessing && setShowConfirmDialog(false)}
                >
                    <Pressable 
                        style={[styles.dialogContainer, { backgroundColor: colors.background }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={[styles.dialogIcon, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="warning" size={32 * scale} color={colors.error} />
                        </View>

                        <Text style={[styles.dialogTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Confirm Account Termination
                        </Text>

                        <Text style={[styles.dialogMessage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            This action cannot be undone. Please enter your password to confirm.
                        </Text>

                        <TextInput
                            style={[styles.passwordInput, { 
                                backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5',
                                color: colors.text,
                                fontFamily: fonts.inter.regular,
                                borderColor: colors.border
                            }]}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.icon}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isProcessing}
                        />

                        <View style={styles.dialogButtons}>
                            <Pressable
                                style={[styles.dialogButton, styles.cancelButton, { 
                                    backgroundColor: colors.isDark ? colors.card : '#f5f5f5',
                                    borderColor: colors.border,
                                    opacity: isProcessing ? 0.5 : 1
                                }]}
                                onPress={() => setShowConfirmDialog(false)}
                                disabled={isProcessing}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Cancel
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.dialogButton, { opacity: isProcessing ? 0.5 : 1 }]}
                                onPress={confirmTermination}
                                disabled={isProcessing}
                            >
                                <LinearGradient
                                    colors={[colors.error, colors.error + 'DD']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={[styles.confirmButtonText, { fontFamily: fonts.inter.bold }]}>
                                        {isProcessing ? 'Processing...' : 'Confirm'}
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
        fontSize: 18 * scale,
    },
    warningCard: {
        marginHorizontal: 20 * scale,
        padding: 20 * scale,
        borderRadius: 16 * scale,
        marginBottom: 24 * scale,
        alignItems: 'center',
        borderWidth: 1,
    },
    warningIcon: {
        width: 64 * scale,
        height: 64 * scale,
        borderRadius: 32 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12 * scale,
    },
    warningTitle: {
        fontSize: 18 * scale,
        marginBottom: 8 * scale,
        textAlign: 'center',
    },
    warningText: {
        fontSize: 13 * scale,
        textAlign: 'center',
        lineHeight: 20 * scale,
    },
    section: {
        marginHorizontal: 20 * scale,
        marginBottom: 24 * scale,
    },
    sectionTitle: {
        fontSize: 16 * scale,
        marginBottom: 12 * scale,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12 * scale,
        borderRadius: 12 * scale,
        marginBottom: 8 * scale,
        gap: 12 * scale,
    },
    listText: {
        flex: 1,
        fontSize: 13 * scale,
    },
    infoCard: {
        marginHorizontal: 20 * scale,
        padding: 16 * scale,
        borderRadius: 12 * scale,
        marginBottom: 24 * scale,
    },
    infoLabel: {
        fontSize: 11 * scale,
        marginBottom: 4 * scale,
    },
    infoValue: {
        fontSize: 16 * scale,
        marginBottom: 2 * scale,
    },
    infoEmail: {
        fontSize: 12 * scale,
    },
    inputLabel: {
        fontSize: 13 * scale,
        marginBottom: 8 * scale,
    },
    textArea: {
        padding: 12 * scale,
        borderRadius: 12 * scale,
        fontSize: 13 * scale,
        minHeight: 100 * scale,
        borderWidth: 1,
    },
    terminateButton: {
        marginHorizontal: 20 * scale,
        borderRadius: 12 * scale,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        paddingVertical: 14 * scale,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8 * scale,
    },
    terminateButtonText: {
        color: '#fff',
        fontSize: 15 * scale,
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
        fontSize: 20 * scale,
        textAlign: 'center',
        marginBottom: 12 * scale,
    },
    dialogMessage: {
        fontSize: 13 * scale,
        textAlign: 'center',
        lineHeight: 20 * scale,
        marginBottom: 20 * scale,
    },
    passwordInput: {
        padding: 12 * scale,
        borderRadius: 12 * scale,
        fontSize: 13 * scale,
        marginBottom: 20 * scale,
        borderWidth: 1,
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
    confirmButtonText: {
        color: '#fff',
        fontSize: 15 * scale,
    },
});
