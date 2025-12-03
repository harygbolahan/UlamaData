import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
    const [paymentSettings, setPaymentSettings] = useState({
        auto: 'off',
        manual: 'off',
        onetime: 'off',
        card: 'off',
        coupon: 'off'
    });
    const [accountDetails, setAccountDetails] = useState({
        virtual_accounts: {},
        onetime_accounts: {},
        manual_accounts: {}
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    const CACHE_KEY = '@payment_data';
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    useEffect(() => {
        loadCachedData();
    }, []);

    const loadCachedData = async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const { settings, accounts, timestamp } = JSON.parse(cached);
                setPaymentSettings(settings);
                setAccountDetails(accounts);
                setLastFetch(timestamp);

                if (Date.now() - timestamp > CACHE_DURATION) {
                    fetchPaymentData();
                }
            } else {
                fetchPaymentData();
            }
        } catch (err) {
            console.error('Error loading cached payment data:', err);
            fetchPaymentData();
        }
    };

    const fetchPaymentData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [settings, accounts] = await Promise.all([
                api.get('/payment-settings'),
                api.get('/get-account-details')
            ]);

            setPaymentSettings(settings);
            setAccountDetails(accounts);

            const timestamp = Date.now();
            setLastFetch(timestamp);

            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                settings,
                accounts,
                timestamp
            }));

        } catch (err) {
            console.error('Error fetching payment data:', err);
            setError(err.message || 'Failed to fetch payment data');
        } finally {
            setLoading(false);
        }
    };

    const applyCoupon = async (couponCode) => {
        try {
            const response = await api.post('/coupon-payment', {
                coupon_code: couponCode
            });
            return response;
        } catch (err) {
            console.error('Error applying coupon:', err);
            throw err;
        }
    };

    const submitManualPayment = async (amount, selectedAccount, accountName, paymentMethod, date) => {
        try {
            const response = await api.post('/manual-payment', {
                amount,
                selectedAccount,
                accountName,
                paymentMethod,
                date
            });
            return response;
        } catch (err) {
            console.error('Error submitting manual payment:', err);
            throw err;
        }
    };

    const initiateCardPayment = async (amount) => {
        try {
            const response = await api.post('/card-payment', {
                amount
            });
            return response;
        } catch (err) {
            console.error('Error initiating card payment:', err);
            throw err;
        }
    };

    const generateAccount = async (accountType) => {
        try {
            const response = await api.post('/generate-account', {
                accountType
            });
            
            // If account number is in response, update state immediately
            if (response.accountNumber) {
                // Determine if it's virtual or onetime account
                const isOnetime = accountType.toLowerCase().includes('onetime');
                
                // Only cache virtual accounts, not one-time accounts
                if (!isOnetime) {
                    const accountKey = 'virtual_accounts';
                    
                    // Create updated accounts object
                    const updatedAccounts = {
                        ...accountDetails,
                        [accountKey]: {
                            ...accountDetails[accountKey],
                            [accountType]: {
                                ...accountDetails[accountKey]?.[accountType],
                                number: response.accountNumber
                            }
                        }
                    };
                    
                    // Update state
                    setAccountDetails(updatedAccounts);
                    
                    // Update cache
                    const timestamp = Date.now();
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                        settings: paymentSettings,
                        accounts: updatedAccounts,
                        timestamp
                    }));
                }
            }
            
            return response;
        } catch (err) {
            console.error('Error generating account:', err);
            throw err;
        }
    };

    const getAvailablePaymentMethods = () => {
        const methods = [];
        
        if (paymentSettings.auto === 'on') {
            methods.push({
                id: 'auto',
                name: 'Auto Funding',
                icon: 'flash',
                color: '#10B981',
                description: 'Instant virtual account transfer'
            });
        }
        
        if (paymentSettings.manual === 'on') {
            methods.push({
                id: 'manual',
                name: 'Manual Transfer',
                icon: 'swap-horizontal',
                color: '#3B82F6',
                description: 'Transfer to our bank account'
            });
        }
        
        if (paymentSettings.onetime === 'on') {
            methods.push({
                id: 'onetime',
                name: 'One-Time Account',
                icon: 'time',
                color: '#F59E0B',
                description: 'Generate temporary account'
            });
        }
        
        if (paymentSettings.card === 'on') {
            methods.push({
                id: 'card',
                name: 'Card Payment',
                icon: 'card',
                color: '#8B5CF6',
                description: 'Pay with debit/credit card'
            });
        }
        
        if (paymentSettings.coupon === 'on') {
            methods.push({
                id: 'coupon',
                name: 'Coupon Code',
                icon: 'pricetag',
                color: '#EC4899',
                description: 'Redeem coupon code'
            });
        }
        
        return methods;
    };

    const refreshPaymentData = () => {
        return fetchPaymentData();
    };

    // Funds Transfer methods (not cached - real-time operations)
    const getBanks = async () => {
        try {
            const response = await api.get('/get-banks');
            return response;
        } catch (err) {
            console.error('Error fetching banks:', err);
            throw err;
        }
    };

    const getTransferCharge = async () => {
        try {
            const response = await api.get('/get-transfer-charge');
            return response;
        } catch (err) {
            console.error('Error fetching transfer charge:', err);
            throw err;
        }
    };

    const validateAccount = async (bank, accountNumber) => {
        try {
            const response = await api.post('/validate-account', {
                bank,
                accountNumber
            });
            return response;
        } catch (err) {
            console.error('Error validating account:', err);
            throw err;
        }
    };

    const transferFunds = async (bank, amount, accountNumber, source, pin) => {
        try {
            const response = await api.post('/fund-transfer', {
                bank,
                amount,
                accountNumber,
                source,
                pin
            });
            return response;
        } catch (err) {
            console.error('Error transferring funds:', err);
            throw err;
        }
    };

    return (
        <PaymentContext.Provider value={{
            paymentSettings,
            accountDetails,
            loading,
            error,
            lastFetch,
            applyCoupon,
            submitManualPayment,
            initiateCardPayment,
            generateAccount,
            getAvailablePaymentMethods,
            refreshPaymentData,
            getBanks,
            getTransferCharge,
            validateAccount,
            transferFunds
        }}>
            {children}
        </PaymentContext.Provider>
    );
}

export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within PaymentProvider');
    }
    return context;
};
