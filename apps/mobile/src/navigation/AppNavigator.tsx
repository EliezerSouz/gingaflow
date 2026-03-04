import React from 'react';
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
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const { user } = useAuth();
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#4F46E5',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 70
                }
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                    tabBarLabel: 'Início'
                }}
            />
            <Tab.Screen
                name="Acadêmico"
                component={AcademicScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color} />
                }}
            />
            {user?.role === 'ADMIN' && (
                <Tab.Screen
                    name="Graduações"
                    component={GraduationsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => <Ionicons name="ribbon" size={size} color={color} />
                    }}
                />
            )}
            <Tab.Screen
                name="Agenda"
                component={ScheduleScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />
                }}
            />
        </Tab.Navigator>
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
                        name="StudentDetails"
                        component={StudentDetailsScreen}
                        options={{ headerShown: true, title: 'Detalhes do Aluno' }}
                    />
                    <Stack.Screen
                        name="Profile"
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
                    {/* Módulo de Unidades */}
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
                    {/* Módulo de Turmas */}
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
                    {/* Módulo de Professores */}
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
                </>
            )}
        </Stack.Navigator>
    );
}
