import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Stats, Ticket, TicketDetail, User, Status, Priority } from '../models/ticket.model';
import { DEFAULT_USERS, AppStateService } from './app-state.service';

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string;
  raised_by?: string;
  q?: string;
  breached?: string;
}

export interface NewTicketPayload {
  subject: string;
  description: string;
  category: string;
  priority: string;
  raised_by: number;
  assigned_to: number | null;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 101,
    ticket_no: 'TCK-2026-0101',
    subject: 'Transcript Certificate Request Delayed',
    description: 'Submitted application for official transcript 2 weeks ago, no update yet.',
    category: 'certificates',
    priority: 'high',
    status: 'in_progress',
    raised_by: 2,
    raised_by_name: 'Priya Sharma (Student)',
    assigned_to: 4,
    assigned_to_name: 'Sarah Jenkins (Academics)',
    department: 'Academic Affairs',
    sla_hours: 24,
    sla_due_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 102,
    ticket_no: 'TCK-2026-0102',
    subject: 'Fee Receipt Duplicate Copy Request',
    description: 'Need duplicate fee receipt for semester 4 for education loan verification.',
    category: 'fees',
    priority: 'medium',
    status: 'open',
    raised_by: 2,
    raised_by_name: 'Priya Sharma (Student)',
    assigned_to: 3,
    assigned_to_name: 'David Miller (Finance Staff)',
    department: 'Finance',
    sla_hours: 48,
    sla_due_at: new Date(Date.now() + 3600000 * 30).toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 103,
    ticket_no: 'TCK-2026-0103',
    subject: 'Smart ID Card RFID Not Working at Library Gate',
    description: 'Turnstile gate does not recognize student ID card RFID chip.',
    category: 'id_card',
    priority: 'urgent',
    status: 'open',
    raised_by: 2,
    raised_by_name: 'Priya Sharma (Student)',
    assigned_to: null,
    assigned_to_name: 'Unassigned',
    department: 'IT Support',
    sla_hours: 6,
    sla_due_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const MOCK_STATS: Stats = {
  total: 3,
  open: 2,
  breached: 2,
  unassigned: 1,
  avgAgeHours: 24,
  byStatus: { open: 2, in_progress: 1 },
  byPriority: { urgent: 1, high: 1, medium: 1 },
  byCategory: { certificates: 1, fees: 1, id_card: 1 }
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/api';

  constructor(private http: HttpClient, private appState: AppStateService) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`).pipe(
      catchError(err => {
        console.warn('Backend unavailable for getUsers, using mock fallback data:', err.message);
        this.appState.useFallback();
        return of(DEFAULT_USERS);
      })
    );
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/stats`).pipe(
      catchError(err => {
        console.warn('Backend unavailable for getStats, using mock stats:', err.message);
        return of(MOCK_STATS);
      })
    );
  }

  getTickets(filters: TicketFilters = {}): Observable<Ticket[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<Ticket[]>(`${this.base}/tickets`, { params }).pipe(
      catchError(err => {
        console.warn('Backend unavailable for getTickets, returning mock tickets:', err.message);
        let list = [...MOCK_TICKETS];
        if (filters.breached === '1') {
          list = list.filter(t => new Date(t.sla_due_at) < new Date() && t.status !== 'closed' && t.status !== 'resolved');
        }
        if (filters.q) {
          const q = filters.q.toLowerCase();
          list = list.filter(t => t.subject.toLowerCase().includes(q) || t.ticket_no.toLowerCase().includes(q));
        }
        if (filters.status) {
          list = list.filter(t => t.status === filters.status);
        }
        if (filters.priority) {
          list = list.filter(t => t.priority === filters.priority);
        }
        if (filters.category) {
          list = list.filter(t => t.category === filters.category);
        }
        return of(list);
      })
    );
  }

  getTicket(id: number): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.base}/tickets/${id}`).pipe(
      catchError(() => {
        const found = MOCK_TICKETS.find(t => t.id === Number(id)) ?? MOCK_TICKETS[0];
        const detail: TicketDetail = {
          ...found,
          activity: [
            {
              id: 1,
              ticket_id: found.id,
              actor_id: found.raised_by,
              actor_name: found.raised_by_name,
              action: 'created' as const,
              note: 'Ticket raised via Campus Portal',
              meta: null,
              created_at: found.created_at
            }
          ]
        };
        return of(detail);
      })
    );
  }


  createTicket(payload: NewTicketPayload): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets`, payload).pipe(
      catchError(() => {
        const newTicket: Ticket = {
          id: Date.now(),
          ticket_no: `TCK-${Date.now().toString().slice(-4)}`,
          subject: payload.subject,
          description: payload.description,
          category: payload.category as any,
          priority: payload.priority as any,
          status: 'open',
          raised_by: payload.raised_by,
          raised_by_name: 'Priya Sharma (Student)',
          assigned_to: payload.assigned_to,
          department: 'IT Support',
          sla_hours: 48,
          sla_due_at: new Date(Date.now() + 48 * 3600000).toISOString(),
          resolved_at: null,
          closed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        MOCK_TICKETS.unshift(newTicket);
        return of(newTicket);
      })
    );
  }

  changeStatus(id: number, status: Status, actor_id: number, note?: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets/${id}/status`, { status, actor_id, note }).pipe(
      catchError(() => {
        const found = MOCK_TICKETS.find(t => t.id === Number(id)) ?? MOCK_TICKETS[0];
        found.status = status;
        return of(found);
      })
    );
  }

  reassign(id: number, assigned_to: number, actor_id: number): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets/${id}/assign`, { assigned_to, actor_id }).pipe(
      catchError(() => {
        const found = MOCK_TICKETS.find(t => t.id === Number(id)) ?? MOCK_TICKETS[0];
        found.assigned_to = assigned_to;
        return of(found);
      })
    );
  }

  changePriority(id: number, priority: Priority, actor_id: number): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets/${id}/priority`, { priority, actor_id }).pipe(
      catchError(() => {
        const found = MOCK_TICKETS.find(t => t.id === Number(id)) ?? MOCK_TICKETS[0];
        found.priority = priority;
        return of(found);
      })
    );
  }

  addComment(id: number, actor_id: number, note: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets/${id}/comment`, { actor_id, note }).pipe(
      catchError(() => {
        const found = MOCK_TICKETS.find(t => t.id === Number(id)) ?? MOCK_TICKETS[0];
        return of(found);
      })
    );
  }
}

