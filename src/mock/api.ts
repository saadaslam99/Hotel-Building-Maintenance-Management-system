import * as actions from './actions';
import {
    User, UserRole, Issue, IssueStatus, IssuePriority, Project,
    Unit, Client, WorkerProjectAssignment, ClientUnitAssignment,
    LocationType, ProofType, MediaType, IssueAttachment, SystemLog, OccupantType
} from './types';

// Client-side API wrapper that calls Server Actions
// This ensures 'api.auth.login' works in Client Components
export const api = {
    auth: {
        login: actions.login,
        me: actions.me,
    },
    projects: {
        getAll: actions.getProjects,
        getById: actions.getProjectById,
        getUnits: actions.getProjectUnits,
        create: actions.createProject,
        addUnit: actions.addUnit,
        assignWorker: actions.assignWorker,
    },
    issues: {
        getAll: actions.getIssues,
        getByProject: actions.getIssuesByProject,
        getById: actions.getIssueById,
        getActive: actions.getActiveIssues,
        getHistory: actions.getHistoryIssues,
        create: actions.createIssue,
        update: actions.updateIssue,
        getAttachments: actions.getAttachments,
        addAttachment: actions.addAttachment,
    },
    users: {
        getAll: actions.getUsers,
        getWorkers: actions.getWorkers,
        getManagers: actions.getManagers,
        getAdmins: actions.getAdmins,
        create: actions.createUser,
        update: actions.updateUser,
        deactivate: actions.deactivateUser,
        reactivate: actions.reactivateUser,
    },
    units: {
        update: actions.updateUnit,
        updateStatus: actions.updateUnitStatus,
        getHistory: actions.getUnitHistory,
    },
    occupants: {
        search: actions.searchOccupants,
        getAllActive: actions.getAllActiveOccupants,
    },
    logs: {
        getAll: actions.getLogs,
        create: actions.createLog,
    }
};
