import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../components/ui/Card';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen() {
    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Relatórios</Text>
            </View>

            <View style={styles.cardContainer}>
                <Card style={styles.card}>
                    <Ionicons name="stats-chart-outline" size={48} color="#4F46E5" />
                    <Text style={styles.cardTitle}>Desempenho Geral</Text>
                    <Text style={styles.cardText}>Visualize o crescimento de alunos, turmas e faturamento mensal.</Text>
                </Card>

                <Card style={styles.card}>
                    <Ionicons name="people-outline" size={48} color="#10B981" />
                    <Text style={styles.cardTitle}>Presenças e Avaliação</Text>
                    <Text style={styles.cardText}>Relatórios de frequência de alunos e evolução acadêmica.</Text>
                </Card>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    cardContainer: { padding: 16, gap: 16 },
    card: { alignItems: 'center', padding: 24 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 },
    cardText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }
});
