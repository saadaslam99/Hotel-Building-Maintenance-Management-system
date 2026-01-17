'use server';

import { serverDb as db } from '@/lib/server-db';
import {
    User, UserRole, Issue, IssueStatus, IssuePriority, Project,
    Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    LocationType, ProofType, MediaType, IssueAttachment, SystemLog, OccupantType
} from '@/mock/types';

// Auth Actions
export async function login(employee_id: string, password: string): Promise<{ user: User; token: string }> {
    const user = db.find('users', (u) => u.employee_id === employee_id && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    if (!user.active) throw new Error('User is inactive');
    return { user, token: 'mock-jwt-token-' + user.id };
}

export async function me(userId: string): Promise<User> {
    const user = db.find('users', (u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
}

// Project Actions
export async function getProjects(): Promise<Project[]> {
    return db.get('projects');
}
export async function getProjectById(id: string): Promise<Project | undefined> {
    return db.find('projects', (p) => p.id === id);
}
export async function getProjectUnits(projectId: string): Promise<Unit[]> {
    return db.get('units').filter(u => u.project_id === projectId);
}
export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const newProject: Project = {
        ...project,
        id: 'p-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    return db.create('projects', newProject);
}
export async function addUnit(unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>, occupantDetails?: any) {
    const newUnit: Unit = {
        ...unit,
        id: 'unit-' + Date.now() + Math.random().toString(36).substr(2, 5),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_occupied: !!occupantDetails,
        current_occupant_id: undefined
    };

    if (occupantDetails) {
        let occupant = db.find('clients', c => c.id_passport === occupantDetails.id_passport);
        if (!occupant) {
            occupant = {
                id: 'c-' + Date.now(),
                name: occupantDetails.name,
                id_passport: occupantDetails.id_passport,
                phone: occupantDetails.phone,
                type: occupantDetails.type,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            db.create('clients', occupant);
        } else {
            db.update('clients', occupant.id, {
                name: occupantDetails.name,
                phone: occupantDetails.phone,
                type: occupantDetails.type,
                updated_at: new Date().toISOString()
            });
        }
        const newAssign = {
            id: 'ca-' + Date.now(),
            client_id: occupant.id,
            unit_id: newUnit.id,
            assigned_by_user_id: occupantDetails.assigned_by_user_id,
            start_date: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.create('clientAssignments', newAssign);
        newUnit.current_occupant_id = occupant.id;
    }
    return db.create('units', newUnit);
}
export async function assignWorker(assignment: any) {
    const newAssignment = {
        ...assignment,
        id: 'wpa-' + Date.now() + Math.random().toString(36).substr(2, 5),
        assigned_at: new Date().toISOString(),
        active: true,
    };
    return db.create('workerAssignments', newAssignment);
}

// Issue Actions
export async function getIssues(): Promise<Issue[]> {
    return db.get('issues');
}
export async function getIssuesByProject(projectId: string): Promise<Issue[]> {
    return db.get('issues').filter(i => i.project_id === projectId);
}
export async function getIssueById(id: string): Promise<Issue | undefined> {
    return db.find('issues', (i) => i.id === id);
}
export async function getActiveIssues(): Promise<Issue[]> {
    return db.get('issues').filter(i =>
        !((i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED)
    );
}
export async function getHistoryIssues(): Promise<Issue[]> {
    return db.get('issues').filter(i =>
        (i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED
    );
}
export async function createIssue(issue: any): Promise<Issue> {
    const newIssue = {
        ...issue,
        id: 'i-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    return db.create('issues', newIssue);
}
export async function updateIssue(id: string, updates: any): Promise<Issue> {
    const updated = db.update('issues', id, { ...updates, updated_at: new Date().toISOString() });
    if (!updated) throw new Error('Issue not found');
    return updated;
}
export async function getAttachments(issueId: string) {
    return db.get('attachments').filter(a => a.issue_id === issueId);
}
export async function addAttachment(attachment: any) {
    const newAtt = {
        ...attachment,
        id: 'att-' + Date.now(),
        created_at: new Date().toISOString()
    };
    return db.create('attachments', newAtt);
}

// User Actions
export async function getUsers(): Promise<User[]> {
    return db.get('users');
}
export async function getWorkers(): Promise<User[]> {
    return db.get('users').filter(u => u.role === UserRole.WORKER);
}
export async function getManagers(): Promise<User[]> {
    return db.get('users').filter(u => u.role === UserRole.MANAGER);
}
export async function getAdmins(): Promise<User[]> {
    return db.get('users').filter(u => u.role === UserRole.ADMIN);
}
export async function createUser(user: any): Promise<User> {
    const newUser = {
        ...user,
        id: 'u-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    return db.create('users', newUser);
}
export async function updateUser(id: string, updates: any) {
    return db.update('users', id, updates) as User;
}
export async function deactivateUser(id: string, reason?: string) {
    const updated = db.update('users', id, {
        active: false,
        inactive_reason: reason || 'Deactivated by admin',
        updated_at: new Date().toISOString()
    });
    if (!updated) throw new Error('User not found');
    return updated as User;
}
export async function reactivateUser(id: string) {
    const updated = db.update('users', id, {
        active: true,
        inactive_reason: undefined,
        updated_at: new Date().toISOString()
    });
    if (!updated) throw new Error('User not found');
    return updated as User;
}

// Unit Actions
export async function updateUnit(id: string, updates: any) {
    const updated = db.update('units', id, { ...updates, updated_at: new Date().toISOString() });
    if (!updated) throw new Error('Unit not found');
    return updated;
}
export async function updateUnitStatus(unitId: string, isOccupied: boolean, occupantDetails?: any) {
    const unit = db.find('units', u => u.id === unitId);
    if (!unit) throw new Error('Unit not found');

    if (!isOccupied) {
        if (unit.is_occupied && unit.current_occupant_id) {
            const activeAssignment = db.find('clientAssignments', a => a.unit_id === unitId && a.is_active);
            if (activeAssignment) {
                db.update('clientAssignments', activeAssignment.id, {
                    is_active: false,
                    end_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }
        const updated = db.update('units', unitId, {
            is_occupied: false,
            current_occupant_id: undefined,
            updated_at: new Date().toISOString()
        });
        return updated!;
    }

    // Occupying logic matches original
    if (isOccupied && !occupantDetails) throw new Error('Occupant details required');

    let occupant = db.find('clients', c => c.id_passport === occupantDetails.id_passport);
    if (!occupant) {
        occupant = {
            id: 'c-' + Date.now(),
            name: occupantDetails.name,
            id_passport: occupantDetails.id_passport,
            phone: occupantDetails.phone,
            type: occupantDetails.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.create('clients', occupant);
    } else {
        db.update('clients', occupant.id, {
            name: occupantDetails.name,
            phone: occupantDetails.phone,
            type: occupantDetails.type,
            updated_at: new Date().toISOString()
        });
    }

    const newAssign = {
        id: 'ca-' + Date.now(),
        client_id: occupant.id,
        unit_id: unitId,
        assigned_by_user_id: occupantDetails.assigned_by_user_id,
        start_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db.create('clientAssignments', newAssign);

    const updated = db.update('units', unitId, {
        is_occupied: true,
        current_occupant_id: occupant.id,
        updated_at: new Date().toISOString()
    });
    return updated!;
}

export async function getUnitHistory(unitId: string) {
    const assignments = db.get('clientAssignments').filter(a => a.unit_id === unitId);
    return assignments.map(a => {
        const occupant = db.find('clients', c => c.id === a.client_id);
        return { ...a, occupant_name: occupant?.name || 'Unknown' };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Occupant Actions
export async function searchOccupants(query: string) {
    const lowerQ = query.toLowerCase();
    return db.get('clients').filter(c =>
        c.id_passport.toLowerCase().includes(lowerQ) ||
        c.name.toLowerCase().includes(lowerQ) ||
        (c.phone && c.phone.includes(query))
    );
}
export async function getAllActiveOccupants() {
    const occupiedUnits = db.get('units').filter(u => u.is_occupied && u.current_occupant_id);
    return occupiedUnits.map(u => {
        const occupant = db.find('clients', c => c.id === u.current_occupant_id!);
        const project = db.find('projects', p => p.id === u.project_id);
        return occupant ? {
            ...occupant,
            unit_no: u.unit_no,
            project_name: project?.name || 'Unknown'
        } : null;
    }).filter(Boolean) as any[];
}

// Log Actions
export async function getLogs(): Promise<SystemLog[]> {
    return db.get('logs');
}
export async function createLog(log: Omit<SystemLog, 'id' | 'created_at'>): Promise<SystemLog> {
    const newLog: SystemLog = {
        ...log,
        id: 'log-' + Date.now(),
        created_at: new Date().toISOString(),
    };
    return db.create('logs', newLog);
}
