import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsOfUseScreen({ navigation }) {
    const theme = useTheme();
    console.log('TermsOfUseScreen theme:', Object.keys(theme));
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
                <Text style={typography.h2}>Terms of Use</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.text}>
                    Last updated: November 25, 2024{'\n\n'}
                    1. Acceptance of Terms{'\n'}
                    By accessing and using GymDesk, you accept and agree to be bound by the terms and provision of this agreement.{'\n\n'}
                    2. Use License{'\n'}
                    Permission is granted to temporarily download one copy of the materials (information or software) on GymDesk's website for personal, non-commercial transitory viewing only.{'\n\n'}
                    3. Disclaimer{'\n'}
                    The materials on GymDesk's website are provided "as is". GymDesk makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.{'\n\n'}
                    4. Limitations{'\n'}
                    In no event shall GymDesk or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GymDesk's website.{'\n\n'}
                    5. Governing Law{'\n'}
                    Any claim relating to GymDesk's website shall be governed by the laws of the State without regard to its conflict of law provisions.
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
