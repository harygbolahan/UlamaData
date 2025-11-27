import { useTheme } from '@/contexts/theme-context';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', style, textStyle }) {
    const { fonts } = useTheme();

    const { colors } = useTheme();

    const getButtonStyle = () => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: colors.primary };
            case 'secondary':
                return { backgroundColor: colors.secondary };
            case 'outline':
                return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary };
            default:
                return { backgroundColor: colors.primary };
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'primary':
                return { color: '#fff' };
            case 'secondary':
                return { color: colors.primary };
            case 'outline':
                return { color: colors.primary };
            default:
                return { color: '#fff' };
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), style]}
            onPress={onPress}
        >
            <Text style={[styles.text, getTextStyle(), { fontFamily: fonts.inter.semiBold }, textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
    },
});
