import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { User, Settings, CreditCard, LogOut } from 'lucide-react-native';

export default function ProfileMenu({ visible, onClose, onSignOut, userEmail, userName, navigation }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.menuContainer}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.avatar}>
                                    <Text style={{ fontSize: 20 }}>👤</Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={[typography.body, { fontWeight: '600' }]} numberOfLines={1}>
                                        {userName || 'User'}
                                    </Text>
                                    <Text style={typography.bodySmall} numberOfLines={1}>
                                        {userEmail || 'email@example.com'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Menu Items */}
                            <MenuItem icon={User} label="View Profile" onPress={() => { onClose(); navigation.navigate('Profile'); }} />
                            <MenuItem icon={Settings} label="Settings" onPress={() => { onClose(); navigation.navigate('Settings'); }} />
                            <MenuItem icon={CreditCard} label="Subscription" onPress={() => { onClose(); }} />

                            <View style={styles.divider} />

                            <MenuItem
                                icon={LogOut}
                                label="Sign Out"
                                onPress={() => {
                                    onClose();
                                    setTimeout(onSignOut, 200); // Small delay to allow modal to close
                                }}
                                isDestructive
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const MenuItem = ({ icon: Icon, label, onPress, isDestructive }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Icon size={20} color={isDestructive ? colors.error : colors.text} />
        <Text style={[styles.menuItemText, isDestructive && { color: colors.error }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 100, // Approximate header height + status bar
        paddingRight: spacing.m,
    },
    menuContainer: {
        width: 280,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.large,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
    },
    userInfo: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.s,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s + 4,
        gap: spacing.m,
    },
    menuItemText: {
        ...typography.body,
        fontSize: 15,
        fontWeight: '500',
    },
});
