import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();

    const settingsItems = [
        { label: 'Tipos de Atividade', icon: 'extension-puzzle-outline', route: 'ActivityTypes' },
        { label: 'Níveis de Graduação', icon: 'ribbon-outline', route: 'Graduações' },
        { label: 'Configurações de Conta', icon: 'settings-outline', route: 'ProfileScreen' }
    ];

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Configurações</Text>
            </View>

            <View style={{ padding: 16 }}>
                {settingsItems.map((item, index) => (
                    <TouchableOpacity key={index} onPress={() => navigation.navigate(item.route)} activeOpacity={0.7}>
                        <Card style={styles.card}>
                            <View style={styles.cardContent}>
                                <Ionicons name={item.icon as any} size={24} color="#4F46E5" style={styles.icon} />
                                <Text style={styles.cardLabel}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    card: { marginBottom: 12, paddingVertical: 14 },
    cardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    icon: { marginRight: 16 },
    cardLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#374151' }
});
