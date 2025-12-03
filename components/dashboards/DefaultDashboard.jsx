import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { useApiColors } from '@/hooks/use-api-colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BannerCarousel from '../ui/BannerCarousel';

export default function DefaultDashboard() {
    const { fonts, toggleTheme, isDark } = useTheme();
    const colors = useApiColors();
    const { user } = useAuth();
    const { transactions, loading, fetchTransactions } = useTransactions();
    const [balanceVisible, setBalanceVisible] = useState(true);

    useEffect(() => {
        loadBalanceVisibility();
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            await fetchTransactions(1, '', '');
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const loadBalanceVisibility = async () => {
        try {
            const saved = await AsyncStorage.getItem('balanceVisible');
            if (saved !== null) {
                setBalanceVisible(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading balance visibility:', error);
        }
    };

    const toggleBalanceVisibility = async () => {
        const newValue = !balanceVisible;
        setBalanceVisible(newValue);
        try {
            await AsyncStorage.setItem('balanceVisible', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving balance visibility:', error);
        }
    };

    const services = [
        { id: '1', name: 'Data', icon: 'wifi', route: '/(services)/buy-data' },
        { id: '2', name: 'Airtime', icon: 'phone-portrait', route: '/(services)/buy-airtime' },
        { id: '3', name: 'Cable TV', icon: 'tv', route: '/(services)/cable-tv' },
        { id: '4', name: 'Electricity', icon: 'flash', route: '/(services)/electricity' },
        { id: '5', name: 'Bulk Order', icon: 'layers', route: '/(services)/bulk-order' },
        { id: '6', name: 'Bulk SMS', icon: 'chatbubbles', route: '/(services)/bulk-sms' },
        { id: '7', name: 'Schedule', icon: 'time', route: '/(services)/schedule-transaction' },
        { id: '8', name: 'More', icon: 'apps', route: '/(tabs)/services' },
    ];

    const banners = [
        { id: '1', title: 'Get 5% Cashback', subtitle: 'On all data purchases', color: '#FF6B6B' },
        { id: '2', title: 'Refer & Earn', subtitle: 'Get ₦500 per referral', color: '#4ECDC4' },
        { id: '3', title: 'Weekend Bonus', subtitle: 'Extra 10% on all bills', color: '#A8E6CF' },
    ];

    const getServiceIcon = (service) => {
        const serviceMap = {
            'data': 'wifi',
            'airtime': 'phone-portrait',
            'cable': 'tv',
            'electricity': 'flash',
            'exam': 'school',
            'sms': 'chatbubbles',
            'coupon': 'pricetag',
            'wallet': 'wallet',
            'transfer': 'swap-horizontal',
        };
        const serviceLower = service?.toLowerCase() || '';
        for (const [key, icon] of Object.entries(serviceMap)) {
            if (serviceLower.includes(key)) return icon;
        }
        return 'receipt';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const truncateText = (text, maxLength = 50) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const recentTransactions = transactions.slice(0, 5).map(tx => ({
        id: tx.tId || tx.transactionRef,
        title: tx.servicename || 'Transaction',
        subtitle: truncateText(tx.servicedesc || tx.category || 'No description'),
        amount: `-₦${parseFloat(tx.amount || 0).toLocaleString('en-NG')}`,
        date: formatDate(tx.date || tx.created_at),
        icon: getServiceIcon(tx.servicename),
        status: tx.tStatus?.toLowerCase() === 'completed' ? 'success' : tx.tStatus?.toLowerCase() === 'processing' ? 'pending' : 'failed',
        transactionRef: tx.transref || tx.transactionRef
    }));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Compact Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.greeting, { color: colors.icon, fontFamily: fonts.inter.medium }]}>Hello,</Text>
                        <Text style={[styles.name, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            {user?.name || 'User'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]} onPress={toggleTheme}>
                            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <Ionicons name="notifications-outline" size={18} color={colors.text} />
                            <View style={styles.badge} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Compact Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceMain}>
                            <Text style={[styles.balanceLabel, { fontFamily: fonts.inter.medium, color: colors.primaryText }]}>Balance</Text>
                            <View style={styles.balanceAmountRow}>
                                <Text style={[styles.balanceAmount, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                                    {balanceVisible ? `₦${parseFloat(user?.wallet || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦****'}
                                </Text>
                                <TouchableOpacity style={styles.eyeIcon} onPress={toggleBalanceVisibility}>
                                    <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={16} color={colors.primaryText} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.cashbackText, { fontFamily: fonts.inter.regular, color: colors.primaryText }]}>
                                Cashback: {balanceVisible ? `₦${parseFloat(user?.cashback || 0).toLocaleString('en-NG')}` : '₦****'}
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.topUpButton, { backgroundColor: colors.primaryText }]} onPress={() => router.push('/fund-wallet')}>
                            <Ionicons name="add" size={20} color={colors.primary} />
                            <Text style={[styles.topUpText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>Top Up</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Transfer Button */}
                    <TouchableOpacity
                        style={[styles.transferButton, { backgroundColor: colors.primaryText }]}
                        onPress={() => router.push('/(services)/funds-transfer')}
                    >
                        <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                        <Text style={[styles.transferButtonText, { fontFamily: fonts.inter.bold, color: colors.primary }]}>
                            Transfer Funds
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Compact Services Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>Services</Text>
                    <View style={styles.servicesGrid}>
                        {services.map((service) => (
                            <TouchableOpacity 
                                key={service.id} 
                                style={styles.serviceCard} 
                                onPress={() => service.route && router.push(service.route)}
                            >
                                <View style={[styles.serviceIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name={service.icon} size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.serviceName, { color: colors.text, fontFamily: fonts.inter.medium }]} numberOfLines={1}>
                                    {service.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                
                {/* Banners */}
                <View style={styles.section}>
                    <BannerCarousel />
                </View>


                {/* Compact Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>Recent</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <Text style={[styles.seeAll, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : recentTransactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={40} color={colors.icon} style={{ opacity: 0.3 }} />
                            <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>No transactions yet</Text>
                        </View>
                    ) : (
                        recentTransactions.map((transaction, index) => (
                            <TouchableOpacity 
                                key={transaction.id} 
                                style={[
                                    styles.transactionCard, 
                                    { 
                                        backgroundColor: colors.isDark ? '#1f1f1f' : '#fff',
                                        marginBottom: index === recentTransactions.length - 1 ? 0 : 8
                                    }
                                ]} 
                                onPress={() => router.push({
                                    pathname: '/transaction-details',
                                    params: { 
                                        transactionRef: transaction.transactionRef,
                                        transactionDate: transaction.date
                                    }
                                })}
                            >
                                <View style={[styles.transactionIcon, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name={transaction.icon} size={18} color={colors.primary} />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={[styles.transactionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]} numberOfLines={1}>
                                        {transaction.title}
                                    </Text>
                                    <Text style={[styles.transactionSubtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]} numberOfLines={1}>
                                        {transaction.subtitle}
                                    </Text>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={[styles.transactionAmount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        {transaction.amount}
                                    </Text>
                                    <View style={[styles.statusDot, { 
                                        backgroundColor: transaction.status === 'success' ? colors.success : transaction.status === 'pending' ? '#FFA500' : '#EF4444' 
                                    }]} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 16 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Compact Header
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingTop: 48, 
        marginBottom: 16 
    },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 13, marginBottom: 2, opacity: 0.7 },
    name: { fontSize: 22, letterSpacing: -0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconButton: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative'
    },
    badge: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        backgroundColor: '#FF6B6B' 
    },
    
    // Compact Balance Card
    balanceCard: { 
        marginHorizontal: 16, 
        padding: 16, 
        borderRadius: 16, 
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    balanceRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    balanceMain: { flex: 1 },
    balanceLabel: { 
        fontSize: 11, 
        opacity: 0.85, 
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceAmountRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 6 
    },
    balanceAmount: { 
        fontSize: 24, 
        letterSpacing: -0.5,
        marginRight: 8
    },
    eyeIcon: { 
        padding: 4,
        opacity: 0.8
    },
    cashbackText: { 
        fontSize: 11, 
        opacity: 0.85 
    },
    topUpButton: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    topUpText: { fontSize: 13 },
    transferButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    transferButtonText: { fontSize: 13 },
    
    // Sections
    section: { marginBottom: 20 },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        marginBottom: 12 
    },
    sectionTitle: { 
        fontSize: 17, 
        paddingHorizontal: 16, 
        marginBottom: 12,
        letterSpacing: -0.3
    },
    seeAll: { fontSize: 13 },
    
    // Compact Services Grid
    servicesGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        paddingHorizontal: 12,
        gap: 8
    },
    serviceCard: { 
        width: '22.5%', 
        aspectRatio: 1,
        padding: 8, 
        borderRadius: 12, 
        alignItems: 'center',
        justifyContent: 'center'
    },
    serviceIconContainer: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 6 
    },
    serviceName: { 
        fontSize: 10, 
        textAlign: 'center',
        lineHeight: 12
    },
    
    // Compact Transactions
    loadingContainer: { 
        padding: 16, 
        alignItems: 'center' 
    },
    emptyContainer: { 
        padding: 24, 
        alignItems: 'center',
        gap: 8
    },
    emptyText: { 
        fontSize: 13, 
        opacity: 0.6 
    },
    transactionCard: { 
        marginHorizontal: 16, 
        padding: 12, 
        borderRadius: 12, 
        flexDirection: 'row', 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    transactionIcon: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    transactionInfo: { flex: 1, gap: 2 },
    transactionTitle: { 
        fontSize: 14, 
        letterSpacing: -0.2 
    },
    transactionSubtitle: { 
        fontSize: 12, 
        opacity: 0.7 
    },
    transactionRight: { 
        alignItems: 'flex-end',
        gap: 6
    },
    transactionAmount: { 
        fontSize: 14, 
        letterSpacing: -0.3 
    },
    statusDot: { 
        width: 6, 
        height: 6, 
        borderRadius: 3 
    },
});
