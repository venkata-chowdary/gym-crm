import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { ArrowLeft, Edit2, Save, X, Trash2, Calendar, Mail, Phone, FileText, User } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { MemberDetailSkeleton } from '../components/SkeletonLoader';
import { showToast } from '../components/Toast';

export default function MemberDetailScreen({ route, navigation }) {
    const { memberId } = route.params;
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        plan: 'monthly',
        notes: '',
    });
    const [errors, setErrors] = useState({});

    const plans = [
        { value: 'monthly', label: 'Monthly', duration: 30 },
        { value: 'quarterly', label: 'Quarterly (3 months)', duration: 90 },
        { value: 'annual', label: 'Annual (12 months)', duration: 365 },
    ];

    useEffect(() => {
        fetchMemberDetails();
    }, [memberId]);

    const fetchMemberDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', memberId)
                .single();

            if (error) throw error;

            if (!data) {
                showToast('Member not found', 'error');
                navigation.goBack();
                return;
            }

            setMember(data);
            setFormData({
                name: data.name,
                email: data.email || '',
                phone: data.phone || '',
                plan: data.plan,
                notes: data.notes || '',
            });
        } catch (error) {
            showToast(error.message || 'Failed to load member', 'error');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            return { label: 'Expired', color: colors.error, bgColor: colors.error + '20' };
        } else if (daysLeft <= 7) {
            return { label: 'Expiring Soon', color: colors.warning, bgColor: colors.warning + '20' };
        } else {
            return { label: 'Active', color: colors.success, bgColor: colors.success + '20' };
        }
    };

    const calculateExpiryDate = (joinDate, plan) => {
        const selectedPlan = plans.find(p => p.value === plan);
        const join = new Date(joinDate);
        const expiry = new Date(join);
        expiry.setDate(expiry.getDate() + selectedPlan.duration);
        return expiry.toISOString().split('T')[0];
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix the errors and try again');
            return;
        }

        setSaving(true);
        try {
            // If plan changed, recalculate expiry date
            let updateData = {
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim(),
                plan: formData.plan,
                notes: formData.notes.trim() || null,
            };

            // Recalculate expiry if plan changed
            if (formData.plan !== member.plan) {
                updateData.expiry_date = calculateExpiryDate(member.join_date, formData.plan);
            }

            const { data, error } = await supabase
                .from('members')
                .update(updateData)
                .eq('id', memberId)
                .select()
                .single();

            if (error) throw error;

            setMember(data);
            setIsEditing(false);
            showToast('Member updated successfully!', 'success');
        } catch (error) {
            if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('members_phone_key')) {
                showToast('A member with this phone number already exists.', 'error');
            } else {
                showToast(error.message || 'Failed to update member', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Member',
            `Are you sure you want to delete ${member?.name}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: confirmDelete
                }
            ]
        );
    };

    const confirmDelete = async () => {
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            showToast('Member deleted successfully', 'success');
            setTimeout(() => navigation.goBack(), 500);
        } catch (error) {
            showToast(error.message || 'Failed to delete member', 'error');
        }
    };

    const PlanOption = ({ plan }) => (
        <TouchableOpacity
            style={[
                styles.planOption,
                formData.plan === plan.value && styles.planOptionActive,
            ]}
            onPress={() => setFormData({ ...formData, plan: plan.value })}
            disabled={!isEditing}
        >
            <View style={[
                styles.planRadio,
                formData.plan === plan.value && styles.planRadioActive,
            ]}>
                {formData.plan === plan.value && <View style={styles.planRadioInner} />}
            </View>
            <Text style={[
                styles.planLabel,
                formData.plan === plan.value && styles.planLabelActive,
            ]}>
                {plan.label}
            </Text>
        </TouchableOpacity>
    );

    if (loading || !member) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={typography.h1}>Member Details</Text>
                    <View style={styles.headerButton} />
                </View>
                <MemberDetailSkeleton />
            </SafeAreaView>
        );
    }

    const status = getStatusInfo(member.expiry_date);
    const daysLeft = Math.ceil((new Date(member.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h1}>Member Details</Text>
                <TouchableOpacity
                    onPress={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                    style={styles.headerButton}
                >
                    {isEditing ? (
                        <X size={24} color={colors.text} />
                    ) : (
                        <Edit2 size={24} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Member Info Header */}
                <View style={styles.memberHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <User size={40} color={colors.textSecondary} />
                    </View>
                    {isEditing ? (
                        <View style={styles.formGroup}>
                            <Input
                                placeholder="Enter member name"
                                value={formData.name}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, name: text });
                                    if (errors.name) setErrors({ ...errors, name: null });
                                }}
                                error={errors.name}
                            />
                        </View>
                    ) : (
                        <Text style={styles.memberName}>{member.name}</Text>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    {isEditing ? (
                        <>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Phone *</Text>
                                <Input
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, phone: text });
                                        if (errors.phone) setErrors({ ...errors, phone: null });
                                    }}
                                    keyboardType="phone-pad"
                                    error={errors.phone}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email (Optional)</Text>
                                <Input
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, email: text });
                                        if (errors.email) setErrors({ ...errors, email: null });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={errors.email}
                                />
                            </View>
                        </>
                    ) : (
                        <View style={styles.infoCard}>
                            {member.phone && (
                                <View style={styles.infoRow}>
                                    <Phone size={20} color={colors.textSecondary} />
                                    <Text style={styles.infoText}>{member.phone}</Text>
                                </View>
                            )}
                            {member.email && (
                                <View style={styles.infoRow}>
                                    <Mail size={20} color={colors.textSecondary} />
                                    <Text style={styles.infoText}>{member.email}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Membership Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Membership Details</Text>
                    <View style={styles.infoCard}>
                        {isEditing ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Membership Plan *</Text>
                                <View style={styles.planContainer}>
                                    {plans.map((plan) => (
                                        <PlanOption key={plan.value} plan={plan} />
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoRow}>
                                <FileText size={20} color={colors.textSecondary} />
                                <Text style={styles.infoText}>
                                    {plans.find(p => p.value === member.plan)?.label || member.plan}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Calendar size={20} color={colors.textSecondary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Joined</Text>
                                <Text style={styles.infoText}>{new Date(member.join_date).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Calendar size={20} color={colors.textSecondary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Expires</Text>
                                <Text style={styles.infoText}>{new Date(member.expiry_date).toLocaleDateString()}</Text>
                                {daysLeft >= 0 && (
                                    <Text style={[styles.infoSubtext, { color: status.color }]}>
                                        {daysLeft} days remaining
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Add any additional notes..."
                            placeholderTextColor={colors.textTertiary}
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    ) : (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>
                                {member.notes || 'No notes added'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                {isEditing ? (
                    <View style={styles.actionsContainer}>
                        <Button
                            label="Save Changes"
                            onPress={handleSave}
                            loading={saving}
                            style={styles.saveButton}
                        />
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setIsEditing(false);
                                setFormData({
                                    name: member.name,
                                    email: member.email || '',
                                    phone: member.phone || '',
                                    plan: member.plan,
                                    notes: member.notes || '',
                                });
                                setErrors({});
                            }}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.dangerZone}>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDelete}
                        >
                            <Trash2 size={20} color={colors.error} />
                            <Text style={styles.deleteText}>Delete Member</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.l, paddingBottom: spacing.m },
    headerButton: { width: 40, height: 40, borderRadius: borderRadius.m, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.small },
    content: { padding: spacing.l, paddingTop: 0 },

    memberHeader: { alignItems: 'center', marginBottom: spacing.xl },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.m, ...shadows.small },
    memberName: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.s },
    statusBadge: { paddingHorizontal: spacing.m, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    statusText: { fontSize: 13, fontWeight: '600' },

    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.m },
    infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.m, gap: spacing.m, ...shadows.small },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
    infoLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    infoText: { fontSize: 15, color: colors.text, flex: 1 },
    infoSubtext: { fontSize: 12, marginTop: 2 },

    formGroup: { marginBottom: spacing.m, width: '100%' },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.s },

    planContainer: { gap: spacing.s },
    planOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.m, borderRadius: borderRadius.m, borderWidth: 2, borderColor: 'transparent', ...shadows.small },
    planOptionActive: { borderColor: colors.primary, backgroundColor: 'rgba(26, 26, 26, 0.05)' },
    planRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, marginRight: spacing.s, alignItems: 'center', justifyContent: 'center' },
    planRadioActive: { borderColor: colors.primary },
    planRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    planLabel: { fontSize: 15, color: colors.text },
    planLabelActive: { fontWeight: '600', color: colors.primary },

    notesInput: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.m, fontSize: 15, color: colors.text, minHeight: 100, ...shadows.small },

    actionsContainer: { marginTop: spacing.m },
    saveButton: { marginBottom: spacing.m },
    cancelButton: { alignItems: 'center', padding: spacing.m },
    cancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },

    dangerZone: { marginTop: spacing.xl, paddingTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.m, backgroundColor: colors.error + '10', borderRadius: borderRadius.l, gap: spacing.s },
    deleteText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
