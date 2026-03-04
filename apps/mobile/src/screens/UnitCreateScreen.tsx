import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

const COLORS = [
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Laranja', value: '#F97316' },
    { name: 'Amarelo', value: '#F59E0B' },
    { name: 'Verde Claro', value: '#84CC16' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Ciano', value: '#06B6D4' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Índigo', value: '#6366F1' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Cinza', value: '#64748B' }
];

const PAYMENT_METHODS = [
    'Dinheiro',
    'PIX',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Boleto',
    'Transferência'
];

export default function UnitCreateScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const unitId = (route.params as any)?.unitId;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        color: COLORS[0].value,
        status: 'ATIVA' as 'ATIVA' | 'INATIVA',
        defaultMonthlyFeeCents: '',
        defaultPaymentMethod: PAYMENT_METHODS[0]
    });

    useEffect(() => {
        if (unitId) {
            loadUnit();
        }
    }, [unitId]);

    const loadUnit = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/units/${unitId}`);
            const unit = response.data;
            setFormData({
                name: unit.name || '',
                address: unit.address || '',
                color: unit.color || COLORS[0].value,
                status: unit.status || 'ATIVA',
                defaultMonthlyFeeCents: unit.defaultMonthlyFeeCents ? String(unit.defaultMonthlyFeeCents / 100) : '',
                defaultPaymentMethod: unit.defaultPaymentMethod || PAYMENT_METHODS[0]
            });
        } catch (error: any) {
            console.error('Erro ao carregar unidade:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados da unidade');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'Nome da unidade é obrigatório');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name.trim(),
                address: formData.address.trim() || null,
                color: formData.color || null,
                status: formData.status,
                defaultMonthlyFeeCents: formData.defaultMonthlyFeeCents
                    ? Math.round(parseFloat(formData.defaultMonthlyFeeCents) * 100)
                    : null,
                defaultPaymentMethod: formData.defaultPaymentMethod || null
            };

            if (unitId) {
                await api.put(`/units/${unitId}`, payload);
                Alert.alert('Sucesso', 'Unidade atualizada!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await api.post('/units', payload);
                Alert.alert('Sucesso', 'Unidade criada!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            console.error('Erro ao salvar unidade:', error);
            Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar a unidade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{unitId ? 'Editar Unidade' : 'Nova Unidade'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações Básicas</Text>

                    <Text style={styles.label}>Nome da Unidade *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Unidade Centro"
                        value={formData.name}
                        onChangeText={text => setFormData({ ...formData, name: text })}
                    />

                    <Text style={styles.label}>Endereço</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Rua, número, bairro, cidade..."
                        value={formData.address}
                        onChangeText={text => setFormData({ ...formData, address: text })}
                        multiline
                    />

                    <Text style={styles.label}>Cor da Unidade</Text>
                    <View style={styles.colorGrid}>
                        {COLORS.map((color) => (
                            <TouchableOpacity
                                key={color.value}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: color.value },
                                    formData.color === color.value && styles.colorOptionSelected
                                ]}
                                onPress={() => setFormData({ ...formData, color: color.value })}
                            >
                                {formData.color === color.value && (
                                    <Text style={styles.colorCheckmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Status</Text>
                    <View style={styles.statusButtons}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                formData.status === 'ATIVA' && styles.statusButtonActive
                            ]}
                            onPress={() => setFormData({ ...formData, status: 'ATIVA' })}
                        >
                            <Text style={[
                                styles.statusButtonText,
                                formData.status === 'ATIVA' && styles.statusButtonTextActive
                            ]}>
                                Ativa
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                formData.status === 'INATIVA' && styles.statusButtonInactive
                            ]}
                            onPress={() => setFormData({ ...formData, status: 'INATIVA' })}
                        >
                            <Text style={[
                                styles.statusButtonText,
                                formData.status === 'INATIVA' && styles.statusButtonTextInactive
                            ]}>
                                Inativa
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configurações Financeiras</Text>

                    <Text style={styles.label}>Mensalidade Padrão (R$)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 150.00"
                        value={formData.defaultMonthlyFeeCents}
                        onChangeText={text => setFormData({ ...formData, defaultMonthlyFeeCents: text })}
                        keyboardType="decimal-pad"
                    />

                    <Text style={styles.label}>Forma de Pagamento Padrão</Text>
                    <View style={styles.paymentGrid}>
                        {PAYMENT_METHODS.map((method) => (
                            <TouchableOpacity
                                key={method}
                                style={[
                                    styles.paymentOption,
                                    formData.defaultPaymentMethod === method && styles.paymentOptionSelected
                                ]}
                                onPress={() => setFormData({ ...formData, defaultPaymentMethod: method })}
                            >
                                <Text style={[
                                    styles.paymentOptionText,
                                    formData.defaultPaymentMethod === method && styles.paymentOptionTextSelected
                                ]}>
                                    {method}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={{ flex: 1 }}
                />
                <Button
                    title={unitId ? 'Atualizar' : 'Criar Unidade'}
                    onPress={handleSave}
                    loading={loading}
                    style={{ flex: 1 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
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
    content: {
        padding: 16
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFF'
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    colorOptionSelected: {
        borderColor: '#111827',
        transform: [{ scale: 1.1 }]
    },
    colorCheckmark: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8
    },
    statusButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        backgroundColor: '#FFF'
    },
    statusButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981'
    },
    statusButtonInactive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444'
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    statusButtonTextActive: {
        color: '#FFF'
    },
    statusButtonTextInactive: {
        color: '#FFF'
    },
    paymentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    paymentOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFF'
    },
    paymentOptionSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5'
    },
    paymentOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280'
    },
    paymentOptionTextSelected: {
        color: '#FFF'
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    }
});
