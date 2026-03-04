import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

interface Turma {
    id: string;
    name: string;
    schedule: string;
    status: 'ATIVA' | 'INATIVA';
    unitId: string;
    unit?: {
        id: string;
        name: string;
        color?: string;
    };
}

export default function TurmasScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTurmas = async () => {
        try {
            setLoading(true);
            // Buscar todas as turmas de todas as unidades
            const unitsResponse = await api.get('/units');
            const units = unitsResponse.data.data || unitsResponse.data;

            const allTurmas: Turma[] = [];
            for (const unit of units) {
                try {
                    const turmasResponse = await api.get(`/units/${unit.id}/turmas`);
                    const unitTurmas = (turmasResponse.data.data || turmasResponse.data).map((t: any) => ({
                        ...t,
                        unit: { id: unit.id, name: unit.name, color: unit.color }
                    }));
                    allTurmas.push(...unitTurmas);
                } catch (error) {
                    console.error(`Erro ao carregar turmas da unidade ${unit.name}:`, error);
                }
            }

            setTurmas(allTurmas);
        } catch (error: any) {
            console.error('Erro ao carregar turmas:', error);
            Alert.alert('Erro', 'Não foi possível carregar as turmas');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTurmas();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTurmas();
    };

    const handleDelete = async (turma: Turma) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Deseja realmente excluir a turma "${turma.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/turmas/${turma.id}`);
                            Alert.alert('Sucesso', 'Turma excluída!');
                            fetchTurmas();
                        } catch (error: any) {
                            Alert.alert('Erro', 'Não foi possível excluir a turma');
                        }
                    }
                }
            ]
        );
    };

    const formatSchedule = (schedule: string) => {
        if (!schedule) return '-';
        // Formato esperado: "SEG 18:00, QUA 18:00"
        return schedule;
    };

    // Agrupar turmas por unidade
    const turmasByUnit = turmas.reduce((acc, turma) => {
        const unitName = turma.unit?.name || 'Sem Unidade';
        if (!acc[unitName]) {
            acc[unitName] = [];
        }
        acc[unitName].push(turma);
        return acc;
    }, {} as Record<string, Turma[]>);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Turmas</Text>
                <Button
                    title="Nova Turma"
                    onPress={() => navigation.navigate('TurmaCreate')}
                    style={styles.newButton}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading && turmas.length === 0 ? (
                    <Text style={styles.loadingText}>Carregando...</Text>
                ) : Object.keys(turmasByUnit).length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nenhuma turma cadastrada</Text>
                        <Text style={styles.emptySubtext}>Toque em "Nova Turma" para começar</Text>
                    </View>
                ) : (
                    Object.entries(turmasByUnit).map(([unitName, unitTurmas]) => (
                        <View key={unitName} style={styles.unitSection}>
                            <View style={styles.unitHeader}>
                                {unitTurmas[0]?.unit?.color && (
                                    <View style={[styles.unitColorDot, { backgroundColor: unitTurmas[0].unit.color }]} />
                                )}
                                <Text style={styles.unitName}>{unitName}</Text>
                                <Text style={styles.unitCount}>{unitTurmas.length} turma{unitTurmas.length !== 1 ? 's' : ''}</Text>
                            </View>

                            {unitTurmas.map((turma) => (
                                <View key={turma.id} style={styles.card}>
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.turmaName}>{turma.name}</Text>
                                            <View style={[
                                                styles.statusBadge,
                                                turma.status === 'ATIVA' ? styles.statusActive : styles.statusInactive
                                            ]}>
                                                <Text style={[
                                                    styles.statusText,
                                                    turma.status === 'ATIVA' ? styles.statusTextActive : styles.statusTextInactive
                                                ]}>
                                                    {turma.status}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.schedule}>{formatSchedule(turma.schedule)}</Text>

                                        <View style={styles.actions}>
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => navigation.navigate('TurmaCreate', { turmaId: turma.id, unitId: turma.unitId })}
                                            >
                                                <Text style={styles.editButtonText}>Editar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDelete(turma)}
                                            >
                                                <Text style={styles.deleteButtonText}>Excluir</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
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
    unitSection: {
        marginBottom: 24
    },
    unitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4
    },
    unitColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8
    },
    unitName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1
    },
    unitCount: {
        fontSize: 12,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
    },
    cardContent: {
        padding: 16
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    turmaName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1
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
    schedule: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12
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
