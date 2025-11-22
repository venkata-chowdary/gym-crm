import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function PendingVerificationScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        setLoading(true);
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('gym_owners')
                .select('status, trial_start_date')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data.status === 'approved') {
                navigation.replace('Dashboard');
            } else {
                Alert.alert('Status', 'Your account is still under review.');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={typography.h1}>Under Review</Text>
                    <Text style={[typography.body, styles.message]}>
                        Your gym registration is currently under review by our admin team.
                    </Text>
                    <Text style={[typography.body, styles.message]}>
                        Once approved, you will get a 7-day free trial to start adding members and tracking renewals.
                    </Text>
                </View>

                <Button
                    title="Check Status"
                    onPress={checkStatus}
                    loading={loading}
                    style={styles.button}
                />

                <Button
                    title="Sign Out"
                    variant="ghost"
                    onPress={async () => {
                        await supabase.auth.signOut();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: spacing.l,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    message: {
        textAlign: 'center',
        marginTop: spacing.m,
        color: colors.textSecondary,
    },
    button: {
        marginTop: spacing.l,
        width: '100%',
    },
});
