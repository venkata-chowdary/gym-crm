import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { Svg, Path, Defs, LinearGradient, Stop, G, Text as SvgText, Line, Circle } from 'react-native-svg';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, History, PiggyBank, Activity, RefreshCw, PieChart } from 'lucide-react-native';
import { showToast } from '../components/Toast';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [revenueData, setRevenueData] = useState({
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
        allTime: 0,
        renewalRate: 0,
        totalExpired: 0,
        renewalRate: 0,
        totalExpired: 0,
        monthlyRevenue: [], // Array of { month: 'Jan', amount: 1000, fullDate: '...' }
        planDistribution: [] // Array of { name: 'Gold', count: 10, color: '#...', percentage: 20 }
    });

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchAnalytics();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
        showToast('Analytics updated', 'success');
    }, []);

    // const fetchAnalytics = async () => {
    //     try {
    //         if (!user) return;

    //         // Get gym ID
    //         const { data: gymData, error: gymError } = await supabase
    //             .from('gyms')
    //             .select('id')
    //             .eq('owner_id', user.id)
    //             .single();

    //         if (gymError || !gymData) return;

    //         // Calculate date ranges
    //         const now = new Date();
    //         const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    //         const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    //         const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    //         // Fetch this month's revenue
    //         const { data: thisMonthPayments } = await supabase
    //             .from('payments')
    //             .select('amount, members!inner(gym_id)')
    //             .eq('members.gym_id', gymData.id)
    //             .gte('paid_on', thisMonthStart);

    //         // Fetch last month's revenue
    //         const { data: lastMonthPayments } = await supabase
    //             .from('payments')
    //             .select('amount, members!inner(gym_id)')
    //             .eq('members.gym_id', gymData.id)
    //             .gte('paid_on', lastMonthStart)
    //             .lte('paid_on', lastMonthEnd);

    //         // Fetch all-time revenue
    //         const { data: allTimePayments } = await supabase
    //             .from('payments')
    //             .select('amount, members!inner(gym_id)')
    //             .eq('members.gym_id', gymData.id);

    //         // Fetch members who expired this month (for renewal rate calculation)
    //         const { data: expiredThisMonth } = await supabase
    //             .from('members')
    //             .select('id, expiry_date')
    //             .eq('gym_id', gymData.id)
    //             .gte('expiry_date', lastMonthEnd)
    //             .lt('expiry_date', thisMonthStart);

    //         // Fetch renewals this month (payments made by members who expired)
    //         const expiredMemberIds = expiredThisMonth?.map(m => m.id) || [];
    //         let renewalsCount = 0;

    //         if (expiredMemberIds.length > 0) {
    //             const { data: renewals } = await supabase
    //                 .from('payments')
    //                 .select('member_id')
    //                 .in('member_id', expiredMemberIds)
    //                 .gte('paid_on', thisMonthStart);

    //             renewalsCount = new Set(renewals?.map(r => r.member_id) || []).size;
    //         }

    //         // Calculate totals
    //         const thisMonth = thisMonthPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    //         const lastMonth = lastMonthPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    //         const allTime = allTimePayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

    //         // Calculate growth percentage
    //         let growth = 0;
    //         if (lastMonth > 0) {
    //             growth = ((thisMonth - lastMonth) / lastMonth) * 100;
    //         } else if (thisMonth > 0) {
    //             growth = 100;
    //         }

    //         // Calculate renewal rate
    //         const renewalRate = expiredThisMonth && expiredThisMonth.length > 0
    //             ? (renewalsCount / expiredThisMonth.length) * 100
    //             : 0;

    //         setRevenueData({
    //             thisMonth,
    //             lastMonth,
    //             growth: parseFloat(growth.toFixed(1)),
    //             allTime,
    //             renewalRate: parseFloat(renewalRate.toFixed(1))
    //         });

    //     } catch (error) {
    //         console.error('Error fetching analytics:', error);
    //         Alert.alert('Error', 'Failed to load analytics data');
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            if (!user) return;

            // 1. Get gym id
            const { data: gymData, error: gymError } = await supabase
                .from("gyms")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (gymError || !gymData) {
                console.error("Gym fetch error:", gymError);
                return;
            }

            const now = new Date();

            // Month boundaries
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            // Convert to ISO
            const thisMonthStartISO = thisMonthStart.toISOString();
            const nextMonthStartISO = nextMonthStart.toISOString();
            const lastMonthStartISO = lastMonthStart.toISOString();
            const lastMonthEndISO = lastMonthEnd.toISOString();

            // -----------------------------------------------------
            // 2. This month payments
            // -----------------------------------------------------
            const { data: thisMonthPayments, error: thisMonthError } = await supabase
                .from("payments")
                .select("amount, member_id, members(gym_id)")
                .gte("paid_on", thisMonthStartISO)
                .lt("paid_on", nextMonthStartISO)
                .eq("members.gym_id", gymData.id);

            if (thisMonthError) console.error(thisMonthError);

            // -----------------------------------------------------
            // 3. Last month payments
            // -----------------------------------------------------
            const { data: lastMonthPayments, error: lastMonthError } = await supabase
                .from("payments")
                .select("amount, member_id, members(gym_id)")
                .gte("paid_on", lastMonthStartISO)
                .lte("paid_on", lastMonthEndISO)
                .eq("members.gym_id", gymData.id);

            if (lastMonthError) console.error(lastMonthError);

            // -----------------------------------------------------
            // 4. All-time payments
            // -----------------------------------------------------
            const { data: allTimePayments, error: allTimeError } = await supabase
                .from("payments")
                .select("amount, member_id, members(gym_id)")
                .eq("members.gym_id", gymData.id);

            if (allTimeError) console.error(allTimeError);

            // -----------------------------------------------------
            // 5. Members who expired THIS MONTH
            // (corrected filter — your older logic was wrong)
            // -----------------------------------------------------
            const { data: expiredThisMonth, error: expiredError } = await supabase
                .from("members")
                .select("id, expiry_date")
                .gte("expiry_date", thisMonthStartISO)
                .lt("expiry_date", nextMonthStartISO)
                .eq("gym_id", gymData.id);

            if (expiredError) console.error(expiredError);

            const expiredMemberIds = (expiredThisMonth || []).map(m => m.id);

            // -----------------------------------------------------
            // 6. Renewals = expired this month AND made a payment this month
            // -----------------------------------------------------
            let renewalsCount = 0;

            if (expiredMemberIds.length > 0) {
                const { data: renewals, error: renewalsError } = await supabase
                    .from("payments")
                    .select("member_id")
                    .in("member_id", expiredMemberIds)
                    .gte("paid_on", thisMonthStartISO)
                    .lt("paid_on", nextMonthStartISO);

                if (renewalsError) console.error(renewalsError);

                // unique renewal count
                renewalsCount = new Set((renewals || []).map(r => r.member_id)).size;
            }

            // -----------------------------------------------------
            // 7. Calculate amounts
            // -----------------------------------------------------
            const sum = arr =>
                (arr || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

            const thisMonth = sum(thisMonthPayments);
            const lastMonth = sum(lastMonthPayments);
            const allTime = sum(allTimePayments);

            // Growth %
            let growth = 0;
            if (lastMonth > 0) {
                growth = ((thisMonth - lastMonth) / lastMonth) * 100;
            } else if (thisMonth > 0) {
                growth = 100;
            }

            // Renewal rate %
            const renewalRate =
                expiredThisMonth.length > 0
                    ? (renewalsCount / expiredThisMonth.length) * 100
                    : 0;

            // -----------------------------------------------------
            // 8. Monthly Revenue (Last 12 Months)
            // -----------------------------------------------------
            const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            const twelveMonthsAgoISO = twelveMonthsAgo.toISOString();

            const { data: last12MonthsPayments, error: historyError } = await supabase
                .from("payments")
                .select("amount, paid_on, members(gym_id)")
                .gte("paid_on", twelveMonthsAgoISO)
                .lte("paid_on", nextMonthStartISO) // Up to end of current month
                .eq("members.gym_id", gymData.id);

            if (historyError) console.error(historyError);

            // Process into 12 buckets
            const monthlyRevenue = [];
            for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
                const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                const year = d.getFullYear();
                const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

                // Filter payments for this month
                const monthTotal = (last12MonthsPayments || [])
                    .filter(p => p.paid_on.startsWith(monthKey))
                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

                monthlyRevenue.push({
                    month: monthName,
                    year: year,
                    amount: monthTotal,
                    fullDate: monthKey
                });
                monthlyRevenue.push({
                    month: monthName,
                    year: year,
                    amount: monthTotal,
                    fullDate: monthKey
                });
            }

            // -----------------------------------------------------
            // 10. Plan Distribution
            // -----------------------------------------------------
            // Fetch plans
            const { data: plans, error: plansError } = await supabase
                .from('plans')
                .select('id, name')
                .eq('gym_id', gymData.id);

            if (plansError) console.error(plansError);

            // Fetch active members with their plan
            const { data: memberPlans, error: memberPlansError } = await supabase
                .from('members')
                .select('plan')
                .eq('gym_id', gymData.id)
                .gte('expiry_date', new Date().toISOString()); // Active members only

            if (memberPlansError) console.error(memberPlansError);

            const planCounts = {};
            (memberPlans || []).forEach(m => {
                if (m.plan) {
                    planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
                }
            });

            const palette = [
                '#3b82f6', // blue
                '#8b5cf6', // violet
                '#10b981', // emerald
                '#f59e0b', // amber
                '#ef4444', // red
                '#ec4899', // pink
                '#6366f1', // indigo
                '#14b8a6', // teal
            ];

            const planDistribution = (plans || []).map((plan, index) => {
                const count = planCounts[plan.name] || 0;
                return {
                    name: plan.name,
                    count,
                    color: palette[index % palette.length],
                    id: plan.id
                };
            }).filter(p => p.count > 0) // Only show plans with members
                .sort((a, b) => b.count - a.count); // Sort by count desc

            // Calculate percentages
            const totalMembers = planDistribution.reduce((sum, p) => sum + p.count, 0);
            planDistribution.forEach(p => {
                p.percentage = totalMembers > 0 ? (p.count / totalMembers) * 100 : 0;
            });

            // -----------------------------------------------------
            // 9. Set state
            // -----------------------------------------------------
            setRevenueData({
                thisMonth,
                lastMonth,
                growth: parseFloat(growth.toFixed(1)),
                allTime,
                renewalRate: parseFloat(renewalRate.toFixed(1)),
                totalExpired: expiredThisMonth.length,
                renewalRate: parseFloat(renewalRate.toFixed(1)),
                totalExpired: expiredThisMonth.length,
                monthlyRevenue,
                planDistribution
            });

        } catch (error) {
            console.error("Analytics error:", error);
            Alert.alert("Error", "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };


    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const RevenueCard = ({ title, amount, subtitle, icon: Icon, trend }) => (
        <View style={[styles.revenueCard, { flex: 1 }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Icon size={24} color={colors.primary} />
                </View>
                {trend !== undefined && (
                    <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? colors.success + '15' : trend < 0 ? colors.error + '15' : colors.textSecondary + '15' }]}>
                        {trend > 0 ? (
                            <TrendingUp size={14} color={colors.success} />
                        ) : trend < 0 ? (
                            <TrendingDown size={14} color={colors.error} />
                        ) : (
                            <TrendingUp size={14} color={colors.textSecondary} />
                        )}
                        <Text style={[styles.trendText, { color: trend > 0 ? colors.success : trend < 0 ? colors.error : colors.textSecondary }]}>
                            {Math.abs(trend)}%
                        </Text>
                    </View>
                )}
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardAmount}>{amount === 0 ? '₹0' : formatCurrency(amount)}</Text>
            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
    );

    const RenewalRateCard = ({ rate, totalExpired }) => {
        if (totalExpired === 0) {
            return (
                <View style={[styles.revenueCard, { flex: 1 }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.textTertiary + '15' }]}>
                            <RefreshCw size={24} color={colors.textTertiary} />
                        </View>
                    </View>
                    <Text style={styles.cardTitle}>Renewal Rate</Text>
                    <Text style={[styles.cardAmount, { color: colors.textTertiary }]}>N/A</Text>
                    <Text style={styles.cardSubtitle}>No expiries this month</Text>
                </View>
            );
        }

        const getRateColor = () => {
            if (rate >= 70) return colors.success;
            if (rate >= 40) return '#f59e0b'; // warning/yellow
            return colors.error;
        };

        const getRateLabel = () => {
            if (rate >= 70) return 'Excellent';
            if (rate >= 40) return 'Average';

            return 'Low';
        };

        return (
            <View style={[styles.revenueCard, { flex: 1 }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: getRateColor() + '15' }]}>
                        <RefreshCw size={24} color={getRateColor()} />
                    </View>
                    <View style={[styles.rateBadge, { backgroundColor: getRateColor() + '15' }]}>
                        <Text style={[styles.rateBadgeText, { color: getRateColor() }]}>
                            {getRateLabel()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.cardTitle}>Renewal Rate</Text>
                <Text style={[styles.cardAmount, { color: getRateColor() }]}>{rate}%</Text>
                <Text style={styles.cardSubtitle}>{totalExpired} expired this month</Text>
            </View>
        );
    };

    const MonthlyRevenueChart = ({ data }) => {
        if (!data || data.length === 0) return null;

        const maxAmount = Math.max(...data.map(d => d.amount), 1);
        const topMonth = data.reduce((max, month) =>
            month.amount > max.amount ? month : max
            , data[0]);

        // Create path data
        // We'll use a 100x100 coordinate system for simplicity with preserveAspectRatio="none"
        const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item.amount / maxAmount) * 100;
            return `${x},${y}`;
        });

        const linePath = `M ${points.join(' L ')}`;
        const areaPath = `${linePath} L 100,100 L 0,100 Z`;

        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Activity size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        <Text style={styles.cardTitle}>Revenue Trend</Text>
                        <Text style={styles.chartSubtitle}>
                            Top Month: <Text style={{ fontWeight: '700' }}>{topMonth.month} '{topMonth.year.toString().slice(-2)}</Text>
                        </Text>
                    </View>
                </View>


                <View style={styles.chartContainer}>
                    <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={colors.primary} stopOpacity="0.2" />
                                <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        <Path d={areaPath} fill="url(#grad)" />
                        <Path d={linePath} stroke={colors.primary} strokeWidth="2" fill="none" />
                    </Svg>
                </View>

                {/* X-Axis Labels */}
                <View style={styles.chartLabels}>
                    {data.map((item, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.chartLabel,
                                {
                                    textAlign: 'center',
                                    width: `${100 / 12}%`,
                                    opacity: index % 2 === 0 ? 1 : 0 // Show every other label to avoid clutter
                                }
                            ]}
                        >
                            {index % 2 === 0 ? `${item.month}\n'${item.year.toString().slice(-2)}` : ''}
                        </Text>
                    ))}
                </View>
            </View>
        );
    };

    const MemberDistributionChart = ({ data }) => {
        if (!data || data.length === 0) return null;

        const total = data.reduce((sum, item) => sum + item.count, 0);
        const topPlan = data[0]; // Already sorted by count descending
        let startAngle = 0;

        // Chart dimensions
        const size = 200;
        const center = size / 2;
        const radius = 60; // Inner radius for donut
        const outerRadius = 80; // Outer radius
        const labelRadius = 100; // Radius for label placement

        // Helper to calculate coordinates
        const getCoordinatesForAngle = (angle, r) => {
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return { x, y };
        };

        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <PieChart size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        <Text style={styles.cardTitle}>Member Distribution</Text>
                        <Text style={styles.chartSubtitle}>
                            Top Plan: <Text style={{ fontWeight: '700', color: topPlan.color }}>{topPlan.name}</Text>
                        </Text>
                    </View>
                </View>


                <View style={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
                    <Svg width={size + 100} height={size + 40} viewBox={`0 0 ${size + 100} ${size + 40}`}>
                        <G x={50} y={20}>
                            {data.map((item, index) => {
                                const percentage = item.count / total;
                                const angle = percentage * 2 * Math.PI;
                                const endAngle = startAngle + angle;

                                // Calculate path for arc
                                const x1 = center + outerRadius * Math.cos(startAngle);
                                const y1 = center + outerRadius * Math.sin(startAngle);
                                const x2 = center + outerRadius * Math.cos(endAngle);
                                const y2 = center + outerRadius * Math.sin(endAngle);

                                const largeArcFlag = angle > Math.PI ? 1 : 0;

                                // Donut hole path (reverse direction)
                                const x3 = center + radius * Math.cos(endAngle);
                                const y3 = center + radius * Math.sin(endAngle);
                                const x4 = center + radius * Math.cos(startAngle);
                                const y4 = center + radius * Math.sin(startAngle);

                                const pathData = [
                                    `M ${x1} ${y1}`,
                                    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                    `L ${x3} ${y3}`,
                                    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                                    `Z`
                                ].join(' ');

                                // Label calculation
                                const midAngle = startAngle + angle / 2;
                                const labelPos = getCoordinatesForAngle(midAngle, labelRadius);
                                const lineStart = getCoordinatesForAngle(midAngle, outerRadius);

                                // Adjust label position to be outside
                                const isRightSide = Math.cos(midAngle) >= 0;
                                const labelX = isRightSide ? labelPos.x + 10 : labelPos.x - 10;
                                const labelY = labelPos.y;

                                const currentStartAngle = startAngle;
                                startAngle += angle;

                                return (
                                    <G key={index}>
                                        <Path d={pathData} fill={item.color} />

                                        {/* Line pointing to label */}
                                        <Line
                                            x1={lineStart.x}
                                            y1={lineStart.y}
                                            x2={labelPos.x}
                                            y2={labelPos.y}
                                            stroke={colors.textSecondary}
                                            strokeWidth="1"
                                        />
                                        <Line
                                            x1={labelPos.x}
                                            y1={labelPos.y}
                                            x2={labelX}
                                            y2={labelY}
                                            stroke={colors.textSecondary}
                                            strokeWidth="1"
                                        />

                                        {/* Label Text */}
                                        <SvgText
                                            x={labelX + (isRightSide ? 5 : -5)}
                                            y={labelY + 4}
                                            fill={colors.text}
                                            fontSize="12"
                                            fontWeight="bold"
                                            textAnchor={isRightSide ? "start" : "end"}
                                        >
                                            {item.count}
                                        </SvgText>
                                    </G>
                                );
                            })}
                        </G>
                    </Svg>
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    {data.map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={typography.h1}>Analytics</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h1}>Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Overview Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>

                    <View style={styles.cardsGrid}>
                        <RevenueCard
                            title="This Month"
                            amount={revenueData.thisMonth}
                            subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            icon={Wallet}
                            trend={revenueData.growth}
                        />

                        <RevenueCard
                            title="Last Month"
                            amount={revenueData.lastMonth}
                            subtitle={new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            icon={History}
                        />
                    </View>

                    <View style={[styles.cardsGrid, { marginTop: spacing.m }]}>
                        <RevenueCard
                            title="Total Revenue"
                            amount={revenueData.allTime}
                            subtitle="All-time earnings"
                            icon={PiggyBank}
                        />

                        <RenewalRateCard rate={revenueData.renewalRate} totalExpired={revenueData.totalExpired} />
                    </View>
                </View>

                {/* Monthly Revenue Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Revenue History</Text>
                    <MonthlyRevenueChart data={revenueData.monthlyRevenue} />
                </View>

                {/* Member Distribution Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Member Distribution</Text>
                    <MemberDistributionChart data={revenueData.planDistribution} />
                </View>

                {/* Growth Indicator */}
                {revenueData.growth !== 0 && (
                    <View style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            {revenueData.growth >= 0 ? (
                                <TrendingUp size={20} color={colors.success} />
                            ) : (
                                <TrendingDown size={20} color={colors.error} />
                            )}
                            <Text style={[styles.insightTitle, { color: revenueData.growth >= 0 ? colors.success : colors.error }]}>
                                {revenueData.growth >= 0 ? 'Revenue Growth' : 'Revenue Decline'}
                            </Text>
                        </View>
                        <Text style={styles.insightText}>
                            Your revenue is {revenueData.growth >= 0 ? 'up' : 'down'} by {Math.abs(revenueData.growth)}% compared to last month.
                            {revenueData.growth >= 0
                                ? ' Keep up the great work!'
                                : ' Consider reviewing your marketing strategy.'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.m,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.small,
    },
    content: {
        padding: spacing.m,
        paddingBottom: spacing.xxl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.l, // Reduced margin
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.s,
    },
    cardsGrid: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    revenueCard: {
        // width: 160, // Removed fixed width
        minHeight: 160,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.xs,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '700',
    },
    rateBadge: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    rateBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardTitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    cardAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    cardSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    insightCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.small,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginBottom: spacing.s,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    insightText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.small,
        marginBottom: spacing.m,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        marginBottom: spacing.xs,
    },
    chartSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.m,
    },
    chartContainer: {
        height: 150,
        marginBottom: spacing.s,
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    chartLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.m,
        marginTop: spacing.s,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
});
