export const COLORS = {
    primary: '#1B4965',
    secondary: '#62B6CB',
    accent: '#5FA8D3',
    background: '#CAE9FF',
    surface: '#FFFFFF',
    text: {
        primary: '#1B4965',
        secondary: '#62B6CB',
        white: '#FFFFFF',
        dark: '#0C2233',
    },
    status: {
        success: '#43AA8B',
        error: '#F94144',
        warning: '#F9C74F',
    },
    border: '#BEE9E8',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const FONTS = {
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5.84,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 6.84,
        elevation: 5,
    },
};

export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 999,
};

export const commonStyles = {
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        padding: SPACING.md,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginVertical: SPACING.sm,
        ...SHADOWS.small,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: FONTS.sizes.md,
        color: COLORS.text.dark,
        marginBottom: SPACING.sm,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
    },
    secondaryButton: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
        ...SHADOWS.small,
    },
    buttonText: {
        color: COLORS.text.white,
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
    },
    title: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text.primary,
        marginBottom: SPACING.md,
    },
    subtitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.medium,
        color: COLORS.text.secondary,
        marginBottom: SPACING.sm,
    },
};

export const getHeaderStyle = (elevated = true) => ({
    height: 64,
    backgroundColor: elevated ? COLORS.primary : 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    ...(elevated ? SHADOWS.medium : {}),
});

export const getScoreCardStyle = (rank) => ({
    ...commonStyles.card,
    backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : COLORS.surface,
    ...SHADOWS.medium,
});