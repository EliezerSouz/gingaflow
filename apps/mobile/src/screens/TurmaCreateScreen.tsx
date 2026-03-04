import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
        schedule: '',
        defaultMonthlyFeeCents: '',
        status: 'ATIVA' as 'ATIVA' | 'INATIVA'
    });

    // Estado para construir o horário
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [time, setTime] = useState('18:00');

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
                schedule: turma.schedule || '',
                defaultMonthlyFeeCents: turma.defaultMonthlyFeeCents ? (turma.defaultMonthlyFeeCents / 100).toString() : '',
                status: turma.status || 'ATIVA'
            });

            // Parse schedule (ex: "SEG 18:00, QUA 18:00")
            if (turma.schedule) {
                const parts = turma.schedule.split(',').map((s: string) => s.trim());
                const days = parts.map((p: string) => p.split(' ')[0]).filter(Boolean);
                const firstTime = parts[0]?.split(' ')[1];
                setSelectedDays(days);
                if (firstTime) setTime(firstTime);
            }
        } catch (error: any) {
            console.error('Erro ao carregar turma:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados da turma');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const buildSchedule = () => {
        if (selectedDays.length === 0) return '';
        return selectedDays.map(day => `${day} ${time}`).join(', ');
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

        if (selectedDays.length === 0) {
            Alert.alert('Erro', 'Selecione pelo menos um dia da semana');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name.trim(),
                unitId: formData.unitId,
                activityTypeId: formData.activityTypeId || null,
                teacherId: formData.teacherId || null,
                schedule: buildSchedule(),
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

                    <Text style={styles.label}>Professor Responsável</Text>
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
                    <Text style={styles.sectionTitle}>Horários</Text>

                    <Text style={styles.label}>Dias da Semana *</Text>
                    <View style={styles.daysGrid}>
                        {DAYS_OF_WEEK.map((day) => (
                            <TouchableOpacity
                                key={day.key}
                                style={[
                                    styles.dayButton,
                                    selectedDays.includes(day.key) && styles.dayButtonSelected
                                ]}
                                onPress={() => toggleDay(day.key)}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    selectedDays.includes(day.key) && styles.dayButtonTextSelected
                                ]}>
                                    {day.key}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Horário *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 18:00"
                        value={time}
                        onChangeText={setTime}
                        keyboardType="numbers-and-punctuation"
                    />

                    {selectedDays.length > 0 && (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewLabel}>Horário configurado:</Text>
                            <Text style={styles.previewText}>{buildSchedule()}</Text>
                        </View>
                    )}
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
