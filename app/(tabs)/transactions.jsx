import DatePicker from '@/components/ui/DatePicker';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TransactionsTab() {
    const { colors, fonts, toggleTheme, isDark } = useTheme();
    const { transactions: apiTransactions, loading, error, pagination, fetchTransactions, loadCachedTransactions } = useTransactions();
    const { downloadTransactions } = useServices();
    const [selectedDate, setSelectedDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSearchQuery, setTempSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadFromDate, setDownloadFromDate] = useState('');
    const [downloadToDate, setDownloadToDate] = useState('');
    const [downloadSearch, setDownloadSearch] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const isLoadingMoreRef = useRef(false);

    // Build search parameter for API
    const buildSearchParam = () => {
        // Return search query directly (can include status like "completed", "pending", "failed")
        return searchQuery.trim();
    };

    // Download transactions from API and generate PDF
    const handleDownloadTransactions = async () => {
        try {
            setIsDownloading(true);
            
            // Fetch transactions from API using services context
            const downloadedTransactions = await downloadTransactions(
                downloadSearch.trim(),
                downloadFromDate,
                downloadToDate
            );

            console.log('Downloaded transactions count:', downloadedTransactions?.length);

            if (!Array.isArray(downloadedTransactions) || downloadedTransactions.length === 0) {
                Alert.alert('No Data', 'No transactions found for the selected criteria.');
                return;
            }

            // Map transactions to display format
            console.log('Mapping', downloadedTransactions.length, 'transactions for PDF');
            const mappedTransactions = downloadedTransactions.map(transaction => {
                const serviceName = transaction.servicename || 'Unknown';
                const amount = `₦${parseFloat(transaction.amount || 0).toLocaleString()}`;
                const date = new Date(transaction.date).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                let status = 'Pending';
                if (transaction.tStatus === 'Completed' || transaction.status === '0') {
                    status = 'Completed';
                } else if (transaction.tStatus === 'Failed' || transaction.status === '2') {
                    status = 'Failed';
                } else if (transaction.tStatus === 'Pending' || transaction.status === '1') {
                    status = 'Pending';
                }

                return {
                    date,
                    type: serviceName,
                    description: transaction.servicedesc || 'N/A',
                    ref: transaction.transref,
                    amount,
                    status
                };
            });

            // Generate clean, minimal PDF
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Transactions - UlamaData</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            padding: 40px;
                            color: #1a1a1a;
                            background: #fff;
                            line-height: 1.5;
                        }
                        .header {
                            margin-bottom: 32px;
                            padding-bottom: 16px;
                            border-bottom: 2px solid #2196F3;
                        }
                        .header h1 {
                            font-size: 28px;
                            font-weight: 600;
                            color: #1a1a1a;
                            margin-bottom: 4px;
                        }
                        .header .subtitle {
                            font-size: 13px;
                            color: #666;
                        }
                        .info {
                            display: flex;
                            gap: 24px;
                            margin-bottom: 24px;
                            font-size: 13px;
                            color: #666;
                        }
                        .info-item {
                            display: flex;
                            gap: 6px;
                        }
                        .info-label {
                            font-weight: 500;
                            color: #1a1a1a;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 16px;
                        }
                        thead {
                            background: #f8f9fa;
                        }
                        th {
                            padding: 12px;
                            text-align: left;
                            font-weight: 600;
                            font-size: 12px;
                            color: #666;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            border-bottom: 1px solid #e0e0e0;
                        }
                        td {
                            padding: 12px;
                            border-bottom: 1px solid #f0f0f0;
                            font-size: 13px;
                            color: #333;
                        }
                        tbody tr:last-child td {
                            border-bottom: none;
                        }
                        .status {
                            display: inline-block;
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                        }
                        .completed { 
                            background: #e8f5e9;
                            color: #2e7d32;
                        }
                        .pending { 
                            background: #fff3e0;
                            color: #e65100;
                        }
                        .failed { 
                            background: #ffebee;
                            color: #c62828;
                        }
                        .amount {
                            font-weight: 600;
                            color: #1a1a1a;
                        }
                        .footer {
                            margin-top: 40px;
                            padding-top: 16px;
                            border-top: 1px solid #e0e0e0;
                            text-align: center;
                            font-size: 12px;
                            color: #999;
                        }
                        @media print {
                            body { padding: 20px; }
                            table { page-break-inside: auto; }
                            tr { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Transaction History</h1>
                        <div class="subtitle">UlamaData • ${mappedTransactions.length} transactions</div>
                    </div>

                    <div class="info">
                        ${downloadSearch ? `<div class="info-item"><span class="info-label">Search:</span> ${downloadSearch}</div>` : ''}
                        ${downloadFromDate ? `<div class="info-item"><span class="info-label">From:</span> ${downloadFromDate}</div>` : ''}
                        ${downloadToDate ? `<div class="info-item"><span class="info-label">To:</span> ${downloadToDate}</div>` : ''}
                        <div class="info-item"><span class="info-label">Generated:</span> ${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                        })}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Reference</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mappedTransactions.map(t => `
                                <tr>
                                    <td>${t.date}</td>
                                    <td>${t.type}</td>
                                    <td>${t.description}</td>
                                    <td>${t.ref}</td>
                                    <td class="amount">${t.amount}</td>
                                    <td><span class="status ${t.status.toLowerCase()}">${t.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        UlamaData • Generated on ${new Date().toLocaleString()}
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            
            console.log('PDF generated with', mappedTransactions.length, 'transactions');
            
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share Transaction History (${mappedTransactions.length} transactions)`,
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert('Success', `PDF generated successfully with ${mappedTransactions.length} transactions!`);
            }

            // Close modal after successful download
            setShowDownloadModal(false);
            setDownloadFromDate('');
            setDownloadToDate('');
            setDownloadSearch('');

        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download transactions. Please try again.');
        } finally {
            setIsDownloading(false);
        }
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
        let status = 'Pending';
        if (transaction.tStatus === 'Completed' || transaction.status === '0') {
            status = 'Completed';
        } else if (transaction.tStatus === 'Failed' || transaction.status === '2') {
            status = 'Failed';
        } else if (transaction.tStatus === 'Pending' || transaction.status === '1') {
            status = 'Pending';
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

    // Handle date filter changes
    useEffect(() => {
        const searchParam = buildSearchParam();
        fetchTransactions(1, searchParam, selectedDate);
    }, [selectedDate]);

    const handleSearch = async () => {
        setIsSearching(true);
        setSearchQuery(tempSearchQuery);
        const searchParam = tempSearchQuery.trim();
        try {
            await fetchTransactions(1, searchParam, selectedDate);
        } finally {
            setIsSearching(false);
        }
    };

    const handleDateChange = (formattedDate) => {
        setSelectedDate(formattedDate);
    };

    const clearDateFilter = () => {
        setSelectedDate('');
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const searchParam = buildSearchParam();
            await fetchTransactions(1, searchParam, selectedDate);
        } finally {
            setRefreshing(false);
        }
    };

    const loadMoreTransactions = useCallback(async () => {
        // Prevent multiple simultaneous loads
        if (isLoadingMoreRef.current || loading || isLoadingMore) {
            return;
        }

        // Check if there are more pages to load
        if (pagination.currentPage >= pagination.lastPage) {
            return;
        }

        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        try {
            const searchParam = buildSearchParam();
            await fetchTransactions(pagination.currentPage + 1, searchParam, selectedDate);
        } finally {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
        }
    }, [loading, isLoadingMore, pagination.currentPage, pagination.lastPage, searchQuery, selectedDate]);

    const handleScroll = useCallback((event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        
        // Calculate if user is near bottom (within 500px)
        const paddingToBottom = 500;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        
        if (isCloseToBottom) {
            loadMoreTransactions();
        }
    }, [loadMoreTransactions]);

    const filteredTransactions = transactions;

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
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={() => setShowDownloadModal(true)}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="download-outline" size={22} color={colors.text} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={toggleTheme}
                        >
                            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>
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
                onScroll={handleScroll}
                scrollEventThrottle={200}
            >
                {/* Search Bar with Button */}
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.searchWrapper}>
                        <View style={[styles.searchContainer, {
                            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                        }]}>
                            <Ionicons name="search-outline" size={20} color={colors.icon} />
                            <TextInput
                                placeholder="Search by status, description, or reference...."
                                placeholderTextColor={colors.icon}
                                value={tempSearchQuery}
                                onChangeText={setTempSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                                style={[styles.searchInput, { color: colors.text, fontFamily: fonts.inter.regular }]}
                            />
                            {tempSearchQuery !== '' && (
                                <TouchableOpacity onPress={() => {
                                    setTempSearchQuery('');
                                    setSearchQuery('');
                                    const searchParam = buildSearchParam();
                                    fetchTransactions(1, searchParam, selectedDate);
                                }}>
                                    <Ionicons name="close-circle" size={20} color={colors.icon} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity 
                            style={[styles.searchButton, { backgroundColor: colors.primary }]}
                            onPress={handleSearch}
                            activeOpacity={0.7}
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="search" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Date Filter - Custom DatePicker */}
                <Animated.View style={[{ opacity: fadeAnim }, styles.dateFilterSection]}>
                    <View style={styles.dateFilterRow}>
                        <View style={{ flex: 1 }}>
                            <DatePicker
                                value={selectedDate}
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        </View>
                        
                        {selectedDate !== '' && (
                            <TouchableOpacity 
                                style={[styles.clearDateButton, {
                                    backgroundColor: colors.error + '15',
                                }]}
                                onPress={clearDateFilter}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={18} color={colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* Transactions List */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>

                    {loading && transactions.length === 0 ? (
                        <View>
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <View
                                    key={item}
                                    style={[styles.skeletonCard, {
                                        backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                    }]}
                                >
                                    <View style={styles.skeletonLeft}>
                                        <View style={[styles.skeletonIcon, {
                                            backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
                                        }]} />
                                        <View style={styles.skeletonInfo}>
                                            <View style={[styles.skeletonLine, styles.skeletonTitle, {
                                                backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
                                            }]} />
                                            <View style={[styles.skeletonLine, styles.skeletonDesc, {
                                                backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
                                            }]} />
                                            <View style={[styles.skeletonLine, styles.skeletonDate, {
                                                backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
                                            }]} />
                                        </View>
                                    </View>
                                    <View style={styles.skeletonRight}>
                                        <View style={[styles.skeletonLine, styles.skeletonAmount, {
                                            backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
                                        }]} />
                                        <View style={[styles.skeletonBadge, {
                                            backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
                                        }]} />
                                    </View>
                                </View>
                            ))}
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

                    {(loading || isLoadingMore) && transactions.length > 0 && (
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

            {/* Download Modal */}
            <Modal
                visible={showDownloadModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDownloadModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Download Transactions
                            </Text>
                            <TouchableOpacity onPress={() => setShowDownloadModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Search Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    Search (Optional)
                                </Text>
                                <View style={[styles.inputContainer, { 
                                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                    borderColor: isDark ? '#2a2a2a' : '#e0e0e0'
                                }]}>
                                    <Ionicons name="search-outline" size={20} color={colors.icon} />
                                    <TextInput
                                        placeholder="Search by status, description..."
                                        placeholderTextColor={colors.icon}
                                        value={downloadSearch}
                                        onChangeText={setDownloadSearch}
                                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                                    />
                                </View>
                            </View>

                            {/* From Date */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    From Date (Optional)
                                </Text>
                                <DatePicker
                                    value={downloadFromDate}
                                    onChange={setDownloadFromDate}
                                    maximumDate={new Date()}
                                />
                            </View>

                            {/* To Date */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    To Date (Optional)
                                </Text>
                                <DatePicker
                                    value={downloadToDate}
                                    onChange={setDownloadToDate}
                                    maximumDate={new Date()}
                                    minimumDate={downloadFromDate ? new Date(downloadFromDate) : undefined}
                                />
                            </View>

                            {/* Download Button */}
                            <TouchableOpacity
                                style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                                onPress={handleDownloadTransactions}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="download" size={20} color="#fff" />
                                        <Text style={[styles.downloadButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                            Download PDF
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    searchButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateFilterSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    dateFilterRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    clearDateButton: {
        width: 48,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        paddingBottom: 24,
    },
    skeletonCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    skeletonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    skeletonIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    skeletonInfo: {
        flex: 1,
        gap: 6,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
    },
    skeletonTitle: {
        width: '60%',
    },
    skeletonDesc: {
        width: '80%',
        height: 10,
    },
    skeletonDate: {
        width: '40%',
        height: 10,
    },
    skeletonRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    skeletonAmount: {
        width: 70,
    },
    skeletonBadge: {
        width: 60,
        height: 20,
        borderRadius: 10,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
    },
    modalBody: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
