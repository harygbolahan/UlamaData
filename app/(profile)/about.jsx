import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
    const { colors, fonts, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    About
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={styles.logoText}>💳</Text>
                </View>

                <Text style={[styles.appName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    DataBeta
                </Text>
                <Text style={[styles.version, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                    Version 1.0.0
                </Text>

                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.description, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        DataBeta is your trusted platform for fast and secure VTU services. Buy data, airtime, pay bills, and more with ease.
                    </Text>
                </View>

                <View style={[styles.linkCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Terms of Service
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                    </TouchableOpacity>
                    <View style={[styles.linkDivider, { backgroundColor: colors.icon + '20' }]} />
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Privacy Policy
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                    </TouchableOpacity>
                    <View style={[styles.linkDivider, { backgroundColor: colors.icon + '20' }]} />
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Licenses
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.copyright, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                    © 2025 DataBeta. All rights reserved.
                </Text>
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
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: { fontSize: 50 },
    appName: { fontSize: 28, marginBottom: 8 },
    version: { fontSize: 14, marginBottom: 24 },
    infoCard: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    linkCard: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    linkItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    linkText: { fontSize: 14 },
    linkDivider: { height: 1 },
    copyright: {
        fontSize: 12,
        textAlign: 'center',
    },
});
