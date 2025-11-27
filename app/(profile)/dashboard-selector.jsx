import { DASHBOARD_TYPES, useDashboard } from '@/contexts/dashboard-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardSelector() {
    const { colors, fonts } = useTheme();
    const { selectedDashboard, changeDashboard, dashboardInfo } = useDashboard();

    const handleSelectDashboard = async (dashboardType) => {
        await changeDashboard(dashboardType);
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Dashboard Style
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.description, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                    Choose your preferred dashboard layout. Your selection will be saved and applied automatically.
                </Text>

                {Object.values(DASHBOARD_TYPES).map((type) => {
                    const info = dashboardInfo[type];
                    const isSelected = selectedDashboard === type;

                    return (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.dashboardCard,
                                {
                                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5',
                                    borderColor: isSelected ? colors.primary : 'transparent',
                                    borderWidth: isSelected ? 2 : 0,
                                }
                            ]}
                            onPress={() => handleSelectDashboard(type)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name={info.icon} size={24} color={colors.primary} />
                            </View>
                            <View style={styles.dashboardInfo}>
                                <Text style={[styles.dashboardName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    {info.name}
                                </Text>
                                <Text style={[styles.dashboardDescription, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {info.description}
                                </Text>
                            </View>
                            {isSelected && (
                                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                <View style={{ height: 20 }} />
            </ScrollView>
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
    },
    description: {
        fontSize: 13,
        lineHeight: 20,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    dashboardCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dashboardInfo: {
        flex: 1,
    },
    dashboardName: {
        fontSize: 15,
        marginBottom: 3,
    },
    dashboardDescription: {
        fontSize: 12,
        lineHeight: 18,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
