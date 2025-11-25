import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
    const { colors, isDark } = useTheme();
    const setThemeMode = useThemeStore((state) => state.setThemeMode);

    // Animation values
    const translateX = useRef(new Animated.Value(0)).current;

    const options = [
        { key: 'light', icon: Sun, label: 'Light' },
        { key: 'dark', icon: Moon, label: 'Dark' },
    ];

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: isDark ? 1 : 0,
            useNativeDriver: true,
            friction: 7,
            tension: 60,
        }).start();
    }, [isDark]);

    const CONTAINER_WIDTH = 200;
    const ITEM_WIDTH = (CONTAINER_WIDTH - 8) / 2;

    return (
        <View style={[styles.container, { backgroundColor: colors.surfaceHighlight, width: CONTAINER_WIDTH }]}>
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        width: ITEM_WIDTH,
                        backgroundColor: colors.surface,
                        transform: [{
                            translateX: translateX.interpolate({
                                inputRange: [0, 1],
                                outputRange: [4, 4 + ITEM_WIDTH]
                            })
                        }]
                    }
                ]}
            />

            {options.map((option) => {
                const Icon = option.icon;
                // Determine active state based on isDark boolean
                const isActive = (option.key === 'dark' && isDark) || (option.key === 'light' && !isDark);

                return (
                    <TouchableOpacity
                        key={option.key}
                        style={styles.option}
                        onPress={() => setThemeMode(option.key)}
                        activeOpacity={0.8}
                    >
                        <Icon
                            size={18}
                            color={isActive ? colors.text : colors.textSecondary}
                            strokeWidth={2.5}
                        />
                        <Text style={[
                            styles.label,
                            { color: isActive ? colors.text : colors.textSecondary }
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 44,
        borderRadius: 999,
        padding: 4,
        position: 'relative',
        alignSelf: 'center',
    },
    indicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 0,
        borderRadius: 999,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        zIndex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    }
});
