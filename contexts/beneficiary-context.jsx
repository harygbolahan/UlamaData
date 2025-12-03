import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './toast-context';

const BeneficiaryContext = createContext();

// Helper function to detect network from phone number prefix
const detectNetwork = (phoneNumber) => {
    const prefix = phoneNumber.substring(0, 4);
    const mtnPrefixes = ['0702', '0704', '0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0707'];
    const airtelPrefixes = ['0802', '0808', '0708', '0812', '0701', '0901', '0902', '0907', '0912', '0911'];
    const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
    const nineMobilePrefixes = ['0809', '0818', '0817', '0908', '0909'];

    if (mtnPrefixes.includes(prefix)) return 'MTN';
    if (airtelPrefixes.includes(prefix)) return 'AIRTEL';
    if (gloPrefixes.includes(prefix)) return 'GLO';
    if (nineMobilePrefixes.includes(prefix)) return '9MOBILE';
    return 'UNKNOWN';
};

export function BeneficiaryProvider({ children }) {
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const CACHE_KEY = '@beneficiaries_data';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        loadBeneficiaries();
    }, []);

    const loadBeneficiaries = async () => {
        setLoading(true);
        setError(null);

        try {
            // Try to load from cache first
            const cached = await AsyncStorage.getItem(CACHE_KEY);
                            console.log('Cache Beneficiaries 1, ', cached);

            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                setBeneficiaries(data);

                // Fetch fresh data if cache is old
                if (Date.now() - timestamp > CACHE_DURATION) {
                    fetchBeneficiaries();
                } else {
                    setLoading(false);
                }
            } else {
                await fetchBeneficiaries();
            }
        } catch (err) {
            console.error('Error loading beneficiaries:', err);
            setError(err.message);
            setLoading(false);
        }
    };

        console.log('Beneficiaries, ', beneficiaries);

    

    const fetchBeneficiaries = async () => {
        try {
            const data = await api.get('/get-beneficiaries');
            
            // Transform API response to match our format
            const transformedData = data.map(item => ({
                id: item.id,
                phoneNumber: item.phone,
                name: item.name,
                network: detectNetwork(item.phone),
                type: item.type || 'topup', // topup, cable, electricity
                addedAt: new Date().toISOString()
            }));

            setBeneficiaries(transformedData);

            // Cache the data
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                data: transformedData,
                timestamp: Date.now()
            }));

            console.log('Beneficiaries, ', transformedData);
            

            setLoading(false);
        } catch (err) {
            console.error('Error fetching beneficiaries:', err);
            setError(err.message || 'Failed to fetch beneficiaries');
            setLoading(false);
        }
    };

    const addBeneficiary = async (phoneNumber, name = null, type = 'topup') => {
        try {
            const response = await api.post('/add-beneficiary', {
                name: name || phoneNumber,
                phone: phoneNumber,
                type: type // topup, cable, electricity
            });

            if (response.status === 'success') {
                showToast('success', response.message || 'Beneficiary added successfully');
                // Refresh the list
                await fetchBeneficiaries();
                return { success: true };
            }

            return { success: false, message: response.message };
        } catch (err) {
            console.error('Error adding beneficiary:', err);
            showToast('error', err.message || 'Failed to add beneficiary');
            return { success: false, message: err.message };
        }
    };

    const removeBeneficiary = async (phoneNumber) => {
        try {
            const response = await api.delete(`/delete-beneficiary/${phoneNumber}`);

            if (response.status === 'success') {
                showToast('success', response.message || 'Beneficiary deleted successfully');
                // Update local state
                setBeneficiaries(prev => prev.filter(b => b.phoneNumber !== phoneNumber));
                
                // Update cache
                const updated = beneficiaries.filter(b => b.phoneNumber !== phoneNumber);
                await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: updated,
                    timestamp: Date.now()
                }));
                
                return { success: true };
            }

            return { success: false, message: response.message };
        } catch (err) {
            console.error('Error removing beneficiary:', err);
            showToast('error', err.message || 'Failed to delete beneficiary');
            return { success: false, message: err.message };
        }
    };

    const searchBeneficiaries = (query, type = null) => {
        let filtered = beneficiaries;
        
        // Filter by type if specified
        if (type) {
            filtered = filtered.filter(b => b.type === type);
        }
        
        // Filter by search query
        if (!query) return filtered;
        const lowerQuery = query.toLowerCase();
        return filtered.filter(b =>
            b.phoneNumber.includes(query) ||
            b.name.toLowerCase().includes(lowerQuery) ||
            b.network.toLowerCase().includes(lowerQuery)
        );
    };

    const getBeneficiariesByType = (type) => {
        return beneficiaries.filter(b => b.type === type);
    };

    const refreshBeneficiaries = () => {
        return fetchBeneficiaries();
    };

    return (
        <BeneficiaryContext.Provider value={{
            beneficiaries,
            loading,
            error,
            addBeneficiary,
            removeBeneficiary,
            searchBeneficiaries,
            getBeneficiariesByType,
            refreshBeneficiaries,
        }}>
            {children}
        </BeneficiaryContext.Provider>
    );
}

export function useBeneficiaries() {
    const context = useContext(BeneficiaryContext);
    if (!context) {
        throw new Error('useBeneficiaries must be used within BeneficiaryProvider');
    }
    return context;
}
