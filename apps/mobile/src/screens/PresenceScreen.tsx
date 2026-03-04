import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CordaBadge } from '../components/ui/CordaBadge';

interface Student {
    id: string;
    full_name: string;
    nickname: string | null;
    currentGraduationId: string | null;
    cord?: any;
}

interface AttendanceRecord {
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED';
}

export default function PresenceScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { turmaId, time } = route.params as { turmaId: string; time: string };

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [turma, setTurma] = useState<any>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'JUSTIFIED'>>({});
    const [stats, setStats] = useState({ present: 0, absent: 0 });

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        loadData();
    }, [turmaId, time]);

    useEffect(() => {
        const present = Object.values(attendance).filter(v => v === 'PRESENT').length;
        const absent = Object.values(attendance).filter(v => v === 'ABSENT').length;
        setStats({ present, absent });
    }, [attendance]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Carregar Detalhes da Turma e Alunos
            const [turmaRes, attendanceRes] = await Promise.all([
                api.get(`/turmas/${turmaId}`),
                api.get('/attendance', { params: { turmaId, date: todayStr, time } })
            ]);

            const turmaData = turmaRes.data;
            setTurma(turmaData);

            // Buscar alunos vinculados
            const studentsRes = await api.get(`/students`, { params: { turmaId } });
            const studentsData = studentsRes.data.data || studentsRes.data;

            // Buscar Graduações para as Cordas se for Capoeira
            const isCapoeira = turmaData.activityType?.name?.toLowerCase().includes('capoeira');
            let gradsMap: any = {};
            if (isCapoeira) {
                const gradsRes = await api.get('/graduations');
                (gradsRes.data.data || gradsRes.data).forEach((g: any) => {
                    gradsMap[g.id] = g;
                });
            }

            const mappedStudents = studentsData.map((s: any) => ({
                ...s,
                cord: isCapoeira && s.currentGraduationId ? gradsMap[s.currentGraduationId] : null
            }));

            setStudents(mappedStudents);

            // 2. Mapear presenças já registradas
            const existingRecords: Record<string, 'PRESENT' | 'ABSENT' | 'JUSTIFIED'> = {};
            // Inicializar todos como PRESENT por padrão (fluxo de chamada rápida)
            mappedStudents.forEach((s: any) => {
                existingRecords[s.id] = 'PRESENT';
            });

            // Sobrescrever com o que já existe no banco
            if (attendanceRes.data.data && attendanceRes.data.data.length > 0) {
                attendanceRes.data.data.forEach((rec: any) => {
                    existingRecords[rec.studentId] = rec.status;
                });
            }

            setAttendance(existingRecords);

        } catch (error) {
            console.error('Erro ao carregar dados da presença:', error);
            Alert.alert('Erro', 'Não foi possível carregar a lista de alunos.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Criar registros em massa (o endpoint atual do backend é um por um, vamos otimizar futuramente se necessário)
            // Por enquanto, vamos enviar sequencialmente os que foram alterados ou todos.
            const promises = Object.entries(attendance).map(([studentId, status]) => {
                return api.post('/attendance', {
                    studentId,
                    turmaId,
                    date: todayStr,
                    time,
                    status
                });
            });

            await Promise.all(promises);

            Alert.alert('Sucesso', 'Frequência registrada com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Erro ao salvar presença:', error);
            Alert.alert('Erro', 'Falha ao salvar alguns registros de presença.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Carregando alunos...</Text>
            </View>
        );
    }

    const isCapoeira = turma?.activityType?.name?.toLowerCase().includes('capoeira');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{turma?.name || 'Chamada'}</Text>
                    <Text style={styles.headerSubtitle}>{turma?.unit?.name} • {time}</Text>
                </View>
                <View style={styles.statsBadge}>
                    <Text style={styles.statsText}>{stats.present}/{students.length}</Text>
                </View>
            </View>

            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.summaryLabel}>Presentes: {stats.present}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.summaryLabel}>Ausentes: {stats.absent}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.studentList}>
                {students.map((student) => {
                    const status = attendance[student.id];
                    const isPresent = status === 'PRESENT';

                    return (
                        <TouchableOpacity
                            key={student.id}
                            onPress={() => toggleStatus(student.id)}
                            activeOpacity={0.7}
                        >
                            <Card style={[styles.studentCard, !isPresent && styles.absentCard]}>
                                <View style={styles.studentRow}>
                                    <View style={styles.avatarContainer}>
                                        {student.cord ? (
                                            <CordaBadge
                                                size="medium"
                                                graduacao={student.cord.name || student.cord.color}
                                                colorLeft={student.cord.colorLeft || student.cord.color}
                                                colorRight={student.cord.colorRight || student.cord.color}
                                                pontaLeft={student.cord.pontaLeft}
                                                pontaRight={student.cord.pontaRight}
                                            />
                                        ) : (
                                            <View style={styles.initialCircle}>
                                                <Text style={styles.initialText}>
                                                    {(student.nickname || student.full_name).charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.studentInfo}>
                                        <Text style={[styles.studentName, !isPresent && styles.absentText]}>
                                            {(isCapoeira && student.nickname) ? student.nickname : student.full_name}
                                        </Text>
                                        {(isCapoeira && student.nickname) && (
                                            <Text style={styles.fullNameText}>{student.full_name}</Text>
                                        )}
                                    </View>

                                    <View style={[styles.statusToggle, isPresent ? styles.statusTogglePresent : styles.statusToggleAbsent]}>
                                        <Ionicons
                                            name={isPresent ? "checkmark-circle" : "close-circle"}
                                            size={28}
                                            color={isPresent ? "#10B981" : "#EF4444"}
                                        />
                                        <Text style={[styles.statusLabel, { color: isPresent ? "#10B981" : "#EF4444" }]}>
                                            {isPresent ? 'Presente' : 'Ausente'}
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Salvar Chamada"
                    onPress={handleSave}
                    loading={saving}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    statsBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statsText: {
        color: '#4F46E5',
        fontWeight: 'bold',
        fontSize: 14,
    },
    summaryBar: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        gap: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    studentList: {
        padding: 16,
    },
    studentCard: {
        marginBottom: 10,
        padding: 12,
        borderColor: '#F3F4F6',
    },
    absentCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    absentText: {
        color: '#9CA3AF',
    },
    fullNameText: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    statusToggle: {
        alignItems: 'center',
        width: 80,
    },
    statusTogglePresent: {
        opacity: 1,
    },
    statusToggleAbsent: {
        opacity: 0.8,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    footer: {
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
});
