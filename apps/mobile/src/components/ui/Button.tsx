import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

export function Button({ title, loading, variant = 'primary', style, ...rest }: ButtonProps) {
    const stylesMap = {
        primary: { bg: '#4F46E5', text: '#FFF', border: 'transparent' },
        outline: { bg: 'transparent', text: '#4F46E5', border: '#4F46E5' },
        ghost: { bg: 'transparent', text: '#6B7280', border: 'transparent' },
        danger: { bg: '#FEE2E2', text: '#991B1B', border: 'transparent' },
    };
    const theme = stylesMap[variant];

    return (
        <TouchableOpacity
            style={[
                styles.base,
                { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: variant === 'outline' ? 1 : 0 },
                rest.disabled && styles.disabled,
                style
            ]}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#FFF' : '#4F46E5'} />
            ) : (
                <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: { padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    disabled: { opacity: 0.6 },
    text: { fontWeight: 'bold', fontSize: 16 },
});
