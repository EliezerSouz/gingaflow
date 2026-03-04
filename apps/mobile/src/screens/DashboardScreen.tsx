// DASHBOARD V3 - REAL DATA ONLY
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Image, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { SimpleDrawer } from '../components/SimpleDrawer';
import { useAuth } from '../context/AuthContext';
import { CordaBadge } from '../components/ui/CordaBadge';

const { width } = Dimensions.get('window');

interface DashboardData {
    selectedUnitId: string | null;
    units: Array<{ id: string; name: string }>;
    summary: {
        presences: number;
        classesCount: number;
        revenueToday: number;
        overdueCount: number;
    };
    status: {
        activeStudents: number;
        activeTeachers: number;
        unitsCount: number;
        turmasCount: number;
    };
    classesToday: Array<{
        id: string;
        turmaId: string;
        name: string;
        time: string;
        durationMinutes: number;
        teacher: string;
        count: number;
        enrolledCount: number;
        status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA';
        occupancyStatus: string;
        attendanceStatus: 'BLOQUEADA' | 'DISPONÍVEL' | 'ENCERRADA';
        attendanceAvailable: boolean;
        unitName: string;
        unitColor: string;
        students?: Array<{
            id: string;
            name: string;
            cord?: {
                color: string,
                colorLeft?: string,
                colorRight?: string,
                pontaLeft?: string,
                pontaRight?: string
            }
        }>;
    }>;
    finance: {
        monthlyRevenue: number;
        overdueValue: number;
        ticketAverage: number;
    };
    engagement: {
        popularActivities: Array<{ name: string; count: number }>;
        topTeachers: Array<{ name: string; count: number }>;
    };
    alerts: Array<{ type: 'danger' | 'warning' | 'info'; message: string; icon: string }>;
}

export default function DashboardScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signOut } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [selectedClassForStudents, setSelectedClassForStudents] = useState<any | null>(null);

    const currentDate = useMemo(() => {
        const d = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long' };
        return d.toLocaleDateString('pt-BR', options);
    }, []);

    const loadMetrics = useCallback(async (unitId?: string | null) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/dashboard/overview', {
                params: { unitId: unitId || undefined }
            });
            setData(response.data);
            console.log('✅ Dashboard Data Loaded:', response.data.summary);
        } catch (e: any) {
            console.log('❌ Erro ao carregar dashboard:', e);
            const msg = e.response?.data?.message || 'Erro de conexão com a API';
            setError(msg);

            // Se for erro de autenticação, o token pode estar sujo
            if (e.response?.status === 401 || e.response?.status === 404) {
                console.log('⚠️ Erro crítico de sessão detectado');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadMetrics(selectedUnitId);
        }, [loadMetrics, selectedUnitId])
    );

    // --- Dynamic Components ---

    function SectionTitle({ title, subtitle, onPress }: any) {
        return (
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
                </View>
                {onPress && (
                    <TouchableOpacity onPress={onPress}>
                        <Text style={styles.sectionLink}>Ver tudo</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    function StatusCard({ icon, title, value, color, onPress }: any) {
        return (
            <TouchableOpacity style={styles.statusCard} onPress={onPress}>
                <View style={[styles.statusIconBg, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.statusInfo}>
                    <Text style={styles.statusValue}>{value}</Text>
                    <Text style={styles.statusTitle}>{title}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function InsightItem({ icon, label, value, subLabel, color }: any) {
        return (
            <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: color + '10' }]}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.insightLabel}>{label}</Text>
                    <Text style={styles.insightSubLabel}>{subLabel}</Text>
                </View>
                <Text style={[styles.insightValue, { color: color }]}>{value}</Text>
            </View>
        );
    }

    function AlertItem({ icon, message, type }: any) {
        const color = type === 'danger' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6';
        return (
            <View style={[styles.alertItem, { borderLeftColor: color }]}>
                <Ionicons name={icon} size={18} color={color} style={{ marginRight: 10 }} />
                <Text style={styles.alertText}>{message}</Text>
            </View>
        );
    }

    if (!data && (loading || error)) {
        return (
            <ScreenContainer>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    {loading ? (
                        <>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={{ marginTop: 10, color: '#6B7280' }}>Carregando Dashboard Real...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="alert-circle" size={50} color="#EF4444" />
                            <Text style={{ marginTop: 15, fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                                Opa! Algo deu errado
                            </Text>
                            <Text style={{ marginTop: 8, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                                {error === 'Usuário não encontrado ou desativado'
                                    ? 'Sua sessão expirou ou o usuário não existe mais no banco.'
                                    : error}
                            </Text>

                            <TouchableOpacity
                                style={{ backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 }}
                                onPress={() => loadMetrics(selectedUnitId)}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tentar Novamente</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center' }}
                                onPress={() => signOut()}
                            >
                                <Text style={{ color: '#EF4444', fontWeight: '600' }}>Sair e Entrar Novamente</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            {/* 1. HEADER */}
            <View style={styles.smartHeader}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerGreeting}>GingaFlow Pro 👋</Text>
                        <Text style={styles.headerDate}>{currentDate}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => setShowDrawer(true)} style={styles.avatarButton}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarLetter}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.headerBottom}>
                    <View style={styles.liveMetrics}>
                        <View style={styles.liveIndicator} />
                        <Text style={styles.liveText}>
                            {selectedUnitId ? 'Visão por Unidade' : 'Visão Global'} - {data?.status.activeStudents || 0} alunos ativos
                        </Text>
                    </View>
                </View>
            </View>

            {/* 1.5 SELETOR DE UNIDADES (CHIPS) */}
            <View style={styles.unitFilterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitChipsScroll}>
                    <TouchableOpacity
                        style={[styles.unitChip, !selectedUnitId && styles.unitChipActive]}
                        onPress={() => setSelectedUnitId(null)}
                    >
                        <Text style={[styles.unitChipText, !selectedUnitId && styles.unitChipTextActive]}>Todas</Text>
                    </TouchableOpacity>
                    {data?.units.map((unit) => (
                        <TouchableOpacity
                            key={unit.id}
                            style={[styles.unitChip, selectedUnitId === unit.id && styles.unitChipActive]}
                            onPress={() => setSelectedUnitId(unit.id)}
                        >
                            <Text style={[styles.unitChipText, selectedUnitId === unit.id && styles.unitChipTextActive]}>
                                {unit.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMetrics} tintColor="#4F46E5" />}
            >
                {/* 2. RESUMO DO DIA */}
                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>INDICADORES REAIS (HOJE)</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{data?.summary.presences || 0}</Text>
                            <Text style={styles.summaryLabel}>Presenças</Text>
                            <View style={styles.iconCircle}><Ionicons name="people" size={16} color="#FFF" /></View>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{data?.summary.classesCount || 0}</Text>
                            <Text style={styles.summaryLabel}>Aulas</Text>
                            <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}><Ionicons name="book" size={16} color="#FFF" /></View>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#059669' }]}>R$ {data?.summary.revenueToday || 0}</Text>
                            <Text style={styles.summaryLabel}>Receita</Text>
                            <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}><Ionicons name="cash" size={16} color="#FFF" /></View>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{data?.summary.overdueCount || 0}</Text>
                            <Text style={styles.summaryLabel}>Vencidos</Text>
                            <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}><Ionicons name="alert-circle" size={16} color="#FFF" /></View>
                        </View>
                    </View>
                </Card>

                {/* 3. STATUS */}
                <SectionTitle title="Status da Academia" />
                <View style={styles.statusGrid}>
                    <StatusCard
                        icon="people"
                        title="Alunos"
                        value={data?.status.activeStudents || 0}
                        color="#4F46E5"
                        onPress={() => navigation.navigate('Acadêmico')}
                    />
                    <StatusCard
                        icon="school"
                        title="Profs"
                        value={data?.status.activeTeachers || 0}
                        color="#8B5CF6"
                        onPress={() => navigation.navigate('Teachers')}
                    />
                    <StatusCard
                        icon="business"
                        title="Unidades"
                        value={data?.status.unitsCount || 0}
                        color="#EF4444"
                        onPress={() => navigation.navigate('Units')}
                    />
                    <StatusCard
                        icon="layers"
                        title="Turmas"
                        value={data?.status.turmasCount || 0}
                        color="#3B82F6"
                        onPress={() => navigation.navigate('Turmas')}
                    />
                </View>

                {/* 4. AULAS DE HOJE - TIMELINE */}
                <SectionTitle title="Grade de Aulas" subtitle="Acompanhamento em tempo real" />

                {!data?.classesToday || data.classesToday.length === 0 ? (
                    <Card style={styles.classesCard}>
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                            <Text style={{ color: '#9CA3AF', marginTop: 10 }}>Nenhuma aula para hoje</Text>
                        </View>
                    </Card>
                ) : (
                    <View style={styles.timelineContainer}>
                        {data.classesToday.map((item, index) => {
                            const isFirst = index === 0;
                            const isLast = index === data.classesToday.length - 1;

                            let statusColor = '#FBBF24'; // AGENDADA
                            let statusText = 'PRÓXIMA';
                            let statusIcon: any = 'time-outline';

                            if (item.status === 'EM_ANDAMENTO') {
                                statusColor = '#10B981';
                                statusText = 'EM ANDAMENTO';
                                statusIcon = 'play-circle-outline';
                            } else if (item.status === 'FINALIZADA') {
                                statusColor = '#6B7280';
                                statusText = 'FINALIZADA';
                                statusIcon = 'checkmark-circle-outline';
                            }

                            return (
                                <View key={item.id} style={styles.timelineItem}>
                                    {/* Linha da timeline */}
                                    <View style={styles.timelineTrack}>
                                        <View style={[styles.timelineLine, isFirst && styles.timelineLineFirst, isLast && styles.timelineLineLast]} />
                                        <View style={[styles.timelineDot, { backgroundColor: statusColor }]}>
                                            <View style={[styles.timelineDotInner, { backgroundColor: '#fff' }]} />
                                        </View>
                                    </View>

                                    {/* Card da Aula */}
                                    <View style={[styles.timelineContent, item.status === 'EM_ANDAMENTO' && styles.activeClassContent]}>
                                        <View style={styles.classHeader}>
                                            <View style={styles.timeInfo}>
                                                <Text style={styles.timelineTime}>{item.time}</Text>
                                                <Text style={styles.durationText}>{item.durationMinutes} min</Text>
                                            </View>

                                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                                                <Ionicons name={statusIcon} size={12} color={statusColor} />
                                                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.classMainInfo}>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.nameRow}>
                                                    <Text style={styles.timelineClassName}>{item.name}</Text>
                                                    <View style={[styles.unitBadge, { backgroundColor: item.unitColor + '15', borderColor: item.unitColor + '30' }]}>
                                                        <Text style={[styles.unitBadgeText, { color: item.unitColor }]}>{item.unitName}</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.timelineTeacherName}>{item.teacher}</Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.occupancyInfo}
                                                onPress={() => setSelectedClassForStudents(item)}
                                            >
                                                <Ionicons name="people-outline" size={14} color="#6B7280" />
                                                <Text style={styles.occupancyText}>{item.enrolledCount}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Ações da Aula */}
                                        <View style={styles.classActions}>
                                            <View style={styles.occupancyStatusRow}>
                                                <View style={[styles.miniDot, { backgroundColor: item.occupancyStatus === 'Aula Cheia' ? '#EF4444' : '#10B981' }]} />
                                                <Text style={[styles.occupancyStatusText, { color: item.occupancyStatus === 'Aula Cheia' ? '#EF4444' : '#10B981' }]}>
                                                    {item.occupancyStatus}
                                                </Text>
                                            </View>

                                            {item.attendanceAvailable && (
                                                <TouchableOpacity
                                                    style={styles.attendanceButton}
                                                    onPress={() => {
                                                        // Abrir tela de chamada ou modal focado
                                                        navigation.navigate('Presenca', { turmaId: item.turmaId, time: item.time });
                                                    }}
                                                >
                                                    <Ionicons name="checkbox-outline" size={16} color="#fff" />
                                                    <Text style={styles.attendanceButtonText}>Abrir Chamada</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Modal de Alunos da Aula */}
                <Modal
                    visible={!!selectedClassForStudents}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setSelectedClassForStudents(null)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setSelectedClassForStudents(null)}
                    >
                        <View style={styles.studentsModalContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitle}>Alunos Matriculados</Text>
                            <Text style={styles.modalSubtitle}>
                                {selectedClassForStudents?.name} - {selectedClassForStudents?.time}
                            </Text>

                            <ScrollView style={styles.studentsListScroll} showsVerticalScrollIndicator={false}>
                                {!selectedClassForStudents?.students || selectedClassForStudents.students.length === 0 ? (
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <Ionicons name="people-outline" size={32} color="#D1D5DB" />
                                        <Text style={{ color: '#9CA3AF', marginTop: 10 }}>Nenhum aluno matriculado neste horário</Text>
                                    </View>
                                ) : (
                                    selectedClassForStudents.students.map((student: any) => (
                                        <TouchableOpacity
                                            key={student.id}
                                            style={styles.studentItem}
                                            onPress={() => {
                                                setSelectedClassForStudents(null);
                                                navigation.navigate('StudentDetails', { id: student.id });
                                            }}
                                        >
                                            <View style={styles.studentInfo}>
                                                <View style={styles.studentAvatarContainer}>
                                                    {student.cord ? (
                                                        <CordaBadge
                                                            size="small"
                                                            graduacao=""
                                                            colorLeft={student.cord.colorLeft || student.cord.color}
                                                            colorRight={student.cord.colorRight}
                                                            pontaLeft={student.cord.pontaLeft}
                                                            pontaRight={student.cord.pontaRight}
                                                        />
                                                    ) : (
                                                        <View style={styles.studentAvatar}>
                                                            <Text style={styles.studentAvatarText}>
                                                                {student.name.substring(0, 1).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.studentNameLine}>{student.name}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setSelectedClassForStudents(null)}
                            >
                                <Text style={styles.modalCloseButtonText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>

                {/* 5. FINANCEIRO */}
                <SectionTitle title="Performance Financeira" />
                <View style={styles.financeGrid}>
                    <Card style={styles.financeSmallCard}>
                        <Text style={styles.financeLabel}>Faturamento (Mês)</Text>
                        <Text style={styles.financeValue}>R$ {(data?.finance?.monthlyRevenue || 0).toLocaleString('pt-BR')}</Text>
                        <View style={styles.trendBadge}>
                            <Ionicons name="trending-up" size={12} color="#059669" />
                            <Text style={styles.financeTrend}>Ticket Médio: R$ {data?.finance?.ticketAverage || 0}</Text>
                        </View>
                    </Card>
                    <Card style={[styles.financeSmallCard, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={styles.financeLabel}>Inadimplência</Text>
                        <Text style={[styles.financeValue, { color: '#EF4444' }]}>R$ {(data?.finance?.overdueValue || 0).toLocaleString('pt-BR')}</Text>
                        <Text style={styles.financeSubLabel}>{data?.summary.overdueCount} faturas pendentes</Text>
                    </Card>
                </View>

                {/* 6. ENGAJAMENTO */}
                <SectionTitle title="Engajamento & Popularidade" />
                <Card style={styles.engagementCard}>
                    <Text style={styles.engagementSubTitle}>ATIVIDADES MAIS PROCURADAS</Text>
                    {data?.engagement.popularActivities.map((act, idx) => (
                        <InsightItem
                            key={idx}
                            icon="flash"
                            label={act.name}
                            subLabel="Matriculados"
                            value={act.count}
                            color="#8B5CF6"
                        />
                    ))}

                    <View style={[styles.divider, { marginVertical: 15 }]} />

                    <Text style={styles.engagementSubTitle}>TOP PROFESSORES (ALUNOS)</Text>
                    {data?.engagement.topTeachers.map((teacher, idx) => (
                        <InsightItem
                            key={idx}
                            icon="star"
                            label={teacher.name}
                            subLabel="Total de alunos"
                            value={teacher.count}
                            color="#F59E0B"
                        />
                    ))}
                </Card>

                {/* 7. ALERTAS */}
                <SectionTitle title="Notificações e Alertas" />
                <View style={styles.alertsContainer}>
                    {data?.alerts.length === 0 ? (
                        <View style={styles.noAlerts}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.noAlertsText}>Tudo em ordem no momento!</Text>
                        </View>
                    ) : (
                        data?.alerts.map((alert, i) => (
                            <AlertItem key={i} icon={alert.icon} message={alert.message} type={alert.type} />
                        ))
                    )}
                </View>

                {/* 8. AÇÕES RÁPIDAS */}
                <SectionTitle title="Menu de Operações" />
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Acadêmico')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#E0E7FF' }]}><Ionicons name="people" size={24} color="#4F46E5" /></View>
                        <Text style={styles.qaLabel}>Alunos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Agenda')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#DBEAFE' }]}><Ionicons name="calendar" size={24} color="#3B82F6" /></View>
                        <Text style={styles.qaLabel}>Chamada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Graduações')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#D1FAE5' }]}><Ionicons name="ribbon" size={24} color="#10B981" /></View>
                        <Text style={styles.qaLabel}>Graduações</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Units')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#FEE2E2' }]}><Ionicons name="business" size={24} color="#EF4444" /></View>
                        <Text style={styles.qaLabel}>Unidades</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Turmas')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#FEF3C7' }]}><Ionicons name="layers" size={24} color="#F59E0B" /></View>
                        <Text style={styles.qaLabel}>Turmas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Teachers')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#E0E7FF' }]}><Ionicons name="school" size={24} color="#6366F1" /></View>
                        <Text style={styles.qaLabel}>Professores</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('ActivityTypes')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#F3E8FF' }]}><Ionicons name="construct" size={24} color="#8B5CF6" /></View>
                        <Text style={styles.qaLabel}>Atividades</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qaButton} onPress={() => navigation.navigate('Finance')}>
                        <View style={[styles.qaIconBg, { backgroundColor: '#F1F5F9' }]}><Ionicons name="card" size={24} color="#475569" /></View>
                        <Text style={styles.qaLabel}>Pagamentos</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <SimpleDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    smartHeader: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    headerGreeting: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    headerDate: {
        fontSize: 14,
        color: '#6B7280',
        textTransform: 'capitalize'
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarLetter: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold'
    },
    headerBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    unitSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12
    },
    unitName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5'
    },
    liveMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    liveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981'
    },
    liveText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600'
    },
    scrollContent: {
        padding: 20
    },
    summaryCard: {
        backgroundColor: '#4F46E5',
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
    },
    summaryTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1,
        marginBottom: 20
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    summaryItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 15,
        borderRadius: 18,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    summaryLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        marginTop: 2
    },
    iconCircle: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 15,
        marginTop: 5
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    sectionLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5'
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 25
    },
    statusCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statusIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    statusInfo: {
        flex: 1
    },
    statusValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827'
    },
    statusTitle: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    classesCard: {
        borderRadius: 24,
        padding: 0,
        marginBottom: 25,
        overflow: 'hidden'
    },
    classItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    classTime: {
        alignItems: 'center',
        width: 50,
        marginRight: 15
    },
    timeLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827'
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 5
    },
    classInfo: {
        flex: 1
    },
    className: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827'
    },
    teacherName: {
        fontSize: 12,
        color: '#6B7280',
    },
    classStats: {
        alignItems: 'flex-end'
    },
    classCount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563'
    },
    classStatus: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 18
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 15
    },
    insightIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    insightLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151'
    },
    insightSubLabel: {
        fontSize: 11,
        color: '#9CA3AF'
    },
    insightValue: {
        fontSize: 18,
        fontWeight: '800'
    },
    financeGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25
    },
    financeSmallCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
    },
    financeLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 10
    },
    financeValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
    },
    financeTrend: {
        fontSize: 10,
        color: '#059669',
        fontWeight: 'bold',
        marginTop: 5
    },
    alertsContainer: {
        gap: 10,
        marginBottom: 25
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 16,
        borderLeftWidth: 5,
    },
    alertText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        flex: 1
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        marginBottom: 20
    },
    qaButton: {
        width: (width - 52) / 2,
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    qaIconBg: {
        width: 54,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    qaLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center'
    },
    engagementCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 25
    },
    engagementSubTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        marginBottom: 15,
        marginTop: 5
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E1FCEF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 8
    },
    financeSubLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 8,
        fontWeight: '500'
    },
    noAlerts: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7'
    },
    noAlertsText: {
        color: '#166534',
        fontWeight: '600',
        fontSize: 14
    },
    avatarButton: {
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    unitFilterContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    unitChipsScroll: {
        paddingHorizontal: 20,
        gap: 10
    },
    unitChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    unitChipActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    unitChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280'
    },
    unitChipTextActive: {
        color: '#FFF'
    },
    // Modal de Alunos
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    studentsModalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        minHeight: 400
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center'
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20
    },
    studentsListScroll: {
        flex: 1
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    studentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    studentAvatarText: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: 'bold'
    },
    studentNameLine: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500'
    },
    modalCloseButton: {
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16
    },
    modalCloseButtonText: {
        color: '#4B5563',
        fontWeight: 'bold',
        fontSize: 16
    },
    studentAvatarContainer: {
        width: 46,
        alignItems: 'center',
        justifyContent: 'center'
    },
    // TIMELINE STYLES
    timelineContainer: {
        paddingHorizontal: 5,
        marginBottom: 20
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 120
    },
    timelineTrack: {
        width: 40,
        alignItems: 'center',
        position: 'relative'
    },
    timelineLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#E5E7EB'
    },
    timelineLineFirst: {
        top: 25
    },
    timelineLineLast: {
        bottom: '75%'
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: 25,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1
    },
    timelineDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    timelineContent: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginLeft: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
    },
    activeClassContent: {
        borderColor: '#10B98130',
        backgroundColor: '#F0FDF4'
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    timelineTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginRight: 6
    },
    durationText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4
    },
    classMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    timelineClassName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginRight: 8
    },
    unitBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 0.5
    },
    unitBadgeText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    timelineTeacherName: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2
    },
    occupancyInfo: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    occupancyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 5
    },
    classActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12
    },
    occupancyStatusRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    miniDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6
    },
    occupancyStatusText: {
        fontSize: 12,
        fontWeight: '500'
    },
    attendanceButton: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8
    },
    attendanceButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6
    }
});
