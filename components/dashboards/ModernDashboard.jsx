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

export default function ModernDashboard() {
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
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const truncateText = (text, maxLength = 45) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const recentTransactions = transactions.slice(0, 5).map(tx => ({
        id: tx.tId || tx.transactionRef,
        title: tx.servicename || 'Transaction',
        subtitle: truncateText(tx.servicedesc || tx.category || 'No description'),
        amount: `-₦${parseFloat(tx.amount || 0).toLocaleString('en-NG')}`,
        time: formatDate(tx.date || tx.created_at),
        icon: getServiceIcon(tx.servicename),
        status: tx.tStatus?.toLowerCase() === 'completed' ? 'success' : tx.tStatus?.toLowerCase() === 'processing' ? 'pending' : 'failed',
        transactionRef: tx.transref || tx.transactionRef
    }));

    const getUserInitials = () => {
        const name = user?.name || 'U';
        const surname = user?.surname || '';
        return `${name.charAt(0)}${surname.charAt(0) || ''}`.toUpperCase();
    };

    const services = [
        { id: '1', name: 'Data', icon: 'wifi', route: '/(services)/buy-data', color: '#667eea' },
        { id: '2', name: 'Airtime', icon: 'phone-portrait', route: '/(services)/buy-airtime', color: '#f5576c' },
        { id: '3', name: 'Cable', icon: 'tv', route: '/(services)/cable-tv', color: '#00d4ff' },
        { id: '4', name: 'Power', icon: 'flash', route: '/(services)/electricity', color: '#38f9d7' },
        { id: '5', name: 'Bulk', icon: 'layers', route: '/(services)/bulk-order', color: '#ffa726' },
        { id: '6', name: 'SMS', icon: 'chatbubbles', route: '/(services)/bulk-sms', color: '#ab47bc' },
        { id: '7', name: 'Schedule', icon: 'time', route: '/(services)/schedule-transaction', color: '#9c27b0' },
        { id: '8', name: 'More', icon: 'apps', route: '/(tabs)/services', color: '#607d8b' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Robust Modern Header */}
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.avatarInitials, { 
                                backgroundColor: isDark ? '#ffffff25' : '#ffffff35',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 3,
                            }]}>
                                <Text style={[styles.initialsText, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                                    {getUserInitials()}
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.greeting, { fontFamily: fonts.inter.medium, color: colors.primaryText }]}>
                                    Hello,
                                </Text>
                                <Text style={[styles.name, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                                    {user?.name || 'User'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity 
                                style={[styles.iconButton, { 
                                    backgroundColor: '#ffffff25',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }]} 
                                onPress={toggleTheme}
                            >
                                <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.primaryText} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconButton, { 
                                backgroundColor: '#ffffff25',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }]}>
                                <Ionicons name="notifications-outline" size={18} color={colors.primaryText} />
                                <View style={styles.notificationBadge} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Robust Balance Card */}
                <View style={styles.balanceContainer}>
                    <View style={[styles.balanceCard, { 
                        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                        borderWidth: isDark ? 1 : 0,
                        borderColor: isDark ? '#2a2a2a' : 'transparent'
                    }]}>
                        <View style={styles.balanceMain}>
                            <View style={styles.balanceTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.balanceLabel, { color: colors.icon, fontFamily: fonts.inter.semiBold }]}>
                                        WALLET BALANCE
                                    </Text>
                                    <View style={styles.balanceAmountRow}>
                                        <Text style={[styles.balanceAmount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {balanceVisible ? `₦${parseFloat(user?.wallet || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦****'}
                                        </Text>
                                        <TouchableOpacity 
                                            onPress={toggleBalanceVisibility}
                                            style={[styles.eyeIcon, { 
                                                backgroundColor: isDark ? '#ffffff10' : '#00000005',
                                                borderRadius: 8,
                                            }]}
                                        >
                                            <Ionicons 
                                                name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} 
                                                size={16} 
                                                color={colors.icon} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.addButton, { 
                                        backgroundColor: colors.button,
                                        shadowColor: colors.button,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 5,
                                    }]} 
                                    onPress={() => router.push('/fund-wallet')}
                                >
                                    <Ionicons name="add" size={22} color={colors.primaryText} />
                                </TouchableOpacity>
                            </View>

                            {/* Enhanced Stats */}
                            <View style={[styles.inlineStats, { 
                                backgroundColor: isDark ? '#0f0f0f' : '#f8f9fa',
                                borderRadius: 12,
                                padding: 12,
                            }]}>
                                <View style={styles.statItem}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#4ade8015' }]}>
                                        <Ionicons name="trending-up" size={16} color="#4ade80" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.statText, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {balanceVisible ? `₦${parseFloat(user?.cashback || 0).toLocaleString('en-NG')}` : '₦****'}
                                        </Text>
                                        <Text style={[styles.statLabelSmall, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                            Cashback
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.icon + '15' }]} />
                                <View style={styles.statItem}>
                                    <View style={[styles.statIconBg, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.statText, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {user?.totalTransactions || '0'}
                                        </Text>
                                        <Text style={[styles.statLabelSmall, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                            Transactions
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                    
                    {/* Transfer Button */}
                    <TouchableOpacity
                        style={[styles.transferButton, { backgroundColor: colors.button }]}
                        onPress={() => router.push('/(services)/funds-transfer')}
                    >
                        <Ionicons name="swap-horizontal" size={18} color={colors.primaryText} />
                        <Text style={[styles.transferButtonText, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                            Transfer Funds
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>


                {/* Enhanced Services Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Quick Services
                    </Text>
                    <View style={styles.servicesGrid}>
                        {services.map((service) => (
                            <TouchableOpacity 
                                key={service.id} 
                                style={[styles.serviceCard, {
                                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                    borderWidth: isDark ? 1 : 0,
                                    borderColor: isDark ? '#2a2a2a' : 'transparent',
                                    shadowColor: service.color,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }]} 
                                onPress={() => service.route && router.push(service.route)}
                            >
                                <View style={[styles.serviceIconWrapper, { 
                                    backgroundColor: service.color + '15',
                                    shadowColor: service.color,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }]}>
                                    <Ionicons name={service.icon} size={22} color={service.color} />
                                </View>
                                <Text style={[styles.serviceName, { color: colors.text, fontFamily: fonts.inter.bold }]} numberOfLines={1}>
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

                {/* Enhanced Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Recent Activity
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <View style={styles.viewAllButton}>
                                <Text style={[styles.seeAll, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                    View All
                                </Text>
                                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : recentTransactions.length === 0 ? (
                        <View style={[styles.emptyContainer, {
                            backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
                            borderRadius: 16,
                            marginHorizontal: 16,
                        }]}>
                            <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="receipt-outline" size={32} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                No transactions yet
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Your transactions will appear here
                            </Text>
                        </View>
                    ) : (
                        recentTransactions.map((transaction, index) => (
                            <TouchableOpacity 
                                key={transaction.id} 
                                style={[
                                    styles.transactionCard, 
                                    { 
                                        backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                        borderWidth: isDark ? 1 : 0,
                                        borderColor: isDark ? '#2a2a2a' : 'transparent',
                                        marginBottom: index === recentTransactions.length - 1 ? 0 : 10
                                    }
                                ]} 
                                onPress={() => router.push({
                                    pathname: '/transaction-details',
                                    params: { 
                                        transactionRef: transaction.transactionRef,
                                        transactionDate: transaction.time
                                    }
                                })}
                            >
                                <View style={[styles.transactionIconBox, { 
                                    backgroundColor: colors.primary + '15',
                                    
                                }]}>
                                    <Ionicons name={transaction.icon} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.transactionDetails}>
                                    <Text style={[styles.transactionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]} numberOfLines={1}>
                                        {transaction.title}
                                    </Text>
                                    <Text style={[styles.transactionSubtitle, { color: colors.icon, fontFamily: fonts.inter.medium }]} numberOfLines={1}>
                                        {transaction.subtitle}
                                    </Text>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={[styles.transactionAmount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                        {transaction.amount}
                                    </Text>
                                    <View style={[styles.statusIndicator, { 
                                        backgroundColor: transaction.status === 'success' ? '#4ade8015' : transaction.status === 'pending' ? '#FFA50015' : '#EF444415' 
                                    }]}>
                                        <View style={[styles.statusDot, { 
                                            backgroundColor: transaction.status === 'success' ? '#4ade80' : transaction.status === 'pending' ? '#FFA500' : '#EF4444' 
                                        }]} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 16 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    
    // Robust Header
    header: { 
        paddingTop: 48,
        paddingBottom: 18,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 14,
        flex: 1
    },
    avatarInitials: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontSize: 17,
        letterSpacing: 0.5,
    },
    greeting: { 
        fontSize: 13, 
        marginBottom: 3,
        opacity: 0.85,
        letterSpacing: 0.2,
    },
    name: { 
        fontSize: 19,
        letterSpacing: -0.4,
    },
    headerRight: { 
        flexDirection: 'row', 
        gap: 10 
    },
    iconButton: { 
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    notificationBadge: { 
        position: 'absolute', 
        top: 9, 
        right: 9, 
        width: 7, 
        height: 7, 
        borderRadius: 3.5, 
        backgroundColor: '#ff4757',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    
    // Robust Balance Card
    balanceContainer: {
        paddingHorizontal: 16,
        marginTop: -10,
        marginBottom: 22,
    },
    balanceCard: { 
        padding: 18, 
        borderRadius: 18, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        elevation: 4,
    },
    balanceMain: { gap: 14 },
    balanceTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    balanceLabel: { 
        fontSize: 10,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    balanceAmount: { 
        fontSize: 28,
        letterSpacing: -0.8,
    },
    eyeIcon: {
        padding: 6,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statText: {
        fontSize: 14,
    },
    statLabelSmall: {
        fontSize: 10,
        opacity: 0.7,
        marginTop: 1,
    },
    statDivider: {
        width: 1.5,
        height: 32,
    },
    transferButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
        marginTop: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    transferButtonText: { fontSize: 13 },
    
    // Sections
    section: { marginBottom: 22 },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        marginBottom: 14 
    },
    sectionTitle: { 
        fontSize: 18,
        paddingHorizontal: 16,
        marginBottom: 14,
        letterSpacing: -0.4,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAll: { 
        fontSize: 13,
    },
    
    // Enhanced Services Grid
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 10,
    },
    serviceCard: { 
        width: '23%',
        aspectRatio: 1,
        padding: 10,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceIconWrapper: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 8,
    },
    serviceName: { 
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 13,
    },
    
    // Enhanced Transactions
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
        gap: 10,
    },
    emptyIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
    },
    emptySubtext: {
        fontSize: 13,
        opacity: 0.6,
    },
    transactionCard: { 
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionIconBox: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 14,
    },
    transactionDetails: { 
        flex: 1,
        gap: 4,
    },
    transactionTitle: { 
        fontSize: 14,
        letterSpacing: -0.3,
    },
    transactionSubtitle: { 
        fontSize: 12,
        opacity: 0.7,
    },
    transactionRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    transactionAmount: { 
        fontSize: 15,
        letterSpacing: -0.4,
    },
    statusIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
