import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AppStateService } from '../../services/app-state.service';
import { User } from '../../models/ticket.model';

@Component({
  selector: 'app-new-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-ticket.component.html',
})
export class NewTicketComponent {
  subject = '';
  description = '';
  category = 'fees';
  priority = 'medium';
  raisedBy: number | null = null;
  assignedTo: number | '' = '';

  message = '';
  isError = false;

  constructor(private api: ApiService, public appState: AppStateService) {
    const cu = this.appState.currentUser();
    this.raisedBy = cu ? cu.id : null;
  }

  get staffAndAdmin(): User[] {
    return this.appState.users().filter(u => u.role !== 'student');
  }

  get allUsers(): User[] {
    return this.appState.users();
  }

  submit() {
    this.message = '';
    if (!this.subject.trim()) {
      this.isError = true;
      this.message = 'Subject is required.';
      return;
    }
    if (!this.raisedBy) {
      this.isError = true;
      this.message = 'Please select who is raising this ticket.';
      return;
    }
    this.api.createTicket({
      subject: this.subject.trim(),
      description: this.description.trim(),
      category: this.category,
      priority: this.priority,
      raised_by: this.raisedBy,
      assigned_to: this.assignedTo ? Number(this.assignedTo) : null,
    }).subscribe({
      next: (t) => {
        this.isError = false;
        this.message = `Ticket ${t.ticket_no} created.`;
        this.subject = '';
        this.description = '';
        this.appState.view.set('tickets');
      },
      error: (err) => {
        this.isError = true;
        this.message = err?.error?.error || 'Something went wrong creating the ticket.';
      },
    });
  }
}
