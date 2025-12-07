import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FAQsScreen() {
    const { colors, fonts, isDark } = useTheme();
    const [expandedId, setExpandedId] = useState(null);

    const faqs = [
        {
            id: '1',
            question: 'How do I fund my wallet?',
            answer: 'You can fund your wallet using Card Payment, Bank Transfer, or USSD. Go to the Home screen and tap on "Add Money" to get started.'
        },
        {
            id: '2',
            question: 'How long does it take for my wallet to be credited?',
            answer: 'Card payments are instant. Bank transfers take 5-10 minutes. USSD payments are processed immediately after confirmation.'
        },
        {
            id: '3',
            question: 'What is the minimum amount I can fund?',
            answer: 'The minimum funding amount is ₦100 for all payment methods.'
        },
        {
            id: '4',
            question: 'How do I buy data or airtime?',
            answer: 'Navigate to the Services tab, select the service you want (Data or Airtime), choose your network, enter the amount or plan, and complete the transaction.'
        },
        {
            id: '5',
            question: 'Can I schedule transactions?',
            answer: 'Yes! When making a purchase, look for the "Schedule Transaction" option to set up automatic recurring payments.'
        },
        {
            id: '6',
            question: 'How do I change my PIN?',
            answer: 'Go to Profile > Security & Privacy > Change PIN. You\'ll need your current PIN to set a new one.'
        },
        {
            id: '7',
            question: 'What if I forget my PIN?',
            answer: 'Go to Profile > Security & Privacy > Reset PIN. You\'ll need to verify your password to reset your PIN.'
        },
        {
            id: '8',
            question: 'Are my transactions secure?',
            answer: 'Yes! All transactions are encrypted with 256-bit SSL encryption and require PIN authorization.'
        },
        {
            id: '9',
            question: 'How do I contact support?',
            answer: 'You can reach us via Live Chat, Email (support@Ulamadata.ng), or WhatsApp.'
        },
        {
            id: '10',
            question: 'Can I get a refund?',
            answer: 'Refunds are processed on a case-by-case basis. Contact support with your transaction reference for assistance.'
        },
    ];

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Frequently Asked Questions
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {faqs.map((faq) => (
                    <TouchableOpacity
                        key={faq.id}
                        style={[styles.faqCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={() => toggleExpand(faq.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.questionRow}>
                            <Text style={[styles.question, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {faq.question}
                            </Text>
                            <Ionicons
                                name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.icon}
                            />
                        </View>
                        {expandedId === faq.id && (
                            <Text style={[styles.answer, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {faq.answer}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={[styles.contactCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="help-circle" size={24} color={colors.primary} />
                    <View style={styles.contactText}>
                        <Text style={[styles.contactTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Still have questions?
                        </Text>
                        <Text style={[styles.contactDesc, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                            Our support team is here to help you 24/7
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.contactButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/(support)/live-chat')}
                    >
                        <Text style={[styles.contactButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Chat Now
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
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
    headerTitle: { fontSize: 18, flex: 1, textAlign: 'center', marginRight: 24 },
    faqCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    question: {
        flex: 1,
        fontSize: 14,
        marginRight: 12,
    },
    answer: {
        fontSize: 13,
        marginTop: 12,
        lineHeight: 20,
    },
    contactCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    contactText: {
        marginVertical: 12,
    },
    contactTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    contactDesc: {
        fontSize: 13,
    },
    contactButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 14,
    },
});
