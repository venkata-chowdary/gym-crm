import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';
import { borderRadius, colors, shadows, spacing } from '../theme';

let toastRef = null;

export const showToast = (message, type = 'success', duration = 3000) => {
    if (toastRef) {
        toastRef.show(message, type, duration);
    }
};

export default function Toast() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('success');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(-100));

    useEffect(() => {
        toastRef = {
            show: (msg, toastType, duration) => {
                setMessage(msg);
                setType(toastType);
                setVisible(true);

                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        tension: 50,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                ]).start();

                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(slideAnim, {
                            toValue: -100,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                    ]).start(() => setVisible(false));
                }, duration);
            },
        };

        return () => {
            toastRef = null;
        };
    }, []);

    if (!visible) return null;

    const getToastStyle = () => {
        switch (type) {
            case 'success':
                return { backgroundColor: colors.success, icon: CheckCircle };
            case 'error':
                return { backgroundColor: colors.error, icon: XCircle };
            case 'warning':
                return { backgroundColor: colors.warning, icon: AlertCircle };
            case 'info':
                return { backgroundColor: colors.info, icon: Info };
            default:
                return { backgroundColor: colors.success, icon: CheckCircle };
        }
    };

    const toastStyle = getToastStyle();
    const Icon = toastStyle.icon;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: toastStyle.backgroundColor,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Icon size={20} color="#fff" />
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: spacing.l,
        right: spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderRadius: borderRadius.l,
        gap: spacing.s,
        zIndex: 9999,
        ...shadows.large,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
