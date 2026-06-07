import { Colors, Fonts } from '@/constants/theme';
import { useDashboard } from '@/contexts/dashboard-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [manualTheme, setManualTheme] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setManualTheme(savedTheme);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const colorScheme = manualTheme ?? 'light';
    const isDark = colorScheme === 'dark';

    const toggleTheme = async () => {
        const newTheme = isDark ? 'light' : 'dark';
        setManualTheme(newTheme);
        try {
            await AsyncStorage.setItem('theme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    // Get API theme colors from dashboard context
    const { themeData } = useDashboard();

    // Merge API colors with default theme colors
    const baseColors = Colors[colorScheme ?? 'light'];
    const apiColors = themeData ? {
        primary: themeData.bgColor || baseColors.primary,
        buttonColor: themeData.buttonColor || baseColors.primary,
        apiTextColor: themeData.textColor || '#ffffff',
    } : {};

    const theme = {
        colors: {
            ...baseColors,
            ...apiColors,
            isDark,
        },
        fonts: Fonts,
        isDark,
        colorScheme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
