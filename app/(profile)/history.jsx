import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionHistoryScreen() {
    const { colors, fonts, isDark } = useTheme();

    const transactions = [
        { id: '1', title: 'MTN Data', amount: '-₦1,500', date: 'Nov 9, 2025', status: 'success', icon: 'wifi' },
        { id: '2', title: 'DSTV Subscription', amount: '-₦12,500', date: 'Nov 8, 2025', status: 'success', icon: 'tv' },
        { id: '3', title: 'Wallet Funding', amount: '+₦10,000', date: 'Nov 7, 2025', status: 'success', icon: 'wallet' },
        { id: '4', title: 'Airtel Airtime', amount: '-₦500', date: 'Nov 6, 2025', status: 'success', icon: 'phone-portrait' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Transaction History
                </Text>
                <TouchableOpacity>
                    <Ionicons name="filter-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {transactions.map((transaction) => (
                    <TouchableOpacity
                        key={transaction.id}
                        style={[styles.transactionCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={() => router.push(`/transaction-details?id=${transaction.id}`)}
                    >
                        <View style={[styles.transactionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={transaction.icon} size={20} color={colors.primary} />
                        </View>
                        <View style={styles.transactionInfo}>
                            <Text style={[styles.transactionTitle, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                {transaction.title}
                            </Text>
                            <Text style={[styles.transactionDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {transaction.date}
                            </Text>
                        </View>
                        <Text style={[
                            styles.transactionAmount,
                            { color: transaction.amount.startsWith('+') ? colors.success : colors.text, fontFamily: fonts.inter.semiBold }
                        ]}>
                            {transaction.amount}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    transactionCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: { flex: 1 },
    transactionTitle: { fontSize: 14, marginBottom: 4 },
    transactionDate: { fontSize: 12 },
    transactionAmount: { fontSize: 15 },
});
