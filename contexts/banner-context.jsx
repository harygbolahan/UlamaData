import api from '@/services/api';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

const BannerContext = createContext(null);

const BANNER_STORAGE_KEY = 'banner_ads_data';
const BASE_URL = 'https://databeta.com.ng';

export function BannerProvider({ children }) {
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            // Try to load cached banners first
            const cachedBanners = await SecureStore.getItemAsync(BANNER_STORAGE_KEY);
            if (cachedBanners) {
                setBanners(JSON.parse(cachedBanners));
            }

            // Fetch fresh banners from API
            const response = await api.getBanners();
            
            if (response) {
                const bannerArray = [];
                const status = response.status || 'inactive';
                
                // Convert response to array format
                if (response.ads1) {
                    bannerArray.push({
                        id: '1',
                        imageUrl: `${BASE_URL}${response.ads1}`,
                        status,
                    });
                }
                if (response.ads2) {
                    bannerArray.push({
                        id: '2',
                        imageUrl: `${BASE_URL}${response.ads2}`,
                        status,
                    });
                }
                if (response.ads3) {
                    bannerArray.push({
                        id: '3',
                        imageUrl: `${BASE_URL}${response.ads3}`,
                        status,
                    });
                }
                
                setBanners(bannerArray);
                
                // Cache banner data
                await SecureStore.setItemAsync(BANNER_STORAGE_KEY, JSON.stringify(bannerArray));
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            // Continue with cached or empty banners
        } finally {
            setIsLoading(false);
        }
    };

    const refreshBanners = async () => {
        setIsLoading(true);
        await fetchBanners();
    };

    return (
        <BannerContext.Provider value={{
            banners,
            isLoading,
            refreshBanners,
        }}>
            {children}
        </BannerContext.Provider>
    );
}

export function useBanners() {
    const context = useContext(BannerContext);
    if (!context) {
        throw new Error('useBanners must be used within BannerProvider');
    }
    return context;
}
