import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
const scale = isSmallScreen ? 0.7 : 1;

export default function PersonalInformationScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { user } = useAuth();
    
    const [fullName, setFullName] = useState(`${user?.name || ''} ${user?.surname || ''}`.trim());
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Personal Information
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={[styles.inputGroup, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.label, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Full Name</Text>
                    <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.medium }]}
                        placeholder="Enter your full name"
                        placeholderTextColor={colors.icon}
                    />
                </View>

                <View style={[styles.inputGroup, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.label, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.medium }]}
                        keyboardType="email-address"
                        placeholder="Enter your email"
                        placeholderTextColor={colors.icon}
                        autoCapitalize="none"
                    />
                </View>

                <View style={[styles.inputGroup, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Text style={[styles.label, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Phone Number</Text>
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.medium }]}
                        keyboardType="phone-pad"
                        placeholder="Enter your phone number"
                        placeholderTextColor={colors.icon}
                    />
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="information-circle" size={20 * scale} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Contact support to update your personal information
                    </Text>
                </View>

                {/* <Button title="Save Changes" onPress={() => { }} style={styles.saveButton} disabled /> */}
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
        paddingBottom: 30 * scale,
    },
    inputGroup: {
        padding: 16 * scale,
        borderRadius: 12 * scale,
        marginBottom: 16 * scale,
    },
    label: {
        fontSize: 12 * scale,
        marginBottom: 8 * scale,
    },
    input: {
        fontSize: 15 * scale,
    },
    saveButton: {
        marginTop: 20 * scale,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 12 * scale,
        borderRadius: 12 * scale,
        gap: 10 * scale,
        alignItems: 'center',
        marginTop: 4 * scale,
    },
    infoText: {
        flex: 1,
        fontSize: 12 * scale,
    },
});
