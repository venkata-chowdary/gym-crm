import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

// TripGlide Aesthetic: High Contrast, Soft Shadows, Heavy Rounding

const palette = {
    // Brand
    black: '#1a1a1a',
    pureBlack: '#000000',
    darkGray: '#333333',
    white: '#ffffff',
    offWhite: '#f2f2f2',
    lightGray: '#f8f8f8',

    // Text
    gray600: '#666666',
    gray400: '#999999',

    // Status
    green: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b',
    blue: '#3b82f6',
};

export const lightColors = {
    mode: 'light',
    primary: palette.black,
    primaryDark: palette.pureBlack,
    primaryLight: palette.darkGray,

    background: palette.offWhite,
    surface: palette.white,
    surfaceHighlight: palette.lightGray,

    text: palette.black,
    textSecondary: palette.gray600,
    textTertiary: palette.gray400,

    border: '#e5e5e5',
    borderFocus: palette.black,

    success: palette.green,
    error: palette.red,
    warning: palette.amber,
    info: palette.blue,

    overlay: 'rgba(0, 0, 0, 0.4)',

    // Specific UI elements
    cardBackground: palette.white,
    inputBackground: palette.white,
};

export const darkColors = {
    mode: 'dark',
    primary: palette.white, // In dark mode, primary actions are often white/bright
    primaryDark: '#cccccc',
    primaryLight: '#444444',

    background: '#000000', // Pure black background for OLED
    surface: '#121212', // Dark gray for cards
    surfaceHighlight: '#1e1e1e',

    text: '#ffffff',
    textSecondary: '#a1a1aa', // Zinc 400
    textTertiary: '#52525b', // Zinc 600

    border: '#27272a', // Zinc 800
    borderFocus: '#ffffff',

    success: '#34d399', // Brighter green
    error: '#f87171', // Brighter red
    warning: '#fbbf24',
    info: '#60a5fa',

    overlay: 'rgba(0, 0, 0, 0.7)',

    // Specific UI elements
    cardBackground: '#121212',
    inputBackground: '#1e1e1e',
};

// Deprecated: Backwards compatibility until full refactor
export const colors = lightColors;

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const borderRadius = {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    full: 9999,
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.s,
    },
    button: {
        fontSize: 16,
        fontWeight: '600',
    },
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
    },
};

export const useTheme = () => {
    const themeMode = useThemeStore((state) => state.themeMode);
    const systemScheme = useColorScheme();

    const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && systemScheme === 'dark');

    const activeColors = isDark ? darkColors : lightColors;

    if (!activeColors) {
        console.error('useTheme: activeColors is undefined', { isDark, themeMode });
    }

    return {
        colors: activeColors,
        spacing,
        borderRadius,
        typography: {
            ...typography,
            h1: { ...typography.h1, color: activeColors.text },
            h2: { ...typography.h2, color: activeColors.text },
            h3: { ...typography.h3, color: activeColors.text },
            h4: { ...typography.h4, color: activeColors.text },
            body: { ...typography.body, color: activeColors.text },
            bodySmall: { ...typography.bodySmall, color: activeColors.textSecondary },
            label: { ...typography.label, color: activeColors.text },
            button: { ...typography.button, color: isDark ? activeColors.background : '#ffffff' },
        },
        shadows,
        isDark,
        themeMode
    };
};
