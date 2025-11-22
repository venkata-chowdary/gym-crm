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
    const [selectedMember, setSelectedMember] = useState(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            if (!user) return;
            const { data: gymData } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single();
            if (!gymData) return;

            const { data, error } = await supabase
                .from('members')
                .select('id, name, plan, amount')
                .eq('gym_id', gymData.id)
                .order('name');

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            showToast('Failed to load members', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!selectedMember) {
            showToast('Please select a member', 'warning');
            return;
        }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            showToast('Please enter a valid amount', 'warning');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('payments')
                .insert([{
                    member_id: selectedMember.id,
                    amount: Number(amount),
                    paid_on: date
                }]);

            if (error) throw error;

            showToast('Payment recorded successfully!', 'success');
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
        setAmount(member.amount?.toString() || '');
        setModalVisible(false);
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
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Member</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.selectorText, !selectedMember && { color: colors.textTertiary }]}>
                            {selectedMember ? selectedMember.name : 'Select Member'}
                        </Text>
                        <ChevronDown size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Input
                    label="Amount"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    keyboardType="numeric"
                    leftIcon={<Text style={{ fontSize: 16, color: colors.textSecondary, marginRight: 8 }}>₹</Text>}
                />

                <Input
                    label="Date"
                    value={date}
                    onChangeText={setDate}
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

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={typography.h3}>Select Member</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
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
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, margin: spacing.m, paddingHorizontal: spacing.m, height: 48, borderRadius: borderRadius.m, borderWidth: 1, borderColor: colors.border, gap: spacing.s },
    modalSearchInput: { flex: 1, fontSize: 16, color: colors.text },
    memberItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.m, borderBottomWidth: 1, borderBottomColor: colors.border },
    memberName: { fontSize: 16, fontWeight: '600', color: colors.text },
    memberPlan: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
});
