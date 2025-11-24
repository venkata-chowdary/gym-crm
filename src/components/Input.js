import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

export default function Input({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    error,
    keyboardType,
    autoCapitalize = 'none',
    disabled = false,
    leftIcon,
    editable = true,
    ...props
}) {
    return (
        <View style={styles.container}>
            {label && <Text style={typography.label}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                error && styles.inputError,
                disabled && styles.inputDisabled,
            ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={!disabled && editable}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.m, // Changed from full to m for better aesthetic with border
        paddingHorizontal: spacing.m,
        backgroundColor: colors.surface,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: colors.text,
    },
    leftIcon: {
        marginRight: spacing.s,
    },
    inputError: {
        borderColor: colors.error,
    },
    inputDisabled: {
        backgroundColor: colors.surfaceHighlight,
        borderColor: colors.border,
    },
    errorText: {
        fontSize: 12,
        color: colors.error,
        marginTop: spacing.xs,
        marginLeft: spacing.m,
    },
});
