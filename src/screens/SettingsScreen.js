import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { ArrowLeft, Bell, ChevronRight, CreditCard, FileText, HelpCircle, Lock, LogOut, Moon, Shield, Trash2, User } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

export default function SettingsScreen({ navigation }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [paymentReminders, setPaymentReminders] = useState(true);
    const [newMemberAlerts, setNewMemberAlerts] = useState(true);

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

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is irreversible and all your data will be lost.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account logic') }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h2}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Appearance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={Moon}
                            label="Dark Mode"
                            type="toggle"
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                        />
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={CreditCard}
                            label="Payment Reminders"
                            type="toggle"
                            value={paymentReminders}
                            onValueChange={setPaymentReminders}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={Bell}
                            label="New Member Alerts"
                            type="toggle"
                            value={newMemberAlerts}
                            onValueChange={setNewMemberAlerts}
                        />
                    </View>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={Lock}
                            label="Change Password"
                            type="link"
                            onPress={() => Alert.alert('Coming Soon', 'Change password functionality will be available soon.')}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={Trash2}
                            label="Delete Account"
                            type="link"
                            textColor={colors.error}
                            iconColor={colors.error}
                            onPress={handleDeleteAccount}
                        />
                    </View>
                </View>

                {/* Support & About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support & About</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={HelpCircle}
                            label="Help & Support"
                            type="link"
                            onPress={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={Shield}
                            label="Privacy Policy"
                            type="link"
                            onPress={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={FileText}
                            label="Terms of Service"
                            type="link"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>GymDesk v1.0.0</Text>
                    <Text style={styles.copyrightText}>© 2024 GymDesk</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const SettingItem = ({ icon: Icon, label, type, value, onValueChange, onPress, textColor, iconColor }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={type === 'link' ? onPress : undefined}
        disabled={type === 'toggle'}
        activeOpacity={0.7}
    >
        <View style={styles.settingLeft}>
            <View style={[styles.iconBox, iconColor && { backgroundColor: iconColor + '10' }]}>
                <Icon size={20} color={iconColor || colors.textSecondary} />
            </View>
            <Text style={[styles.settingLabel, textColor && { color: textColor }]}>{label}</Text>
        </View>

        {type === 'toggle' ? (
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
            />
        ) : (
            <ChevronRight size={20} color={colors.textTertiary} />
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: spacing.xs },
    content: { padding: spacing.l },
    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.s, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, overflow: 'hidden', ...shadows.small },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.m },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
    iconBox: { width: 36, height: 36, borderRadius: borderRadius.m, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { fontSize: 16, color: colors.text, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 }, // Indent divider to align with text
    footer: { alignItems: 'center', paddingBottom: spacing.xl },
    versionText: { color: colors.textTertiary, fontSize: 14, fontWeight: '500' },
    copyrightText: { color: colors.textTertiary, fontSize: 12, marginTop: 4 },
});
