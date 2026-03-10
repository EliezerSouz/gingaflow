import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';

export default function TeachersTab() {
    const navigation = useNavigation<any>();
    const { user: currentUser } = useAuth();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teachers');
            setTeachers(response.data.data || response.data);
        } catch (error: any) {
            console.error('Erro ao carregar professores:', error);
            Alert.alert('Erro', 'Não foi possível carregar os professores');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTeachers();
        }, [])
    );

    const handleToggleStatus = async (teacher: any) => {
        const newStatus = teacher.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
        Alert.alert(
            'Confirmar',
            `Deseja ${teacher.status === 'ATIVO' ? 'inativar' : 'ativar'} o professor ${teacher.full_name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            await api.put(`/teachers/${teacher.id}`, {
                                ...teacher,
                                status: newStatus
                            });
                            Alert.alert('Sucesso', `Professor ${newStatus === 'ATIVO' ? 'ativado' : 'inativado'}!`);
                            fetchTeachers();
                        } catch (error: any) {
                            Alert.alert('Erro', 'Não foi possível atualizar o status');
                        }
                    }
                }
            ]
        );
    };

    const getTotalTurmas = (teacher: any) => {
        if (!teacher.units) return 0;
        return teacher.units.reduce((total: number, unit: any) => total + (unit.turmas?.length || 0), 0);
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', marginLeft: 10 }}>Buscar professor...</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('TeacherCreate')} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && teachers.length === 0 && <ActivityIndicator style={{ marginVertical: 20 }} color="#4F46E5" />}

            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTeachers} tintColor="#4F46E5" />}
            >
                {teachers.length === 0 && !loading ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="person-outline" size={60} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Nenhum professor encontrado.</Text>
                    </View>
                ) : (
                    teachers.map((teacher) => (
                        <Card key={teacher.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.nameContainer}>
                                    <Text style={styles.teacherName}>{teacher.full_name}</Text>
                                    {teacher.nickname && <Text style={styles.nickname}>"{teacher.nickname}"</Text>}
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: teacher.status === 'ATIVO' ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text style={[styles.statusText, { color: teacher.status === 'ATIVO' ? '#065F46' : '#991B1B' }]}>
                                        {teacher.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Graduação:</Text>
                                <Text style={styles.value}>{teacher.graduation || '-'}</Text>
                            </View>

                            {teacher.units && teacher.units.length > 0 && (
                                <View style={styles.unitsSummary}>
                                    <Text style={styles.unitsText}>
                                        {teacher.units.length} un. • {getTotalTurmas(teacher)} turmas
                                    </Text>
                                </View>
                            )}

                            {currentUser?.role === 'ADMIN' && (
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('TeacherCreate', { teacherId: teacher.id })}
                                        style={styles.actionButton}
                                    >
                                        <Text style={styles.actionText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleToggleStatus(teacher)}
                                        style={[styles.actionButton, { borderColor: '#F59E0B' }]}
                                    >
                                        <Text style={[styles.actionText, { color: '#F59E0B' }]}>
                                            {teacher.status === 'ATIVO' ? 'Inativar' : 'Ativar'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    searchSection: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 15, borderRadius: 16, height: 50 },
    addButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
    list: { padding: 20, paddingBottom: 100 },
    card: { marginBottom: 16, borderRadius: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    nameContainer: { flex: 1 },
    teacherName: { fontSize: 17, fontWeight: '800', color: '#111827' },
    nickname: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', marginBottom: 4 },
    label: { fontSize: 14, color: '#9CA3AF', width: 90 },
    value: { fontSize: 14, color: '#374151', fontWeight: '500' },
    unitsSummary: { marginTop: 8, paddingVertical: 4 },
    unitsText: { fontSize: 12, color: '#4F46E5', fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
    actionButton: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#4F46E5', alignItems: 'center' },
    actionText: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 16 },
    emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '600' }
});
