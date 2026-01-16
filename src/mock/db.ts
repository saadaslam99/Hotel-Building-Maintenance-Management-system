import {
    User, Project, Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    Issue, IssueAttachment, IssueStatusHistory, SystemLog
} from './types';
import {
    SEED_USERS, SEED_PROJECTS, SEED_UNITS, SEED_CLIENTS,
    SEED_WORKER_ASSIGNMENTS, SEED_CLIENT_ASSIGNMENTS, SEED_ISSUES, SEED_ATTACHMENTS
} from './seeds';

const DB_KEY = 'hotel_mms_db_v1';

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
}

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
};

class MockDatabase {
    private data: MockSchema;

    constructor() {
        this.data = this.load();
    }

    private load(): MockSchema {
        if (typeof window === 'undefined') return INITIAL_DB;
        const stored = localStorage.getItem(DB_KEY);
        if (!stored) {
            this.save(INITIAL_DB);
            return INITIAL_DB;
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse mock DB', e);
            return INITIAL_DB;
        }
    }

    private save(data: MockSchema) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(DB_KEY, JSON.stringify(data));
        this.data = data;
    }

    // FROZEN STATE: Reset operation is permanently disabled to prevent data loss
    // public reset() { ... } - REMOVED

    // Generic helpers
    public get<K extends keyof MockSchema>(collection: K): MockSchema[K] {
        return this.data[collection];
    }

    public find<K extends keyof MockSchema, T extends MockSchema[K][number]>(
        collection: K,
        predicate: (item: T) => boolean
    ): T | undefined {
        return (this.data[collection] as T[]).find(predicate);
    }

    public create<K extends keyof MockSchema, T extends MockSchema[K][number]>(
        collection: K,
        item: T
    ): T {
        const list = this.data[collection] as T[];
        const newList = [...list, item];
        this.save({ ...this.data, [collection]: newList });
        return item;
    }

    public update<K extends keyof MockSchema, T extends MockSchema[K][number]>(
        collection: K,
        id: string,
        updates: Partial<T>
    ): T | null {
        const list = this.data[collection] as T[];
        const index = list.findIndex((i: any) => i.id === id);
        if (index === -1) return null;

        const updatedItem = { ...list[index], ...updates };
        list[index] = updatedItem;
        this.save({ ...this.data, [collection]: list });
        return updatedItem;
    }

    // FROZEN STATE: Delete operation is permanently disabled to prevent data loss
    // All data must be preserved permanently - use deactivation instead
    public delete<K extends keyof MockSchema>(collection: K, id: string): boolean {
        console.error('DELETE OPERATION BLOCKED: Data deletion is permanently disabled.');
        throw new Error('Delete operation is not allowed. Data must be preserved permanently.');
    }
}

// Singleton instance
export const db = new MockDatabase();
