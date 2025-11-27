import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function KYCScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { user, submitKyc } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        dob: '',
        idType: 'NIN',
        idNumber: '',
        phone: user?.phone || '',
        email: user?.email || '',
        state: '',
        city: '',
        address: '',
        surname: user?.surname || '',
        image: null,
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDay, setSelectedDay] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [selectedYear, setSelectedYear] = useState(2000);

    const idTypes = ['NIN'];
    
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            showToast('error', 'Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0] });
        }
    };

    const handleDateConfirm = () => {
        const month = String(selectedMonth + 1).padStart(2, '0');
        const day = String(selectedDay).padStart(2, '0');
        const formattedDate = `${selectedYear}-${month}-${day}`;
        setFormData({ ...formData, dob: formattedDate });
        setShowDatePicker(false);
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'Select date of birth';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.dob || !formData.idNumber || !formData.state || !formData.city || !formData.address) {
            showToast('error', 'Please fill all required fields');
            return;
        }

        if (!formData.image) {
            showToast('error', 'Please upload your ID photo');
            return;
        }

        setIsLoading(true);
        const result = await submitKyc(formData);
        setIsLoading(false);

        if (result.success) {
            router.back();
        }
    };

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    KYC Verification
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                        Complete your KYC verification to unlock higher transaction limits and full account features.
                    </Text>
                </View>

                {/* Image Upload */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        ID Photo
                    </Text>
                    <TouchableOpacity
                        style={[styles.imageUpload, { 
                            backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                            borderColor: colors.border,
                        }]}
                        onPress={pickImage}
                    >
                        {formData.image ? (
                            <Image source={{ uri: formData.image.uri }} style={styles.uploadedImage} />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={40} color={colors.icon} />
                                <Text style={[styles.uploadText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Tap to upload ID photo
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Personal Information
                    </Text>
                    <View style={[styles.formCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <Input
                            label="Surname"
                            placeholder="Enter your surname"
                            value={formData.surname}
                            onChangeText={(text) => setFormData({ ...formData, surname: text })}
                            editable={!isLoading}
                        />

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Date of Birth
                            </Text>
                            <TouchableOpacity
                                style={[styles.datePickerButton, { 
                                    backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                    borderColor: colors.border,
                                }]}
                                onPress={() => setShowDatePicker(true)}
                                disabled={isLoading}
                            >
                                <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                                <Text style={[styles.dateText, { 
                                    color: formData.dob ? colors.text : colors.icon,
                                    fontFamily: fonts.inter.medium 
                                }]}>
                                    {formatDisplayDate(formData.dob)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Phone Number"
                            placeholder="08012345678"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            keyboardType="phone-pad"
                            editable={!isLoading}
                        />

                        <Input
                            label="Email"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* ID Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        ID Information
                    </Text>
                    <View style={[styles.formCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                ID Type
                            </Text>
                            <View style={styles.idTypeContainer}>
                                {idTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.idTypeButton,
                                            { 
                                                backgroundColor: formData.idType === type ? colors.primary : 'transparent',
                                                borderColor: formData.idType === type ? colors.primary : colors.border,
                                            }
                                        ]}
                                        onPress={() => setFormData({ ...formData, idType: type })}
                                        disabled={isLoading}
                                    >
                                        <Text style={[
                                            styles.idTypeText,
                                            { 
                                                color: formData.idType === type ? '#fff' : colors.text,
                                                fontFamily: fonts.inter.medium 
                                            }
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Input
                            label="ID Number"
                            placeholder="Enter your ID number"
                            value={formData.idNumber}
                            onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Address Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Address Information
                    </Text>
                    <View style={[styles.formCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <Input
                            label="State"
                            placeholder="e.g., Lagos"
                            value={formData.state}
                            onChangeText={(text) => setFormData({ ...formData, state: text })}
                            editable={!isLoading}
                        />

                        <Input
                            label="City"
                            placeholder="e.g., Ikeja"
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                            editable={!isLoading}
                        />

                        <Input
                            label="Address"
                            placeholder="Enter your full address"
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            multiline
                            numberOfLines={3}
                            editable={!isLoading}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title={isLoading ? "Submitting..." : "Submit KYC"}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.5 : 1 }}
                />
            </View>

            {/* Date Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setShowDatePicker(false)}
                >
                    <Pressable 
                        style={[styles.datePickerModal, { backgroundColor: colors.background }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.datePickerHeader}>
                            <Text style={[styles.datePickerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Select Date of Birth
                            </Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Ionicons name="close" size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickersContainer}>
                            <View style={styles.pickerWrapper}>
                                <Text style={[styles.pickerLabel, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                    Day
                                </Text>
                                <ScrollView 
                                    style={[styles.scrollPicker, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {days.map((day) => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.pickerItem,
                                                selectedDay === day && { backgroundColor: colors.primary + '20' }
                                            ]}
                                            onPress={() => setSelectedDay(day)}
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                { 
                                                    color: selectedDay === day ? colors.primary : colors.text,
                                                    fontFamily: selectedDay === day ? fonts.inter.semiBold : fonts.inter.regular
                                                }
                                            ]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.pickerWrapper}>
                                <Text style={[styles.pickerLabel, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                    Month
                                </Text>
                                <ScrollView 
                                    style={[styles.scrollPicker, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {months.map((month, index) => (
                                        <TouchableOpacity
                                            key={month}
                                            style={[
                                                styles.pickerItem,
                                                selectedMonth === index && { backgroundColor: colors.primary + '20' }
                                            ]}
                                            onPress={() => setSelectedMonth(index)}
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                { 
                                                    color: selectedMonth === index ? colors.primary : colors.text,
                                                    fontFamily: selectedMonth === index ? fonts.inter.semiBold : fonts.inter.regular
                                                }
                                            ]}>
                                                {month.substring(0, 3)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.pickerWrapper}>
                                <Text style={[styles.pickerLabel, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                                    Year
                                </Text>
                                <ScrollView 
                                    style={[styles.scrollPicker, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {years.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[
                                                styles.pickerItem,
                                                selectedYear === year && { backgroundColor: colors.primary + '20' }
                                            ]}
                                            onPress={() => setSelectedYear(year)}
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                { 
                                                    color: selectedYear === year ? colors.primary : colors.text,
                                                    fontFamily: selectedYear === year ? fonts.inter.semiBold : fonts.inter.regular
                                                }
                                            ]}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={styles.datePickerActions}>
                            <TouchableOpacity
                                style={[styles.dateActionButton, { backgroundColor: colors.primary }]}
                                onPress={handleDateConfirm}
                            >
                                <Text style={[styles.dateActionText, { color: '#fff', fontFamily: fonts.inter.semiBold }]}>
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
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
        paddingBottom: 20,
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
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    imageUpload: {
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadText: {
        fontSize: 13,
        marginTop: 8,
    },
    formCard: {
        padding: 20,
        borderRadius: 16,
        gap: 16,
    },
    inputWrapper: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
    },
    idTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    idTypeButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    idTypeText: {
        fontSize: 12,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    dateText: {
        fontSize: 15,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    datePickerModal: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    datePickerTitle: {
        fontSize: 18,
    },
    pickersContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
    },
    pickerWrapper: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    scrollPicker: {
        height: 200,
        borderRadius: 12,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
        marginVertical: 2,
    },
    pickerItemText: {
        fontSize: 14,
    },
    datePickerActions: {
        paddingHorizontal: 20,
    },
    dateActionButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    dateActionText: {
        fontSize: 15,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
});
