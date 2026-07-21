import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function AboutScreen() {
    const { colors, fonts, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    About
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                <Text style={[styles.appName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    UlamaData
                </Text>
                <Text style={[styles.version, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                    Version 3.5.0
                </Text>

                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.description, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        UlamaData is your trusted platform for fast and secure VTU services. Buy data, airtime, pay bills, and more with ease.
                    </Text>
                </View>

                <View style={[styles.linkCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => router.push('/(profile)/terms-conditions')}
                    >
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Terms of Service
                        </Text>
                        <Ionicons name="chevron-forward" size={20 * scale} color={colors.icon} />
                    </TouchableOpacity>
                    <View style={[styles.linkDivider, { backgroundColor: colors.icon + '20' }]} />
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => router.push('/(profile)/privacy-policy')}
                    >
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Privacy Policy
                        </Text>
                        <Ionicons name="chevron-forward" size={20 * scale} color={colors.icon} />
                    </TouchableOpacity>
                    <View style={[styles.linkDivider, { backgroundColor: colors.icon + '20' }]} />
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => router.push('/support')}
                    >
                        <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            Contact Support
                        </Text>
                        <Ionicons name="chevron-forward" size={20 * scale} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.copyright, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                    © 2025 UlamaData. All rights reserved.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20 * scale,
        paddingTop: 20 * scale,
        marginBottom: 20 * scale,
    },
    headerTitle: { fontSize: 18 * scale },
    content: {
        paddingHorizontal: 20 * scale,
        alignItems: 'center',
    },
    logoContainer: {
        width: 100 * scale,
        height: 100 * scale,
        borderRadius: 50 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20 * scale,
        overflow: 'hidden',
    },
    logoImage: {
        width: '80%',
        height: '80%',
    },
    appName: { fontSize: 28 * scale, marginBottom: 8 * scale },
    version: { fontSize: 14 * scale, marginBottom: 24 * scale },
    infoCard: {
        width: '100%',
        padding: 20 * scale,
        borderRadius: 16 * scale,
        marginBottom: 20 * scale,
    },
    description: {
        fontSize: 14 * scale,
        textAlign: 'center',
        lineHeight: 22 * scale,
    },
    linkCard: {
        width: '100%',
        padding: 16 * scale,
        borderRadius: 16 * scale,
        marginBottom: 24 * scale,
    },
    linkItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12 * scale,
    },
    linkText: { fontSize: 14 * scale },
    linkDivider: { height: 1 },
    copyright: {
        fontSize: 12 * scale,
        textAlign: 'center',
    },
});
