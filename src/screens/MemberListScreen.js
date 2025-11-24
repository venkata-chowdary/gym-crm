import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { Search, Plus, Phone, Mail, Edit2, UserX, UserCheck } from 'lucide-react-native';
import { MemberCardSkeleton } from '../components/SkeletonLoader';
import { showToast } from '../components/Toast';

export default function MemberListScreen({ navigation, route }) {
    const user = useAuthStore((state) => state.user);
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState(route.params?.filter || 'all');

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchMembers();
            if (route.params?.searchQuery) {
                setSearchQuery(route.params.searchQuery);
                navigation.setParams({ searchQuery: null }); // Clear param so it doesn't persist
            }
        });
        return unsubscribe;
    }, [navigation, route.params]);

    useEffect(() => {
        filterMembers();
    }, [searchQuery, activeFilter, members]);

    const fetchMembers = async (isRefreshing = false) => {
        try {
            if (!user) return;

            if (!isRefreshing) setLoading(true);

            const { data: gymData, error: gymError } = await supabase
                .from('gyms')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (gymError || !gymData) {
                console.error('Could not find gym:', gymError);
                if (!isRefreshing) showToast('Could not load members', 'error');
                return;
            }

            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('gym_id', gymData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setMembers(data || []);
            if (isRefreshing) showToast('Members refreshed', 'success', 2000);
        } catch (error) {
            showToast(error.message || 'Failed to load members', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMembers(true);
    };

    const filterMembers = () => {
        let filtered = [...members];

        if (searchQuery) {
            filtered = filtered.filter(member =>
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.phone?.includes(searchQuery)
            );
        }

        const today = new Date().toISOString().split('T')[0];
        const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (activeFilter === 'active') {
            filtered = filtered.filter(m => m.expiry_date >= today);
        } else if (activeFilter === 'expiring') {
            filtered = filtered.filter(m => m.expiry_date >= today && m.expiry_date <= sevenDaysLater);
        } else if (activeFilter === 'expired') {
            filtered = filtered.filter(m => m.expiry_date < today);
        }

        setFilteredMembers(filtered);
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={typography.h1}>Members</Text>
                <Text style={typography.bodySmall}>{filteredMembers.length} total</Text>
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

            {loading ? (
                <View style={[styles.listContent, { paddingTop: spacing.m }]}>
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                    <MemberCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredMembers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <MemberCard member={item} />}
                    contentContainerStyle={
                        filteredMembers.length === 0
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
    header: { padding: spacing.l, paddingBottom: spacing.m },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.l, marginBottom: spacing.m, paddingHorizontal: spacing.m, height: 48, borderRadius: borderRadius.m, borderWidth: 1, borderColor: colors.border, gap: spacing.s, ...shadows.small },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filterContainer: { paddingLeft: spacing.l, marginBottom: spacing.xs, height: 36 },
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
