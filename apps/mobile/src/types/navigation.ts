// Tipos de navegação do app
export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    Acadêmico: undefined;
    Graduações: undefined;
    Agenda: undefined;
    Profile: undefined;
    Units: undefined;
    UnitCreate: { unitId?: string } | undefined;
    Turmas: undefined;
    TurmaCreate: { turmaId?: string; unitId?: string } | undefined;
    Teachers: undefined;
    TeacherCreate: { teacherId?: string } | undefined;
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
