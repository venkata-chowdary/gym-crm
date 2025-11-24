import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function GymDetailsScreen({ navigation }) {
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        gymName: '',
        address: '',
        city: '',
        pincode: '',
        ownerName: '',
        phone: '',
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Basic validation
        if (Object.values(formData).some(val => !val)) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            if (!user) throw new Error('No authenticated user found');

            // 1. Create Owner Record
            const { error: ownerError } = await supabase
                .from('gym_owners')
                .insert({
                    id: user.id,
                    owner_name: formData.ownerName,
                    phone: formData.phone,
                    status: 'pending_verification',
                });

            if (ownerError) throw ownerError;

            // 2. Create Gym Record
            const { error: gymError } = await supabase
                .from('gyms')
                .insert({
                    owner_id: user.id,
                    gym_name: formData.gymName,
                    address: formData.address,
                    city: formData.city,
                    pincode: formData.pincode,
                    status: 'pending',
                });

            if (gymError) throw gymError;

            navigation.navigate('CreatePlans');
        } catch (error) {
            Alert.alert('Error', error.message);
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
                        <Text style={typography.h1}>Gym Details</Text>
                        <Text style={[typography.body, styles.subtitle]}>
                            Tell us about your gym.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Gym Name"
                            placeholder="e.g. Iron Paradise"
                            value={formData.gymName}
                            onChangeText={(v) => updateField('gymName', v)}
                        />
                        <Input
                            label="Owner Name"
                            placeholder="Your Full Name"
                            value={formData.ownerName}
                            onChangeText={(v) => updateField('ownerName', v)}
                        />
                        <Input
                            label="Phone Number"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChangeText={(v) => updateField('phone', v)}
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Address"
                            placeholder="Street Address"
                            value={formData.address}
                            onChangeText={(v) => updateField('address', v)}
                        />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="City"
                                    placeholder="City"
                                    value={formData.city}
                                    onChangeText={(v) => updateField('city', v)}
                                />
                            </View>
                            <View style={{ width: spacing.m }} />
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Pincode"
                                    placeholder="123456"
                                    value={formData.pincode}
                                    onChangeText={(v) => updateField('pincode', v)}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <Button
                            title="Complete Setup"
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.button}
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
        marginTop: spacing.s,
        marginBottom: spacing.l,
    },
    subtitle: {
        marginTop: spacing.s,
        color: colors.textSecondary,
    },
    form: {
        gap: spacing.s,
    },
    row: {
        flexDirection: 'row',
    },
    button: {
        marginTop: spacing.m,
        marginBottom: spacing.xl,
    },
});
