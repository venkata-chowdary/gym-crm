import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { ArrowLeft, Calendar, Check, ChevronDown, Search, X } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { showToast } from '../components/Toast';

export default function RecordPaymentScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Auto-calculated fields
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Start Date (Today)
    const [expiryDate, setExpiryDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [planModalVisible, setPlanModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            if (!user) return;
            const { data: gymData } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single();
            if (!gymData) return;

            // Fetch Members
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('id, name, plan, amount')
                .eq('gym_id', gymData.id)
                .order('name');

            if (membersError) throw membersError;
            setMembers(membersData || []);

            // Fetch Plans
            const { data: plansData, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .eq('gym_id', gymData.id)
                .order('created_at');

            if (plansError) throw plansError;
            setPlans(plansData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load data', 'error');
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setAmount(plan.amount.toString());

        // Calculate Expiry
        const start = new Date(date);
        const expiry = new Date(start);
        expiry.setDate(expiry.getDate() + plan.duration);
        setExpiryDate(expiry.toISOString().split('T')[0]);

        setPlanModalVisible(false);
    };

    const handleSubmit = async () => {
        if (!selectedMember) {
            showToast('Please select a member', 'warning');
            return;
        }
        if (!selectedPlan) {
            showToast('Please select a plan', 'warning');
            return;
        }

        setLoading(true);
        try {
            // 1. Record Payment
            const { error: paymentError } = await supabase
                .from('payments')
                .insert([{
                    member_id: selectedMember.id,
                    amount: Number(amount),
                    paid_on: date
                }]);

            if (paymentError) throw paymentError;

            // 2. Update Member Expiry & Plan
            const { error: memberError } = await supabase
                .from('members')
                .update({
                    plan: selectedPlan.name,
                    amount: Number(amount),
                    expiry_date: expiryDate
                })
                .eq('id', selectedMember.id);

            if (memberError) throw memberError;

            showToast('Payment recorded & Member updated!', 'success');
            setTimeout(() => navigation.goBack(), 500);
        } catch (error) {
            showToast(error.message || 'Failed to record payment', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectMember = (member) => {
        setSelectedMember(member);
        setMemberModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h2}>Record Payment</Text>
            </View>

            <View style={styles.content}>
                {/* Member Selector */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Member</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setMemberModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.selectorText, !selectedMember && { color: colors.textTertiary }]}>
                            {selectedMember ? selectedMember.name : 'Select Member'}
                        </Text>
                        <ChevronDown size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Plan Selector */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Plan</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setPlanModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.selectorText, !selectedPlan && { color: colors.textTertiary }]}>
                            {selectedPlan ? `${selectedPlan.name} (₹${selectedPlan.amount})` : 'Select Plan'}
                        </Text>
                        <ChevronDown size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Read-only / Auto-calculated fields */}
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Input
                            label="Amount (₹)"
                            value={amount}
                            editable={false}
                            placeholder="0.00"
                        />
                    </View>
                    <View style={{ width: spacing.m }} />
                    <View style={{ flex: 1 }}>
                        <Input
                            label="Start Date"
                            value={date}
                            editable={false} // Can make editable if needed, but requirement said 'Today'
                        />
                    </View>
                </View>

                <Input
                    label="New Expiry Date"
                    value={expiryDate}
                    editable={false}
                    placeholder="YYYY-MM-DD"
                    leftIcon={<Calendar size={20} color={colors.textSecondary} />}
                />

                <View style={{ marginTop: spacing.xl }}>
                    <Button
                        title="Save Payment"
                        onPress={handleSubmit}
                        loading={loading}
                    />
                </View>
            </View>

            {/* Member Selection Modal */}
            <Modal
                visible={memberModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={typography.h3}>Select Member</Text>
                        <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalSearch}>
                        <Search size={20} color={colors.textSecondary} />
                        <TextInput
                            style={styles.modalSearchInput}
                            placeholder="Search members..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    <FlatList
                        data={filteredMembers}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.memberItem}
                                onPress={() => selectMember(item)}
                            >
                                <View>
                                    <Text style={styles.memberName}>{item.name}</Text>
                                    <Text style={styles.memberPlan}>{item.plan} • ₹{item.amount}</Text>
                                </View>
                                {selectedMember?.id === item.id && <Check size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ padding: spacing.m }}
                    />
                </SafeAreaView>
            </Modal>

            {/* Plan Selection Modal */}
            <Modal
                visible={planModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={typography.h3}>Select Plan</Text>
                        <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={plans}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.memberItem}
                                onPress={() => handlePlanSelect(item)}
                            >
                                <View>
                                    <Text style={styles.memberName}>{item.name}</Text>
                                    <Text style={styles.memberPlan}>₹{item.amount} • {item.duration} Days</Text>
                                </View>
                                {selectedPlan?.id === item.id && <Check size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ padding: spacing.m }}
                        ListEmptyComponent={
                            <View style={{ padding: spacing.l, alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary }}>No plans found. Please create plans in Settings.</Text>
                            </View>
                        }
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.l, gap: spacing.m },
    backButton: { padding: spacing.xs },
    content: { padding: spacing.l },
    formGroup: { marginBottom: spacing.l },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.m, paddingHorizontal: spacing.m, height: 50 },
    selectorText: { fontSize: 16, color: colors.text },
    row: { flexDirection: 'row' },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, margin: spacing.m, paddingHorizontal: spacing.m, height: 48, borderRadius: borderRadius.m, borderWidth: 1, borderColor: colors.border, gap: spacing.s },
    modalSearchInput: { flex: 1, fontSize: 16, color: colors.text },
    memberItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.m, borderBottomWidth: 1, borderBottomColor: colors.border },
    memberName: { fontSize: 16, fontWeight: '600', color: colors.text },
    memberPlan: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
});
