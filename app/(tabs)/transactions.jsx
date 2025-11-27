import { useTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TransactionsTab() {
    const { colors, fonts, toggleTheme, isDark } = useTheme();
    const { transactions: apiTransactions, loading, error, pagination, fetchTransactions, loadCachedTransactions } = useTransactions();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const searchTimeout = useRef(null);

    const filters = ['All', 'Completed', 'Processing', 'Failed'];
    
    // Generate date filters dynamically
    const generateDateFilters = () => {
        const today = new Date();
        const filters = ['All Time'];
        
        // Add last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            filters.push(label);
        }
        
        return filters;
    };

    const dateFilters = generateDateFilters();

    // Helper function to get date for filter
    const getDateForFilter = (filter) => {
        if (filter === 'All Time') return '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight
        
        if (filter === 'Today') {
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        if (filter === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
        }
        
        // For other dates (e.g., "Nov 25"), find the matching date from the last 7 days
        for (let i = 2; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (label === filter) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }
        
        return '';
    };

    // Map API transaction to UI format
    const mapTransaction = (transaction) => {
        const serviceName = transaction.servicename || 'Unknown';
        const provider = transaction.provider || 'Unknown';
        const amount = `₦${parseFloat(transaction.amount || 0).toLocaleString()}`;
        const date = new Date(transaction.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        // Extract phone number from servicedesc
        const phoneMatch = transaction.servicedesc?.match(/\d{11}/);
        const phone = phoneMatch ? phoneMatch[0] : 'N/A';

        // Map status
        let status = 'Processing';
        if (transaction.tStatus === 'Completed' || transaction.status === '0') {
            status = 'Completed';
        } else if (transaction.tStatus === 'Failed' || transaction.status === '2') {
            status = 'Failed';
        }

        // Map service to icon and color
        let icon = 'cube';
        let color = '#2196F3';
        
        if (serviceName.toLowerCase().includes('data')) {
            icon = 'wifi';
            color = '#2196F3';
        } else if (serviceName.toLowerCase().includes('airtime')) {
            icon = 'phone-portrait';
            color = '#4CAF50';
        } else if (serviceName.toLowerCase().includes('cable') || serviceName.toLowerCase().includes('tv')) {
            icon = 'tv';
            color = '#FF9800';
        } else if (serviceName.toLowerCase().includes('electric')) {
            icon = 'flash';
            color = '#F44336';
        } else if (serviceName.toLowerCase().includes('education') || serviceName.toLowerCase().includes('exam')) {
            icon = 'school';
            color = '#9C27B0';
        } else if (serviceName.toLowerCase().includes('pin')) {
            icon = 'card';
            color = '#00BCD4';
        }

        return {
            id: transaction.tId,
            type: serviceName,
            provider: provider,
            amount: amount,
            status: status,
            date: date,
            ref: transaction.transref,
            phone: phone,
            icon: icon,
            color: color,
            description: transaction.servicedesc || 'N/A',
            rawData: transaction
        };
    };

    const transactions = apiTransactions.map(mapTransaction);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Load cached data first, then fetch fresh data
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                const hasCached = await loadCachedTransactions();
                if (!hasCached) {
                    fetchTransactions(1);
                } else {
                    // Fetch fresh data in background
                    fetchTransactions(1);
                }
            };
            loadData();
        }, [])
    );

    // Handle search and date filter with debounce
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            const dateParam = getDateForFilter(selectedDateFilter);
            fetchTransactions(1, searchQuery.trim(), dateParam);
        }, 500);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, selectedDateFilter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const dateParam = getDateForFilter(selectedDateFilter);
            await fetchTransactions(1, searchQuery, dateParam);
        } finally {
            setRefreshing(false);
        }
    };

    const loadMoreTransactions = () => {
        if (!loading && pagination.currentPage < pagination.lastPage) {
            const dateParam = getDateForFilter(selectedDateFilter);
            fetchTransactions(pagination.currentPage + 1, searchQuery, dateParam);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesStatus = selectedFilter === 'All' || t.status === selectedFilter;
        return matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return colors.success;
            case 'Processing': return colors.warning;
            case 'Failed': return colors.error;
            default: return colors.icon;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Minimal Header */}
            <Animated.View style={[
                styles.headerContainer,
                { backgroundColor: colors.background, opacity: fadeAnim }
            ]}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Transactions
                    </Text>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={toggleTheme}
                    >
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
                    if (isCloseToBottom) {
                        loadMoreTransactions();
                    }
                }}
                scrollEventThrottle={400}
            >
                {/* Search Bar */}
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={[styles.searchContainer, {
                        backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                    }]}>
                        <Ionicons name="search-outline" size={20} color={colors.icon} />
                        <TextInput
                            placeholder="Search transactions..."
                            placeholderTextColor={colors.icon}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={[styles.searchInput, { color: colors.text, fontFamily: fonts.inter.regular }]}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* Status Filter Chips */}
                <Animated.View style={[{ opacity: fadeAnim }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersContainer}
                    >
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedFilter === filter 
                                            ? colors.primary 
                                            : isDark ? '#1a1a1a' : '#f5f5f5',
                                    }
                                ]}
                                onPress={() => setSelectedFilter(filter)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { 
                                        fontFamily: fonts.inter.medium,
                                        color: selectedFilter === filter ? '#fff' : colors.text 
                                    }
                                ]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Date Filter Chips */}
                {/* <Animated.View style={[{ opacity: fadeAnim }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateFiltersContainer}
                    >
                        {dateFilters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.dateFilterChip,
                                    {
                                        backgroundColor: selectedDateFilter === filter 
                                            ? colors.primary + '15'
                                            : isDark ? '#1a1a1a' : '#f5f5f5',
                                    }
                                ]}
                                onPress={() => setSelectedDateFilter(filter)}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name="calendar-outline" 
                                    size={14} 
                                    color={selectedDateFilter === filter ? colors.primary : colors.icon} 
                                />
                                <Text style={[
                                    styles.dateFilterText,
                                    { 
                                        fontFamily: fonts.inter.medium,
                                        color: selectedDateFilter === filter ? colors.primary : colors.text 
                                    }
                                ]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View> */}

                {/* Transactions List */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>

                    {loading && transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular, marginTop: 16 }]}>
                                Loading transactions...
                            </Text>
                        </View>
                    ) : error && transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: colors.error + '10' }]}>
                                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Failed to load transactions
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                onPress={() => fetchTransactions(1)}
                            >
                                <Text style={[styles.retryButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    Retry
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: colors.icon + '10' }]}>
                                <Ionicons name="receipt-outline" size={48} color={colors.icon} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                No transactions found
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {searchQuery ? 'Try adjusting your search' : 'Your transactions will appear here'}
                            </Text>
                        </View>
                    ) : (
                        filteredTransactions.map((transaction, index) => (
                            <TouchableOpacity
                                key={transaction.id}
                                style={[styles.transactionCard, {
                                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                }]}
                                onPress={() => router.push({
                                    pathname: '/transaction-details',
                                    params: { 
                                        transactionRef: transaction.ref,
                                        transactionDate: transaction.rawData.date
                                    }
                                })}
                                activeOpacity={0.6}
                            >
                                <View style={styles.transactionLeft}>
                                    <View style={[styles.transactionIcon, { backgroundColor: transaction.color + '15' }]}>
                                        <Ionicons name={transaction.icon} size={20} color={transaction.color} />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={[styles.transactionType, { color: colors.text, fontFamily: fonts.inter.semiBold }]} numberOfLines={1}>
                                            {transaction.type}
                                        </Text>
                                        <Text style={[styles.transactionDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]} numberOfLines={1}>
                                            {transaction.description}
                                        </Text>
                                        <Text style={[styles.transactionDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            {transaction.date}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={[styles.transactionAmount, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                        {transaction.amount}
                                    </Text>
                                    <View style={[styles.statusBadge, { 
                                        backgroundColor: getStatusColor(transaction.status) + '15',
                                    }]}>
                                        <Text style={[styles.statusText, { 
                                            color: getStatusColor(transaction.status), 
                                            fontFamily: fonts.inter.medium 
                                        }]}>
                                            {transaction.status}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}

                    {loading && transactions.length > 0 && (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.loadingMoreText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Loading more...
                            </Text>
                        </View>
                    )}

                    {!loading && pagination.currentPage >= pagination.lastPage && transactions.length > 0 && (
                        <View style={styles.endMessage}>
                            <Text style={[styles.endMessageText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                You've reached the end
                            </Text>
                        </View>
                    )}
                </Animated.View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        letterSpacing: -0.5,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    filtersContainer: {
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 24,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 14,
    },
    dateFiltersContainer: {
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 20,
    },
    dateFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    dateFilterText: {
        fontSize: 13,
    },
    section: {
        paddingBottom: 24,
    },
    transactionCard: {
        marginHorizontal: 20,
        padding: 6,
        borderRadius: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 15,
        marginBottom: 3,
    },
    transactionDesc: {
        fontSize: 12,
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 11,
    },
    transactionRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    transactionAmount: {
        fontSize: 16,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    loadingMore: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    loadingMoreText: {
        fontSize: 14,
    },
    endMessage: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    endMessageText: {
        fontSize: 13,
    },
});
