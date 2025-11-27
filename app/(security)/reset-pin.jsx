import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResetPinScreen() {
    const { colors, fonts, isDark } = useTheme();
    const [password, setPassword] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const handleResetPin = () => {
        if (!password || !newPin || !confirmPin) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (newPin !== confirmPin) {
            Alert.alert('Error', 'New PIN and Confirm PIN do not match');
            return;
        }
        if (newPin.length !== 4) {
            Alert.alert('Error', 'PIN must be 4 digits');
            return;
        }
        Alert.alert('Success', 'PIN reset successfully', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Reset PIN
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={[styles.infoCard, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="warning" size={20} color={colors.warning} />
                    <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        You'll need to verify your password to reset your PIN for security purposes.
                    </Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <Input
                        label="Account Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Input
                        label="New PIN"
                        placeholder="Enter new 4-digit PIN"
                        value={newPin}
                        onChangeText={setNewPin}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                    />

                    <Input
                        label="Confirm New PIN"
                        placeholder="Confirm new PIN"
                        value={confirmPin}
                        onChangeText={setConfirmPin}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Reset PIN"
                    onPress={handleResetPin}
                    style={{ opacity: (!password || !newPin || !confirmPin) ? 0.5 : 1 }}
                />
            </View>
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
    },
    infoCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    infoText: { flex: 1, fontSize: 12 },
    formCard: {
        padding: 20,
        borderRadius: 16,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
