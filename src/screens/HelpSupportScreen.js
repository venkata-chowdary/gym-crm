import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ArrowLeft, Mail, Clock, MessageCircle } from 'lucide-react-native';

export default function HelpSupportScreen({ navigation }) {
    const theme = useTheme();
    const { colors, spacing, borderRadius, typography, shadows } = theme || {};

    if (!colors) {
        return <View><Text>Loading...</Text></View>;
    }

    const handleEmailPress = () => {
        Linking.openURL('mailto:chowdaryimmanni@gmail.com');
    };

    const styles = getStyles(colors, spacing, borderRadius, typography, shadows);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={typography.h2}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Contact Us</Text>
                    <Text style={styles.cardDescription}>
                        Have questions, feedback, or facing issues? Reach out to us directly.
                    </Text>

                    <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                        <View style={styles.iconContainer}>
                            <Mail size={24} color={colors.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Email Support</Text>
                            <Text style={styles.contactValue}>chowdaryimmanni@gmail.com</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <View style={styles.contactItem}>
                        <View style={styles.iconContainer}>
                            <Clock size={24} color={colors.secondary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Support Hours</Text>
                            <Text style={styles.contactValue}>Mon - Fri, 10 AM – 6 PM IST</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>About Support</Text>
                    <Text style={styles.infoText}>
                        We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please mark your email subject as "Urgent".
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors, spacing, borderRadius, typography, shadows) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.l,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        ...shadows.medium,
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.s,
        color: colors.text,
    },
    cardDescription: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.m,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.m,
    },
    infoSection: {
        marginTop: spacing.xl,
        padding: spacing.m,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoText: {
        ...typography.body,
        color: colors.textTertiary,
        lineHeight: 20,
    },
});
