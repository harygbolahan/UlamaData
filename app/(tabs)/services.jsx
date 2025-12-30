import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServicesTab() {
    const { colors, fonts, toggleTheme, isDark } = useTheme();

    const allServices = [
        { id: '1', name: 'Data', icon: 'wifi', color: '#2196F3', category: 'Recharge', route: '/(services)/buy-data' },
        { id: '2', name: 'Airtime', icon: 'phone-portrait', color: '#4CAF50', category: 'Recharge', route: '/(services)/buy-airtime' },
        { id: '3', name: 'Data Pin', icon: 'card', color: '#009688', category: 'Recharge', route: '/(services)/buy-data-pin' },
        { id: '4', name: 'Airtime Pin', icon: 'wallet', color: '#E91E63', category: 'Recharge', route: '/(services)/buy-airtime-pin' },
        { id: '5', name: 'Cable TV', icon: 'tv', color: '#FF9800', category: 'Entertainment', route: '/(services)/cable-tv' },
        { id: '6', name: 'Electricity', icon: 'flash', color: '#F44336', category: 'Bills', route: '/(services)/electricity' },
        { id: '7', name: 'Education', icon: 'school', color: '#FF5722', category: 'Bills', route: '/(services)/education' },
        { id: '8', name: 'Bulk Order', icon: 'layers', color: '#795548', category: 'Business', route: '/(services)/bulk-order' },
        { id: '9', name: 'Bulk SMS', icon: 'chatbubbles', color: '#00BCD4', category: 'Business', route: '/(services)/bulk-sms' },
        { id: '10', name: 'Schedule', icon: 'time', color: '#9C27B0', category: 'Automation', route: '/(services)/schedule-transaction' },
        { id: '11', name: 'Airtime Swap', icon: 'swap-horizontal', color: '#3F51B5', category: 'Convert', route: '/(services)/airtime-swap' },
        { id: '12', name: 'Sales Analysis', icon: 'stats-chart', color: '#00897B', category: 'Analytics', route: '/(services)/sales-analysis' },
        { id: '13', name: 'Pricing', icon: 'pricetag', color: '#607D8B', category: 'Info', route: '/(services)/pricing' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Services
                </Text>
                <TouchableOpacity onPress={toggleTheme}>
                    <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={[styles.searchContainer, {
                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                }]}>
                    <Ionicons name="search" size={16} color={colors.icon} />
                    <TextInput
                        placeholder="Search services..."
                        placeholderTextColor={colors.icon}
                        style={[styles.searchInput, { color: colors.text, fontFamily: fonts.inter.regular }]}
                    />
                </View>


                {/* All Services Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        All Services
                    </Text>
                    <View style={styles.servicesGrid}>
                        {allServices.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.serviceCard, {
                                    backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                                }]}
                                onPress={() => service.route && router.push(service.route)}
                            >
                                <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                                    <Ionicons name={service.icon} size={22} color={service.color} />
                                </View>
                                <Text style={[styles.serviceName, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    {service.name}
                                </Text>

                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
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
        paddingTop: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
    },
    categoriesContainer: {
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    categoryText: {
        fontSize: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
    },
    serviceCard: {
        width: '30%',
        margin: '1.3%',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    serviceIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 3,
    },
    serviceCategory: {
        fontSize: 10,
        textAlign: 'center',
    },
    serviceListIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    serviceListInfo: {
        flex: 1,
    },
    serviceListName: {
        fontSize: 13,
        marginBottom: 3,
    },
    serviceListCategory: {
        fontSize: 11,
    },
});
