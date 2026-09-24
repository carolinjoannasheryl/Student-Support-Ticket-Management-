import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, TicketFilters } from '../../services/api.service';
import { AppStateService } from '../../services/app-state.service';
import { Ticket, User } from '../../models/ticket.model';
import { TicketTableComponent } from '../ticket-table/ticket-table.component';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketTableComponent],
  templateUrl: './ticket-list.component.html',
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  loading = true;

  q = '';
  status = '';
  priority = '';
  category = '';
  assignedTo = '';

  statuses = ['open', 'in_progress', 'pending_student', 'pending_department', 'resolved', 'closed', 'reopened'];
  priorities = ['urgent', 'high', 'medium', 'low'];
  categories = ['fees', 'attendance', 'id_card', 'documents', 'certificates', 'other'];

  private filterChange$ = new Subject<void>();

  constructor(private api: ApiService, public appState: AppStateService) {}

  get staffAndAdmin(): User[] {
    return this.appState.users().filter(u => u.role !== 'student');
  }

  ngOnInit() {
    this.filterChange$.pipe(debounceTime(200)).subscribe(() => this.refresh());
    this.refresh();
  }

  onFilterChange() {
    this.filterChange$.next();
  }

  refresh() {
    this.loading = true;
    const filters: TicketFilters = {
      q: this.q || undefined,
      status: this.status || undefined,
      priority: this.priority || undefined,
      category: this.category || undefined,
      assigned_to: this.assignedTo || undefined,
    };
    this.api.getTickets(filters).subscribe(tickets => {
      this.tickets = tickets;
      this.loading = false;
    });
  }

  openTicket(id: number) {
    this.appState.openTicket(id);
  }
}
