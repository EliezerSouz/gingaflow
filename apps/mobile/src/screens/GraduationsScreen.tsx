
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Card } from '../components/ui/Card';
import { CordaBadge } from '../components/ui/CordaBadge';
import { GraduationFormModal } from '../components/GraduationFormModal';
import { useAuth } from '../context/AuthContext';

export default function GraduationsScreen() {
    const { user } = useAuth(); // Só admin deveria editar, mas por enquanto liberado
    const [graduations, setGraduations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGraduation, setEditingGraduation] = useState<any | null>(null);

    // Carregar dados
    async function loadGraduations() {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            const grads = res.data.graduations || [];
            // Ordenar por order
            const sorted = grads.sort((a: any, b: any) => a.order - b.order);
            setGraduations(sorted);
        } catch (e) {
            console.log('Erro ao carregar graduações:', e);
            Alert.alert('Erro', 'Não foi possível carregar as graduações.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadGraduations();
    }, []);

    // Salvar (Criar ou Atualizar)
    async function handleSave(grad: any) {
        try {
            // 1. Pegar settings atual completo para não perder nada
            const res = await api.get('/settings');
            const currentSettings = res.data || {};
            let currentGrads = currentSettings.graduations || [];

            if (editingGraduation) {
                // Update
                currentGrads = currentGrads.map((g: any) => g.id === grad.id ? grad : g);
            } else {
                // Create
                currentGrads.push(grad);
            }

            // 2. Enviar settings atualizado
            await api.put('/settings', {
                ...currentSettings,
                graduations: currentGrads
            });

            Alert.alert('Sucesso', 'Graduação salva com sucesso!');
            loadGraduations(); // Recarregar
            setModalVisible(false);
        } catch (e) {
            console.log('Erro ao salvar:', e);
            Alert.alert('Erro', 'Falha ao salvar graduação.');
        }
    }

    // Deletar
    async function handleDelete(id: string) {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta graduação?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir', style: 'destructive', onPress: async () => {
                        try {
                            const res = await api.get('/settings');
                            const currentSettings = res.data || {};
                            const currentGrads = currentSettings.graduations || [];

                            const newGrads = currentGrads.filter((g: any) => g.id !== id);

                            await api.put('/settings', {
                                ...currentSettings,
                                graduations: newGrads
                            });

                            Alert.alert('Sucesso', 'Graduação removida.');
                            loadGraduations();
                            setModalVisible(false);
                        } catch (e) {
                            console.log('Erro ao excluir:', e);
                            Alert.alert('Erro', 'Falha ao excluir.');
                        }
                    }
                }
            ]
        );
    }

    function openEdit(grad: any) {
        setEditingGraduation(grad);
        setModalVisible(true);
    }

    function openNew() {
        setEditingGraduation(null);
        setModalVisible(true);
    }

    if (loading) {
        return (
            <ScreenContainer>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Graduações</Text>
                    <Text style={styles.subtitle}>Sistema de cordas configurado</Text>
                </View>
                <TouchableOpacity onPress={openNew} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={graduations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7}>
                        <Card style={styles.gradCard}>
                            <View style={styles.gradRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <CordaBadge
                                            graduacao={item.name}
                                            size="medium"
                                            colorLeft={item.colorLeft || item.color}
                                            colorRight={item.colorRight || item.color}
                                            pontaLeft={item.pontaLeft || item.colorLeft || item.color}
                                            pontaRight={item.pontaRight || item.colorRight || item.color}
                                        />
                                    </View>

                                    <Text style={styles.gradName}>{item.name}</Text>

                                    {item.description && (
                                        <Text style={styles.gradDescription}>{item.description}</Text>
                                    )}

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                                        {item.category && (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>{item.category}</Text>
                                            </View>
                                        )}
                                        {item.grau && (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>Grau {item.grau}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={{ alignItems: 'flex-end' }}>
                                    {item.active ? (
                                        <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                                            <Text style={[styles.statusText, { color: '#065F46' }]}>Ativa</Text>
                                        </View>
                                    ) : (
                                        <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                                            <Text style={[styles.statusText, { color: '#991B1B' }]}>Inativa</Text>
                                        </View>
                                    )}
                                    <Text style={styles.orderText}>Ordem: {item.order}</Text>
                                    <Ionicons name="pencil" size={16} color="#9CA3AF" style={{ marginTop: 8 }} />
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="ribbon-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>Nenhuma graduação configurada</Text>
                        <TouchableOpacity onPress={openNew} style={styles.emptyButton}>
                            <Text style={styles.emptyButtonText}>Criar Primeira Graduação</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <GraduationFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSave}
                onDelete={editingGraduation ? handleDelete : undefined}
                initialData={editingGraduation}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    addButton: { backgroundColor: '#4F46E5', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
    list: { padding: 16, paddingTop: 0, paddingBottom: 80 },
    gradCard: { marginBottom: 12 },
    gradRow: { flexDirection: 'row', alignItems: 'flex-start' },
    gradName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
    gradDescription: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
    tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { fontSize: 11, fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    orderText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
    emptyButton: { marginTop: 16, backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    emptyButtonText: { color: '#FFF', fontWeight: '600' }
});

