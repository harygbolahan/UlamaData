import { useTheme } from '@/contexts/theme-context';
import { StyleSheet, View } from 'react-native';

export default function Card({ children, style }) {
    const { colors } = useTheme();

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.isDark ? '#1f1f1f' : '#f5f5f5',
            },
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
});
