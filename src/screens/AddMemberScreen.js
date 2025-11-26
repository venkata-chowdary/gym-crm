import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { showToast } from '../components/Toast';

export default function AddMemberScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        planId: null, // Store plan ID
        joinDate: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            if (!user) return;
            const { data: gymData } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single();
            if (!gymData) return;

            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('gym_id', gymData.id)
                .order('created_at');

            if (error) throw error;
            setPlans(data || []);

            // Select first plan by default if available
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, planId: data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            showToast('Failed to load plans', 'error');
        } finally {
            setLoadingPlans(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }
        if (!formData.phone || formData.phone.length < 10) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.planId) {
            newErrors.plan = 'Please select a membership plan';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateExpiryDate = (joinDate, planId) => {
        const selectedPlan = plans.find(p => p.id === planId);
        if (!selectedPlan) return joinDate;

        const join = new Date(joinDate);
        const expiry = new Date(join);
        expiry.setDate(expiry.getDate() + selectedPlan.duration);
        return expiry.toISOString().split('T')[0];
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast('Please fix the errors and try again', 'warning');
            return;
        }

        setLoading(true);
        try {
            const { data: gymData, error: gymError } = await supabase
                .from('gyms')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (gymError) throw new Error('Could not find your gym. Please contact support.');
            if (!gymData) throw new Error('No gym found for your account.');

            const selectedPlan = plans.find(p => p.id === formData.planId);
            const expiryDate = calculateExpiryDate(formData.joinDate, formData.planId);

            // 1. Create Member
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .insert([{
                    gym_id: gymData.id,
                    name: formData.name.trim(),
                    email: formData.email.trim() || null,
                    phone: formData.phone.trim(),
                    plan: selectedPlan.name, // Store plan name for display
                    amount: selectedPlan.amount, // Store current amount
                    join_date: formData.joinDate,
                    expiry_date: expiryDate,
                    notes: formData.notes.trim() || null,
                }])
                .select()
                .single();

            if (memberError) throw memberError;

            // 2. Record Payment (Always)
            if (memberData) {
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert([{
                        member_id: memberData.id,
                        amount: selectedPlan.amount,
                        paid_on: formData.joinDate
                    }]);

                if (paymentError) {
                    console.error('Error recording payment:', paymentError);
                    showToast('Member added, but payment recording failed.', 'warning');
                }
            }

            showToast('Member added successfully!', 'success');
            setTimeout(() => {
                navigation.goBack();
            }, 500);
        } catch (error) {
            if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('members_phone_key')) {
                showToast('A member with this phone number already exists.', 'error');
            } else {
                showToast(error.message || 'Failed to add member', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const PlanOption = ({ plan }) => (
        <TouchableOpacity
            style={[styles.planOption, formData.planId === plan.id && styles.planOptionActive]}
            onPress={() => setFormData({ ...formData, planId: plan.id })}
        >
            <View style={[styles.planRadio, formData.planId === plan.id && styles.planRadioActive]}>
                {formData.planId === plan.id && <View style={styles.planRadioInner} />}
            </View>
            <View>
                <Text style={[styles.planLabel, formData.planId === plan.id && styles.planLabelActive]}>
                    {plan.name}
                </Text>
                <Text style={styles.planSubtext}>₹{plan.amount} • {plan.duration} Days</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h1}>Add Member</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Name *</Text>
                    <Input placeholder="Enter member name" value={formData.name} onChangeText={(text) => { setFormData({ ...formData, name: text }); if (errors.name) setErrors({ ...errors, name: null }); }} error={errors.name} />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone *</Text>
                    <Input placeholder="Enter phone number" value={formData.phone} onChangeText={(text) => { setFormData({ ...formData, phone: text }); if (errors.phone) setErrors({ ...errors, phone: null }); }} keyboardType="phone-pad" error={errors.phone} />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email (Optional)</Text>
                    <Input placeholder="Enter email address" value={formData.email} onChangeText={(text) => { setFormData({ ...formData, email: text }); if (errors.email) setErrors({ ...errors, email: null }); }} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Membership Plan *</Text>
                    {loadingPlans ? (
                        <Text style={{ color: colors.textSecondary }}>Loading plans...</Text>
                    ) : plans.length === 0 ? (
                        <Text style={{ color: colors.error }}>No plans found. Please create plans in Settings.</Text>
                    ) : (
                        <View style={styles.planContainer}>
                            {plans.map((plan) => (<PlanOption key={plan.id} plan={plan} />))}
                        </View>
                    )}
                    {errors.plan && <Text style={{ color: colors.error, marginTop: 4 }}>{errors.plan}</Text>}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Join Date *</Text>
                    <View style={styles.dateInput}>
                        <Calendar size={20} color={colors.textSecondary} />
                        <Text style={styles.dateText}>{new Date(formData.joinDate).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.helperText}>
                        Expiry: {formData.planId ? new Date(calculateExpiryDate(formData.joinDate, formData.planId)).toLocaleDateString() : '-'}
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes (Optional)</Text>
                    <TextInput style={styles.notesInput} placeholder="Add any additional notes..." placeholderTextColor={colors.textTertiary} value={formData.notes} onChangeText={(text) => setFormData({ ...formData, notes: text })} multiline numberOfLines={4} textAlignVertical="top" />
                </View>

                <Button label="Add Member" onPress={handleSubmit} loading={loading} style={styles.submitButton} />
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.l, paddingBottom: spacing.m },
    headerButton: { width: 40, height: 40, borderRadius: borderRadius.m, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.small },
    content: { padding: spacing.l, paddingTop: 0 },
    formGroup: { marginBottom: spacing.l },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.s },
    planContainer: { gap: spacing.s },
    planOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.m, borderRadius: borderRadius.m, borderWidth: 2, borderColor: 'transparent', ...shadows.small },
    planOptionActive: { borderColor: colors.primary, backgroundColor: 'rgba(26, 26, 26, 0.1)' },
    planRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, marginRight: spacing.s, alignItems: 'center', justifyContent: 'center' },
    planRadioActive: { borderColor: colors.primary },
    planRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    planLabel: { fontSize: 15, color: colors.text },
    planLabelActive: { fontWeight: '600', color: colors.primary },
    planSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.m, borderRadius: borderRadius.m, gap: spacing.s, ...shadows.small },
    dateText: { fontSize: 15, color: colors.text },
    helperText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
    notesInput: { backgroundColor: colors.surface, borderRadius: borderRadius.m, padding: spacing.m, fontSize: 15, color: colors.text, minHeight: 100, borderWidth: 1, borderColor: colors.border },
    submitButton: { marginTop: spacing.m },
    cancelButton: { alignItems: 'center', padding: spacing.m, marginTop: spacing.s },
    cancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
});
