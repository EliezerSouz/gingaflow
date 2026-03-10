import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../ui/Badge';
import { CordaBadge } from '../ui/CordaBadge';
import { Card } from '../ui/Card';
import StudentFormModal from '../StudentFormModal';

export default function StudentsTab() {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<any[]>([]);
    const [allGraduations, setAllGraduations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | undefined>();

    async function loadData() {
        try {
            setLoading(true);
            const params = { per_page: 100 } as any;
            if (search) params.q = search;

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
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar aluno..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={loadData}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity onPress={handleCreateStudent} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator style={{ marginVertical: 20 }} color="#4F46E5" />}

            <FlatList
                data={data}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#4F46E5" />}
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
                    </View>
                ) : null}
                renderItem={({ item }) => {
                    const studentGradName = item.level || item.graduation_current;
                    const gradConfig = findGraduation(studentGradName);
                    const gradColor = gradConfig?.colorLeft || gradConfig?.color || '#E5E7EB';

                    return (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('StudentDetails', { id: item.id })}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.studentCard}>
                                <View style={styles.studentMain}>
                                    <View style={[styles.avatarContainer, { borderColor: gradColor }]}>
                                        <View style={[styles.avatar, { backgroundColor: gradColor + '10' }]}>
                                            <Text style={[styles.avatarText, { color: gradColor === '#F3F4F6' ? '#4F46E5' : gradColor }]}>
                                                {getInitials(item.full_name)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName} numberOfLines={1}>{item.full_name}</Text>
                                        <Text style={styles.studentCpf}>{item.cpf}</Text>

                                        {studentGradName && (
                                            <View style={styles.gradRow}>
                                                <CordaBadge
                                                    graduacao={studentGradName}
                                                    size="small"
                                                    colorLeft={gradConfig?.colorLeft || gradConfig?.color}
                                                    colorRight={gradConfig?.colorRight || gradConfig?.color}
                                                    pontaLeft={gradConfig?.pontaLeft || gradConfig?.colorLeft || gradConfig?.color}
                                                    pontaRight={gradConfig?.pontaRight || gradConfig?.colorRight || gradConfig?.color}
                                                />
                                                <Text style={styles.gradNameText}>{studentGradName}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.studentStatus}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: item.status === 'ATIVO' ? '#10B981' : '#EF4444' }
                                        ]} />
                                        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                                    </View>
                                </View>
                            </Card>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 12
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 15,
        borderRadius: 16,
        height: 50,
        gap: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    studentCard: {
        marginBottom: 16,
        borderRadius: 24,
        padding: 16,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    studentMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        padding: 3,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1F2937'
    },
    studentCpf: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
        fontWeight: '600'
    },
    gradRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8
    },
    gradNameText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase'
    },
    studentStatus: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 16
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '600'
    }
});
