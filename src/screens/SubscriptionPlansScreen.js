import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator, Dimensions, LayoutAnimation, Platform, UIManager, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { fetchSubscriptionPlans, createPaymentRequest } from '../services/api';
import { ArrowLeft, X, Check, Star, ShieldCheck, Zap } from 'lucide-react-native';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

// Custom Spring Animation Config
const CustomLayoutAnimation = {
    duration: 400,
    create: {
        type: LayoutAnimation.Types.spring,
        property: LayoutAnimation.Properties.opacity,
        springDamping: 0.8,
    },
    update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.8,
    },
    delete: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
        duration: 200,
    },
};

export default function SubscriptionPlansScreen({ navigation }) {
    const { colors, spacing, typography, shadows, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await fetchSubscriptionPlans();
            const sortedPlans = data.sort((a, b) => a.price - b.price);
            setPlans(sortedPlans);

            const defaultPlan = sortedPlans.find(p => p.name.includes('Gold') || p.name.includes('Quarterly')) || sortedPlans[1] || sortedPlans[0];
            setSelectedPlan(defaultPlan);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.quad),
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1.2)),
                }),
            ]).start();

        } catch (error) {
            Alert.alert('Error', 'Failed to load subscription plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (plan) => {
        if (selectedPlan?.id !== plan.id) {
            LayoutAnimation.configureNext(CustomLayoutAnimation);
            setSelectedPlan(plan);
        }
    };

    const handleSubscribe = async () => {
        if (!selectedPlan) return;

        setProcessing(true);
        try {
            const response = await createPaymentRequest(selectedPlan.id);
            if (response && response.url) {
                const supported = await Linking.canOpenURL(response.url);
                if (supported) {
                    await Linking.openURL(response.url);
                } else {
                    Alert.alert('Error', 'Cannot open payment link');
                }
            } else {
                Alert.alert('Error', 'Failed to generate payment link');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Payment initiation failed');
        } finally {
            setProcessing(false);
        }
    };

    const getDurationLabel = (days) => {
        if (days >= 360) return '12 Months';
        if (days >= 90) return '3 Months';
        if (days >= 30) return '1 Month';
        return `${days} Days`;
    };

    const getSavingsLabel = (plan, allPlans) => {
        if (plan.name.includes('Silver') || plan.duration_days <= 30) return null;

        const monthlyPlan = allPlans.find(p => p.name.includes('Silver') || p.duration_days <= 30);
        if (!monthlyPlan) return null;

        const monthlyCostPerDay = monthlyPlan.price / monthlyPlan.duration_days;
        const currentCostPerDay = plan.price / plan.duration_days;

        const savings = ((monthlyCostPerDay - currentCostPerDay) / monthlyCostPerDay) * 100;
        return Math.round(savings);
    };

    const isPopular = (name) => name.includes('Gold') || name.includes('Quarterly');

    const styles = getStyles(colors, spacing, typography, shadows, borderRadius, insets);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.modalIndicator} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ paddingHorizontal: spacing.m }}>
                    <Text style={styles.title}>Unlock Pro Access</Text>
                    <Text style={styles.subtitle}>Choose the plan that fits your gym's growth.</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {plans.map((plan, index) => {
                    const popular = isPopular(plan.name);
                    const isSelected = selectedPlan?.id === plan.id;
                    const savings = getSavingsLabel(plan, plans);
                    const durationLabel = getDurationLabel(plan.duration_days);
                    const monthlyPrice = Math.round(plan.price / (plan.duration_days / 30));

                    return (
                        <Animated.View
                            key={plan.id}
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => handleSelectPlan(plan)}
                                activeOpacity={0.95}
                                style={[
                                    styles.cardContainer,
                                    isSelected && styles.selectedCardContainer,
                                    popular && styles.popularCardContainer
                                ]}
                            >
                                {popular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>
                                            MOST POPULAR
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.cardContent}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={styles.durationText}>
                                                {durationLabel}
                                            </Text>
                                        </View>
                                        {savings > 0 && (
                                            <View style={styles.savingsBadge}>
                                                <Text style={styles.savingsText}>
                                                    Save {savings}%
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                            <Text style={styles.currency}>₹</Text>
                                            <Text style={styles.price}>{plan.price}</Text>
                                        </View>
                                        <Text style={styles.perMonth}>
                                            ₹{monthlyPrice} / mo
                                        </Text>
                                    </View>
                                </View>

                                {/* Expanded Content: Features */}
                                {isSelected && (
                                    <View style={styles.expandedContent}>
                                        <View style={styles.divider} />
                                        {plan.features && plan.features.map((feature, index) => (
                                            <View key={index} style={styles.featureItem}>
                                                <View style={styles.checkContainer}>
                                                    <Check size={12} color={colors.primary} strokeWidth={3} />
                                                </View>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Subscribe Now"
                    onPress={handleSubscribe}
                    loading={processing}
                    disabled={processing || !selectedPlan}
                />
            </View>
        </SafeAreaView>
    );
}

const getStyles = (colors, spacing, typography, shadows, borderRadius, insets) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalIndicator: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.s,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.s,
        paddingBottom: spacing.s,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: spacing.xs,
        marginBottom: spacing.s,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    scrollContent: {
        padding: spacing.l,
        paddingTop: spacing.s,
    },
    cardContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadows.small,
    },
    selectedCardContainer: {
        borderColor: colors.primary,
        borderWidth: 2,
        backgroundColor: colors.surface,
        ...shadows.medium,
    },
    popularCardContainer: {
        // Inherit default border
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.warning,
        borderBottomLeftRadius: borderRadius.m,
        paddingHorizontal: 8,
        paddingVertical: 3,
        zIndex: 10,
    },
    popularText: {
        ...typography.bodySmall,
        fontSize: 10,
        color: colors.text,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    durationText: {
        ...typography.h2,
        color: colors.text,
    },
    savingsBadge: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.s,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    savingsText: {
        ...typography.bodySmall,
        color: colors.success,
        fontWeight: '700',
    },
    currency: {
        ...typography.h3,
        color: colors.text,
        marginRight: 2,
        marginBottom: 4,
    },
    price: {
        ...typography.h1,
        color: colors.text,
        fontSize: 36,
        letterSpacing: -1,
    },
    perMonth: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    expandedContent: {
        marginTop: spacing.m,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: spacing.m,
        opacity: 0.5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    checkContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    featureText: {
        ...typography.body,
        color: colors.text,
        flex: 1,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.l,
        paddingBottom: (insets?.bottom || 0) + spacing.l,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});
