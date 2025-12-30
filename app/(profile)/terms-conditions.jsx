import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function TermsConditionsScreen() {
    const { colors, fonts } = useTheme();
    const router = useRouter();

    const sections = [
        {
            title: 'Acceptance of Terms',
            content: 'By accessing and using UlamaData, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.'
        },
        {
            title: 'Service Description',
            content: 'UlamaData provides mobile data, airtime, cable TV subscriptions, electricity bill payments, and other digital services. We reserve the right to modify, suspend, or discontinue any service at any time without notice.'
        },
        {
            title: 'User Account',
            content: 'You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use.'
        },
        {
            title: 'Payment Terms',
            content: 'All payments must be made in Nigerian Naira (NGN). We accept various payment methods including bank transfers, cards, and wallet funding. All transactions are final and non-refundable except as required by law.'
        },
        {
            title: 'Service Delivery',
            content: 'We strive to deliver services instantly. However, delivery times may vary depending on third-party providers. We are not liable for delays caused by network providers or other external factors beyond our control.'
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Terms & Conditions
                </Text>
                <View style={{ width: 24 * scale }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.updateCard, { backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Ionicons name="time-outline" size={16 * scale} color={colors.icon} />
                    <Text style={[styles.updateText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Last Updated: November 28, 2025
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.introText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Please read these Terms and Conditions carefully before using UlamaData. These terms govern your use of our services and constitute a legally binding agreement between you and UlamaData.
                    </Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15' }]}>
                            <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.numberText, { fontFamily: fonts.inter.bold }]}>
                                    {index + 1}
                                </Text>
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {section.title}
                            </Text>
                        </View>
                        <Text style={[styles.sectionContent, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            {section.content}
                        </Text>
                    </View>
                ))}

                {/* Additional Sections */}
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15' }]}>
                        <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.numberText, { fontFamily: fonts.inter.bold }]}>6</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Refund Policy
                        </Text>
                    </View>
                    <Text style={[styles.sectionContent, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Refunds are only provided in cases of service failure or duplicate transactions. Refund requests must be submitted within 24 hours of the transaction. Processing may take 5-7 business days.
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15' }]}>
                        <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.numberText, { fontFamily: fonts.inter.bold }]}>7</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Prohibited Activities
                        </Text>
                    </View>
                    <Text style={[styles.sectionContent, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        You may not use our services for any illegal activities, fraud, money laundering, or any activity that violates these terms. We reserve the right to suspend or terminate accounts engaged in prohibited activities.
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15' }]}>
                        <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.numberText, { fontFamily: fonts.inter.bold }]}>8</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Limitation of Liability
                        </Text>
                    </View>
                    <Text style={[styles.sectionContent, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        UlamaData shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount paid by you for the specific service.
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15' }]}>
                        <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.numberText, { fontFamily: fonts.inter.bold }]}>9</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Changes to Terms
                        </Text>
                    </View>
                    <Text style={[styles.sectionContent, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of our services constitutes acceptance of the modified terms.
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15' }]}>
                        <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.numberText, { fontFamily: fonts.inter.bold }]}>10</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Contact Information
                        </Text>
                    </View>
                    <Text style={[styles.sectionContent, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        For questions about these Terms and Conditions, please contact us at support@ulamadata.ng or through our in-app support system.
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[styles.contactCard, { 
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary + '40',
                    }]}
                    onPress={() => router.push('/support')}
                >
                    <View style={[styles.contactIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="document-text" size={24 * scale} color={colors.primary} />
                    </View>
                    <Text style={[styles.contactTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        By using UlamaData, you agree to these terms
                    </Text>
                    <Text style={[styles.contactText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        If you have any questions, contact support@ulamadata.ng
                    </Text>
                    <View style={styles.contactArrow}>
                        <Ionicons name="arrow-forward" size={20 * scale} color={colors.primary} />
                    </View>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
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
        paddingHorizontal: 20 * scale,
        paddingTop: 20 * scale,
        marginBottom: 20 * scale,
    },
    headerTitle: {
        fontSize: 18 * scale,
    },
    updateCard: {
        marginHorizontal: 20 * scale,
        padding: 12 * scale,
        borderRadius: 12 * scale,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 * scale,
        marginBottom: 20 * scale,
    },
    updateText: {
        fontSize: 12 * scale,
    },
    section: {
        marginHorizontal: 20 * scale,
        marginBottom: 20 * scale,
    },
    introText: {
        fontSize: 13 * scale,
        lineHeight: 20 * scale,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12 * scale,
        borderRadius: 12 * scale,
        marginBottom: 12 * scale,
        gap: 12 * scale,
    },
    numberBadge: {
        width: 28 * scale,
        height: 28 * scale,
        borderRadius: 14 * scale,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        color: '#fff',
        fontSize: 13 * scale,
    },
    sectionTitle: {
        fontSize: 15 * scale,
        flex: 1,
    },
    sectionContent: {
        fontSize: 13 * scale,
        lineHeight: 20 * scale,
    },
    contactCard: {
        marginHorizontal: 20 * scale,
        padding: 20 * scale,
        borderRadius: 16 * scale,
        alignItems: 'center',
        borderWidth: 1,
    },
    contactIcon: {
        width: 48 * scale,
        height: 48 * scale,
        borderRadius: 24 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12 * scale,
    },
    contactTitle: {
        fontSize: 15 * scale,
        marginBottom: 6 * scale,
        textAlign: 'center',
    },
    contactText: {
        fontSize: 12 * scale,
        textAlign: 'center',
    },
    contactArrow: {
        marginTop: 8 * scale,
    },
});
