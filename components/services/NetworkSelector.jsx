import { useBeneficiaries } from '@/contexts/beneficiary-context';
import { useTheme } from '@/contexts/theme-context';
import { detectNetwork } from '@/services/network-detection';
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

const CARD_NETWORK_BACKGROUNDS = {
    mtn: 'rgba(255, 204, 0, 0.2)',
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
    mode = 'dropdown',
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

    const getCardBackground = (networkId, networkName) => {
        if (customBackgrounds) return getBackground(networkId, networkName);
        if (!networkId && !networkName) return 'rgba(128, 128, 128, 0.2)';
        const lowerCaseId = networkId?.toLowerCase();
        const lowerCaseName = networkName?.toLowerCase();
        return CARD_NETWORK_BACKGROUNDS[networkId] || CARD_NETWORK_BACKGROUNDS[lowerCaseId] || CARD_NETWORK_BACKGROUNDS[networkName] || CARD_NETWORK_BACKGROUNDS[lowerCaseName] || 'rgba(128, 128, 128, 0.2)';
    };
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Set MTN as default network on mount if no network is selected
    useEffect(() => {
        if (!selectedNetwork) {
            const mtnNetwork = networks.find(n => n.id === 'mtn');
            if (mtnNetwork && onNetworkSelect) {
                onNetworkSelect(mtnNetwork);
            }
        }
    }, []);

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

        // Switch to the matching network as soon as the prefix is typed or pasted.
        // Cable and electricity reuse this component for smartcard / meter numbers, so skip them.
        if (beneficiaryType !== 'topup' || !onNetworkSelect) return;
        const detected = detectNetwork(text);
        if (detected === 'UNKNOWN' || selectedNetwork?.name?.toUpperCase() === detected) return;
        const match = networks.find(n => n.name.toUpperCase() === detected);
        if (match) onNetworkSelect(match);
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
                    handlePhoneNumberChange(phoneNumber);
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

    const isCardsMode = mode === 'cards';
    const networkTitle = beneficiaryType === 'cable' ? 'Select Provider' : 'Select Network';

    return (
        <>
            {isCardsMode ? (
                <>
                    {showNetworkButton && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {networkTitle}
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.networkList}
                            >
                                {networks.map((network) => {
                                    const isSelected = selectedNetwork?.id === network.id;

                                    return (
                                        <TouchableOpacity
                                            key={network.id}
                                            style={[
                                                styles.networkCard,
                                                { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' },
                                                isSelected && (isDark ? {
                                                    backgroundColor: colors.primary,
                                                    borderColor: colors.primary,
                                                    borderWidth: 2,
                                                } : {
                                                    backgroundColor: colors.primary + '20',
                                                    borderColor: colors.primary,
                                                    borderWidth: 2,
                                                }),
                                            ]}
                                            onPress={() => onNetworkSelect?.(network)}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    styles.networkLogoContainer,
                                                    { backgroundColor: getCardBackground(network.id, network.name) },
                                                ]}
                                            >
                                                {getImage(network.id, network.name) ? (
                                                    <Image
                                                        source={getImage(network.id, network.name)}
                                                        style={styles.networkLogo}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <Ionicons name="business-outline" size={16} color={colors.icon} />
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.networkName,
                                                    { fontFamily: fonts.inter.semiBold },
                                                    isSelected 
                                                        ? (isDark ? { color: colors.apiTextColor || '#fff' } : { color: colors.primary }) 
                                                        : { color: colors.text },
                                                ]}
                                            >
                                                {network.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    <View style={[styles.container, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <TextInput
                            placeholder={beneficiaryType === 'electricity' ? 'Meter Number' : beneficiaryType === 'cable' ? 'Smart Card Number' : 'Phone Number'}
                            placeholderTextColor={colors.icon}
                            value={phoneNumber}
                            onChangeText={handlePhoneNumberChange}
                            keyboardType={beneficiaryType === 'topup' ? 'phone-pad' : 'numeric'}
                            maxLength={beneficiaryType === 'topup' ? 11 : undefined}
                            style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                        />

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
                </>
            ) : (
                <View style={[styles.container, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
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

                    <TextInput
                        placeholder={beneficiaryType === 'electricity' ? 'Meter Number' : beneficiaryType === 'cable' ? 'Smart Card Number' : 'Phone Number'}
                        placeholderTextColor={colors.icon}
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType={beneficiaryType === 'topup' ? 'phone-pad' : 'numeric'}
                        maxLength={beneficiaryType === 'topup' ? 11 : undefined}
                        style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                    />

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
            )}

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
                                <View style={[
                                    styles.suggestionAvatar, 
                                    isDark 
                                        ? { backgroundColor: colors.primary } 
                                        : { backgroundColor: colors.primary + '20' }
                                ]}>
                                    <Ionicons 
                                        name="person" 
                                        size={16} 
                                        color={isDark ? (colors.apiTextColor || '#fff') : colors.primary} 
                                    />
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
            {!isCardsMode && showNetworkButton && (
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
                                {networkTitle}
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
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    networkList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    networkCard: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 70,
        alignItems: 'center',
        gap: 6,
    },
    networkLogoContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    networkLogo: {
        width: 32,
        height: 32,
    },
    networkName: {
        fontSize: 12,
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
