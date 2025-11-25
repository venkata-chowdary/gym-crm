import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borderRadius, colors, spacing, shadows } from '../theme';

export default function SkeletonLoader({ width = '100%', height = 20, style, borderRadiusValue = borderRadius.m }) {
    return (
        <View style={[styles.skeleton, { width, height, borderRadius: borderRadiusValue }, style]} />
    );
}

export const MemberCardSkeleton = () => (
    <View style={styles.memberCard}>
        <View style={styles.memberCardHeader}>
            <View style={{ flex: 1 }}>
                <SkeletonLoader width="60%" height={18} style={{ marginBottom: spacing.xs }} />
                <SkeletonLoader width="40%" height={14} />
            </View>
            <SkeletonLoader width={80} height={24} borderRadiusValue={borderRadius.full} />
        </View>
        <View style={styles.memberCardBody}>
            <SkeletonLoader width="50%" height={14} style={{ marginBottom: spacing.xs }} />
            <SkeletonLoader width="70%" height={14} />
        </View>
        <View style={styles.memberCardFooter}>
            <SkeletonLoader width="45%" height={14} />
            <SkeletonLoader width={32} height={32} borderRadiusValue={borderRadius.full} />
        </View>
    </View>
);

export const MemberDetailSkeleton = () => (
    <View style={styles.detailContainer}>
        {/* Avatar and name */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <SkeletonLoader width={80} height={80} borderRadiusValue={40} style={{ marginBottom: spacing.m }} />
            <SkeletonLoader width={150} height={24} style={{ marginBottom: spacing.s }} />
            <SkeletonLoader width={80} height={20} borderRadiusValue={borderRadius.full} />
        </View>

        {/* Contact section */}
        <View style={{ marginBottom: spacing.xl }}>
            <SkeletonLoader width={140} height={18} style={{ marginBottom: spacing.m }} />
            <View style={styles.infoCard}>
                <SkeletonLoader width="80%" height={16} style={{ marginBottom: spacing.s }} />
                <SkeletonLoader width="60%" height={16} />
            </View>
        </View>

        {/* Membership section */}
        <View style={{ marginBottom: spacing.xl }}>
            <SkeletonLoader width={160} height={18} style={{ marginBottom: spacing.m }} />
            <View style={styles.infoCard}>
                <SkeletonLoader width="70%" height={16} style={{ marginBottom: spacing.s }} />
                <SkeletonLoader width="50%" height={16} style={{ marginBottom: spacing.s }} />
                <SkeletonLoader width="60%" height={16} />
            </View>
        </View>
    </View>
);

export const DashboardSkeleton = () => (
    <View style={styles.detailContainer}>
        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', marginBottom: spacing.xl, gap: spacing.s }}>
            <SkeletonLoader width={100} height={40} borderRadiusValue={borderRadius.full} style={{ ...shadows.small }} />
            <SkeletonLoader width={120} height={40} borderRadiusValue={borderRadius.full} style={{ ...shadows.small }} />
            <SkeletonLoader width={90} height={40} borderRadiusValue={borderRadius.full} style={{ ...shadows.small }} />
        </View>

        {/* Metrics Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl }}>
            <SkeletonLoader width="48%" height={120} borderRadiusValue={borderRadius.l} style={{ marginBottom: spacing.m, ...shadows.small }} />
            <SkeletonLoader width="48%" height={120} borderRadiusValue={borderRadius.l} style={{ marginBottom: spacing.m, ...shadows.small }} />
            <SkeletonLoader width="48%" height={120} borderRadiusValue={borderRadius.l} style={{ ...shadows.small }} />
            <SkeletonLoader width="48%" height={120} borderRadiusValue={borderRadius.l} style={{ ...shadows.small }} />
        </View>

        {/* Chart Section */}
        <SkeletonLoader width="100%" height={220} borderRadiusValue={borderRadius.l} style={{ ...shadows.small }} />
    </View>
);

export const PlanItemSkeleton = () => (
    <View style={styles.memberCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
                <SkeletonLoader width="40%" height={18} style={{ marginBottom: spacing.xs }} />
                <SkeletonLoader width="60%" height={14} />
            </View>
            <SkeletonLoader width={24} height={24} borderRadiusValue={borderRadius.s} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: colors.surface,
        opacity: 0.6,
    },
    memberCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    memberCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    memberCardBody: {
        marginBottom: spacing.m,
    },
    memberCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailContainer: {
        padding: spacing.l,
    },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
    },
});
