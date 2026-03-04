import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AcademicScreen from '../screens/AcademicScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import GraduationsScreen from '../screens/GraduationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StudentDetailsScreen from '../screens/StudentDetailsScreen';
import UnitsScreen from '../screens/UnitsScreen';
import UnitCreateScreen from '../screens/UnitCreateScreen';
import TurmasScreen from '../screens/TurmasScreen';
import TurmaCreateScreen from '../screens/TurmaCreateScreen';
import TeachersScreen from '../screens/TeachersScreen';
import TeacherCreateScreen from '../screens/TeacherCreateScreen';
import ActivityTypesScreen from '../screens/ActivityTypesScreen';
import PresenceScreen from '../screens/PresenceScreen';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Action Menu Component ---
function ActionMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const navigation = useNavigation<any>();

    const actions = [
        { label: 'Novo Aluno', icon: 'person-add', color: '#4F46E5', route: 'Acadêmico' },
        { label: 'Registrar Presença', icon: 'checkbox', color: '#10B981', route: 'Agenda' },
        { label: 'Nova Aula', icon: 'calendar', color: '#3B82F6', route: 'Turmas' },
        { label: 'Registrar Pagamento', icon: 'cash', color: '#F59E0B', route: 'Financial' },
    ];

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
                    <View style={styles.menuHeader}>
                        <View style={styles.handle} />
                        <Text style={styles.menuTitle}>Ações Rápidas</Text>
                    </View>

                    <View style={styles.actionsGrid}>
                        {actions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionItem}
                                activeOpacity={0.8}
                                onPress={() => {
                                    onClose();
                                    navigation.navigate(action.route);
                                }}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: action.color + '15' }]}>
                                    <Ionicons name={action.icon as any} size={32} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

// --- Custom Tab Bar Button (Pill Style) ---
function TabButton({ label, icon, focused, onPress }: any) {
    return (
        <TouchableOpacity style={styles.tabButton} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.pillContainer, focused && styles.activePill]}>
                <Ionicons name={icon} size={22} color={focused ? '#4F46E5' : '#9CA3AF'} />
                {focused && <Text style={styles.pillLabel}>{label}</Text>}
            </View>
        </TouchableOpacity>
    );
}

function MainTabs() {
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarShowLabel: false,
                }}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{
                        tabBarButton: (props) => (
                            <TabButton {...props} label="Início" icon="home" focused={props.accessibilityState?.selected} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Acadêmico"
                    component={AcademicScreen}
                    options={{
                        tabBarButton: (props) => (
                            <TabButton {...props} label="Acadêmico" icon="school" focused={props.accessibilityState?.selected} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="QuickActions"
                    component={() => null}
                    options={{
                        tabBarButton: () => (
                            <TouchableOpacity style={styles.centralButtonContainer} onPress={() => setMenuVisible(true)}>
                                <View style={styles.centralButton}>
                                    <Ionicons name="add" size={32} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Tab.Screen
                    name="Agenda"
                    component={ScheduleScreen}
                    options={{
                        tabBarButton: (props) => (
                            <TabButton {...props} label="Agenda" icon="calendar" focused={props.accessibilityState?.selected} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        tabBarButton: (props) => (
                            <TabButton {...props} label="Perfil" icon="person" focused={props.accessibilityState?.selected} />
                        ),
                    }}
                />
            </Tab.Navigator>
            <ActionMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
        </>
    );
}

export default function AppNavigator() {
    const { user } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen
                        name="Graduações"
                        component={GraduationsScreen}
                        options={{ headerShown: true, title: 'Graduações' }}
                    />
                    <Stack.Screen
                        name="StudentDetails"
                        component={StudentDetailsScreen}
                        options={{ headerShown: true, title: 'Detalhes do Aluno' }}
                    />
                    <Stack.Screen
                        name="ProfileScreen" // Avoid name conflict with Tab
                        component={ProfileScreen}
                        options={{ headerShown: true, title: 'Meu Perfil' }}
                    />
                    <Stack.Screen
                        name="Financial"
                        component={ProfileScreen} // Placeholder
                        options={{ headerShown: true, title: 'Financeiro' }}
                    />
                    <Stack.Screen
                        name="Reports"
                        component={ProfileScreen} // Placeholder
                        options={{ headerShown: true, title: 'Relatórios' }}
                    />
                    <Stack.Screen
                        name="Units"
                        component={UnitsScreen}
                        options={{ headerShown: true, title: 'Unidades' }}
                    />
                    <Stack.Screen
                        name="UnitCreate"
                        component={UnitCreateScreen}
                        options={{ headerShown: true, title: 'Unidade' }}
                    />
                    <Stack.Screen
                        name="Turmas"
                        component={TurmasScreen}
                        options={{ headerShown: true, title: 'Turmas' }}
                    />
                    <Stack.Screen
                        name="TurmaCreate"
                        component={TurmaCreateScreen}
                        options={{ headerShown: true, title: 'Turma' }}
                    />
                    <Stack.Screen
                        name="Teachers"
                        component={TeachersScreen}
                        options={{ headerShown: true, title: 'Professores' }}
                    />
                    <Stack.Screen
                        name="TeacherCreate"
                        component={TeacherCreateScreen}
                        options={{ headerShown: true, title: 'Professor' }}
                    />
                    <Stack.Screen
                        name="ActivityTypes"
                        component={ActivityTypesScreen}
                        options={{ headerShown: true, title: 'Tipos de Atividade' }}
                    />
                    <Stack.Screen
                        name="Presenca"
                        component={PresenceScreen}
                        options={{ headerShown: false }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        backgroundColor: '#FFF',
        borderRadius: 25,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderTopWidth: 0,
    },
    tabButton: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    activePill: {
        backgroundColor: '#EEF2FF',
    },
    pillLabel: {
        color: '#4F46E5',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    centralButtonContainer: {
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        top: -20,
    },
    centralButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    menuContainer: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        paddingTop: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    menuHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        marginBottom: 16,
    },
    menuTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    actionItem: {
        width: '48%',
        aspectRatio: 1,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    actionIconBg: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
        lineHeight: 18,
    },
    closeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 8,
    },
});
