import {
    User, UserRole, Project, Unit, Client, WorkerProjectAssignment,
    ClientUnitAssignment, Issue, IssueStatus, IssuePriority,
    LocationType, ProofType, MediaType, IssueAttachment
} from './types';

export const SEED_USERS: User[] = [
    {
        id: 'u1',
        employee_id: 'admin',
        full_name: 'Admin User',
        role: UserRole.ADMIN,
        phone: '1234567890',
        password: 'admin123',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'u2',
        employee_id: 'manager1',
        full_name: 'John Manager',
        role: UserRole.MANAGER,
        phone: '0987654321',
        password: 'manager123',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'u3',
        employee_id: 'guard',
        full_name: 'Mike Worker',
        role: UserRole.WORKER,
        phone: '1122334455',
        password: 'guard123',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'u4',
        employee_id: 'subadmin',
        full_name: 'Building Sub-Admin',
        role: UserRole.SUB_ADMIN,
        phone: '5555555555',
        password: 'subadmin123',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const SEED_PROJECTS: Project[] = [
    {
        id: 'p1',
        name: 'Skyline Towers',
        location: '123 Main St, Metro City',
        created_by_user_id: 'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'p2',
        name: 'Oasis Heights',
        location: '456 Palm Ave, Beach City',
        created_by_user_id: 'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const SEED_WORKER_ASSIGNMENTS: WorkerProjectAssignment[] = [
    {
        id: 'wa1',
        worker_user_id: 'u3',
        project_id: 'p1',
        assigned_by_user_id: 'u2',
        assigned_at: new Date().toISOString(),
        active: true,
    }
];

export const SEED_UNITS: Unit[] = [
    {
        id: 'unit1',
        project_id: 'p1',
        unit_no: '101',
        type: '2BHK',
        is_occupied: true,
        created_by_user_id: 'u2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'unit2',
        project_id: 'p1',
        unit_no: '102',
        type: '3BHK',
        is_occupied: false,
        created_by_user_id: 'u2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const SEED_CLIENTS: Client[] = [
    {
        id: 'c1',
        id_passport: 'A1234567',
        name: 'Alice Johnson',
        phone: '9876543210',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const SEED_CLIENT_ASSIGNMENTS: ClientUnitAssignment[] = [
    {
        id: 'ca1',
        client_id: 'c1',
        unit_id: 'unit1',
        assigned_by_user_id: 'u2',
        start_date: '2025-01-01',
        end_date: '2026-01-01',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const SEED_ISSUES: Issue[] = [
    {
        id: 'i1',
        project_id: 'p1',
        reported_by_user_id: 'u3',
        location_type: LocationType.UNIT,
        unit_id: 'unit1',
        issue_caused_by: 'Tenant Misuse',
        complaint_type: 'Plumbing',
        description_text: 'Leaking faucet in kitchen',
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        approved: false,
        verified: false,
        is_actionable: true,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'i2',
        project_id: 'p1',
        reported_by_user_id: 'u3',
        location_type: LocationType.OTHER,
        other_area: 'Lobby Entrance',
        issue_caused_by: 'Wear and Tear',
        complaint_type: 'Electrical',
        description_text: 'Light flickering',
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        assigned_vendor_name: 'ElectroFix Inc.',
        approved: true,
        approved_by_user_id: 'u2',
        verified: false,
        is_actionable: true,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'i3',
        project_id: 'p1',
        reported_by_user_id: 'u3',
        location_type: LocationType.UNIT,
        unit_id: 'unit2',
        issue_caused_by: 'Unknown',
        complaint_type: 'Cleaning',
        description_text: 'Dusty windows',
        status: IssueStatus.RESOLVED,
        priority: IssuePriority.LOW,
        assigned_vendor_name: 'CleanCo',
        approved: true,
        approved_by_user_id: 'u2',
        verified: false, // Needs verification
        is_actionable: true,
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 43200000).toISOString(),
    }
];

export const SEED_ATTACHMENTS: IssueAttachment[] = [
    {
        id: 'att1',
        issue_id: 'i1',
        url: 'https://placehold.co/600x400/png?text=Leaking+Faucet',
        media_type: MediaType.IMAGE,
        proof_type: ProofType.BEFORE,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    }
];
