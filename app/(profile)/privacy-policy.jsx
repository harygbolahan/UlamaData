import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function PrivacyPolicyScreen() {
    const { colors, fonts } = useTheme();
    const router = useRouter();

    const sections = [
        {
            title: 'Information We Collect',
            content: 'We collect information you provide directly to us, including your name, email address, phone number, and payment information. We also collect information about your transactions and usage of our services.'
        },
        {
            title: 'How We Use Your Information',
            content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and events.'
        },
        {
            title: 'Information Sharing',
            content: 'We do not share your personal information with third parties except as described in this policy. We may share information with service providers who perform services on our behalf, and when required by law or to protect our rights.'
        },
        {
            title: 'Data Security',
            content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.'
        },
        {
            title: 'Your Rights',
            content: 'You have the right to access, update, or delete your personal information. You can also object to processing of your personal information, ask us to restrict processing, or request portability of your data.'
        },
        {
            title: 'Cookies and Tracking',
            content: 'We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.'
        },
        {
            title: 'Data Retention',
            content: 'We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.'
        },
        {
            title: 'Children\'s Privacy',
            content: 'Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.'
        },
        {
            title: 'Changes to This Policy',
            content: 'We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date.'
        },
        {
            title: 'Contact Us',
            content: 'If you have any questions about this privacy policy, please contact us at support@ulamadata.ng or through our in-app support system.'
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Privacy Policy
                </Text>
                <View style={{ width: 24 * scale }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Last Updated */}
                <View style={[styles.updateCard, { backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Ionicons name="time-outline" size={16 * scale} color={colors.icon} />
                    <Text style={[styles.updateText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Last Updated: November 28, 2025
                    </Text>
                </View>

                {/* Introduction */}
                <View style={styles.section}>
                    <Text style={[styles.introText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        UlamaData ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
                    </Text>
                </View>

                {/* Sections */}
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

                {/* Contact Card */}
                <TouchableOpacity 
                    style={[styles.contactCard, { 
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary + '40',
                    }]}
                    onPress={() => router.push('/support')}
                >
                    <View style={[styles.contactIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="mail" size={24 * scale} color={colors.primary} />
                    </View>
                    <Text style={[styles.contactTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Questions About Privacy?
                    </Text>
                    <Text style={[styles.contactText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Contact our privacy team at support@ulamadata.ng
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
    },
    contactText: {
        fontSize: 12 * scale,
        textAlign: 'center',
    },
    contactArrow: {
        marginTop: 8 * scale,
    },
});
