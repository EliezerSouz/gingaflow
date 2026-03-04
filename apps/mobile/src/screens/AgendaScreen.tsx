import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatSchedule } from '../utils/format';

interface UnitData {
    id: string;
    name: string;
    turmas: any[];
}

export default function AgendaScreen() {
    const { user } = useAuth();
    const [data, setData] = useState<UnitData[]>([]);
    const [loading, setLoading] = useState(false);

    async function loadData() {
        try {
            setLoading(true);
            if (user?.role === 'ADMIN') {
                const res = await api.get('/units');
                setData(res.data.data);
            } else if (user?.role === 'TEACHER' && user.relatedId) {
                // Fetch teacher specific data
                const res = await api.get(`/teachers/${user.relatedId}`);
                // Adapt response structure if needed
                setData(res.data.units || []);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
            >
                <Text style={styles.header}>Minhas Aulas</Text>

                {data.map(unit => (
                    <View key={unit.id} style={styles.card}>
                        <Text style={styles.unitName}>{unit.name}</Text>
                        {unit.turmas && unit.turmas.map((turma: any) => (
                            <View key={turma.id} style={styles.turmaItem}>
                                <Text style={styles.turmaName}>{turma.name}</Text>
                                <Text style={styles.turmaSchedule}>{formatSchedule(turma.schedule)}</Text>
                            </View>
                        ))}
                        {(!unit.turmas || unit.turmas.length === 0) && (
                            <Text style={styles.empty}>Nenhuma turma.</Text>
                        )}
                    </View>
                ))}

                {data.length === 0 && !loading && (
                    <Text style={styles.empty}>Nenhuma unidade encontrada.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 16 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    unitName: { fontSize: 18, fontWeight: 'bold', color: '#4F46E5', marginBottom: 12 },
    turmaItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    turmaName: { fontSize: 16, color: '#374151', fontWeight: '500' },
    turmaSchedule: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    empty: { color: '#9CA3AF', fontStyle: 'italic' }
});
