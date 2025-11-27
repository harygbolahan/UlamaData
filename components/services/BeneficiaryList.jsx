import { useBeneficiaries } from '@/contexts/beneficiary-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BeneficiaryList({ onSelectBeneficiary, limit, onViewAll }) {
    const { colors, fonts, isDark } = useTheme();
    const { beneficiaries, loading, error, removeBeneficiary, searchBeneficiaries, refreshBeneficiaries } = useBeneficiaries();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const filteredBeneficiaries = searchBeneficiaries(searchQuery);
    const displayedBeneficiaries = limit ? filteredBeneficiaries.slice(0, limit) : filteredBeneficiaries;
    const hasMore = limit && filteredBeneficiaries.length > limit;

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshBeneficiaries();
        setRefreshing(false);
    };

    const handleSelect = (beneficiary) => {
        if (onSelectBeneficiary) {
            onSelectBeneficiary(beneficiary);
        }
    };

    const handleDelete = async (phoneNumber, e) => {
        e?.stopPropagation();
        await removeBeneficiary(phoneNumber);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                <Ionicons name="search" size={20} color={colors.icon} />
                <TextInput
                    placeholder="Search beneficiaries..."
                    placeholderTextColor={colors.icon}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchInput, { color: colors.text, fontFamily: fonts.inter.regular }]}
                />
                {loading && !refreshing && (
                    <ActivityIndicator size="small" color={colors.primary} />
                )}
            </View>

            {loading && !refreshing && beneficiaries.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Loading beneficiaries...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle" size={48} color={colors.error} />
                    <Text style={[styles.emptyText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={handleRefresh}
                    >
                        <Text style={[styles.retryButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : filteredBeneficiaries.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {searchQuery ? 'No beneficiaries found' : 'No beneficiaries yet'}
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        {searchQuery ? 'Try a different search' : 'Complete a transaction to add beneficiaries'}
                    </Text>
                </View>
            ) : (
                <>
                    <ScrollView
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[colors.primary]}
                            />
                        }
                    >
                        {displayedBeneficiaries.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.beneficiaryCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                onPress={() => handleSelect(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.beneficiaryInfo}>
                                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="person" size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.beneficiaryDetails}>
                                        <Text style={[styles.beneficiaryName, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.beneficiaryPhone, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            {item.phoneNumber} • {item.network}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={(e) => handleDelete(item.phoneNumber, e)}
                                    style={styles.deleteButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {hasMore && onViewAll && (
                        <TouchableOpacity
                            style={[styles.viewAllButton, { backgroundColor: colors.primary }]}
                            onPress={onViewAll}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.viewAllText, { fontFamily: fonts.inter.semiBold }]}>
                                View All ({filteredBeneficiaries.length})
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    beneficiaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    beneficiaryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    beneficiaryDetails: {
        flex: 1,
    },
    beneficiaryName: {
        fontSize: 15,
        marginBottom: 4,
    },
    beneficiaryPhone: {
        fontSize: 13,
    },
    deleteButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 13,
        textAlign: 'center',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    viewAllText: {
        fontSize: 15,
        color: '#fff',
    },
});
