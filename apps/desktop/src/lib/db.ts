import Database from 'tauri-plugin-sql-api';

const isTauri = !!(window as any).__TAURI_IPC__;
let dbInstance: Database | null = null;

export async function getDb() {
    if (!isTauri) return null;
    if (dbInstance) return dbInstance;
    
    // This creates/opens a local SQLite database named 'gingaflow.db'
    dbInstance = await Database.load('sqlite:gingaflow.db');
    
    // Initialize schema with all required tables to match Mobile/Supabase
    await dbInstance.execute(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            document TEXT,
            plan TEXT DEFAULT 'FREE',
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            related_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            full_name TEXT NOT NULL,
            nickname TEXT,
            cpf TEXT NOT NULL,
            birth_date TEXT,
            email TEXT,
            phone TEXT,
            enrollment_date TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            current_graduation_id TEXT,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS teachers (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            full_name TEXT NOT NULL,
            nickname TEXT,
            cpf TEXT,
            email TEXT,
            phone TEXT,
            graduation TEXT,
            status TEXT NOT NULL,
            notes TEXT,
            user_id TEXT,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS units (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            name TEXT NOT NULL,
            address TEXT,
            color TEXT,
            status TEXT NOT NULL,
            default_monthly_fee_cents INTEGER,
            default_payment_method TEXT,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS activity_types (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            name TEXT NOT NULL,
            usa_graduacao INTEGER DEFAULT 1,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS turmas (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            unit_id TEXT NOT NULL,
            activity_type_id TEXT,
            teacher_id TEXT,
            name TEXT NOT NULL,
            schedule TEXT,
            default_monthly_fee_cents INTEGER,
            default_payment_method TEXT,
            status TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id),
            FOREIGN KEY(unit_id) REFERENCES units(id),
            FOREIGN KEY(activity_type_id) REFERENCES activity_types(id),
            FOREIGN KEY(teacher_id) REFERENCES teachers(id)
        );

        CREATE TABLE IF NOT EXISTS student_turmas (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            turma_id TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id),
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(turma_id) REFERENCES turmas(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            monthly_fee_cents INTEGER NOT NULL,
            due_day INTEGER NOT NULL,
            period TEXT NOT NULL,
            status TEXT NOT NULL,
            paid_at TEXT,
            method TEXT,
            notes TEXT,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id),
            FOREIGN KEY(student_id) REFERENCES students(id)
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            turma_id TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id),
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(turma_id) REFERENCES turmas(id)
        );

        CREATE TABLE IF NOT EXISTS graduations (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            previous_graduation_id TEXT,
            new_graduation_id TEXT NOT NULL,
            date TEXT NOT NULL,
            teacher_id TEXT,
            type TEXT NOT NULL,
            notes TEXT,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id),
            FOREIGN KEY(student_id) REFERENCES students(id)
        );

        CREATE TABLE IF NOT EXISTS graduation_levels (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            grau INTEGER,
            corda_type TEXT,
            color TEXT,
            color_left TEXT,
            color_right TEXT,
            ponta_left TEXT,
            ponta_right TEXT,
            "order" INTEGER NOT NULL,
            active INTEGER DEFAULT 1,
            synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL UNIQUE,
            group_name TEXT DEFAULT 'Grupo de Capoeira',
            logo_url TEXT,
            theme_color TEXT DEFAULT 'blue',
            default_monthly_fee INTEGER DEFAULT 0,
            default_payment_method TEXT DEFAULT 'PIX',
            synced INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            operation TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
            payload TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    return dbInstance;
}
