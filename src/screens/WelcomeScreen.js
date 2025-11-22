import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';

export default function WelcomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={typography.h1}>GymDesk</Text>
                    <Text style={[typography.body, styles.tagline]}>
                        Simple CRM for small gyms.{'\n'}Track members & renewals easily.
                    </Text>
                </View>

                <View style={styles.actions}>
                    <Button
                        title="Sign In"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.button}
                    />
                    <Button
                        title="Don't have an account? Sign up"
                        variant="ghost"
                        onPress={() => navigation.navigate('Signup')}
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
        justifyContent: 'space-between',
    },
    header: {
        marginTop: spacing.xxxl,
        alignItems: 'center',
    },
    tagline: {
        textAlign: 'center',
        marginTop: spacing.m,
        color: colors.textSecondary,
    },
    actions: {
        marginBottom: spacing.xl,
        gap: spacing.m,
    },
    button: {
        marginBottom: spacing.s,
    },
});
