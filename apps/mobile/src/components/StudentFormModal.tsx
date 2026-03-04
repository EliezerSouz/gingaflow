import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Switch,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CordaBadge } from './ui/CordaBadge';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface StudentFormModalProps {
    visible: boolean;
    studentId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StudentFormModal({ visible, studentId, onClose, onSuccess }: StudentFormModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // State for all data (cache)
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [allUnits, setAllUnits] = useState<any[]>([]);
    const [activityTypes, setActivityTypes] = useState<any[]>([]);
    const [graduations, setGraduations] = useState<any[]>([]);

    // DatePicker states
    const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
    const [showGradDatePicker, setShowGradDatePicker] = useState(false);

    // Form States
    const [pessoal, setPessoal] = useState({
        full_name: '',
        nickname: '',
        cpf: '',
        birth_date: '',
        status: true,
        activityTypeIds: [] as string[]
    });

    const [contato, setContato] = useState({
        phone: '',
        whatsapp: '',
        email: '',
        address_street: '',
        address_number: '',
        address_district: '',
        address_city: '',
        address_state: '',
        address_zip: ''
    });

    const [responsavel, setResponsavel] = useState({
        full_name: '',
        cpf: '',
        relationship: '',
        phone: '',
        whatsapp: '',
        email: '',
        is_financial_responsible: false,
        same_address: true
    });

    const [capoeira, setCapoeira] = useState({
        graduation: '',
        graduation_date: '',
        unit: '',
        turmaIds: [] as string[],
        enrollment_date: new Date().toISOString().split('T')[0]
    });

    const [financeiro, setFinanceiro] = useState({
        monthly_fee: '',
        due_day: '',
        payment_method: ''
    });

    const [obs, setObs] = useState('');

    // Derived Data via useMemo
    const units = React.useMemo(() => {
        if (pessoal.activityTypeIds.length > 0) {
            return allUnits.filter(unit =>
                unit.turmas?.some((t: any) => pessoal.activityTypeIds.includes(t.activityTypeId))
            );
        }
        return [];
    }, [pessoal.activityTypeIds, allUnits]);


    const teachersDisplay = React.useMemo(() => {
        const names = new Set<string>();
        // Only consider turmas that belong to the currently selected activity types
        const currentActivityTypeIds = pessoal.activityTypeIds;

        capoeira.turmaIds.forEach(tid => {
            let foundTurma: any = null;
            allUnits.some(unit => {
                foundTurma = unit.turmas?.find((t: any) => t.id === tid);
                // Extra check: only add teacher if the turma belongs to one of the selected activities
                if (foundTurma && !currentActivityTypeIds.includes(foundTurma.activityTypeId)) {
                    foundTurma = null;
                }
                return !!foundTurma;
            });
            if (foundTurma?.teacher?.full_name) {
                names.add(foundTurma.teacher.full_name);
            }
        });
        return Array.from(names).join(', ');
    }, [capoeira.turmaIds, allUnits, pessoal.activityTypeIds]);

    // Calcular idade
    function calculateAge(birthDate: string): number {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return 0;
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    const age = calculateAge(pessoal.birth_date);
    const isMinor = age > 0 && age < 18;

    const selectedActivities = activityTypes.filter(a => pessoal.activityTypeIds.includes(a.id));
    // ONLY show graduation if at least one activity is selected AND it uses graduation
    const usaGraduacao = selectedActivities.length > 0 && selectedActivities.some(a => a.usaGraduacao);

    // Dynamic Tabs
    const tabs = ['Dados Gerais'];
    if (isMinor) tabs.push('Responsável');
    tabs.push('Atividade');
    tabs.push('Financeiro & Obs');
    const currentTabs = tabs;

    useEffect(() => {
        if (visible) {
            loadPickerData();
            if (studentId) {
                loadStudent();
            } else {
                resetForm();
            }
        }
    }, [visible, studentId]);

    async function loadPickerData() {
        try {
            const [teachersRes, unitsRes, activityRes, settingsRes] = await Promise.all([
                api.get('/teachers'),
                api.get('/units'),
                api.get('/activity-types').catch(() => ({ data: [] })),
                api.get('/settings').catch(() => ({ data: { graduations: [] } }))
            ]);

            const tData = teachersRes.data.data || [];
            const uData = unitsRes.data.data || [];
            const aData = activityRes.data || [];

            setAllTeachers(tData);
            setAllUnits(uData);
            setActivityTypes(aData);

            const graduationsFromSettings = settingsRes.data.graduations || [];
            const activeGrads = graduationsFromSettings
                .filter((g: any) => g.active)
                .sort((a: any, b: any) => a.order - b.order);
            setGraduations(activeGrads);
        } catch (e) {
            console.log('Erro ao carregar dados dos seletores:', e);
        }
    }

    // Auto-fill logic for price
    useEffect(() => {
        // Filter out any turmaId that doesn't correspond to the selected activity types
        const validTurmaIds = capoeira.turmaIds.filter(tid => {
            let found: any = null;
            allUnits.some(u => {
                found = u.turmas?.find((t: any) => t.id === tid);
                return !!found;
            });
            return found && pessoal.activityTypeIds.includes(found.activityTypeId);
        });

        if (validTurmaIds.length > 0) {
            let totalCents = 0;
            validTurmaIds.forEach(tid => {
                let found: any = null;
                allUnits.some(u => {
                    found = u.turmas?.find((t: any) => t.id === tid);
                    return !!found;
                });
                if (found?.defaultMonthlyFeeCents) {
                    totalCents += found.defaultMonthlyFeeCents;
                }
            });

            if (totalCents > 0) {
                const newFee = (totalCents / 100).toFixed(2).replace('.', ',');
                if (financeiro.monthly_fee !== newFee) {
                    setFinanceiro(prev => ({ ...prev, monthly_fee: newFee }));
                }
            }
        } else {
            // If no valid turmas are selected, reset the monthly fee value
            if (financeiro.monthly_fee !== '' && financeiro.monthly_fee !== '0,00') {
                setFinanceiro(prev => ({ ...prev, monthly_fee: '' }));
            }
        }
    }, [capoeira.turmaIds, allUnits, financeiro.monthly_fee, pessoal.activityTypeIds]);

    function resetForm() {
        setPessoal({ full_name: '', nickname: '', cpf: '', birth_date: '', status: true, activityTypeIds: [] });
        setContato({ phone: '', whatsapp: '', email: '', address_street: '', address_number: '', address_district: '', address_city: '', address_state: '', address_zip: '' });
        setResponsavel({ full_name: '', cpf: '', relationship: '', phone: '', whatsapp: '', email: '', is_financial_responsible: false, same_address: true });
        setCapoeira({ graduation: '', graduation_date: '', unit: '', turmaIds: [], enrollment_date: new Date().toISOString().split('T')[0] });
        setFinanceiro({ monthly_fee: '', due_day: '', payment_method: '' });
        setObs('');
        setActiveTab(0);
    }

    async function loadStudent() {
        try {
            setLoading(true);
            const res = await api.get(`/students/${studentId}`);
            const s = res.data;

            setPessoal({
                full_name: s.full_name,
                nickname: s.nickname || '',
                cpf: s.cpf || '',
                birth_date: s.birth_date || '',
                status: s.status === 'ATIVO',
                activityTypeIds: s.activities?.map((a: any) => a.activityTypeId) || []
            });

            const unitName = s.studentTurmas?.[0]?.turma?.unit?.name || '';
            const tIds = s.studentTurmas?.map((st: any) => st.turmaId) || [];

            setCapoeira(prev => ({
                ...prev,
                unit: unitName,
                turmaIds: tIds,
                graduation: s.graduations?.[0]?.level || '',
                graduation_date: s.graduations?.[0]?.date ? new Date(s.graduations[0].date).toLocaleDateString('pt-BR') : '',
                enrollment_date: s.enrollment_date || prev.enrollment_date
            }));

            const notes = s.notes || '';

            // Extrair apenas as observações (o que vem depois de [OBSERVAÇÕES])
            const obsPart = notes.split(/\[OBSERVAÇÕES\]\r?\n/)[1] || '';
            setObs(obsPart.trim());

            const respMatch = notes.match(/\[RESPONSÁVEL\]\r?\nNome: (.*)\r?\nCPF: (.*)\r?\nParentesco: (.*)\r?\nTelefone: (.*)/);
            if (respMatch) {
                setResponsavel({
                    full_name: respMatch[1],
                    cpf: respMatch[2],
                    relationship: respMatch[3],
                    phone: respMatch[4],
                    whatsapp: respMatch[4],
                    email: '',
                    is_financial_responsible: true,
                    same_address: true
                });
            }

            const finMatch = notes.match(/\[FINANCEIRO\]\r?\nMensalidade: (.*)\r?\nVencimento: Dia (.*)\r?\nForma Pagamento: (.*)/);
            if (finMatch) {
                setFinanceiro({
                    monthly_fee: finMatch[1],
                    due_day: finMatch[2],
                    payment_method: finMatch[3]
                });
            }
        } catch (e) {
            console.log('Erro loadStudent:', e);
            Alert.alert('Erro', 'Não foi possível carregar os dados do aluno');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!pessoal.full_name || !pessoal.cpf) {
            Alert.alert('Erro', 'Nome e CPF são obrigatórios');
            setActiveTab(0);
            return;
        }

        // Clean up turmaIds before saving - ensure they match the selected activities
        const finalTurmaIds = capoeira.turmaIds.filter(tid => {
            let found: any = null;
            allUnits.some(u => {
                found = u.turmas?.find((t: any) => t.id === tid);
                return !!found;
            });
            return found && pessoal.activityTypeIds.includes(found.activityTypeId);
        });

        try {
            setSaving(true);
            const extraInfo = `
[RESPONSÁVEL]
Nome: ${responsavel.full_name}
CPF: ${responsavel.cpf}
Parentesco: ${responsavel.relationship}
Telefone: ${responsavel.phone}

[CAPOEIRA]
Graduação: ${capoeira.graduation}
Data Graduação: ${capoeira.graduation_date}

[FINANCEIRO]
Mensalidade: ${financeiro.monthly_fee}
Vencimento: Dia ${financeiro.due_day}
Forma Pagamento: ${financeiro.payment_method}

[OBSERVAÇÕES]
${obs}
`.trim();

            const payload = {
                full_name: pessoal.full_name,
                nickname: pessoal.nickname || undefined,
                cpf: pessoal.cpf.replace(/\D/g, ''),
                birth_date: pessoal.birth_date || undefined,
                email: contato.email || undefined,
                phone: contato.phone.replace(/\D/g, '') || undefined,
                status: pessoal.status ? 'ATIVO' : 'INATIVO',
                enrollment_date: capoeira.enrollment_date,
                activityTypeIds: pessoal.activityTypeIds,
                turmaIds: finalTurmaIds,
                notes: extraInfo
            };

            if (studentId) {
                await api.put(`/students/${studentId}`, payload);
                Alert.alert('Sucesso', 'Aluno atualizado!');
            } else {
                await api.post('/students', payload);
                Alert.alert('Sucesso', 'Aluno cadastrado!');
            }

            onSuccess();
            onClose();
        } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha ao salvar');
        } finally {
            setSaving(false);
        }
    }

    function renderTabContent() {
        const tabTitle = currentTabs[activeTab];

        if (tabTitle === 'Dados Gerais') {
            return (
                <ScrollView style={styles.tabContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Dados Pessoais</Text>

                        <Text style={styles.label}>Nome Completo *</Text>
                        <TextInput
                            style={styles.input}
                            value={pessoal.full_name}
                            onChangeText={t => setPessoal({ ...pessoal, full_name: t })}
                            placeholder="Ex: João da Silva"
                        />

                        <Text style={styles.label}>Apelido</Text>
                        <TextInput
                            style={styles.input}
                            value={pessoal.nickname}
                            onChangeText={t => setPessoal({ ...pessoal, nickname: t })}
                            placeholder="Ex: Guerreiro"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>CPF *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={pessoal.cpf}
                                    onChangeText={t => setPessoal({ ...pessoal, cpf: t })}
                                    placeholder="000.000.000-00"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.label}>Data Nascimento</Text>
                                <TouchableOpacity onPress={() => setShowBirthDatePicker(true)}>
                                    <View style={[styles.input, { justifyContent: 'center' }]}>
                                        <Text style={{ color: pessoal.birth_date ? '#111827' : '#9CA3AF' }}>
                                            {pessoal.birth_date ? new Date(pessoal.birth_date).toLocaleDateString('pt-BR') : 'Selecionar'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {showBirthDatePicker && (
                                    <DateTimePicker
                                        value={pessoal.birth_date ? new Date(pessoal.birth_date) : new Date()}
                                        mode="date"
                                        display="default"
                                        locale="pt-BR"
                                        onChange={(event: any, selectedDate: any) => {
                                            setShowBirthDatePicker(false);
                                            if (selectedDate) {
                                                setPessoal({ ...pessoal, birth_date: selectedDate.toISOString().split('T')[0] });
                                            }
                                        }}
                                    />
                                )}
                            </View>
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Aluno Ativo</Text>
                            <Switch
                                value={pessoal.status}
                                onValueChange={v => setPessoal({ ...pessoal, status: v })}
                            />
                        </View>

                        <Text style={styles.label}>Tipos de Atividade *</Text>
                        <View style={styles.activityGrid}>
                            {activityTypes.map(a => {
                                const isSelected = pessoal.activityTypeIds.includes(a.id);
                                return (
                                    <TouchableOpacity
                                        key={a.id}
                                        style={[
                                            styles.activityChip,
                                            isSelected && styles.activityChipSelected,
                                            user?.role !== 'ADMIN' && styles.activityChipDisabled
                                        ]}
                                        onPress={() => {
                                            if (user?.role !== 'ADMIN') {
                                                Alert.alert('Aviso', 'Apenas administradores podem alterar o tipo de atividade.');
                                                return;
                                            }
                                            if (isSelected) {
                                                setPessoal({
                                                    ...pessoal,
                                                    activityTypeIds: pessoal.activityTypeIds.filter(id => id !== a.id)
                                                });
                                            } else {
                                                setPessoal({
                                                    ...pessoal,
                                                    activityTypeIds: [...pessoal.activityTypeIds, a.id]
                                                });
                                            }
                                        }}
                                        disabled={user?.role !== 'ADMIN'}
                                    >
                                        <Text style={[
                                            styles.activityChipText,
                                            isSelected && styles.activityChipTextSelected,
                                            user?.role !== 'ADMIN' && { color: '#9CA3AF' }
                                        ]}>
                                            {a.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contato</Text>
                        <Text style={styles.label}>WhatsApp / Telefone</Text>
                        <TextInput
                            style={styles.input}
                            value={contato.whatsapp}
                            onChangeText={t => setContato({ ...contato, whatsapp: t, phone: t })}
                            placeholder="(00) 00000-0000"
                            keyboardType="phone-pad"
                        />
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={contato.email}
                            onChangeText={t => setContato({ ...contato, email: t })}
                            placeholder="email@exemplo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </ScrollView>
            );
        }

        if (tabTitle === 'Responsável') {
            return (
                <ScrollView style={styles.tabContent}>
                    <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="alert-circle" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '600' }}>
                            Aluno menor de idade ({age} anos) - Responsável obrigatório
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Dados do Responsável</Text>

                    <Text style={styles.label}>Nome do Responsável</Text>
                    <TextInput
                        style={styles.input}
                        value={responsavel.full_name}
                        onChangeText={t => setResponsavel({ ...responsavel, full_name: t })}
                        placeholder="Nome completo"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>CPF</Text>
                            <TextInput
                                style={styles.input}
                                value={responsavel.cpf}
                                onChangeText={t => setResponsavel({ ...responsavel, cpf: t })}
                                keyboardType="numeric"
                                placeholder="000.000.000-00"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.label}>Parentesco</Text>
                            <TextInput
                                style={styles.input}
                                value={responsavel.relationship}
                                onChangeText={t => setResponsavel({ ...responsavel, relationship: t })}
                                placeholder="Ex: Pai, Mãe..."
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Telefone de Contato</Text>
                    <TextInput
                        style={styles.input}
                        value={responsavel.phone}
                        onChangeText={t => setResponsavel({ ...responsavel, phone: t })}
                        keyboardType="phone-pad"
                        placeholder="(00) 00000-0000"
                    />
                </ScrollView>
            );
        }

        if (tabTitle === 'Atividade') {
            return (
                <ScrollView style={styles.tabContent}>
                    {usaGraduacao && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Graduação</Text>
                            <Text style={styles.label}>Corda / Nível</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={capoeira.graduation}
                                    onValueChange={(v: any) => setCapoeira({ ...capoeira, graduation: v })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Selecione..." value="" />
                                    {graduations.map(g => (
                                        <Picker.Item key={g.name} label={g.name} value={g.name} />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Data da Graduação</Text>
                            <TouchableOpacity onPress={() => setShowGradDatePicker(true)}>
                                <View style={[styles.input, { justifyContent: 'center' }]}>
                                    <Text style={{ color: capoeira.graduation_date ? '#111827' : '#9CA3AF' }}>
                                        {capoeira.graduation_date ? new Date(capoeira.graduation_date).toLocaleDateString('pt-BR') : 'Selecionar'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {showGradDatePicker && (
                                <DateTimePicker
                                    value={capoeira.graduation_date ? new Date(capoeira.graduation_date) : new Date()}
                                    mode="date"
                                    display="default"
                                    locale="pt-BR"
                                    onChange={(event: any, selectedDate: any) => {
                                        setShowGradDatePicker(false);
                                        if (selectedDate) {
                                            setCapoeira({ ...capoeira, graduation_date: selectedDate.toISOString().split('T')[0] });
                                        }
                                    }}
                                />
                            )}

                            {capoeira.graduation && (() => {
                                const selectedGrad = graduations.find(g => g.name === capoeira.graduation);
                                if (selectedGrad) {
                                    return (
                                        <View style={{ alignItems: 'center', marginVertical: 8, padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                                            <CordaBadge
                                                graduacao={selectedGrad.name}
                                                size="medium"
                                                showText={false}
                                                colorLeft={selectedGrad.colorLeft || selectedGrad.color}
                                                colorRight={selectedGrad.colorRight || selectedGrad.color}
                                                pontaLeft={selectedGrad.pontaLeft || selectedGrad.colorLeft || selectedGrad.color}
                                                pontaRight={selectedGrad.pontaRight || selectedGrad.colorRight || selectedGrad.color}
                                            />
                                        </View>
                                    );
                                }
                                return null;
                            })()}
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Matrícula em Turmas</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                            Selecione as turmas nas unidades abaixo. É possível se matricular em turmas de unidades diferentes.
                        </Text>

                        {units.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#9CA3AF', marginVertical: 20 }}>
                                Selecione ao menos um tipo de atividade na primeira aba.
                            </Text>
                        ) : (
                            units.map(u => {
                                const unitTurmas = u.turmas?.filter((t: any) =>
                                    pessoal.activityTypeIds.includes(t.activityTypeId)
                                ) || [];

                                if (unitTurmas.length === 0) return null;

                                return (
                                    <View key={u.id} style={{ marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                            <Ionicons name="business" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                                            <Text style={{ fontWeight: 'bold', color: '#374151' }}>{u.name}</Text>
                                        </View>

                                        <View style={styles.activityGrid}>
                                            {unitTurmas.map((t: any) => {
                                                const isSelected = capoeira.turmaIds.includes(t.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={t.id}
                                                        style={[styles.activityChip, isSelected && styles.activityChipSelected]}
                                                        onPress={() => {
                                                            if (isSelected) {
                                                                setCapoeira({
                                                                    ...capoeira,
                                                                    turmaIds: capoeira.turmaIds.filter(id => id !== t.id)
                                                                });
                                                            } else {
                                                                setCapoeira({
                                                                    ...capoeira,
                                                                    turmaIds: [...capoeira.turmaIds, t.id]
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <Text style={[styles.activityChipText, isSelected && styles.activityChipTextSelected]}>
                                                            {t.name} {t.schedule ? `(${t.schedule})` : ''}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {teachersDisplay ? (
                        <View style={{ padding: 12, backgroundColor: '#EFF6FF', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#3B82F6' }}>
                            <Text style={[styles.label, { marginTop: 0, color: '#1E40AF' }]}>Professores das Turmas</Text>
                            <Text style={{ fontSize: 15, color: '#1E3A8A', fontWeight: '500' }}>{teachersDisplay}</Text>
                        </View>
                    ) : null}
                </ScrollView>
            );
        }

        if (tabTitle === 'Financeiro & Obs') {
            return (
                <ScrollView style={styles.tabContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Financeiro</Text>
                        <Text style={styles.label}>Mensalidade (R$)</Text>
                        <TextInput
                            style={styles.input}
                            value={financeiro.monthly_fee}
                            onChangeText={t => setFinanceiro({ ...financeiro, monthly_fee: t })}
                            keyboardType="numeric"
                            placeholder="0,00"
                        />
                        <Text style={styles.label}>Dia Vencimento</Text>
                        <TextInput
                            style={styles.input}
                            value={financeiro.due_day}
                            onChangeText={t => setFinanceiro({ ...financeiro, due_day: t })}
                            keyboardType="numeric"
                            placeholder="1-31"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Observações</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            value={obs}
                            onChangeText={setObs}
                            multiline
                            numberOfLines={4}
                            placeholder="Anotações gerais..."
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>
            );
        }

        return null;
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{studentId ? 'Editar Aluno' : 'Novo Aluno'}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                        {currentTabs.map((tab, index) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === index && styles.tabActive]}
                                onPress={() => setActiveTab(index)}
                            >
                                <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Content */}
                    <View style={styles.content}>
                        {loading ? (
                            <Text style={styles.loading}>Carregando...</Text>
                        ) : (
                            renderTabContent()
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Button title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1, marginRight: 8 }} />
                        <Button
                            title={studentId ? 'Salvar Alterações' : 'Salvar Cadastro'}
                            onPress={handleSave}
                            loading={saving}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    tabsContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 8, maxHeight: 48 },
    tab: { paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 4 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
    tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    tabTextActive: { color: '#4F46E5', fontWeight: 'bold' },
    content: { flex: 1 },
    tabContent: { flex: 1, padding: 16 },
    section: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#FFF' },
    row: { flexDirection: 'row' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 12, backgroundColor: '#FFF' },
    picker: { height: 50 },
    footer: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    loading: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
    activityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
        marginBottom: 12
    },
    activityChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB'
    },
    activityChipSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    activityChipText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500'
    },
    activityChipTextSelected: {
        color: '#FFF'
    },
    activityChipDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        opacity: 0.8
    }
});
