import { useBeneficiaries } from '@/contexts/beneficiary-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const NETWORK_IMAGES = {
    mtn: require('@/assets/networks/mtn.png'),
    airtel: require('@/assets/networks/airtel.png'),
    '9mobile': require('@/assets/networks/9mobile.png'),
    glo: require('@/assets/networks/glo.png'),
};

export default function NetworkSelector({
    selectedNetwork,
    onNetworkSelect,
    phoneNumber,
    onPhoneNumberChange,
    onViewAllBeneficiaries,
    onSelectBeneficiary,
    networks = [
        { id: 'mtn', name: 'MTN', color: '#FFCC00' },
        { id: 'airtel', name: 'AIRTEL', color: '#FF0000' },
        { id: '9mobile', name: '9MOBILE', color: '#00A65A' },
        { id: 'glo', name: 'GLO', color: '#00A859' },
    ]
}) {
    const { colors, fonts, isDark } = useTheme();
    const { searchBeneficiaries } = useBeneficiaries();
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (phoneNumber.length > 0) {
            const matches = searchBeneficiaries(phoneNumber);
            setSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [phoneNumber]);

    const handlePhoneNumberChange = (text) => {
        onPhoneNumberChange(text);
    };

    const handleSelectSuggestion = (beneficiary) => {
        setShowSuggestions(false);
        setSuggestions([]);
        
        if (onSelectBeneficiary) {
            onSelectBeneficiary(beneficiary);
        } else {
            onPhoneNumberChange(beneficiary.phoneNumber);
            const network = networks.find(n => n.name.toLowerCase() === beneficiary.network.toLowerCase());
            if (network) {
                onNetworkSelect(network);
            }
        }
    };

    const handleContactPicker = async () => {
        try {
            // Request permission to access contacts
            const { status } = await Contacts.requestPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant permission to access your contacts.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Present contact picker
            const result = await Contacts.presentContactPickerAsync();
            
            if (result && result.phoneNumbers && result.phoneNumbers.length > 0) {
                // Get the first phone number and clean it
                let phoneNumber = result.phoneNumbers[0].number;
                
                // Remove all non-numeric characters
                phoneNumber = phoneNumber.replace(/\D/g, '');
                
                // Handle different phone number formats
                // If it starts with country code (e.g., +234 or 234), remove it
                if (phoneNumber.startsWith('234') && phoneNumber.length > 11) {
                    phoneNumber = '0' + phoneNumber.substring(3);
                } else if (phoneNumber.length === 10 && !phoneNumber.startsWith('0')) {
                    // If it's 10 digits without leading 0, add it
                    phoneNumber = '0' + phoneNumber;
                }
                
                // Ensure it's 11 digits
                if (phoneNumber.length === 11) {
                    onPhoneNumberChange(phoneNumber);
                } else {
                    Alert.alert(
                        'Invalid Phone Number',
                        'Please select a valid Nigerian phone number.',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            console.error('Error picking contact:', error);
            Alert.alert(
                'Error',
                'Failed to access contacts. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <>
            <View style={[styles.container, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                {/* Network Selector */}
                <TouchableOpacity
                    style={styles.networkButton}
                    onPress={() => setShowNetworkModal(true)}
                >
                    {selectedNetwork ? (
                        <View style={styles.networkIcon}>
                            <Image
                                source={NETWORK_IMAGES[selectedNetwork.id]}
                                style={styles.networkImage}
                                resizeMode="contain"
                            />
                        </View>
                    ) : (
                        <View style={[styles.networkIcon, { backgroundColor: colors.icon + '30' }]}>
                            <Ionicons name="business-outline" size={16} color={colors.icon} />
                        </View>
                    )}
                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                </TouchableOpacity>

                {/* Phone Number Input */}
                <TextInput
                    placeholder="Phone Number"
                    placeholderTextColor={colors.icon}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    maxLength={11}
                    style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                />

                {/* Contact Button */}
                <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={handleContactPicker}
                    activeOpacity={0.7}
                >
                    <Ionicons name="person-add-outline" size={24} color={colors.icon} />
                </TouchableOpacity>
            </View>

            {/* Beneficiary Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <ScrollView 
                        style={styles.suggestionsList}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                    >
                        {suggestions.slice(0, 3).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.suggestionItem, { borderBottomColor: isDark ? '#2a2a2a' : '#e0e0e0' }]}
                                onPress={() => handleSelectSuggestion(item)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.suggestionAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="person" size={16} color={colors.primary} />
                                </View>
                                <View style={styles.suggestionDetails}>
                                    <Text style={[styles.suggestionName, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.suggestionPhone, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        {item.phoneNumber} • {item.network}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {suggestions.length > 3 && onViewAllBeneficiaries && (
                        <TouchableOpacity
                            style={[styles.viewAllButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                setShowSuggestions(false);
                                onViewAllBeneficiaries();
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.viewAllText, { fontFamily: fonts.inter.semiBold }]}>
                                View All ({suggestions.length})
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Network Modal */}
            <Modal
                visible={showNetworkModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNetworkModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Select Network
                        </Text>
                        {networks.map((network) => (
                            <TouchableOpacity
                                key={network.id}
                                style={[
                                    styles.networkOption,
                                    { borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0' }
                                ]}
                                onPress={() => {
                                    onNetworkSelect(network);
                                    setShowNetworkModal(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.networkOptionLeft}>
                                    <View style={styles.networkIconLarge}>
                                        <Image
                                            source={NETWORK_IMAGES[network.id]}
                                            style={styles.networkImageLarge}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={[styles.networkOptionText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        {network.name}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    networkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    networkIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    networkImage: {
        width: 32,
        height: 32,
    },
    input: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 4,
    },
    contactButton: {
        padding: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    networkOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    networkOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    networkIconLarge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    networkImageLarge: {
        width: 40,
        height: 40,
    },
    networkOptionText: {
        fontSize: 15,
    },
    suggestionsContainer: {
        marginHorizontal: 20,
        marginTop: -12,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderBottomWidth: 1,
    },
    suggestionAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionDetails: {
        flex: 1,
    },
    suggestionName: {
        fontSize: 14,
        marginBottom: 2,
    },
    suggestionPhone: {
        fontSize: 12,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    viewAllText: {
        fontSize: 14,
        color: '#fff',
    },
});
