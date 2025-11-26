import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { supabase } from '../services/supabase';
import Button from '../components/Button';

export default function ChangePasswordScreen({ navigation }) {
    const { colors, spacing, borderRadius, typography, shadows } = useTheme();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const calculateStrength = (password) => {
        let score = 0;
        if (!password) return 0;
        if (password.length > 6) score += 1;
        if (password.length > 10) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        return score;
    };

    const getStrengthColor = (score) => {
        if (score === 0) return 'transparent';
        if (score <= 2) return colors.error;
        if (score === 3) return '#FFC107'; // Amber/Yellow
        return colors.success || '#4CAF50'; // Green
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            // Verify old password by signing in
            const { data: { user } } = await supabase.auth.getUser();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPassword,
            });

            if (signInError) {
                Alert.alert('Error', 'Incorrect old password.');
                setLoading(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            Alert.alert('Success', 'Password changed successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const styles = getStyles(colors, spacing, borderRadius, typography, shadows);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h2}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Old Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter old password"
                                    placeholderTextColor={colors.textTertiary}
                                    secureTextEntry
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter new password"
                                    placeholderTextColor={colors.textTertiary}
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                            </View>
                            <View style={styles.strengthMeter}>
                                <View style={[styles.strengthBar, {
                                    width: `${(calculateStrength(newPassword) / 4) * 100}%`,
                                    backgroundColor: getStrengthColor(calculateStrength(newPassword))
                                }]} />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={20} color={colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={colors.textTertiary}
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>

                        <Button
                            label="Change Password"
                            onPress={handleChangePassword}
                            loading={loading}
                            style={styles.submitButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (colors, spacing, borderRadius, typography, shadows) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: spacing.xs },
    content: { padding: spacing.l },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, padding: spacing.l, ...shadows.medium },
    formGroup: { marginBottom: spacing.l },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.s },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.m, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.m },
    inputIcon: { marginRight: spacing.s },
    input: { flex: 1, paddingVertical: spacing.m, fontSize: 15, color: colors.text },
    strengthMeter: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: spacing.s, overflow: 'hidden' },
    strengthBar: { height: '100%', borderRadius: 2 },
    submitButton: { marginTop: spacing.s },
});
