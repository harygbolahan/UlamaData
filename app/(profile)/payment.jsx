import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentMethodsScreen() {
    const { colors, fonts, isDark } = useTheme();

    const cards = [
        { id: '1', type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
        { id: '2', type: 'Mastercard', last4: '8888', expiry: '09/26', isDefault: false },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Payment Methods
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {cards.map((card) => (
                    <View
                        key={card.id}
                        style={[styles.cardItem, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                    >
                        <View style={[styles.cardIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="card" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={[styles.cardType, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {card.type} •••• {card.last4}
                            </Text>
                            <Text style={[styles.cardExpiry, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Expires {card.expiry}
                            </Text>
                        </View>
                        {card.isDefault && (
                            <View style={[styles.defaultBadge, { backgroundColor: colors.success + '20' }]}>
                                <Text style={[styles.defaultText, { color: colors.success, fontFamily: fonts.inter.medium }]}>
                                    Default
                                </Text>
                            </View>
                        )}
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
                >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    <Text style={[styles.addText, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                        Add New Card
                    </Text>
                </TouchableOpacity>
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
    cardItem: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: { flex: 1 },
    cardType: { fontSize: 14, marginBottom: 4 },
    cardExpiry: { fontSize: 12 },
    defaultBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    defaultText: { fontSize: 11 },
    addButton: {
        marginHorizontal: 20,
        marginTop: 8,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addText: { fontSize: 14 },
});
