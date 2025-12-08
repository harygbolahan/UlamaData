import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PricingScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { services, loading, error, refreshPricing } = useServices();
    const [selectedCategory, setSelectedCategory] = useState('data');
    const [refreshing, setRefreshing] = useState(false);

    const categories = [
        { id: 'data', name: 'Data', icon: 'wifi' },
        { id: 'airtime', name: 'Airtime', icon: 'phone-portrait' },
        { id: 'cable', name: 'Cable TV', icon: 'tv' },
        { id: 'electricity', name: 'Electricity', icon: 'flash' },
        { id: 'exam', name: 'Exam Pins', icon: 'school' },
        { id: 'datapin', name: 'Data Pins', icon: 'card' },
        { id: 'airtimepin', name: 'Airtime Pins', icon: 'receipt' },
        { id: 'bulksms', name: 'Bulk SMS', icon: 'chatbubbles' },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshPricing();
        setRefreshing(false);
    };

    // Group data plans by network and type
    const dataPricing = useMemo(() => {
        const grouped = {};
        services.dataPlans.forEach(plan => {
            if (!grouped[plan.network]) {
                grouped[plan.network] = { types: {}, all: [] };
            }
            
            const planType = plan.type.trim();
            if (!grouped[plan.network].types[planType]) {
                grouped[plan.network].types[planType] = [];
            }
            
            const planData = {
                size: plan.datasize,
                price: parseFloat(plan.smartdiscount),
                validity: `${plan.day} ${plan.day === '1' ? 'day' : 'days'}`,
                type: planType,
                provider: plan.provider,
                name: plan.name
            };
            
            grouped[plan.network].types[planType].push(planData);
            grouped[plan.network].all.push(planData);
        });
        
        return Object.keys(grouped).map(network => ({
            network,
            types: grouped[network].types,
            plans: grouped[network].all.slice(0, 15) // Show top 15 plans
        }));
    }, [services.dataPlans]);

    // Group airtime by network
    const airtimePricing = useMemo(() => {
        return services.airtimes.map(airtime => ({
            network: airtime.network,
            discount: `${airtime.smartdiscount}% discount`,
            type: airtime.type
        }));
    }, [services.airtimes]);

    // Group cable plans by provider
    const cablePricing = useMemo(() => {
        const grouped = {};
        services.cablePlans.forEach(plan => {
            if (!grouped[plan.cable]) {
                grouped[plan.cable] = [];
            }
            grouped[plan.cable].push({
                name: plan.name,
                price: parseFloat(plan.price),
                discount: parseFloat(plan.smartdiscount)
            });
        });
        
        return Object.keys(grouped).map(provider => ({
            provider,
            plans: grouped[provider].slice(0, 8)
        }));
    }, [services.cablePlans]);

    // Electricity providers
    const electricityPricing = useMemo(() => {
        return services.electricityTokens.map(token => ({
            name: token.name,
            minAmount: parseFloat(token.minAmount),
            discount: `${token.smartdiscount}% discount`
        }));
    }, [services.electricityTokens]);

    // Exam pins pricing
    const examPricing = useMemo(() => {
        return services.examPins.map(exam => ({
            name: exam.name,
            price: parseFloat(exam.price || exam.smartdiscount),
            type: exam.type
        }));
    }, [services.examPins]);

    // Data pin pricing
    const dataPinPricing = useMemo(() => {
        const grouped = {};
        const dataPins = services.dataPinPlans.length > 0 ? services.dataPinPlans : services.dataPlans;
        
        dataPins.forEach(plan => {
            if (!grouped[plan.network]) {
                grouped[plan.network] = [];
            }
            grouped[plan.network].push({
                size: plan.datasize || plan.size,
                price: parseFloat(plan.price || plan.smartdiscount),
                validity: plan.validity || `${plan.day} ${plan.day === '1' ? 'day' : 'days'}`,
                type: plan.type,
                name: plan.name
            });
        });
        
        return Object.keys(grouped).map(network => ({
            network,
            plans: grouped[network]
        }));
    }, [services.dataPinPlans, services.dataPlans]);

    // Airtime pin pricing
    const airtimePinPricing = useMemo(() => {
        return services.airtimePinPlans.map(pin => ({
            network: pin.network,
            size: pin.size || pin.pinSize,
            price: parseFloat(pin.price || pin.smartdiscount)
        }));
    }, [services.airtimePinPlans]);

    // Bulk SMS pricing
    const bulkSMSPricing = useMemo(() => {
        return {
            pricePerSMS: 2.5, // Default price per SMS
            minQuantity: 100,
            description: 'Send bulk SMS to multiple recipients at once'
        };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Pricing
                </Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {error && !loading ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                        {error}
                    </Text>
                    <TouchableOpacity 
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={refreshPricing}
                    >
                        <Text style={[styles.retryButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                >
                    {/* Category Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryChip,
                                    { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                    selectedCategory === category.id && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setSelectedCategory(category.id)}
                            >
                                <Ionicons
                                    name={category.icon}
                                    size={16}
                                    color={selectedCategory === category.id ? '#fff' : colors.icon}
                                />
                                <Text style={[
                                    styles.categoryText,
                                    { fontFamily: fonts.inter.medium },
                                    selectedCategory === category.id ? { color: '#fff' } : { color: colors.text }
                                ]}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Data Pricing */}
                    {selectedCategory === 'data' && dataPricing.map((provider) => (
                        <View key={provider.network} style={styles.providerSection}>
                            <View style={styles.networkHeader}>
                                <Text style={[styles.providerName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    {provider.network}
                                </Text>
                                <Text style={[styles.planCount, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {provider.plans.length} plans
                                </Text>
                            </View>

                            {/* Group by plan type */}
                            {Object.keys(provider.types).map((type) => (
                                <View key={type} style={styles.typeSection}>
                                    <Text style={[styles.typeLabel, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                        {type}
                                    </Text>
                                    <View style={[styles.table, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold, flex: 1.2 }]}>
                                                Plan
                                            </Text>
                                            <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                Price
                                            </Text>
                                            <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                Validity
                                            </Text>
                                        </View>
                                        {provider.types[type].slice(0, 8).map((plan, index) => (
                                            <View key={index} style={[styles.tableRow, index === provider.types[type].slice(0, 8).length - 1 && { borderBottomWidth: 0 }]}>
                                                <View style={{ flex: 1.2 }}>
                                                    <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                                        {plan.size}
                                                    </Text>
                                                    {plan.name && (
                                                        <Text style={[styles.planNote, { color: colors.icon, fontFamily: fonts.inter.regular }]} numberOfLines={1}>
                                                            {plan.name}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text style={[styles.tableCell, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                    ₦{plan.price.toLocaleString()}
                                                </Text>
                                                <Text style={[styles.tableCell, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                    {plan.validity}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    {/* Airtime Pricing */}
                    {selectedCategory === 'airtime' && (
                        <View style={styles.providerSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Airtime Discounts
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Get instant discounts on all airtime purchases
                            </Text>
                            {airtimePricing.map((airtime, index) => (
                                <View key={index} style={[styles.card, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                    <View style={styles.cardRow}>
                                        <View style={styles.networkInfo}>
                                            <Text style={[styles.cardNetwork, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {airtime.network}
                                            </Text>
                                            <Text style={[styles.cardType, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                {airtime.type}
                                            </Text>
                                        </View>
                                        <View style={[styles.discountBadge, { backgroundColor: colors.primary + '20' }]}>
                                            <Text style={[styles.cardDiscount, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                                {airtime.discount}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Cable TV Pricing */}
                    {selectedCategory === 'cable' && cablePricing.map((provider) => (
                        <View key={provider.provider} style={styles.providerSection}>
                            <Text style={[styles.providerName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {provider.provider}
                            </Text>
                            <View style={[styles.table, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold, flex: 2 }]}>
                                        Plan
                                    </Text>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Price
                                    </Text>
                                </View>
                                {provider.plans.map((plan, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.regular, flex: 2 }]} numberOfLines={2}>
                                            {plan.name}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            ₦{plan.price.toLocaleString()}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Electricity Pricing */}
                    {selectedCategory === 'electricity' && (
                        <View style={styles.providerSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Electricity Providers
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Pay your electricity bills with ease
                            </Text>
                            {electricityPricing.map((provider, index) => (
                                <View key={index} style={[styles.electricityCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                    <View style={styles.electricityHeader}>
                                        <View style={[styles.providerIcon, { backgroundColor: colors.primary + '20' }]}>
                                            <Ionicons name="flash" size={20} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.cardNetwork, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                                {provider.name}
                                            </Text>
                                            <Text style={[styles.cardType, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                Minimum: ₦{provider.minAmount.toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={[styles.discountBadge, { backgroundColor: colors.primary + '20' }]}>
                                            <Text style={[styles.cardDiscount, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                                {provider.discount}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Exam Pins Pricing */}
                    {selectedCategory === 'exam' && (
                        <View style={styles.providerSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Exam Pins
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Purchase exam pins for various examinations
                            </Text>
                            <View style={[styles.table, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold, flex: 2 }]}>
                                        Exam Type
                                    </Text>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Price
                                    </Text>
                                </View>
                                {examPricing.map((exam, index) => (
                                    <View key={index} style={[styles.tableRow, index === examPricing.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                                {exam.name}
                                            </Text>
                                            {exam.type && (
                                                <Text style={[styles.planNote, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                                    {exam.type}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={[styles.tableCell, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                            ₦{exam.price.toLocaleString()}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Data Pins Pricing */}
                    {selectedCategory === 'datapin' && dataPinPricing.map((provider) => (
                        <View key={provider.network} style={styles.providerSection}>
                            <Text style={[styles.providerName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                {provider.network} Data Pins
                            </Text>
                            <View style={[styles.table, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold, flex: 1.2 }]}>
                                        Plan
                                    </Text>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Price
                                    </Text>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Validity
                                    </Text>
                                </View>
                                {provider.plans.map((plan, index) => (
                                    <View key={index} style={[styles.tableRow, index === provider.plans.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={{ flex: 1.2 }}>
                                            <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                                {plan.size}
                                            </Text>
                                            {plan.name && (
                                                <Text style={[styles.planNote, { color: colors.icon, fontFamily: fonts.inter.regular }]} numberOfLines={1}>
                                                    {plan.name}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={[styles.tableCell, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                            ₦{plan.price.toLocaleString()}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            {plan.validity}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Airtime Pins Pricing */}
                    {selectedCategory === 'airtimepin' && (
                        <View style={styles.providerSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Airtime Pins
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Purchase airtime pins for resale
                            </Text>
                            <View style={[styles.table, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold, flex: 1.5 }]}>
                                        Network
                                    </Text>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Size
                                    </Text>
                                    <Text style={[styles.tableHeaderText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        Price
                                    </Text>
                                </View>
                                {airtimePinPricing.map((pin, index) => (
                                    <View key={index} style={[styles.tableRow, index === airtimePinPricing.length - 1 && { borderBottomWidth: 0 }]}>
                                        <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.medium, flex: 1.5 }]}>
                                            {pin.network}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                            ₦{pin.size}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                            ₦{pin.price.toLocaleString()}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Bulk SMS Pricing */}
                    {selectedCategory === 'bulksms' && (
                        <View style={styles.providerSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Bulk SMS
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {bulkSMSPricing.description}
                            </Text>
                            <View style={[styles.electricityCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                                <View style={styles.electricityHeader}>
                                    <View style={[styles.providerIcon, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.cardNetwork, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            SMS Rate
                                        </Text>
                                        <Text style={[styles.cardType, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            Minimum: {bulkSMSPricing.minQuantity} SMS
                                        </Text>
                                    </View>
                                    <View style={[styles.discountBadge, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.cardDiscount, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                            ₦{bulkSMSPricing.pricePerSMS}/SMS
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <Text style={[styles.sectionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    • Send personalized messages to multiple recipients{'\n'}
                                    • Perfect for marketing campaigns{'\n'}
                                    • Instant delivery{'\n'}
                                    • Custom sender ID available
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>
            )}

            <LoadingOverlay visible={loading && !refreshing} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, marginBottom: 20 },
    headerTitle: { fontSize: 18 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
    errorText: { fontSize: 16, textAlign: 'center' },
    retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 14 },
    categories: { paddingHorizontal: 20, marginBottom: 20 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, gap: 6 },
    categoryText: { fontSize: 13 },
    providerSection: { marginBottom: 24, paddingHorizontal: 20 },
    networkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    providerName: { fontSize: 20 },
    planCount: { fontSize: 12 },
    typeSection: { marginBottom: 16 },
    typeLabel: { fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 18, marginBottom: 8 },
    sectionSubtitle: { fontSize: 13, marginBottom: 16 },
    table: { borderRadius: 12, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    tableHeaderText: { flex: 1, fontSize: 12 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
    tableCell: { flex: 1, fontSize: 13 },
    planNote: { fontSize: 10, marginTop: 2 },
    card: { padding: 16, borderRadius: 12, marginBottom: 12 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    networkInfo: { flex: 1 },
    cardNetwork: { fontSize: 16, marginBottom: 4 },
    cardDiscount: { fontSize: 13 },
    cardType: { fontSize: 12, marginTop: 2 },
    discountBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    electricityCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
    electricityHeader: { flexDirection: 'row', alignItems: 'center' },
    providerIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
