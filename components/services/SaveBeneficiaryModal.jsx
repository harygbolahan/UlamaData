import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SaveBeneficiaryModal({ visible, onClose, onSave, phoneNumber }) {
    const { colors, fonts, isDark } = useTheme();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            return;
        }

        setSaving(true);
        await onSave(name.trim());
        setSaving(false);
        setName('');
        onClose();
    };

    const handleClose = () => {
        setName('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Save Beneficiary
                        </Text>
                        <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                        Enter a name for {phoneNumber}
                    </Text>

                    <TextInput
                        placeholder="e.g., John Doe"
                        placeholderTextColor={colors.icon}
                        value={name}
                        onChangeText={setName}
                        style={[
                            styles.input,
                            {
                                backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                                color: colors.text,
                                fontFamily: fonts.inter.regular
                            }
                        ]}
                        autoFocus
                        onSubmitEditing={handleSave}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                            onPress={handleClose}
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.saveButton,
                                { backgroundColor: colors.primary },
                                (!name.trim() || saving) && { opacity: 0.5 }
                            ]}
                            onPress={handleSave}
                            activeOpacity={0.7}
                            disabled={!name.trim() || saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[styles.saveButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    Save
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 24,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {},
    saveButton: {},
    cancelButtonText: {
        fontSize: 16,
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
    },
});
