import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { ArrowLeft, Edit2, LogOut, Mail, Phone, MapPin, Building, User } from 'lucide-react-native';
import Input from '../components/Input';
import { showToast } from '../components/Toast';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ProfileScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [ownerName, setOwnerName] = useState('');
    const [phone, setPhone] = useState('');
    const [gymName, setGymName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [trialDaysLeft, setTrialDaysLeft] = useState(0);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            if (!user) return;

            const { data: ownerData, error: ownerError } = await supabase
                .from('gym_owners')
                .select('*')
                .eq('id', user.id)
                .single();

            if (ownerError) throw ownerError;

            const { data: gymData, error: gymError } = await supabase
                .from('gyms')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (gymError) throw gymError;

            setOwnerName(ownerData.owner_name || '');
            setPhone(ownerData.phone || '');
            setGymName(gymData.gym_name || '');
            setAddress(gymData.address || '');
            setCity(gymData.city || '');
            setPincode(gymData.pincode || '');

            // Calculate trial days
            if (ownerData.trial_start_date) {
                const start = new Date(ownerData.trial_start_date);
                const now = new Date();
                // Reset time to ensure we count full calendar days
                start.setHours(0, 0, 0, 0);
                now.setHours(0, 0, 0, 0);

                const diffTime = now - start;
                const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                setTrialDaysLeft(Math.max(7 - daysPassed, 0));
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
            showToast('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!ownerName || !gymName || !phone) {
            showToast('Name, Gym Name and Phone are required', 'warning');
            return;
        }

        setSaving(true);
        try {
            // Update Owner
            const { error: ownerError } = await supabase
                .from('gym_owners')
                .update({ owner_name: ownerName, phone: phone })
                .eq('id', user.id);

            if (ownerError) throw ownerError;

            // Update Gym
            const { error: gymError } = await supabase
                .from('gyms')
                .update({
                    gym_name: gymName,
                    address: address,
                    city: city,
                    pincode: pincode
                })
                .eq('owner_id', user.id);

            if (gymError) throw gymError;

            showToast('Profile updated successfully', 'success');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out', style: 'destructive', onPress: async () => {
                    await supabase.auth.signOut();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            }
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={typography.h2}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ProfileSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h2}>Profile</Text>
                <TouchableOpacity
                    onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                    style={styles.editButton}
                    disabled={saving}
                >
                    {isEditing ? (
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
                    ) : (
                        <Edit2 size={20} color={colors.text} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.card}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={{ fontSize: 32 }}>👤</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={typography.h2}>{ownerName || 'User'}</Text>
                            <Text style={styles.email}>{user?.email}</Text>
                            <View style={[styles.badge, trialDaysLeft === 0 && { backgroundColor: colors.error + '20' }]}>
                                <Text style={[styles.badgeText, trialDaysLeft === 0 && { color: colors.error }]}>
                                    {trialDaysLeft > 0 ? `Trial Active (${trialDaysLeft} days left)` : 'Trial Expired'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Personal Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <View style={styles.formCard}>
                        {isEditing ? (
                            <>
                                <Input label="Full Name" value={ownerName} onChangeText={setOwnerName} placeholder="Enter your name" icon={<User size={20} color={colors.textSecondary} />} />
                                <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" icon={<Phone size={20} color={colors.textSecondary} />} />
                            </>
                        ) : (
                            <>
                                <DetailRow icon={User} label="Full Name" value={ownerName} />
                                <DetailRow icon={Mail} label="Email" value={user?.email} />
                                <DetailRow icon={Phone} label="Phone" value={phone} />
                            </>
                        )}
                    </View>
                </View>

                {/* Gym Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gym Details</Text>
                    <View style={styles.formCard}>
                        {isEditing ? (
                            <>
                                <Input label="Gym Name" value={gymName} onChangeText={setGymName} placeholder="Enter gym name" icon={<Building size={20} color={colors.textSecondary} />} />
                                <Input label="Address" value={address} onChangeText={setAddress} placeholder="Enter address" icon={<MapPin size={20} color={colors.textSecondary} />} />
                                <View style={{ flexDirection: 'row', gap: spacing.m }}>
                                    <View style={{ flex: 1 }}>
                                        <Input label="City" value={city} onChangeText={setCity} placeholder="City" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Input label="Pincode" value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="numeric" />
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <DetailRow icon={Building} label="Gym Name" value={gymName} />
                                <DetailRow icon={MapPin} label="Address" value={`${address}, ${city} - ${pincode}`} multiline />
                            </>
                        )}
                    </View>
                </View>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <LogOut size={20} color={colors.error} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const DetailRow = ({ icon: Icon, label, value, multiline }) => (
    <View style={styles.detailRow}>
        <View style={styles.iconBox}>
            <Icon size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={multiline ? undefined : 1}>{value || '-'}</Text>
        </View>
    </View>
);

const ProfileSkeleton = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card Skeleton */}
        <View style={styles.card}>
            <View style={styles.avatarContainer}>
                <SkeletonLoader width={64} height={64} borderRadiusValue={32} />
                <View style={{ flex: 1 }}>
                    <SkeletonLoader width={150} height={24} style={{ marginBottom: spacing.xs }} />
                    <SkeletonLoader width={200} height={16} style={{ marginBottom: spacing.s }} />
                    <SkeletonLoader width={100} height={20} borderRadiusValue={borderRadius.s} />
                </View>
            </View>
        </View>

        {/* Personal Details Skeleton */}
        <View style={styles.section}>
            <SkeletonLoader width={120} height={20} style={{ marginBottom: spacing.m, marginLeft: spacing.xs }} />
            <View style={styles.formCard}>
                <View style={{ gap: spacing.l }}>
                    <SkeletonLoader width="100%" height={24} />
                    <SkeletonLoader width="100%" height={24} />
                    <SkeletonLoader width="100%" height={24} />
                </View>
            </View>
        </View>

        {/* Gym Details Skeleton */}
        <View style={styles.section}>
            <SkeletonLoader width={100} height={20} style={{ marginBottom: spacing.m, marginLeft: spacing.xs }} />
            <View style={styles.formCard}>
                <View style={{ gap: spacing.l }}>
                    <SkeletonLoader width="100%" height={24} />
                    <SkeletonLoader width="100%" height={40} />
                </View>
            </View>
        </View>
    </ScrollView>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: spacing.xs },
    editButton: { padding: spacing.xs },
    content: { padding: spacing.l },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.l, marginBottom: spacing.xl, ...shadows.small },
    avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
    email: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    badge: { backgroundColor: colors.primary + '20', paddingHorizontal: spacing.s, paddingVertical: 4, borderRadius: borderRadius.s, alignSelf: 'flex-start', marginTop: spacing.s },
    badgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.m, marginLeft: spacing.xs },
    formCard: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.m, ...shadows.small },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingVertical: spacing.s, borderBottomWidth: 1, borderBottomColor: colors.border + '40' },
    iconBox: { width: 36, height: 36, borderRadius: borderRadius.m, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center' },
    detailLabel: { fontSize: 12, color: colors.textSecondary },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500', marginTop: 2 },
    signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s, backgroundColor: colors.error + '10', padding: spacing.m, borderRadius: borderRadius.m, marginTop: spacing.m },
    signOutText: { color: colors.error, fontSize: 16, fontWeight: '600' },
    versionText: { textAlign: 'center', color: colors.textTertiary, fontSize: 12, marginTop: spacing.xl },
});
