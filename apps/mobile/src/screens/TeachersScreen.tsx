import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface Teacher {
    id: string;
    full_name: string;
    cpf: string;
    email?: string;
    phone?: string;
    nickname?: string;
    graduation?: string;
    status: 'ATIVO' | 'INATIVO';
    units?: Array<{
        id: string;
        name: string;
        color?: string;
        turmas?: Array<{
            id: string;
            name: string;
            schedule: string;
        }>;
    }>;
}

export default function TeachersScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user: currentUser } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTeachers();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTeachers();
    };

    const handleToggleStatus = async (teacher: Teacher) => {
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

    const handleDelete = async (teacher: Teacher) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Deseja realmente excluir o professor "${teacher.full_name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/teachers/${teacher.id}`);
                            Alert.alert('Sucesso', 'Professor excluído!');
                            fetchTeachers();
                        } catch (error: any) {
                            Alert.alert('Erro', 'Não foi possível excluir o professor');
                        }
                    }
                }
            ]
        );
    };

    const getTotalTurmas = (teacher: Teacher) => {
        if (!teacher.units) return 0;
        return teacher.units.reduce((total, unit) => total + (unit.turmas?.length || 0), 0);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Professores</Text>
                {currentUser?.role === 'ADMIN' && (
                    <Button
                        title="Novo Professor"
                        onPress={() => navigation.navigate('TeacherCreate')}
                        style={styles.newButton}
                    />
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading && teachers.length === 0 ? (
                    <Text style={styles.loadingText}>Carregando...</Text>
                ) : teachers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nenhum professor cadastrado</Text>
                        <Text style={styles.emptySubtext}>Toque em "Novo Professor" para começar</Text>
                    </View>
                ) : (
                    teachers.map((teacher) => (
                        <View key={teacher.id} style={styles.card}>
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.nameContainer}>
                                        <Text style={styles.teacherName}>{teacher.full_name}</Text>
                                        {teacher.nickname && (
                                            <Text style={styles.capoeiraName}>"{teacher.nickname}"</Text>
                                        )}
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        teacher.status === 'ATIVO' ? styles.statusActive : styles.statusInactive
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            teacher.status === 'ATIVO' ? styles.statusTextActive : styles.statusTextInactive
                                        ]}>
                                            {teacher.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoSection}>
                                    {teacher.graduation && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Graduação:</Text>
                                            <Text style={styles.infoValue}>{teacher.graduation}</Text>
                                        </View>
                                    )}
                                    {teacher.email && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Email:</Text>
                                            <Text style={styles.infoValue}>{teacher.email}</Text>
                                        </View>
                                    )}
                                    {teacher.phone && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Telefone:</Text>
                                            <Text style={styles.infoValue}>{teacher.phone}</Text>
                                        </View>
                                    )}

                                    {teacher.units && teacher.units.length > 0 && (
                                        <View style={styles.unitsSection}>
                                            <Text style={styles.unitsSectionTitle}>
                                                {teacher.units.length} unidade{teacher.units.length !== 1 ? 's' : ''} • {getTotalTurmas(teacher)} turma{getTotalTurmas(teacher) !== 1 ? 's' : ''}
                                            </Text>
                                            {teacher.units.map(unit => (
                                                <View key={unit.id} style={styles.unitItem}>
                                                    {unit.color && (
                                                        <View style={[styles.unitColorDot, { backgroundColor: unit.color }]} />
                                                    )}
                                                    <Text style={styles.unitName}>{unit.name}</Text>
                                                    {unit.turmas && unit.turmas.length > 0 && (
                                                        <Text style={styles.turmasCount}>
                                                            ({unit.turmas.length})
                                                        </Text>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {currentUser?.role === 'ADMIN' && (
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => navigation.navigate('TeacherCreate', { teacherId: teacher.id })}
                                        >
                                            <Text style={styles.editButtonText}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.statusButton}
                                            onPress={() => handleToggleStatus(teacher)}
                                        >
                                            <Text style={styles.statusButtonText}>
                                                {teacher.status === 'ATIVO' ? 'Inativar' : 'Ativar'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(teacher)}
                                        >
                                            <Text style={styles.deleteButtonText}>Excluir</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    newButton: {
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    content: {
        padding: 16
    },
    loadingText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 40
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF'
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    cardContent: {
        padding: 16
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    nameContainer: {
        flex: 1,
        marginRight: 8
    },
    teacherName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4
    },
    capoeiraName: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusActive: {
        backgroundColor: '#D1FAE5'
    },
    statusInactive: {
        backgroundColor: '#FEE2E2'
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600'
    },
    statusTextActive: {
        color: '#065F46'
    },
    statusTextInactive: {
        color: '#991B1B'
    },
    infoSection: {
        marginBottom: 12
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 6
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        flex: 1
    },
    unitsSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    unitsSectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        textTransform: 'uppercase'
    },
    unitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },
    unitColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8
    },
    unitName: {
        fontSize: 14,
        color: '#111827',
        flex: 1
    },
    turmasCount: {
        fontSize: 12,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    editButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4F46E5',
        alignItems: 'center'
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5'
    },
    statusButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F59E0B',
        alignItems: 'center'
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B'
    },
    deleteButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EF4444',
        alignItems: 'center'
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444'
    }
});
