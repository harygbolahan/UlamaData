import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DatePicker({ value, onChange, minimumDate, maximumDate, label }) {
    const { colors, fonts, isDark } = useTheme();
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

    const formatDate = (date) => {
        if (!date) return 'Select date';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
            if (event.type === 'set' && selectedDate) {
                setTempDate(selectedDate);
                onChange(formatDate(selectedDate));
            }
        } else {
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const handleConfirm = () => {
        onChange(formatDate(tempDate));
        setShowPicker(false);
    };

    const handleCancel = () => {
        setTempDate(value ? new Date(value) : new Date());
        setShowPicker(false);
    };

    return (
        <View>
            {label && (
                <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    {label}
                </Text>
            )}
            <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                <Text style={[styles.dateText, { color: value ? colors.text : colors.icon, fontFamily: fonts.inter.regular }]}>
                    {value ? formatDate(value) : 'Select date'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.icon} />
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
                <Modal
                    visible={showPicker}
                    transparent
                    animationType="slide"
                    onRequestClose={handleCancel}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={styles.backdrop}
                            activeOpacity={1}
                            onPress={handleCancel}
                        />
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                                    <Text style={[styles.modalButton, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Select Date
                                </Text>
                                <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7}>
                                    <Text style={[styles.modalButton, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                minimumDate={minimumDate}
                                maximumDate={maximumDate}
                                textColor={colors.text}
                                themeVariant={isDark ? 'dark' : 'light'}
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                showPicker && (
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 12,
    },
    dateText: {
        flex: 1,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 16,
    },
    modalButton: {
        fontSize: 16,
    },
});
