export type Role = 'student' | 'staff' | 'admin';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Category = 'fees' | 'attendance' | 'id_card' | 'documents' | 'certificates' | 'other';
export type Status =
  | 'open' | 'in_progress' | 'pending_student' | 'pending_department'
  | 'resolved' | 'closed' | 'reopened';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string | null;
}

export interface Ticket {
  id: number;
  ticket_no: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  raised_by: number;
  raised_by_name?: string;
  assigned_to: number | null;
  assigned_to_name?: string;
  department: string;
  sla_hours: number;
  sla_due_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  ticket_id: number;
  actor_id: number | null;
  actor_name?: string;
  action: 'created' | 'status_changed' | 'assigned' | 'priority_changed' | 'comment';
  note: string | null;
  meta: string | null;
  created_at: string;
}

export interface TicketDetail extends Ticket {
  activity: Activity[];
}

export interface Stats {
  total: number;
  open: number;
  breached: number;
  unassigned: number;
  avgAgeHours: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

// Valid forward transitions per status — mirrors the backend's TRANSITIONS map
// so the UI only ever offers moves the API will actually accept.
export const TRANSITIONS: Record<Status, Status[]> = {
  open: ['in_progress', 'pending_student', 'pending_department', 'closed'],
  in_progress: ['pending_student', 'pending_department', 'resolved', 'closed'],
  pending_student: ['in_progress', 'closed'],
  pending_department: ['in_progress', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress', 'pending_student', 'pending_department', 'closed'],
};

export const SLA_HOURS: Record<Priority, number> = { urgent: 6, high: 24, medium: 48, low: 96 };
