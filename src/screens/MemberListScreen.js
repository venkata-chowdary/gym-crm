import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { Search, Plus, Phone, Mail, Edit2, UserX, UserCheck, ArrowLeft } from 'lucide-react-native';
import { MemberCardSkeleton } from '../components/SkeletonLoader';
import { showToast } from '../components/Toast';

const PAGE_SIZE = 15;

export default function MemberListScreen({ navigation, route }) {
    const user = useAuthStore((state) => state.user);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState(route.params?.filter || 'all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [gymId, setGymId] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    // Initial Gym Fetch
    useEffect(() => {
        const fetchGymId = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('gyms')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (data) {
                setGymId(data.id);
            }
        };
        fetchGymId();
    }, [user]);

    // Fetch Members when dependencies change
    useEffect(() => {
        if (gymId) {
            fetchMembers(0, true);
        }
    }, [gymId, activeFilter, searchQuery]);

    // Handle Focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (route.params?.searchQuery) {
                setSearchQuery(route.params.searchQuery);
                navigation.setParams({ searchQuery: null });
            } else if (gymId) {
                // Optional: Refresh on focus if needed, but might be redundant with the above useEffect
                // fetchMembers(0, true); 
                // Let's rely on the user pulling to refresh or explicit changes for now to avoid double fetches,
                // OR just silent refresh.
                fetchMembers(0, true);
            }
        });
        return unsubscribe;
    }, [navigation, route.params, gymId]);

    const fetchMembers = async (pageNumber = 0, shouldRefresh = false) => {
        try {
            if (!gymId) return;

            if (shouldRefresh) {
                setLoading(true);
                setPage(0);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            let query = supabase
                .from('members')
                .select('*', { count: 'exact' })
                .eq('gym_id', gymId)
                .order('created_at', { ascending: false });

            // Apply Filters
            const today = new Date().toISOString().split('T')[0];
            const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            if (activeFilter === 'active') {
                query = query.gte('expiry_date', today);
            } else if (activeFilter === 'expiring') {
                query = query.gte('expiry_date', today).lte('expiry_date', sevenDaysLater);
            } else if (activeFilter === 'expired') {
                query = query.lt('expiry_date', today);
            }

            // Apply Search
            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }

            // Pagination
            const from = pageNumber * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            if (shouldRefresh) {
                setMembers(data || []);
                setTotalCount(count || 0);
            } else {
                setMembers(prev => [...prev, ...(data || [])]);
            }

            if ((data || []).length < PAGE_SIZE) {
                setHasMore(false);
            }

        } catch (error) {
            console.error('Error fetching members:', error);
            showToast('Failed to load members', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMembers(0, true);
    };

    const loadMore = () => {
        if (!loadingMore && !loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMembers(nextPage, false);
        }
    };

    const getStatusInfo = (expiryDate) => {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (expiryDate < today) {
            return { label: 'Expired', color: colors.error, icon: UserX };
        } else if (expiryDate <= sevenDaysLater) {
            return { label: 'Expiring Soon', color: colors.warning, icon: UserX };
        } else {
            return { label: 'Active', color: colors.success, icon: UserCheck };
        }
    };

    const FilterChip = ({ label, value, active }) => (
        <TouchableOpacity
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => setActiveFilter(value)}
        >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const MemberCard = ({ member }) => {
        const status = getStatusInfo(member.expiry_date);
        const StatusIcon = status.icon;

        return (
            <TouchableOpacity
                style={styles.memberCard}
                onPress={() => navigation.navigate('MemberDetail', { memberId: member.id })}
            >
                <View style={styles.memberCardHeader}>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberPlan}>{member.plan} Plan</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                        <StatusIcon size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>
                            {status.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.memberCardBody}>
                    {member.phone && (
                        <View style={styles.contactInfo}>
                            <Phone size={14} color={colors.textSecondary} />
                            <Text style={styles.contactText}>{member.phone}</Text>
                        </View>
                    )}
                    {member.email && (
                        <View style={styles.contactInfo}>
                            <Mail size={14} color={colors.textSecondary} />
                            <Text style={styles.contactText}>{member.email}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.memberCardFooter}>
                    <Text style={styles.expiryText}>
                        Expires: {new Date(member.expiry_date).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('MemberDetail', { memberId: member.id });
                        }}
                    >
                        <Edit2 size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const EmptyState = () => {
        const emptyStates = {
            all: {
                title: 'No members yet',
                message: 'Add your first member to get started',
                showButton: true,
            },
            active: {
                title: 'No active members',
                message: 'All memberships have expired. Add new members or renew existing ones.',
                showButton: true,
            },
            expiring: {
                title: 'No members expiring soon',
                message: 'Great! All memberships are either active for a while or already expired.',
                showButton: false,
            },
            expired: {
                title: 'No expired memberships',
                message: 'Excellent! All your members have active memberships.',
                showButton: false,
            },
        };

        const state = emptyStates[activeFilter] || emptyStates.all;

        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>{state.title}</Text>
                <Text style={styles.emptyStateText}>{state.message}</Text>
                {state.showButton && (
                    <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => navigation.navigate('AddMember')}
                    >
                        <Plus size={20} color="#fff" />
                        <Text style={styles.emptyStateButtonText}>Add Member</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: spacing.m }}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={typography.h1}>Members</Text>
                    <Text style={styles.headerSubtitle}>{totalCount} total</Text>
                </View>
            </View>

            <View style={styles.searchBar}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email, or phone"
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                <FilterChip label="All" value="all" active={activeFilter === 'all'} />
                <FilterChip label="Active" value="active" active={activeFilter === 'active'} />
                <FilterChip label="Expiring" value="expiring" active={activeFilter === 'expiring'} />
                <FilterChip label="Expired" value="expired" active={activeFilter === 'expired'} />
            </ScrollView>

            {loading && !refreshing ? (
                <View style={[styles.listContent, { paddingTop: spacing.m }]}>
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={members}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <MemberCard member={item} />}
                    contentContainerStyle={
                        members.length === 0
                            ? [styles.listContent, styles.emptyListContent]
                            : styles.listContent
                    }
                    ListEmptyComponent={<EmptyState />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            )}

            {members.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddMember')}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.l, paddingBottom: spacing.m },
    headerTitleContainer: { marginLeft: spacing.m, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.m,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    backButton: { width: 40, height: 40, borderRadius: borderRadius.m, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.small },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.l, marginBottom: spacing.m, paddingHorizontal: spacing.m, height: 48, borderRadius: borderRadius.m, borderWidth: 1, borderColor: colors.border, gap: spacing.s, ...shadows.small },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filterContainer: { paddingLeft: spacing.l, marginBottom: spacing.xs, height: 50, paddingVertical: spacing.xs },
    filterChip: { paddingHorizontal: spacing.m, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surface, marginRight: spacing.s, height: 32, justifyContent: 'center', ...shadows.small },
    filterChipActive: { backgroundColor: colors.primary },
    filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    filterChipTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: spacing.l, paddingTop: spacing.m, paddingBottom: spacing.l },
    emptyListContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    memberCard: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.m, marginBottom: spacing.m, ...shadows.small },
    memberCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.s },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 2 },
    memberPlan: { fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.s, paddingVertical: 4, borderRadius: borderRadius.s, gap: 4 },
    statusText: { fontSize: 11, fontWeight: '600' },
    memberCardBody: { gap: spacing.xs, marginBottom: spacing.s },
    contactInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    contactText: { fontSize: 13, color: colors.textSecondary },
    memberCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.s },
    expiryText: { fontSize: 12, color: colors.textTertiary },
    editButton: { padding: spacing.xs },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
    emptyStateTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    emptyStateText: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' },
    emptyStateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.l, paddingVertical: spacing.m, borderRadius: borderRadius.full, gap: spacing.xs },
    emptyStateButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    fab: { position: 'absolute', bottom: spacing.xl, right: spacing.l, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.large },
});
