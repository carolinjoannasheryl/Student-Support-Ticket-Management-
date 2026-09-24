import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AppStateService } from '../../services/app-state.service';
import { Activity, Priority, Status, TicketDetail, TRANSITIONS, User } from '../../models/ticket.model';
import { fmtDate, isBreached } from '../../utils';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-modal.component.html',
})
export class TicketModalComponent implements OnChanges {
  @Input({ required: true }) ticketId!: number;

  ticket: TicketDetail | null = null;
  allowedStatuses: Status[] = [];
  allowedPriorities: Priority[] = [];
  commentText = '';
  actionError = '';

  fmtDate = fmtDate;
  isBreached = isBreached;

  constructor(private api: ApiService, public appState: AppStateService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ticketId']) this.load();
  }

  get staffAndAdmin(): User[] {
    return this.appState.users().filter(u => u.role !== 'student');
  }

  load() {
    this.api.getTicket(this.ticketId).subscribe(t => {
      this.ticket = t;
      this.allowedStatuses = TRANSITIONS[t.status] ?? [];
      this.allowedPriorities = (['urgent', 'high', 'medium', 'low'] as Priority[]).filter(p => p !== t.priority);
    });
  }

  close() {
    this.appState.closeTicket();
  }

  currentActorId(): number {
    return this.appState.currentUser()?.id ?? 0;
  }

  onStatusChange(status: string) {
    if (!status || !this.ticket) return;
    this.actionError = '';
    this.api.changeStatus(this.ticket.id, status as Status, this.currentActorId()).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError = err?.error?.error || 'Could not change status.',
    });
  }

  onAssignChange(userId: string) {
    if (!userId || !this.ticket) return;
    this.api.reassign(this.ticket.id, Number(userId), this.currentActorId()).subscribe(() => this.load());
  }

  onPriorityChange(priority: string) {
    if (!priority || !this.ticket) return;
    this.api.changePriority(this.ticket.id, priority as Priority, this.currentActorId()).subscribe(() => this.load());
  }

  addComment() {
    if (!this.commentText.trim() || !this.ticket) return;
    this.api.addComment(this.ticket.id, this.currentActorId(), this.commentText.trim()).subscribe(() => {
      this.commentText = '';
      this.load();
    });
  }

  describeActivity(a: Activity): string {
    const meta = a.meta ? JSON.parse(a.meta) : null;
    switch (a.action) {
      case 'created': return 'raised the ticket';
      case 'status_changed': return `changed status${meta ? ` from ${meta.from} to ${meta.to}` : ''}`;
      case 'assigned': return 'updated the assignee';
      case 'priority_changed': return `changed priority${meta ? ` from ${meta.from} to ${meta.to}` : ''} (SLA clock reset)`;
      case 'comment': return `commented: "${a.note}"`;
      default: return a.action;
    }
  }
}
