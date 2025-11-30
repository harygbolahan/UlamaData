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

    // Bulk SMS API methods
    const purchaseBulkSMS = async (sender, subject, message, amount, bulkPhones, pin) => {
        try {
            const response = await api.post('/purchase', {
                sender,
                subject,
                message,
                amount,
                bulkPhones, // Comma-separated phone numbers
                pin,
                service: 'sms'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing bulk SMS:', err);
            throw err;
        }
    };

    // Data Pin API methods
    const fetchDataPinNetworks = async () => {
        try {
            const data = await api.get('/get-data-networks');
            return data.filter(network => network.status === 'On' && network.data === 'On');
        } catch (err) {
            console.error('Error fetching data pin networks:', err);
            throw err;
        }
    };

    const fetchDataPinTypes = async (networkName) => {
        try {
            const data = await api.get(`/get-datapin-types/${networkName}`);
            return data;
        } catch (err) {
            console.error('Error fetching data pin types:', err);
            throw err;
        }
    };

    const fetchDataPinPlans = async (networkName, dataType) => {
        try {
            const data = await api.get(`/get-data-plans/${networkName}/${dataType}`);
            return data.filter(plan => plan.status === 'On');
        } catch (err) {
            console.error('Error fetching data pin plans:', err);
            throw err;
        }
    };

    const purchaseDataPin = async (network, type, planDataSize, quantity, amount, pin) => {
        try {
            const response = await api.post('/purchase', {
                network,
                type,
                plan: planDataSize,
                quantity: quantity.toString(),
                amount: amount.toString(),
                businessname: 'Hundredkey',
                pin,
                service: 'datapin'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing data pin:', err);
            throw err;
        }
    };

    // Airtime Pin API methods
    const fetchAirtimePinNetworks = async () => {
        try {
            const data = await api.get('/get-airtime-networks');
            return data.filter(network => network.status === 'On' && network.airtime === 'On');
        } catch (err) {
            console.error('Error fetching airtime pin networks:', err);
            throw err;
        }
    };

    const fetchPinSizes = async (networkName) => {
        try {
            const data = await api.get(`/get-pin-sizes?network=${networkName.toLowerCase()}`);
            return data.filter(pin => pin.status === 'On');
        } catch (err) {
            console.error('Error fetching pin sizes:', err);
            throw err;
        }
    };

    const purchaseAirtimePin = async (network, pinSize, amount, quantity, pin) => {
        try {
            const response = await api.post('/purchase', {
                network,
                pinSize,
                amount: amount.toString(),
                quantity: quantity.toString(),
                businessName: 'Hundredkey',
                pin,
                service: 'airtimepin'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing airtime pin:', err);
            throw err;
        }
    };

    // Bulk Purchase API methods
    const purchaseBulkData = async (network, type, planId, amount, bulkPhones, pin) => {
        try {
            const response = await api.post('/bulk/purchase', {
                network,
                type,
                plan: planId,
                amount,
                bulkPhones,
                pin,
                sType: 'bulk',
                service: 'Data'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing bulk data:', err);
            throw err;
        }
    };

    const purchaseBulkAirtime = async (network, type, amount, bulkPhones, pin) => {
        try {
            const response = await api.post('/bulk/purchase', {
                network,
                type,
                amount,
                bulkPhones,
                pin,
                sType: 'bulk',
                service: 'Airtime'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error purchasing bulk airtime:', err);
            throw err;
        }
    };

    // Schedule Purchase API methods
    const scheduleDataPurchase = async (network, type, planId, amount, phone, pin, repeat, fullDateTime) => {
        try {
            const response = await api.post('/bulk/purchase', {
                network,
                type,
                plan: planId,
                amount,
                bulkPhones: phone,
                pin,
                sType: 'schedule',
                repeat,
                fullDateTime,
                service: 'Data'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error scheduling data purchase:', err);
            throw err;
        }
    };

    const scheduleAirtimePurchase = async (network, type, amount, phone, pin, repeat, fullDateTime) => {
        try {
            const response = await api.post('/bulk/purchase', {
                network,
                type,
                amount,
                bulkPhones: phone,
                pin,
                sType: 'schedule',
                repeat,
                fullDateTime,
                service: 'Airtime'
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error scheduling airtime purchase:', err);
            throw err;
        }
    };

    // Airtime Swap API methods
    const fetchSwapMethod = async () => {
        try {
            const data = await api.get('/a2c-method');
            return data;
        } catch (err) {
            console.error('Error fetching swap method:', err);
            throw err;
        }
    };

    const fetchSwapNetworks = async () => {
        try {
            const data = await api.get('/get-airtime-networks');
            return data.filter(network => network.status === 'On' && network.airtime === 'On');
        } catch (err) {
            console.error('Error fetching swap networks:', err);
            throw err;
        }
    };

    const fetchSwapDetails = async (networkName) => {
        try {
            const data = await api.get(`/swap-details?network=${networkName}`);
            return data;
        } catch (err) {
            console.error('Error fetching swap details:', err);
            throw err;
        }
    };

    const swapAirtimeManual = async (network, amount, quantity, senderNumber, pin) => {
        try {
            const response = await api.post('/swap-airtime', {
                network,
                amount,
                quantity,
                swap: 'manual',
                senderNumber,
                paymentMethod: 'wallet',
                pin
            });
            
            if (response.status === 'fail' || response.status === 'error') {
                throw {
                    message: response.message || 'Transaction failed',
                    status: response.status
                };
            }
            
            return response;
        } catch (err) {
            console.error('Error swapping airtime (manual):', err);
            throw err;
        }
    };

    const requestSwapOtp = async (networkId, senderNumber) => {
        try {
            const response = await api.post('/airtime2cash/otp', {
                network: networkId.toString(),
                senderNumber
            });
            
            if (response.status === false || response.code !== 200) {
                throw {
                    message: response.data?.message || 'Failed to send OTP',
                    status: 'error'
                };
            }
            
            return response.data;
        } catch (err) {
            console.error('Error requesting swap OTP:', err);
            throw err;
        }
    };

    const verifySwapOtp = async (identifier, otp) => {
        try {
            const response = await api.post('/airtime2cash/otp-verify', {
                identifier,
                otp
            });
            
            if (response.status === false || response.code !== 200) {
                throw {
                    message: response.data?.message || 'OTP verification failed',
                    status: 'error'
                };
            }
            
            return response.data;
        } catch (err) {
            console.error('Error verifying swap OTP:', err);
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
            purchaseExam,
            purchaseBulkSMS,
            fetchDataPinNetworks,
            fetchDataPinTypes,
            fetchDataPinPlans,
            purchaseDataPin,
            fetchAirtimePinNetworks,
            fetchPinSizes,
            purchaseAirtimePin,
            purchaseBulkData,
            purchaseBulkAirtime,
            scheduleDataPurchase,
            scheduleAirtimePurchase,
            fetchSwapMethod,
            fetchSwapNetworks,
            fetchSwapDetails,
            swapAirtimeManual,
            requestSwapOtp,
            verifySwapOtp
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
