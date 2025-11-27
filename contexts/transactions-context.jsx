import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState } from 'react';

const TransactionsContext = createContext();

export function TransactionsProvider({ children }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10
    });

    const CACHE_KEY = '@transactions_cache';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchTransactions = async (page = 1, search = '', date = '') => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (date) params.append('date', date);
            params.append('page', page.toString());

            const response = await api.get(`/get-transactions?${params.toString()}`);

            // If page 1, replace transactions. Otherwise, append
            if (page === 1) {
                setTransactions(response.data || []);
            } else {
                setTransactions(prev => [...prev, ...(response.data || [])]);
            }

            setPagination({
                currentPage: response.current_page || 1,
                lastPage: response.last_page || 1,
                total: response.total || 0,
                perPage: response.per_page || 10
            });

            // Cache the first page results
            if (page === 1 && !search && !date) {
                await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: response.data,
                    timestamp: Date.now()
                }));
            }

            return response;
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err.message || 'Failed to fetch transactions');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionDetails = async (transactionRef, date = '') => {
        setLoading(true);
        setError(null);

        try {
            const params = date ? `?date=${date}` : '';
            const response = await api.get(`/get-transaction-details/${transactionRef}${params}`);
            return response;
        } catch (err) {
            console.error('Error fetching transaction details:', err);
            setError(err.message || 'Failed to fetch transaction details');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const loadCachedTransactions = async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    setTransactions(data);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('Error loading cached transactions:', err);
            return false;
        }
    };

    const refreshTransactions = () => {
        return fetchTransactions(1);
    };

    return (
        <TransactionsContext.Provider value={{
            transactions,
            loading,
            error,
            pagination,
            fetchTransactions,
            fetchTransactionDetails,
            loadCachedTransactions,
            refreshTransactions
        }}>
            {children}
        </TransactionsContext.Provider>
    );
}

export const useTransactions = () => {
    const context = useContext(TransactionsContext);
    if (!context) {
        throw new Error('useTransactions must be used within TransactionsProvider');
    }
    return context;
};
