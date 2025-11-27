import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SecurityScreen() {
    const { colors, fonts, isDark } = useTheme();

    const securityOptions = [
        { id: '1', title: 'Change PIN', icon: 'lock-closed', route: '/(security)/change-pin' },
        { id: '2', title: 'Change Password', icon: 'key', route: '/(security)/change-password' },
        { id: '3', title: 'Biometric Login', icon: 'finger-print', route: '/(security)/biometric-login', description: 'Login with fingerprint or face' },
        { id: '4', title: 'Biometric for Transactions', icon: 'shield-checkmark', route: '/(security)/biometric-settings', description: 'Use biometric for payments' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Security & Privacy
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {securityOptions.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={() => option.route && router.push(option.route)}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={option.icon} size={20} color={colors.primary} />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                {option.title}
                            </Text>
                            {option.description && (
                                <Text style={[styles.optionDescription, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {option.description}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
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
    optionCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionText: {
        fontSize: 14,
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 12,
    },
});
