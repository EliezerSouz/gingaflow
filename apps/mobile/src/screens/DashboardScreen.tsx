import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Image, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { CordaBadge } from '../components/ui/CordaBadge';
import { useDrawer } from '../navigation/AppNavigator';

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
    const { openDrawer } = useDrawer();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        } catch (e: any) {
            console.log('❌ Erro ao carregar dashboard:', e);
            const msg = e.response?.data?.message || 'Erro de conexão com a API';
            setError(msg);
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
                            <Text style={{ marginTop: 10, color: '#6B7280' }}>Carregando Dashboard...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="alert-circle" size={50} color="#EF4444" />
                            <Text style={{ marginTop: 15, fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                                Opa! Algo deu errado
                            </Text>
                            <Text style={{ marginTop: 8, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={{ backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 }}
                                onPress={() => loadMetrics(selectedUnitId)}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tentar Novamente</Text>
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
                    <TouchableOpacity onPress={() => openDrawer()} style={styles.menuButton}>
                        <Ionicons name="menu" size={28} color="#4F46E5" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={styles.headerGreeting}>GingaFlow 👋</Text>
                        <Text style={styles.headerDate}>{currentDate}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Conta')} style={styles.avatarButton}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarLetter}>{user?.name?.[0] || 'U'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.headerBottom}>
                    <View style={styles.liveMetrics}>
                        <View style={styles.liveIndicator} />
                        <Text style={styles.liveText}>
                            {selectedUnitId ? 'Unidade Selecionada' : 'Visão Global'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 2. SELETOR DE UNIDADES */}
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
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadMetrics(selectedUnitId)} tintColor="#4F46E5" />}
            >
                {/* 3. INDICADORES DO DIA */}
                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>INDICADORES DO DIA</Text>
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

                {/* 4. AULA EM ANDAMENTO */}
                {(() => {
                    const activeClass = data?.classesToday.find(c => c.status === 'EM_ANDAMENTO');
                    if (!activeClass) return null;
                    return (
                        <>
                            <SectionTitle title="Aula em Andamento" />
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Presenca', { turmaId: activeClass.turmaId, time: activeClass.time })}
                                activeOpacity={0.9}
                            >
                                <Card style={[styles.activeClassCard, { borderColor: activeClass.unitColor }]}>
                                    <View style={styles.activeClassHeader}>
                                        <View style={styles.liveDotContainer}>
                                            <View style={styles.liveDot} />
                                            <Text style={styles.liveLabel}>AO VIVO</Text>
                                        </View>
                                        <Text style={styles.activeClassTime}>{activeClass.time}</Text>
                                    </View>
                                    <View style={styles.activeClassMain}>
                                        <Text style={styles.activeClassName}>{activeClass.name}</Text>
                                        <Text style={styles.activeClassSub}>{activeClass.teacher} • {activeClass.unitName}</Text>
                                    </View>
                                    <View style={styles.activeClassFooter}>
                                        <View style={styles.activeClassStats}>
                                            <Ionicons name="people" size={16} color="#6B7280" />
                                            <Text style={styles.activeClassStatsText}>{activeClass.count} presentes</Text>
                                        </View>
                                        <View style={styles.activeButton}>
                                            <Text style={styles.activeButtonText}>Fazer Chamada</Text>
                                            <Ionicons name="chevron-forward" size={16} color="#FFF" />
                                        </View>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        </>
                    );
                })()}

                {/* 5. PRÓXIMA AULA */}
                {(() => {
                    const nextClass = data?.classesToday.find(c => c.status === 'AGENDADA');
                    if (!nextClass) return null;
                    return (
                        <>
                            <SectionTitle title="Próxima Aula" subtitle="Prepare os materiais" />
                            <Card style={styles.nextClassCard}>
                                <View style={styles.nextClassRow}>
                                    <View style={styles.nextClassTimeBox}>
                                        <Text style={styles.nextClassTime}>{nextClass.time}</Text>
                                        <Text style={styles.nextClassDuration}>{nextClass.durationMinutes} min</Text>
                                    </View>
                                    <View style={styles.nextClassInfo}>
                                        <Text style={styles.nextClassName}>{nextClass.name}</Text>
                                        <Text style={styles.nextClassSub}>{nextClass.teacher} • {nextClass.unitName}</Text>
                                    </View>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: nextClass.unitColor }} />
                                </View>
                            </Card>
                        </>
                    );
                })()}

                {/* 6. TIMELINE DAS AULAS */}
                {data?.classesToday && data.classesToday.length > 0 && (
                    <>
                        <SectionTitle
                            title="Agenda de Hoje"
                            subtitle={`${data.classesToday.length} aulas programadas`}
                            onPress={() => navigation.navigate('Agenda')}
                        />
                        <View style={styles.timelineContainer}>
                            {data.classesToday.map((item, index) => (
                                <View key={item.id} style={styles.timelineItem}>
                                    {/* Track Line */}
                                    <View style={styles.timelineTrack}>
                                        <View style={[
                                            styles.timelineLine,
                                            index === 0 && styles.timelineLineFirst,
                                            index === data.classesToday.length - 1 && styles.timelineLineLast
                                        ]} />
                                        <View style={[styles.timelineDot, { backgroundColor: item.unitColor }]}>
                                            <View style={styles.timelineDotInner} />
                                        </View>
                                    </View>

                                    {/* Content Card */}
                                    <TouchableOpacity
                                        style={styles.timelineContent}
                                        onPress={() => setSelectedClassForStudents(item)}
                                    >
                                        <View style={styles.timelineHeader}>
                                            <Text style={styles.timelineTime}>{item.time}</Text>
                                            <View style={[styles.unitBadgeSmall, { backgroundColor: item.unitColor + '15' }]}>
                                                <Text style={[styles.unitBadgeTextSmall, { color: item.unitColor }]}>
                                                    {item.unitName}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.timelineName}>{item.name}</Text>
                                        <View style={styles.timelineFooter}>
                                            <Text style={styles.timelineTeacher}>{item.teacher}</Text>
                                            <View style={styles.studentCounter}>
                                                <Ionicons name="people" size={12} color="#9CA3AF" />
                                                <Text style={styles.studentCounterText}>{item.count}/{item.enrolledCount}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* 7. ALERTAS IMPORTANTES */}
                <SectionTitle title="Alertas Importantes" />
                <View style={styles.alertsContainer}>
                    {data?.alerts && data.alerts.length > 0 ? (
                        data.alerts.map((alert, i) => (
                            <AlertItem key={i} icon={alert.icon} message={alert.message} type={alert.type} />
                        ))
                    ) : (
                        <View style={styles.noAlerts}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.noAlertsText}>Nenhum alerta crítico no momento</Text>
                        </View>
                    )}
                </View>

                {/* 7. ATALHOS PRINCIPAIS */}
                <SectionTitle title="Principais Atalhos" />
                <View style={styles.shortcutsGrid}>
                    <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Acadêmico')}>
                        <View style={[styles.shortcutIcon, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="person-add" size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.shortcutLabel}>Novo Aluno</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Agenda')}>
                        <View style={[styles.shortcutIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="checkbox" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.shortcutLabel}>Chamada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Financial')}>
                        <View style={[styles.shortcutIcon, { backgroundColor: '#FFFBEB' }]}>
                            <Ionicons name="cash" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.shortcutLabel}>Pagamentos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shortcutItem} onPress={() => navigation.navigate('Reports')}>
                        <View style={[styles.shortcutIcon, { backgroundColor: '#F5F3FF' }]}>
                            <Ionicons name="stats-chart" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.shortcutLabel}>Relatórios</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

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
                            {selectedClassForStudents?.students?.map((student: any) => (
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
                                            <View style={styles.studentAvatar}>
                                                <Text style={styles.studentAvatarText}>
                                                    {student.name.substring(0, 1).toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={styles.studentNameLine}>{student.name}</Text>
                                            {student.cord && (
                                                <View style={{ marginTop: 4 }}>
                                                    <CordaBadge
                                                        graduacao=""
                                                        size="small"
                                                        colorLeft={student.cord.colorLeft}
                                                        colorRight={student.cord.colorRight}
                                                        pontaLeft={student.cord.pontaLeft}
                                                        pontaRight={student.cord.pontaRight}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                                </TouchableOpacity>
                            ))}
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
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
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
    avatarButton: {
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    headerBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
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
    activeClassCard: {
        padding: 16,
        borderRadius: 24,
        backgroundColor: '#FFF',
        borderLeftWidth: 6,
        marginBottom: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    activeClassHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    liveDotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginRight: 6,
    },
    liveLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    activeClassTime: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    },
    activeClassMain: {
        marginBottom: 16,
    },
    activeClassName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    activeClassSub: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    activeClassFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    activeClassStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeClassStatsText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
        marginLeft: 6,
    },
    activeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    activeButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFF',
        marginRight: 4,
    },
    nextClassCard: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 25,
    },
    nextClassRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextClassTimeBox: {
        alignItems: 'center',
        marginRight: 20,
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
    },
    nextClassTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    nextClassDuration: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: 'bold',
        marginTop: 2,
    },
    nextClassInfo: {
        flex: 1,
    },
    nextClassName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    nextClassSub: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
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
    shortcutsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 25
    },
    shortcutItem: {
        width: (width - 52) / 2,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    shortcutIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    shortcutLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
    },
    // TIMELINE STYLES
    timelineContainer: {
        marginBottom: 25,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 100,
    },
    timelineTrack: {
        width: 30,
        alignItems: 'center',
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#E5E7EB',
    },
    timelineLineFirst: {
        top: 20,
    },
    timelineLineLast: {
        bottom: '80%',
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: 20,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    timelineDotInner: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFF',
    },
    timelineContent: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginLeft: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    timelineTime: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
    },
    unitBadgeSmall: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    unitBadgeTextSmall: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timelineName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    timelineFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timelineTeacher: {
        fontSize: 12,
        color: '#6B7280',
    },
    studentCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    studentCounterText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
    },
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
    studentAvatarContainer: {
        width: 46,
        alignItems: 'center',
        justifyContent: 'center'
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
});
