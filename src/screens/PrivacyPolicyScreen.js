import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen({ navigation }) {
    const theme = useTheme();
    console.log('PrivacyPolicyScreen theme:', Object.keys(theme));
    const { colors, spacing, typography } = theme;

    if (!colors) {
        return <View><Text>Loading theme...</Text></View>;
    }

    const styles = getStyles(colors, spacing, typography);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h2}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.text}>
                    Last updated: November 25, 2024{'\n\n'}
                    1. Introduction{'\n'}
                    Welcome to GymDesk. We respect your privacy and are committed to protecting your personal data.{'\n\n'}
                    2. Data We Collect{'\n'}
                    We may collect personal identification information (Name, email address, phone number, etc.) and other data necessary for the operation of the service.{'\n\n'}
                    3. How We Use Your Data{'\n'}
                    We use your data to provide and improve our services, communicate with you, and comply with legal obligations.{'\n\n'}
                    4. Data Security{'\n'}
                    We implement appropriate security measures to protect your personal data.{'\n\n'}
                    5. Contact Us{'\n'}
                    If you have any questions about this Privacy Policy, please contact us.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors, spacing, typography) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: spacing.xs },
    content: { padding: spacing.l },
    text: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
});
