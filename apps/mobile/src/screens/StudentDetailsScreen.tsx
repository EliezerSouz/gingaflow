import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CordaBadge } from '../components/ui/CordaBadge';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import StudentFormModal from '../components/StudentFormModal';
import { useAuth } from '../context/AuthContext';

export default function StudentDetailsScreen() {
    const { user } = useAuth();
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { id } = route.params as { id: string };
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [allGraduations, setAllGraduations] = useState<any[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);

    async function load() {
        try {
            setLoading(true);
            const [studentRes, settingsRes] = await Promise.all([
                api.get(`/students/${id}`),
                api.get('/settings')
            ]);
            setStudent(studentRes.data);
            setAllGraduations(settingsRes.data.graduations || []);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            load();
        }, [id])
    );

    function findGraduation(name: string) {
        if (!name) return null;
        const search = name.trim().toLowerCase();
        return allGraduations.find(g => g.name?.trim().toLowerCase() === search);
    }

    if (loading && !student) return <View style={styles.center}><ActivityIndicator color="#4F46E5" /></View>;
    if (!student) return <View style={styles.center}><Text>Aluno não encontrado</Text></View>;

    const respMatch = student.notes?.match(/\[RESPONSÁVEL\]\r?\nNome: (.*)\r?\nCPF: (.*)\r?\nParentesco: (.*)\r?\nTelefone: (.*)/);
    const responsavelData = respMatch ? {
        nome: respMatch[1],
        cpf: respMatch[2],
        parentesco: respMatch[3],
        telefone: respMatch[4]?.trim() || ''
    } : null;

    const gradMatch = student.notes?.match(/\[CAPOEIRA\]\r?\nGraduação: (.*)/);
    const graduationFromNotes = gradMatch ? gradMatch[1].trim() : null;

    const birthDate = student.birth_date ? new Date(student.birth_date) : null;
    let age = 0;
    if (birthDate) {
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
    }
    const isMinor = !!birthDate && age > 0 && age < 18;
    const responsavel = isMinor ? responsavelData : null;

    const latestGrad = student.graduations?.[0];
    const currentGradName = latestGrad?.level || graduationFromNotes || student.graduation_current;
    const currentGradConfig = findGraduation(currentGradName);

    const sortedGraduations = student.graduations
        ? [...student.graduations].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        : [];

    const finMatch = student.notes?.match(/\[FINANCEIRO\]\r?\nMensalidade: (.*)\r?\nVencimento: Dia (.*)\r?\nForma Pagamento: (.*)/);
    const financeiroInfo = finMatch ? {
        mensalidade: finMatch[1],
        vencimentoDia: finMatch[2]?.trim(),
        metodo: finMatch[3]
    } : null;

    const activities = student.activities?.map((a: any) => a.activityType) || [];
    const usaGraduacao = activities.some((a: any) => a.usaGraduacao);

    const isMainTeacher = student.studentTurmas?.some((st: any) =>
        st.turma?.teacherId === user?.relatedId ||
        st.turma?.teacherLinks?.some((l: any) => l.teacherId === user?.relatedId)
    );
    const canEditGraduation = user?.role === 'ADMIN' || isMainTeacher;

    return (
        <ScreenContainer>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            >
                <View style={styles.header}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{student.full_name[0]}</Text></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{student.full_name}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                            <Badge label={student.status} variant={student.status === 'ATIVO' ? 'success' : 'danger'} />
                            {activities.map((act: any) => {
                                // Encontrar cor da unidade relacionada a essa atividade para o aluno
                                const unitColor = student.studentTurmas?.find((st: any) => st.turma?.activityTypeId === act.id)?.turma?.unit?.color;
                                return (
                                    <View key={act.id} style={{ marginLeft: 8, marginBottom: 4 }}>
                                        <Badge label={act.name} variant="info" color={unitColor} />
                                    </View>
                                );
                            })}
                        </View>

                        {usaGraduacao && currentGradName && (
                            <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                                <CordaBadge
                                    graduacao={currentGradName}
                                    size="medium"
                                    showText={true}
                                    colorLeft={currentGradConfig?.colorLeft || currentGradConfig?.color}
                                    colorRight={currentGradConfig?.colorRight || currentGradConfig?.color}
                                    pontaLeft={currentGradConfig?.pontaLeft || currentGradConfig?.colorLeft || currentGradConfig?.color}
                                    pontaRight={currentGradConfig?.pontaRight || currentGradConfig?.colorRight || currentGradConfig?.color}
                                />
                            </View>
                        )}
                    </View>
                </View>

                <Card>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                        <Button
                            title="Editar"
                            variant="ghost"
                            style={{ padding: 0, height: 20 }}
                            onPress={() => setShowEditModal(true)}
                        />
                    </View>
                    <View style={styles.infoRow}><Text style={styles.label}>CPF:</Text><Text>{student.cpf}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.label}>Nascimento:</Text><Text>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : '-'}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.label}>Email:</Text><Text>{student.email || '-'}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.label}>Telefone:</Text><Text>{student.phone || '-'}</Text></View>
                </Card>

                {responsavel && (
                    <Card>
                        <Text style={styles.sectionTitle}>Responsável (Menor de Idade)</Text>
                        <View style={styles.infoRow}><Text style={styles.label}>Nome:</Text><Text>{responsavel.nome}</Text></View>
                        <View style={styles.infoRow}><Text style={styles.label}>Parentesco:</Text><Text>{responsavel.parentesco}</Text></View>
                        <View style={styles.infoRow}><Text style={styles.label}>Contato:</Text><Text>{responsavel.telefone}</Text></View>
                    </Card>
                )}

                {usaGraduacao && (
                    <Card>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>Histórico de Graduações</Text>
                            {canEditGraduation && (
                                <Button
                                    title="Promover"
                                    variant="ghost"
                                    style={{ padding: 0, height: 20 }}
                                    onPress={() => {
                                        Alert.alert('Promover Aluno', 'Deseja iniciar o processo de troca de corda?', [
                                            { text: 'Agora não' },
                                            { text: 'Sim, iniciar', onPress: () => setShowEditModal(true) }
                                        ]);
                                    }}
                                />
                            )}
                        </View>

                        {sortedGraduations.map((g: any) => {
                            const gConfig = findGraduation(g.level);
                            const cLeft = gConfig?.colorLeft || gConfig?.color || g.colorLeft || g.color;
                            const cRight = gConfig?.colorRight || gConfig?.color || g.colorRight || g.color;

                            return (
                                <View key={g.id || Math.random()} style={styles.row}>
                                    {g.level ? (
                                        <CordaBadge
                                            graduacao={g.level}
                                            size="small"
                                            colorLeft={cLeft}
                                            colorRight={cRight}
                                            pontaLeft={gConfig?.pontaLeft || cLeft || g.pontaLeft}
                                            pontaRight={gConfig?.pontaRight || cRight || g.pontaRight}
                                        />
                                    ) : (
                                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Sem graduação</Text>
                                    )}
                                    <Text style={{ color: '#6B7280', fontSize: 12 }}>
                                        {g.date ? new Date(g.date).toLocaleDateString('pt-BR') : '-'}
                                    </Text>
                                </View>
                            );
                        })}
                        {(!sortedGraduations || sortedGraduations.length === 0) && <Text style={styles.empty}>Sem graduações registradas.</Text>}
                    </Card>
                )}

                <Card>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.sectionTitle}>Situação Financeira</Text>
                        <Badge label="Últimos 5 meses" variant="info" />
                    </View>

                    {(() => {
                        const nextPayment = student.payments?.find((p: any) => p.status !== 'PAID');

                        // Determinar o período e dia de vencimento
                        let period = nextPayment?.period;
                        const dueDay = financeiroInfo?.vencimentoDia || nextPayment?.dueDay?.toString() || '10';

                        if (!period) {
                            // Se não há pagamento pendente no banco, sugerir o mês atual (ou próximo se o deste já passou)
                            const now = new Date();
                            const currentDay = now.getDate();
                            const targetMonth = currentDay > parseInt(dueDay) ? now.getMonth() + 2 : now.getMonth() + 1;

                            const d = new Date(now.getFullYear(), targetMonth - 1, 1);
                            period = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                        }

                        const [month, year] = period.split('/');
                        const formattedDueDate = `${dueDay.padStart(2, '0')}/${month}/${year}`;

                        return (
                            <View style={[styles.nextDueCard, { marginBottom: 16 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={styles.nextDueLabel}>Próximo Vencimento (Dia {dueDay})</Text>
                                        <Text style={styles.nextDueValue}>{formattedDueDate}</Text>
                                    </View>
                                    <Badge
                                        label={nextPayment ? "PENDENTE" : "AGUARDANDO"}
                                        variant="warning"
                                    />
                                </View>
                            </View>
                        );
                    })()}

                    {student.payments?.slice(0, 5).map((p: any) => (
                        <View key={p.id} style={styles.row}>
                            <View>
                                <Text style={styles.paymentPeriod}>{p.period}</Text>
                                {p.paidAt && (
                                    <Text style={styles.paymentDate}>Pago em: {new Date(p.paidAt).toLocaleDateString('pt-BR')}</Text>
                                )}
                            </View>
                            <Badge
                                label={p.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                variant={p.status === 'PAID' ? 'success' : 'warning'}
                            />
                        </View>
                    ))}
                    {(!student.payments || student.payments.length === 0) && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={styles.empty}>Sem histórico de pagamentos realizados.</Text>
                        </View>
                    )}
                </Card>

                <Button title="Editar Cadastro Completo" variant="outline" onPress={() => setShowEditModal(true)} style={{ marginBottom: 20 }} />

            </ScrollView>

            <StudentFormModal
                visible={showEditModal}
                studentId={id}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => {
                    setShowEditModal(false);
                    load();
                }}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: '#4F46E5' },
    name: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4, flexShrink: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 4 },
    label: { color: '#6B7280' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    empty: { fontStyle: 'italic', color: '#9CA3AF' },
    nextDueCard: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        borderRadius: 12,
        padding: 12,
    },
    nextDueLabel: { fontSize: 12, color: '#92400E', fontWeight: '600' },
    nextDueValue: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 2 },
    paymentPeriod: { fontSize: 14, fontWeight: '600', color: '#374151' },
    paymentDate: { fontSize: 12, color: '#6B7280', marginTop: 2 }
});
