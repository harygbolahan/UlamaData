import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { useApiColors } from '@/hooks/use-api-colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BannerCarousel from '../ui/BannerCarousel';

export default function ClassicDashboard() {
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
            if (saved !== null) setBalanceVisible(JSON.parse(saved));
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
        status: (tx.tStatus?.toLowerCase() === 'completed' || String(tx.status) === '0') ? 'success' :
            (tx.tStatus?.toLowerCase() === 'refund' || tx.tStatus?.toLowerCase() === 'refunded' || String(tx.status) === '3') ? 'refund' :
                (tx.tStatus?.toLowerCase() === 'pending' || tx.tStatus?.toLowerCase() === 'processing' || String(tx.status) === '1') ? 'pending' : 'failed',
        transactionRef: tx.transref || tx.transactionRef
    }));

    const services = [
        { id: '1', name: 'Data', icon: 'wifi', route: '/(services)/buy-data', color: '#667eea' },
        { id: '2', name: 'Airtime', icon: 'phone-portrait', route: '/(services)/buy-airtime', color: '#f5576c' },
        { id: '3', name: 'Data Pin', icon: 'card', color: '#009688', category: 'Recharge', route: '/(services)/buy-data-pin' },
        { id: '4', name: 'Electricity', icon: 'flash', color: '#F44336', category: 'Bills', route: '/(services)/electricity' },
        { id: '5', name: 'Education', icon: 'school', color: '#FF5722', category: 'Bills', route: '/(services)/education' },
        { id: '6', name: 'Cable TV', icon: 'tv', color: '#FF9800', category: 'Entertainment', route: '/(services)/cable-tv' },
        { id: '7', name: 'Airtime Pin', icon: 'wallet', color: '#E91E63', category: 'Recharge', route: '/(services)/buy-airtime-pin' },
        { id: '8', name: 'More', icon: 'apps', route: '/(tabs)/services', color: '#607d8b' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                backgroundColor={colors.primary}
                barStyle={isDark ? 'light-content' : 'light-content'}
                translucent={false}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Compact Header */}
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <View>
                        <Text style={[styles.greeting, { fontFamily: fonts.inter.regular, color: colors.primaryText }]}>Welcome</Text>
                        <Text style={[styles.name, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>{user?.name || 'User'}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
                            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.primaryText} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Ionicons name="notifications-outline" size={20} color={colors.primaryText} />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Compact Balance Section */}
                <View style={[styles.balanceSection, { backgroundColor: colors.primary }]}>
                    <View style={styles.balanceContent}>
                        <View style={styles.balanceInfo}>
                            <Text style={[styles.balanceLabel, { fontFamily: fonts.inter.medium, color: colors.primaryText }]}>Balance</Text>
                            <View style={styles.balanceRow}>
                                <Text style={[styles.balanceAmount, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                                    {balanceVisible ? `₦${parseFloat(user?.wallet || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦****'}
                                </Text>
                                <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.eyeButton}>
                                    <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={16} color={colors.primaryText} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.cashback, { fontFamily: fonts.inter.regular, color: colors.primaryText }]}>
                                Cashback: {balanceVisible ? `₦${parseFloat(user?.cashback || 0).toLocaleString('en-NG')}` : '₦****'}
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primaryText }]}
                            onPress={() => router.push('/fund-wallet')}
                        >
                            <Ionicons name="add-circle" size={18} color={colors.primary} />
                            <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.bold, color: colors.primary }]}>
                                Top Up
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primaryText }]}
                            onPress={() => router.push('/(services)/funds-transfer')}
                        >
                            <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                            <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.bold, color: colors.primary }]}>
                                Transfer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Services Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>Services</Text>
                    <View style={styles.servicesGrid}>
                        {services.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.serviceCard, {
                                    backgroundColor: colors.isDark ? '#1f1f1f' : '#fff',
                                    borderColor: colors.isDark ? '#2a2a2a' : '#e0e0e0'
                                }]}
                                onPress={() => service.route && router.push(service.route)}
                            >
                                <Ionicons name={service.icon} size={22} color={colors.primary} />
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

                {/* Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>Recent</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <Text style={[styles.viewAll, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : recentTransactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={32} color={colors.icon} style={{ opacity: 0.3 }} />
                            <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                No transactions yet
                            </Text>
                        </View>
                    ) : (
                        recentTransactions.map((transaction, index) => (
                            <TouchableOpacity
                                key={transaction.id}
                                style={[styles.transactionCard, {
                                    backgroundColor: colors.isDark ? '#1f1f1f' : '#fff',
                                    borderColor: colors.isDark ? '#2a2a2a' : '#e0e0e0',
                                    marginBottom: index === recentTransactions.length - 1 ? 0 : 8
                                }]}
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
                                        backgroundColor: transaction.status === 'success' ? colors.success : transaction.status === 'pending' ? '#FFA500' : transaction.status === 'refund' ? '#2196F3' : '#EF4444'
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
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

    },
    greeting: { fontSize: 12, marginBottom: 3, opacity: 0.85 },
    name: { fontSize: 18, letterSpacing: -0.3 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffffff20',
        justifyContent: 'center',
        alignItems: 'center'
    },
    notificationButton: { position: 'relative' },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6B6B',
    },

    // Compact Balance
    balanceSection: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        marginBottom: 18,
        borderBottomEndRadius: 26,
        borderBottomStartRadius: 26,
    },
    balanceContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    balanceInfo: { flex: 1 },
    balanceLabel: {
        fontSize: 11,
        opacity: 0.85,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 26,
        letterSpacing: -0.5,
    },
    eyeButton: { padding: 4 },
    cashback: {
        fontSize: 11,
        opacity: 0.85
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    actionButtonText: { fontSize: 13 },

    // Sections
    section: { marginBottom: 18 },
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
        letterSpacing: -0.3,
    },
    viewAll: { fontSize: 13 },

    // Services
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 8
    },
    serviceCard: {
        width: '22%',
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


    // Transactions
    loadingContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        opacity: 0.6,
    },
    transactionCard: {
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
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
    transactionInfo: {
        flex: 1,
        gap: 2,
    },
    transactionTitle: {
        fontSize: 14,
        letterSpacing: -0.2,
    },
    transactionSubtitle: {
        fontSize: 12,
        opacity: 0.7,
    },
    transactionRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    transactionAmount: {
        fontSize: 14,
        letterSpacing: -0.3,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
