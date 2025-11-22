import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const setSession = useAuthStore((state) => state.setSession);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            setSession(data.session);

            // Check Owner Status
            const { data: owner } = await supabase
                .from('gym_owners')
                .select('status')
                .eq('id', data.session.user.id)
                .single();

            if (owner) {
                if (owner.status === 'approved') {
                    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
                } else if (owner.status === 'pending_verification') {
                    navigation.reset({ index: 0, routes: [{ name: 'PendingVerification' }] });
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'GymDetails' }] });
                }
            } else {
                navigation.reset({ index: 0, routes: [{ name: 'GymDetails' }] });
            }

        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={typography.h1}>Hello,{'\n'}Welcome Back</Text>
                    <Text style={[typography.body, styles.subtitle]}>
                        Sign in to manage your gym.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <Input
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.button}
                    />

                    <Button
                        title="Create an account"
                        variant="ghost"
                        onPress={() => navigation.navigate('Signup')}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface, // White background for clean look
    },
    content: {
        flex: 1,
        padding: spacing.l,
        justifyContent: 'center',
    },
    header: {
        marginBottom: spacing.xxl,
    },
    subtitle: {
        marginTop: spacing.s,
        color: colors.textSecondary,
    },
    form: {
        gap: spacing.m,
    },
    button: {
        marginTop: spacing.m,
    },
});
