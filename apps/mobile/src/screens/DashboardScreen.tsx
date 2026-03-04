import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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

    useFocusEffect(
        useCallback(() => {
            loadMetrics();
        }, [])
    );

    function UnifiedMetricCard({ icon, title, value, subValue, label, color, onPress }: any) {
        return (
            <TouchableOpacity
                style={styles.unifiedCardWrapper}
                onPress={onPress}
                disabled={!onPress}
                activeOpacity={0.7}
            >
                <Card style={styles.metricCard}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                            <Ionicons name={icon} size={22} color={color} />
                        </View>
                        <View style={styles.badgeContainer}>
                            <Text style={[styles.badgeText, { color: color }]}>{title}</Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <Text style={styles.metricValue}>{value}</Text>
                        {subValue !== undefined && (
                            <View style={styles.subValueContainer}>
                                <Text style={styles.subValueLabel}>{label}: </Text>
                                <Text style={styles.subValueText}>{subValue}</Text>
                            </View>
                        )}
                    </View>
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
                {/* Métricas Principais */}
                <View style={styles.metricsGrid}>
                    <UnifiedMetricCard
                        icon="people"
                        title="ALUNOS"
                        value={metrics.activeStudents}
                        label="Total"
                        subValue={metrics.totalStudents}
                        color="#4F46E5"
                        onPress={() => navigation.navigate('Acadêmico')}
                    />

                    {user?.role === 'ADMIN' && (
                        <UnifiedMetricCard
                            icon="school"
                            title="PROFESSORES"
                            value={metrics.activeTeachers}
                            label="Total"
                            subValue={metrics.totalTeachers}
                            color="#8B5CF6"
                            onPress={() => navigation.navigate('Teachers')}
                        />
                    )}
                </View>

                {/* Métricas Secundárias */}
                <View style={styles.secondaryGrid}>
                    {user?.role === 'ADMIN' && (
                        <>
                            <TouchableOpacity
                                style={styles.miniCard}
                                onPress={() => navigation.navigate('Units')}
                            >
                                <Ionicons name="business" size={18} color="#EF4444" />
                                <View style={styles.miniCardContent}>
                                    <Text style={styles.miniCardValue}>{metrics.totalUnits}</Text>
                                    <Text style={styles.miniCardLabel}>Unidades</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.miniCard}
                                onPress={() => navigation.navigate('Turmas')}
                            >
                                <Ionicons name="people-circle" size={18} color="#3B82F6" />
                                <View style={styles.miniCardContent}>
                                    <Text style={styles.miniCardValue}>{metrics.totalTurmas}</Text>
                                    <Text style={styles.miniCardLabel}>Turmas</Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Financeiro */}
                <View style={styles.financeRow}>
                    <TouchableOpacity style={[styles.financeCard, { borderLeftColor: '#EF4444' }]}>
                        <Text style={styles.financeLabel}>Inadimplentes</Text>
                        <Text style={[styles.financeValue, { color: '#EF4444' }]}>{metrics.overduePayments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.financeCard, { borderLeftColor: '#F59E0B' }]}>
                        <Text style={styles.financeLabel}>A vencer</Text>
                        <Text style={[styles.financeValue, { color: '#F59E0B' }]}>{metrics.upcomingDues}</Text>
                    </TouchableOpacity>
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
    greeting: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
    menuButton: {
        padding: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 12
    },
    content: { padding: 16, paddingBottom: 40 },

    // Unified Metrics
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12
    },
    unifiedCardWrapper: {
        flex: 1,
    },
    metricCard: {
        padding: 16,
        borderRadius: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: '#F9FAFB'
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardBody: {
        alignItems: 'flex-start'
    },
    metricValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        lineHeight: 36
    },
    subValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    subValueLabel: {
        fontSize: 12,
        color: '#9CA3AF'
    },
    subValueText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280'
    },

    // Secondary Grid
    secondaryGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16
    },
    miniCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    miniCardContent: {
        flex: 1
    },
    miniCardValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },
    miniCardLabel: {
        fontSize: 11,
        color: '#6B7280'
    },

    // Finance Row
    financeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20
    },
    financeCard: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    financeLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2
    },
    financeValue: {
        fontSize: 18,
        fontWeight: '800'
    },

    sectionCard: {
        marginBottom: 20,
        borderRadius: 20,
        padding: 16
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    sectionLink: { fontSize: 14, color: '#4F46E5', fontWeight: '700' },
    placeholder: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },

    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8
    },
    quickAction: {
        alignItems: 'center',
        width: '23%',
        marginBottom: 16
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    quickActionText: {
        fontSize: 10,
        color: '#4B5563',
        textAlign: 'center',
        fontWeight: '600'
    }
});
