// TripGlide Aesthetic: High Contrast, Soft Shadows, Heavy Rounding

export const colors = {
    // Brand Colors
    primary: '#1a1a1a', // Black - Strong, premium
    primaryDark: '#000000',
    primaryLight: '#333333',

    // Neutral / Grayscale
    background: '#f2f2f2', // Light Gray background
    surface: '#ffffff', // Pure white cards
    surfaceHighlight: '#f8f8f8',

    text: '#1a1a1a', // Almost black
    textSecondary: '#666666', // Medium gray
    textTertiary: '#999999', // Light gray placeholders

    border: '#e5e5e5',
    borderFocus: '#1a1a1a',

    // Status Colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',

    overlay: 'rgba(0, 0, 0, 0.4)',
};

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
    l: 24, // Standard card radius
    xl: 32,
    full: 9999, // Pill shape
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
        color: colors.text,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.textSecondary,
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
    },
    button: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
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
