import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../components/ui/Card';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Ionicons } from '@expo/vector-icons';

export default function FinancialScreen() {
    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Financeiro</Text>
            </View>

            <View style={styles.cardContainer}>
                <Card style={styles.card}>
                    <Ionicons name="cash-outline" size={48} color="#4F46E5" />
                    <Text style={styles.cardTitle}>Gestão de Pagamentos</Text>
                    <Text style={styles.cardText}>Visualize o fluxo de caixa, pagamentos recebidos e próximos vencimentos.</Text>
                </Card>

                <Card style={styles.card}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.cardTitle}>Inadimplência</Text>
                    <Text style={styles.cardText}>Acompanhe alunos com mensalidades atrasadas e envie lembretes.</Text>
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
