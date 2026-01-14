import { db } from './db';
import {
    User, UserRole, Issue, IssueStatus, IssuePriority, Project,
    Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    LocationType, ProofType, MediaType, IssueAttachment
} from './types';

const DELAY_MS = 600;

const delay = <T>(data: T): Promise<T> => {
    return new Promise((resolve) => setTimeout(() => resolve(data), DELAY_MS));
};

export const api = {
    auth: {
        login: async (employee_id: string, password: string): Promise<{ user: User; token: string }> => {
            await delay(null);
            const user = db.find('users', (u) => u.employee_id === employee_id && u.password === password);
            if (!user) throw new Error('Invalid credentials');
            if (!user.active) throw new Error('User is inactive');
            return { user, token: 'mock-jwt-token-' + user.id };
        },
        me: async (userId: string): Promise<User> => {
            await delay(null);
            const user = db.find('users', (u) => u.id === userId);
            if (!user) throw new Error('User not found');
            return user;
        },
    },

    projects: {
        getAll: async (): Promise<Project[]> => delay(db.get('projects')),
        getById: async (id: string): Promise<Project | undefined> => delay(db.find('projects', (p) => p.id === id)),
        getUnits: async (projectId: string): Promise<Unit[]> => delay(db.get('units').filter(u => u.project_id === projectId)),
    },

    issues: {
        getAll: async (): Promise<Issue[]> => delay(db.get('issues')),
        getByProject: async (projectId: string): Promise<Issue[]> => delay(db.get('issues').filter(i => i.project_id === projectId)),
        getById: async (id: string): Promise<Issue | undefined> => delay(db.find('issues', (i) => i.id === id)),
        create: async (issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<Issue> => {
            const newIssue: Issue = {
                ...issue,
                id: 'i-' + Date.now(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            await delay(null);
            return db.create('issues', newIssue);
        },
        update: async (id: string, updates: Partial<Issue>): Promise<Issue> => {
            await delay(null);
            const updated = db.update('issues', id, { ...updates, updated_at: new Date().toISOString() });
            if (!updated) throw new Error('Issue not found');
            return updated;
        },
        getAttachments: async (issueId: string) => delay(db.get('attachments').filter(a => a.issue_id === issueId)),
        addAttachment: async (attachment: Omit<IssueAttachment, 'id' | 'created_at'>) => {
            const newAtt = {
                ...attachment,
                id: 'att-' + Date.now(),
                created_at: new Date().toISOString()
            };
            return delay(db.create('attachments', newAtt));
        }
    },

    users: {
        getAll: async (): Promise<User[]> => delay(db.get('users')),
        getWorkers: async (): Promise<User[]> => delay(db.get('users').filter(u => u.role === UserRole.WORKER)),
        getManagers: async (): Promise<User[]> => delay(db.get('users').filter(u => u.role === UserRole.MANAGER)),
        create: async (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
            const newUser = {
                ...user,
                id: 'u-' + Date.now(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            return delay(db.create('users', newUser));
        },
        update: async (id: string, updates: Partial<User>) => delay(db.update('users', id, updates) as User),
    },

    units: {
        assignClient: async (assignment: Omit<ClientUnitAssignment, 'id' | 'created_at' | 'updated_at'>) => {
            const newAssign = {
                ...assignment,
                id: 'ca-' + Date.now(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            db.update('units', assignment.unit_id, { is_occupied: true });
            return delay(db.create('clientAssignments', newAssign));
        }
    }
};
