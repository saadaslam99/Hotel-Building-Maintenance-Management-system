import { db } from './db';
import {
    User, UserRole, Issue, IssueStatus, IssuePriority, Project,
    Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    LocationType, ProofType, MediaType, IssueAttachment, SystemLog, OccupantType
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
        create: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
            const newProject: Project = {
                ...project,
                id: 'p-' + Date.now(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            return delay(db.create('projects', newProject));
        },
        addUnit: async (
            unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>,
            occupantDetails?: {
                name: string;
                id_passport: string;
                phone: string;
                type: OccupantType;
                assigned_by_user_id: string
            }
        ) => {
            await delay(null);

            // 1. Create Unit
            const newUnit: Unit = {
                ...unit,
                id: 'unit-' + Date.now() + Math.random().toString(36).substr(2, 5),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_occupied: !!occupantDetails, // Ensure status matches details
                current_occupant_id: undefined // Will update if occupied
            };

            // 2. Handle Occupancy if provided
            if (occupantDetails) {
                // Find or Create Occupant
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
                    // Update existing
                    db.update('clients', occupant.id, {
                        name: occupantDetails.name,
                        phone: occupantDetails.phone,
                        type: occupantDetails.type,
                        updated_at: new Date().toISOString()
                    });
                }

                // Create Assignment
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

                // Link Occupant to Unit
                newUnit.current_occupant_id = occupant.id;
            }

            return db.create('units', newUnit);
        },
        assignWorker: async (assignment: Omit<WorkerProjectAssignment, 'id' | 'assigned_at' | 'active'>) => {
            const newAssignment: WorkerProjectAssignment = {
                ...assignment,
                id: 'wpa-' + Date.now() + Math.random().toString(36).substr(2, 5),
                assigned_at: new Date().toISOString(),
                active: true,
            };
            return delay(db.create('workerAssignments', newAssignment));
        }
    },

    issues: {
        getAll: async (): Promise<Issue[]> => delay(db.get('issues')),
        getByProject: async (projectId: string): Promise<Issue[]> => delay(db.get('issues').filter(i => i.project_id === projectId)),
        getById: async (id: string): Promise<Issue | undefined> => delay(db.find('issues', (i) => i.id === id)),
        // Get active issues (excluding resolved+verified and rejected)
        getActive: async (): Promise<Issue[]> => {
            const issues = db.get('issues');
            return delay(issues.filter(i =>
                !((i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED)
            ));
        },
        // Get history issues (resolved+verified and rejected)
        getHistory: async (): Promise<Issue[]> => {
            const issues = db.get('issues');
            return delay(issues.filter(i =>
                (i.status === IssueStatus.RESOLVED && i.verified) || i.status === IssueStatus.REJECTED
            ));
        },
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
        getAdmins: async (): Promise<User[]> => delay(db.get('users').filter(u => u.role === UserRole.ADMIN)),
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
        // Deactivate user instead of deleting (FROZEN STATE compliance)
        deactivate: async (id: string, reason?: string): Promise<User> => {
            await delay(null);
            const updated = db.update('users', id, {
                active: false,
                inactive_reason: reason || 'Deactivated by admin',
                updated_at: new Date().toISOString()
            });
            if (!updated) throw new Error('User not found');
            return updated as User;
        },
        // Reactivate user
        reactivate: async (id: string): Promise<User> => {
            await delay(null);
            const updated = db.update('users', id, {
                active: true,
                inactive_reason: undefined,
                updated_at: new Date().toISOString()
            });
            if (!updated) throw new Error('User not found');
            return updated as User;
        },
    },

    units: {
        update: async (id: string, updates: Partial<Unit>): Promise<Unit> => {
            await delay(null);
            const updated = db.update('units', id, { ...updates, updated_at: new Date().toISOString() });
            if (!updated) throw new Error('Unit not found');
            return updated;
        },
        updateStatus: async (
            unitId: string,
            isOccupied: boolean,
            occupantDetails?: {
                name: string;
                id_passport: string;
                phone: string;
                type: OccupantType;
                assigned_by_user_id: string
            }
        ): Promise<Unit> => {
            await delay(null);
            const unit = db.find('units', u => u.id === unitId);
            if (!unit) throw new Error('Unit not found');

            // Handle Vacating
            if (!isOccupied) {
                if (unit.is_occupied && unit.current_occupant_id) {
                    // Close active assignment
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

            // Handle Occupying
            if (isOccupied && !occupantDetails) throw new Error('Occupant details required');

            // 1. Find or Create Occupant
            let occupant = db.find('clients', c => c.id_passport === occupantDetails!.id_passport);
            if (!occupant) {
                occupant = {
                    id: 'c-' + Date.now(),
                    name: occupantDetails!.name,
                    id_passport: occupantDetails!.id_passport,
                    phone: occupantDetails!.phone,
                    type: occupantDetails!.type,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                db.create('clients', occupant);
            } else {
                // Update existing if details changed
                db.update('clients', occupant.id, {
                    name: occupantDetails!.name,
                    phone: occupantDetails!.phone,
                    type: occupantDetails!.type, // Allow type update
                    updated_at: new Date().toISOString()
                });
            }

            // 2. Create Assignment History
            const newAssign = {
                id: 'ca-' + Date.now(),
                client_id: occupant.id,
                unit_id: unitId,
                assigned_by_user_id: occupantDetails!.assigned_by_user_id,
                start_date: new Date().toISOString(),
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            db.create('clientAssignments', newAssign);

            // 3. Update Unit
            const updated = db.update('units', unitId, {
                is_occupied: true,
                current_occupant_id: occupant.id,
                updated_at: new Date().toISOString()
            });

            return updated!;
        },
        getHistory: async (unitId: string): Promise<(ClientUnitAssignment & { occupant_name: string })[]> => {
            await delay(null);
            const assignments = db.get('clientAssignments').filter(a => a.unit_id === unitId);
            // Enrich with occupant name
            return assignments.map(a => {
                const occupant = db.find('clients', c => c.id === a.client_id);
                return { ...a, occupant_name: occupant?.name || 'Unknown' };
            }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    },

    occupants: {
        search: async (query: string): Promise<Client[]> => {
            await delay(null);
            const lowerQ = query.toLowerCase();
            return db.get('clients').filter(c =>
                c.id_passport.toLowerCase().includes(lowerQ) ||
                c.name.toLowerCase().includes(lowerQ) ||
                (c.phone && c.phone.includes(query))
            );
        },
        getAllActive: async (): Promise<(Client & { unit_no: string, project_name: string })[]> => {
            await delay(null);
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
    },

    logs: {
        getAll: async (): Promise<SystemLog[]> => delay(db.get('logs')),
        create: async (log: Omit<SystemLog, 'id' | 'created_at'>): Promise<SystemLog> => {
            const newLog: SystemLog = {
                ...log,
                id: 'log-' + Date.now(),
                created_at: new Date().toISOString(),
            };
            await delay(null);
            return db.create('logs', newLog);
        }
    }
};
