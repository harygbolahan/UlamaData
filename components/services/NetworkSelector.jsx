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

const NETWORK_BACKGROUNDS = {
    mtn: 'rgba(255, 204, 0, 0.9)',
    airtel: 'rgba(255, 0, 0, 0.2)',
    '9mobile': 'rgba(0, 166, 90, 0.2)',
    glo: 'rgba(0, 168, 89, 0.2)',
};

export default function NetworkSelector({
    selectedNetwork,
    onNetworkSelect,
    phoneNumber,
    onPhoneNumberChange,
    onViewAllBeneficiaries,
    onSelectBeneficiary,
    beneficiaryType = 'topup', // topup, cable, electricity
    networks = [
        { id: 'mtn', name: 'MTN', color: '#FFCC00' },
        { id: 'airtel', name: 'AIRTEL', color: '#FF0000' },
        { id: '9mobile', name: '9MOBILE', color: '#00A65A' },
        { id: 'glo', name: 'GLO', color: '#00A859' },
    ],
    customImages = null, // Custom images for cable/electricity providers
    customBackgrounds = null // Custom backgrounds for cable/electricity providers
}) {
    const { colors, fonts, isDark } = useTheme();
    const { searchBeneficiaries } = useBeneficiaries();
    
    // Use custom images/backgrounds if provided, otherwise use default network images
    const imageSource = customImages || NETWORK_IMAGES;
    const backgroundSource = customBackgrounds || NETWORK_BACKGROUNDS;
    
    // Helper function to get image/background with fallback
    const getImage = (networkId, networkName) => {
        if (!networkId && !networkName) return null;
        const lowerCaseId = networkId?.toLowerCase();
        const lowerCaseName = networkName?.toLowerCase();
        return imageSource[networkId] || imageSource[lowerCaseId] || imageSource[networkName] || imageSource[lowerCaseName];
    };
    
    const getBackground = (networkId, networkName) => {
        if (!networkId && !networkName) return 'rgba(128, 128, 128, 0.2)';
        const lowerCaseId = networkId?.toLowerCase();
        const lowerCaseName = networkName?.toLowerCase();
        return backgroundSource[networkId] || backgroundSource[lowerCaseId] || backgroundSource[networkName] || backgroundSource[lowerCaseName] || 'rgba(128, 128, 128, 0.2)';
    };
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Network detection based on Nigerian phone number prefixes
    const detectNetwork = (number) => {
        if (!number || number.length < 4) return null;
        
        const prefix = number.substring(0, 4);
        
        // MTN prefixes: 0803, 0806, 0810, 0813, 0814, 0816, 0903, 0906, 0913, 0916
        if (['0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'].includes(prefix)) {
            return networks.find(n => n.id === 'mtn' || n.name.toLowerCase() === 'mtn');
        }
        
        // Airtel prefixes: 0802, 0808, 0812, 0901, 0902, 0904, 0907, 0912
        if (['0802', '0808', '0812', '0901', '0902', '0904', '0907', '0912'].includes(prefix)) {
            return networks.find(n => n.id === 'airtel' || n.name.toLowerCase() === 'airtel');
        }
        
        // Glo prefixes: 0805, 0807, 0811, 0815, 0905, 0915
        if (['0805', '0807', '0811', '0815', '0905', '0915'].includes(prefix)) {
            return networks.find(n => n.id === 'glo' || n.name.toLowerCase() === 'glo');
        }
        
        // 9mobile prefixes: 0809, 0817, 0818, 0909, 0908
        if (['0809', '0817', '0818', '0909', '0908'].includes(prefix)) {
            return networks.find(n => n.id === '9mobile' || n.name.toLowerCase() === '9mobile');
        }
        
        return null;
    };

    // Set MTN as default network on mount if no network is selected
    useEffect(() => {
        if (!selectedNetwork) {
            const mtnNetwork = networks.find(n => n.id === 'mtn');
            if (mtnNetwork && onNetworkSelect) {
                onNetworkSelect(mtnNetwork);
            }
        }
    }, []);

    // Auto-detect network when phone number changes (only for topup/phone numbers)
    useEffect(() => {
        if (beneficiaryType === 'topup' && phoneNumber.length >= 4) {
            const detectedNetwork = detectNetwork(phoneNumber);
            if (detectedNetwork && detectedNetwork.id !== selectedNetwork?.id) {
                onNetworkSelect(detectedNetwork);
            }
        }
    }, [phoneNumber, beneficiaryType]);

    useEffect(() => {
        if (phoneNumber.length > 0) {
            const matches = searchBeneficiaries(phoneNumber, beneficiaryType);
            setSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [phoneNumber, beneficiaryType]);

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

    const showNetworkButton = networks && networks.length > 0;

    return (
        <>
            <View style={[styles.container, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                {/* Network Selector - Only show if networks are provided */}
                {showNetworkButton && (
                    <TouchableOpacity
                        style={styles.networkButton}
                        onPress={() => setShowNetworkModal(true)}
                    >
                        {selectedNetwork ? (
                            <View style={[styles.networkIcon, { backgroundColor: getBackground(selectedNetwork.id, selectedNetwork.name) }]}>
                                {getImage(selectedNetwork.id, selectedNetwork.name) ? (
                                    <Image
                                        source={getImage(selectedNetwork.id, selectedNetwork.name)}
                                        style={styles.networkImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Ionicons name="business-outline" size={16} color={colors.icon} />
                                )}
                            </View>
                        ) : (
                            <View style={[styles.networkIcon, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}>
                                <Ionicons name="business-outline" size={16} color={colors.icon} />
                            </View>
                        )}
                        <Ionicons name="chevron-down" size={16} color={colors.icon} />
                    </TouchableOpacity>
                )}

                {/* Phone Number Input */}
                <TextInput
                    placeholder={beneficiaryType === 'electricity' ? 'Meter Number' : beneficiaryType === 'cable' ? 'Smart Card Number' : 'Phone Number'}
                    placeholderTextColor={colors.icon}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType={beneficiaryType === 'topup' ? 'phone-pad' : 'numeric'}
                    maxLength={beneficiaryType === 'topup' ? 11 : undefined}
                    style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                />

                {/* Contact Button - Only show for topup (phone numbers) */}
                {beneficiaryType === 'topup' && (
                    <TouchableOpacity 
                        style={styles.contactButton}
                        onPress={handleContactPicker}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-add-outline" size={24} color={colors.icon} />
                    </TouchableOpacity>
                )}
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
                                        {item.phoneNumber} • {item.type}
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

            {/* Network Modal - Only show if networks are provided */}
            {showNetworkButton && (
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
                                {beneficiaryType === 'cable' ? 'Select Provider' : 'Select Network'}
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
                                        <View style={[styles.networkIconLarge, { backgroundColor: getBackground(network.id, network.name) }]}>
                                            {getImage(network.id, network.name) ? (
                                                <Image
                                                    source={getImage(network.id, network.name)}
                                                    style={styles.networkImageLarge}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Ionicons name="business-outline" size={20} color={colors.icon} />
                                            )}
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
            )}
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
