import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PaymentWebViewScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { showToast } = useToast();
    const params = useLocalSearchParams();
    const paymentUrl = params.url;
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const webViewRef = useRef(null);
    const hasNavigatedRef = useRef(false);

    const handleNavigationStateChange = (navState) => {
        // Prevent multiple navigations
        if (hasNavigatedRef.current) return;
        
        const url = navState.url.toLowerCase();
        
        // Check if redirected back to ulamdadata.ng (payment completed)
        if (url.includes('ulamadata.ng') && !url.includes('monnify') && !url.includes('checkout')) {
            hasNavigatedRef.current = true;
            showToast('success', 'Payment completed successfully!');
            setTimeout(() => {
                router.replace('/(tabs)/home');
            }, 800);
            return;
        }
        
        // Check for success patterns
        if (url.includes('success') || url.includes('completed') || url.includes('approved')) {
            hasNavigatedRef.current = true;
            showToast('success', 'Payment completed successfully!');
            setTimeout(() => {
                router.replace('/(tabs)/home');
            }, 800);
            return;
        }
        
        // Check for failure patterns
        if (url.includes('failed') || url.includes('error') || url.includes('declined')) {
            hasNavigatedRef.current = true;
            showToast('error', 'Payment failed. Please try again.');
            setTimeout(() => {
                router.back();
            }, 1500);
            return;
        }
        
        // Check for cancellation
        if (url.includes('cancel')) {
            hasNavigatedRef.current = true;
            showToast('info', 'Payment cancelled');
            setTimeout(() => {
                router.back();
            }, 800);
            return;
        }
    };

    const handleClose = () => {
        setShowCancelModal(true);
    };

    const handleConfirmCancel = () => {
        setShowCancelModal(false);
        router.back();
    };

    const handleDismissModal = () => {
        setShowCancelModal(false);
    };

    const handleError = () => {
        showToast('error', 'Failed to load payment page');
        setTimeout(() => {
            router.back();
        }, 1500);
    };

    if (!paymentUrl) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorContainer}>
                    <View style={[styles.errorIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="alert-circle" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.errorTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        No Payment URL
                    </Text>
                    <Text style={[styles.errorText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Unable to load payment page. Please try again.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.errorButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.errorButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={28} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Secure Payment
                    </Text>
                    <View style={styles.securityBadge}>
                        <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                        <Text style={[styles.securityText, { fontFamily: fonts.inter.medium }]}>
                            Encrypted
                        </Text>
                    </View>
                </View>
                <View style={{ width: 28 }} />
            </View>

            {/* Loading Overlay */}
            {loading && (
                <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
                    <View style={[styles.loadingCard, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff' }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Loading payment gateway...
                        </Text>
                        <Text style={[styles.loadingSubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Please wait
                        </Text>
                    </View>
                </View>
            )}

            {/* WebView */}
            <WebView
                ref={webViewRef}
                source={{ uri: paymentUrl }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={handleError}
                onNavigationStateChange={handleNavigationStateChange}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                bounces={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            />

            {/* Cancel Payment Modal */}
            <Modal
                visible={showCancelModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleDismissModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff' }]}>
                        <View style={[styles.modalIcon, { backgroundColor: '#EF444415' }]}>
                            <Ionicons name="warning" size={40} color="#EF4444" />
                        </View>
                        
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Cancel Payment?
                        </Text>
                        
                        <Text style={[styles.modalMessage, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Are you sure you want to cancel this payment? Your transaction will not be completed.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                onPress={handleDismissModal}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Continue Payment
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: '#EF4444' }]}
                                onPress={handleConfirmCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary, { fontFamily: fonts.inter.semiBold }]}>
                                    Yes, Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
        paddingBottom: 16,
    },
    closeButton: {
        padding: 0,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    headerTitle: {
        fontSize: 16,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#10B98115',
    },
    securityText: {
        fontSize: 10,
        color: '#10B981',
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingCard: {
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    loadingText: {
        fontSize: 15,
        marginTop: 8,
    },
    loadingSubtext: {
        fontSize: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    errorButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    modalIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    modalButtons: {
        width: '100%',
        gap: 12,
    },
    modalButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonSecondary: {
        borderWidth: 0,
    },
    modalButtonPrimary: {
        borderWidth: 0,
    },
    modalButtonText: {
        fontSize: 15,
    },
    modalButtonTextPrimary: {
        color: '#fff',
    },
});
