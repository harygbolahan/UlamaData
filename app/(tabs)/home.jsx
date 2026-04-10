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
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeTab() {
    const { selectedDashboard, isLoading } = useDashboard();
    const { colors, isDark } = useTheme();
    const { refreshUser, getSupportData } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [openingWhatsApp, setOpeningWhatsApp] = useState(false);

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

    // Show skeleton on initial load or when refreshing
    if (isLoading || refreshing) {
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
});
