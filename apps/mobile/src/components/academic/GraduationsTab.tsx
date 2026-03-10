import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { CordaBadge } from '../ui/CordaBadge';
import { GraduationFormModal } from '../GraduationFormModal';

export default function GraduationsTab() {
    const [graduations, setGraduations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGraduation, setEditingGraduation] = useState<any | null>(null);

    async function loadGraduations() {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            const grads = res.data.graduations || [];
            const sorted = grads.sort((a: any, b: any) => a.order - b.order);
            setGraduations(sorted);
        } catch (e) {
            console.log(e);
            Alert.alert('Erro', 'Não foi possível carregar as graduações.');
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadGraduations();
        }, [])
    );

    async function handleSave(grad: any) {
        try {
            const res = await api.get('/settings');
            const currentSettings = res.data || {};
            let currentGrads = currentSettings.graduations || [];

            if (editingGraduation) {
                currentGrads = currentGrads.map((g: any) => g.id === grad.id ? grad : g);
            } else {
                currentGrads.push(grad);
            }

            await api.put('/settings', {
                ...currentSettings,
                graduations: currentGrads
            });

            Alert.alert('Sucesso', 'Graduação salva!');
            loadGraduations();
            setModalVisible(false);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar graduação.');
        }
    }

    function openEdit(grad: any) {
        setEditingGraduation(grad);
        setModalVisible(true);
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.tabTitle}>Sistema de Cordas</Text>
                    <Text style={styles.tabSubtitle}>{graduations.length} níveis ativos</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditingGraduation(null); setModalVisible(true); }} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && graduations.length === 0 && <ActivityIndicator style={{ marginVertical: 20 }} color="#4F46E5" />}

            <FlatList
                data={graduations}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadGraduations} tintColor="#4F46E5" />}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7}>
                        <Card style={styles.gradCard}>
                            <View style={styles.gradRow}>
                                <CordaBadge
                                    graduacao=""
                                    size="medium"
                                    colorLeft={item.colorLeft || item.color}
                                    colorRight={item.colorRight || item.color}
                                    pontaLeft={item.pontaLeft || item.colorLeft || item.color}
                                    pontaRight={item.pontaRight || item.colorRight || item.color}
                                />
                                <View style={styles.gradInfo}>
                                    <Text style={styles.gradName}>{item.name}</Text>
                                    <View style={styles.tagContainer}>
                                        <View style={styles.tag}><Text style={styles.tagText}>Ordem {item.order}</Text></View>
                                        {item.category && <View style={[styles.tag, { backgroundColor: '#EEF2FF' }]}><Text style={[styles.tagText, { color: '#4F46E5' }]}>{item.category}</Text></View>}
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                            </View>
                        </Card>
                    </TouchableOpacity>
                )}
            />

            <GraduationFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSave}
                initialData={editingGraduation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    tabTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    tabSubtitle: { fontSize: 13, color: '#6B7280' },
    addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
    gradCard: { marginBottom: 12, borderRadius: 20, padding: 16 },
    gradRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    gradInfo: { flex: 1 },
    gradName: { fontSize: 16, fontWeight: '700', color: '#374151' },
    tagContainer: { flexDirection: 'row', gap: 6, marginTop: 4 },
    tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tagText: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' }
});
