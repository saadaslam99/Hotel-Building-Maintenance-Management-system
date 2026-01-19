import fs from 'fs';
import path from 'path';
import {
    User, Project, Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    Issue, IssueAttachment, IssueStatusHistory, SystemLog, IssueAuditLog
} from '@/mock/types';

import {
    SEED_USERS, SEED_PROJECTS, SEED_UNITS, SEED_CLIENTS,
    SEED_WORKER_ASSIGNMENTS, SEED_CLIENT_ASSIGNMENTS, SEED_ISSUES, SEED_ATTACHMENTS
} from '@/mock/seeds';

// Define the schema
export interface MockSchema {
    users: User[];
    projects: Project[];
    units: Unit[];
    clients: Client[];
    workerAssignments: WorkerProjectAssignment[];
    clientAssignments: ClientUnitAssignment[];
    issues: Issue[];
    attachments: IssueAttachment[];
    history: IssueStatusHistory[];
    logs: SystemLog[];
    auditLogs: IssueAuditLog[];
}

// Initial Data
const INITIAL_DB: MockSchema = {
    users: SEED_USERS,
    projects: SEED_PROJECTS,
    units: SEED_UNITS,
    clients: SEED_CLIENTS,
    workerAssignments: SEED_WORKER_ASSIGNMENTS,
    clientAssignments: SEED_CLIENT_ASSIGNMENTS,
    issues: SEED_ISSUES,
    attachments: SEED_ATTACHMENTS,
    history: [],
    logs: [],
    auditLogs: [],
};

// JSON file path (project root)
const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to read DB
function readDb(): MockSchema {
    try {
        if (!fs.existsSync(DB_FILE)) {
            // Initialize if missing
            fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
            return INITIAL_DB;
        }
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(data);

        // MIGRATION: Convert URGENT to HIGH
        if (parsed.issues) {
            parsed.issues = parsed.issues.map((i: any) => {
                if (i.priority === 'URGENT') {
                    return { ...i, priority: 'HIGH' };
                }
                return i;
            });
        }

        return { ...INITIAL_DB, ...parsed };
    } catch (error) {
        console.error('Error reading DB:', error);
        return INITIAL_DB;
    }
}

// Helper to write DB
function writeDb(data: MockSchema) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing DB:', error);
    }
}

// Server DB Handler
export const serverDb = {
    get: <K extends keyof MockSchema>(collection: K): MockSchema[K] => {
        const db = readDb();
        return db[collection];
    },

    find: <K extends keyof MockSchema, T extends MockSchema[K][number]>(
        collection: K,
        predicate: (item: T) => boolean
    ): T | undefined => {
        const db = readDb();
        return (db[collection] as T[]).find(predicate);
    },

    create: <K extends keyof MockSchema, T extends MockSchema[K][number]>(
        collection: K,
        item: T
    ): T => {
        const db = readDb();
        const list = db[collection] as T[];
        const newList = [...list, item];
        writeDb({ ...db, [collection]: newList });
        return item;
    },

    update: <K extends keyof MockSchema, T extends MockSchema[K][number]>(
        collection: K,
        id: string,
        updates: Partial<T>
    ): T | null => {
        const db = readDb();
        const list = db[collection] as T[];
        const index = list.findIndex((i: any) => i.id === id);

        if (index === -1) return null;

        const updatedItem = { ...list[index], ...updates };
        list[index] = updatedItem;
        writeDb({ ...db, [collection]: list });
        return updatedItem;
    }
};
