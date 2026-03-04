import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../components/ui/Badge';
import { CordaBadge } from '../components/ui/CordaBadge';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import StudentFormModal from '../components/StudentFormModal';

export default function AcademicScreen() {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<any[]>([]);
    const [allGraduations, setAllGraduations] = useState<any[]>([]); // New state
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | undefined>();

    async function loadData() {
        try {
            setLoading(true);
            const params = { per_page: 100 } as any;
            if (search) params.q = search;

            // Carregar alunos e settings em paralelo
            const [studentsRes, settingsRes] = await Promise.all([
                api.get('/students', { params }),
                api.get('/settings')
            ]);

            setData(studentsRes.data.data);
            setAllGraduations(settingsRes.data.graduations || []);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [search])
    );

    function getInitials(name: string) {
        if (!name) return '??';
        return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    }

    // Helper para achar graduação nas settings (Case Insensitive + Trim)
    function findGraduation(name: string) {
        if (!name) return null;
        const search = name.trim().toLowerCase();
        return allGraduations.find(g => g.name?.trim().toLowerCase() === search);
    }

    function handleCreateStudent() {
        setEditingStudentId(undefined);
        setShowModal(true);
    }
    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Alunos</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={loadData} style={styles.iconButton}>
                        <Ionicons name="refresh" size={20} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateStudent} style={styles.addButton}>
                        <Ionicons name="add" size={20} color="#FFF" />
                        <Text style={styles.addButtonText}>Novo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nome ou CPF..."
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={loadData}
                    returnKeyType="search"
                />
            </View>

            {loading && <ActivityIndicator style={{ marginTop: 20 }} color="#4F46E5" />}

            <FlatList
                data={data}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={!loading ? <Text style={styles.empty}>Nenhum aluno encontrado.</Text> : null}
                renderItem={({ item }) => {
                    const studentGradName = item.graduations?.[0]?.level || item.graduation_current; // Tentar pegar de onde for
                    const gradConfig = findGraduation(studentGradName);

                    // Fallback visual
                    const gradColor = gradConfig?.colorLeft || gradConfig?.color || '#E5E7EB';

                    return (
                        <TouchableOpacity onPress={() => navigation.navigate('StudentDetails', { id: item.id })}>
                            <View style={styles.card}>
                                <View style={[styles.avatar, { backgroundColor: gradColor, borderWidth: 2, borderColor: '#FFF' }]}>
                                    <Text style={[styles.avatarText, { color: gradColor === '#F3F4F6' ? '#4F46E5' : '#FFF' }]}>
                                        {getInitials(item.full_name)}
                                    </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                        <Text style={styles.name}>{item.full_name}</Text>
                                    </View>

                                    <Text style={styles.cpf}>CPF: {item.cpf}</Text>

                                    {studentGradName && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <CordaBadge
                                                graduacao={studentGradName}
                                                size="small"
                                                // Se achou config, usa. Se não, tenta usar o que veio no item (fallback) ou padrão
                                                colorLeft={gradConfig?.colorLeft || gradConfig?.color}
                                                colorRight={gradConfig?.colorRight || gradConfig?.color}
                                                pontaLeft={gradConfig?.pontaLeft || gradConfig?.colorLeft || gradConfig?.color}
                                                pontaRight={gradConfig?.pontaRight || gradConfig?.colorRight || gradConfig?.color}
                                            />
                                        </View>
                                    )}


                                </View>

                                <View style={{ alignItems: 'flex-end' }}>
                                    <Badge
                                        label={item.status}
                                        variant={item.status === 'ATIVO' ? 'success' : 'danger'}
                                    />
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 8 }} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            <StudentFormModal
                visible={showModal}
                studentId={editingStudentId}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    loadData();
                }}
            />
        </ScreenContainer >
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    iconButton: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', height: 44 },
    searchInput: { flex: 1, fontSize: 16, color: '#111827' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 16, fontWeight: 'bold' },
    name: { fontSize: 16, fontWeight: '600', color: '#111827' },
    cpf: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    gradBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
    gradText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    typeLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' },
    empty: { textAlign: 'center', marginTop: 40, color: '#6B7280' }
});
