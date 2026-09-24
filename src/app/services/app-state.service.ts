import { Injectable, signal } from '@angular/core';
import { User } from '../models/ticket.model';

export type ViewName = 'dashboard' | 'tickets' | 'new';

export const DEFAULT_USERS: User[] = [
  { id: 1, name: 'Alex Admin (Director)', email: 'admin@campus.edu', role: 'admin', department: 'IT Management' },
  { id: 2, name: 'Priya Sharma (Student)', email: 'priya.s@student.edu', role: 'student', department: null },
  { id: 3, name: 'David Miller (Finance Staff)', email: 'david.m@staff.edu', role: 'staff', department: 'Finance' },
  { id: 4, name: 'Sarah Jenkins (Academics)', email: 'sarah.j@staff.edu', role: 'staff', department: 'Academic Affairs' }
];

@Injectable({ providedIn: 'root' })
export class AppStateService {
  users = signal<User[]>(DEFAULT_USERS);
  currentUser = signal<User | null>(DEFAULT_USERS[0]);
  view = signal<ViewName>('dashboard');
  openTicketId = signal<number | null>(null);
  isBackendOffline = signal<boolean>(false);

  setUsers(users: User[]) {
    if (users && users.length > 0) {
      this.users.set(users);
      const admin = users.find(u => u.role === 'admin') ?? users[0] ?? null;
      this.currentUser.set(admin);
      this.isBackendOffline.set(false);
    } else {
      this.useFallback();
    }
  }

  useFallback() {
    this.users.set(DEFAULT_USERS);
    if (!this.currentUser()) {
      this.currentUser.set(DEFAULT_USERS[0]);
    }
    this.isBackendOffline.set(true);
  }

  setCurrentUserById(id: number) {
    const u = this.users().find(x => x.id === id) ?? null;
    this.currentUser.set(u);
  }

  openTicket(id: number) { this.openTicketId.set(id); }
  closeTicket() { this.openTicketId.set(null); }
}

