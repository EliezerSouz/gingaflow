import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

interface Unit {
    id: string;
    name: string;
    address?: string;
    color?: string;
    status: 'ATIVA' | 'INATIVA';
    defaultMonthlyFeeCents?: number;
    defaultPaymentMethod?: string;
}

export default function UnitsScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const response = await api.get('/units');
            setUnits(response.data.data || response.data);
        } catch (error: any) {
            console.error('Erro ao carregar unidades:', error);
            Alert.alert('Erro', 'Não foi possível carregar as unidades');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUnits();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchUnits();
    };

    const handleDelete = async (unit: Unit) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Deseja realmente excluir a unidade "${unit.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/units/${unit.id}`);
                            Alert.alert('Sucesso', 'Unidade excluída!');
                            fetchUnits();
                        } catch (error: any) {
                            Alert.alert('Erro', 'Não foi possível excluir a unidade');
                        }
                    }
                }
            ]
        );
    };

    const formatCurrency = (cents?: number) => {
        if (!cents) return '-';
        return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Unidades</Text>
                <Button
                    title="Nova Unidade"
                    onPress={() => navigation.navigate('UnitCreate')}
                    style={styles.newButton}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading && units.length === 0 ? (
                    <Text style={styles.loadingText}>Carregando...</Text>
                ) : units.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nenhuma unidade cadastrada</Text>
                        <Text style={styles.emptySubtext}>Toque em "Nova Unidade" para começar</Text>
                    </View>
                ) : (
                    units.map((unit) => (
                        <View key={unit.id} style={styles.card}>
                            {unit.color && <View style={[styles.colorBar, { backgroundColor: unit.color }]} />}

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.unitName}>{unit.name}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        unit.status === 'ATIVA' ? styles.statusActive : styles.statusInactive
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            unit.status === 'ATIVA' ? styles.statusTextActive : styles.statusTextInactive
                                        ]}>
                                            {unit.status}
                                        </Text>
                                    </View>
                                </View>

                                {unit.address && (
                                    <Text style={styles.address}>{unit.address}</Text>
                                )}

                                {unit.defaultMonthlyFeeCents && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Mensalidade padrão:</Text>
                                        <Text style={styles.infoValue}>{formatCurrency(unit.defaultMonthlyFeeCents)}</Text>
                                    </View>
                                )}

                                {unit.defaultPaymentMethod && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Forma de pagamento:</Text>
                                        <Text style={styles.infoValue}>{unit.defaultPaymentMethod}</Text>
                                    </View>
                                )}

                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => navigation.navigate('UnitCreate', { unitId: unit.id })}
                                    >
                                        <Text style={styles.editButtonText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(unit)}
                                    >
                                        <Text style={styles.deleteButtonText}>Excluir</Text>
                                    </TouchableOpacity>
                                </View>
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
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    colorBar: {
        height: 4,
        width: '100%'
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
    unitName: {
        fontSize: 18,
        fontWeight: 'bold',
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
        fontSize: 12,
        fontWeight: '600'
    },
    statusTextActive: {
        color: '#065F46'
    },
    statusTextInactive: {
        color: '#991B1B'
    },
    address: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280'
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827'
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
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
