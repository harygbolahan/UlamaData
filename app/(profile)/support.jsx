import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function SupportScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { getSupportData } = useAuth();
    const [socialMediaOptions, setSocialMediaOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const defaultSupportOptions = [
        { id: '1', title: 'FAQs', icon: 'help-circle', action: () => router.push('/(support)/faqs') },
        { id: '2', title: 'Live Chat', icon: 'chatbubbles', action: () => router.push('/(support)/live-chat') },
        // { id: '3', title: 'Email Support', icon: 'mail', action: () => Linking.openURL('mailto:support@ulamadata.ng') },
        // { id: '4', title: 'Call Us', icon: 'call', action: () => Linking.openURL('tel:+2348012345678') },
    ];

    useEffect(() => {
        fetchSupportData();
    }, []);

    const fetchSupportData = async () => {
        setIsLoading(true);
        const result = await getSupportData();

        if (result.success && result.data.socialMedia) {
            // Map API data to social media options
            const options = result.data.socialMedia.map((item, index) => {
                const name = item.name.toLowerCase();
                let icon = 'help-circle';

                // Map social media names to icons
                if (name.includes('whatsapp')) icon = 'logo-whatsapp';
                else if (name.includes('facebook')) icon = 'logo-facebook';
                else if (name.includes('instagram')) icon = 'logo-instagram';
                else if (name.includes('twitter') || name.includes('x')) icon = 'logo-twitter';
                else if (name.includes('telegram')) icon = 'paper-plane';
                else if (name.includes('email') || name.includes('mail')) icon = 'mail';
                else if (name.includes('call') || name.includes('phone')) icon = 'call';
                else if (name.includes('chat')) icon = 'chatbubbles';

                return {
                    id: String(index + 1),
                    title: item.name,
                    icon: icon,
                    action: () => Linking.openURL(item.link),
                };
            });

            setSocialMediaOptions(options);
        }

        setIsLoading(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Help & Support
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Social Media Grid */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: fonts.inter.regular }]}>
                            Loading...
                        </Text>
                    </View>
                ) : socialMediaOptions.length > 0 ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Connect With Us
                        </Text>
                        <View style={styles.gridContainer}>
                            {socialMediaOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.gridItem, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                                    onPress={option.action}
                                >
                                    <View style={[styles.gridIcon, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name={option.icon} size={24 * scale} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.gridText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        {option.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : null}

                {/* Default Support Options */}
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold, marginTop: socialMediaOptions.length > 0 ? 24 : 0 }]}>
                    Support Options
                </Text>
                {defaultSupportOptions.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={option.action}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={option.icon} size={20 * scale} color={colors.primary} />
                        </View>
                        <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                            {option.title}
                        </Text>
                        <Ionicons name="chevron-forward" size={20 * scale} color={colors.icon} />
                    </TouchableOpacity>
                ))}
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
    sectionTitle: {
        fontSize: 16 * scale,
        marginHorizontal: 20 * scale,
        marginBottom: 12 * scale,
        marginTop: 8 * scale,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40 * scale,
    },
    loadingText: {
        marginTop: 12 * scale,
        fontSize: 14 * scale,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20 * scale,
        marginBottom: 8 * scale,
    },
    gridItem: {
        width: '29%',
        aspectRatio: 1,
        marginRight: '3.5%',
        marginBottom: 12 * scale,
        borderRadius: 12 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12 * scale,
    },
    gridIcon: {
        width: 48 * scale,
        height: 48 * scale,
        borderRadius: 24 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8 * scale,
    },
    gridText: {
        fontSize: 12 * scale,
        textAlign: 'center',
    },
    optionCard: {
        marginHorizontal: 20 * scale,
        padding: 16 * scale,
        borderRadius: 12 * scale,
        marginBottom: 12 * scale,
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        width: 40 * scale,
        height: 40 * scale,
        borderRadius: 20 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12 * scale,
    },
    optionText: {
        flex: 1,
        fontSize: 14 * scale,
    },
});
