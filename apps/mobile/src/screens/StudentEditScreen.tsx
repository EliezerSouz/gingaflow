import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function StudentEditScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { id } = route.params as { id: string };

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        cpf: '',
        email: '',
        phone: '',
        birth_date: '',
        status: 'ATIVO'
    });

    useEffect(() => {
        load();
    }, [id]);

    async function load() {
        try {
            setLoading(true);
            const res = await api.get(`/students/${id}`);
            setFormData({
                full_name: res.data.full_name,
                cpf: res.data.cpf,
                email: res.data.email || '',
                phone: res.data.phone || '',
                birth_date: res.data.birth_date || '',
                status: res.data.status
            });
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            await api.put(`/students/${id}`, formData);
            Alert.alert('Sucesso', 'Aluno atualizado!');
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha ao salvar');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#4F46E5" />;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card>
                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.full_name}
                        onChangeText={t => setFormData({ ...formData, full_name: t })}
                    />

                    <Text style={styles.label}>CPF</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: '#F3F4F6', color: '#9CA3AF' }]}
                        value={formData.cpf}
                        editable={false}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={t => setFormData({ ...formData, email: t })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Telefone</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.phone}
                        onChangeText={t => setFormData({ ...formData, phone: t })}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Status (ATIVO/INATIVO)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.status}
                        onChangeText={t => setFormData({ ...formData, status: t })}
                        autoCapitalize="characters"
                    />

                </Card>

                <Button title="Salvar Alterações" onPress={handleSave} loading={saving} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 16 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#FFF' }
});
