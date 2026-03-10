import React, { useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable, Dimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import FinancialScreen from '../screens/FinancialScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// --- Drawer Context (Maintained for legacy screen calls, but now uses native drawer) ---
export const DrawerContext = createContext<{ openDrawer: () => void }>({ openDrawer: () => { } });
export const useDrawer = () => useContext(DrawerContext);

// --- Custom Drawer Content ---
function CustomDrawerContent(props: any) {
    const { navigation } = props;

    const menuSections = [
        {
            title: 'Principal',
            items: [
                { label: 'Dashboard', icon: 'grid', route: 'Dashboard' },
            ]
        },
        {
            title: 'Acadêmico',
            items: [
                { label: 'Alunos', icon: 'people', route: 'Acadêmico' },
                { label: 'Turmas', icon: 'layers', route: 'Turmas' },
                { label: 'Professores', icon: 'person', route: 'Teachers' },
                { label: 'Graduações', icon: 'ribbon', route: 'Graduações' },
            ]
        },
        {
            title: 'Operacional',
            items: [
                { label: 'Agenda', icon: 'calendar', route: 'Agenda' },
                { label: 'Unidades', icon: 'business', route: 'Units' },
            ]
        },
        {
            title: 'Gestão',
            items: [
                { label: 'Financeiro', icon: 'cash', route: 'Financial' },
                { label: 'Relatórios', icon: 'stats-chart', route: 'Reports' },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { label: 'Configurações', icon: 'settings', route: 'Settings' },
            ]
        }
    ];

    const navigate = (route: string) => {
        navigation.navigate(route);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={styles.drawerHeader}>
                <Text style={styles.drawerBrand}>GingaFlow</Text>
                <Text style={styles.drawerVersion}>v1.0.0</Text>
            </View>
            <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
                {menuSections.map((section, idx) => (
                    <View key={idx} style={styles.drawerSection}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.items.map((item, itemIdx) => (
                            <TouchableOpacity
                                key={itemIdx}
                                style={styles.drawerItem}
                                onPress={() => navigate(item.route)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.drawerIconContainer}>
                                    <Ionicons name={item.icon as any} size={20} color="#4F46E5" />
                                </View>
                                <Text style={styles.drawerLabel}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </DrawerContentScrollView>
            <View style={styles.drawerFooter}>
                <Text style={styles.footerText}>Capoeira Management System</Text>
            </View>
        </View>
    );
}

// --- Action Menu (Quick Actions) ---
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
                            <TabButton {...props} label="Alunos" icon="people" focused={props.accessibilityState?.selected} />
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
                    name="Conta"
                    component={ProfileScreen}
                    options={{
                        tabBarButton: (props) => (
                            <TabButton {...props} label="Conta" icon="person" focused={props.accessibilityState?.selected} />
                        ),
                    }}
                />
            </Tab.Navigator>
            <ActionMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
        </>
    );
}

// --- Drawer Navigator ---
function MainDrawer() {
    const navigation = useNavigation<any>();

    return (
        <DrawerContext.Provider value={{ openDrawer: () => navigation.openDrawer() }}>
            <Drawer.Navigator
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerStyle: {
                        width: width * 0.78,
                    },
                }}
            >
                <Drawer.Screen name="MainTabs" component={MainTabs} />
                <Drawer.Screen name="Turmas" component={TurmasScreen} options={{ headerShown: true, title: 'Turmas' }} />
                <Drawer.Screen name="Teachers" component={TeachersScreen} options={{ headerShown: true, title: 'Professores' }} />
                <Drawer.Screen name="Graduações" component={GraduationsScreen} options={{ headerShown: true, title: 'Graduações' }} />
                <Drawer.Screen name="Units" component={UnitsScreen} options={{ headerShown: true, title: 'Unidades' }} />
                <Drawer.Screen name="Reports" component={ReportsScreen} options={{ headerShown: true, title: 'Relatórios' }} />
                <Drawer.Screen name="Financial" component={FinancialScreen} options={{ headerShown: true, title: 'Financeiro' }} />
                <Drawer.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Configurações' }} />
            </Drawer.Navigator>
        </DrawerContext.Provider>
    );
}

// --- Main Stack ---
export default function AppNavigator() {
    const { user } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
                <Stack.Group>
                    <Stack.Screen name="Main" component={MainDrawer} />
                    {/* Detail screens move here to be outside the drawer if needed, or keep inside. 
                        Usually details are better in a stack that covers the drawer. */}
                    <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} options={{ headerShown: true, title: 'Detalhes do Aluno' }} />
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: true, title: 'Meu Perfil' }} />
                    <Stack.Screen name="UnitCreate" component={UnitCreateScreen} options={{ headerShown: true, title: 'Unidade' }} />
                    <Stack.Screen name="TurmaCreate" component={TurmaCreateScreen} options={{ headerShown: true, title: 'Turma' }} />
                    <Stack.Screen name="TeacherCreate" component={TeacherCreateScreen} options={{ headerShown: true, title: 'Professor' }} />
                    <Stack.Screen name="ActivityTypes" component={ActivityTypesScreen} options={{ headerShown: true, title: 'Tipos de Atividade' }} />
                    <Stack.Screen name="Presenca" component={PresenceScreen} options={{ headerShown: false }} />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    // Drawer Header
    drawerHeader: {
        backgroundColor: '#4F46E5',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 28,
    },
    drawerBrand: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    drawerVersion: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 4,
    },
    drawerSection: {
        marginTop: 8,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 4,
        marginTop: 16,
        marginLeft: 4,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 2,
    },
    drawerIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    drawerLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    drawerFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center'
    },
    footerText: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold'
    },
    // Tab Bar
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
    // Action Menu Modal
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
