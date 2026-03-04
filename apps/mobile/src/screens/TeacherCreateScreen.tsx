import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface Unit {
    id: string;
    name: string;
    color?: string;
}

interface Turma {
    id: string;
    name: string;
    unitId: string;
    schedule: string;
    teacherId?: string | null;
    teacher?: {
        full_name: string;
        nickname?: string | null;
    } | null;
}

export default function TeacherCreateScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user: currentUser } = useAuth();
    const teacherId = (route.params as any)?.teacherId;
    const [activeTab, setActiveTab] = useState<'principal' | 'acesso' | 'turmas'>('principal');

    const [loading, setLoading] = useState(false);
    const [graduations, setGraduations] = useState<string[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [allTurmas, setAllTurmas] = useState<Turma[]>([]);
    const [formData, setFormData] = useState({
        full_name: '',
        nickname: '',
        cpf: '',
        email: '',
        phone: '',
        graduation: '',
        status: 'ATIVO' as 'ATIVO' | 'INATIVO',
        notes: '',
        role: 'PROFESSOR' as 'PROFESSOR' | 'ADMIN'
    });
    const [createAccount, setCreateAccount] = useState(false);
    const [password, setPassword] = useState('');
    const [hasUser, setHasUser] = useState(false);
    const [selectedTurmas, setSelectedTurmas] = useState<string[]>([]);

    useEffect(() => {
        loadInitialData();
        if (teacherId) {
            loadTeacher();
        }
    }, [teacherId]);

    const loadInitialData = async () => {
        try {
            // Carregar graduações
            const settingsRes = await api.get('/settings');
            const grads = settingsRes.data.graduations || [];
            setGraduations(grads.map((g: any) => g.name));

            // Carregar unidades
            const unitsRes = await api.get('/units');
            const unitsData = unitsRes.data.data || unitsRes.data;
            setUnits(unitsData);

            // Carregar todas as turmas
            const turmasPromises = unitsData.map((unit: Unit) =>
                api.get(`/units/${unit.id}/turmas`)
                    .then(res => (res.data.data || res.data).map((t: any) => ({ ...t, unitId: unit.id })))
                    .catch(() => [])
            );
            const turmasArrays = await Promise.all(turmasPromises);
            const allTurmasData = turmasArrays.flat();
            setAllTurmas(allTurmasData);
        } catch (error: any) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    };

    const loadTeacher = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/teachers/${teacherId}`);
            const teacher = response.data;

            setFormData(prev => ({
                ...prev,
                full_name: teacher.full_name || '',
                nickname: teacher.nickname || '',
                cpf: teacher.cpf || '',
                email: teacher.email || '',
                phone: teacher.phone || '',
                graduation: teacher.graduation || '',
                status: teacher.status || 'ATIVO',
                notes: teacher.notes || '',
                role: teacher.user?.role || prev.role
            }));

            setHasUser(!!teacher.userId);
            if (teacher.userId) {
                setCreateAccount(true);
            }

            // Extrair IDs das turmas vinculadas de Teacher.units (formato retornado pelo backend)
            if (teacher.units) {
                const turmaIds: string[] = [];
                teacher.units.forEach((unit: any) => {
                    if (unit.turmas) {
                        unit.turmas.forEach((turma: any) => {
                            turmaIds.push(turma.id);
                        });
                    }
                });
                setSelectedTurmas(turmaIds);
            }
        } catch (error: any) {
            console.error('Erro ao carregar professor:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do professor');
        } finally {
            setLoading(false);
        }
    };

    const toggleTurma = (turmaId: string) => {
        if (selectedTurmas.includes(turmaId)) {
            setSelectedTurmas(selectedTurmas.filter(id => id !== turmaId));
        } else {
            setSelectedTurmas([...selectedTurmas, turmaId]);
        }
    };

    const handleSave = async () => {
        if (!formData.full_name.trim()) {
            Alert.alert('Erro', 'Nome completo é obrigatório');
            return;
        }

        if (!formData.cpf.trim()) {
            Alert.alert('Erro', 'CPF é obrigatório');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                full_name: formData.full_name.trim(),
                cpf: formData.cpf.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                nickname: formData.nickname.trim() || null,
                graduation: formData.graduation || null,
                status: formData.status,
                notes: formData.notes,
                turmaIds: selectedTurmas,
                role: formData.role,
                createAccount: createAccount && !hasUser,
                password: password.length >= 6 ? password : undefined
            };

            if (teacherId) {
                await api.put(`/teachers/${teacherId}`, payload);
                Alert.alert('Sucesso', 'Professor atualizado!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await api.post('/teachers', payload);
                Alert.alert('Sucesso', 'Professor cadastrado!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            console.error('Erro ao salvar professor:', error);
            if (error.response?.data?.code === 'VALIDATION_ERROR') {
                const details = error.response.data.details;
                const messages = details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
                Alert.alert('Erro de Validação', `Por favor, verifique os campos:\n\n${messages}`);
            } else {
                Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar o professor');
            }
        } finally {
            setLoading(false);
        }
    };

    const getTurmasByUnit = () => {
        const turmasByUnit: Record<string, Turma[]> = {};
        allTurmas.forEach(turma => {
            const unit = units.find(u => u.id === turma.unitId);
            const unitName = unit?.name || 'Sem Unidade';
            if (!turmasByUnit[unitName]) {
                turmasByUnit[unitName] = [];
            }
            turmasByUnit[unitName].push(turma);
        });
        return turmasByUnit;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'principal' && styles.activeTab]}
                    onPress={() => setActiveTab('principal')}
                >
                    <Text style={[styles.tabText, activeTab === 'principal' && styles.activeTabText]}>Principal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'acesso' && styles.activeTab]}
                    onPress={() => setActiveTab('acesso')}
                >
                    <Text style={[styles.tabText, activeTab === 'acesso' && styles.activeTabText]}>Acesso</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'turmas' && styles.activeTab]}
                    onPress={() => setActiveTab('turmas')}
                >
                    <Text style={[styles.tabText, activeTab === 'turmas' && styles.activeTabText]}>Turmas</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'principal' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Dados Pessoais</Text>

                        <Text style={styles.label}>Nome Completo *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: João Silva"
                            value={formData.full_name}
                            onChangeText={text => setFormData({ ...formData, full_name: text })}
                        />

                        <Text style={styles.label}>Nome Artístico / Apelido</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Mestre Bimba"
                            value={formData.nickname}
                            onChangeText={text => setFormData({ ...formData, nickname: text })}
                        />

                        <Text style={styles.label}>CPF *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChangeText={text => setFormData({ ...formData, cpf: text })}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Email (Pessoal)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@exemplo.com"
                            value={formData.email}
                            onChangeText={text => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Telefone</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChangeText={text => setFormData({ ...formData, phone: text })}
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.label}>Graduação</Text>
                        <View style={styles.graduationsGrid}>
                            {graduations.map((grad) => (
                                <TouchableOpacity
                                    key={grad}
                                    style={[
                                        styles.graduationOption,
                                        formData.graduation === grad && styles.graduationOptionSelected
                                    ]}
                                    onPress={() => setFormData({ ...formData, graduation: grad })}
                                >
                                    <Text style={[
                                        styles.graduationOptionText,
                                        formData.graduation === grad && styles.graduationOptionTextSelected
                                    ]}>
                                        {grad}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    formData.status === 'ATIVO' && styles.statusButtonActive
                                ]}
                                onPress={() => setFormData({ ...formData, status: 'ATIVO' })}
                            >
                                <Text style={[
                                    styles.statusButtonText,
                                    formData.status === 'ATIVO' && styles.statusButtonTextActive
                                ]}>
                                    Ativo
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    formData.status === 'INATIVO' && styles.statusButtonInactive
                                ]}
                                onPress={() => setFormData({ ...formData, status: 'INATIVO' })}
                            >
                                <Text style={[
                                    styles.statusButtonText,
                                    formData.status === 'INATIVO' && styles.statusButtonTextInactive
                                ]}>
                                    Inativo
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Observações</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Informações adicionais..."
                            value={formData.notes}
                            onChangeText={text => setFormData({ ...formData, notes: text })}
                            multiline
                        />
                    </View>
                )}

                {activeTab === 'acesso' && (
                    <View style={styles.section}>
                        {currentUser?.role === 'ADMIN' ? (
                            <View>
                                <Text style={styles.sectionTitle}>Acesso ao Sistema</Text>
                                <Text style={styles.sectionSubtitle}>
                                    {hasUser
                                        ? 'Este professor já possui acesso ao sistema.'
                                        : 'Crie uma conta para o professor acessar o aplicativo.'}
                                </Text>

                                {!hasUser && (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                                        onPress={() => setCreateAccount(!createAccount)}
                                    >
                                        <View style={{
                                            width: 44,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: createAccount ? '#4F46E5' : '#D1D5DB',
                                            paddingHorizontal: 2,
                                            justifyContent: 'center'
                                        }}>
                                            <View style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 10,
                                                backgroundColor: '#FFF',
                                                transform: [{ translateX: createAccount ? 20 : 0 }]
                                            }} />
                                        </View>
                                        <Text style={{ marginLeft: 10, fontSize: 16, color: '#374151', fontWeight: '500' }}>
                                            Habilitar acesso ao aplicativo
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {(createAccount || hasUser) && (
                                    <>
                                        <Text style={styles.label}>Nível de Acesso (Papel)</Text>
                                        <View style={styles.statusButtons}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.statusButton,
                                                    formData.role === 'PROFESSOR' && styles.statusButtonActive
                                                ]}
                                                onPress={() => setFormData({ ...formData, role: 'PROFESSOR' })}
                                            >
                                                <Text style={[
                                                    styles.statusButtonText,
                                                    formData.role === 'PROFESSOR' && styles.statusButtonTextActive
                                                ]}>
                                                    Professor
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.statusButton,
                                                    formData.role === 'ADMIN' && styles.statusButtonActive
                                                ]}
                                                onPress={() => setFormData({ ...formData, role: 'ADMIN' })}
                                            >
                                                <Text style={[
                                                    styles.statusButtonText,
                                                    formData.role === 'ADMIN' && styles.statusButtonTextActive
                                                ]}>
                                                    Administrador
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={styles.label}>{hasUser ? 'Redefinir Senha' : 'Senha Temporária *'}</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder={hasUser ? "Deixe em branco para não alterar" : "No mínimo 6 caracteres"}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                                            O email cadastrado na aba Principal será usado como login.
                                        </Text>
                                    </>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.noTurmasText}>Apenas administradores podem gerenciar contas de acesso.</Text>
                        )}
                    </View>
                )}

                {activeTab === 'turmas' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Turmas</Text>
                        <Text style={styles.sectionSubtitle}>
                            Selecione as turmas que este professor leciona
                        </Text>

                        {Object.entries(getTurmasByUnit()).map(([unitName, turmas]) => (
                            <View key={unitName} style={styles.unitGroup}>
                                <Text style={styles.unitGroupTitle}>{unitName}</Text>
                                {turmas.map(turma => {
                                    const isAssignedToOther = turma.teacherId && turma.teacherId !== teacherId;
                                    const isSelected = selectedTurmas.includes(turma.id);

                                    return (
                                        <TouchableOpacity
                                            key={turma.id}
                                            style={[
                                                styles.turmaOption,
                                                isSelected && styles.turmaOptionSelected,
                                                isAssignedToOther && styles.turmaOptionDisabled
                                            ]}
                                            onPress={() => {
                                                if (isAssignedToOther) {
                                                    Alert.alert('Aviso', `Esta turma já pertence ao professor ${turma.teacher?.full_name}. Você deve primeiro desvinculá-la no cadastro dele.`);
                                                    return;
                                                }
                                                toggleTurma(turma.id);
                                            }}
                                            disabled={!!isAssignedToOther}
                                        >
                                            <View style={styles.turmaInfo}>
                                                <Text style={[
                                                    styles.turmaName,
                                                    isSelected && styles.turmaNameSelected,
                                                    isAssignedToOther && { color: '#9CA3AF' }
                                                ]}>
                                                    {turma.name}
                                                </Text>
                                                <Text style={[
                                                    styles.turmaSchedule,
                                                    isSelected && styles.turmaScheduleSelected,
                                                    isAssignedToOther && { color: '#D1D5DB' }
                                                ]}>
                                                    {turma.schedule}
                                                    {isAssignedToOther && ` • Resp: ${turma.teacher?.nickname || turma.teacher?.full_name}`}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}

                        {Object.keys(getTurmasByUnit()).length === 0 && (
                            <Text style={styles.noTurmasText}>
                                Nenhuma turma disponível. Cadastre turmas primeiro.
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={{ flex: 1 }}
                />
                <Button
                    title={teacherId ? 'Atualizar' : 'Cadastrar'}
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
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingHorizontal: 8
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#4F46E5',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280'
    },
    activeTabText: {
        color: '#4F46E5',
        fontWeight: 'bold'
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
        marginBottom: 4
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
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
    graduationsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    graduationOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFF'
    },
    graduationOptionSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    graduationOptionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280'
    },
    graduationOptionTextSelected: {
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
    unitGroup: {
        marginBottom: 20
    },
    unitGroupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    turmaOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFF',
        marginBottom: 8
    },
    turmaOptionSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5'
    },
    turmaOptionDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        opacity: 0.7
    },
    turmaInfo: {
        flex: 1
    },
    turmaName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2
    },
    turmaNameSelected: {
        color: '#4F46E5'
    },
    turmaSchedule: {
        fontSize: 12,
        color: '#6B7280'
    },
    turmaScheduleSelected: {
        color: '#6366F1'
    },
    checkmark: {
        fontSize: 18,
        color: '#4F46E5',
        fontWeight: 'bold'
    },
    noTurmasText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20
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
