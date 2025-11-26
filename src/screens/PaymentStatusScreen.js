import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { CheckCircle, XCircle } from 'lucide-react-native';

export default function PaymentStatusScreen({ route, navigation }) {
    const { colors, spacing, typography, borderRadius } = useTheme();
    // The deep link might pass params like ?status=success&payment_id=...
    // But Instamojo redirect usually contains payment_id and payment_status
    const { payment_id, payment_status } = route.params || {};

    const isSuccess = payment_status === 'Credit' || payment_status === 'success'; // Adjust based on actual Instamojo return

    useEffect(() => {
        // Optionally verify status with backend here if needed
    }, []);

    const handleContinue = () => {
        if (isSuccess) {
            // Navigate to Dashboard and reset stack
            navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
            });
        } else {
            // Go back to plans
            navigation.navigate('SubscriptionPlans');
        }
    };

    const styles = getStyles(colors, spacing, typography, borderRadius);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {isSuccess ? (
                    <CheckCircle size={80} color={colors.success} />
                ) : (
                    <XCircle size={80} color={colors.error} />
                )}

                <Text style={styles.title}>
                    {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                </Text>

                <Text style={styles.message}>
                    {isSuccess
                        ? 'Your subscription is now active. You can start managing your gym.'
                        : 'Something went wrong with the payment. Please try again.'}
                </Text>

                {payment_id && (
                    <Text style={styles.refText}>Ref: {payment_id}</Text>
                )}

                <TouchableOpacity style={styles.button} onPress={handleContinue}>
                    <Text style={styles.buttonText}>
                        {isSuccess ? 'Go to Dashboard' : 'Try Again'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (colors, spacing, typography, borderRadius) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: spacing.l,
        marginBottom: spacing.s,
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    refText: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: spacing.l,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.m,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.white,
    },
});
