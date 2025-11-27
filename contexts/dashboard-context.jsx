import api from '@/services/api';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

const DashboardContext = createContext(null);

const STORAGE_KEY = 'user_dashboard_preference';
const THEME_STORAGE_KEY = 'user_theme_data';

export const DASHBOARD_TYPES = {
    DEFAULT: 'default',
    MODERN: 'modern',
    CLASSIC: 'classic',
    COMPACT: 'compact',
    MINIMAL: 'minimal',
};

export const DASHBOARD_INFO = {
    [DASHBOARD_TYPES.DEFAULT]: {
        name: 'Default',
        description: 'Balanced design with all features',
        icon: 'grid-outline',
    },
    [DASHBOARD_TYPES.MODERN]: {
        name: 'Modern',
        description: 'Sleek and contemporary layout',
        icon: 'sparkles-outline',
    },
    [DASHBOARD_TYPES.CLASSIC]: {
        name: 'Classic',
        description: 'Traditional and familiar design',
        icon: 'albums-outline',
    },
    [DASHBOARD_TYPES.COMPACT]: {
        name: 'Compact',
        description: 'Space-efficient compact layout',
        icon: 'phone-portrait-outline',
    },
    [DASHBOARD_TYPES.MINIMAL]: {
        name: 'Minimal',
        description: 'Clean and simple interface',
        icon: 'remove-outline',
    },
};

export function DashboardProvider({ children }) {
    const [selectedDashboard, setSelectedDashboard] = useState(DASHBOARD_TYPES.DEFAULT);
    const [themeData, setThemeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
        fetchTheme();
    }, []);

    const loadDashboard = async () => {
        try {
            const saved = await SecureStore.getItemAsync(STORAGE_KEY);
            if (saved && Object.values(DASHBOARD_TYPES).includes(saved)) {
                setSelectedDashboard(saved);
            }
        } catch (error) {
            console.error('Error loading dashboard preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTheme = async () => {
        try {
            // Try to load cached theme first
            const cachedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
            if (cachedTheme) {
                setThemeData(JSON.parse(cachedTheme));
            }

            // Fetch fresh theme from API
            const response = await api.getTheme();
            
            if (response) {
                const theme = {
                    style: response.style || 'default',
                    bgColor: response.bg_color || '#002db3',
                    textColor: response.text_color || '#ffffff',
                    buttonColor: response.button_color || '#002db3',
                };
                
                setThemeData(theme);
                
                // Update dashboard type if style is different
                if (theme.style && Object.values(DASHBOARD_TYPES).includes(theme.style)) {
                    setSelectedDashboard(theme.style);
                    await SecureStore.setItemAsync(STORAGE_KEY, theme.style);
                }
                
                // Cache theme data
                await SecureStore.setItemAsync(THEME_STORAGE_KEY, JSON.stringify(theme));
            }
        } catch (error) {
            console.error('Error fetching theme:', error);
            // Continue with cached or default theme
        }
    };

    const changeDashboard = async (dashboardType) => {
        if (!Object.values(DASHBOARD_TYPES).includes(dashboardType)) {
            console.error('Invalid dashboard type:', dashboardType);
            return;
        }

        setSelectedDashboard(dashboardType);
        try {
            await SecureStore.setItemAsync(STORAGE_KEY, dashboardType);
        } catch (error) {
            console.error('Error saving dashboard preference:', error);
        }
    };

    const refreshTheme = async () => {
        await fetchTheme();
    };

    return (
        <DashboardContext.Provider value={{
            selectedDashboard,
            changeDashboard,
            themeData,
            refreshTheme,
            isLoading,
            dashboardInfo: DASHBOARD_INFO,
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within DashboardProvider');
    }
    return context;
}
