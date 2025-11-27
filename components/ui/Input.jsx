import { useTheme } from '@/contexts/theme-context';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function Input({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, style, rightIcon, editable, maxLength }) {
    const { colors, fonts, isDark } = useTheme();

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={[styles.label, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                    {label}
                </Text>
            )}
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, {
                        color: colors.text,
                        backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                        fontFamily: fonts.inter.regular,
                        paddingRight: rightIcon ? 50 : 16
                    }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.icon}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={editable}
                    maxLength={maxLength}
                />
                {rightIcon && (
                    <View style={styles.rightIconContainer}>
                        {rightIcon}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    rightIconContainer: {
        position: 'absolute',
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
});
