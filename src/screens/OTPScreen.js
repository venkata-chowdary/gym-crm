import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function OTPScreen({ route, navigation }) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const setSession = useAuthStore((state) => state.setSession);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit code.');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup',
            });

            if (error) throw error;

            setSession(data.session);
            // Navigate to Gym Details to complete profile
            navigation.navigate('GymDetails');
        } catch (error) {
            Alert.alert('Verification Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });
            if (error) throw error;
            Alert.alert('OTP Resent', 'Please check your email.');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={typography.h1}>Verify Email</Text>
                    <Text style={[typography.body, styles.subtitle]}>
                        Enter the 6-digit code sent to {email}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="OTP Code"
                        placeholder="123456"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <Button
                        title="Verify"
                        onPress={handleVerify}
                        loading={loading}
                        disabled={otp.length !== 6}
                        style={styles.button}
                    />

                    <Button
                        title="Resend OTP"
                        variant="ghost"
                        onPress={handleResend}
                    />
                </View>
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
