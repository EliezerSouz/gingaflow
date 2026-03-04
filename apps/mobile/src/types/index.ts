export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    relatedId?: string | null;
    active?: boolean;
}

export interface Unit {
    id: string;
    name: string;
    color?: string;
    turmas: Turma[];
}

export interface Turma {
    id: string;
    name: string;
    schedule?: string;
}
