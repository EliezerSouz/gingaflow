import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface SimpleDrawerProps {
    visible: boolean;
    onClose: () => void;
}

export function SimpleDrawer({ visible, onClose }: SimpleDrawerProps) {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<any>();

    const menuItems = [
        { label: 'Dashboard', icon: 'home-outline', screen: 'Dashboard' },
        { label: 'Acadêmico', icon: 'school-outline', screen: 'Acadêmico' },
        ...(user?.role === 'ADMIN' ? [
            { label: 'Graduações', icon: 'ribbon-outline', screen: 'Graduações' }
        ] : []),
        { label: 'Agenda', icon: 'calendar-outline', screen: 'Agenda' },
        ...(user?.role === 'ADMIN' ? [
            { label: 'Financeiro', icon: 'cash-outline', screen: null },
            { label: 'Relatórios', icon: 'stats-chart-outline', screen: null },
            { label: 'Configurações', icon: 'settings-outline', screen: null },
        ] : []),
    ];

    function handleNavigate(screen: string | null) {
        if (screen) {
            navigation.navigate(screen);
            onClose();
        }
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.drawer} onStartShouldSetResponder={() => true}>
                    <ScrollView>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
                            <Text style={styles.userEmail}>{user?.email || ''}</Text>
                        </View>

                        {/* Menu Items */}
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => handleNavigate(item.screen)}
                                disabled={!item.screen}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={22}
                                    color={item.screen ? '#4F46E5' : '#9CA3AF'}
                                />
                                <Text style={[
                                    styles.menuLabel,
                                    !item.screen && styles.menuLabelDisabled
                                ]}>
                                    {item.label}
                                </Text>
                                {!item.screen && (
                                    <Text style={styles.comingSoon}>Em breve</Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Logout */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                <Text style={styles.logoutText}>Sair</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    drawer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 10
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF'
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280'
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    menuLabel: {
        marginLeft: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1
    },
    menuLabelDisabled: {
        color: '#9CA3AF'
    },
    comingSoon: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic'
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 20,
        paddingTop: 20,
        paddingHorizontal: 20
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12
    },
    logoutText: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444'
    }
});
