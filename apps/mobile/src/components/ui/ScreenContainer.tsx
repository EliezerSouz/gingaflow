import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Platform } from 'react-native';

interface ScreenContainerProps {
    children: React.ReactNode;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
    return (
        <SafeAreaView style={styles.container}>
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 16
    }
});
