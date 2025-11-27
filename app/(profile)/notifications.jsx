import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const { colors, fonts, isDark } = useTheme();

    const notificationSettings = [
        { id: '1', title: 'Transaction Alerts', description: 'Get notified of all transactions', value: true },
        { id: '2', title: 'Promotional Offers', description: 'Receive special offers and deals', value: true },
        { id: '3', title: 'Payment Reminders', description: 'Reminders for scheduled payments', value: false },
        { id: '4', title: 'Security Alerts', description: 'Important security notifications', value: true },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Notifications
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {notificationSettings.map((setting) => (
                    <View
                        key={setting.id}
                        style={[styles.settingCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {setting.title}
                            </Text>
                            <Text style={[styles.settingDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {setting.description}
                            </Text>
                        </View>
                        <Switch
                            value={setting.value}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
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
    settingCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingInfo: {
        flex: 1,
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 14,
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 12,
    },
});
