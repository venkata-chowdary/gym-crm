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
}) {
    return (
        <View style={styles.container}>
            {label && <Text style={typography.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    disabled && styles.inputDisabled,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                editable={!disabled}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    input: {
        height: 56,
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.l,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.surface,
    },
    inputError: {
        borderColor: colors.error,
        borderWidth: 2,
    },
    inputDisabled: {
        backgroundColor: colors.surfaceHighlight,
        color: colors.textTertiary,
    },
    errorText: {
        fontSize: 12,
        color: colors.error,
        marginTop: spacing.xs,
        marginLeft: spacing.m,
    },
});
