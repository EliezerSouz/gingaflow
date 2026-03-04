-- =============================================
-- GingaFlow - Schema Supabase
-- Gerado em: 2026-02-23
-- Baseado no schema Prisma atual (SQLite)
-- =============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE student_status AS ENUM ('ATIVO', 'INATIVO', 'SUSPENSO');
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');
CREATE TYPE unit_status AS ENUM ('ATIVA', 'INATIVA');
CREATE TYPE turma_status AS ENUM ('ATIVA', 'INATIVA');
CREATE TYPE teacher_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE payment_status AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'JUSTIFIED');
CREATE TYPE corda_type AS ENUM ('UNICA', 'DUPLA', 'COM_PONTAS');

-- =============================================
-- TABELA: users (autenticação + papéis)
-- =============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'ADMIN',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    related_id      UUID,                  -- referência ao professor ou aluno
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: app_settings (configurações globais)
-- =============================================
CREATE TABLE app_settings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name           TEXT NOT NULL DEFAULT 'Grupo de Capoeira',
    logo_url             TEXT,
    theme_color          TEXT NOT NULL DEFAULT 'blue',
    default_monthly_fee  INTEGER NOT NULL DEFAULT 0,  -- em centavos
    default_payment_method TEXT NOT NULL DEFAULT 'PIX',
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: graduation_levels (configuração de graduações)
-- =============================================
CREATE TABLE graduation_levels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT,                -- Ex: 'CRIANCA', 'ADULTO'
    grau        INTEGER,
    corda_type  corda_type,
    color       TEXT,
    color_left  TEXT,
    color_right TEXT,
    ponta_left  TEXT,
    ponta_right TEXT,
    "order"     INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: units (unidades/academias)
-- =============================================
CREATE TABLE units (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     TEXT NOT NULL,
    address                  TEXT,
    color                    TEXT,
    default_monthly_fee_cents INTEGER,
    default_payment_method   TEXT,
    status                   unit_status NOT NULL DEFAULT 'ATIVA',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: turmas (classes por unidade)
-- =============================================
CREATE TABLE turmas (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     TEXT NOT NULL,
    unit_id                  UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    schedule                 TEXT,         -- Ex: "SEG 18:00, QUA 18:00"
    default_monthly_fee_cents INTEGER,
    default_payment_method   TEXT,
    status                   turma_status NOT NULL DEFAULT 'ATIVA',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_turmas_unit_id ON turmas(unit_id);

-- =============================================
-- TABELA: students (alunos)
-- =============================================
CREATE TABLE students (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name              TEXT NOT NULL,
    cpf                    TEXT UNIQUE NOT NULL,
    birth_date             DATE,
    email                  TEXT,
    phone                  TEXT,
    enrollment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    status                 student_status NOT NULL DEFAULT 'ATIVO',
    notes                  TEXT,
    current_graduation_id  UUID REFERENCES graduation_levels(id),
    -- Dados do responsável (quando menor de idade)
    guardian_name          TEXT,
    guardian_cpf           TEXT,
    guardian_phone         TEXT,
    guardian_relationship  TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_students_cpf ON students(cpf);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_full_name ON students USING GIN (to_tsvector('portuguese', full_name));

-- =============================================
-- TABELA: teachers (professores)
-- =============================================
CREATE TABLE teachers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    cpf             TEXT UNIQUE NOT NULL,
    email           TEXT,
    phone           TEXT,
    capoeira_name   TEXT,               -- apelido de capoeira
    graduation      TEXT,               -- nome da graduação atual
    birth_date      DATE,
    address         TEXT,
    status          teacher_status NOT NULL DEFAULT 'ATIVO',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_teachers_cpf ON teachers(cpf);

-- =============================================
-- TABELA: teacher_turmas (professor vinculado à turma)
-- =============================================
CREATE TABLE teacher_turmas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    turma_id    UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, turma_id)
);

-- =============================================
-- TABELA: student_turmas (aluno vinculado à turma)
-- =============================================
CREATE TABLE student_turmas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    turma_id    UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, turma_id)
);

-- =============================================
-- TABELA: graduations (histórico de graduações)
-- =============================================
CREATE TABLE graduations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    previous_level_id     UUID REFERENCES graduation_levels(id),
    new_level_id          UUID NOT NULL REFERENCES graduation_levels(id),
    date                  DATE NOT NULL,
    teacher_id            UUID REFERENCES teachers(id),
    type                  TEXT NOT NULL,     -- Ex: 'BATIZADO', 'TROCA_DE_CORDA'
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_graduations_student_id ON graduations(student_id);

-- =============================================
-- TABELA: payments (pagamentos/mensalidades)
-- =============================================
CREATE TABLE payments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    monthly_fee_cents  INTEGER NOT NULL,
    due_day            INTEGER NOT NULL,          -- dia do mês: 1-31
    period             TEXT NOT NULL,             -- Ex: '2026-01'
    status             payment_status NOT NULL DEFAULT 'PENDENTE',
    paid_at            TIMESTAMPTZ,
    method             TEXT,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, period)
);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_period ON payments(period);

-- =============================================
-- TABELA: attendances (chamada/frequência)
-- =============================================
CREATE TABLE attendances (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    turma_id    UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    status      attendance_status NOT NULL DEFAULT 'PRESENT',
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, turma_id, date)
);
CREATE INDEX idx_attendances_turma_date ON attendances(turma_id, date);

-- =============================================
-- TRIGGERS: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at          BEFORE UPDATE ON units          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at         BEFORE UPDATE ON turmas         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at       BEFORE UPDATE ON students       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at       BEFORE UPDATE ON teachers       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at       BEFORE UPDATE ON payments       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at    BEFORE UPDATE ON attendances    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grad_levels_updated_at    BEFORE UPDATE ON graduation_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) - Base
-- =============================================
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances   ENABLE ROW LEVEL SECURITY;

-- Política básica: apenas usuários autenticados podem ver dados
-- (Expandir com políticas por role quando adicionar auth Supabase)
CREATE POLICY "authenticated_all" ON students    FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON teachers    FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON payments    FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON attendances FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON units       FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON turmas      FOR ALL TO authenticated USING (true);

-- =============================================
-- SEED: Dados iniciais obrigatórios
-- =============================================
INSERT INTO app_settings (group_name, theme_color, default_payment_method) 
VALUES ('Grupo de Capoeira', 'blue', 'PIX');

-- Usuário admin padrão (senha: admin123 - bcrypt hash)
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Administrador', 
    'admin@gingaflow.local',
    '$2b$10$n9FRDdA73ILr5OGRqjVYQeVxq3NvGJcwqEj1qe.IHxBE8mHiKxBWC',
    'ADMIN'
);
