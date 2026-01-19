'use server';

import { serverDb as db } from '@/lib/server-db';
import {
    User, UserRole, Issue, IssueStatus, IssuePriority, Project,
    Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    LocationType, ProofType, MediaType, IssueAttachment, SystemLog, OccupantType, IssueDetails,
    IssueStats, IssueAuditLog
} from '@/mock/types';

// Helper to enrich issues with location display
function enrichIssueLocations(issues: Issue[]): Issue[] {
    const units = db.get('units');
    return issues.map(issue => {
        let locationDisplay = 'Unknown Location';
        if (issue.location_type === 'UNIT') {
            const unit = units.find(u => u.id === issue.unit_id);
            locationDisplay = unit ? `Unit ${unit.unit_no}` : `Unit ${issue.unit_id || '?'}`;
        } else {
            locationDisplay = issue.other_area || 'Unknown Common Area';
        }
        return { ...issue, location_display: locationDisplay };
    });
}

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
    return enrichIssueLocations(db.get('issues'));
}
export async function getIssuesByProject(projectId: string): Promise<Issue[]> {
    return enrichIssueLocations(db.get('issues').filter(i => i.project_id === projectId));
}
export async function getIssueById(id: string): Promise<IssueDetails | undefined> {
    const rawIssue = db.find('issues', (i) => i.id === id);
    if (!rawIssue) return undefined;

    // Enrich single issue
    const [enrichedIssue] = enrichIssueLocations([rawIssue]);

    const project = db.find('projects', p => p.id === enrichedIssue.project_id);
    let approvedByName: string | undefined;

    if (enrichedIssue.approved && enrichedIssue.approved_by_user_id) {
        const approver = db.find('users', u => u.id === enrichedIssue.approved_by_user_id);
        approvedByName = approver?.full_name;
    }

    const reporter = db.find('users', u => u.id === enrichedIssue.reported_by_user_id);
    const verifier = enrichedIssue.verified && enrichedIssue.verified_by_user_id
        ? db.find('users', u => u.id === enrichedIssue.verified_by_user_id)
        : undefined;

    return {
        ...enrichedIssue,
        project_name: project?.name || 'Unknown Project',
        approved_by_name: approvedByName,
        reported_by_name: reporter?.full_name,
        verified_by_name: verifier?.full_name
    };
}
export async function getActiveIssues(): Promise<Issue[]> {
    const issues = db.get('issues').filter(i =>
        !((i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED)
    );
    return enrichIssueLocations(issues);
}
export async function getHistoryIssues(): Promise<Issue[]> {
    const issues = db.get('issues').filter(i =>
        (i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED
    );
    return enrichIssueLocations(issues);
}
export async function getIssueStats(): Promise<IssueStats> {
    const issues = db.get('issues');

    // "Active Issues" means all issues that are not resolved/verified and not rejected.
    // Equivalent to getActiveIssues() filter.
    const activeIssuesCount = issues.filter(i =>
        !((i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED)
    ).length;

    // "Total Resolved & Verified"
    const resolvedAndVerifiedCount = issues.filter(i =>
        i.status === IssueStatus.RESOLVED && i.verified
    ).length;

    const openIssues = issues.filter(i => i.status === IssueStatus.OPEN);

    return {
        totalIssues: issues.length,
        activeIssues: activeIssuesCount,
        resolvedAndVerifiedIssues: resolvedAndVerifiedCount,
        openIssues: openIssues.length,
        openByPriority: {
            HIGH: openIssues.filter(i => i.priority === IssuePriority.HIGH).length,
            MEDIUM: openIssues.filter(i => i.priority === IssuePriority.MEDIUM).length,
            LOW: openIssues.filter(i => i.priority === IssuePriority.LOW).length,
        },
        inProgressIssues: issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length,
        awaitingVerificationIssues: issues.filter(i => i.status === IssueStatus.RESOLVED && !i.verified).length,
    };
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
export async function adminOverride(
    id: string,
    adminId: string,
    updates: { status?: IssueStatus; priority?: IssuePriority; comment?: string }
) {
    // 1. Check admin role
    const admin = db.find('users', u => u.id === adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
        throw new Error('Unauthorized: Only admins can perform overrides.');
    }

    const issue = db.find('issues', i => i.id === id);
    if (!issue) throw new Error('Issue not found');

    // 2. Prepare changes and logs
    const changes: Partial<Issue> = {};
    const logDetails: any = {};

    if (updates.status && updates.status !== issue.status) {
        changes.status = updates.status;
        logDetails.from_status = issue.status;
        logDetails.to_status = updates.status;

        // If status changed to OPEN/IN_PROGRESS from RESOLVED/VERIFIED/REJECTED,
        // we might want to unset verification/approval flags?
        // User said: "Preserve Existing Workflow Data... Do NOT delete... If needed mark as superseded".
        // For simplicity and matching req "Admin can set it back", we just change status.
        // We will verify flags loosely in UI or just keep them as history.
        // If moving OUT of verified, we unset the verified *boolean* so it appears active again?
        // Let's unset the 'verified' boolean if status is NOT resolved.
        if (updates.status !== IssueStatus.RESOLVED && issue.verified) {
            changes.verified = false; // Supersede verification
        }
        // Assuming 'approved' remains true if it was approved, or we can reset it?
        // Requirement: "Admin can set it back to OPEN".
        // If OPEN, it implies not approved yet or re-opened?
        // Let's reset flags if going to OPEN.
        if (updates.status === IssueStatus.OPEN) {
            changes.approved = false;
            changes.verified = false;
        }
    }

    if (updates.priority && updates.priority !== issue.priority) {
        changes.priority = updates.priority;
        logDetails.from_priority = issue.priority;
        logDetails.to_priority = updates.priority;
    }

    if (Object.keys(changes).length === 0) return issue; // No changes

    // 3. Update Issue
    const updatedIssue = db.update('issues', id, {
        ...changes,
        updated_at: new Date().toISOString()
    });

    // 4. Create Audit Log
    const auditLog: IssueAuditLog = {
        id: 'log-' + Date.now(),
        issue_id: id,
        action: 'OVERRIDE',
        details: logDetails,
        changed_by_user_id: adminId,
        comment: updates.comment,
        created_at: new Date().toISOString()
    };
    db.create('auditLogs', auditLog);

    return updatedIssue;
}
export async function getIssueAuditLogs(issueId: string) {
    const logs = db.get('auditLogs').filter((l: any) => l.issue_id === issueId);
    // Enrich with user names
    return logs.map((log: any) => {
        const user = db.find('users', u => u.id === log.changed_by_user_id);
        return {
            ...log,
            changed_by_name: user?.full_name || 'Unknown User'
        };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
