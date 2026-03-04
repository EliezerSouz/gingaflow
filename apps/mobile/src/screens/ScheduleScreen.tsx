import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface TurmaSlot {
    id: string; // turma id
    unitName: string;
    turmaName: string;
    time: string;
    day: number;
}

export default function ScheduleScreen() {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    async function loadData() {
        try {
            setLoading(true);
            const res = await api.get('/units'); // Units inclui turmas
            const units = res.data.data;

            const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            const slots: TurmaSlot[] = [];

            units.forEach((u: any) => {
                if (!u.turmas) return;
                u.turmas.forEach((t: any) => {
                    if (!t.schedule) return;
                    try {
                        const scheduleArr = JSON.parse(t.schedule);
                        if (Array.isArray(scheduleArr)) {
                            scheduleArr.forEach((s: any) => {
                                slots.push({
                                    id: t.id,
                                    unitName: u.name,
                                    turmaName: t.name,
                                    time: s.time,
                                    day: s.day
                                });
                            });
                        }
                    } catch (e) { }
                });
            });

            // Ordenar por Dia e Hora
            slots.sort((a, b) => {
                if (a.day !== b.day) return a.day - b.day;
                return a.time.localeCompare(b.time);
            });

            // Agrupar para SectionList
            const grouped = daysMap.map((dayName, index) => {
                const daySlots = slots.filter(s => s.day === index);
                if (daySlots.length === 0) return null;
                return {
                    title: dayName,
                    data: daySlots
                };
            }).filter(Boolean);

            setSections(grouped as any[]);

        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Agenda Semanal</Text>
            </View>

            <SectionList
                sections={sections}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
                keyExtractor={(item, index) => item.id + index}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => {/* Navegar para Chamada ou Detalhes da Turma */ }}>
                        <Card style={styles.card}>
                            <View style={styles.row}>
                                <View>
                                    <Text style={styles.time}>{item.time}</Text>
                                    <Badge label={item.unitName} variant="info" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.turma}>{item.turmaName}</Text>
                                    <Text style={styles.subtitle}>Toque para chamada</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </View>
                        </Card>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={!loading ? <Text style={styles.empty}>Nenhuma aula agendada.</Text> : null}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    sectionHeader: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 16, marginTop: 16, borderRadius: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4F46E5' },
    card: { marginTop: 8, marginBottom: 0 },
    row: { flexDirection: 'row', alignItems: 'center' },
    time: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    turma: { fontSize: 16, fontWeight: '600', color: '#374151' },
    subtitle: { fontSize: 12, color: '#6B7280' },
    empty: { textAlign: 'center', marginTop: 40, color: '#6B7280', fontStyle: 'italic' }
});
