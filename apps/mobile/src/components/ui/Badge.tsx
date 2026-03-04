import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
    color?: string;
}

export function Badge({ label, variant = 'neutral', color }: BadgeProps) {
    const stylesMap = {
        success: { bg: '#DCFCE7', text: '#166534' },
        warning: { bg: '#FEF3C7', text: '#92400E' },
        danger: { bg: '#FEE2E2', text: '#991B1B' },
        info: { bg: '#DBEAFE', text: '#1E40AF' },
        neutral: { bg: '#F3F4F6', text: '#374151' },
    };
    const theme = stylesMap[variant] || stylesMap.neutral;

    const bg = color ? `${color}20` : theme.bg;
    const text = color || theme.text;

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <Text style={[styles.text, { color: text }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start' },
    text: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
});
