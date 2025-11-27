import { useDashboard } from '@/contexts/dashboard-context';
import { useTheme } from '@/contexts/theme-context';

/**
 * Hook to get API-based theme colors with fallbacks
 * Returns colors from API if available, otherwise uses default theme colors
 */
export function useApiColors() {
    const { colors } = useTheme();
    const { themeData } = useDashboard();

    return {
        // Primary color from API (bg_color)
        primary: themeData?.bgColor || colors.primary,
        
        // Button color from API
        button: themeData?.buttonColor || colors.primary,
        
        // Text color for elements on primary background (from API)
        primaryText: themeData?.textColor || '#ffffff',
        
        // All other theme colors
        ...colors,
    };
}
