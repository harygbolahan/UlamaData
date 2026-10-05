import ClassicDashboard from '@/components/dashboards/ClassicDashboard';
import CompactDashboard from '@/components/dashboards/CompactDashboard';
import DefaultDashboard from '@/components/dashboards/DefaultDashboard';
import MinimalDashboard from '@/components/dashboards/MinimalDashboard';
import ModernDashboard from '@/components/dashboards/ModernDashboard';
import HomeSkeleton from '@/components/ui/HomeSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { DASHBOARD_TYPES, useDashboard } from '@/contexts/dashboard-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const POPUP_SHOWN_KEY = 'popup_shown_for_session';

const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') return null;
    const trimmed = imagePath.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `https://ulamadata.ng${cleanPath}`;
};

export default function HomeTab() {
    const { selectedDashboard, isLoading, popupNotification, dismissPopupNotification, fetchNotifications } = useDashboard();
    const { colors, fonts, isDark } = useTheme();
    const { refreshUser, getSupportData, token } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [openingWhatsApp, setOpeningWhatsApp] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    // The popup is shown once per login. Each login issues a new token, so the token marks the session.
    const [popupAllowed, setPopupAllowed] = useState(false);

    const imageUrl = getImageUrl(popupNotification?.image);
    const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9);

    const hasValidContent = popupNotification && (
        !!imageUrl ||
        !!popupNotification?.msg ||
        !!popupNotification?.message ||
        !!popupNotification?.content ||
        !!popupNotification?.subject ||
        !!popupNotification?.title
    );

    useEffect(() => {
        if (imageUrl) {
            Image.getSize(
                imageUrl,
                (width, height) => {
                    if (width && height) {
                        setImageAspectRatio(width / height);
                    }
                },
                (error) => console.log('Image getSize error:', error)
            );
        }
    }, [imageUrl]);

    useEffect(() => {
        if (!token) return;
        const sessionKey = token.slice(-16);
        let cancelled = false;
        (async () => {
            try {
                const shownFor = await AsyncStorage.getItem(POPUP_SHOWN_KEY);
                if (cancelled || shownFor === sessionKey) {
                    setPopupAllowed(false);
                    return;
                }
                setPopupAllowed(true);
                // A previous login may have dismissed the popup, so fetch it again for this one
                fetchNotifications?.(true);
            } catch (error) {
                setPopupAllowed(false);
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    useEffect(() => {
        if (popupAllowed && hasValidContent) {
            const timer = setTimeout(() => {
                setPopupVisible(true);
                if (token) {
                    AsyncStorage.setItem(POPUP_SHOWN_KEY, token.slice(-16)).catch(() => {});
                }
                setPopupAllowed(false);
            }, 500);
            return () => clearTimeout(timer);
        } else if (!hasValidContent) {
            setPopupVisible(false);
        }
    }, [popupNotification, hasValidContent, popupAllowed]);

    const handleDismissPopup = () => {
        setPopupVisible(false);
        if (dismissPopupNotification) {
            dismissPopupNotification(popupNotification);
        }
    };

    const handleWhatsAppSupport = async () => {
        setOpeningWhatsApp(true);
        try {
            const result = await getSupportData();
            if (result.success && result.data?.socialMedia) {
                const waOption = result.data.socialMedia.find(item => item.name.toLowerCase().includes('whatsapp'));
                if (waOption && waOption.link) {
                    await Linking.openURL(waOption.link);
                }
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
        } finally {
            setOpeningWhatsApp(false);
        }
    };

    // Refresh user data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setRefreshing(true);
                await refreshUser();
                setRefreshing(false);
            };
            fetchData();
        }, [])
    );

    const renderDashboard = () => {
        switch (selectedDashboard) {
            case DASHBOARD_TYPES.MODERN:
                return <ModernDashboard />;
            case DASHBOARD_TYPES.CLASSIC:
                return <ClassicDashboard />;
            case DASHBOARD_TYPES.COMPACT:
                return <CompactDashboard />;
            case DASHBOARD_TYPES.MINIMAL:
                return <MinimalDashboard />;
            case DASHBOARD_TYPES.DEFAULT:
            default:
                return <DefaultDashboard />;
        }
    };

    const getSafeAreaColor = () => {
        if (selectedDashboard === DASHBOARD_TYPES.MODERN) {
            return '#000066';
        }
        return colors.background;
    };

    // Show skeleton on initial load only
    if (isLoading) {
        return (
            <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: getSafeAreaColor() }]}>
                <StatusBar 
                    backgroundColor={getSafeAreaColor()} 
                    barStyle={selectedDashboard === DASHBOARD_TYPES.MODERN ? 'light-content' : (isDark ? 'light-content' : 'dark-content')} 
                />
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <HomeSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: getSafeAreaColor() }]}>
            <StatusBar 
                backgroundColor={getSafeAreaColor()} 
                barStyle={selectedDashboard === DASHBOARD_TYPES.MODERN ? 'light-content' : (isDark ? 'light-content' : 'dark-content')} 
            />
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                {renderDashboard()}
            </View>

            {/* Floating WhatsApp Button */}
            <TouchableOpacity 
                style={styles.fabWhatsApp} 
                onPress={handleWhatsAppSupport}
                activeOpacity={0.8}
                disabled={openingWhatsApp}
            >
                {openingWhatsApp ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                    <Ionicons name="logo-whatsapp" size={32} color="#ffffff" />
                )}
            </TouchableOpacity>

            {/* Pop-up Notification Drawer */}
            {popupVisible && hasValidContent && (
                <Modal
                    visible={true}
                    transparent
                    animationType="slide"
                    onRequestClose={handleDismissPopup}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity 
                            style={styles.modalBackdrop} 
                            activeOpacity={1} 
                            onPress={handleDismissPopup} 
                        />
                        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
                            {/* Drawer Handle Indicator */}
                            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3a3a3a' : '#e5e5e5' }]} />
                            
                            <View style={styles.modalHeader}>
                                <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="megaphone-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts?.inter?.bold || 'System', fontSize: 18, flex: 1 }]}>
                                    {popupNotification?.subject || popupNotification?.title || "Announcement"}
                                </Text>
                                <TouchableOpacity 
                                    style={styles.closeButton} 
                                    onPress={handleDismissPopup}
                                >
                                    <Ionicons name="close" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {imageUrl ? (
                                    <View style={styles.imageContainer}>
                                        <Image 
                                            source={{ uri: imageUrl }} 
                                            style={[styles.notificationImage, { aspectRatio: imageAspectRatio }]} 
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : null}
                                {!!(popupNotification?.msg || popupNotification?.message || popupNotification?.content) && (
                                    <Text style={[styles.modalMessage, { color: colors.text, fontFamily: fonts?.inter?.regular || 'System', fontSize: 14, lineHeight: 22 }]}>
                                        {popupNotification?.msg || popupNotification?.message || popupNotification?.content}
                                    </Text>
                                )}
                            </ScrollView>
                            
                            {popupNotification?.button_url && popupNotification?.button_text ? (
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity 
                                        style={[styles.dismissButton, { backgroundColor: colors.primary, marginBottom: 8 }]}
                                        onPress={() => {
                                            handleDismissPopup();
                                            if (popupNotification.button_url) {
                                                Linking.openURL(popupNotification.button_url).catch(err => console.error("Could not open link", err));
                                            }
                                        }}
                                    >
                                        <Text style={[styles.dismissButtonText, { fontFamily: fonts?.inter?.bold || 'System', color: '#ffffff', fontSize: 16 }]}>
                                            {popupNotification.button_text}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.secondaryButton, { borderColor: isDark ? '#333333' : '#e0e0e0' }]}
                                        onPress={handleDismissPopup}
                                    >
                                        <Text style={[styles.secondaryButtonText, { color: colors.text, fontFamily: fonts?.inter?.bold || 'System', fontSize: 15 }]}>
                                            Close
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.dismissButton, { backgroundColor: colors.primary }]}
                                    onPress={handleDismissPopup}
                                >
                                    <Text style={[styles.dismissButtonText, { fontFamily: fonts?.inter?.bold || 'System', color: '#ffffff', fontSize: 16 }]}>
                                        Dismiss
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Modal>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fabWhatsApp: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#25D366',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 999,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 8,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        marginBottom: 20,
        maxHeight: 520,
    },
    imageContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 14,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationImage: {
        width: '100%',
    },
    buttonContainer: {
        width: '100%',
    },
    dismissButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dismissButtonText: {
        fontSize: 16,
    },
    secondaryButton: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 15,
    },
});
