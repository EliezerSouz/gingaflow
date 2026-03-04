import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

const DAYS_OF_WEEK = [
    { key: 'SEG', label: 'Segunda' },
    { key: 'TER', label: 'Terça' },
    { key: 'QUA', label: 'Quarta' },
    { key: 'QUI', label: 'Quinta' },
    { key: 'SEX', label: 'Sexta' },
    { key: 'SAB', label: 'Sábado' },
    { key: 'DOM', label: 'Domingo' }
];

interface Unit {
    id: string;
    name: string;
    color?: string;
}

interface ActivityType {
    id: string;
    name: string;
}

interface Teacher {
    id: string;
    full_name: string;
}

export default function TurmaCreateScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const turmaId = (route.params as any)?.turmaId;
    const preSelectedUnitId = (route.params as any)?.unitId;

    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        unitId: preSelectedUnitId || '',
        activityTypeId: '',
        teacherId: '',
        capacity: '20',
        durationMinutes: '60',
        defaultMonthlyFeeCents: '',
        status: 'ATIVA' as 'ATIVA' | 'INATIVA'
    });

    // Estado para os horários
    const [schedules, setSchedules] = useState<Array<{ dayOfWeek: string; startTime: string; teacherId?: string }>>([
        { dayOfWeek: 'SEG', startTime: '18:00' }
    ]);

    useEffect(() => {
        loadUnits();
        loadActivities();
        loadTeachers();
        if (turmaId) {
            loadTurma();
        }
    }, [turmaId]);

    const loadUnits = async () => {
        try {
            const response = await api.get('/units');
            setUnits(response.data.data || response.data);
        } catch (error: any) {
            console.error('Erro ao carregar unidades:', error);
        }
    };

    const loadActivities = async () => {
        try {
            const response = await api.get('/activity-types');
            setActivities(response.data || []);
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
        }
    };

    const loadTeachers = async () => {
        try {
            const response = await api.get('/teachers');
            setTeachers(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar professores:', error);
        }
    };

    const loadTurma = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/turmas/${turmaId}`);
            const turma = response.data;

            setFormData({
                name: turma.name || '',
                unitId: turma.unitId || preSelectedUnitId || '',
                activityTypeId: turma.activityTypeId || '',
                teacherId: turma.teacherId || '',
                capacity: turma.capacity ? turma.capacity.toString() : '20',
                durationMinutes: turma.durationMinutes ? turma.durationMinutes.toString() : '60',
                defaultMonthlyFeeCents: turma.defaultMonthlyFeeCents ? (turma.defaultMonthlyFeeCents / 100).toString() : '',
                status: turma.status || 'ATIVA'
            });

            if (turma.schedules && turma.schedules.length > 0) {
                setSchedules(turma.schedules.map((s: any) => ({
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    teacherId: s.teacherId
                })));
            } else if (turma.schedule) {
                // Fallback para migrar string legada
                const parts = (turma.schedule as string).split(',').map((s: string) => s.trim());
                const mapped = parts.map((p: string) => ({
                    dayOfWeek: p.split(' ')[0],
                    startTime: p.split(' ')[1] || '00:00'
                })).filter((s: any) => s.dayOfWeek);
                setSchedules(mapped);
            }
        } catch (error: any) {
            console.error('Erro ao carregar turma:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados da turma');
        } finally {
            setLoading(false);
        }
    };

    const addSchedule = () => {
        setSchedules([...schedules, { dayOfWeek: 'SEG', startTime: '18:00' }]);
    };

    const removeSchedule = (index: number) => {
        if (schedules.length > 1) {
            setSchedules(schedules.filter((_, i) => i !== index));
        } else {
            Alert.alert('Aviso', 'A turma deve ter pelo menos um horário.');
        }
    };

    const updateSchedule = (index: number, field: string, value: string | null) => {
        const newSchedules = [...schedules];
        (newSchedules[index] as any)[field] = value;
        setSchedules(newSchedules);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'Nome da turma é obrigatório');
            return;
        }

        if (!formData.unitId) {
            Alert.alert('Erro', 'Selecione uma unidade');
            return;
        }

        if (schedules.length === 0) {
            Alert.alert('Erro', 'Adicione pelo menos um horário');
            return;
        }

        // Validar duplicatas
        const duplicates = schedules.some((s, i) =>
            schedules.findIndex(other => other.dayOfWeek === s.dayOfWeek && other.startTime === s.startTime) !== i
        );
        if (duplicates) {
            Alert.alert('Erro', 'Existem horários duplicados (mesmo dia e hora)');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name.trim(),
                unitId: formData.unitId,
                activityTypeId: formData.activityTypeId || null,
                teacherId: formData.teacherId || null,
                capacity: parseInt(formData.capacity) || 0,
                durationMinutes: parseInt(formData.durationMinutes) || 60,
                schedules: schedules,
                defaultMonthlyFeeCents: formData.defaultMonthlyFeeCents ? Math.round(parseFloat(formData.defaultMonthlyFeeCents.replace(',', '.')) * 100) : null,
                status: formData.status
            };

            if (turmaId) {
                await api.put(`/turmas/${turmaId}`, payload);
                Alert.alert('Sucesso', 'Turma atualizada!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await api.post('/turmas', payload);
                Alert.alert('Sucesso', 'Turma criada!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            console.error('Erro ao salvar turma:', error);
            Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar a turma');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{turmaId ? 'Editar Turma' : 'Nova Turma'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações Básicas</Text>

                    <Text style={styles.label}>Nome da Turma *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Infantil, Adulto Iniciante..."
                        value={formData.name}
                        onChangeText={text => setFormData({ ...formData, name: text })}
                    />

                    <Text style={styles.label}>Unidade *</Text>
                    <View style={styles.unitsGrid}>
                        {units.map((unit) => (
                            <TouchableOpacity
                                key={unit.id}
                                style={[
                                    styles.unitOption,
                                    formData.unitId === unit.id && styles.unitOptionSelected
                                ]}
                                onPress={() => setFormData({ ...formData, unitId: unit.id })}
                            >
                                {unit.color && (
                                    <View style={[styles.unitColorDot, { backgroundColor: unit.color }]} />
                                )}
                                <Text style={[
                                    styles.unitOptionText,
                                    formData.unitId === unit.id && styles.unitOptionTextSelected
                                ]}>
                                    {unit.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Atividade (Opcional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {activities.map((act) => (
                            <TouchableOpacity
                                key={act.id}
                                style={[
                                    styles.activityChip,
                                    formData.activityTypeId === act.id && styles.activityChipSelected
                                ]}
                                onPress={() => setFormData({ ...formData, activityTypeId: act.id })}
                            >
                                <Text style={[
                                    styles.activityChipText,
                                    formData.activityTypeId === act.id && styles.activityChipTextSelected
                                ]}>
                                    {act.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Professor Regente / Padrão</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                        Este será o professor principal da turma e o padrão para os horários abaixo.
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {teachers.map((teacher) => (
                            <TouchableOpacity
                                key={teacher.id}
                                style={[
                                    styles.activityChip,
                                    formData.teacherId === teacher.id && styles.activityChipSelected
                                ]}
                                onPress={() => setFormData({ ...formData, teacherId: teacher.id })}
                            >
                                <Text style={[
                                    styles.activityChipText,
                                    formData.teacherId === teacher.id && styles.activityChipTextSelected
                                ]}>
                                    {teacher.full_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Valor da Mensalidade (R$)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 150,00"
                        value={formData.defaultMonthlyFeeCents}
                        onChangeText={text => setFormData({ ...formData, defaultMonthlyFeeCents: text })}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Capacidade da Turma (Alunos)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 20"
                        value={formData.capacity}
                        onChangeText={text => setFormData({ ...formData, capacity: text })}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Duração da Aula (Minutos)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 60"
                        value={formData.durationMinutes}
                        onChangeText={text => setFormData({ ...formData, durationMinutes: text })}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Status</Text>
                    <View style={styles.statusButtons}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                formData.status === 'ATIVA' && styles.statusButtonActive
                            ]}
                            onPress={() => setFormData({ ...formData, status: 'ATIVA' })}
                        >
                            <Text style={[
                                styles.statusButtonText,
                                formData.status === 'ATIVA' && styles.statusButtonTextActive
                            ]}>
                                Ativa
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                formData.status === 'INATIVA' && styles.statusButtonInactive
                            ]}
                            onPress={() => setFormData({ ...formData, status: 'INATIVA' })}
                        >
                            <Text style={[
                                styles.statusButtonText,
                                formData.status === 'INATIVA' && styles.statusButtonTextInactive
                            ]}>
                                Inativa
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>Horários da Turma</Text>
                        <TouchableOpacity onPress={addSchedule} style={styles.addButtonMini}>
                            <Ionicons name="add-circle" size={24} color="#4F46E5" />
                        </TouchableOpacity>
                    </View>

                    {schedules.map((sched, idx) => (
                        <View key={idx} style={styles.scheduleRow}>
                            <View style={styles.daySelector}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {DAYS_OF_WEEK.map((day) => (
                                        <TouchableOpacity
                                            key={day.key}
                                            style={[
                                                styles.dayMiniButton,
                                                sched.dayOfWeek === day.key && styles.dayMiniButtonSelected
                                            ]}
                                            onPress={() => updateSchedule(idx, 'dayOfWeek', day.key)}
                                        >
                                            <Text style={[
                                                styles.dayMiniText,
                                                sched.dayOfWeek === day.key && styles.dayMiniTextSelected
                                            ]}>
                                                {day.key}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={styles.timeInputRow}>
                                <TextInput
                                    style={styles.timeInput}
                                    placeholder="18:00"
                                    value={sched.startTime}
                                    onChangeText={(t) => updateSchedule(idx, 'startTime', t)}
                                    keyboardType="numbers-and-punctuation"
                                    maxLength={5}
                                />
                                <TouchableOpacity onPress={() => removeSchedule(idx)} style={styles.removeButton}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.teacherSelector}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <TouchableOpacity
                                        style={[
                                            styles.teacherMiniButton,
                                            !sched.teacherId && styles.teacherMiniButtonSelected
                                        ]}
                                        onPress={() => updateSchedule(idx, 'teacherId', null)}
                                    >
                                        <Text style={[
                                            styles.teacherMiniText,
                                            !sched.teacherId && styles.teacherMiniTextSelected
                                        ]}>
                                            {formData.teacherId ? 'Seguir Padrão' : 'Sem Professor'}
                                        </Text>
                                    </TouchableOpacity>
                                    {teachers.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[
                                                styles.teacherMiniButton,
                                                sched.teacherId === t.id && styles.teacherMiniButtonSelected
                                            ]}
                                            onPress={() => updateSchedule(idx, 'teacherId', t.id)}
                                        >
                                            <Text style={[
                                                styles.teacherMiniText,
                                                sched.teacherId === t.id && styles.teacherMiniTextSelected
                                            ]}>
                                                {t.full_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={{ flex: 1 }}
                />
                <Button
                    title={turmaId ? 'Atualizar' : 'Criar Turma'}
                    onPress={handleSave}
                    loading={loading}
                    style={{ flex: 1 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827'
    },
    content: {
        padding: 16
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFF'
    },
    unitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    unitOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFF'
    },
    unitOptionSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    unitColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6
    },
    unitOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280'
    },
    unitOptionTextSelected: {
        color: '#FFF'
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8
    },
    statusButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        backgroundColor: '#FFF'
    },
    statusButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981'
    },
    statusButtonInactive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444'
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    statusButtonTextActive: {
        color: '#FFF'
    },
    statusButtonTextInactive: {
        color: '#FFF'
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    addButtonMini: {
        padding: 4
    },
    scheduleRow: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    daySelector: {
        marginBottom: 12
    },
    dayMiniButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginRight: 8,
        backgroundColor: '#FFF'
    },
    dayMiniButtonSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    dayMiniText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280'
    },
    dayMiniTextSelected: {
        color: '#FFF'
    },
    timeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    timeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#F9FAFB'
    },
    removeButton: {
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8
    },
    teacherSelector: {
        marginTop: 12
    },
    teacherMiniButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 6,
        backgroundColor: '#F9FAFB'
    },
    teacherMiniButtonSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5'
    },
    teacherMiniText: {
        fontSize: 11,
        color: '#6B7280'
    },
    teacherMiniTextSelected: {
        color: '#4F46E5',
        fontWeight: 'bold'
    },
    chipRow: {
        marginTop: 8,
        marginBottom: 8
    },
    activityChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFF',
        marginRight: 8
    },
    activityChipSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    activityChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280'
    },
    activityChipTextSelected: {
        color: '#FFF'
    },
    dayButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF'
    },
    dayButtonSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    dayButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280'
    },
    dayButtonTextSelected: {
        color: '#FFF'
    },
    previewBox: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    previewLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4
    },
    previewText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500'
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    }
});
