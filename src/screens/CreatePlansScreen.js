import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { ArrowRight, Plus, Trash2, X, ArrowLeft } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { showToast } from '../components/Toast';

export default function CreatePlansScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [gymId, setGymId] = useState(null);

    // Form State
    const [planName, setPlanName] = useState('');
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchGymId();
    }, []);

    const fetchGymId = async () => {
        try {
            if (!user) return;
            const { data, error } = await supabase
                .from('gyms')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setGymId(data.id);
                fetchPlans(data.id);
            }
        } catch (error) {
            console.error('Error fetching gym:', error);
            showToast('Failed to load gym details', 'error');
        }
    };

    const fetchPlans = async (id) => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('gym_id', id)
                .order('created_at');

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const handleAddPlan = async () => {
        if (!planName || !amount || !duration) {
            Alert.alert('Missing Fields', 'Please fill in all fields');
            return;
        }

        setAdding(true);
        try {
            const { error } = await supabase
                .from('plans')
                .insert([{
                    gym_id: gymId,
                    name: planName,
                    amount: Number(amount),
                    duration: Number(duration)
                }]);

            if (error) throw error;

            showToast('Plan added successfully', 'success');
            setModalVisible(false);
            resetForm();
            fetchPlans(gymId);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDeletePlan = async (id) => {
        try {
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPlans(gymId);
        } catch (error) {
            showToast('Failed to delete plan', 'error');
        }
    };

    const resetForm = () => {
        setPlanName('');
        setAmount('');
        setDuration('');
    };

    const handleContinue = () => {
        if (plans.length === 0) {
            Alert.alert('No Plans', 'Please create at least one plan to continue.');
            return;
        }
        navigation.navigate('PendingVerification');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={typography.h1}>Create Plans</Text>
                    <Text style={styles.subtitle}>Set up membership plans for your gym.</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {plans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No plans added yet.</Text>
                        <Text style={styles.emptySubtext}>Add plans like "Monthly", "Yearly" etc.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={plans}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.planItem}>
                                <View>
                                    <Text style={styles.planName}>{item.name}</Text>
                                    <Text style={styles.planDetails}>₹{item.amount} • {item.duration} Days</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeletePlan(item.id)}>
                                    <Trash2 size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: spacing.l }}
                    />
                )}

                <Button
                    title="Add New Plan"
                    onPress={() => setModalVisible(true)}
                    variant="outline"
                    icon={<Plus size={20} color={colors.primary} />}
                    style={{ marginTop: spacing.m }}
                />
            </View>

            <View style={styles.footer}>
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    icon={<ArrowRight size={20} color={colors.background} />}
                    iconPosition="right"
                />
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={typography.h3}>Add Plan</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <Input
                            label="Plan Name"
                            placeholder="e.g. Monthly Gold"
                            value={planName}
                            onChangeText={setPlanName}
                        />
                        <Input
                            label="Amount (₹)"
                            placeholder="1000"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />
                        <Input
                            label="Duration (Days)"
                            placeholder="30"
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                        />

                        <Button
                            title="Save Plan"
                            onPress={handleAddPlan}
                            loading={adding}
                            style={{ marginTop: spacing.l }}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.l, paddingBottom: spacing.m },
    backButton: { width: 40, height: 40, borderRadius: borderRadius.m, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.small },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    content: { flex: 1, padding: spacing.l },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    emptyText: { ...typography.h3, color: colors.textSecondary, marginBottom: spacing.s },
    emptySubtext: { ...typography.body, color: colors.textTertiary },
    planItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.m, borderRadius: borderRadius.m, marginBottom: spacing.m, ...shadows.small },
    planName: { ...typography.h4, color: colors.text },
    planDetails: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
    footer: { padding: spacing.l, borderTopWidth: 1, borderTopColor: colors.border },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalContent: { padding: spacing.l, gap: spacing.m },
});
