import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CordaBadge } from './ui/CordaBadge';

interface Graduation {
    id: string;
    name: string;
    description?: string;
    order: number;
    active: boolean;
    category?: string;
    grau?: number;
    cordaType?: 'UNICA' | 'DUPLA' | 'COM_PONTAS';
    color?: string; // Fallback
    colorLeft?: string;
    colorRight?: string;
    pontaLeft?: string;
    pontaRight?: string;
}

interface GraduationFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (graduation: Graduation) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: Graduation | null;
}

const COLORS = [
    '#F3F4F6', // Crua/Branca
    '#FDE047', // Amarela
    '#FB923C', // Laranja
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#8B5CF6', // Roxa
    '#92400E', // Marrom
    '#EF4444', // Vermelha
    '#000000', // Preta
    '#FFFFFF', // Branca pura
];

export function GraduationFormModal({ visible, onClose, onSave, onDelete, initialData }: GraduationFormModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState('1');
    const [grau, setGrau] = useState('1');
    const [category, setCategory] = useState('Adulto');
    const [active, setActive] = useState(true);
    const [cordaType, setCordaType] = useState<'UNICA' | 'DUPLA' | 'COM_PONTAS'>('UNICA');

    // Cores
    const [colorLeft, setColorLeft] = useState('#F3F4F6');
    const [colorRight, setColorRight] = useState('#F3F4F6');
    const [pontaLeft, setPontaLeft] = useState('#F3F4F6');
    const [pontaRight, setPontaRight] = useState('#F3F4F6');

    const [differentTips, setDifferentTips] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || '');
                setOrder(String(initialData.order));
                setGrau(String(initialData.grau || 1));
                setCategory(initialData.category || 'Adulto');
                setActive(initialData.active);
                setCordaType(initialData.cordaType || 'UNICA');

                // Detectar se pontas são diferentes
                const pLeft = initialData.pontaLeft || initialData.colorLeft || initialData.color;
                const pRight = initialData.pontaRight || initialData.colorRight || initialData.color;
                if (initialData.cordaType === 'COM_PONTAS' && pLeft !== pRight) {
                    setDifferentTips(true);
                } else {
                    setDifferentTips(false);
                }

                setColorLeft(initialData.colorLeft || initialData.color || '#F3F4F6');
                setColorRight(initialData.colorRight || initialData.color || '#F3F4F6');
                setPontaLeft(pLeft || '#F3F4F6');
                setPontaRight(pRight || '#F3F4F6');
            } else {
                // Reset form for create
                setName('');
                setDescription('');
                setOrder('1'); // Idealmente deveria pegar o próximo numero
                setGrau('1');
                setCategory('Adulto');
                setActive(true);
                setCordaType('UNICA');
                setColorLeft('#F3F4F6');
                setColorRight('#F3F4F6');
                setPontaLeft('#F3F4F6');
                setPontaRight('#F3F4F6');
                setDifferentTips(false);
            }
        }
    }, [visible, initialData]);

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Erro', 'Nome é obrigatório');
            return;
        }

        // Definindo cores finais baseado no tipo
        let finalColorLeft = colorLeft;
        let finalColorRight = colorLeft;
        let finalPontaLeft = colorLeft;
        let finalPontaRight = colorLeft;

        if (cordaType === 'UNICA') {
            finalColorRight = colorLeft;
            finalPontaLeft = colorLeft;
            finalPontaRight = colorLeft;
        } else if (cordaType === 'DUPLA') {
            finalColorRight = colorRight;
            finalPontaLeft = colorLeft; // Ponta esquerda segue cor esquerda
            finalPontaRight = colorRight; // Ponta direita segue cor direita
        } else if (cordaType === 'COM_PONTAS') {
            finalColorRight = colorLeft; // Corpo único
            if (differentTips) {
                finalPontaLeft = pontaLeft;
                finalPontaRight = pontaRight;
            } else {
                finalPontaLeft = pontaLeft;
                finalPontaRight = pontaLeft;
            }
        }

        const data: Graduation = {
            id: initialData?.id || generateUUID(),
            name,
            description: description.trim() || null,
            order: Number(order),
            grau: grau.trim() ? Number(grau) : null,
            category: category || null,
            active,
            cordaType,
            colorLeft: finalColorLeft,
            colorRight: finalColorRight,
            pontaLeft: finalPontaLeft,
            pontaRight: finalPontaRight,
            color: finalColorLeft // Legacy
        } as any;

        await onSave(data);
        onClose();
    }

    const ColorPicker = ({ selected, onSelect, label }: { selected: string, onSelect: (c: string) => void, label: string }) => (
        <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>{label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {COLORS.map(c => (
                    <TouchableOpacity
                        key={c}
                        onPress={() => onSelect(c)}
                        style={[
                            styles.colorOption,
                            { backgroundColor: c },
                            selected === c && styles.selectedColor
                        ]}
                    />
                ))}
            </ScrollView>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{initialData ? 'Editar Graduação' : 'Nova Graduação'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Preview */}
                        <View style={styles.previewContainer}>
                            <Text style={styles.sectionTitle}>Pré-visualização</Text>
                            <View style={styles.previewBox}>
                                <CordaBadge
                                    graduacao={name || 'Nome da Graduação'}
                                    showText
                                    size="large"
                                    colorLeft={colorLeft}
                                    colorRight={cordaType === 'DUPLA' ? colorRight : colorLeft}
                                    pontaLeft={cordaType === 'COM_PONTAS' ? pontaLeft : (cordaType === 'UNICA' ? colorLeft : colorLeft)}
                                    pontaRight={cordaType === 'COM_PONTAS' ? pontaRight : (cordaType === 'UNICA' ? colorLeft : colorRight)}
                                />
                            </View>
                        </View>




                        {/* Dados Básicos */}
                        <Text style={styles.label}>Nome</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Ponta Amarela" />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Ordem</Text>
                                <TextInput style={styles.input} value={order} onChangeText={setOrder} keyboardType="numeric" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Grau</Text>
                                <TextInput style={styles.input} value={grau} onChangeText={setGrau} keyboardType="numeric" />
                            </View>
                        </View>

                        <Text style={styles.label}>Categoria</Text>
                        <View style={styles.categoryRow}>
                            {['Infantil', 'Adulto', 'Avançado', 'Monitor', 'Professor', 'Contramestre', 'Mestre', 'Transformação'].map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catChip, category === cat && styles.catChipSelected]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.catText, category === cat && styles.catTextSelected]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Configuração Visual */}
                        <Text style={styles.sectionTitle}>Visual da Corda</Text>

                        <Text style={styles.label}>Tipo de Corda</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeOption, cordaType === 'UNICA' && styles.typeSelected]}
                                onPress={() => setCordaType('UNICA')}
                            >
                                <Text style={styles.typeText}>Única</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeOption, cordaType === 'DUPLA' && styles.typeSelected]}
                                onPress={() => setCordaType('DUPLA')}
                            >
                                <Text style={styles.typeText}>Dupla</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeOption, cordaType === 'COM_PONTAS' && styles.typeSelected]}
                                onPress={() => setCordaType('COM_PONTAS')}
                            >
                                <Text style={styles.typeText}>Com Pontas</Text>
                            </TouchableOpacity>
                        </View>

                        <ColorPicker label="Cor Principal (Esquerda)" selected={colorLeft} onSelect={setColorLeft} />

                        {cordaType === 'DUPLA' && (
                            <ColorPicker label="Cor Direita" selected={colorRight} onSelect={setColorRight} />
                        )}

                        {cordaType === 'COM_PONTAS' && (
                            <View>
                                <View style={styles.switchRowSmall}>
                                    <Text style={styles.labelSmall}>Pontas de cores diferentes?</Text>
                                    <Switch
                                        value={differentTips}
                                        onValueChange={setDifferentTips}
                                        trackColor={{ false: "#D1D5DB", true: "#4F46E5" }}
                                        thumbColor={differentTips ? "#FFF" : "#F4F3F4"}
                                    />
                                </View>

                                {differentTips ? (
                                    <>
                                        <ColorPicker label="Ponta Esquerda" selected={pontaLeft} onSelect={setPontaLeft} />
                                        <ColorPicker label="Ponta Direita" selected={pontaRight} onSelect={setPontaRight} />
                                    </>
                                ) : (
                                    <ColorPicker
                                        label="Cor das Pontas"
                                        selected={pontaLeft}
                                        onSelect={(c) => {
                                            setPontaLeft(c);
                                            setPontaRight(c);
                                        }}
                                    />
                                )}
                            </View>
                        )}

                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Ativa</Text>
                            <Switch value={active} onValueChange={setActive} trackColor={{ false: "#767577", true: "#4F46E5" }} />
                        </View>

                        {initialData && onDelete && (
                            <TouchableOpacity onPress={() => onDelete(initialData.id)} style={styles.deleteButton}>
                                <Text style={styles.deleteText}>Excluir Graduação</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveText}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
    labelSmall: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 16 },
    row: { flexDirection: 'row' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 20, marginBottom: 12 },
    previewContainer: { alignItems: 'center', marginBottom: 10 },
    previewBox: { padding: 20, backgroundColor: '#F9FAFB', borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    typeOption: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center' },
    typeSelected: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
    typeText: { fontWeight: '600', color: '#374151' },
    colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    selectedColor: { borderWidth: 3, borderColor: '#4F46E5' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 },
    switchRowSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8, paddingHorizontal: 4 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', gap: 12 },
    cancelButton: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
    saveButton: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#4F46E5', alignItems: 'center' },
    cancelText: { fontWeight: '600', color: '#374151' },
    saveText: { fontWeight: '600', color: '#FFF' },
    categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
    catChipSelected: { backgroundColor: '#4F46E5' },
    catText: { fontSize: 12, color: '#374151' },
    catTextSelected: { color: '#FFF' },
    deleteButton: { padding: 14, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', marginTop: 10 },
    deleteText: { color: '#991B1B', fontWeight: '600' }
});
