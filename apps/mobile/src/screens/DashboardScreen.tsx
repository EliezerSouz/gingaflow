import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { SimpleDrawer } from '../components/SimpleDrawer';
import { useAuth } from '../context/AuthContext';

interface DashboardMetrics {
    totalStudents: number;
    activeStudents: number;
    totalUnits: number;
    totalTurmas: number;
    totalTeachers: number;
    activeTeachers: number;
    overduePayments: number;
    upcomingDues: number;
}

export default function DashboardScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalStudents: 0,
        activeStudents: 0,
        totalUnits: 0,
        totalTurmas: 0,
        totalTeachers: 0,
        activeTeachers: 0,
        overduePayments: 0,
        upcomingDues: 0
    });

    async function loadMetrics() {
        try {
            setLoading(true);

            // Carregar alunos
            const studentsRes = await api.get('/students', { params: { per_page: 100 } });
            const students = studentsRes.data.data || [];
            const totalStudents = students.length;
            const activeStudents = students.filter((s: any) => s.status === 'ATIVO').length;

            // Carregar unidades
            const unitsRes = await api.get('/units');
            const units = unitsRes.data.data || unitsRes.data || [];
            const totalUnits = units.length;

            // Carregar turmas de todas as unidades
            let totalTurmas = 0;
            for (const unit of units) {
                try {
                    const turmasRes = await api.get(`/units/${unit.id}/turmas`);
                    const turmas = turmasRes.data.data || turmasRes.data || [];
                    totalTurmas += turmas.length;
                } catch (e) {
                    console.log('Erro ao carregar turmas da unidade:', unit.id);
                }
            }

            // Carregar professores
            const teachersRes = await api.get('/teachers');
            const teachers = teachersRes.data.data || teachersRes.data || [];
            const totalTeachers = teachers.length;
            const activeTeachers = teachers.filter((t: any) => t.status === 'ATIVO').length;

            setMetrics({
                totalStudents,
                activeStudents,
                totalUnits,
                totalTurmas,
                totalTeachers,
                activeTeachers,
                overduePayments: 0,
                upcomingDues: 0
            });
        } catch (e) {
            console.log('Erro ao carregar métricas:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMetrics();
    }, []);

    function MetricCard({ icon, title, value, color, onPress }: any) {
        return (
            <TouchableOpacity onPress={onPress} disabled={!onPress}>
                <Card style={styles.metricCard}>
                    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <Text style={styles.metricValue}>{value}</Text>
                    <Text style={styles.metricTitle}>{title}</Text>
                </Card>
            </TouchableOpacity>
        );
    }

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Usuário'}!</Text>
                    <Text style={styles.subtitle}>Bem-vindo ao GingaFlow</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDrawer(true)} style={styles.menuButton}>
                    <Ionicons name="menu" size={28} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMetrics} />}
            >
                {/* Métricas */}
                <View style={styles.metricsGrid}>
                    <MetricCard
                        icon="people"
                        title="Total de alunos"
                        value={metrics.totalStudents}
                        color="#4F46E5"
                        onPress={() => navigation.navigate('Acadêmico')}
                    />
                    <MetricCard
                        icon="checkmark-circle"
                        title="Alunos ativos"
                        value={metrics.activeStudents}
                        color="#10B981"
                        onPress={() => navigation.navigate('Acadêmico')}
                    />

                    {user?.role === 'ADMIN' && (
                        <>
                            <MetricCard
                                icon="business"
                                title="Unidades"
                                value={metrics.totalUnits}
                                color="#EF4444"
                                onPress={() => navigation.navigate('Units')}
                            />
                            <MetricCard
                                icon="people-circle"
                                title="Turmas"
                                value={metrics.totalTurmas}
                                color="#3B82F6"
                                onPress={() => navigation.navigate('Turmas')}
                            />
                            <MetricCard
                                icon="school"
                                title="Professores"
                                value={metrics.totalTeachers}
                                color="#6366F1"
                                onPress={() => navigation.navigate('Teachers')}
                            />
                            <MetricCard
                                icon="shield-checkmark"
                                title="Professores ativos"
                                value={metrics.activeTeachers}
                                color="#8B5CF6"
                                onPress={() => navigation.navigate('Teachers')}
                            />
                        </>
                    )}

                    <MetricCard
                        icon="alert-circle"
                        title="Inadimplentes"
                        value={metrics.overduePayments}
                        color="#EF4444"
                    />
                    <MetricCard
                        icon="calendar"
                        title="Próximos vencimentos"
                        value={metrics.upcomingDues}
                        color="#F59E0B"
                    />
                </View>

                {/* Próximas Aulas */}
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Próximas Aulas</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
                            <Text style={styles.sectionLink}>Ver todas</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.placeholder}>Carregando agenda...</Text>
                </Card>

                {/* Ações Rápidas */}
                <Card style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Acadêmico')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                                <Ionicons name="person-add" size={20} color="#4F46E5" />
                            </View>
                            <Text style={styles.quickActionText}>Novo Aluno</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Agenda')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                                <Ionicons name="calendar" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.quickActionText}>Chamada</Text>
                        </TouchableOpacity>

                        {user?.role === 'ADMIN' && (
                            <>
                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => navigation.navigate('Graduações')}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                                        <Ionicons name="ribbon" size={20} color="#10B981" />
                                    </View>
                                    <Text style={styles.quickActionText}>Graduações</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => navigation.navigate('Units')}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="business" size={20} color="#EF4444" />
                                    </View>
                                    <Text style={styles.quickActionText}>Unidades</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => navigation.navigate('Turmas')}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                                        <Ionicons name="people-circle" size={20} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.quickActionText}>Turmas</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => navigation.navigate('Teachers')}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                                        <Ionicons name="school" size={20} color="#6366F1" />
                                    </View>
                                    <Text style={styles.quickActionText}>Professores</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickAction}
                                    onPress={() => navigation.navigate('ActivityTypes')}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                                        <Ionicons name="construct" size={20} color="#8B5CF6" />
                                    </View>
                                    <Text style={styles.quickActionText}>Atividades</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickAction}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                                        <Ionicons name="cash" size={20} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.quickActionText}>Pagamentos</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </Card>
            </ScrollView>
            <SimpleDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    menuButton: { padding: 8 },
    content: { padding: 16 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    metricCard: {
        flex: 1,
        minWidth: '47%',
        alignItems: 'center',
        padding: 16
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    metricValue: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    metricTitle: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
    sectionCard: { marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    sectionLink: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
    placeholder: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    quickAction: { alignItems: 'center', width: '22%' },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    quickActionText: { fontSize: 11, color: '#374151', textAlign: 'center', fontWeight: '500' }
});
