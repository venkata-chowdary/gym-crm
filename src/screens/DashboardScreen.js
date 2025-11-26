import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable, Dimensions, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { Search, Plus, CreditCard, Users, ChevronRight, Users as UsersIcon, UserCheck, UserX, TrendingUp, Calendar, BarChart3 } from 'lucide-react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import ProfileMenu from '../components/ProfileMenu';
import MetricCard from '../components/MetricCard';
import { MemberCardSkeleton, DashboardSkeleton } from '../components/SkeletonLoader';
import { showToast } from '../components/Toast';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [gym, setGym] = useState(null);
    const [trialDaysLeft, setTrialDaysLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [metrics, setMetrics] = useState({ totalMembers: 0, activeMembers: 0, expiringSoon: 0, newJoins: 0 });
    const [expiringMembers, setExpiringMembers] = useState([]);
    const [chartData, setChartData] = useState({
        labels: [],
        legend: [],
        data: [],
        barColors: []
    });
    const [trendPercentage, setTrendPercentage] = useState(0);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchGymDetails();
            fetchMetrics();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchGymDetails(), fetchMetrics()]);
        setRefreshing(false);
        showToast('Dashboard updated', 'success');
    }, []);

    const fetchMetrics = async () => {
        try {
            if (!user) return;
            const { data: gymData, error: gymError } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single();
            if (gymError || !gymData) return;

            const today = new Date().toISOString().split('T')[0];
            const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            // Calculate 6 months ago for chart
            const sixMonthsAgoDate = new Date();
            sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 5);
            sixMonthsAgoDate.setDate(1);
            const sixMonthsAgo = sixMonthsAgoDate.toISOString().split('T')[0];

            const [total, active, expiring, newJoins, expiringList, joinsHistory, plansData] = await Promise.all([
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gymData.id),
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gymData.id).gte('expiry_date', today),
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gymData.id).gte('expiry_date', today).lte('expiry_date', sevenDaysLater),
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gymData.id).gte('join_date', firstDayOfMonth),
                // Fetch actual expiring members list
                supabase.from('members').select('*').eq('gym_id', gymData.id).gte('expiry_date', today).lte('expiry_date', sevenDaysLater).order('expiry_date', { ascending: true }).limit(5),
                // Fetch join history with plan for chart
                supabase.from('members').select('join_date, plan').eq('gym_id', gymData.id).gte('join_date', sixMonthsAgo),
                // Fetch plans for chart legend
                supabase.from('plans').select('name').eq('gym_id', gymData.id)
            ]);

            setMetrics({
                totalMembers: total.count || 0,
                activeMembers: active.count || 0,
                expiringSoon: expiring.count || 0,
                newJoins: newJoins.count || 0,
            });

            setExpiringMembers(expiringList.data || []);

            // Extract configured plan names
            const configuredPlans = (plansData.data || []).map(p => p.name);

            // Extract plans from history (to include legacy plans)
            const historyPlans = (joinsHistory.data || []).map(m => m.plan);

            // Merge and unique
            const allPlans = [...new Set([...configuredPlans, ...historyPlans])].filter(Boolean);

            processChartData(joinsHistory.data || [], allPlans);

        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    const processChartData = (data, planNames) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = [];
        const chartValues = [];

        // Color palette for dynamic plans
        const palette = ['#2563eb', '#60a5fa', '#bfdbfe', '#1e40af', '#93c5fd', '#3b82f6'];
        const barColors = planNames.length > 0
            ? planNames.map((_, i) => palette[i % palette.length])
            : ['#2563eb']; // Default if no plans

        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            last6Months.push({
                label: months[d.getMonth()],
                monthIndex: d.getMonth(),
                year: d.getFullYear()
            });
            // Initialize with 0s for each plan
            chartValues.push(new Array(Math.max(planNames.length, 1)).fill(0));
        }

        data.forEach(member => {
            const joinDate = new Date(member.join_date);
            const monthIndex = joinDate.getMonth();
            const year = joinDate.getFullYear();

            // Find which bucket this falls into
            const index = last6Months.findIndex(m => m.monthIndex === monthIndex && m.year === year);
            if (index !== -1) {
                const planIndex = planNames.indexOf(member.plan);
                if (planIndex !== -1) {
                    chartValues[index][planIndex]++;
                }
            }
        });

        // Calculate trend (this month vs last month)
        const thisMonthTotal = chartValues[5].reduce((a, b) => a + b, 0);
        const lastMonthTotal = chartValues[4].reduce((a, b) => a + b, 0);
        let trend = 0;
        if (lastMonthTotal > 0) {
            trend = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        } else if (thisMonthTotal > 0) {
            trend = 100;
        }
        setTrendPercentage(trend.toFixed(1));

        setChartData({
            labels: last6Months.map(m => m.label),
            legend: planNames.length > 0 ? planNames : ['No Plans'],
            data: chartValues,
            barColors: barColors
        });
    };
    const fetchGymDetails = async () => {
        try {
            if (!user) return;

            // Fetch owner data
            const { data: ownerData, error: ownerError } = await supabase
                .from('gym_owners')
                .select('status, trial_start_date, owner_name')
                .eq('id', user.id)
                .single();
            if (ownerError) throw ownerError;

            let daysLeft = 0;

            if (ownerData.trial_start_date) {
                const start = new Date(ownerData.trial_start_date);
                const now = new Date();
                const diffTime = now - start; // milliseconds difference
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                // Trial is 7 days from start date
                daysLeft = Math.max(7 - diffDays, 0);
            }

            setTrialDaysLeft(daysLeft);

            // Fetch gym data
            const { data: gymData, error: gymError } = await supabase
                .from('gyms')
                .select('*')
                .eq('owner_id', user.id)
                .single();
            if (gymError) throw gymError;

            setGym({ ...gymData, owner_name: ownerData.owner_name });

        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }
        ]);
    };

    const QuickAction = ({ icon: Icon, label, onPress }) => (
        <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.7}>
            <Icon size={16} color={colors.text} />
            <Text style={styles.chipText}>{label}</Text>
        </TouchableOpacity>
    );

    const ExpiringMemberItem = ({ member }) => {
        const daysLeft = Math.ceil((new Date(member.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return (
            <TouchableOpacity
                style={styles.expiringItem}
                onPress={() => navigation.navigate('MemberDetail', { memberId: member.id })}
                activeOpacity={0.7}
            >
                <View style={styles.expiringLeft}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.expiringName}>{member.name}</Text>
                        <Text style={styles.expiringPlan}>{member.plan} Plan</Text>
                    </View>
                </View>
                <View style={styles.expiringRight}>
                    <Text style={[styles.daysLeft, { color: daysLeft <= 3 ? colors.error : colors.warning }]}>
                        {daysLeft} days left
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ paddingHorizontal: spacing.l, paddingTop: spacing.m }}>
                    <View style={styles.header}>
                        <View>
                            <Text style={typography.h1}>Hello, Owner</Text>
                            <Text style={typography.bodySmall}>Welcome to GymDesk</Text>
                        </View>
                        <View style={styles.profilePlaceholder}><Text style={{ fontSize: 18 }}>👤</Text></View>
                    </View>
                </View>
                <DashboardSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.trialStrip} onPress={() => Alert.alert('Subscription', 'Go to subscription page')} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                    <Text style={{ fontSize: 16 }}>🔥</Text>
                    <Text style={styles.trialText}><Text style={{ fontWeight: '700' }}>Free Trial:</Text> {trialDaysLeft} days remaining</Text>
                </View>
                <View style={styles.subscribeBtn}>
                    <Text style={styles.subscribeText}>Subscribe</Text>
                    <ChevronRight size={14} color="#fff" />
                </View>
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={typography.h1}>Hello, {gym ? gym.owner_name.split(' ')[0] : 'Owner'}</Text>
                        <Text style={typography.bodySmall}>Welcome to GymDesk</Text>
                    </View>
                    <TouchableOpacity onPress={() => setMenuVisible(true)} activeOpacity={0.7}>
                        <View style={styles.profilePlaceholder}><Text style={{ fontSize: 18 }}>👤</Text></View>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                    <QuickAction icon={Plus} label="Add Member" onPress={() => navigation.navigate('AddMember')} />
                    <QuickAction icon={CreditCard} label="Record Payment" onPress={() => navigation.navigate('RecordPayment')} />
                    <QuickAction icon={BarChart3} label="Analytics" onPress={() => navigation.navigate('Analytics')} />
                    <QuickAction icon={Users} label="View All" onPress={() => navigation.navigate('MemberList')} />
                </ScrollView>

                <View style={styles.section}>
                    <Text style={typography.h2}>Overview</Text>
                    <View style={styles.metricsGrid}>
                        <Pressable style={({ pressed }) => [styles.metricCardWrapper, pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => navigation.navigate('MemberList')}>
                            <MetricCard title="Total Members" value={metrics.totalMembers} icon={UsersIcon} color={colors.text} />
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.metricCardWrapper, pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => navigation.navigate('MemberList', { filter: 'active' })}>
                            <MetricCard title="Active Members" value={metrics.activeMembers} icon={UserCheck} color={colors.success} />
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.metricCardWrapper, pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => navigation.navigate('MemberList', { filter: 'expiring' })}>
                            <MetricCard title="Expiring Soon" value={metrics.expiringSoon} subtitle="Next 7 days" icon={UserX} color={colors.warning} />
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.metricCardWrapper, pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => navigation.navigate('MemberList', { filter: 'all' })}>
                            <MetricCard title="New Joins" value={metrics.newJoins} subtitle="This month" icon={TrendingUp} color={colors.info} />
                        </Pressable>
                    </View>
                </View>

                {/* Expiring Soon List */}
                {expiringMembers.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={typography.h2}>Expiring Soon</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('MemberList', { filter: 'expiring' })}>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.card}>
                            {expiringMembers.map((member) => (
                                <ExpiringMemberItem key={member.id} member={member} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Monthly Joins Chart */}
                <View style={styles.section}>
                    <Text style={[typography.h2, { marginBottom: spacing.m }]}>Monthly Joins</Text>
                    <View style={styles.chartCard}>
                        <StackedBarChart
                            data={chartData}
                            width={screenWidth - spacing.l * 2 - spacing.m * 2}
                            height={220}
                            chartConfig={{
                                backgroundColor: colors.surface,
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                labelColor: (opacity = 1) => colors.textSecondary,
                                style: { borderRadius: 16 },
                                propsForBackgroundLines: {
                                    strokeDasharray: '', // solid lines
                                    stroke: colors.border,
                                    strokeOpacity: 0.1
                                },
                                barPercentage: 0.6,
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                            hideLegend={true}
                            formatYLabel={(y) => parseFloat(y).toFixed(0)}
                            segments={Math.max(Math.max(...(chartData.data || []).map(d => (d[0] || 0) + (d[1] || 0) + (d[2] || 0)), 1) <= 5 ? Math.max(...(chartData.data || []).map(d => (d[0] || 0) + (d[1] || 0) + (d[2] || 0)), 1) : 4)}
                        />

                        {/* Custom Legend */}
                        <View style={styles.legendContainer}>
                            {chartData.legend.map((label, index) => (
                                <View key={index} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: chartData.barColors[index] }]} />
                                    <Text style={styles.legendText}>{label}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ width: '100%', paddingHorizontal: spacing.xs }}>
                            <View style={styles.trendContainer}>
                                <Text style={styles.trendText}>
                                    Trending {trendPercentage >= 0 ? 'up' : 'down'} by {Math.abs(trendPercentage)}% this month
                                </Text>
                                <TrendingUp size={16} color={trendPercentage >= 0 ? colors.success : colors.error} />
                            </View>
                            <Text style={styles.trendSubtext}>Showing total joins for the last 6 months</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <ProfileMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onSignOut={handleSignOut} userName={gym?.owner_name} userEmail={user?.email} navigation={navigation} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.l, paddingTop: spacing.m, paddingBottom: spacing.xxl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l },
    profilePlaceholder: { width: 48, height: 48, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.small },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, height: 56, borderRadius: borderRadius.full, paddingHorizontal: spacing.l, marginBottom: spacing.l, gap: spacing.s, ...shadows.small },
    searchText: { flex: 1, color: colors.text, fontSize: 16 },
    chipsContainer: { marginBottom: spacing.m, flexDirection: 'row', paddingVertical: spacing.s },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, height: 40, borderRadius: borderRadius.full, paddingHorizontal: spacing.m, marginRight: spacing.s, gap: spacing.xs, ...shadows.small },
    chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
    section: { marginBottom: spacing.xl },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.m },
    metricCardWrapper: { width: '48%', marginBottom: spacing.m },
    trialStrip: { backgroundColor: colors.info, paddingVertical: spacing.s, paddingHorizontal: spacing.l, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadows.small },
    trialText: { color: '#fff', fontSize: 14 },
    subscribeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.s, paddingVertical: 4, borderRadius: borderRadius.full, gap: 4 },
    subscribeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.m },
    viewAllText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.m, ...shadows.small },
    expiringItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.s, borderBottomWidth: 1, borderBottomColor: colors.border },
    expiringLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    expiringName: { fontSize: 15, fontWeight: '600', color: colors.text },
    expiringPlan: { fontSize: 12, color: colors.textSecondary },
    expiringRight: { alignItems: 'flex-end' },
    daysLeft: { fontSize: 12, fontWeight: '600' },
    chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.m, ...shadows.small, alignItems: 'center' },
    trendContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.l, marginBottom: 4 },
    trendText: { fontSize: 14, fontWeight: '700', color: colors.text },
    trendSubtext: { fontSize: 12, color: colors.textSecondary },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.l, marginTop: spacing.m, marginBottom: spacing.s, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
});
