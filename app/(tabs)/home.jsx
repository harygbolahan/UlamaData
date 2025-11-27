import ClassicDashboard from '@/components/dashboards/ClassicDashboard';
import CompactDashboard from '@/components/dashboards/CompactDashboard';
import DefaultDashboard from '@/components/dashboards/DefaultDashboard';
import MinimalDashboard from '@/components/dashboards/MinimalDashboard';
import ModernDashboard from '@/components/dashboards/ModernDashboard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/auth-context';
import { DASHBOARD_TYPES, useDashboard } from '@/contexts/dashboard-context';
import { useTheme } from '@/contexts/theme-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function HomeTab() {
    const { selectedDashboard, isLoading } = useDashboard();
    const { colors } = useTheme();
    const { refreshUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderDashboard()}
            <LoadingOverlay visible={isLoading || refreshing} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
