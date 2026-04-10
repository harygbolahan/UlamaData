import { useAuth } from '@/contexts/auth-context';
import { usePayment } from '@/contexts/payment-context';
import { useToast } from '@/contexts/toast-context';
import { useTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { useApiColors } from '@/hooks/use-api-colors';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, PixelRatio, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import BannerCarousel from '../ui/BannerCarousel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef } from 'react';

export default function ModernDashboard() {
    const { fonts, toggleTheme, isDark } = useTheme();
    const colors = useApiColors();
    const { user } = useAuth();
    const { accountDetails } = usePayment();
    const { showToast } = useToast();
    const { transactions, loading, fetchTransactions } = useTransactions();
    const { width, height } = useWindowDimensions();
    const [balanceVisible, setBalanceVisible] = useState(true);

    // Responsive scaling helpers
    const isSmallScreen = width < 375;
    const fontScale = width / 375;
    const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * fontScale));
    
    // Dynamic styles based on screen size
    const dynamicStyles = {
        balanceAmount: {
            fontSize: normalize(width < 340 ? 24 : 32),
            marginTop: 2,
        },
        headerPadding: {
            paddingHorizontal: width < 350 ? 15 : 20,
            paddingTop: width < 350 ? 10 : 15,
            paddingBottom: width < 350 ? 30 : 40,
        },
        gridItemWidth: width < 330 ? '31%' : '31%', // Two columns on tiny screens, three otherwise
        iconCircleSize: normalize(width < 350 ? 40 : 50),
        transactionPadding: width < 350 ? 12 : 20,
    };

    // Marquee continuous animation
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startMarquee = () => {
            scrollX.setValue(400); // Start off-screen right
            Animated.loop(
                Animated.timing(scrollX, {
                    toValue: -800, // Scroll to far left
                    duration: 10000, // Control speed here
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };
        startMarquee();
    }, []);

    const virtualAccounts = accountDetails?.virtual_accounts || {};
    const availableAccounts = Object.entries(virtualAccounts).filter(
        ([_, account]) => account.status === 'On'
    );
    let displayAccount = availableAccounts.find(([_, account]) => account.name?.toLowerCase().includes('palm'));
    if (!displayAccount && availableAccounts.length > 0) {
        displayAccount = availableAccounts[0];
    }

    const handleCopy = async (text) => {
        await Clipboard.setStringAsync(text);
        showToast('success', 'Account number copied');
    };

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
            'data': 'cellular',
            'airtime': 'call',
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
        status: (tx.tStatus?.toLowerCase() === 'completed' || String(tx.status) === '0') ? 'success' :
            (tx.tStatus?.toLowerCase() === 'refund' || tx.tStatus?.toLowerCase() === 'refunded' || String(tx.status) === '3') ? 'refund' :
                (tx.tStatus?.toLowerCase() === 'pending' || tx.tStatus?.toLowerCase() === 'processing' || String(tx.status) === '1') ? 'pending' : 'failed',
        transactionRef: tx.transref || tx.transactionRef
    }));

    const services = [
        { id: '1', name: 'Airtime', icon: 'call', route: '/(services)/buy-airtime', color: '#e91e63', bgColor: '#fce4ec' },
        { id: '2', name: 'Data', icon: 'cellular', route: '/(services)/buy-data', color: '#00bcd4', bgColor: '#e0f7fa' },
        { id: '3', name: 'Electricity', icon: 'flash', route: '/(services)/electricity', color: '#8bc34a', bgColor: '#f1f8e9' },
        { id: '4', name: 'Data Pin', icon: 'print', route: '/(services)/buy-data-pin', color: '#f44336', bgColor: '#ffebee' },
        { id: '5', name: 'Exam Pin', icon: 'school', route: '/(services)/education', color: '#ff9800', bgColor: '#fff3e0' },
        { id: '6', name: 'Cable', icon: 'tv', route: '/(services)/cable-tv', color: '#03a9f4', bgColor: '#e1f5fe' },
        { id: '7', name: 'Airtime Pin', icon: 'print', route: '/(services)/buy-airtime-pin', color: '#26a69a', bgColor: '#e0f2f1' },
        { id: '8', name: 'Airtime2Cash', icon: 'cash', route: '/(services)/airtime-to-cash', color: '#ff5722', bgColor: '#fbe9e7' },
        { id: '9', name: 'More', icon: 'ellipsis-horizontal', route: '/(tabs)/services', color: '#ab47bc', bgColor: '#f3e5f5' },
    ];


    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
            <StatusBar backgroundColor="#000066" barStyle="light-content" translucent={false} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, backgroundColor: isDark ? '#121212' : '#f5f5f5' }}>
                {/* Header Background */}
                <View style={[styles.headerBg, { backgroundColor: '#000066' }, dynamicStyles.headerPadding]}>
                    {/* Top Row: Welcome & Profile */}
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={[styles.welcomeText, { fontFamily: fonts?.inter?.semiBold || 'System', fontSize: normalize(14) }]}>Welcome back</Text>
                            <Text style={[styles.nameText, { fontFamily: fonts?.inter?.bold || 'System', fontSize: normalize(16) }]}>{user?.name || 'Mubarak'}</Text>
                        </View>
                        <TouchableOpacity style={styles.profileIconContainer} onPress={() => router.push('/(tabs)/profile')}>
                            <Ionicons name="person-circle" size={normalize(42)} color="#fff" />
                            <View style={styles.redDot} />
                        </TouchableOpacity>
                    </View>

                    {/* Balance Row */}
                    <View style={styles.balanceRow}>
                        <View>
                            <Text style={[styles.balanceLabel, { fontFamily: fonts?.inter?.medium || 'System', fontSize: normalize(18) }]}>Wallet Balance</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.balanceAmount, { fontFamily: fonts?.inter?.bold || 'System' }, dynamicStyles.balanceAmount]}>
                                    {balanceVisible ? `₦${parseFloat(user?.wallet || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦****'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.eyeBtn} onPress={toggleBalanceVisibility}>
                            <Ionicons name={balanceVisible ? "eye" : "eye-off"} size={normalize(26)} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Bonus & Withdraw Row */}
                    <View style={[styles.bonusRow, { backgroundColor: '#ffffff1a', alignSelf: 'flex-start', paddingVertical: normalize(6), paddingHorizontal: normalize(12), borderRadius: 20 }]}>
                        <Text style={[styles.bonusText, { fontFamily: fonts?.inter?.medium || 'System', marginRight: 8, fontSize: normalize(13) }]}>
                            Bonus: {balanceVisible ? `₦${parseFloat(user?.cashback || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦****'}
                        </Text>
                        <TouchableOpacity 
                            style={[styles.withdrawBtn, { borderColor: '#fff', borderWidth: 1, borderRadius: 12, paddingHorizontal: normalize(10), paddingVertical: normalize(4) }]} 
                            onPress={() => router.push('/(tabs)/earn')}
                        >
                            <Text style={[styles.withdrawBtnText, { fontFamily: fonts?.inter?.bold || 'System', fontSize: normalize(11) }]}>Withdraw</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Palmpay Row */}
                    <View style={styles.palmpayRow}>
                        {displayAccount ? (
                            <>
                                <Text style={[styles.palmpayText, { fontFamily: fonts?.inter?.bold || 'System', fontSize: normalize(14) }]}>{displayAccount[1].name}</Text>
                                <TouchableOpacity onPress={() => handleCopy(displayAccount[1].number)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.loadingText, { fontFamily: fonts?.inter?.bold || 'System', fontSize: normalize(14) }]}>{displayAccount[1].number}</Text>
                                        <Ionicons name="copy-outline" size={14} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text style={[styles.palmpayText, { fontFamily: fonts?.inter?.bold || 'System', opacity: 0.7 }]}>No Virtual Account setup</Text>
                        )}
                    </View>
                </View>

                {/* White Overlapping Card */}
                <View style={[styles.whiteCard, { 
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    paddingHorizontal: dynamicStyles.headerPadding.paddingHorizontal 
                }]}>
                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={[styles.actionBox, { backgroundColor: colors.button || colors.primary, paddingVertical: normalize(14) }]}
                            onPress={() => router.push('/fund-wallet')}
                        >
                            <Ionicons name="add" size={normalize(18)} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={[styles.actionBoxText, { fontFamily: fonts?.inter?.medium || 'System', fontSize: normalize(14) }]}>Fund Wallet</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Animated Marquee */}
                    <View style={styles.marqueeContainer}>
                        <Animated.View style={{ transform: [{ translateX: scrollX }] }}>
                            <Text style={[styles.marqueeText, { fontFamily: fonts?.inter?.bold || 'System', fontSize: normalize(13) }]} numberOfLines={1}>
                                (DATA PIN) ........................... (EXAM PIN) ........................... (AIRTIME2CASH) ........................... (ELECTRICITY) ........................... (CABLE HUB) ........................... (ULAMADATA 08027080407)  
                            </Text>
                        </Animated.View>
                    </View>

                    {/* 3x3 Grid Services */}
                    <View style={styles.gridContainer}>
                        {services.map((svc) => (
                            <TouchableOpacity 
                                key={svc.id} 
                                style={[styles.gridItem, { 
                                    backgroundColor: isDark ? '#2a2a2a' : svc.bgColor,
                                    width: dynamicStyles.gridItemWidth 
                                }]}
                                onPress={() => svc.route && svc.route !== '#' && router.push(svc.route)}
                            >
                                <View style={[styles.iconCircle, { 
                                    backgroundColor: svc.color,
                                    width: dynamicStyles.iconCircleSize,
                                    height: dynamicStyles.iconCircleSize,
                                    borderRadius: dynamicStyles.iconCircleSize / 2
                                }]}>
                                    <Ionicons name={svc.icon} size={normalize(22)} color="#fff" />
                                </View>
                                <Text style={[styles.gridItemText, { 
                                    color: isDark ? '#fff' : '#333', 
                                    fontFamily: fonts?.inter?.medium || 'System',
                                    fontSize: normalize(12) 
                                }]}>
                                    {svc.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Banner */}
                <BannerCarousel />

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { paddingHorizontal: dynamicStyles.headerPadding.paddingHorizontal }]}>
                        <Text style={[styles.sectionTitle, { 
                            color: isDark ? '#fff' : '#333', 
                            fontFamily: fonts?.inter?.bold || 'System',
                            fontSize: normalize(18)
                        }]}>
                            Recent Activity
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                            <View style={styles.viewAllButton}>
                                <Text style={[styles.seeAll, { 
                                    color: colors.primary, 
                                    fontFamily: fonts?.inter?.bold || 'System',
                                    fontSize: normalize(13)
                                }]}>
                                    View All
                                </Text>
                                <Ionicons name="arrow-forward" size={normalize(14)} color={colors.primary} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : recentTransactions.length === 0 ? (
                        <View style={[styles.emptyContainer, {
                            backgroundColor: isDark ? '#1a1a1a' : '#fff',
                            borderRadius: 16,
                            marginHorizontal: 16,
                        }]}>
                            <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="receipt-outline" size={32} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#333', fontFamily: fonts?.inter?.semiBold || 'System' }]}>
                                No transactions yet
                            </Text>
                            <Text style={[styles.emptySubtext, { color: isDark ? '#aaa' : '#666', fontFamily: fonts?.inter?.regular || 'System' }]}>
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
                                        marginBottom: index === recentTransactions.length - 1 ? 0 : 10,
                                        marginHorizontal: dynamicStyles.headerPadding.paddingHorizontal,
                                        padding: normalize(14)
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
                                    width: normalize(40),
                                    height: normalize(40),
                                    borderRadius: normalize(20),
                                }]}>
                                    <Ionicons name={transaction.icon} size={normalize(20)} color={colors.primary} />
                                </View>
                                <View style={styles.transactionDetails}>
                                    <Text style={[styles.transactionTitle, { 
                                        color: isDark ? '#fff' : '#333', 
                                        fontFamily: fonts?.inter?.bold || 'System',
                                        fontSize: normalize(14)
                                    }]} numberOfLines={1}>
                                        {transaction.title}
                                    </Text>
                                    <Text style={[styles.transactionSubtitle, { 
                                        color: isDark ? '#aaa' : '#666', 
                                        fontFamily: fonts?.inter?.medium || 'System',
                                        fontSize: normalize(12)
                                    }]} numberOfLines={1}>
                                        {transaction.subtitle}
                                    </Text>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={[styles.transactionAmount, { 
                                        color: isDark ? '#fff' : '#333', 
                                        fontFamily: fonts?.inter?.bold || 'System',
                                        fontSize: normalize(15)
                                    }]}>
                                        {transaction.amount}
                                    </Text>
                                    <View style={[styles.statusIndicator, {
                                        backgroundColor: transaction.status === 'success' ? '#4ade8015' : transaction.status === 'pending' ? '#FFA50015' : transaction.status === 'refund' ? '#2196F315' : '#EF444415'
                                    }]}>
                                        <View style={[styles.statusDot, {
                                            backgroundColor: transaction.status === 'success' ? '#4ade80' : transaction.status === 'pending' ? '#FFA500' : transaction.status === 'refund' ? '#2196F3' : '#EF4444'
                                        }]} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBg: {
        paddingTop: 15,
        paddingHorizontal: 20,
        paddingBottom: 40, 
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9,
    },
    nameText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 2,
    },
    profileIconContainer: {
        position: 'relative',
    },
    redDot: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ff3b3b',
        borderWidth: 2,
        borderColor: '#000066',
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    balanceLabel: {
        color: '#fff',
        fontSize: 18,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 32,
        marginTop: 2,
    },
    eyeBtn: {
        padding: 5,
    },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    bonusText: {
        color: '#fff',
        fontSize: 16,
        marginRight: 10,
    },
    withdrawBtn: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    withdrawBtnText: {
        color: '#fff',
        fontSize: 12,
    },
    palmpayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    palmpayText: {
        color: '#fff',
        fontSize: 16,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
    },
    whiteCard: {
        marginTop: -20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    actionBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 25,
    },
    actionBoxText: {
        color: '#fff',
        fontSize: 14,
    },
    marqueeContainer: {
        marginBottom: 20,
        overflow: 'hidden',
        height: 25,
        justifyContent: 'center',
    },
    marqueeText: {
        color: '#ff3b3b',
        fontSize: 14,
        letterSpacing: 1.5,
        width: 1500, // Very long width for the animation
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    gridItem: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    gridItemText: {
        fontSize: 12,
        textAlign: 'center',
    },
    
    // Sections lower down
    // section: { marginBottom: 22, marginTop: 10 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14
    },
    sectionTitle: {
        fontSize: 18,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAll: {
        fontSize: 13,
    },
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
        marginHorizontal: 20,
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

