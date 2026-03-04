import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch,
    ActivityIndicator,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useAuth } from '../context/AuthContext';

export default function ActivityTypesScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingActivity, setEditingActivity] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        usaGraduacao: true
    });

    useEffect(() => {
        loadActivities();
    }, []);

    async function loadActivities() {
        try {
            setLoading(true);
            const res = await api.get('/activity-types');
            setActivities(res.data);
        } catch (e) {
            console.log('Error loading activities:', e);
        } finally {
            setLoading(false);
        }
    }

    function openModal(activity: any = null) {
        if (activity) {
            setEditingActivity(activity);
            setFormData({
                name: activity.name,
                usaGraduacao: activity.usaGraduacao
            });
        } else {
            setEditingActivity(null);
            setFormData({
                name: '',
                usaGraduacao: true
            });
        }
        setModalVisible(true);
    }

    async function handleSave() {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome da atividade é obrigatório');
            return;
        }

        try {
            setLoading(true);
            if (editingActivity) {
                await api.put(`/activity-types/${editingActivity.id}`, formData);
            } else {
                await api.post('/activity-types', formData);
            }
            setModalVisible(false);
            loadActivities();
        } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha ao salvar');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        Alert.alert(
            'Confirmar Exclusão',
            'Deseja realmente excluir este tipo de atividade? Isso pode afetar turmas e alunos vinculados.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/activity-types/${id}`);
                            loadActivities();
                        } catch (e) {
                            Alert.alert('Erro', 'Não foi possível excluir.');
                        }
                    }
                }
            ]
        );
    }

    if (user?.role !== 'ADMIN') {
        return (
            <ScreenContainer>
                <View style={styles.centered}>
                    <Text>Acesso restrito para administradores.</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Tipos de Atividade</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.addButtonText}>Nova</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading && activities.length === 0 ? (
                    <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
                ) : (
                    activities.map(item => (
                        <Card key={item.id} style={styles.card}>
                            <View style={styles.cardContent}>
                                <View style={styles.info}>
                                    <Text style={styles.activityName}>{item.name}</Text>
                                    <View style={styles.tagContainer}>
                                        <View style={[styles.tag, { backgroundColor: item.usaGraduacao ? '#D1FAE5' : '#F3F4F6' }]}>
                                            <Text style={[styles.tagText, { color: item.usaGraduacao ? '#065F46' : '#6B7280' }]}>
                                                {item.usaGraduacao ? 'Com Graduação' : 'Sem Graduação'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
                                        <Ionicons name="pencil" size={20} color="#4F46E5" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    ))
                )}

                {!loading && activities.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="construct-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Nenhuma atividade cadastrada.</Text>
                    </View>
                )}
            </ScrollView>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingActivity ? 'Editar Atividade' : 'Nova Atividade'}</Text>

                        <Text style={styles.label}>Nome da Atividade</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={t => setFormData({ ...formData, name: t })}
                            placeholder="Ex: Capoeira, Spinning, CrossFit..."
                        />

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Utiliza Graduação / Níveis?</Text>
                                <Text style={styles.switchSub}>Se ativado, permite selecionar cordas/níveis para os alunos desta atividade.</Text>
                            </View>
                            <Switch
                                value={formData.usaGraduacao}
                                onValueChange={v => setFormData({ ...formData, usaGraduacao: v })}
                                trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                                thumbColor={formData.usaGraduacao ? '#4F46E5' : '#F3F4F6'}
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <Button
                                title="Cancelar"
                                variant="outline"
                                onPress={() => setModalVisible(false)}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Salvar"
                                onPress={handleSave}
                                loading={loading}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4 },
    content: { padding: 16 },
    card: { marginBottom: 12 },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    info: { flex: 1 },
    activityName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    tagContainer: { flexDirection: 'row' },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 11, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#9CA3AF', fontSize: 16, marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    switchSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    modalFooter: { flexDirection: 'row' }
});
