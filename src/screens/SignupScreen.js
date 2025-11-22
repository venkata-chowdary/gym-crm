import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function SignupScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';
        if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                // Email confirmation disabled or auto-confirmed
                useAuthStore.getState().setSession(data.session);
                navigation.navigate('GymDetails');
            } else {
                // Email confirmation required
                navigation.navigate('OTP', { email });
            }
        } catch (error) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={typography.h1}>Create Account</Text>
                        <Text style={[typography.body, styles.subtitle]}>
                            Start managing your gym today.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="gym@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={errors.email}
                        />
                        <Input
                            label="Password"
                            placeholder="••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            error={errors.password}
                        />
                        <Input
                            label="Confirm Password"
                            placeholder="••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            error={errors.confirmPassword}
                        />

                        <Button
                            title="Sign Up"
                            onPress={handleSignup}
                            loading={loading}
                            style={styles.button}
                        />

                        <Button
                            title="Already have an account? Sign In"
                            variant="ghost"
                            onPress={() => navigation.navigate('Login')}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        padding: spacing.l,
    },
    header: {
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    subtitle: {
        marginTop: spacing.s,
        color: colors.textSecondary,
    },
    form: {
        gap: spacing.s,
    },
    button: {
        marginTop: spacing.m,
    },
});
