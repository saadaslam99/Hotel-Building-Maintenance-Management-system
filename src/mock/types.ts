export enum UserRole {
  ADMIN = 'ADMIN',
  SUB_ADMIN = 'SUB_ADMIN',
  MANAGER = 'MANAGER',
  WORKER = 'WORKER',
}

export enum LocationType {
  UNIT = 'UNIT',
  OTHER = 'OTHER',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  RESOLVED = 'RESOLVED',
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ProofType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  VERIFICATION = 'VERIFICATION',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface User {
  id: string;
  employee_id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password?: string; // Included for mock auth
  active: boolean;
  inactive_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  location?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerProjectAssignment {
  id: string;
  worker_user_id: string;
  project_id: string;
  assigned_by_user_id: string;
  assigned_at: string;
  active: boolean;
  ended_at?: string;
}


export interface Client {
  id: string;
  id_passport: string; // Qatar ID or Passport
  name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientUnitAssignment {
  id: string;
  client_id: string;
  unit_id: string;
  assigned_by_user_id: string;
  start_date: string;
  end_date?: string;
  is_active: boolean; // redundancy for quick query
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  project_id: string;
  unit_no: string;
  type?: string;
  is_occupied: boolean;
  current_occupant_id?: string; // Link to Client
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface IssueAttachment {
  id: string;
  issue_id: string;
  url: string;
  media_type: MediaType;
  proof_type: ProofType;
  created_at: string;
}

export interface IssueStatusHistory {
  id: string;
  issue_id: string;
  from_status: IssueStatus;
  to_status: IssueStatus;
  changed_by_user_id: string;
  note?: string;
  changed_at: string;
}

export interface Issue {
  id: string;
  project_id: string;
  reported_by_user_id: string;
  location_type: LocationType;
  unit_id?: string;
  other_area?: string;
  issue_caused_by: string;
  other_issue_cause_description?: string; // New field for "Other" cause

  complaint_type: string;
  description_text?: string;
  voice_url?: string;

  status: IssueStatus;
  priority?: IssuePriority;

  assigned_vendor_name?: string;

  approved: boolean;
  approved_by_user_id?: string;
  approved_at?: string; // ISO string
  approval_note?: string;

  verified: boolean;
  verified_by_user_id?: string;
  verified_at?: string; // ISO string
  verification_comment?: string;
  rejection_reason?: string;

  // Computed/Enriched
  location_display?: string;

  is_actionable: boolean; // Computed helper or stored? "verified=false" AND "status=RESOLVED" implies actionable for manager? Request says "TOTAL_ACTIONABLE" stats.

  created_at: string;
  updated_at: string;
}

export interface IssueDetails extends Issue {
  project_name: string;
  approved_by_name?: string;
  reported_by_name?: string;
  verified_by_name?: string;
}

export interface IssueStats {
  totalIssues: number;
  activeIssues: number;
  resolvedAndVerifiedIssues: number;
  openIssues: number;
  openByPriority: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  inProgressIssues: number;
  awaitingVerificationIssues: number;
}

export interface SystemLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by_user_id: string;
  details?: string;
  created_at: string;
}
export interface IssueAuditLog {
  id: string;
  issue_id: string;
  action: 'OVERRIDE' | 'STATUS_CHANGE' | 'PRIORITY_CHANGE';
  details: {
    from_status?: string;
    to_status?: string;
    from_priority?: string;
    to_priority?: string;
  };
  changed_by_user_id: string;
  changed_by_name?: string; // Enriched
  comment?: string;
  created_at: string;
}
