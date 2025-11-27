import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CardsTab() {
    const { colors, fonts, toggleTheme, isDark } = useTheme();

    const cards = [
        {
            id: '1',
            type: 'Virtual Card',
            number: '**** **** **** 4532',
            balance: '₦15,000',
            expiry: '12/25',
            color: '#2196F3',
            gradient: ['#2196F3', '#1976D2'],
        },
        {
            id: '2',
            type: 'Physical Card',
            number: '**** **** **** 8765',
            balance: '₦10,000',
            expiry: '08/26',
            color: '#4CAF50',
            gradient: ['#4CAF50', '#388E3C'],
        },
    ];

    const cardTransactions = [
        { id: '1', merchant: 'Netflix', amount: '-₦2,900', date: 'Nov 8, 2025', icon: 'tv' },
        { id: '2', merchant: 'Amazon', amount: '-₦8,500', date: 'Nov 7, 2025', icon: 'cart' },
        { id: '3', merchant: 'Spotify', amount: '-₦900', date: 'Nov 5, 2025', icon: 'musical-notes' },
        { id: '4', merchant: 'Uber', amount: '-₦3,200', date: 'Nov 4, 2025', icon: 'car' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    My Cards
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={toggleTheme}>
                        <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Cards Carousel */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsContainer}
                    pagingEnabled
                >
                    {cards.map((card) => (
                        <View
                            key={card.id}
                            style={[styles.card, { backgroundColor: card.color }]}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardType, { fontFamily: fonts.inter.medium }]}>
                                    {card.type}
                                </Text>
                                <Ionicons name="card" size={32} color="rgba(255,255,255,0.8)" />
                            </View>
                            <View style={styles.cardChip}>
                                <Ionicons name="hardware-chip" size={40} color="rgba(255,255,255,0.9)" />
                            </View>
                            <Text style={[styles.cardNumber, { fontFamily: fonts.inter.semiBold }]}>
                                {card.number}
                            </Text>
                            <View style={styles.cardFooter}>
                                <View>
                                    <Text style={[styles.cardLabel, { fontFamily: fonts.inter.regular }]}>
                                        Balance
                                    </Text>
                                    <Text style={[styles.cardBalance, { fontFamily: fonts.inter.bold }]}>
                                        {card.balance}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.cardLabel, { fontFamily: fonts.inter.regular }]}>
                                        Expires
                                    </Text>
                                    <Text style={[styles.cardExpiry, { fontFamily: fonts.inter.semiBold }]}>
                                        {card.expiry}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Card Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionCard, {
                        backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                    }]}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="add" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Fund Card
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard, {
                        backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                    }]}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Freeze Card
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard, {
                        backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                    }]}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="settings" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Settings
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Card Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Card Transactions
                        </Text>
                        <TouchableOpacity>
                            <Text style={[styles.seeAll, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {cardTransactions.map((transaction) => (
                        <TouchableOpacity
                            key={transaction.id}
                            style={[styles.transactionCard, {
                                backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5'
                            }]}
                        >
                            <View style={[styles.transactionIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name={transaction.icon} size={24} color={colors.primary} />
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.transactionMerchant, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    {transaction.merchant}
                                </Text>
                                <Text style={[styles.transactionDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {transaction.date}
                                </Text>
                            </View>
                            <Text style={[styles.transactionAmount, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {transaction.amount}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
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
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
    },
    cardsContainer: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    card: {
        width: 300,
        height: 170,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardType: {
        color: '#fff',
        fontSize: 13,
    },
    cardChip: {
        marginVertical: 8,
    },
    cardNumber: {
        color: '#fff',
        fontSize: 17,
        letterSpacing: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        marginBottom: 3,
    },
    cardBalance: {
        color: '#fff',
        fontSize: 15,
    },
    cardExpiry: {
        color: '#fff',
        fontSize: 14,
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    actionText: {
        fontSize: 11,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
    },
    seeAll: {
        fontSize: 12,
    },
    transactionCard: {
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionMerchant: {
        fontSize: 13,
        marginBottom: 3,
    },
    transactionDate: {
        fontSize: 11,
    },
    transactionAmount: {
        fontSize: 14,
    },
});
