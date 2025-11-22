import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

export default function Button({
    title,
    label,
    onPress,
    variant = 'primary', // primary, secondary, outline, ghost
    loading = false,
    disabled = false,
    style
}) {
    const buttonText = label || title;
    const getBackgroundColor = () => {
        if (disabled) return colors.surfaceHighlight;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.surfaceHighlight;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textTertiary;
        switch (variant) {
            case 'primary': return '#ffffff';
            case 'secondary': return colors.text;
            case 'outline': return colors.primary;
            case 'ghost': return colors.textSecondary;
            default: return '#ffffff';
        }
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 1, borderColor: disabled ? colors.border : colors.primary };
        return {};
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    opacity: pressed ? 0.9 : 1,
                    ...getBorder(),
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[typography.button, { color: getTextColor() }]}>
                    {buttonText}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 56, // Slightly taller for better touch target
        borderRadius: borderRadius.full, // Pill shape
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.l,
        width: '100%',
    },
});
