import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const ServicesContext = createContext();

export function ServicesProvider({ children }) {
    const [services, setServices] = useState({
        networks: [],
        airtimes: [],
        dataPlans: [],
        cableProviders: [],
        cablePlans: [],
        electricityTokens: [],
        examPins: [],
        airtimePinPlans: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    const CACHE_KEY = '@services_data';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    useEffect(() => {
        loadCachedData();
    }, []);

    const loadCachedData = async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                setServices(data);
                setLastFetch(timestamp);

                // Fetch fresh data if cache is old
                if (Date.now() - timestamp > CACHE_DURATION) {
                    fetchPricing();
                }
            } else {
                fetchPricing();
            }
        } catch (err) {
            console.error('Error loading cached data:', err);
            fetchPricing();
        }
    };

    const fetchPricing = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await api.get('/pricing');
            
            setServices({
                networks: data.networks || [],
                airtimes: data.airtimes || [],
                dataPlans: data.dataPlans || [],
                cableProviders: data.cableProviders || [],
                cablePlans: data.cablePlans || [],
                electricityTokens: data.electricityTokens || [],
                examPins: data.examPins || [],
                airtimePinPlans: data.airtimePinPlans || []
            });

            const timestamp = Date.now();
            setLastFetch(timestamp);

            // Cache the data
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                data: {
                    networks: data.networks || [],
                    airtimes: data.airtimes || [],
                    dataPlans: data.dataPlans || [],
                    cableProviders: data.cableProviders || [],
                    cablePlans: data.cablePlans || [],
                    electricityTokens: data.electricityTokens || [],
                    examPins: data.examPins || [],
                    airtimePinPlans: data.airtimePinPlans || []
                },
                timestamp
            }));

        } catch (err) {
            console.error('Error fetching pricing:', err);
            setError(err.message || 'Failed to fetch pricing data');
        } finally {
            setLoading(false);
        }
    };

    const getDataPlansByNetwork = (networkName) => {
        return services.dataPlans.filter(
            plan => plan.network.toLowerCase() === networkName.toLowerCase() && plan.status === 'On'
        );
    };

    const getCablePlansByProvider = (providerName) => {
        return services.cablePlans.filter(
            plan => plan.cable.toLowerCase() === providerName.toLowerCase() && plan.status === 'On'
        );
    };

    const getAirtimeByNetwork = (networkName) => {
        return services.airtimes.find(
            airtime => airtime.network.toLowerCase() === networkName.toLowerCase() && airtime.status === 'On'
        );
    };

    const refreshPricing = () => {
        return fetchPricing();
    };

    // New API methods for data services
    const fetchDataNetworks = async () => {
        try {
            const data = await api.get('/get-data-networks');
            return data.filter(network => network.status === 'On' && network.data === 'On');
        } catch (err) {
            console.error('Error fetching data networks:', err);
            throw err;
        }
    };

    const fetchDataTypes = async (networkName) => {
        try {
            const data = await api.get(`/get-data-types/${networkName}`);
            return data;
        } catch (err) {
            console.error('Error fetching data types:', err);
            throw err;
        }
    };

    const fetchDataPlans = async (networkName, dataType) => {
        try {
            const data = await api.get(`/get-data-plans/${networkName}/${dataType}`);
            return data.filter(plan => plan.status === 'On');
        } catch (err) {
            console.error('Error fetching data plans:', err);
            throw err;
        }
    };

    const purchaseData = async (network, type, planId, phone, amount, pin) => {
        try {
            const response = await api.post('/purchase', {
                network,
                type,
                plan: planId,
                phone,
                amount,
                pin,
                service: 'data'
            });
            
            // Check if the response indicates failure
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing data:', err);
            throw err;
        }
    };

    // Airtime API methods
    const fetchAirtimeNetworks = async () => {
        try {
            const data = await api.get('/get-airtime-networks');
            return data.filter(network => network.status === 'On' && network.airtime === 'On');
        } catch (err) {
            console.error('Error fetching airtime networks:', err);
            throw err;
        }
    };

    const fetchAirtimeTypes = async () => {
        try {
            const data = await api.get('/get-airtime-type');
            return data;
        } catch (err) {
            console.error('Error fetching airtime types:', err);
            throw err;
        }
    };

    const purchaseAirtime = async (network, type, amount, phone, pin) => {
        try {
            const response = await api.post('/purchase', {
                network,
                type,
                amount,
                phone,
                pin,
                service: 'airtime'
            });
            
            // Check if the response indicates failure
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing airtime:', err);
            throw err;
        }
    };

    // Cable TV API methods
    const fetchCableProviders = async () => {
        try {
            const data = await api.get('/get-cable');
            return data.filter(provider => provider.status === 'On');
        } catch (err) {
            console.error('Error fetching cable providers:', err);
            throw err;
        }
    };

    const fetchCablePlans = async (providerName) => {
        try {
            const data = await api.get(`/get-cable-plan/${providerName}`);
            return data.filter(plan => plan.status === 'On');
        } catch (err) {
            console.error('Error fetching cable plans:', err);
            throw err;
        }
    };

    const validateCable = async (provider, icu) => {
        try {
            const response = await api.post('/validate-cable', {
                provider,
                icu
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Validation failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error validating cable:', err);
            throw err;
        }
    };

    const purchaseCable = async (provider, planName, icu, pin, amount) => {
        try {
            const response = await api.post('/purchase', {
                provider,
                plan: planName, // Send plan name (e.g., "GOtv Smallie - monthly N1900")
                icu,
                pin,
                price: amount,
                amount: amount,
                service: 'cable'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing cable:', err);
            throw err;
        }
    };

    // Electricity API methods
    const fetchElectricityProviders = async () => {
        try {
            const data = await api.get('/get-electricity');
            return data.filter(provider => provider.status === 'On');
        } catch (err) {
            console.error('Error fetching electricity providers:', err);
            throw err;
        }
    };

    const validateElectricity = async (providerId, type, meter) => {
        try {
            const response = await api.post('/validate-electricity', {
                provider: providerId,
                type,
                meter
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Validation failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error validating electricity:', err);
            throw err;
        }
    };

    const purchaseElectricity = async (providerId, type, meter, amount, pin, phone) => {
        try {
            const response = await api.post('/purchase', {
                provider: providerId,
                type,
                meter,
                amount,
                pin,
                phone,
                service: 'electricity'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing electricity:', err);
            throw err;
        }
    };

    // Education/Exam API methods
    const fetchExamTypes = async () => {
        try {
            const data = await api.get('/get-exam-types');
            return data.filter(exam => exam.status === 'On');
        } catch (err) {
            console.error('Error fetching exam types:', err);
            throw err;
        }
    };

    const purchaseExam = async (planId, quantity, amount, pin) => {
        try {
            const response = await api.post('/purchase', {
                plan: planId,
                quantity,
                amount,
                pin,
                service: 'exam'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing exam:', err);
            throw err;
        }
    };

    return (
        <ServicesContext.Provider value={{
            services,
            loading,
            error,
            lastFetch,
            getDataPlansByNetwork,
            getCablePlansByProvider,
            getAirtimeByNetwork,
            refreshPricing,
            fetchDataNetworks,
            fetchDataTypes,
            fetchDataPlans,
            purchaseData,
            fetchAirtimeNetworks,
            fetchAirtimeTypes,
            purchaseAirtime,
            fetchCableProviders,
            fetchCablePlans,
            validateCable,
            purchaseCable,
            fetchElectricityProviders,
            validateElectricity,
            purchaseElectricity,
            fetchExamTypes,
            purchaseExam
        }}>
            {children}
        </ServicesContext.Provider>
    );
}

export const useServices = () => {
    const context = useContext(ServicesContext);
    if (!context) {
        throw new Error('useServices must be used within ServicesProvider');
    }
    return context;
};
