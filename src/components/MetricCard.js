import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = colors.primary }) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {Icon && <Icon size={20} color={colors.textSecondary} />}
            </View>

            <View style={styles.valueContainer}>
                <Text style={[styles.value, { color }]}>{value}</Text>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trend.isPositive ? '#dcfce7' : '#fee2e2' }]}>
                        <Text style={[styles.trendText, { color: trend.isPositive ? '#16a34a' : '#dc2626' }]}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </Text>
                    </View>
                )}
            </View>

            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.small,
        minHeight: 100,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginBottom: spacing.xs,
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    trendBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.s,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: colors.textTertiary,
    },
});
