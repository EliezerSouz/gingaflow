import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useDrawer } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import StudentsTab from '../components/academic/StudentsTab';
import TeachersTab from '../components/academic/TeachersTab';
import GraduationsTab from '../components/academic/GraduationsTab';

type TabType = 'students' | 'teachers' | 'graduations';

export default function AcademicScreen() {
    const { openDrawer } = useDrawer();
    const [activeTab, setActiveTab] = useState<TabType>('students');

    const renderTab = () => {
        switch (activeTab) {
            case 'students': return <StudentsTab />;
            case 'teachers': return <TeachersTab />;
            case 'graduations': return <GraduationsTab />;
            default: return <StudentsTab />;
        }
    };

    const TabButton = ({ type, icon, label }: { type: TabType, icon: string, label: string }) => {
        const isActive = activeTab === type;
        return (
            <TouchableOpacity 
                onPress={() => setActiveTab(type)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                activeOpacity={0.8}
            >
                <Ionicons name={icon as any} size={18} color={isActive ? '#4F46E5' : '#9CA3AF'} />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
                {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenContainer>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => openDrawer()} style={styles.menuButton}>
                    <Ionicons name="menu" size={28} color="#4F46E5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Acadêmico</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Custom Tab Bar */}
            <View style={styles.tabBar}>
                <TabButton type="students" icon="people" label="Alunos" />
                <TabButton type="teachers" icon="person" label="Mestres" />
                <TabButton type="graduations" icon="ribbon" label="Cordas" />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
                {renderTab()}
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: '#FFF'
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827'
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 5
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
        position: 'relative'
    },
    activeTabButton: {
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF'
    },
    activeTabLabel: {
        color: '#4F46E5',
        fontWeight: 'bold'
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 3,
        backgroundColor: '#4F46E5',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3
    }
});
