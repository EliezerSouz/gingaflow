import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export default function StudentCreateScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        cpf: '',
        birth_date: '',
        email: '',
        phone: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'ATIVO',
        notes: ''
    });

    // Calcular se é menor de idade
    const isMinor = useMemo(() => {
        if (!formData.birth_date) return false;

        // Tentar parsear data no formato dd/mm/aaaa ou aaaa-mm-dd
        let birthDate: Date | null = null;

        if (formData.birth_date.includes('/')) {
            const [day, month, year] = formData.birth_date.split('/');
            birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (formData.birth_date.includes('-')) {
            birthDate = new Date(formData.birth_date);
        }

        if (!birthDate || isNaN(birthDate.getTime())) return false;

        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Ajustar idade se ainda não fez aniversário este ano
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            return (age - 1) < 18;
        }

        return age < 18;
    }, [formData.birth_date]);

    // Tabs dinâmicas baseadas na idade
    const TABS = useMemo(() => {
        const baseTabs = ['Pessoal', 'Contato'];
        if (isMinor) {
            baseTabs.push('Responsável');
        }
        baseTabs.push('Capoeira', 'Financeiro', 'Obs');
        return baseTabs;
    }, [isMinor]);

    async function handleSave() {
        if (!formData.full_name || !formData.cpf) {
            Alert.alert('Erro', 'Nome e CPF são obrigatórios');
            return;
        }

        try {
            setSaving(true);
            await api.post('/students', formData);
            Alert.alert('Sucesso', 'Aluno cadastrado!');
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha ao cadastrar');
        } finally {
            setSaving(false);
        }
    }

    function renderTabContent() {
        const currentTab = TABS[activeTab];

        switch (currentTab) {
            case 'Pessoal':
                return (
                    <>
                        <Text style={styles.label}>Nome Completo *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: João da Silva"
                            value={formData.full_name}
                            onChangeText={t => setFormData({ ...formData, full_name: t })}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>CPF *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChangeText={t => setFormData({ ...formData, cpf: t })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Data de Nascimento</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="dd/mm/aaaa"
                                    value={formData.birth_date}
                                    onChangeText={t => setFormData({ ...formData, birth_date: t })}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Status</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.statusButton, formData.status === 'ATIVO' && styles.statusButtonActive]}
                                onPress={() => setFormData({ ...formData, status: 'ATIVO' })}
                            >
                                <Text style={[styles.statusButtonText, formData.status === 'ATIVO' && styles.statusButtonTextActive]}>Ativo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statusButton, formData.status === 'INATIVO' && styles.statusButtonActive]}
                                onPress={() => setFormData({ ...formData, status: 'INATIVO' })}
                            >
                                <Text style={[styles.statusButtonText, formData.status === 'INATIVO' && styles.statusButtonTextActive]}>Inativo</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                );

            case 'Contato':
                return (
                    <>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@exemplo.com"
                            value={formData.email}
                            onChangeText={t => setFormData({ ...formData, email: t })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Telefone</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChangeText={t => setFormData({ ...formData, phone: t })}
                            keyboardType="phone-pad"
                        />
                    </>
                );

            case 'Responsável':
                return <Text style={styles.placeholder}>Campos de responsável (em breve)</Text>;

            case 'Capoeira':
                return <Text style={styles.placeholder}>Graduação e turmas (em breve)</Text>;

            case 'Financeiro':
                return <Text style={styles.placeholder}>Configurações financeiras (em breve)</Text>;

            case 'Obs':
                return (
                    <>
                        <Text style={styles.label}>Observações</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="Anotações gerais..."
                            value={formData.notes}
                            onChangeText={t => setFormData({ ...formData, notes: t })}
                            multiline
                        />
                    </>
                );

            default:
                return null;
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Novo Aluno</Text>
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === index && styles.tabActive]}
                        onPress={() => setActiveTab(index)}
                    >
                        <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.content}>
                {renderTabContent()}
            </ScrollView>

            <View style={styles.footer}>
                <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
                <Button title="Salvar Cadastro" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    tabsContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 8 },
    tab: { paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 4 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
    tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    tabTextActive: { color: '#4F46E5', fontWeight: 'bold' },
    content: { padding: 16 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 6, marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#FFF' },
    statusButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#FFF' },
    statusButtonActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
    statusButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    statusButtonTextActive: { color: '#FFF' },
    placeholder: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontStyle: 'italic' },
    footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' }
});
